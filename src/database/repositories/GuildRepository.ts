import { Prisma, Guild } from "../../generated/prisma";
import { db } from "../DatabaseManager";

export class GuildRepository {
  async findOrCreate(guildId: string): Promise<Guild> {
    return db.guild.upsert({
      where: { id: guildId },
      update: {},
      create: { id: guildId },
    });
  }

  async findById(guildId: string): Promise<Guild | null> {
    return db.guild.findUnique({
      where: { id: guildId },
    });
  }

  async updatePrefix(guildId: string, prefix: string): Promise<Guild> {
    return db.guild.update({
      where: { id: guildId },
      data: { prefix },
    });
  }

  async toggleCommand(guildId: string, commandName: string): Promise<Guild> {
    const guild = await this.findOrCreate(guildId);
    const isDisabled = guild.disabledCommands.includes(commandName);

    return db.guild.update({
      where: { id: guildId },
      data: {
        disabledCommands: isDisabled
          ? guild.disabledCommands.filter((cmd) => cmd !== commandName)
          : [...guild.disabledCommands, commandName],
      },
    });
  }

  async getSettings(guildId: string) {
    return db.guildSettings.findUnique({
      where: { guildId },
    });
  }

  async updateSettings(guildId: string, data: Prisma.GuildSettingsUpdateInput) {
    return db.guildSettings.upsert({
      where: { guildId },
      update: data,
      create: {
        guildId,
        ...data,
      },
    });
  }
}
