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
    const track = result.playlist ? result.playlist : result.tracks[0];
    const isPlaylist = !!result.playlist;
    const duration = result.tracks[0].duration;
    const formattedDuration = duration
      ? `\`${duration}\``
      : "`Unknown duration`";
    const url = track.url || "";

    const embed = new EmbedBuilder()
      .setTitle(
        isPlaylist ? "🎵 Playlist Added to Queue" : "🎵 Track Added to Queue"
      )
      .setDescription(
        `**${interaction.user}** added **[${track.title}](${url})**`
      )
      .addFields(
        {
          name: isPlaylist ? "Tracks" : "Duration",
          value: isPlaylist
            ? `\`${result.tracks.length} songs\``
            : formattedDuration,
          inline: true,
        },
        {
          name: "Position",
          value:
            queue.tracks.size > 0
              ? `\`#${queue.tracks.size}\``
              : "`Now Playing`",
          inline: true,
        }
      )
      .setColor("#FF5555")
      .setTimestamp()
      .setFooter({
        text: "Onigiri Music Player",
        iconURL: interaction.client.user.displayAvatarURL(),
      });

    const thumbnailUrl = track.thumbnail;
    if (thumbnailUrl && thumbnailUrl.trim() !== "") {
      embed.setThumbnail(thumbnailUrl);
    }

    await interaction.followUp({ embeds: [embed] });
  },
};
