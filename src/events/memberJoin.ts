import { Events, GuildMember, TextChannel } from "discord.js";
import logger from "../utils/logger";

export default {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember): Promise<void> {
    const guild = member.guild;
    const channel = guild.systemChannel as TextChannel | null;
    const userId = member.id;
    const mention = `<@${userId}>`;

    if (channel) {
      await channel.send(`Hey, welcome to our server, ${mention}!`);
    } else
      logger.info(
        `Didn\'t find a system channel for guild ${guild}, not sending any welcome message.`
      );
  },
};
