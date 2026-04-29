import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import type { AuthenticatedUser } from '../types/jwt-payload';

/**
 * Extract the authenticated user (attached by `JwtAuthGuard`) from the request.
 *
 * @example
 *   @Get('me')
 *   me(@CurrentUser() user: AuthenticatedUser) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
    return request.user;
  },
);
