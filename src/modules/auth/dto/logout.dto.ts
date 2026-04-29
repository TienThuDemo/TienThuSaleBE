import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const logoutSchema = z
  .object({
    refreshToken: z.string().min(1).describe('Refresh token to revoke'),
  })
  .strict();

export class LogoutDto extends createZodDto(logoutSchema) {}
