import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  InteractionContextType,
  GuildMember,
} from "discord.js";
import { ExtendedClient } from "../../../types/ExtendedClient";

export default {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setContexts([InteractionContextType.Guild])
    .setDescription("Skips the current track."),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId || !(interaction.member instanceof GuildMember)) {
      return;
    }

    const client = interaction.client as ExtendedClient;
    const queue = client.musicManager.queues.get(interaction.guildId);

    if (!queue || !queue.isPlaying || !queue.currentTrack) {
      await interaction.reply({
        content: "There is nothing playing to skip.",
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
      const skippedTrackTitle = queue.currentTrack.info.title;

      await queue.skip();

      await interaction.reply(`⏭️ Skipped **${skippedTrackTitle}**.`);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An error occurred while trying to skip the track.",
        ephemeral: true,
      });
    }
  },
};
