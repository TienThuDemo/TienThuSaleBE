# 02. Naming Conventions

> **Tóm tắt:** File luôn `kebab-case.ts` + suffix vai trò. Identifier theo TypeScript chuẩn (`PascalCase` class, `camelCase` biến, `UPPER_SNAKE` const). Domain folder số ít, utility folder số nhiều.
> **Liên quan:** [01-project-structure](./01-project-structure.md) · [05-api-design](./05-api-design.md) · [06-validation-and-dto](./06-validation-and-dto.md)

## Mục lục

- [File](#file)
- [Folder](#folder)
- [Class, function, biến](#class-function-biến)
- [Hằng số & enum](#hằng-số--enum)
- [DTO, schema](#dto-schema)
- [Type vs Interface](#type-vs-interface)
- [Route path & API](#route-path--api)
- [Database (Prisma)](#database-prisma)
- [Test](#test)
- [Bảng tra nhanh](#bảng-tra-nhanh)

## File

**Rule:** `kebab-case` + suffix vai trò + `.ts`.

| Vai trò        | Suffix            | Ví dụ                       |
| -------------- | ----------------- | --------------------------- |
| Module         | `.module.ts`      | `auth.module.ts`            |
| Controller     | `.controller.ts`  | `users.controller.ts`       |
| Service        | `.service.ts`     | `auth.service.ts`           |
| DTO            | `.dto.ts`         | `register.dto.ts`           |
| Guard          | `.guard.ts`       | `jwt-auth.guard.ts`         |
| Interceptor    | `.interceptor.ts` | `logging.interceptor.ts`    |
| Pipe           | `.pipe.ts`        | `parse-int.pipe.ts`         |
| Filter         | `.filter.ts`      | `all-exceptions.filter.ts`  |
| Decorator      | `.decorator.ts`   | `current-user.decorator.ts` |
| Repository     | `.repository.ts`  | `user.repository.ts`        |
| Strategy       | `.strategy.ts`    | `jwt.strategy.ts`           |
| Unit test      | `.spec.ts`        | `auth.service.spec.ts`      |
| E2E test       | `.e2e-spec.ts`    | `auth.e2e-spec.ts`          |
| Type/Interface | (theo nội dung)   | `jwt-payload.ts`            |

**Bad:**

```
RegisterDto.ts        // PascalCase file
authService.ts        // không có suffix
auth-service.ts       // sai dấu phân tách suffix
```

## Folder

**Rule:**

- **Domain** (đại diện 1 thực thể nghiệp vụ): **số ít** — `auth/`, `user/`, `payee/`, `transaction/`.
- **Utility** (chứa nhiều thứ cùng loại): **số nhiều** — `dto/`, `guards/`, `decorators/`, `interceptors/`, `filters/`, `pipes/`, `types/`, `utils/`.
- Ngoại lệ: `users/` đã tồn tại trong dự án (số nhiều) — chấp nhận giữ vì đây là module HTTP "danh sách user", không phải entity. Khi tạo module mới, **ưu tiên số ít**.

## Class, function, biến

| Loại                | Convention                  | Ví dụ                                        |
| ------------------- | --------------------------- | -------------------------------------------- |
| Class / Decorator   | `PascalCase`                | `AuthService`, `JwtAuthGuard`, `CurrentUser` |
| Method / function   | `camelCase`                 | `findAll()`, `signTokens()`                  |
| Biến / property     | `camelCase`                 | `passwordHash`, `accessToken`                |
| Boolean (read-only) | `is/has/can…`               | `isPublic`, `hasPermission`, `canActivate`   |
| Private field       | `camelCase`                 | `private readonly logger`                    |
| Generic type param  | 1 ký tự hoa hoặc PascalCase | `T`, `TPayload`, `TResult`                   |

## Hằng số & enum

**Rule:** Const **giá trị tĩnh, được export** dùng `UPPER_SNAKE_CASE`. Const local thường dùng `camelCase`.

```ts
// Good
export const IS_PUBLIC_KEY = 'isPublic';
export const DEFAULT_PAGE_SIZE = 20;

// Local trong function
const startedAt = Date.now();
```

**Enum:** ưu tiên `as const` object thay cho `enum` của TS (nhẹ hơn, không tạo runtime object dư).

```ts
// Good
export const UserRole = {
  Admin: 'admin',
  Member: 'member',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
```

## DTO, schema

**Rule:** 1 file = 1 DTO. Đặt tên file theo **action + entity**: `<action>-<entity>.dto.ts`.

| File                 | Class           | Schema             |
| -------------------- | --------------- | ------------------ |
| `register.dto.ts`    | `RegisterDto`   | `registerSchema`   |
| `login.dto.ts`       | `LoginDto`      | `loginSchema`      |
| `update-user.dto.ts` | `UpdateUserDto` | `updateUserSchema` |

**Tách input/output:** DTO trả về từ controller cũng đặt riêng — `user-response.dto.ts` chứa `UserResponseDto`. Xem [06-validation-and-dto](./06-validation-and-dto.md).

## Type vs Interface

**Rule:**

- `interface` cho **contract của object/class** (có thể implement, có thể extend).
- `type` cho **union, intersection, alias, generic utility, mapped type**.

```ts
// Good — contract
export interface JwtPayload {
  sub: string;
  email: string;
}

// Good — union/alias
export type AuthResult = { user: AuthenticatedUser; tokens: AuthTokens };
export type Status = 'pending' | 'active' | 'closed';
```

## Route path & API

**Rule:**

- Path **kebab-case, số nhiều**: `/users`, `/audit-logs`, `/payment-methods`.
- Resource id luôn là param: `/users/:id`, không nhúng vào path khác như `/user-by-email/:email` (dùng query param `?email=`).
- Versioning bằng prefix URI `/api/v{N}/...` (xem [05-api-design](./05-api-design.md#versioning)).

```ts
// Good
@Controller({ path: 'users', version: '1' })

// Bad
@Controller('user')             // số ít
@Controller('listUsers')        // không phải resource
```

## Database (Prisma)

**Rule:** Xem chi tiết ở [08-database-prisma](./08-database-prisma.md). Tóm tắt:

- Model: **`PascalCase` số ít** — `User`, `AuditLog`.
- Field TS: `camelCase` — `passwordHash`, `createdAt`.
- Bảng SQL: **`snake_case` số nhiều** — `@@map("users")`, `@map("password_hash")`.

## Test

- Unit: `<file-gốc>.spec.ts` đặt **cạnh file gốc**.
- E2E: ở `test/`, tên `<feature>.e2e-spec.ts`.
- `describe` mô tả đối tượng (`AuthService`), `it` bắt đầu bằng `should`:

```ts
describe('AuthService', () => {
  it('should hash password before saving', () => { ... });
});
```

## Bảng tra nhanh

| Đối tượng      | Convention                                      |
| -------------- | ----------------------------------------------- |
| File           | `kebab-case.<role>.ts`                          |
| Folder domain  | số ít, kebab-case                               |
| Folder utility | số nhiều, kebab-case                            |
| Class          | `PascalCase`                                    |
| Method/biến    | `camelCase`                                     |
| Hằng export    | `UPPER_SNAKE_CASE`                              |
| Boolean        | `is/has/can` prefix                             |
| Route          | kebab-case, số nhiều                            |
| DB model       | `PascalCase` số ít, table `snake_case` số nhiều |
| Test           | `*.spec.ts` (unit), `*.e2e-spec.ts` (e2e)       |

---

→ Tiếp theo: [03. TypeScript style](./03-typescript-style.md)
