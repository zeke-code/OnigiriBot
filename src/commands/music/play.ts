import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  TextChannel,
  VoiceChannel,
  InteractionContextType,
} from "discord.js";
import { useMainPlayer, QueryType, useQueue, GuildQueue } from "discord-player";
import { QueueMetadata } from "../../types/QueueMetadata";
import { validateMusicInteraction } from "../../utils/music/validateMusicInteraction";
import logger from "../../utils/logger";

export default {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play music by writing the link/name of a song/playlist!")
    .setContexts([InteractionContextType.Guild])
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription(
          "I'll search for a song/playlist based on your query (links, song title, lyrics...)!"
        )
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = useMainPlayer();
    let queue: GuildQueue<QueueMetadata> | null = useQueue(
      interaction.guildId!
    );

    const validation = await validateMusicInteraction(interaction, queue, {
      requireQueue: false,
      requireBotInChannel: false,
      requirePlaying: false,
    });
    if (!validation) return;

    const { member, voiceChannel } = validation;

    if (!queue) {
      queue = player.nodes.create<QueueMetadata>(interaction.guild!, {
        metadata: {
          voiceChannel: voiceChannel as VoiceChannel,
          textChannel: interaction.channel as TextChannel,
          requestedBy: member as GuildMember,
        },
      });
    }

    await interaction.deferReply();
    const query = interaction.options.getString("query", true);

    const result = await player
      .search(query, {
        searchEngine: QueryType.AUTO,
      })
      .catch((e) => {
        logger.error(`Error while trying to search ${query}: ${e}`);
        return null;
      });

    if (!result || !result.tracks.length) {
      return interaction.followUp({
        content: "Results not found for your request. Try again!",
        ephemeral: true,
      });
    }

    try {
      if (!queue.connection) {
        await queue.connect(voiceChannel);
      }
    } catch (e) {
      queue.delete();
      await interaction.followUp({
        content:
          "Something went wrong while trying to connect to your voice channel. Try again!",
        ephemeral: true,
      });
      logger.error(
        `Error while trying to connect to voice channel of guild ${interaction.guildId}: ${e}`
      );
      return;
    }

    try {
      queue.addTrack(result.playlist ? result.tracks : result.tracks[0]);
      logger.info(`Song enqueuing successful for ${query}`);
      if (!queue.isPlaying()) await queue.node.play();
    } catch (e) {
      logger.error(
        `Something went wrong while trying to use play command: ${e}`
      );
      return interaction.followUp({
        content:
          "Something went wrong while trying to queue your song. Try again in a bit.",
        ephemeral: true,
      });
    }

    const userAvatar = member.displayAvatarURL({ size: 1024 });

    const embed = new EmbedBuilder()
      .setAuthor({
        name: member.displayName,
        iconURL: userAvatar,
      })
      .setDescription(
        `**${interaction.user}** added **${
          result.playlist ? result.playlist.title : result.tracks[0].title
        }**`
      )
      .setColor("Blue");

    const thumbnailUrl = result.playlist
      ? result.playlist.thumbnail
      : result.tracks[0].thumbnail;

    if (thumbnailUrl && thumbnailUrl.trim() !== "") {
      embed.setThumbnail(thumbnailUrl);
    }

    await interaction.followUp({ embeds: [embed] });
  },
};
