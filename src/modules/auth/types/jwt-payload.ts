export interface JwtPayload {
  /** User id (UUID) */
  sub: string;
  email: string;
  /** Issued at — populated by JwtService */
  iat?: number;
  /** Expires at — populated by JwtService */
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
}
