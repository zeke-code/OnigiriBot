import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  InteractionContextType,
  GuildMember,
} from "discord.js";
import { ExtendedClient } from "../../../types/ExtendedClient";
import { createMusicEmbed } from "../../music/embedFactories";

export default {
  data: new SlashCommandBuilder()
    .setName("previous")
    .setContexts([InteractionContextType.Guild])
    .setDescription("Plays the previous song in the history."),

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
        content: "You must be in the same voice channel as me.",
        ephemeral: true,
      });
      return;
    }

    const previousTrack = await queue.previous();

    if (!previousTrack) {
      await interaction.reply({
        content: "There is no track history to go back to.",
        ephemeral: true,
      });
      return;
    }

    const embed = createMusicEmbed()
      .setTitle("⏮️ Playing Previous Track")
      .setDescription(
        `Now playing **[${previousTrack.info.title}](${previousTrack.info.uri})**.`,
      );

    await interaction.reply({ embeds: [embed] });
  },
};
