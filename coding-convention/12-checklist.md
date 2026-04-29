# 12. Pre-PR Checklist

> **Tóm tắt:** 1 trang. Tick hết trước khi mở PR. Tab này có thể paste thẳng vào PR template.
> **Liên quan:** [11-git-and-tooling](./11-git-and-tooling.md)

## Code

- [ ] Feature mới đặt ở `src/modules/<feature>/` (xem [01](./01-project-structure.md)).
- [ ] File / class / route đặt tên đúng convention (xem [02](./02-naming-conventions.md)).
- [ ] Không có `any`, không `value!`, không `process.env.X` ngoài `src/config/` (xem [03](./03-typescript-style.md), [10](./10-configuration.md)).
- [ ] Public method có khai báo return type explicit.
- [ ] Controller mỏng — không có if/else business, không try/catch swallow lỗi (xem [04](./04-nestjs-patterns.md), [07](./07-error-handling-and-logging.md)).
- [ ] Không tạo `index.ts` barrel.

## API

- [ ] Endpoint nằm dưới `/api/v{N}/...` (xem [05](./05-api-design.md#versioning)).
- [ ] Status code đúng nghĩa (`@HttpCode` set khi không phải mặc định).
- [ ] Param UUID dùng `ParseUUIDPipe`.
- [ ] Endpoint nhạy cảm có `@Throttle({...})` chặt hơn default.
- [ ] Endpoint mở (login/register/health) có `@Public()`.

## DTO & validation

- [ ] Mọi input có DTO Zod, schema có `.strict()` để chống mass assignment (xem [06](./06-validation-and-dto.md)).
- [ ] Response không leak field nhạy cảm (`passwordHash`, secret, token).
- [ ] Schema field có `.describe(...)` cho Swagger.

## Swagger

- [ ] Controller có `@ApiTags`, mỗi route có `@ApiOperation`.
- [ ] Route auth có `@ApiBearerAuth()`.

## Database (nếu sửa schema)

- [ ] `schema.prisma` đặt tên đúng convention (xem [08](./08-database-prisma.md)).
- [ ] Migration có **tên có nghĩa**.
- [ ] Đã chạy `prisma:generate` để Prisma client đồng bộ.
- [ ] Truy cập DB chỉ qua `PrismaService`.

## Security & config

- [ ] Không hardcode secret. Env mới có trong `env.schema.ts` + `.env.example` (xem [10](./10-configuration.md)).
- [ ] Không log password / token / secret.
- [ ] Không commit `.env`.

## Tooling

- [ ] `npm run lint:check` xanh.
- [ ] `npm run format:check` xanh.
- [ ] `npm run type-check` xanh.
- [ ] `npm run test` xanh (nếu code có test).
- [ ] Commit message theo Conventional Commits (xem [11](./11-git-and-tooling.md)).
- [ ] Branch theo prefix `feature/`, `fix/`, `chore/`, …

## Self-review

- [ ] Đã đọc lại diff trên GitHub UI.
- [ ] PR description nói rõ **vì sao** thay đổi, không chỉ **cái gì**.
- [ ] Tự gán đúng reviewer / label.
