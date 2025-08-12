import { Events, GuildMember, TextChannel, EmbedBuilder } from "discord.js";
import logger from "../../../utils/logger";
import { prisma } from "../../../services/database";

export default {
    name: Events.GuildMemberRemove,
    async execute(member: GuildMember): Promise<void> {
        const guild = member.guild;
        const channel = guild.systemChannel as TextChannel | null;
        const mention = `<@${member.id}>`;

        const welcomeEmbed = new EmbedBuilder()
            .setColor("#ffffff")
            .setTitle("We will miss you!")
            .setDescription(`${(await prisma.guild.findFirst({ where: { guildId: guild.id } }))?.goodbyeMessage || "Goodbye!"}`)
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
              { name: "Username", value: mention, inline: true },
              { name: "Member Count", value: `${guild.memberCount}`, inline: true }
        );

        if (channel) {
            await channel.send({ embeds: [welcomeEmbed] });
        } else {
          logger.info(
            `Didn't find a system channel for guild ${guild.name}, not sending any goodbye message.`
          );
        }
    }
}