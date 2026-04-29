import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AppConfigService } from '../../../config/app-config.service';
import { AUTH_ERROR_CODE, isJwtExpiredError } from '../constants/auth.constants';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedUser, JwtPayload } from '../types/jwt-payload';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly config: AppConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();

    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODE.TokenMissing,
        message: 'Missing access token',
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.config.get('JWT_SECRET'),
      });
      request.user = { id: payload.sub, email: payload.email };
      return true;
    } catch (err) {
      if (isJwtExpiredError(err)) {
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODE.TokenExpired,
          message: 'Access token has expired',
        });
      }
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODE.TokenInvalid,
        message: 'Access token is invalid',
      });
    }
  }

  private extractBearerToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header) return undefined;
    const [scheme, token] = header.split(' ');
    return scheme?.toLowerCase() === 'bearer' && token ? token : undefined;
  }
}
