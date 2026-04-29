/**
 * Audit / lifecycle fields shared by every business entity.
 *
 * Prisma has no model inheritance, so these fields must be duplicated in
 * `schema.prisma` for each entity. This type lets repositories share return
 * shapes and `select` constants.
 */
export interface BaseEntityFields {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdById: string | null;
  updatedById: string | null;
  deletedById: string | null;
}

/**
 * `select` fragment to include audit fields. Spread into a Prisma `select`
 * object when an entity needs to expose its audit trail.
 */
export const BASE_ENTITY_SELECT = {
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  createdById: true,
  updatedById: true,
  deletedById: true,
} as const;

/**
 * Audit context propagated from the HTTP layer to repositories so that
 * `createdById` / `updatedById` / `deletedById` can be filled consistently.
 *
 * `userId` is `null` for unauthenticated operations (e.g. self-registration).
 */
export interface AuditContext {
  userId: string | null;
}
