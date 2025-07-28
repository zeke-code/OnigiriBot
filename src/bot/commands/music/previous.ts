import {
  SlashCommandBuilder,
  EmbedBuilder,
  InteractionContextType,
} from "discord.js";
import { GuildQueue, useQueue } from "discord-player";
import logger from "../../../utils/logger";
import { validateMusicInteraction } from "../../../utils/music/validateMusicInteraction";
import { QueueMetadata } from "../../../types/QueueMetadata";

export default {
  data: new SlashCommandBuilder()
    .setName("back")
    .setContexts([InteractionContextType.Guild])
    .setDescription("Plays the previous song in the playlist!"),

  async execute(interaction: any) {
    const queue: GuildQueue<QueueMetadata> | null = useQueue(
      interaction.guildId
    );
    if (!queue) {
      await interaction.reply({
        content: "There doesn't seem to be any active playlist in this server.",
        ephemeral: true,
      });
      return;
    }
    const validation = await validateMusicInteraction(interaction, queue, {
      requireQueue: true,
    });
    if (!validation) return;

    const previousTracks = queue.history.tracks.toArray();
    if (!previousTracks[0]) {
      return interaction.reply({
        content: "There isn't any track history for this playlist.",
        ephemeral: true,
      });
    }

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
        `**${interaction.member}** pressed the previous button. Now playing **${previousTracks[0].title}** by **${previousTracks[0].author}**`
      )
      .setThumbnail(previousTracks[0].thumbnail)
      .setColor("DarkRed");

    try {
      await queue.history.back();
      return await interaction.reply({ embeds: [embed] });
    } catch (e) {
      await interaction.reply({
        content:
          "There was a problem trying to go to the previous song in the playlist. Try again later.",
        ephemeral: true,
      });
      logger.error(
        `There was a problem trying to use previous command in guild ${interaction.guildId}: ${e}`
      );
    }
  },
};
