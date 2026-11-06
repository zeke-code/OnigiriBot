import {
  Collection,
  type Message,
  type TextChannel,
  type VoiceBasedChannel,
} from "discord.js";
import type { Player, Track } from "shoukaku";
import { afterEach, describe, expect, it, vi } from "vitest";
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
    seekTo: vi.fn().mockResolvedValue(undefined),
    on: vi.fn<
      (event: string, listener: (...args: unknown[]) => Promise<void>) => void
    >(),
  };
  const manager = {
    relatedTrack: vi.fn().mockResolvedValue(null),
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
      track: {
        encoded: first.encoded,
        userData: { onigiriPlaybackId: `${queue.sessionId}:1` },
      },
      paused: false,
    });
    expect(queue.currentTrack).toMatchObject(first);
    expect(queue.tracks).toMatchObject([second]);
    expect(queue.isPlaying).toBe(true);

    await queue.handleTrackEnd();

    expect(player.playTrack).toHaveBeenLastCalledWith({
      track: {
        encoded: second.encoded,
        userData: { onigiriPlaybackId: `${queue.sessionId}:2` },
      },
      paused: false,
    });
    expect(queue.currentTrack).toMatchObject(second);
    expect(queue.history).toMatchObject([first]);
    expect(queue.tracks).toMatchObject([]);
  });

  it("does not restart or consume another track while already playing", async () => {
    const { queue, player } = createQueue();
    const next = track("next");
    queue.currentTrack = track("current");
    queue.isPlaying = true;
    queue.addTracks([next]);

    await queue.play();

    expect(player.playTrack).not.toHaveBeenCalled();
    expect(queue.currentTrack).toMatchObject(track("current"));
    expect(queue.tracks).toMatchObject([next]);
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
    expect(queue.currentTrack).toMatchObject(track("working"));
    expect(queue.isPlaying).toBe(true);
  });

  it("keeps only the latest 20 completed tracks in history", async () => {
    const { queue } = createQueue();
    const history = Array.from({ length: 20 }, (_, index) => track(`${index}`));
    queue.history = [...history];
    queue.currentTrack = track("latest");
    queue.addTracks([track("next")]);

    await queue.handleTrackEnd();

    expect(queue.history).toMatchObject([...history.slice(1), track("latest")]);
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
    expect(queue.currentTrack).toMatchObject(track("next"));
  });

  it("replays the previous track without losing the interrupted track", async () => {
    const { queue, player } = createQueue();
    queue.history = [track("previous")];
    queue.currentTrack = track("current");
    queue.isPlaying = true;
    queue.addTracks([track("next")]);
    player.stopTrack.mockImplementationOnce(() => queue.handleTrackEnd());

    expect(await queue.previous()).toEqual(track("previous"));
    expect(queue.currentTrack).toMatchObject(track("previous"));
    expect(queue.tracks).toMatchObject([track("current"), track("next")]);
  });

  it("leaves playback alone when there is no previous track", async () => {
    const { queue, player } = createQueue();
    queue.currentTrack = track("current");
    queue.isPlaying = true;

    expect(await queue.previous()).toBeNull();
    expect(player.stopTrack).not.toHaveBeenCalled();
    expect(queue.currentTrack).toMatchObject(track("current"));
  });

  it("shuffles upcoming tracks without losing, duplicating, or replacing tracks", () => {
    const { queue } = createQueue();
    const upcoming = [track("a"), track("b"), track("c"), track("d")];
    queue.addTracks(upcoming);
    queue.currentTrack = track("current");
    vi.spyOn(Math, "random").mockReturnValue(0);

    queue.shuffle();

    expect(queue.tracks.map((item) => item.encoded)).not.toEqual(
      upcoming.map((item) => item.encoded),
    );
    expect(queue.tracks.map((item) => item.encoded).sort()).toEqual(
      upcoming.map((item) => item.encoded).sort(),
    );
    expect(queue.currentTrack).toMatchObject(track("current"));
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

describe("music session controls", () => {
  afterEach(() => vi.useRealTimers());

  it("freezes progress for long pauses and recalculates the countdown on resume and seek", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const { queue, player } = createQueue();
    queue.addTracks([track("a")], "requester");
    await queue.play();
    const initialEnd = queue.endsAt;
    vi.advanceTimersByTime(30_000);
    await queue.pause(true);
    expect(queue.positionMs).toBe(30_000);
    expect(queue.endsAt).toBeNull();
    vi.advanceTimersByTime(600_000);
    expect(queue.positionMs).toBe(30_000);
    await queue.pause(false);
    expect(queue.endsAt).toBe(initialEnd! + 600);
    await queue.setVolume(90);
    expect(queue.endsAt).toBe(initialEnd! + 600);
    await queue.seek(90_000);
    expect(player.seekTo).toHaveBeenCalledWith(90_000);
    expect(queue.positionMs).toBe(90_000);
    expect(queue.endsAt).toBe(Math.ceil(Date.now() / 1000) + 90);
    vi.advanceTimersByTime(10_000);
    await queue.destroy();
    expect(queue.listenedMs).toBe(40_000);
    expect(queue.playedTracks).toBe(1);
  });

  it.each(["track", "queue"] as const)(
    "implements %s loop without losing requester metadata",
    async (mode) => {
      const { queue } = createQueue();
      queue.loopMode = mode;
      const [first, next] = queue.addTracks(
        [track("a"), track("b")],
        "requester",
      );
      await queue.play();
      await queue.handleTrackEnd("finished");
      expect(queue.currentTrack).toEqual(mode === "track" ? first : next);
      expect(queue.tracks).toEqual([mode === "track" ? next : first]);
      expect(queue.currentTrack?.requestedBy).toBe("requester");
    },
  );

  it("skip overrides track loop; previous does not add the interrupted track to history", async () => {
    const { queue, player } = createQueue();
    queue.loopMode = "track";
    queue.addTracks([track("a"), track("b")]);
    await queue.play();
    player.stopTrack.mockImplementation(() => queue.handleTrackEnd("stopped"));
    await queue.skip();
    expect(queue.currentTrack?.info.identifier).toBe("b");
    await queue.previous();
    expect(queue.currentTrack?.info.identifier).toBe("a");
    expect(queue.history).toEqual([]);
    expect(queue.tracks.map((item) => item.info.identifier)).toEqual(["b"]);
  });

  it("does not loop failed tracks or treat replaced events as completed songs", async () => {
    const { queue } = createQueue();
    queue.loopMode = "queue";
    queue.addTracks([track("a"), track("b")]);
    await queue.play();
    await queue.handleTrackEnd("replaced");
    expect(queue.currentTrack?.info.identifier).toBe("a");
    await queue.handleTrackEnd("loadFailed");
    expect(queue.currentTrack?.info.identifier).toBe("b");
    expect(queue.tracks).toEqual([]);
  });

  it("uses stable queue IDs after moves and rejects removed selections", async () => {
    const { queue, player } = createQueue();
    const [first, second, third] = queue.addTracks(
      [track("a"), track("b"), track("c")],
      "123",
    );
    queue.move(3, 1);
    expect(queue.tracks).toEqual([third, first, second]);
    queue.remove(2);
    await expect(queue.jump(first.queueId!)).rejects.toThrow(
      "no longer queued",
    );
    expect(() => queue.move(0, 2)).toThrow("valid queue position");
    await queue.play();
    player.stopTrack.mockImplementation(() => queue.handleTrackEnd("stopped"));
    await queue.jump(second.queueId!);
    expect(queue.currentTrack).toEqual(second);
  });

  it("restores queue and history if previous fails to stop playback", async () => {
    const { queue, player } = createQueue();
    queue.history = [track("previous")];
    queue.addTracks([track("current"), track("next")]);
    await queue.play();
    const upcoming = [...queue.tracks];
    player.stopTrack.mockRejectedValue(new Error("Disconnected"));
    await expect(queue.previous()).rejects.toThrow("Disconnected");
    expect(queue.tracks).toEqual(upcoming);
    expect(queue.history).toEqual([track("previous")]);
  });

  it("rejects invalid seeks and treats live-stream wait time as unknown", async () => {
    const { queue, player } = createQueue();
    queue.addTracks([track("a")]);
    await queue.play();
    await expect(queue.seek(-1)).rejects.toThrow("duration");
    await expect(queue.seek(180_000)).rejects.toThrow("duration");
    queue.currentTrack!.info.isStream = true;
    expect(queue.remainingMs).toBeNull();
    await expect(queue.seek(1)).rejects.toThrow("cannot be seeked");
    expect(player.seekTo).not.toHaveBeenCalled();
  });

  it("autoplays a related track and stops cleanly when none are available", async () => {
    const { queue, manager } = createQueue();
    queue.autoplay = true;
    manager.relatedTrack.mockResolvedValueOnce(track("related"));
    queue.addTracks([track("seed")]);
    await queue.play();
    await queue.handleTrackEnd();
    expect(queue.currentTrack?.info.identifier).toBe("related");
    expect(queue.currentTrack?.requestedBy).toBeUndefined();
    await queue.handleTrackEnd();
    expect(queue.destroyed).toBe(true);
  });

  it("does not resurrect a session stopped during an autoplay lookup", async () => {
    const { queue, manager, player } = createQueue();
    queue.autoplay = true;
    queue.addTracks([track("seed")]);
    await queue.play();
    let resolve!: (track: Track) => void;
    manager.relatedTrack.mockReturnValue(
      new Promise<Track>((done) => {
        resolve = done;
      }),
    );
    const ending = queue.handleTrackEnd();
    await queue.destroy();
    resolve(track("related"));
    await ending;
    expect(player.playTrack).toHaveBeenCalledOnce();
    expect(queue.tracks).toEqual([]);
  });

  it.each([true, false])(
    "reuses a card near the bottom: %s",
    async (nearBottom) => {
      const { queue } = createQueue();
      const old = {
        id: "old",
        edit: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      };
      const replacement = { id: "new" };
      const send = vi.fn().mockResolvedValue(replacement);
      queue.nowPlayingMessage = old as unknown as Message;
      queue.textChannel = {
        send,
        messages: {
          fetch: vi
            .fn()
            .mockResolvedValue(new Map(nearBottom ? [["old", old]] : [])),
        },
      } as unknown as TextChannel;
      queue.addTracks([track("a")]);
      await queue.play();
      await queue.updateNowPlayingMessage(true);
      expect(old.delete).toHaveBeenCalledTimes(nearBottom ? 0 : 1);
      expect(send).toHaveBeenCalledTimes(nearBottom ? 0 : 1);
      expect(old.edit).toHaveBeenCalledTimes(nearBottom ? 1 : 0);
    },
  );

  it("cleans up the queue even when leaving voice fails", async () => {
    const { queue, manager } = createQueue();
    manager.shoukaku.leaveVoiceChannel.mockRejectedValue(
      new Error("Disconnected"),
    );
    await expect(queue.destroy()).rejects.toThrow("Disconnected");
    expect(manager.queues.has(queue.guildId)).toBe(false);
    expect(queue.player).toBeNull();
  });

  it("does not consume a second song while the first play request is in flight", async () => {
    const { queue, player } = createQueue();
    let finish!: () => void;
    player.playTrack.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    queue.addTracks([track("a"), track("b")]);
    const starting = queue.play();
    await queue.play();
    expect(queue.tracks.map((item) => item.info.identifier)).toEqual(["b"]);
    expect(player.playTrack).toHaveBeenCalledOnce();
    finish();
    await starting;
  });

  it("processes a fast loadFailed event arriving during a track transition", async () => {
    const { queue, player } = createQueue();
    queue.player = null;
    await queue.connect({
      id: "voice",
      guild: { shardId: 0 },
    } as VoiceBasedChannel);
    queue.addTracks([track("a"), track("b"), track("c")]);
    await queue.play();
    const onEnd = player.on.mock.calls.find(([event]) => event === "end")![1];
    let finish!: () => void;
    player.playTrack.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    const firstEnd = onEnd({ track: track("a"), reason: "finished" });
    await Promise.resolve();
    const failedEnd = onEnd({ track: track("b"), reason: "loadFailed" });
    finish();
    await Promise.all([firstEnd, failedEnd]);
    expect(queue.currentTrack?.info.identifier).toBe("c");
  });
});

describe("Lavalink track-change events", () => {
  async function connectedQueue() {
    const fixture = createQueue();
    fixture.queue.player = null;
    await fixture.queue.connect({
      id: "voice",
      guild: { shardId: 0 },
    } as VoiceBasedChannel);
    const onEnd = fixture.player.on.mock.calls.find(
      ([event]) => event === "end",
    )![1];
    const onStart = fixture.player.on.mock.calls.find(
      ([event]) => event === "start",
    )![1];
    return { ...fixture, onEnd, onStart };
  }

  function eventTrack(queue: GuildQueue, sequence: number, id: string) {
    return {
      ...track(id),
      // Lavalink serializes the track again at its current playback position.
      encoded: `reencoded-${id}-at-76000ms`,
      info: { ...track(id).info, position: 76_000 },
      userData: { onigiriPlaybackId: `${queue.sessionId}:${sequence}` },
    };
  }

  it("advances on a natural end whose encoded bytes differ from the queued track", async () => {
    const { queue, onEnd } = await connectedQueue();
    queue.addTracks([track("a"), track("b")]);
    await queue.play();
    await onEnd({ track: eventTrack(queue, 1, "a"), reason: "finished" });
    expect(queue.currentTrack?.info.identifier).toBe("b");
    expect(queue.history.map((item) => item.info.identifier)).toEqual(["a"]);
  });

  it("matches re-encoded legacy events by source and identifier", async () => {
    const { queue, onEnd } = await connectedQueue();
    queue.addTracks([track("a"), track("b")]);
    await queue.play();
    await onEnd({
      track: { ...track("a"), encoded: "changed" },
      reason: "finished",
    });
    expect(queue.currentTrack?.info.identifier).toBe("b");
  });

  it("completes consecutive jumps when stop succeeds without any end event", async () => {
    const { queue, player } = await connectedQueue();
    const [, , third, fourth] = queue.addTracks([
      track("a"),
      track("b"),
      track("c"),
      track("d"),
    ]);
    await queue.play();
    await queue.jump(third.queueId!);
    expect(queue.currentTrack).toEqual(third);
    await queue.jump(fourth.queueId!);
    expect(queue.currentTrack).toEqual(fourth);
    expect(queue.history.map((item) => item.info.identifier)).toEqual([
      "a",
      "c",
    ]);
    expect(player.stopTrack).toHaveBeenCalledTimes(2);
  });

  it("advances exactly once if the stop event arrives before its REST response", async () => {
    const { queue, player, onEnd } = await connectedQueue();
    const [, target] = queue.addTracks([track("a"), track("b"), track("c")]);
    await queue.play();
    player.stopTrack.mockImplementationOnce(() =>
      onEnd({ track: eventTrack(queue, 1, "a"), reason: "stopped" }),
    );
    await queue.jump(target.queueId!);
    expect(queue.currentTrack).toEqual(target);
    expect(queue.tracks.map((item) => item.info.identifier)).toEqual(["c"]);
    expect(player.playTrack).toHaveBeenCalledTimes(2);
  });

  it("ignores late end/start events for an earlier playback of the same song", async () => {
    const { queue, player, onEnd, onStart } = await connectedQueue();
    const [, target] = queue.addTracks([track("a"), track("a"), track("b")]);
    await queue.play();
    await queue.jump(target.queueId!);
    await queue.seek(50_000);
    const end = queue.endsAt;
    await onEnd({ track: eventTrack(queue, 1, "a"), reason: "stopped" });
    await onStart({ track: eventTrack(queue, 1, "a") });
    expect(queue.currentTrack).toEqual(target);
    expect(queue.endsAt).toBe(end);
    expect(player.playTrack).toHaveBeenCalledTimes(2);
    await onEnd({ track: eventTrack(queue, 2, "a"), reason: "finished" });
    expect(queue.currentTrack?.info.identifier).toBe("b");
  });

  it("restores a failed jump and allows retrying it", async () => {
    const { queue, player } = await connectedQueue();
    const [, , target] = queue.addTracks([track("a"), track("b"), track("c")]);
    await queue.play();
    const before = [...queue.tracks];
    player.stopTrack.mockRejectedValueOnce(new Error("Stop failed"));
    await expect(queue.jump(target.queueId!)).rejects.toThrow("Stop failed");
    expect(queue.tracks).toEqual(before);
    await queue.jump(target.queueId!);
    expect(queue.currentTrack).toEqual(target);
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
    const edit = vi.fn().mockResolvedValue(undefined);
    queue.nowPlayingMessage = { edit } as unknown as Message;
    queue.addTracks([track("next")]);
    queue.isPlaying = true;

    await Promise.all([queue.destroy(), queue.destroy(), queue.destroy()]);
    await queue.destroy();

    expect(edit).toHaveBeenCalledOnce();
    expect(JSON.stringify(edit.mock.calls[0][0])).toContain("Session ended");
    expect(manager.shoukaku.leaveVoiceChannel).toHaveBeenCalledOnce();
    expect(manager.queues.has(queue.guildId)).toBe(false);
    expect(queue.tracks).toMatchObject([]);
    expect(queue.isPlaying).toBe(false);
    expect(queue.player).toBeNull();
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

  it("waits for Lavalink's end event after an exception even if notification fails", async () => {
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
    expect(player.stopTrack).not.toHaveBeenCalled();
  });
});
