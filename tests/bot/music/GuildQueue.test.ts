import {
  Collection,
  type ButtonInteraction,
  type InteractionCollector,
  type Message,
  type TextChannel,
  type VoiceBasedChannel,
} from "discord.js";
import type { Player, Track } from "shoukaku";
import { describe, expect, it, vi } from "vitest";
import { GuildQueue } from "../../../src/bot/music/GuildQueue";
import type { MusicManager } from "../../../src/bot/music/MusicManager";

function track(id: string): Track {
  return {
    encoded: `encoded-${id}`,
    info: {
      identifier: id,
      title: `Track ${id}`,
      author: "Test artist",
      uri: `https://example.com/tracks/${id}`,
      length: 180_000,
      position: 0,
      isSeekable: true,
      isStream: false,
      sourceName: "youtube",
    },
    pluginInfo: {},
  };
}

function createQueue() {
  const player = {
    playTrack: vi.fn().mockResolvedValue(undefined),
    stopTrack: vi.fn().mockResolvedValue(undefined),
    setPaused: vi.fn().mockResolvedValue(undefined),
    setGlobalVolume: vi.fn().mockResolvedValue(undefined),
    on: vi.fn<
      (event: string, listener: (...args: unknown[]) => Promise<void>) => void
    >(),
  };
  const manager = {
    client: undefined,
    queues: new Collection<string, GuildQueue>(),
    shoukaku: {
      joinVoiceChannel: vi.fn().mockResolvedValue(player),
      leaveVoiceChannel: vi.fn().mockResolvedValue(undefined),
    },
  };
  const queue = new GuildQueue(manager as unknown as MusicManager, "guild-a");
  manager.queues.set(queue.guildId, queue);
  queue.player = player as unknown as Player;

  return { queue, manager, player };
}

describe("GuildQueue playback", () => {
  it("plays queued tracks in order and retains the remaining tracks", async () => {
    const { queue, player } = createQueue();
    const first = track("first");
    const second = track("second");
    queue.addTracks([first, second]);

    await queue.play();

    expect(player.playTrack).toHaveBeenCalledExactlyOnceWith({
      track: { encoded: first.encoded },
    });
    expect(queue.currentTrack).toEqual(first);
    expect(queue.tracks).toEqual([second]);
    expect(queue.isPlaying).toBe(true);

    await queue.handleTrackEnd();

    expect(player.playTrack).toHaveBeenLastCalledWith({
      track: { encoded: second.encoded },
    });
    expect(queue.currentTrack).toEqual(second);
    expect(queue.history).toEqual([first]);
    expect(queue.tracks).toEqual([]);
  });

  it("does not restart or consume another track while already playing", async () => {
    const { queue, player } = createQueue();
    const next = track("next");
    queue.currentTrack = track("current");
    queue.isPlaying = true;
    queue.addTracks([next]);

    await queue.play();

    expect(player.playTrack).not.toHaveBeenCalled();
    expect(queue.currentTrack).toEqual(track("current"));
    expect(queue.tracks).toEqual([next]);
  });

  it("does not attempt playback for an empty queue", async () => {
    const { queue, player } = createQueue();

    await queue.play();

    expect(player.playTrack).not.toHaveBeenCalled();
    expect(queue.isPlaying).toBe(false);
  });

  it("skips a track that fails to load and plays the next one", async () => {
    const { queue, player } = createQueue();
    queue.addTracks([track("broken"), track("working")]);
    player.playTrack.mockRejectedValueOnce(new Error("Track load failed"));

    await queue.play();

    expect(player.playTrack).toHaveBeenCalledTimes(2);
    expect(queue.currentTrack).toEqual(track("working"));
    expect(queue.isPlaying).toBe(true);
  });

  it("keeps only the latest 20 completed tracks in history", async () => {
    const { queue } = createQueue();
    const history = Array.from({ length: 20 }, (_, index) => track(`${index}`));
    queue.history = [...history];
    queue.currentTrack = track("latest");
    queue.addTracks([track("next")]);

    await queue.handleTrackEnd();

    expect(queue.history).toEqual([...history.slice(1), track("latest")]);
  });

  it("disconnects and removes the queue when the last track ends", async () => {
    const { queue, manager } = createQueue();
    queue.currentTrack = track("last");
    queue.isPlaying = true;

    await queue.handleTrackEnd();

    expect(queue.currentTrack).toBeNull();
    expect(queue.isPlaying).toBe(false);
    expect(queue.player).toBeNull();
    expect(manager.queues.has(queue.guildId)).toBe(false);
    expect(manager.shoukaku.leaveVoiceChannel).toHaveBeenCalledExactlyOnceWith(
      queue.guildId,
    );
  });

  it("skips the current track and advances after the stop event", async () => {
    const { queue, player } = createQueue();
    queue.currentTrack = track("current");
    queue.isPlaying = true;
    queue.addTracks([track("next")]);
    player.stopTrack.mockImplementationOnce(() => queue.handleTrackEnd());

    const skipped = await queue.skip();

    expect(skipped).toEqual(track("current"));
    expect(player.stopTrack).toHaveBeenCalledOnce();
    expect(queue.currentTrack).toEqual(track("next"));
  });

  it("replays the previous track without losing the interrupted track", async () => {
    const { queue, player } = createQueue();
    queue.history = [track("previous")];
    queue.currentTrack = track("current");
    queue.isPlaying = true;
    queue.addTracks([track("next")]);
    player.stopTrack.mockImplementationOnce(() => queue.handleTrackEnd());

    expect(await queue.previous()).toEqual(track("previous"));
    expect(queue.currentTrack).toEqual(track("previous"));
    expect(queue.tracks).toEqual([track("current"), track("next")]);
  });

  it("leaves playback alone when there is no previous track", async () => {
    const { queue, player } = createQueue();
    queue.currentTrack = track("current");
    queue.isPlaying = true;

    expect(await queue.previous()).toBeNull();
    expect(player.stopTrack).not.toHaveBeenCalled();
    expect(queue.currentTrack).toEqual(track("current"));
  });

  it("shuffles upcoming tracks without losing, duplicating, or replacing tracks", () => {
    const { queue } = createQueue();
    const upcoming = [track("a"), track("b"), track("c"), track("d")];
    queue.addTracks(upcoming);
    queue.currentTrack = track("current");
    vi.spyOn(Math, "random").mockReturnValue(0);

    queue.shuffle();

    expect(queue.tracks).not.toEqual(upcoming);
    expect(queue.tracks.map((item) => item.encoded).sort()).toEqual(
      upcoming.map((item) => item.encoded).sort(),
    );
    expect(queue.currentTrack).toEqual(track("current"));
    expect(queue.isShuffled).toBe(true);
  });

  it("pauses and resumes the player and tracks its state", async () => {
    const { queue, player } = createQueue();

    await queue.pause(true);
    expect(player.setPaused).toHaveBeenLastCalledWith(true);
    expect(queue.isPaused).toBe(true);

    await queue.pause(false);
    expect(player.setPaused).toHaveBeenLastCalledWith(false);
    expect(queue.isPaused).toBe(false);
  });

  it("preserves pause state when the player rejects the change", async () => {
    const { queue, player } = createQueue();
    player.setPaused.mockRejectedValue(new Error("Player disconnected"));

    await expect(queue.pause(true)).rejects.toThrow("Player disconnected");

    expect(queue.isPaused).toBe(false);
  });
});

