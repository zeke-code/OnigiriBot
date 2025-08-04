import {
  SlashCommandBuilder,
  EmbedBuilder,
  InteractionContextType,
} from "discord.js";
import { useQueue } from "discord-player";
import logger from "../../../utils/logger";
import { createMusicEmbed } from "../../../utils/music/musicEmbed";

export default {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setContexts([InteractionContextType.Guild])
    .setDescription(
      "Makes me stop playing music and deletes current playlist!"
    ),

  async execute(interaction: any) {
    if (!interaction.member.voice.channelId) {
      return await interaction.reply({
        content: "You are not in a voice channel!",
        ephemeral: true,
      });
    }

    if (
      interaction.guild.members.me?.voice?.channelId &&
      interaction.member.voice.channelId !==
        interaction.guild.members.me.voice.channelId
    ) {
      return interaction.reply({
        content: "You are not in my voice channel!",
        ephemeral: true,
      });
    }

    const queue = useQueue(interaction.guildId);
    if (!queue) {
      return await interaction.reply({
        content: `I'm not playing music in this server!`,
        ephemeral: true,
      });
    }

    try {
      queue.node.stop();
      queue.delete();

      const embed = createMusicEmbed()
        .setTitle("⏹️ Music Player Stopped")
        .addFields({
          name: "Requested by",
          value: `${interaction.member}`,
          inline: true,
        })
        .setColor("#000000");

      await interaction.reply({ embeds: [embed] });
    } catch (e) {
      logger.error(
        `Something went wrong trying to stop player in guild ${interaction.guildId}: ${e}`
      );
      return await interaction.reply({
        content:
          "Something went wrong while trying to stop the music player. Try again later!",
        ephemeral: true,
      });
    }
  },
};
