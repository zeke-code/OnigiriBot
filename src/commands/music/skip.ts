import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { useQueue } from "discord-player";
import logger from "../../utils/logger";

export default {
  data: new SlashCommandBuilder()
    .setName("skip")
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

    try {
      queue.node.skip();
      if (queue.isEmpty()) queue.delete();

      const userAvatar = interaction.member.displayAvatarURL({
        dynamic: true,
        size: 1024,
      });

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${interaction.member.user.displayName}`,
          iconURL: userAvatar,
        })
        .setDescription(
          `**${interaction.member}** skipped **${
            currentTrack?.title || "a song"
          }**`
        )
        .setColor("DarkRed");

      if (currentTrack?.thumbnail && currentTrack.thumbnail.trim() !== "") {
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
