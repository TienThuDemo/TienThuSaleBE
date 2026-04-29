# 01. Project Structure

> **Tóm tắt:** Dự án dùng layout **Modular by feature**. Mỗi feature là 1 thư mục con trong `src/modules/`, tự chứa controller/service/module/dto của nó. Cross-cutting concern nằm ở `src/common/`, config tách riêng `src/config/`.
> **Liên quan:** [02-naming-conventions](./02-naming-conventions.md) · [04-nestjs-patterns](./04-nestjs-patterns.md)

## Mục lục

- [Layout tổng thể](#layout-tổng-thể)
- [Quy tắc mỗi feature module](#quy-tắc-mỗi-feature-module)
- [`common/` dùng cho cái gì](#common-dùng-cho-cái-gì)
- [`config/` dùng cho cái gì](#config-dùng-cho-cái-gì)
- [Không tạo barrel `index.ts`](#không-tạo-barrel-indexts)
- [Cấm circular dependency](#cấm-circular-dependency)

## Layout tổng thể

```
src/
├── main.ts                         # Bootstrap: helmet, cors, prefix, versioning, swagger
├── app.module.ts                   # Root module — chỉ import, không có business logic
├── common/                         # Cross-cutting: filters, interceptors, pipes, decorators dùng chung
│   ├── filters/
│   └── interceptors/
├── config/                         # Env schema + AppConfigService
│   ├── app-config.module.ts
│   ├── app-config.service.ts
│   └── env.schema.ts
├── prisma/                         # PrismaService (singleton wrapper)
│   ├── prisma.module.ts
│   └── prisma.service.ts
└── modules/
    ├── auth/                       # Một feature = một thư mục
    │   ├── auth.module.ts
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── dto/
    │   ├── guards/
    │   ├── decorators/
    │   └── types/
    ├── users/
    └── health/
```

## Quy tắc mỗi feature module

**Rule:** Mỗi feature ở `src/modules/<feature>/` phải tự chứa **toàn bộ artefact** của nó: module, controller, service, DTO, guard, decorator, type. **Không** import file của module khác trừ khi qua public exports trong `*.module.ts`.

**Why:** Module là đơn vị tái sử dụng + lazy-loadable của NestJS. Tách rõ ràng giúp:

- Reviewer chỉ cần đọc 1 thư mục để hiểu feature.
- Refactor / xoá feature an toàn (không có import lén).
- Test cô lập dễ hơn.

**Cấu trúc chuẩn của 1 feature có truy cập DB:**

```
modules/<feature>/
├── <feature>.module.ts         # @Module() — định nghĩa imports/providers/exports
├── <feature>.controller.ts     # HTTP entry point (mỏng)
├── <feature>.service.ts        # Business logic
├── repositories/               # Bắt buộc nếu feature đụng DB — 1 entity = 1 repository
│   └── <entity>.repository.ts
├── dto/                        # Input/output DTO (1 file = 1 DTO)
├── guards/                     # (nếu có) guard riêng cho feature này
├── decorators/                 # (nếu có) decorator riêng
└── types/                      # (nếu có) type/interface riêng, không export ra ngoài
```

> Quy tắc Repository (bắt buộc) — chi tiết tại [08-database-prisma#repository-layer--bắt-buộc](./08-database-prisma.md#repository-layer--bắt-buộc).

**Khi feature lớn dần** (>500 LOC service hoặc >5 endpoint), tách tiếp:

```
modules/<feature>/
├── controllers/                # Nhiều controller cùng tag
└── services/                   # Tách service theo trách nhiệm
```

## `common/` dùng cho cái gì

**Rule:** Chỉ đặt vào `common/` những thứ **dùng từ ≥ 2 module**, **không có business logic**.

**Hợp lệ:**

- `filters/all-exceptions.filter.ts` — error envelope chung.
- `interceptors/transform.interceptor.ts` — wrap response.
- `interceptors/logging.interceptor.ts` — log HTTP.
- (sau này) `pipes/`, `decorators/`, `utils/`.

**Không hợp lệ:**

- DTO của 1 feature.
- Service của 1 feature.
- Type của business domain (User, Auth, …) → vào `modules/<feature>/types/`.

## `config/` dùng cho cái gì

**Rule:** Toàn bộ logic cấu hình ứng dụng (env schema, `AppConfigService`) **bắt buộc** ở `src/config/`. Không được đọc `process.env.X` ở bất kỳ chỗ nào khác. Xem [10-configuration](./10-configuration.md).

## Không tạo barrel `index.ts`

**Rule:** **Cấm** tạo file `index.ts` re-export trong bất kỳ folder nào của `src/`.

**Why:**

- Barrel làm rối DI graph của NestJS, dễ gây circular import.
- Tooling (`nest g`, navigate-to-definition của IDE) hoạt động kém với barrel.
- Lợi ích "import đẹp" không đáng đánh đổi.

**Bad:**

```ts
// modules/auth/index.ts
export * from './auth.module';
export * from './auth.service';
```

**Good:**

```ts
// Import thẳng:
import { AuthService } from '../auth/auth.service';
import { AuthModule } from '../auth/auth.module';
```

## Cấm circular dependency

**Rule:** Module A không được import service từ module B nếu B đã import service từ A.

**Why:** NestJS không khởi động được; khi gặp `forwardRef()` thường là dấu hiệu **thiết kế sai**, không phải giải pháp.

**Cách xử lý:** Trích phần dùng chung ra module thứ 3 (ví dụ `prisma`, `auth`) và để cả A, B import từ đó.

---

→ Tiếp theo: [02. Naming conventions](./02-naming-conventions.md)
