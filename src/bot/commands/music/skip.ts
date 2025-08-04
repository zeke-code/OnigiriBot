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
    .setName("skip")
    .setContexts([InteractionContextType.Guild])
    .setDescription("Skip the current track playing in the playlist!"),

  async execute(interaction: any) {
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
      return interaction.reply({
        content: "There doesn't seem to be any active playlist in this server.",
        ephemeral: true,
      });
    }

    const currentTrack = queue.currentTrack;
    const nextTrack = queue.tracks.at(0);

    try {
      queue.node.skip();
      if (queue.isEmpty()) queue.delete();

       const embed = createMusicEmbed()
        .setColor("DarkRed")
        .setTitle("⏭️ Track Skipped")
        .setDescription(
          `Successfully skipped **[${currentTrack?.title}](${currentTrack?.url})**.`
        );

      if (nextTrack) {
        embed.addFields({
          name: "Now Playing",
          value: `**[${nextTrack.title}](${nextTrack.url})**`,
          inline: true,
        });
      } else {
        embed.addFields({
          name: "Now Playing",
          value: "Nothing!",
          inline: true,
        });
        // If the queue is empty after skipping, it will be deleted by the disconnect event.
      }

      // We add the requested field after the others for style purposes.
      embed.addFields({
          name: "Requested by",
          value: `${interaction.member}`,
          inline: true,
        })

      if (currentTrack?.thumbnail) {
        embed.setThumbnail(currentTrack.thumbnail);
      }

      await interaction.reply({ embeds: [embed] });
    } catch (e) {
      logger.error(
        `Something went wrong while trying to skip a song in guild ${interaction.guildId}: ${e}`
      );
      return await interaction.reply({
        content:
          "Something went wrong while trying to skip the song. Try again later!",
        ephemeral: true,
      });
    }
  },
};
