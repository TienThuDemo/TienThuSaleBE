/** Password policy — aligned with NIST SP 800-63B + OWASP ASVS L2. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_LOWERCASE_REGEX = /[a-z]/;
export const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
export const PASSWORD_DIGIT_REGEX = /\d/;
export const PASSWORD_SPECIAL_REGEX = /[^A-Za-z0-9]/;

/** Reasons a refresh token can be revoked. */
export const REFRESH_TOKEN_REVOKED_REASON = {
  Logout: 'logout',
  Rotation: 'rotation',
  ReuseDetected: 'reuse_detected',
  Admin: 'admin',
} as const;

export type RefreshTokenRevokedReason =
  (typeof REFRESH_TOKEN_REVOKED_REASON)[keyof typeof REFRESH_TOKEN_REVOKED_REASON];

/**
 * Machine-readable error codes returned alongside HTTP 401 responses so the
 * frontend can decide between "refresh and retry" and "logout" without parsing
 * free-text messages.
 */
export const AUTH_ERROR_CODE = {
  TokenMissing: 'TOKEN_MISSING',
  TokenExpired: 'TOKEN_EXPIRED',
  TokenInvalid: 'TOKEN_INVALID',
  RefreshTokenInvalid: 'REFRESH_TOKEN_INVALID',
  RefreshTokenExpired: 'REFRESH_TOKEN_EXPIRED',
  RefreshTokenRevoked: 'REFRESH_TOKEN_REVOKED',
  RefreshTokenReused: 'REFRESH_TOKEN_REUSED',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODE)[keyof typeof AUTH_ERROR_CODE];

/** `name` set by `jsonwebtoken` on expiry errors. Stable across versions. */
const JWT_EXPIRED_ERROR_NAME = 'TokenExpiredError';

export const isJwtExpiredError = (err: unknown): boolean =>
  err instanceof Error && err.name === JWT_EXPIRED_ERROR_NAME;
