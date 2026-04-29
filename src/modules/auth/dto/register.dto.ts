import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { validateVietnamPhone } from '../../../common/utils/phone';
import {
  PASSWORD_DIGIT_REGEX,
  PASSWORD_LOWERCASE_REGEX,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_SPECIAL_REGEX,
  PASSWORD_UPPERCASE_REGEX,
} from '../constants/auth.constants';

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
  .refine((value) => value === value.trim(), {
    message: 'Password must not start or end with whitespace',
  })
  .refine((value) => PASSWORD_LOWERCASE_REGEX.test(value), {
    message: 'Password must contain at least one lowercase letter',
  })
  .refine((value) => PASSWORD_UPPERCASE_REGEX.test(value), {
    message: 'Password must contain at least one uppercase letter',
  })
  .refine((value) => PASSWORD_DIGIT_REGEX.test(value), {
    message: 'Password must contain at least one digit',
  })
  .refine((value) => PASSWORD_SPECIAL_REGEX.test(value), {
    message: 'Password must contain at least one special character',
  });

const phoneNumberSchema = z
  .string()
  .min(1)
  .transform((value, ctx) => {
    const result = validateVietnamPhone(value);
    if (!result.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid Vietnamese phone number',
      });
      return z.NEVER;
    }
    return result.normalized;
  });

export const registerSchema = z
  .object({
    email: z.string().email().describe('User email address'),
    password: passwordSchema.describe('Password (enterprise policy enforced)'),
    confirmPassword: z.string().describe('Must match `password`'),
    phoneNumber: phoneNumberSchema
      .optional()
      .describe('Vietnamese phone number (mobile or fixed-line), normalized to E.164'),
    name: z.string().min(1).max(100).optional().describe('Display name'),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })
  .refine(
    (data) => {
      const localPart = data.email.split('@')[0]?.toLowerCase() ?? '';
      const password = data.password.toLowerCase();
      return localPart.length === 0 || !password.includes(localPart);
    },
    {
      path: ['password'],
      message: 'Password must not contain the local part of the email',
    },
  );

export class RegisterDto extends createZodDto(registerSchema) {}
