# 09. Security & Auth

> **Tóm tắt:** App **secure-by-default**: `JwtAuthGuard` global, route public phải gắn `@Public()`. Helmet + Throttler bật toàn cục. Password hash bcrypt rounds ≥ 10. Secret chỉ qua env, không log/commit.
> **Liên quan:** [04-nestjs-patterns](./04-nestjs-patterns.md) · [10-configuration](./10-configuration.md)

## Mục lục

- [Auth model](#auth-model)
- [`@Public()` cho route mở](#public-cho-route-mở)
- [Lấy user hiện tại — `@CurrentUser()`](#lấy-user-hiện-tại--currentuser)
- [Password — bcrypt](#password--bcrypt)
- [JWT — payload & secret](#jwt--payload--secret)
- [Throttler](#throttler)
- [Helmet & CORS](#helmet--cors)
- [Bảo vệ secret](#bảo-vệ-secret)

## Auth model

- Token: **JWT** (`@nestjs/jwt`).
- Refresh token: cùng cơ chế, secret riêng (`JWT_REFRESH_SECRET`), TTL dài hơn.
- Guard global: `JwtAuthGuard` đăng ký ở `AuthModule` qua `APP_GUARD` → mọi route mặc định **yêu cầu auth**.
- Route mở: phải gắn `@Public()`.

→ Pattern này **không đổi**. Nếu cần guard mới (RBAC/permission), thêm thay vì thay thế.

## `@Public()` cho route mở

**Rule:** Endpoint không yêu cầu token (login, register, health) **bắt buộc** gắn `@Public()` — quên = sẽ trả 401 ngay.

**Good** (`auth.controller.ts`):

```ts
@Public()
@Post('login')
login(@Body() dto: LoginDto): Promise<AuthResult> { ... }
```

`Health` endpoint cũng cần `@Public()` để load balancer probe được.

## Lấy user hiện tại — `@CurrentUser()`

**Rule:** Lấy user qua decorator `@CurrentUser()` — **không** đụng `request.user` trực tiếp.

**Good** (`auth.controller.ts`):

```ts
@Get('me')
me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
  return user;
}
```

`JwtAuthGuard` đã set `request.user = { id, email }` sau khi verify token thành công.

## Password — bcrypt

**Rule:**

- Hash bằng `bcrypt`, **rounds ≥ 10** (đã ép qua Zod schema `BCRYPT_SALT_ROUNDS` min 4 max 15, default 10).
- **Không** lưu plaintext, **không** log password ở bất kỳ log level nào.
- So sánh dùng `bcrypt.compare()` (constant-time).

**Good** (`auth.service.ts`):

```ts
const passwordHash = await bcrypt.hash(dto.password, this.config.get('BCRYPT_SALT_ROUNDS'));
// ...
const matches = await bcrypt.compare(dto.password, user.passwordHash);
```

**Field trong DB:** đặt tên `passwordHash` (không phải `password`) → tự nhắc reviewer rằng đây không phải plaintext.

## JWT — payload & secret

**Payload chuẩn của dự án:**

```ts
export interface JwtPayload {
  sub: string; // user id (chuẩn JWT)
  email: string;
}
```

**Rule:**

- `sub` chứa **user id** (chuẩn RFC 7519). Không dùng `userId`/`id`.
- Không nhồi PII (số CMND, sđt) vào payload — JWT decode được, không phải mã hoá.
- Không nhồi role/permission tĩnh vào payload nếu permission có thể thay đổi nhanh (ví dụ admin revoke). Permission luôn re-check từ DB.

**Secret:**

- `JWT_SECRET` ≥ 32 ký tự (đã ép qua Zod).
- `JWT_REFRESH_SECRET` riêng (optional, fallback về `JWT_SECRET` nếu không set).
- TTL: `JWT_EXPIRES_IN` mặc định `15m`, refresh `7d` — giữ nguyên trừ khi có yêu cầu rõ.

## Throttler

**Rule:**

- Global throttler đã đăng ký qua `AppModule` với env `THROTTLE_TTL` / `THROTTLE_LIMIT`.
- Endpoint **nhạy cảm** (login, register, password reset) phải override bằng `@Throttle({...})` chặt hơn:

```ts
@Throttle({ default: { ttl: 60_000, limit: 5 } })
@Post('register')
```

- Endpoint trong dashboard nội bộ có thể `@SkipThrottle()` nếu cần.

## Helmet & CORS

**Rule:** Helmet bật mặc định ở `main.ts`. CSP tắt ở dev để Swagger UI load được, **bật ở production**.

**CORS:**

- `CORS_ORIGINS` mặc định `*` (dev). **Production phải set whitelist** comma-separated:

  ```
  CORS_ORIGINS=https://app.tienthu.com,https://admin.tienthu.com
  ```

- Không bao giờ commit `*` cho production.

## Bảo vệ secret

**Rule cứng:**

1. **Không commit** `.env` (chỉ commit `.env.example`).
2. **Không log** giá trị bất kỳ env nào có chứa `SECRET`, `KEY`, `PASSWORD`, `TOKEN`.
3. **Không hardcode** secret vào source — luôn qua `AppConfigService.get('...')`.
4. Khi rotate secret production: update tất cả replica + invalidate JWT đang phát hành (nếu cần).
5. Pre-commit hook (lint-staged) không scan secret — rely vào reviewer + CI secret-scan ở tương lai.

---

→ Tiếp theo: [10. Configuration](./10-configuration.md)
