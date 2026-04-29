# 10. Configuration

> **Tóm tắt:** Mọi biến môi trường khai báo trong `env.schema.ts` (Zod). Đọc qua `AppConfigService.get(...)`. **Cấm** `process.env.X` trực tiếp ngoài `config/`.
> **Liên quan:** [04-nestjs-patterns](./04-nestjs-patterns.md#async-config--registerasync) · [09-security-and-auth](./09-security-and-auth.md#bảo-vệ-secret)

## Mục lục

- [Vì sao bắt buộc qua schema](#vì-sao-bắt-buộc-qua-schema)
- [Quy trình thêm 1 biến mới](#quy-trình-thêm-1-biến-mới)
- [Đọc config — type-safe](#đọc-config--type-safe)
- [Default value & required](#default-value--required)
- [`.env`, `.env.example`](#env-envexample)
- [Khi nào dùng `process.env` được phép](#khi-nào-dùng-processenv-được-phép)

## Vì sao bắt buộc qua schema

- **Fail-fast**: app không khởi động nếu thiếu env hoặc giá trị sai — phát hiện ngay khi deploy.
- **Type-safe**: `AppConfigService.get('PORT')` trả `number`, không phải `string | undefined`.
- **Tài liệu sống**: schema là 1 nguồn duy nhất kê khai tất cả env app dùng.

## Quy trình thêm 1 biến mới

1. **Thêm vào `src/config/env.schema.ts`** với type + (nếu có) default + validation:

   ```ts
   REDIS_URL: z.string().url(),
   CACHE_TTL: z.coerce.number().int().positive().default(60),
   ```

2. **Thêm vào `.env.example`** với giá trị placeholder để team mới biết cần set:

   ```
   REDIS_URL=redis://localhost:6379
   CACHE_TTL=60
   ```

3. **Đọc qua `AppConfigService`**:

   ```ts
   const ttl = this.config.get('CACHE_TTL'); // typed: number
   ```

4. (Nếu là secret) **không** điền giá trị thật vào `.env.example` — chỉ placeholder.

## Đọc config — type-safe

**Rule:** Inject `AppConfigService`, gọi `get(key)`. Key được autocomplete từ `Env` type.

**Good** (`auth.service.ts`):

```ts
constructor(private readonly config: AppConfigService) {}

const rounds = this.config.get('BCRYPT_SALT_ROUNDS'); // number
```

**Helper sẵn:**

- `config.isProduction` (`NODE_ENV === 'production'`)
- `config.isDevelopment`

→ Khi cần thêm helper boolean (`isStaging`, `isTest`…), thêm getter ở `AppConfigService`, không scatter `=== '...'` khắp nơi.

## Default value & required

**Quy ước:**

- Có default → dùng `.default(...)` trong schema (PORT, API_PREFIX, throttler…).
- Bắt buộc, không default (secret, DATABASE_URL): dùng `.min(1)` hoặc `.url()` để fail nếu thiếu.
- Optional thực sự: `.optional()`.

```ts
JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),  // bắt buộc
JWT_REFRESH_SECRET: z.string().min(32).optional(),                        // optional
PORT: z.coerce.number().int().positive().default(8181),                   // có default
```

**Lỗi validation hiển thị đầy đủ:** `validateEnv()` đã format từng issue → app fail-start với message rõ nghĩa, không cần guess.

## `.env`, `.env.example`

| File           | Commit?     | Dùng cho                                  |
| -------------- | ----------- | ----------------------------------------- |
| `.env`         | ❌ Không    | Local dev — chứa secret thật của dev      |
| `.env.example` | ✅ Có       | Template — mọi key có giá trị placeholder |
| `.env.test`    | (nếu có) ✅ | Test e2e — không chứa secret production   |

**Rule:** Khi sửa `.env.schema.ts` → **bắt buộc** sửa `.env.example` cùng PR. CI có thể thêm check sau (so sánh key của 2 file).

## Khi nào dùng `process.env` được phép

**Chỉ 2 chỗ:**

1. **`src/config/env.schema.ts`** — chính nó.
2. **Bootstrap script trước khi DI sẵn sàng** — hiện tại không có, hãy giữ vậy.

Mọi nơi khác dùng `process.env.X` → reviewer **reject PR**.

---

→ Tiếp theo: [11. Git & Tooling](./11-git-and-tooling.md)
