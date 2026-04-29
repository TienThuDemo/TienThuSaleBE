# 04. NestJS Patterns

> **Tóm tắt:** Controller mỏng, Service chứa business, Module export đúng provider. Dùng DI cho mọi dependency, dùng `APP_*` token cho global guard/pipe/filter/interceptor. Async config qua `*ModuleAsync.registerAsync({ inject, useFactory })`.
> **Liên quan:** [01-project-structure](./01-project-structure.md) · [05-api-design](./05-api-design.md) · [10-configuration](./10-configuration.md)

## Mục lục

- [Layering: Controller / Service / Repository](#layering)
- [Module — chỉ wiring](#module--chỉ-wiring)
- [Controller — chỉ HTTP](#controller--chỉ-http)
- [Service — chỗ chứa business](#service--chỗ-chứa-business)
- [Dependency Injection](#dependency-injection)
- [Global provider qua `APP_*`](#global-provider-qua-app)
- [Async config — `registerAsync`](#async-config--registerasync)
- [Lifecycle hook](#lifecycle-hook)

## Layering

```
HTTP request
    ↓
Controller (validate via DTO, gọi service, không if-else business)
    ↓
Service (business logic, gọi repository / Prisma, throw HttpException)
    ↓
Repository / PrismaService (chỉ data access)
```

**Rule:** Cấm "leak" tầng:

- Controller **không** gọi `PrismaService` trực tiếp.
- Service **không** đụng đến `Request`/`Response`.
- Repository (nếu có) **không** throw `HttpException` — trả về `null` / domain error, để service map sang `HttpException`.

## Module — chỉ wiring

**Rule:** File `*.module.ts` chỉ chứa `@Module({...})`. Không có hàm utility, không có biến tự do.

**Good** (đã có trong dự án — `auth.module.ts`):

```ts
@Module({
  imports: [JwtModule.registerAsync({ ... })],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
```

**Rule về `exports`:**

- Chỉ export những gì **module khác cần inject**.
- Không export internal class (DTO, type, repository) — module khác không nên đụng vào.

## Controller — chỉ HTTP

**Rule:** Controller method **gọn ≤ 5 dòng**, chỉ làm 3 việc:

1. Nhận DTO/param.
2. Gọi service.
3. (Optional) gắn decorator metadata (`@HttpCode`, `@Throttle`, `@ApiOperation`).

**Cấm trong controller:**

- `if/else` business.
- `try/catch` (filter đã handle — xem [07](./07-error-handling-and-logging.md)).
- Truy cập `Request`/`Response` (trừ khi thực sự cần — dùng decorator `@Req`/`@Res` rất hạn chế).
- Gọi Prisma trực tiếp.

**Good** (`auth.controller.ts`):

```ts
@Public()
@Post('login')
@HttpCode(HttpStatus.OK)
@Throttle({ default: { ttl: 60_000, limit: 10 } })
@ApiOperation({ summary: 'Login with email + password' })
login(@Body() dto: LoginDto): Promise<AuthResult> {
  return this.authService.login(dto);
}
```

## Service — chỗ chứa business

**Rule:**

- Stateless (không có field mutable). Stateful logic → tách provider riêng.
- Throw `HttpException` con cụ thể (`NotFoundException`, `ConflictException`, `UnauthorizedException`…) — xem [07](./07-error-handling-and-logging.md).
- Method public **đều có return type explicit**.
- Method private dùng `private` (không `_` prefix).

**Good** (`auth.service.ts`):

```ts
async register(dto: RegisterDto): Promise<AuthResult> {
  const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) throw new ConflictException('Email already registered');
  // ...
}
```

## Dependency Injection

**Rule:**

- Inject qua constructor + `private readonly`. Không dùng property injection trừ trường hợp đặc biệt (`@Inject` ở field cho circular workaround — và đã có discussion).
- Dùng **class token** mặc định. Custom token (`Symbol`/string) chỉ khi inject value/factory.

**Good:**

```ts
constructor(
  private readonly prisma: PrismaService,
  private readonly jwtService: JwtService,
  private readonly config: AppConfigService,
) {}
```

**Bad:**

```ts
constructor(private prisma) { ... }            // không readonly, không type
@Inject() private prisma!: PrismaService;       // property injection
```

## Global provider qua `APP_*`

**Rule:** Pipe / Guard / Filter / Interceptor **toàn cục** đăng ký bằng token `APP_PIPE`, `APP_GUARD`, `APP_FILTER`, `APP_INTERCEPTOR`. Không gọi `app.useGlobal*()` cho thứ cần DI.

**Why:** Đăng ký kiểu provider được Nest **inject các dependency** vào — `useGlobalPipes(new MyPipe())` thì pipe không có DI.

**Good** (đã có ở `app.module.ts`):

```ts
providers: [
  { provide: APP_PIPE, useClass: ZodValidationPipe },
  { provide: APP_GUARD, useClass: ThrottlerGuard },
],
```

`auth.module.ts` đăng ký `JwtAuthGuard` ở `APP_GUARD` để mọi route mặc định yêu cầu auth — route public phải gắn `@Public()`. Đây là pattern **secure-by-default**, giữ nguyên.

**Khi nào vẫn dùng `useGlobal*()`:** filter/interceptor không cần DI — như `AllExceptionsFilter`, `LoggingInterceptor`, `TransformInterceptor` trong `main.ts` hiện tại (chấp nhận, vì chúng tự khởi tạo Logger).

## Async config — `registerAsync`

**Rule:** Khi module cần đọc config, **luôn** dùng `registerAsync({ inject, useFactory })`. Không gọi `process.env` trong module.

**Good** (`auth.module.ts`):

```ts
JwtModule.registerAsync({
  inject: [AppConfigService],
  useFactory: (config: AppConfigService) => ({
    secret: config.get('JWT_SECRET'),
    signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') as StringValue },
  }),
});
```

## Lifecycle hook

**Rule:** Implement đúng interface (`OnModuleInit`, `OnModuleDestroy`, `OnApplicationShutdown`) khi cần. Không dùng `setInterval`/`setTimeout` ở constructor.

**Good** (`prisma.service.ts`):

```ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
```

`main.ts` đã bật `app.enableShutdownHooks()` — graceful shutdown hoạt động đúng.

---

→ Tiếp theo: [05. API design](./05-api-design.md)
