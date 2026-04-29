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
