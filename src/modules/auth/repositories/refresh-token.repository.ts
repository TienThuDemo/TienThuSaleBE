import { Injectable } from '@nestjs/common';
import { Prisma, RefreshToken } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { RefreshTokenRevokedReason } from '../constants/auth.constants';

export interface CreateRefreshTokenInput {
  userId: string;
  tokenHash: string;
  family: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateRefreshTokenInput): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data: input });
  }

  findByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  /**
   * Atomically rotate a token: revoke the old hash and create a new row in the
   * same transaction so the family link is never lost.
   */
  async rotate(args: {
    oldTokenHash: string;
    newToken: CreateRefreshTokenInput;
    reason: RefreshTokenRevokedReason;
  }): Promise<RefreshToken> {
    const [, created] = await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { tokenHash: args.oldTokenHash },
        data: { revokedAt: new Date(), revokedReason: args.reason },
      }),
      this.prisma.refreshToken.create({ data: args.newToken }),
    ]);
    return created;
  }

  async revokeByHash(tokenHash: string, reason: RefreshTokenRevokedReason): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
  }

  async revokeFamily(family: string, reason: RefreshTokenRevokedReason): Promise<void> {
    const where: Prisma.RefreshTokenWhereInput = { family, revokedAt: null };
    await this.prisma.refreshToken.updateMany({
      where,
      data: { revokedAt: new Date(), revokedReason: reason },
    });
  }
}
