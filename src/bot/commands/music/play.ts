import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  TextChannel,
  InteractionContextType,
  MessageFlags,
} from "discord.js";
import { ExtendedClient } from "../../../types/ExtendedClient";
import { createMusicEmbed } from "../../music/musicEmbed";
import { Track, LoadType } from "shoukaku";
import { GuildQueue } from "../../music/GuildQueue";

export default {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play music by writing the link/name of a song/playlist!")
    .setContexts([InteractionContextType.Guild])
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("A song title or a URL (YouTube, Spotify, SoundCloud).")
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (
      !interaction.guildId ||
      !interaction.member ||
      !(interaction.member instanceof GuildMember)
    ) {
      return interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const client = interaction.client as ExtendedClient;
    const musicManager = client.musicManager;

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: "You need to be in a voice channel to play music!",
        flags: MessageFlags.Ephemeral,
      });
    }

    const node = musicManager.shoukaku.getIdealNode();
    if (!node) {
      return interaction.reply({
        content: "No available music node to process your request.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const query = interaction.options.getString("query", true);
    await interaction.deferReply();

    const result = await node.rest.resolve(query);
    if (
      !result ||
      result.loadType === LoadType.EMPTY ||
      result.loadType === LoadType.ERROR
    ) {
      return interaction.followUp({
        content: "I couldn't find any results for your query.",
      });
    }

    const queue: GuildQueue = musicManager.getQueue(interaction.guildId);
    queue.textChannel = interaction.channel as TextChannel;

    if (!queue.player) {
      await queue.connect(voiceChannel);
    }

    if (voiceChannel.id !== queue.voiceChannel?.id) {
      return interaction.followUp({
        content: "You must be in the same voice channel as me to add songs.",
      });
    }

    let tracks: Track[];
    let responseMessage: string;

    switch (result.loadType) {
      case LoadType.TRACK:
        tracks = [result.data];
        responseMessage = `Added **${tracks[0].info.title}** to the queue.`;
        break;
      case LoadType.SEARCH:
        tracks = [result.data[0]];
        responseMessage = `Added **${tracks[0].info.title}** to the queue.`;
        break;
      case LoadType.PLAYLIST:
        tracks = result.data.tracks;
        responseMessage = `Added **${tracks.length}** songs from playlist **${result.data.info.name}** to the queue.`;
        break;
      default: {
        const _exhaustiveCheck: never = result;
        return interaction.followUp({
          content: "I couldn't load this track or playlist.",
        });
      }
    }

    queue.addTracks(tracks);

    const embed = createMusicEmbed(interaction.client)
      .setTitle("✅ Music Queued")
      .setDescription(responseMessage);

    await interaction.followUp({ embeds: [embed] });

    if (!queue.isPlaying) {
      await queue.play();
    }
  },
};
