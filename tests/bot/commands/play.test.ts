import {
  TextChannel,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import { LoadType, type Track } from "shoukaku";
import { afterEach, describe, expect, it, vi } from "vitest";
import play from "../../../src/bot/commands/music/play";

const song: Track = {
  encoded: "encoded",
  pluginInfo: {},
  info: {
    identifier: "song",
    title: "Song",
    author: "Artist",
    uri: "https://example.com/song",
    sourceName: "youtube",
    length: 180000,
    position: 0,
    isStream: false,
    isSeekable: true,
  },
};

describe("/play autocomplete", () => {
  afterEach(() => vi.useRealTimers());
  function fixture() {
    const search = vi
      .fn()
      .mockResolvedValue({ loadType: LoadType.SEARCH, data: [song] });
    const interaction = {
      options: { getFocused: () => "song" },
      client: { musicManager: { search } },
      respond: vi.fn().mockResolvedValue(undefined),
    };
    return {
      search,
      interaction,
      run: () =>
        play.autocomplete(interaction as unknown as AutocompleteInteraction),
    };
  }
  it("suggests exact track URLs so picking a suggestion plays that result", async () => {
    const { run, interaction } = fixture();
    await run();
    expect(interaction.respond).toHaveBeenCalledWith([
      { name: "Song — Artist", value: song.info.uri },
    ]);
    expect(play.data.toJSON().options?.[0]).toMatchObject({
      autocomplete: true,
    });
  });
  it("responds within the autocomplete deadline when search is slow", async () => {
    vi.useFakeTimers();
    const { run, interaction, search } = fixture();
    search.mockReturnValue(new Promise(() => {}));
    const pending = run();
    await vi.advanceTimersByTimeAsync(1800);
    await pending;
    expect(interaction.respond).toHaveBeenCalledExactlyOnceWith([]);
  });
  it("returns no suggestions when Lavalink is offline", async () => {
    const { run, interaction, search } = fixture();
    search.mockRejectedValue(new Error("Disconnected"));
    await run();
    expect(interaction.respond).toHaveBeenCalledExactlyOnceWith([]);
  });
});

describe("/play enqueue", () => {
  it("keeps the requester and shows queue position and wait time in V2", async () => {
    const queue = {
      player: {},
      voiceChannel: { id: "voice" },
      isPlaying: true,
      isPaused: false,
      tracks: [song, song, song],
      remainingMs: 660000,
      loopMode: "off",
      textChannel: Object.create(TextChannel.prototype),
      runExclusive: (action: () => Promise<void>) => action(),
      connect: vi.fn().mockResolvedValue(undefined),
      addTracks: vi.fn(),
      updateNowPlayingMessage: vi.fn().mockResolvedValue(undefined),
    };
    const search = vi
      .fn()
      .mockResolvedValue({ loadType: LoadType.TRACK, data: song });
    const manager = {
      search,
      queues: new Map([["guild", queue]]),
      getQueue: () => queue,
    };
    const interaction = {
      guildId: "guild",
      guild: {
        voiceStates: {
          fetch: vi
            .fn()
            .mockResolvedValue({
              channelId: "voice",
              channel: { id: "voice" },
            }),
        },
      },
      channel: Object.create(TextChannel.prototype),
      user: { id: "user" },
      client: { musicManager: manager },
      options: { getString: () => song.info.uri },
      deferReply: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockResolvedValue(undefined),
    };
    await play.execute(interaction as unknown as ChatInputCommandInteraction);
    expect(search).toHaveBeenCalledWith(song.info.uri);
    expect(queue.addTracks).toHaveBeenCalledWith([song], "user");
    const payload = interaction.editReply.mock.calls[0][0];
    expect(payload).not.toHaveProperty("embeds");
    expect(JSON.stringify(payload)).toContain("#4 in queue · plays in ~11:00");
  });
});
