# 11. Git & Tooling

> **Tóm tắt:** Conventional Commits, branch theo prefix, lint-staged tự fix khi commit, npm scripts đã chuẩn — học thuộc 4 lệnh: `lint:fix`, `format:fix`, `type-check`, `test`.
> **Liên quan:** [12-checklist](./12-checklist.md)

## Mục lục

- [Branch naming](#branch-naming)
- [Commit message — Conventional Commits](#commit-message--conventional-commits)
- [Pre-commit hook](#pre-commit-hook)
- [npm scripts cần biết](#npm-scripts-cần-biết)
- [Pull Request](#pull-request)
- [ESLint & Prettier](#eslint--prettier)
- [Khi CI fail](#khi-ci-fail)

## Branch naming

**Rule:** `<type>/<short-kebab-summary>` — type ngắn gọn:

| Prefix      | Khi nào                              |
| ----------- | ------------------------------------ |
| `feature/`  | Tính năng mới                        |
| `fix/`      | Sửa bug                              |
| `chore/`    | Việc lặt vặt (deps, config, rename…) |
| `refactor/` | Refactor không đổi behavior          |
| `docs/`     | Sửa docs                             |
| `hotfix/`   | Sửa khẩn từ production               |

**Good:**

```
feature/jwt-refresh-token
fix/users-pagination-off-by-one
chore/upgrade-prisma-to-6.20
```

Branch chính: `develop` (dev), `main` (production-ready).

## Commit message — Conventional Commits

**Rule:** Format `<type>(<scope>)?: <subject>`

| Type       | Khi nào                            |
| ---------- | ---------------------------------- |
| `feat`     | Tính năng mới (visible to user)    |
| `fix`      | Bug fix                            |
| `chore`    | Tooling, deps, config              |
| `refactor` | Refactor không đổi behavior        |
| `docs`     | Tài liệu                           |
| `test`     | Thêm/sửa test                      |
| `perf`     | Tối ưu performance                 |
| `style`    | Format/whitespace (không sửa code) |
| `ci`       | Sửa CI/CD                          |
| `build`    | Build system                       |

**Good** (đã có ở repo):

```
feat(auth): add JWT authentication with register and login endpoints
fix: mark bootstrap as void to resolve floating promise warning
chore: run prettier
```

**Rule chi tiết:**

- Subject **viết thường, không dấu chấm cuối**, **dạng mệnh lệnh** (`add`, `fix`, không phải `added`, `fixes`).
- Body (optional, ngăn cách bởi blank line): giải thích **tại sao**, không phải **cái gì**.
- Footer (optional): `BREAKING CHANGE: ...`, `Refs: #123`.

**Cấm:**

- `update code`, `wip`, `fix bug` (vô nghĩa).
- Commit lẫn nhiều scope không liên quan trong 1 commit.

## Pre-commit hook

Đã setup qua Husky + lint-staged (xem `package.json` mục `lint-staged`):

- Mọi `*.ts/.js/.mjs/.cjs` staged → chạy `eslint --fix` + `prettier --write`.
- Mọi `*.json/.md` staged → `prettier --write`.

→ **Member không cần chạy lint thủ công trước commit** — hook tự fix. Nếu lint không thể auto-fix, commit sẽ bị chặn → fix tay rồi `git add` lại.

**Rule:** **Cấm** `git commit --no-verify` để bypass hook (trừ trường hợp khẩn — phải comment ở PR).

## npm scripts cần biết

| Lệnh                            | Mô tả                       | Khi nào chạy                |
| ------------------------------- | --------------------------- | --------------------------- |
| `npm run start:dev`             | Dev với watch               | Hằng ngày                   |
| `npm run start:debug`           | Dev + Node inspector        | Khi cần debug               |
| `npm run build`                 | Build prod                  | Trước deploy                |
| `npm run lint:check`            | Check ESLint, không sửa     | CI                          |
| `npm run lint:fix`              | Auto-fix ESLint             | Khi lint:check fail         |
| `npm run format:check`          | Check Prettier              | CI                          |
| `npm run format:fix`            | Auto format                 | Khi format:check fail       |
| `npm run type-check`            | `tsc --noEmit`              | Trước commit / CI           |
| `npm run test`                  | Unit test                   | Trước commit                |
| `npm run test:cov`              | Test + coverage             | Định kỳ / CI                |
| `npm run test:e2e`              | E2E test                    | Trước merge                 |
| `npm run prisma:generate`       | Generate Prisma client      | Sau khi sửa `schema.prisma` |
| `npm run prisma:migrate:dev`    | Tạo + apply migration ở dev | Khi sửa schema              |
| `npm run prisma:migrate:deploy` | Apply migration production  | Pipeline deploy             |
| `npm run prisma:studio`         | Mở Prisma Studio            | Khi cần view DB nhanh       |

**4 lệnh học thuộc:** `lint:fix`, `format:fix`, `type-check`, `test`.

## Pull Request

**Rule:**

- 1 PR = 1 mục tiêu rõ ràng. Đừng nhồi refactor + feature + fix vào 1 PR.
- Title PR theo Conventional Commits (giống commit).
- Mô tả PR theo template `.github/pull_request_template.md` (sẽ có).
- Tự review trước khi gán reviewer (đọc lại diff trên GitHub UI thường thấy bug).
- Xanh đủ CI (`lint:check`, `type-check`, `test`) mới được merge.
- Merge strategy: **squash** mặc định (giữ history linh hoạt). Tự discuss với team nếu cần khác.

## ESLint & Prettier

Đã cấu hình:

- ESLint v9 flat config + `recommendedTypeChecked` + Prettier integration.
- Custom rules đã enforce: cấm `any`, cấm unused vars (cho phép prefix `_`), cảnh báo floating promise & unsafe argument, cấm `console.log` (cho `console.warn/error`).

**Rule:**

- **Không** disable rule scope rộng (`/* eslint-disable */` cả file). Disable theo dòng nếu cần thật:

  ```ts
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- vendor SDK type sai, đã verify input
  thirdPartyCall(input);
  ```

- Khi disable → **bắt buộc** có comment lý do (`-- ...`).

## Khi CI fail

1. `lint:check` fail → chạy `lint:fix` → commit fix.
2. `format:check` fail → chạy `format:fix` → commit fix.
3. `type-check` fail → đọc lỗi, **không** dùng `as any` để né.
4. `test` fail → fix logic / fix test (đừng comment-out test).

---

→ Tiếp theo: [12. Checklist](./12-checklist.md)
