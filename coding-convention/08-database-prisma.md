# 08. Database & Prisma

> **Tóm tắt:** Schema model `PascalCase` số ít, table `snake_case` số nhiều, field TS `camelCase` ↔ column `snake_case`. Truy cập DB chỉ qua `PrismaService`. Migration phải có **tên có nghĩa**, commit cùng PR feature.
> **Liên quan:** [01-project-structure](./01-project-structure.md) · [10-configuration](./10-configuration.md)

## Mục lục

- [Naming trong schema.prisma](#naming-trong-schemaprisma)
- [PrismaService — singleton](#prismaservice--singleton)
- [Query — best practice](#query--best-practice)
- [Transaction](#transaction)
- [Migration](#migration)
- [Repository pattern — khi nào](#repository-pattern--khi-nào)

## Naming trong schema.prisma

**Rule:**

| Element     | Code (TS)                    | Database (SQL)                  | Cách map                |
| ----------- | ---------------------------- | ------------------------------- | ----------------------- |
| Model       | `PascalCase` số ít (`User`)  | `snake_case` số nhiều (`users`) | `@@map("users")`        |
| Field       | `camelCase` (`passwordHash`) | `snake_case` (`password_hash`)  | `@map("password_hash")` |
| Foreign key | `<entity>Id` (`userId`)      | `<entity>_id` (`user_id`)       | `@map`                  |
| Enum        | `PascalCase`                 | giữ nguyên                      | `@@map` nếu cần         |

**Good** (đã có trong `prisma/schema.prisma`):

```prisma
model User {
  id           String   @id @default(uuid()) @db.Uuid
  email        String   @unique
  name         String?
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

**ID:**

- **Mặc định UUID** (`@default(uuid()) @db.Uuid`). Không dùng autoincrement int trừ khi có lý do nghiệp vụ rõ ràng.
- Foreign key đặt index: `@@index([userId])`.

**Timestamp:**

- Mọi model có nghĩa nghiệp vụ: bắt buộc `createdAt` + `updatedAt`.
- Dùng `@default(now())` cho `createdAt`, `@updatedAt` cho `updatedAt`.

**Soft delete (khi cần):** thêm `deletedAt DateTime?` thay vì xoá vật lý. Kèm guard ở service để filter mặc định.

## PrismaService — singleton

**Rule:** Mọi truy cập DB **bắt buộc** qua `PrismaService` được inject. Không `new PrismaClient()` ở bất kỳ đâu khác.

**Why:**

- Một connection pool duy nhất cho toàn app.
- Lifecycle (connect/disconnect) gắn vào Nest.
- Logging tập trung.

**Good** (đã có ở `auth.service.ts`):

```ts
constructor(private readonly prisma: PrismaService) {}

async findUser(email: string) {
  return this.prisma.user.findUnique({ where: { email } });
}
```

## Query — best practice

**Rule:**

1. **Chọn field bằng `select`** khi không cần toàn bộ entity (giảm payload, tránh leak).
2. **`take` + `skip`** mọi query list (chống unbounded fetch).
3. **`include`** chỉ relation cần thiết — quá tham lam → N+1 ngầm.
4. **Không** dùng `findMany()` không filter trên bảng có thể lớn.
5. Câu raw SQL (`$queryRaw`) **chỉ khi** Prisma không biểu diễn được; phải kèm comment giải thích.

**Good — chỉ lấy field cần khi trả ra HTTP:**

```ts
const user = await this.prisma.user.findUnique({
  where: { id },
  select: { id: true, email: true, name: true, createdAt: true },
});
```

**Bad:**

```ts
const user = await this.prisma.user.findUnique({ where: { id } });
return user; // có thể trả luôn passwordHash → lộ
```

## Transaction

**Rule:** Khi 2+ thao tác DB phải atomic → dùng `$transaction`. Pattern array cho thao tác đơn giản, callback cho logic có condition.

**Good — array:**

```ts
await this.prisma.$transaction([
  this.prisma.account.update({ where: { id: from }, data: { balance: { decrement: amount } } }),
  this.prisma.account.update({ where: { id: to }, data: { balance: { increment: amount } } }),
  this.prisma.transferLog.create({ data: { from, to, amount } }),
]);
```

**Good — callback (có condition):**

```ts
await this.prisma.$transaction(async (tx) => {
  const acc = await tx.account.findUnique({ where: { id } });
  if (!acc || acc.balance < amount) throw new ConflictException('Insufficient balance');
  await tx.account.update({ where: { id }, data: { balance: { decrement: amount } } });
});
```

**Lưu ý:** Trong callback dùng `tx` (không phải `this.prisma`).

## Migration

**Rule:**

- Tên migration **có nghĩa**, dùng dạng động từ + đối tượng: `add_user_email_index`, `rename_balance_to_amount`.
- **Không** sửa migration đã commit. Sai → tạo migration mới đè.
- Migration commit cùng PR feature, không tách PR riêng.
- Production deploy bằng `prisma migrate deploy`, không `migrate dev`.

```bash
# Dev
npm run prisma:migrate:dev   # → tạo migration, apply lên dev DB

# Production
npm run prisma:migrate:deploy
```

## Repository pattern — khi nào

**Rule hiện tại:** **Không** bắt buộc. Service inject `PrismaService` thẳng (như `AuthService`, `UsersService` đang làm).

**Khi nào tạo Repository?**

- Logic query phức tạp (raw SQL, nhiều join, custom mapper).
- Cần share query giữa nhiều service.
- Cần mock dễ hơn cho test (Prisma mock đã đủ tốt với `jest-mock-extended`, nên thường không cần).

Khi tạo, đặt ở `modules/<feature>/repositories/<entity>.repository.ts`, inject `PrismaService` bên trong, expose method nghiệp vụ (không leak `Prisma.UserWhereInput` ra ngoài).

---

→ Tiếp theo: [09. Security & Auth](./09-security-and-auth.md)
