import { Collection, ComponentType, MessageFlags } from "discord.js";
import type { Track } from "shoukaku";
import { describe, expect, it } from "vitest";
import { GuildQueue } from "../../../src/bot/music/GuildQueue";
import type { MusicManager } from "../../../src/bot/music/MusicManager";
import {
  createNowPlayingCard,
  createQueueCard,
  createSessionSummary,
} from "../../../src/bot/music/musicComponents";
import {
  createMusicCommand,
  parseTimestamp,
} from "../../../src/bot/music/musicCommands";

function queueFixture(count = 30) {
  const queue = new GuildQueue(
    { queues: new Collection() } as unknown as MusicManager,
    "guild",
  );
  const track: Track = {
    encoded: "encoded",
    pluginInfo: {},
    info: {
      identifier: "id",
      title: "A song",
      author: "Artist",
      length: 180_000,
      isStream: false,
      isSeekable: true,
      position: 0,
      sourceName: "youtube",
      uri: "https://example.com/song",
      artworkUrl: "https://example.com/art.png",
    },
  };
  queue.addTracks(
    Array.from({ length: count + 1 }, (_, index) => ({
      ...track,
      info: { ...track.info, title: `Song ${index}` },
    })),
    "123456",
  );
  queue.currentTrack = queue.tracks.shift()!;
  return queue;
}

describe("Components V2 music cards", () => {
  it("serializes a V2 card with artwork, metadata and disabled no-op controls", () => {
    const queue = queueFixture();
    queue.endsAt = 123456;
    const payload = createNowPlayingCard(queue);
    const card = payload.components[0].toJSON();
    const serialized = JSON.stringify(card);
    expect(payload.flags).toBe(MessageFlags.IsComponentsV2);
    expect(payload).not.toHaveProperty("embeds");
    expect(payload.allowedMentions.parse).toEqual([]);
    expect(card.type).toBe(ComponentType.Container);
    expect(card.accent_color).toBe(0xff0000);
    expect(serialized).toContain("Requested by <@123456>");
    expect(serialized).toContain("<t:123456:R>");
    expect(serialized).toContain(
      '"custom_id":"music_previous","label":"⏮ Prev","style":2,"disabled":true',
    );
    const row = card.components.find(
      (item) =>
        item.type === ComponentType.ActionRow &&
        item.components[0].type === ComponentType.StringSelect,
    );
    expect(row?.type).toBe(ComponentType.ActionRow);
    if (
      row?.type === ComponentType.ActionRow &&
      row.components[0].type === ComponentType.StringSelect
    ) {
      expect(row.components[0].options).toHaveLength(25);
    }
  });

  it("allows jumping to tracks beyond the first 25 and clamps stale pages", () => {
    const queue = queueFixture();
    const card = createQueueCard(queue, 99).components[0].toJSON();
    const serialized = JSON.stringify(card);
    expect(serialized).toContain("Page 3 of 3");
    expect(serialized).toContain(queue.tracks[29].queueId);
    expect(serialized).not.toContain(queue.tracks[0].queueId);
    queue.tracks = [];
    expect(JSON.stringify(createQueueCard(queue, 2))).toContain(
      "queue is empty",
    );
    expect(JSON.stringify(createQueueCard(queue, 2))).not.toContain(
      "music_jump",
    );
  });

  it.each([
    ["youtube", 0xff0000],
    ["soundcloud", 0xff5500],
    ["spotify", 0x1db954],
  ] as const)("colours %s cards", (source, color) => {
    const queue = queueFixture(0);
    queue.currentTrack!.info.sourceName = source;
    expect(
      createNowPlayingCard(queue).components[0].toJSON().accent_color,
    ).toBe(color);
  });

  it("omits end times for paused/live playback and disables empty queue controls", () => {
    const queue = queueFixture(0);
    queue.isPaused = true;
    queue.volume = 150;
    const card = JSON.stringify(createNowPlayingCard(queue));
    expect(card).not.toContain("Ends <t:");
    expect(card).not.toContain("music_jump");
    expect(card).toContain("Paused");
    queue.isPaused = false;
    queue.currentTrack!.info.isStream = true;
    expect(JSON.stringify(createNowPlayingCard(queue))).toContain("LIVE");
    expect(JSON.stringify(createSessionSummary(queue))).not.toContain(
      "custom_id",
    );
  });
});

describe("music slash commands", () => {
  it.each([
    "queue",
    "nowplaying",
    "loop",
    "seek",
    "remove",
    "move",
    "clear",
    "autoplay",
  ] as const)("registers /%s as a guild command", (name) => {
    const data = createMusicCommand(name).data.toJSON();
    expect(data.name).toBe(name);
    expect(data.contexts).toEqual([0]);
  });
  it.each([
    ["90", 90000],
    ["1:30", 90000],
    ["1:01:02", 3662000],
    ["1:60", null],
    ["-1", null],
    ["1.5", null],
  ])("parses %s", (value, expected) => {
    expect(parseTimestamp(String(value))).toBe(expected);
  });
});
