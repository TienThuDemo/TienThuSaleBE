# Coding Convention — TienThu API

> Bộ tài liệu này quy định **cách viết code chính thức** cho dự án `tienthu-api` (NestJS 11 + Prisma 6 + Zod + JWT). Mục tiêu: code consistent, dễ review, dễ scale.

## Cách dùng

- **Member mới:** đọc lần lượt từ `01` → `12` (~30 phút).
- **Khi review/PR:** dẫn link tới đúng section, ví dụ `06-validation-and-dto.md#zod-schema-cho-dto`.
- **Khi không chắc:** xem [`12-checklist.md`](./12-checklist.md) trước khi mở PR.
- **Tranh luận convention:** mở PR sửa file tương ứng, không tranh luận miệng.

## Mục lục

| #   | File                                                           | Khi nào đọc                                |
| --- | -------------------------------------------------------------- | ------------------------------------------ |
| 01  | [Project structure](./01-project-structure.md)                 | Tạo module/feature mới                     |
| 02  | [Naming conventions](./02-naming-conventions.md)               | Đặt tên file/class/biến/route              |
| 03  | [TypeScript style](./03-typescript-style.md)                   | Viết type, generic, xử lý null/any         |
| 04  | [NestJS patterns](./04-nestjs-patterns.md)                     | Tổ chức Module/Controller/Service/Provider |
| 05  | [API design](./05-api-design.md)                               | Thiết kế endpoint, versioning, Swagger     |
| 06  | [Validation & DTO](./06-validation-and-dto.md)                 | Validate input, viết DTO bằng Zod          |
| 07  | [Error handling & logging](./07-error-handling-and-logging.md) | Throw exception, log                       |
| 08  | [Database & Prisma](./08-database-prisma.md)                   | Sửa schema, viết query, migration          |
| 09  | [Security & Auth](./09-security-and-auth.md)                   | Auth, guard, secret, throttler, helmet     |
| 10  | [Configuration](./10-configuration.md)                         | Đọc env, thêm biến môi trường              |
| 11  | [Git & Tooling](./11-git-and-tooling.md)                       | Commit, branch, PR, npm scripts            |
| 12  | [Checklist](./12-checklist.md)                                 | Trước khi mở PR                            |

## Stack tham chiếu

| Layer      | Công nghệ                                                         |
| ---------- | ----------------------------------------------------------------- |
| Runtime    | Node.js (`>=20`), TypeScript 5.7, NestJS 11                       |
| HTTP       | Express, Helmet, `@nestjs/throttler`                              |
| Validation | Zod 4 + `nestjs-zod`                                              |
| Auth       | `@nestjs/jwt`, `bcrypt`                                           |
| API docs   | `@nestjs/swagger`                                                 |
| Database   | PostgreSQL + Prisma 6                                             |
| Tooling    | ESLint v9 (type-checked), Prettier 3, Husky, lint-staged, Jest 30 |

## Quy tắc của tài liệu này

- Mỗi file trình bày theo motif **Rule → Why → Good/Bad example**.
- **Không lặp** — chỉ link sang file khác.
- Sửa convention = mở PR sửa file tương ứng (ai cũng có thể đề xuất).
