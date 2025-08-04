import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonInteraction,
  InteractionContextType,
} from "discord.js";
import { GuildQueue, useQueue } from "discord-player";
import logger from "../../../utils/logger";
import { validateMusicInteraction } from "../../../utils/music/validateMusicInteraction";
import { QueueMetadata } from "../../../types/QueueMetadata";
import { createMusicEmbed } from "../../../utils/music/musicEmbed";

export default {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setContexts([InteractionContextType.Guild])
    .setDescription("Pauses/unpauses the music player!"),

  async execute(
    interaction: ChatInputCommandInteraction | ButtonInteraction
  ): Promise<void> {
    const guildId = interaction.guildId!;
    const queue: GuildQueue<QueueMetadata> | null = useQueue(guildId);

    if (!queue) {
      await interaction.reply({
        content: "There doesn't seem to be any active playlist in this server.",
        ephemeral: true,
      });
      return;
    }

    const validation = await validateMusicInteraction(interaction, queue, {
      requireQueue: true,
      requirePlaying: true,
      requireBotInChannel: true,
    });
    if (!validation) return;

    const { member } = validation;

    await interaction.deferReply();

    try {
      const action = queue.node.isPaused() ? "unpaused" : "paused";
      const statusEmoji = queue.node.isPaused() ? "▶️" : "⏸️";
      queue.node.isPaused() ? queue.node.resume() : queue.node.pause();

      const embed = createMusicEmbed()
        .setTitle(`${statusEmoji} Music Player ${action}`)
        .addFields({  
          name: "Requested by",
          value: `${member}`,
          inline: true,
        })
        .setColor("LightGrey");

      await interaction.followUp({ embeds: [embed] });
    } catch (e) {
      await interaction.followUp({
        content:
          "Something went wrong while trying to pause the player. Try again.",
        ephemeral: true,
      });
      logger.error(
        `Error in 'pause' command in guild ${interaction.guildId}: ${e}`
      );
    }

    return;
  },
};
