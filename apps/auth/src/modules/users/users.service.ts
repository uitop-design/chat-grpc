import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../database/index.js";
import { User } from "../../generated/prisma/client.js";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  create(username: string, passwordHash: string): Promise<User> {
    return this.prisma.user.create({ data: { username, passwordHash } });
  }
}
