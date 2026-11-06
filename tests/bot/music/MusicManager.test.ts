import { LoadType, type Track } from "shoukaku";
import { describe, expect, it, vi } from "vitest";
import { MusicManager } from "../../../src/bot/music/MusicManager";

function track(id: string): Track {
  return {
    encoded: id,
    pluginInfo: {},
    info: {
      identifier: id,
      title: id,
      author: "Artist",
      sourceName: "youtube",
      length: 100,
      position: 0,
      isStream: false,
      isSeekable: true,
    },
  };
}

describe("music search and related tracks", () => {
  it.each([
    ["a song", "ytsearch:a song"],
    ["https://example.com/song", "https://example.com/song"],
    ["scsearch:a song", "scsearch:a song"],
  ])("resolves %s", async (query, identifier) => {
    const resolve = vi
      .fn()
      .mockResolvedValue({ loadType: LoadType.EMPTY, data: {} });
    const manager = {
      shoukaku: { getIdealNode: () => ({ rest: { resolve } }) },
    };
    await MusicManager.prototype.search.call(
      manager as unknown as MusicManager,
      query,
    );
    expect(resolve).toHaveBeenCalledWith(identifier);
  });
  it("excludes the seed and recent history from YouTube recommendations", async () => {
    const search = vi
      .fn()
      .mockResolvedValue({
        loadType: LoadType.PLAYLIST,
        data: { tracks: [track("seed"), track("recent"), track("new")] },
      });
    const related = await MusicManager.prototype.relatedTrack.call(
      { search } as unknown as MusicManager,
      track("seed"),
      [track("recent")],
    );
    expect(related?.info.identifier).toBe("new");
    expect(search).toHaveBeenCalledWith(expect.stringContaining("list=RDseed"));
  });
  it("falls back to artist search when a mix has no new tracks", async () => {
    const search = vi
      .fn()
      .mockResolvedValueOnce({ loadType: LoadType.EMPTY, data: {} })
      .mockResolvedValueOnce({
        loadType: LoadType.SEARCH,
        data: [track("new")],
      });
    const related = await MusicManager.prototype.relatedTrack.call(
      { search } as unknown as MusicManager,
      track("seed"),
      [],
    );
    expect(related?.info.identifier).toBe("new");
    expect(search).toHaveBeenLastCalledWith("Artist music");
  });
});
