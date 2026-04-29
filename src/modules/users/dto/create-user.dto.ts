import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createUserSchema = z
  .object({
    email: z.string().email().describe('User email address'),
    name: z.string().min(1).max(100).optional().describe('Display name'),
  })
  .strict();

export class CreateUserDto extends createZodDto(createUserSchema) {}
