import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  ContainerBuilder,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
  TextDisplayBuilder,
} from "discord.js";
import { LoadType, LavalinkResponse } from "shoukaku";
import type { ExtendedClient } from "../../../types/ExtendedClient";
import { LavalinkUnavailableError } from "../../music/MusicManager";
import { inPlayerVoiceChannel } from "../../music/musicInteractions";
import { shortText, trackColor, trackTitle } from "../../music/track";
import { formatTime } from "../../../utils/formatTime";

export default {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription(
      "Play a song or playlist; type a title for search suggestions.",
    )
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("Song title or YouTube, Spotify, SoundCloud URL")
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async autocomplete(interaction: AutocompleteInteraction) {
    const query = interaction.options.getFocused().trim();
    if (query.length < 2 || /^https?:\/\//i.test(query)) {
      await interaction.respond([]);
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      // Autocomplete cannot be deferred; leave enough of Discord's 3 seconds to respond.
      const result = await Promise.race([
        (interaction.client as ExtendedClient).musicManager.search(query),
        new Promise<null>((resolve) => {
          timer = setTimeout(() => resolve(null), 1800);
        }),
      ]);
      const tracks = result?.loadType === LoadType.SEARCH ? result.data : [];
      const unique = [
        ...new Map(
          tracks
            .filter((track) => track.info.uri && track.info.uri.length <= 100)
            .map((track) => [track.info.uri!, track]),
        ).values(),
      ];
      await interaction.respond(
        unique.slice(0, 10).map((track) => ({
          name: shortText(`${track.info.title} — ${track.info.author}`),
          value: track.info.uri!,
        })),
      );
    } catch {
      await interaction.respond([]).catch(() => {});
    } finally {
      if (timer) clearTimeout(timer);
    }
  },

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    if (
      !interaction.guild ||
      !interaction.guildId ||
      !(interaction.channel instanceof TextChannel)
    ) {
      await interaction.editReply("Use /play in a server text channel.");
      return;
    }
    const voice = await interaction.guild.voiceStates
      .fetch(interaction.user.id, { force: true })
      .catch(() => null);
    if (!voice?.channel) {
      await interaction.editReply("Join a voice channel to play music.");
      return;
    }
    const manager = (interaction.client as ExtendedClient).musicManager;
    const existing = manager.queues.get(interaction.guildId);
    if (existing && !(await inPlayerVoiceChannel(interaction, existing))) {
      await interaction.editReply(
        "You must join my voice channel to add music.",
      );
      return;
    }
    const query = interaction.options.getString("query", true).trim();
    if (
      /^(?:https?:\/\/)?open\.spotify\.com\//i.test(query) &&
      (!process.env.SPOTIFY_CLIENT_ID?.trim() ||
        !process.env.SPOTIFY_CLIENT_SECRET?.trim())
    ) {
      await interaction.editReply(
        "Spotify is not configured. Try a YouTube or SoundCloud link.",
      );
      return;
    }
    let result: LavalinkResponse;
    try {
      result = await manager.search(query);
    } catch (error) {
      if (!(error instanceof LavalinkUnavailableError)) throw error;
      await interaction.editReply(
        "The music service is reconnecting. Please try again shortly.",
      );
      return;
    }
    const tracks =
      result.loadType === LoadType.TRACK
        ? [result.data]
        : result.loadType === LoadType.SEARCH
          ? result.data.slice(0, 1)
          : result.loadType === LoadType.PLAYLIST
            ? result.data.tracks
            : [];
    if (!tracks.length) {
      await interaction.editReply(
        "I couldn't find playable tracks for that query.",
      );
      return;
    }
    const queue = manager.getQueue(interaction.guildId);
    await queue.runExclusive(async () => {
      // Recheck after resolving the search: another request may have connected the bot.
      const freshVoice = await interaction
        .guild!.voiceStates.fetch(interaction.user.id, { force: true })
        .catch(() => null);
      if (
        !freshVoice?.channel ||
        (queue.player && !(await inPlayerVoiceChannel(interaction, queue)))
      ) {
        await interaction.editReply(
          "Join my voice channel before adding music.",
        );
        if (!queue.player) await queue.destroy();
        return;
      }
      if (!queue.textChannel)
        queue.textChannel = interaction.channel as TextChannel;
      await queue.connect(freshVoice.channel);
      const position = queue.tracks.length + 1;
      const wait = queue.remainingMs;
      const timing =
        queue.loopMode === "track" && queue.currentTrack
          ? "wait depends on track loop"
          : wait === null
            ? "wait unknown (live stream)"
            : `plays in ~${formatTime(wait)}${queue.isPaused ? " after resume" : ""}`;
      queue.addTracks(tracks, interaction.user.id);
      const card = new ContainerBuilder()
        .setAccentColor(trackColor(tracks[0]))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### Added to queue${tracks.length > 1 ? ` · ${tracks.length} tracks` : ""}\n**${trackTitle(tracks[0])}**\n${queue.isPlaying ? `#${position} in queue · ${timing}` : "Starting playback"}`,
          ),
        );
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [card],
        allowedMentions: { parse: [] },
      });
      if (!queue.isPlaying) await queue.play();
      else await queue.updateNowPlayingMessage();
    });
  },
};
