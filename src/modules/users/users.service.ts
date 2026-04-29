import { Injectable, NotFoundException } from '@nestjs/common';
import { SafeUser, UserRepository } from './repositories/user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepo: UserRepository) {}

  findAll(): Promise<SafeUser[]> {
    return this.userRepo.list();
  }

  async findOne(id: string): Promise<SafeUser> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }
}
