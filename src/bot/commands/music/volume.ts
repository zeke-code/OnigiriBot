import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  InteractionContextType,
  GuildMember,
} from "discord.js";
import { ExtendedClient } from "../../../types/ExtendedClient";
import { createVolumeEmbed } from "../../music/embedFactories";

export default {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setContexts([InteractionContextType.Guild])
    .setDescription("Checks or changes the player's volume.")
    .addIntegerOption((option) =>
      option
        .setName("level")
        .setDescription("A number between 0 and 150 to set the volume.")
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(150),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId || !(interaction.member instanceof GuildMember)) {
      return;
    }

    const client = interaction.client as ExtendedClient;
    const queue = client.musicManager.queues.get(interaction.guildId);

    if (!queue || !queue.player) {
      await interaction.reply({
        content: "I'm not playing anything right now.",
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

    const newVolume = interaction.options.getInteger("level");

    if (newVolume === null) {
      const embed = createVolumeEmbed(client, queue.volume, false);
      await interaction.reply({ embeds: [embed] });
      return;
    }

    try {
      const oldVolume = queue.volume;
      await queue.setVolume(newVolume);
      const embed = createVolumeEmbed(
        client,
        newVolume,
        true,
        newVolume > oldVolume,
      );
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An error occurred while trying to set the volume.",
        ephemeral: true,
      });
    }
  },
};
