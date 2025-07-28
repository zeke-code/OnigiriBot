import {
  SlashCommandBuilder,
  EmbedBuilder,
  InteractionContextType,
} from "discord.js";
import { GuildQueue, useQueue } from "discord-player";
import logger from "../../../utils/logger";
import { validateMusicInteraction } from "../../../utils/music/validateMusicInteraction";
import { QueueMetadata } from "../../../types/QueueMetadata";

export default {
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setContexts([InteractionContextType.Guild])
    .setDescription("Shuffles the current playlist!"),

  async execute(interaction: any) {
    const queue: GuildQueue<QueueMetadata> | null = useQueue(
      interaction.guildId
    );
    if (!queue) {
      return await interaction.reply({
        content: "There is no active playlist in this server.",
        ephemeral: true,
      });
    }

    const validation = await validateMusicInteraction(interaction, queue, {
      requireQueue: true,
      requirePlaying: true,
      requireBotInChannel: true,
    });
    if (!validation) return;

    const userAvatar = interaction.member.displayAvatarURL({
      dynamic: true,
      size: 1024,
    });

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${interaction.member.user.displayName}`,
        iconURL: userAvatar,
      })
      .setColor("Purple");

    try {
      if (queue.isShuffling) {
        queue.toggleShuffle();
        embed.setDescription(`${interaction.member} disabled shuffle mode!`);
      } else {
        queue.toggleShuffle();
        embed.setDescription(`${interaction.member} enabled shuffle mode!`);
      }

      return await interaction.reply({ embeds: [embed] });
    } catch (e) {
      logger.error(
        `Something went wrong while trying to toggle shuffle in guild ${interaction.guildId}: ${e}`
      );
      return await interaction.reply({
        content:
          "Something went wrong while trying to toggle shuffle. Try again!",
      });
    }
  },
};
