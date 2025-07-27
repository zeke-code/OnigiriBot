import { User, Prisma } from "../../generated/prisma";
import { db } from "../DatabaseManager";

export class UserRepository {
  async findOrCreate(userId: string): Promise<User> {
    return db.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });
  }

  async findById(userId: string): Promise<User | null> {
    return db.user.findUnique({
      where: { id: userId },
    });
  }

  async getGuildUser(guildId: string, userId: string) {
    return db.guildUser.findUnique({
      where: {
        guildId_userId: {
          guildId,
          userId,
        },
      },
    });
  }

  async addExperience(guildId: string, userId: string, amount: number) {
    // Ensure user and guild exist
    await this.findOrCreate(userId);
    await db.guild.upsert({
      where: { id: guildId },
      update: {},
      create: { id: guildId },
    });

    return db.guildUser.upsert({
      where: {
        guildId_userId: {
          guildId,
          userId,
        },
      },
      update: {
        experience: { increment: amount },
      },
      create: {
        guildId,
        userId,
        experience: amount,
      },
    });
  }

  async getLeaderboard(guildId: string, limit: number = 10) {
    return db.guildUser.findMany({
      where: { guildId },
      orderBy: [{ level: "desc" }, { experience: "desc" }],
      take: limit,
      include: {
        user: true,
      },
    });
  }
}
