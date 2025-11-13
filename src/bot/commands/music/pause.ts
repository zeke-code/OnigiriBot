import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  InteractionContextType,
  GuildMember,
} from "discord.js";
import { ExtendedClient } from "../../../types/ExtendedClient";

export default {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setContexts([InteractionContextType.Guild])
    .setDescription("Pauses or resumes the current track."),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId || !(interaction.member instanceof GuildMember)) {
      return;
    }

    const client = interaction.client as ExtendedClient;
    const queue = client.musicManager.queues.get(interaction.guildId);

    if (!queue || !queue.isPlaying) {
      await interaction.reply({
        content: "There is nothing playing right now.",
        ephemeral: true,
      });
      return;
    }

    if (interaction.member.voice.channel?.id !== queue.voiceChannel?.id) {
      await interaction.reply({
        content:
          "You must be in the same voice channel as me to use this command.",
        ephemeral: true,
      });
      return;
    }

    try {
      const shouldPause = !queue.isPaused;
      await queue.pause(shouldPause);

      const replyMessage = shouldPause
        ? "⏸️ The player has been paused."
        : "▶️ The player has been resumed.";

      await interaction.reply(replyMessage);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content:
          "An error occurred while trying to toggle the player state. Please try again.",
        ephemeral: true,
      });
    }
  },
};
