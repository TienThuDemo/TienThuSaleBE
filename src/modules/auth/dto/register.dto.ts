import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email().describe('User email address'),
    password: z.string().min(8).max(128).describe('Password (min 8 chars, max 128)'),
    name: z.string().min(1).max(100).optional().describe('Display name'),
  })
  .strict();

export class RegisterDto extends createZodDto(registerSchema) {}
