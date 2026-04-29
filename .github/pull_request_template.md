<!-- Title PR theo Conventional Commits, ví dụ: feat(auth): add refresh token endpoint -->

## Mục đích

<!-- Vì sao thay đổi này cần thiết? Link issue / ticket nếu có. -->

## Thay đổi chính

<!-- Bullet ngắn gọn: cái gì đã thay đổi, ở đâu. -->

-
-
-

## Cách kiểm thử

<!-- Reviewer làm sao verify? curl, Swagger, screenshot... -->

```bash
# Ví dụ
curl -X POST http://localhost:8181/api/v1/auth/login -H 'Content-Type: application/json' -d '...'
```

## Checklist

> Đầy đủ trong [coding-convention/12-checklist.md](../coding-convention/12-checklist.md). Tick những mục áp dụng:

- [ ] Code: cấu trúc / naming / TS style đúng convention.
- [ ] API: status code đúng, có Swagger decorator, dùng `/api/v{N}/...`.
- [ ] DTO: input có Zod schema `.strict()`, response không leak field nhạy cảm.
- [ ] DB (nếu sửa schema): migration có tên có nghĩa, đã `prisma generate`.
- [ ] Security: không hardcode secret, env mới đã update `env.schema.ts` + `.env.example`.
- [ ] `npm run lint:check`, `format:check`, `type-check`, `test` đều xanh.
- [ ] Commit message theo Conventional Commits.
- [ ] Đã tự review diff trước khi gán reviewer.

## Lưu ý cho reviewer

<!-- Điểm cần soi kỹ, decision đã trade-off, follow-up sẽ làm sau (link issue). -->
