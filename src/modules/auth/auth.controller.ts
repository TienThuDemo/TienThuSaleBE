import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthResult, AuthService, AuthTokens, RequestContext } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import type { AuthenticatedUser } from './types/jwt-payload';

const REGISTER_RATE_TTL_MS = 60_000;
const REGISTER_RATE_LIMIT = 5;
const LOGIN_RATE_TTL_MS = 60_000;
const LOGIN_RATE_LIMIT = 10;
const REFRESH_RATE_TTL_MS = 60_000;
const REFRESH_RATE_LIMIT = 20;

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: REGISTER_RATE_TTL_MS, limit: REGISTER_RATE_LIMIT } })
  @ApiOperation({ summary: 'Register a new account' })
  register(@Body() dto: RegisterDto, @Req() req: Request): Promise<AuthResult> {
    return this.authService.register(dto, this.contextFromRequest(req));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: LOGIN_RATE_TTL_MS, limit: LOGIN_RATE_LIMIT } })
  @ApiOperation({ summary: 'Login with email + password' })
  login(@Body() dto: LoginDto, @Req() req: Request): Promise<AuthResult> {
    return this.authService.login(dto, this.contextFromRequest(req));
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: REFRESH_RATE_TTL_MS, limit: REFRESH_RATE_LIMIT } })
  @ApiOperation({ summary: 'Exchange a refresh token for a new access + refresh token pair' })
  refreshToken(@Body() dto: RefreshTokenDto, @Req() req: Request): Promise<AuthTokens> {
    return this.authService.refreshAccessToken(dto.refreshToken, this.contextFromRequest(req));
  }

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Revoke a refresh token. The current access token remains valid until its TTL expires.',
  })
  async logout(@Body() dto: LogoutDto): Promise<{ success: true }> {
    await this.authService.logout(dto.refreshToken);
    return { success: true };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  private contextFromRequest(req: Request): RequestContext {
    const userAgent = req.headers['user-agent'];
    return {
      userAgent: typeof userAgent === 'string' ? userAgent : undefined,
      ipAddress: req.ip,
    };
  }
}
