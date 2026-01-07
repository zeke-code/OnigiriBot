import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  InteractionContextType,
  GuildMember,
} from "discord.js";
import { ExtendedClient } from "../../../types/ExtendedClient";
import { createShuffleEmbed } from "../../music/embedFactories";

export default {
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setContexts([InteractionContextType.Guild])
    .setDescription("Randomly shuffles the tracks in the queue."),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId || !(interaction.member instanceof GuildMember)) {
      return;
    }

    const client = interaction.client as ExtendedClient;
    const queue = client.musicManager.queues.get(interaction.guildId);

    if (!queue || queue.tracks.length < 2) {
      await interaction.reply({
        content: "There are not enough songs in the queue to shuffle.",
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
      queue.shuffle();

      const embed = createShuffleEmbed(client);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An error occurred while trying to shuffle the queue.",
        ephemeral: true,
      });
    }
  },
};
