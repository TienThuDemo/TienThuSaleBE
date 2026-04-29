import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { BASE_ENTITY_SELECT, type AuditContext } from '../../../common/types/base-entity';
import { PrismaService } from '../../../prisma/prisma.service';

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  phoneNumber: true,
  ...BASE_ENTITY_SELECT,
} satisfies Prisma.UserSelect;

export type SafeUser = Prisma.UserGetPayload<{ select: typeof SAFE_USER_SELECT }>;

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name?: string;
  phoneNumber?: string;
}

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Default `where` fragment that filters out soft-deleted users. */
  private get notDeleted(): Prisma.UserWhereInput {
    return { deletedAt: null };
  }

  findById(id: string): Promise<SafeUser | null> {
    return this.prisma.user.findFirst({
      where: { id, ...this.notDeleted },
      select: SAFE_USER_SELECT,
    });
  }

  /**
   * Returns the full `User` row (including `passwordHash`) for authentication
   * flows. Do not expose this result over HTTP.
   */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, ...this.notDeleted },
    });
  }

  list(): Promise<SafeUser[]> {
    return this.prisma.user.findMany({
      where: this.notDeleted,
      orderBy: { createdAt: 'desc' },
      select: SAFE_USER_SELECT,
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const row = await this.prisma.user.findFirst({
      where: { email, ...this.notDeleted },
      select: { id: true },
    });
    return row !== null;
  }

  create(input: CreateUserInput, audit: AuditContext): Promise<SafeUser> {
    return this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
        phoneNumber: input.phoneNumber,
        createdById: audit.userId,
        updatedById: audit.userId,
      },
      select: SAFE_USER_SELECT,
    });
  }
}
