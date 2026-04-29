import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as publicly accessible — bypasses the global JwtAuthGuard.
 *
 * @example
 *   @Public()
 *   @Get('/health')
 *   ping() { ... }
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
