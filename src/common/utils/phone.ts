import { parsePhoneNumberFromString } from 'libphonenumber-js';

const VN_REGION = 'VN' as const;

const ACCEPTED_TYPES: ReadonlySet<string> = new Set([
  'MOBILE',
  'FIXED_LINE',
  'FIXED_LINE_OR_MOBILE',
]);

export interface PhoneValidationResult {
  valid: boolean;
  /** E.164 formatted value (e.g. `+84901234567`) when valid; otherwise the raw input. */
  normalized: string;
}

/**
 * Validate a Vietnamese phone number (mobile or fixed-line) and normalize it
 * to E.164 (`+84…`). Accepts the common input shapes: `0xxxxxxxxx`,
 * `+84xxxxxxxxx`, `84xxxxxxxxx`, with optional spaces / dashes.
 */
export const validateVietnamPhone = (input: string): PhoneValidationResult => {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { valid: false, normalized: input };
  }

  const parsed = parsePhoneNumberFromString(trimmed, VN_REGION);
  if (!parsed || parsed.country !== VN_REGION || !parsed.isValid()) {
    return { valid: false, normalized: input };
  }

  const type = parsed.getType();
  if (type !== undefined && !ACCEPTED_TYPES.has(type)) {
    return { valid: false, normalized: input };
  }

  return { valid: true, normalized: parsed.format('E.164') };
};
