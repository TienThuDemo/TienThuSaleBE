# 03. TypeScript Style

> **Tóm tắt:** ESLint v9 type-checked + `tsconfig` strict đã enforce phần lớn. File này nói rõ **cách viết** trong khuôn khổ đó: cấm `any`, ưu tiên `unknown`, `readonly` mặc định cho DTO, prefer `type` cho union — `interface` cho contract.
> **Liên quan:** [02-naming-conventions](./02-naming-conventions.md) · [06-validation-and-dto](./06-validation-and-dto.md)

## Mục lục

- [Những rule đã được tooling enforce](#những-rule-đã-được-tooling-enforce)
- [Cấm `any` — dùng `unknown`](#cấm-any--dùng-unknown)
- [`readonly` mặc định](#readonly-mặc-định)
- [Strict null — không `!` non-null assertion](#strict-null--không--non-null-assertion)
- [Type narrowing thay cho cast](#type-narrowing-thay-cho-cast)
- [Async/await — không quên `await`](#asyncawait--không-quên-await)
- [Import](#import)
- [Khai báo return type](#khai-báo-return-type)

## Những rule đã được tooling enforce

Đọc chính file để biết, ở đây chỉ tóm tắt:

| Tooling             | Setting đã bật                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tsconfig.json`     | `strictNullChecks`, `noImplicitAny`, `strictBindCallApply`, `noFallthroughCasesInSwitch`, ES2023, NodeNext                                                                            |
| `eslint.config.mjs` | `recommendedTypeChecked` + custom: `no-explicit-any: error`, `no-unused-vars: error`, `no-floating-promises: warn`, `no-console: warn (allow warn/error)`, `prettier/prettier: error` |

→ **Mọi rule dưới đây được kiểm bằng CI:** `npm run lint:check`, `npm run type-check`. PR fail 2 cmd này không merge.

## Cấm `any` — dùng `unknown`

**Rule:** Không dùng `any`. Khi **thực sự** không biết kiểu (input từ ngoài), dùng `unknown` rồi narrow.

**Why:** `any` tắt toàn bộ type-check; `unknown` ép phải narrow trước khi dùng → an toàn hơn.

**Bad:**

```ts
function handle(payload: any) {
  return payload.user.id; // không gì kiểm tra
}
```

**Good:**

```ts
function handle(payload: unknown) {
  if (typeof payload === 'object' && payload !== null && 'user' in payload) {
    // ...narrow tiếp
  }
}
```

Trong dự án, đã thấy ví dụ tốt ở `all-exceptions.filter.ts`:

```ts
catch(exception: unknown, host: ArgumentsHost): void { ... }
```

## `readonly` mặc định

**Rule:** Property của DTO, value object, payload **mặc định `readonly`**. Method không được mutate field public.

**Why:** Phòng accidental mutation; rõ ràng về ý định "object này là dữ liệu, không phải state".

**Good:**

```ts
export interface JwtPayload {
  readonly sub: string;
  readonly email: string;
}

class Logger {
  private readonly prefix: string;
  // ...
}
```

## Strict null — không `!` non-null assertion

**Rule:** **Không** dùng `value!` (postfix `!`) trừ khi có comment giải thích vì sao chắc chắn non-null.

**Why:** `!` là lừa compiler, không có guarantee runtime → bug ẩn.

**Bad:**

```ts
const user = await this.prisma.user.findUnique(...);
return user!.email;
```

**Good:**

```ts
const user = await this.prisma.user.findUnique(...);
if (!user) throw new NotFoundException('User not found');
return user.email;
```

Ngoại lệ duy nhất được chấp nhận: test code khi setup mock đã đảm bảo non-null.

## Type narrowing thay cho cast

**Rule:** Hạn chế `as` cast. Ưu tiên `instanceof`, `typeof`, `'key' in obj`, type guard function.

**Bad:**

```ts
const err = exception as Error;
console.error(err.message);
```

**Good:**

```ts
if (exception instanceof Error) {
  this.logger.error(exception.message, exception.stack);
}
```

Cast được chấp nhận khi:

- Convert kiểu của thư viện 3rd-party không khai báo đủ chuẩn (ví dụ `as StringValue` trong dự án — kiểu của lib `ms`).
- Cast về `unknown` rồi cast lần 2: `value as unknown as T` (cuối cùng và đã review kỹ).

## Async/await — không quên `await`

**Rule:** Mọi promise phải `await` hoặc `void` rõ ràng. ESLint `no-floating-promises` đã bật ở mức `warn` — coi như **error nếu CI fail-on-warn**.

**Good:**

```ts
async run(): Promise<void> {
  await this.prisma.$connect();
}

// Top-level fire-and-forget
void bootstrap();
```

**Bad:**

```ts
this.prisma.$connect(); // floating promise
```

## Import

**Rule:**

- Dùng **named import** (NodeNext + ESM-style). Không default-import trừ khi lib bắt buộc.
- `import type { ... }` khi chỉ cần kiểu (giúp tree-shake + tránh circular).
- Thứ tự import (Prettier không tự sort, nhưng giữ kỷ luật):
  1. Node core / 3rd-party: `@nestjs/*`, `zod`, `bcrypt`, …
  2. Internal absolute (chưa có alias trong dự án này) / relative `../../`.
  3. Relative cùng thư mục `./...`.

**Good:**

```ts
import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './types/jwt-payload';
```

## Khai báo return type

**Rule:** Public method (controller, service, exported function) **bắt buộc** khai báo return type. Function internal có thể inferred.

**Why:** Khi đổi implementation, type-checker bắt được nếu phá contract; reviewer đọc signature là biết trả gì.

**Good:**

```ts
@Injectable()
export class AuthService {
  async login(dto: LoginDto): Promise<AuthResult> { ... }

  private async signTokens(user: User): Promise<AuthTokens> { ... }
}
```

**Bad:**

```ts
async login(dto: LoginDto) { ... } // Promise<unknown>? Promise<any>?
```

---

→ Tiếp theo: [04. NestJS patterns](./04-nestjs-patterns.md)
