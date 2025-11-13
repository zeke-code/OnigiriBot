import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  InteractionContextType,
  GuildMember,
} from "discord.js";
import { ExtendedClient } from "../../../types/ExtendedClient";

export default {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setContexts([InteractionContextType.Guild])
    .setDescription(
      "Stops the music, clears the queue, and disconnects the bot.",
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId || !(interaction.member instanceof GuildMember)) {
      return;
    }

    const client = interaction.client as ExtendedClient;
    const queue = client.musicManager.queues.get(interaction.guildId);

    if (!queue) {
      await interaction.reply({
        content: "I'm not playing anything right now.",
        ephemeral: true,
      });
      return;
    }

    if (interaction.member.voice.channel?.id !== queue.voiceChannel?.id) {
      await interaction.reply({
        content:
          "You must be in the same voice channel as me to stop the music.",
        ephemeral: true,
      });
      return;
    }

    try {
      await queue.destroy();

      await interaction.reply(
        "⏹️ The music has been stopped and the queue has been cleared.",
      );
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An error occurred while trying to stop the player.",
        ephemeral: true,
      });
    }
  },
};
