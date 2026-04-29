# 06. Validation & DTO

> **Tóm tắt:** Mọi input đi qua DTO Zod (`nestjs-zod`). 1 file = 1 DTO. Tách input DTO và response DTO. Schema chứa cả message lỗi rõ nghĩa. ZodValidationPipe đã đăng ký global → DTO tự động được parse.
> **Liên quan:** [02-naming-conventions](./02-naming-conventions.md#dto-schema) · [05-api-design](./05-api-design.md) · [07-error-handling-and-logging](./07-error-handling-and-logging.md)

## Mục lục

- [Vì sao Zod, không phải class-validator](#vì-sao-zod-không-phải-class-validator)
- [Cấu trúc 1 DTO](#cấu-trúc-1-dto)
- [Input DTO — request body / query / param](#input-dto)
- [Response DTO](#response-dto)
- [Refine, transform, default](#refine-transform-default)
- [Schema dùng chung](#schema-dùng-chung)
- [`@Param` cần ParseUUIDPipe?](#param-cần-parseuuidpipe)

## Vì sao Zod, không phải class-validator

Đã quyết định ở giai đoạn setup. Tóm tắt:

- 1 nguồn type runtime + compile (`z.infer`) → không drift.
- `class-validator` đã ngừng phát triển ~2 năm.
- Tích hợp Swagger qua `createZodDto` không kém class-validator.

→ **Cấm** import `class-validator`/`class-transformer` vào dự án.

## Cấu trúc 1 DTO

**Rule:** 1 file = 1 schema + 1 DTO class.

```ts
// register.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email().describe('User email address'),
    password: z.string().min(8).max(128).describe('Password (min 8 chars, max 128)'),
    name: z.string().min(1).max(100).optional().describe('Display name'),
  })
  .strict();

export class RegisterDto extends createZodDto(registerSchema) {}
```

**Lưu ý:**

- `.strict()` để **reject** các field thừa (chống mass assignment) — bật mặc định cho mọi input DTO.
- `.describe(...)` để Swagger có description cho từng field.
- Export cả `schema` lẫn `DTO`. Service / test có thể dùng `z.infer<typeof registerSchema>` khi cần.

## Input DTO

**Rule:** Tách theo loại input:

| Vị trí input | Naming                   | Decorator     |
| ------------ | ------------------------ | ------------- |
| Body         | `<action>.dto.ts`        | `@Body() dto` |
| Query        | `<action>.query.dto.ts`  | `@Query() q`  |
| Param        | `<action>.params.dto.ts` | `@Param() p`  |

**Khi nào tách param thành DTO?** Khi có ≥ 2 path param hoặc cần validate phức tạp. 1 param đơn giản (`:id` UUID) — dùng `ParseUUIDPipe` đủ.

**Good (body):**

```ts
@Post('register')
register(@Body() dto: RegisterDto): Promise<AuthResult> {
  return this.authService.register(dto);
}
```

## Response DTO

**Rule:** Type response đặt **cạnh service** (vì là output của business), không trộn với input DTO.

- Nếu response trùng entity Prisma → dùng kiểu Prisma (`User`) thẳng — đủ.
- Nếu response **khác** entity (ẩn field, thêm field tính toán) → tạo **interface** `XxxResult` ở service (như `AuthResult`, `AuthTokens` đang có).
- Khi cần Swagger document shape phức tạp → tạo `xxx-response.dto.ts` với Zod + `createZodDto`.

**Good (đã có ở `auth.service.ts`):**

```ts
export interface AuthResult {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}
```

**Tuyệt đối không** trả về object Prisma có chứa `passwordHash` ra HTTP. Map sang DTO/interface trước.

## Refine, transform, default

**Rule:** Validation phụ thuộc nhiều field → `.refine()` / `.superRefine()`. Coerce/normalize input → `.transform()`. Giá trị mặc định → `.default()`.

```ts
// confirmPassword === password
const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(8),
    newPassword: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Confirm password does not match',
    path: ['confirmPassword'],
  });

// Coerce int + min 1
z.coerce.number().int().positive().default(1);
```

## Schema dùng chung

**Rule:** Schema cho **resource id**, **email**, **password**, **timestamp** dùng chung → đặt ở `common/dto/shared.schema.ts` (tạo khi có nhu cầu — chưa cần ngay).

```ts
// common/dto/shared.schema.ts (ví dụ tương lai)
export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email().toLowerCase().trim();
export const passwordSchema = z.string().min(8).max(128);
```

→ DTO khác import lại: `email: emailSchema`.

## @Param cần ParseUUIDPipe?

**Rule:** Khi route param là UUID (mọi `id` của dự án — Prisma tạo UUID), dùng `ParseUUIDPipe` để **chặn 400** trước khi xuống service:

```ts
@Get(':id')
findOne(@Param('id', ParseUUIDPipe) id: string) {
  return this.usersService.findOne(id);
}
```

**Why:** Tránh query Prisma với chuỗi rác → giảm log error vô nghĩa, response 400 sớm.

---

→ Tiếp theo: [07. Error handling & logging](./07-error-handling-and-logging.md)
