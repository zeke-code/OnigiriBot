import {
  SlashCommandBuilder,
  EmbedBuilder,
  InteractionContextType,
} from "discord.js";
import { GuildQueue, useQueue } from "discord-player";
import logger from "../../../utils/logger";
import { validateMusicInteraction } from "../../../utils/music/validateMusicInteraction";
import { QueueMetadata } from "../../../types/QueueMetadata";
import { createMusicEmbed } from "../../../utils/music/musicEmbed";

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

    const embed = createMusicEmbed()
      .setFields({
        name: "Requested By",
        value: `${interaction.member}`,
        inline: true,
      })
      .setColor("Purple");

    try {
      if (queue.isShuffling) {
        queue.toggleShuffle();
        embed.setTitle(`🔀 Shuffle Mode Disabled`);
      } else {
        queue.toggleShuffle();
        embed.setTitle(`🔀 Shuffle Mode Enabled`);
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
