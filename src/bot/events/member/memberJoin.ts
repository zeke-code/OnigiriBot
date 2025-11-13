import { Events, GuildMember, TextChannel, EmbedBuilder } from "discord.js";
import logger from "../../../utils/logger";
import { prisma } from "../../../services/database";

export default {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember): Promise<void> {
    const guild = member.guild;
    const guildId = member.guild.id;
    const channel = guild.systemChannel as TextChannel | null;
    const userId = member.id;
    const mention = `<@${userId}>`;

    const welcomeEmbed = new EmbedBuilder()
      .setColor("#ffffff")
      .setTitle("Welcome to the Server!")
      .setDescription(
        `${(await prisma.guild.findFirst({ where: { guildId: guildId } }))?.welcomeMessage || "We're glad to have you here!"}`,
      )
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: "Username", value: mention, inline: true },
        { name: "Member Count", value: `${guild.memberCount}`, inline: true },
      );

    if (channel) {
      await channel.send({ embeds: [welcomeEmbed] });
    } else {
      logger.info(
        `Didn't find a system channel for guild ${guild.name}, not sending any welcome message.`,
      );
    }
  },
};
