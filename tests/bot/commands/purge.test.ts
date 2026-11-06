import type { ChatInputCommandInteraction } from "discord.js";
import { describe, expect, it, vi } from "vitest";
import purge from "../../../src/bot/commands/moderation/purge";

function createInteraction(amount: number) {
  const bulkDelete = vi.fn().mockResolvedValue({ size: amount });
  const interaction = {
    options: { get: () => ({ value: amount }) },
    channel: { bulkDelete },
    member: "<@moderator>",
    reply: vi.fn().mockResolvedValue(undefined),
  };

  return {
    interaction,
    bulkDelete,
    execute: () =>
      purge.execute(interaction as unknown as ChatInputCommandInteraction),
  };
}

describe("/purge", () => {
  it.each([-1, 0, 101])(
    "rejects an amount of %i without deleting messages",
    async (amount) => {
      const { interaction, bulkDelete, execute } = createInteraction(amount);

      await execute();

      expect(bulkDelete).not.toHaveBeenCalled();
      expect(interaction.reply).toHaveBeenCalledExactlyOnceWith({
        content: expect.stringContaining("between 1 and 100"),
        ephemeral: true,
      });
    },
  );

  it.each([1, 100])("accepts the boundary amount %i", async (amount) => {
    const { bulkDelete, execute } = createInteraction(amount);

    await execute();

    expect(bulkDelete).toHaveBeenCalledExactlyOnceWith(amount, true);
  });

  it("reports the actual deletion count when old messages are filtered out", async () => {
    const { interaction, bulkDelete, execute } = createInteraction(10);
    bulkDelete.mockResolvedValue({ size: 3 });

    await execute();

    expect(interaction.reply).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining("**3 recent messages**"),
    );
  });

  it("reports a Discord deletion failure privately", async () => {
    const { interaction, bulkDelete, execute } = createInteraction(10);
    bulkDelete.mockRejectedValue(new Error("Missing permissions"));

    await execute();

    expect(interaction.reply).toHaveBeenCalledExactlyOnceWith({
      content: expect.stringContaining("Something went wrong"),
      ephemeral: true,
    });
  });
});
