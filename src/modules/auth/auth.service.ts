import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import type { StringValue } from 'ms';
import ms from 'ms';
import { AppConfigService } from '../../config/app-config.service';
import { UserRepository, type SafeUser } from '../users/repositories/user.repository';
import {
  AUTH_ERROR_CODE,
  isJwtExpiredError,
  REFRESH_TOKEN_REVOKED_REASON,
} from './constants/auth.constants';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import type { AuthenticatedUser, JwtPayload } from './types/jwt-payload';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}

export interface RequestContext {
  userAgent?: string;
  ipAddress?: string;
}

interface IssueTokensOptions {
  /** When set, the new refresh token joins an existing rotation family. */
  family?: string;
  context: RequestContext;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UserRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async register(dto: RegisterDto, context: RequestContext): Promise<AuthResult> {
    if (await this.users.existsByEmail(dto.email)) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.config.get('BCRYPT_SALT_ROUNDS'));

    const user = await this.users.create(
      {
        email: dto.email,
        passwordHash,
        name: dto.name,
        phoneNumber: dto.phoneNumber,
      },
      { userId: null },
    );

    const tokens = await this.issueTokens(user.id, user.email, { context });
    return { user: { id: user.id, email: user.email }, tokens };
  }

  async login(dto: LoginDto, context: RequestContext): Promise<AuthResult> {
    const user = await this.users.findByEmailWithPassword(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user.id, user.email, { context });
    return { user: { id: user.id, email: user.email }, tokens };
  }

  async refreshAccessToken(rawToken: string, context: RequestContext): Promise<AuthTokens> {
    const payload = await this.verifyRefreshTokenSignature(rawToken);
    const tokenHash = this.hashToken(rawToken);
    const stored = await this.refreshTokens.findByHash(tokenHash);

    if (!stored) {
      // Token never issued by us or already pruned.
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODE.RefreshTokenInvalid,
        message: 'Refresh token is not recognized',
      });
    }

    if (stored.revokedAt !== null) {
      // Reuse of an already-rotated token → assume credential theft, kill the family.
      this.logger.warn(`Refresh token reuse detected for user ${stored.userId}, revoking family`);
      await this.refreshTokens.revokeFamily(
        stored.family,
        REFRESH_TOKEN_REVOKED_REASON.ReuseDetected,
      );
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODE.RefreshTokenReused,
        message: 'Refresh token has already been used; the session was revoked for safety',
      });
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODE.RefreshTokenExpired,
        message: 'Refresh token has expired',
      });
    }

    if (stored.userId !== payload.sub) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODE.RefreshTokenInvalid,
        message: 'Refresh token does not match its owner',
      });
    }

    return this.rotateTokens({
      userId: stored.userId,
      email: payload.email,
      family: stored.family,
      previousHash: tokenHash,
      context,
    });
  }

  async logout(rawToken: string): Promise<void> {
    // Reject forged / malformed tokens up-front so a client passing garbage
    // (e.g. the literal Swagger placeholder "string") gets a clear 401.
    // An expired-but-correctly-signed token is treated as idempotent success
    // since the token is already non-functional — this matches RFC 7009 §2.2.
    try {
      await this.jwtService.verifyAsync<JwtPayload>(rawToken, {
        secret: this.refreshSecret(),
      });
    } catch (err) {
      if (isJwtExpiredError(err)) {
        return;
      }
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODE.RefreshTokenInvalid,
        message: 'Refresh token is invalid',
      });
    }

    const tokenHash = this.hashToken(rawToken);
    const stored = await this.refreshTokens.findByHash(tokenHash);
    if (!stored || stored.revokedAt !== null) {
      return;
    }

    await this.refreshTokens.revokeByHash(tokenHash, REFRESH_TOKEN_REVOKED_REASON.Logout);
  }

  /** Convenience wrapper used by `Users` flows that already have a `SafeUser`. */
  toAuthenticatedUser(user: SafeUser): AuthenticatedUser {
    return { id: user.id, email: user.email };
  }

  // -------- internals --------

  private async issueTokens(
    userId: string,
    email: string,
    options: IssueTokensOptions,
  ): Promise<AuthTokens> {
    const family = options.family ?? randomUUID();
    const accessToken = await this.signAccessToken(userId, email);
    const { token: refreshToken, expiresAt } = await this.signRefreshToken(userId, email);

    await this.refreshTokens.create({
      userId,
      tokenHash: this.hashToken(refreshToken),
      family,
      expiresAt,
      userAgent: options.context.userAgent,
      ipAddress: options.context.ipAddress,
    });

    return { accessToken, refreshToken };
  }

  private async rotateTokens(args: {
    userId: string;
    email: string;
    family: string;
    previousHash: string;
    context: RequestContext;
  }): Promise<AuthTokens> {
    const accessToken = await this.signAccessToken(args.userId, args.email);
    const { token: refreshToken, expiresAt } = await this.signRefreshToken(args.userId, args.email);

    await this.refreshTokens.rotate({
      oldTokenHash: args.previousHash,
      newToken: {
        userId: args.userId,
        tokenHash: this.hashToken(refreshToken),
        family: args.family,
        expiresAt,
        userAgent: args.context.userAgent,
        ipAddress: args.context.ipAddress,
      },
      reason: REFRESH_TOKEN_REVOKED_REASON.Rotation,
    });

    return { accessToken, refreshToken };
  }

  private signAccessToken(userId: string, email: string): Promise<string> {
    const payload: JwtPayload = { sub: userId, email };
    return this.jwtService.signAsync(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN') as StringValue,
    });
  }

  private async signRefreshToken(
    userId: string,
    email: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const payload: JwtPayload = { sub: userId, email };
    const expiresInValue = this.config.get('JWT_REFRESH_EXPIRES_IN') as StringValue;
    const token = await this.jwtService.signAsync(payload, {
      secret: this.refreshSecret(),
      expiresIn: expiresInValue,
    });
    const ttlMs = ms(expiresInValue);
    if (typeof ttlMs !== 'number') {
      throw new Error(`Invalid JWT_REFRESH_EXPIRES_IN value: ${expiresInValue}`);
    }
    return { token, expiresAt: new Date(Date.now() + ttlMs) };
  }

  private async verifyRefreshTokenSignature(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.refreshSecret(),
      });
    } catch (err) {
      if (isJwtExpiredError(err)) {
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODE.RefreshTokenExpired,
          message: 'Refresh token has expired',
        });
      }
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODE.RefreshTokenInvalid,
        message: 'Refresh token is invalid',
      });
    }
  }

  private refreshSecret(): string {
    return this.config.get('JWT_REFRESH_SECRET') ?? this.config.get('JWT_SECRET');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
