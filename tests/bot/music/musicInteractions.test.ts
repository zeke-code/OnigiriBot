import { MessageFlags, type Interaction } from "discord.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import interactionCreate from "../../../src/bot/events/interactionCreate";

function fixture() {
  const queue = {
    sessionId: "session",
    destroyed: false,
    voiceChannel: { id: "old-voice" },
    nowPlayingMessage: { id: "card" },
    volume: 100,
    isPaused: true,
    updateNowPlayingMessage: vi.fn().mockResolvedValue(undefined),
    setVolume: vi.fn().mockResolvedValue(true),
    pause: vi.fn().mockResolvedValue(undefined),
    jump: vi.fn().mockResolvedValue(undefined),
    runExclusive: (action: () => Promise<void>) => action(),
  };
  const voiceFetch = vi.fn().mockResolvedValue({ channelId: "current-voice" });
  const interaction = {
    guildId: "guild",
    guild: { voiceStates: { fetch: voiceFetch } },
    user: { id: "user" },
    client: { musicManager: { queues: new Map([["guild", queue]]) } },
    customId: "music_volup",
    message: { id: "card", flags: { has: () => false } },
    isChatInputCommand: () => false,
    isAutocomplete: () => false,
    isButton: () => true,
    isStringSelectMenu: () => false,
    isRepliable: () => true,
    isMessageComponent: () => true,
    deferred: false,
    replied: false,
    deferUpdate: vi.fn().mockResolvedValue(undefined),
    followUp: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
  };
  return {
    queue,
    interaction,
    voiceFetch,
    dispatch: () =>
      interactionCreate.execute(interaction as unknown as Interaction),
  };
}

describe("central music controls", () => {
  afterEach(() => vi.useRealTimers());
  it("updates volume silently using fresh voice states, including a moved bot", async () => {
    const { queue, interaction, voiceFetch, dispatch } = fixture();
    await dispatch();
    expect(interaction.deferUpdate).toHaveBeenCalledOnce();
    expect(voiceFetch).toHaveBeenCalledWith("user", { force: true });
    expect(voiceFetch).toHaveBeenCalledWith("@me", { force: true });
    expect(queue.setVolume).toHaveBeenCalledWith(110);
    expect(interaction.reply).not.toHaveBeenCalled();
    expect(interaction.followUp).not.toHaveBeenCalled();
  });
  it("acknowledges before slow voice requests and rejects another channel privately", async () => {
    const { queue, interaction, voiceFetch, dispatch } = fixture();
    voiceFetch.mockImplementation(async (id: string) => {
      expect(interaction.deferUpdate).toHaveBeenCalledOnce();
      return { channelId: id === "@me" ? "a" : "b" };
    });
    await dispatch();
    expect(queue.setVolume).not.toHaveBeenCalled();
    expect(interaction.followUp).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
  });
  it("rejects stale cards without changing playback", async () => {
    const { queue, interaction, dispatch } = fixture();
    interaction.message.id = "old-card";
    await dispatch();
    expect(queue.setVolume).not.toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("no longer active"),
      }),
    );
  });
  it("still handles resume after a pause longer than the song", async () => {
    vi.useFakeTimers();
    const { queue, interaction, dispatch } = fixture();
    interaction.customId = "music_pause";
    vi.advanceTimersByTime(60 * 60 * 1000);
    await dispatch();
    expect(queue.pause).toHaveBeenCalledWith(false);
  });
  it("rejects an old session's menu even when the message is private", async () => {
    const { queue, interaction, dispatch } = fixture();
    interaction.customId = "music_jump:old-session";
    interaction.message.flags.has = () => true;
    await dispatch();
    expect(queue.jump).not.toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledOnce();
  });
});
