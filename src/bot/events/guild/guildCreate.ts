import { Events, Guild, TextChannel } from "discord.js";
import { prisma } from "../../../services/database";

export default {
  name: Events.GuildCreate,
  async execute(guild: Guild): Promise<void> {
    const welcomeChannel = guild.channels.cache.find(
      (channel) =>
        channel.type === 0 && // TextChannel type
        channel.name.toLowerCase().includes("welcome"),
    ) as TextChannel | undefined;

    await prisma.guild.create({
      data: {
        guildId: guild.id,
        welcomeChannelId: welcomeChannel?.id,
      },
    });
  },
};
