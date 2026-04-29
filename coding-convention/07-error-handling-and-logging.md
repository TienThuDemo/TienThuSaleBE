# 07. Error Handling & Logging

> **Tóm tắt:** Service throw `HttpException` con cụ thể; `AllExceptionsFilter` chuẩn hoá envelope; log chỉ bằng `Logger` của Nest, không `console.log`. Mọi 5xx tự động log đầy đủ stack.
> **Liên quan:** [04-nestjs-patterns](./04-nestjs-patterns.md) · [05-api-design](./05-api-design.md#response-envelope)

## Mục lục

- [Throw exception đúng kiểu](#throw-exception-đúng-kiểu)
- [Không try/catch để swallow lỗi](#không-trycatch-để-swallow-lỗi)
- [Error envelope](#error-envelope)
- [Logger của Nest, không `console.log`](#logger-của-nest-không-consolelog)
- [Log level](#log-level)
- [Log gì, không log gì](#log-gì-không-log-gì)

## Throw exception đúng kiểu

**Rule:** Throw subclass của `HttpException` cụ thể, không throw chuỗi/Error trần.

| Tình huống                                | Class                          | Status |
| ----------------------------------------- | ------------------------------ | ------ |
| Resource không tồn tại                    | `NotFoundException`            | 404    |
| Vi phạm unique / state conflict           | `ConflictException`            | 409    |
| Sai credential, token                     | `UnauthorizedException`        | 401    |
| Có token nhưng thiếu quyền                | `ForbiddenException`           | 403    |
| Input không hợp lệ (rare — Zod đã handle) | `BadRequestException`          | 400    |
| Logic không xử lý được (rare)             | `UnprocessableEntityException` | 422    |
| Không phân loại được                      | `InternalServerErrorException` | 500    |

**Good** (`auth.service.ts`):

```ts
if (existing) throw new ConflictException('Email already registered');
if (!user) throw new UnauthorizedException('Invalid credentials');
```

**Bad:**

```ts
throw new Error('Email already exists'); // → 500, mất ngữ nghĩa
throw 'Invalid credentials'; // throw chuỗi, ESLint cảnh báo
```

## Không try/catch để swallow lỗi

**Rule:** Không bao try/catch quanh service call **chỉ để** che lỗi. Để lỗi bubble lên `AllExceptionsFilter`.

**Khi nào try/catch hợp lệ?**

1. Cần **chuyển dạng lỗi** sang `HttpException` rõ nghĩa hơn (ví dụ Prisma `P2002` → `ConflictException`).
2. Cần **fallback** logic (ví dụ cache miss → fetch DB).
3. Cần **release resource** trong `finally`.

**Good:**

```ts
try {
  await this.prisma.user.create({ data });
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
    throw new ConflictException('Email already exists');
  }
  throw e;
}
```

## Error envelope

`AllExceptionsFilter` đã chuẩn hoá:

```jsonc
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR" | "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "TOO_MANY_REQUESTS" | "INTERNAL_SERVER_ERROR",
    "message": "Human-readable",
    "details": "..." // optional, raw payload từ exception
  },
  "meta": { "timestamp": "...", "path": "/api/v1/users" }
}
```

**Rule:** `error.code` là **machine-readable**, không đổi tuỳ tiện (frontend depend vào). `message` là **human-readable**, có thể i18n sau. Khi thêm code mới → bổ sung map ở `codeFromStatus()` trong filter.

## Logger của Nest, không `console.log`

**Rule:** Mọi log dùng `Logger` của `@nestjs/common`. ESLint chặn `console.log` (chỉ cho `console.warn`, `console.error`).

**Good** (`prisma.service.ts`):

```ts
private readonly logger = new Logger(PrismaService.name);

async onModuleInit(): Promise<void> {
  await this.$connect();
  this.logger.log('Prisma connected to database');
}
```

**Why:**

- Logger có context (`[PrismaService]`), level, có thể replace bằng pino/winston sau.
- `console.log` không format, không level → log production lộn xộn.

## Log level

| Method             | Khi nào                                                         |
| ------------------ | --------------------------------------------------------------- |
| `logger.log()`     | Sự kiện bình thường (request, startup, shutdown)                |
| `logger.warn()`    | Bất thường nhưng app vẫn chạy (rate limit hit, config fallback) |
| `logger.error()`   | Lỗi 5xx, exception chưa handle, infra fail                      |
| `logger.debug()`   | Chi tiết để debug, **chỉ on khi dev** (không bật production)    |
| `logger.verbose()` | Trace level — gần như không dùng                                |

## Log gì, không log gì

**Phải log:**

- Request method + path + duration (đã có ở `LoggingInterceptor`).
- Lỗi 5xx kèm stack (đã có ở `AllExceptionsFilter`).
- Kết nối DB (đã có ở `PrismaService`).
- Sự kiện bảo mật bất thường (login fail nhiều, token hết hạn).

**Không bao giờ log:**

- Password (cleartext / hash).
- JWT, refresh token, secret.
- PII đầy đủ (số CMND, sđt, địa chỉ) — masked nếu cần.
- Body request có chứa `password` / `token`.

**Rule:** Khi log object, dùng spread/whitelist:

```ts
// Bad
this.logger.log(`User: ${JSON.stringify(user)}`); // có thể leak passwordHash

// Good
this.logger.log(`User created: id=${user.id} email=${user.email}`);
```

**Tương lai (chưa cần ngay):** thêm `requestId` (correlation id) qua middleware → mọi log của 1 request có cùng id → dễ trace.

---

→ Tiếp theo: [08. Database & Prisma](./08-database-prisma.md)
