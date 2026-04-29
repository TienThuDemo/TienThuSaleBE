# 05. API Design

> **Tóm tắt:** RESTful resource, URI versioning `/api/v{N}/...`, response envelope chuẩn, mọi endpoint phải có Swagger decorator. Status code đúng nghĩa.
> **Liên quan:** [02-naming-conventions](./02-naming-conventions.md#route-path--api) · [06-validation-and-dto](./06-validation-and-dto.md) · [07-error-handling-and-logging](./07-error-handling-and-logging.md)

## Mục lục

- [Versioning](#versioning)
- [Resource & URL](#resource--url)
- [HTTP method & status code](#http-method--status-code)
- [Response envelope](#response-envelope)
- [Pagination](#pagination)
- [Swagger — bắt buộc](#swagger--bắt-buộc)
- [Idempotency & Throttling](#idempotency--throttling)

## Versioning

**Rule:** Toàn bộ API đặt sau prefix **`/api/v{N}`** với `N` là số nguyên (`1, 2, 3, …`).

- `API_PREFIX` = `api` (đã ở `env.schema.ts`).
- Versioning bật ở `main.ts` qua `app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })`.
- Mỗi controller khai báo version bằng object form: `@Controller({ path: 'users', version: '1' })`.

**Khi nào lên version mới?**

- **Breaking change** với client: đổi response shape, đổi field bắt buộc, đổi semantic.
- Thay đổi không phá vỡ (thêm field optional, thêm endpoint) → **không** cần version mới.

**Cách thêm v2:** tạo controller mới `users.v2.controller.ts` với `version: '2'`, **không sửa** controller v1. Hai version chạy song song cho đến khi v1 deprecate (announce trước ≥ 1 sprint).

```ts
// v1 — giữ nguyên
@Controller({ path: 'users', version: '1' })
export class UsersController { ... }

// v2 — file riêng
@Controller({ path: 'users', version: '2' })
export class UsersV2Controller { ... }
```

## Resource & URL

**Rule:**

- URL = **danh từ số nhiều, kebab-case**: `/users`, `/audit-logs`.
- Action thay vì CRUD chuẩn → dùng **sub-resource** hoặc verb sau id:
  - `POST /orders/:id/cancel`
  - `POST /users/:id/reset-password`
- Không nhúng action vào path level 1: `/cancelOrder`, `/resetUserPassword` — **sai**.

| Use case          | URL                          |
| ----------------- | ---------------------------- |
| List              | `GET /users`                 |
| Detail            | `GET /users/:id`             |
| Create            | `POST /users`                |
| Replace           | `PUT /users/:id`             |
| Partial update    | `PATCH /users/:id`           |
| Delete            | `DELETE /users/:id`          |
| Sub-resource list | `GET /users/:id/sessions`    |
| Action            | `POST /users/:id/deactivate` |

## HTTP method & status code

| Status                      | Khi nào                                                              |
| --------------------------- | -------------------------------------------------------------------- |
| `200 OK`                    | GET / PATCH / DELETE thành công (DELETE có body)                     |
| `201 Created`               | POST tạo resource mới (đã set ở `register`)                          |
| `204 No Content`            | DELETE thành công không trả body                                     |
| `400 Bad Request`           | Input không hợp lệ (Zod validation đã tự trả 400)                    |
| `401 Unauthorized`          | Thiếu/sai token                                                      |
| `403 Forbidden`             | Có token nhưng không đủ quyền                                        |
| `404 Not Found`             | Resource không tồn tại                                               |
| `409 Conflict`              | Vi phạm unique (email đã tồn tại — dùng `ConflictException`)         |
| `422 Unprocessable Entity`  | Body parse được nhưng business invalid (hiếm dùng — ưu tiên 400/409) |
| `429 Too Many Requests`     | Throttler chặn                                                       |
| `500 Internal Server Error` | Lỗi không xác định (log đầy đủ)                                      |

**Rule:** Set rõ `@HttpCode(HttpStatus.X)` khi không phải mặc định của method (POST mặc định 201, các method khác 200).

## Response envelope

**Rule:** Mọi response **2xx** đều đi qua `TransformInterceptor` → có shape:

```jsonc
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "2026-04-29T08:00:00.000Z" }
}
```

Mọi response **4xx/5xx** đi qua `AllExceptionsFilter` → có shape:

```jsonc
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [ ... ]
  },
  "meta": { "timestamp": "...", "path": "/api/v1/users" }
}
```

→ Service chỉ cần `return data` — interceptor sẽ wrap. **Không** tự build envelope trong service/controller.

## Pagination

**Rule (cho mọi endpoint trả list):** Query params chuẩn:

| Param      | Default | Mô tả                                   |
| ---------- | ------- | --------------------------------------- |
| `page`     | `1`     | Trang hiện tại (bắt đầu từ 1)           |
| `pageSize` | `20`    | Số item / trang, max `100`              |
| `sort`     | —       | `field` hoặc `-field` (descending), CSV |

Response `data` cho list:

```jsonc
{
  "items": [ ... ],
  "page": 1,
  "pageSize": 20,
  "total": 137
}
```

Validation pagination dùng Zod schema chung (sẽ tạo trong `common/dto/pagination.dto.ts` khi cần — chưa cần cho dự án giai đoạn này).

## Swagger — bắt buộc

**Rule:** Mọi controller có:

- `@ApiTags('<TenFeature>')` ở class.
- `@ApiOperation({ summary: '...' })` ở mỗi method.
- `@ApiBearerAuth()` ở class hoặc method nếu route yêu cầu auth.
- Response DTO: `@ApiOkResponse({ type: XxxResponseDto })` khi cần document shape (DTO nestjs-zod tự gen schema).

**Good** (`users.controller.ts`):

```ts
@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  @Get()
  @ApiOperation({ summary: 'List all users' })
  findAll(): Promise<User[]> { ... }
}
```

Swagger UI bật theo env `SWAGGER_ENABLED` tại `/${SWAGGER_PATH}` (mặc định `/docs`).

## Idempotency & Throttling

**Rule:**

- `GET`, `PUT`, `DELETE` phải **idempotent** (gọi N lần kết quả như 1 lần).
- `POST` không idempotent — endpoint nhạy cảm (register, login, payment) phải có **throttle riêng** qua `@Throttle({...})` decorator để chặn brute force.

**Good** (`auth.controller.ts`):

```ts
@Throttle({ default: { ttl: 60_000, limit: 5 } })  // 5 req / phút / IP
@Post('register')
register(...) { ... }
```

Default throttler global đã set qua env `THROTTLE_TTL` / `THROTTLE_LIMIT`.

---

→ Tiếp theo: [06. Validation & DTO](./06-validation-and-dto.md)
