import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(1).describe('Refresh token issued at login or last refresh'),
  })
  .strict();

export class RefreshTokenDto extends createZodDto(refreshTokenSchema) {}