describe("GuildQueue volume", () => {
  it.each([
    [-10, 0],
    [0, 0],
    [85, 85],
    [150, 150],
    [200, 150],
  ])("applies volume %i as %i", async (requested, expected) => {
    const { queue, player } = createQueue();

    expect(await queue.setVolume(requested)).toBe(true);
    expect(player.setGlobalVolume).toHaveBeenCalledExactlyOnceWith(expected);
    expect(queue.volume).toBe(expected);
  });

  it("preserves the previous volume if the player rejects the change", async () => {
    const { queue, player } = createQueue();
    player.setGlobalVolume.mockRejectedValue(new Error("Player disconnected"));

    await expect(queue.setVolume(50)).rejects.toThrow("Player disconnected");

    expect(queue.volume).toBe(100);
  });

  it("does not change the volume when there is no connected player", async () => {
    const { queue, player } = createQueue();
    queue.player = null;

    expect(await queue.setVolume(50)).toBe(false);
    expect(player.setGlobalVolume).not.toHaveBeenCalled();
    expect(queue.volume).toBe(100);
  });
});

describe("GuildQueue lifecycle", () => {
  it("cleans up once when several callers destroy the same queue", async () => {
    const { queue, manager } = createQueue();
    const stop = vi.fn();
    const edit = vi.fn().mockResolvedValue(undefined);
    queue.collector = {
      stop,
    } as unknown as InteractionCollector<ButtonInteraction>;
    queue.nowPlayingMessage = { edit } as unknown as Message;
    queue.addTracks([track("next")]);
    queue.isPlaying = true;

    await Promise.all([queue.destroy(), queue.destroy(), queue.destroy()]);
    await queue.destroy();

    expect(stop).toHaveBeenCalledOnce();
    expect(edit).toHaveBeenCalledExactlyOnceWith({ components: [] });
    expect(manager.shoukaku.leaveVoiceChannel).toHaveBeenCalledOnce();
    expect(manager.queues.has(queue.guildId)).toBe(false);
    expect(queue.tracks).toEqual([]);
    expect(queue.isPlaying).toBe(false);
    expect(queue.player).toBeNull();
    expect(queue.collector).toBeNull();
    expect(queue.nowPlayingMessage).toBeNull();
  });

  it("still disconnects if the now-playing message was deleted", async () => {
    const { queue, manager } = createQueue();
    queue.nowPlayingMessage = {
      edit: vi.fn().mockRejectedValue(new Error("Unknown message")),
    } as unknown as Message;

    await expect(queue.destroy()).resolves.toBeUndefined();

    expect(manager.shoukaku.leaveVoiceChannel).toHaveBeenCalledOnce();
    expect(manager.queues.has(queue.guildId)).toBe(false);
  });

  it("still skips a broken track if Discord rejects the error notification", async () => {
    const { queue, player } = createQueue();
    const voiceChannel = {
      id: "voice-a",
      guild: { shardId: 0 },
    } as VoiceBasedChannel;
    queue.player = null;
    await queue.connect(voiceChannel);
    const send = vi.fn().mockRejectedValue(new Error("Missing permissions"));
    queue.textChannel = { send } as unknown as TextChannel;
    const onException = player.on.mock.calls.find(
      ([event]) => event === "exception",
    )?.[1];
    expect(onException).toBeDefined();

    await onException!(new Error("Lavalink track failed"));

    expect(send).toHaveBeenCalledOnce();
    expect(player.stopTrack).toHaveBeenCalledOnce();
  });
});
