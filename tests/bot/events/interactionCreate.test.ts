import { MessageFlags, type Interaction } from "discord.js";
import { describe, expect, it, vi } from "vitest";
import interactionCreate from "../../../src/bot/events/interactionCreate";

function createInteraction() {
  const execute = vi.fn().mockResolvedValue(undefined);
  const interaction = {
    isChatInputCommand: () => true,
    isAutocomplete: () => false,
    isButton: () => false,
    isStringSelectMenu: () => false,
    isMessageComponent: () => false,
    isRepliable: () => true,
    commandName: "example",
    client: { commands: new Map([["example", { execute }]]) },
    deferred: false,
    replied: false,
    reply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
  };

  return {
    interaction,
    execute,
    dispatch: () =>
      interactionCreate.execute(interaction as unknown as Interaction),
  };
}

describe("interaction dispatch", () => {
  it("passes chat input interactions to the matching command", async () => {
    const { interaction, execute, dispatch } = createInteraction();
    await dispatch();

    expect(execute).toHaveBeenCalledExactlyOnceWith(interaction);
    expect(interaction.reply).not.toHaveBeenCalled();
  });

  it("ignores buttons and other non-command interactions", async () => {
    const { interaction, execute, dispatch } = createInteraction();
    interaction.isChatInputCommand = () => false;

    await dispatch();

    expect(execute).not.toHaveBeenCalled();
    expect(interaction.reply).not.toHaveBeenCalled();
  });

  it("handles unknown commands without throwing", async () => {
    const { interaction, execute, dispatch } = createInteraction();
    interaction.commandName = "unknown";

    await expect(dispatch()).resolves.toBeUndefined();

    expect(execute).not.toHaveBeenCalled();
    expect(interaction.reply).not.toHaveBeenCalled();
  });

  it("replies privately when a command fails before acknowledgement", async () => {
    const { interaction, execute, dispatch } = createInteraction();
    execute.mockRejectedValue(new Error("Command failed"));

    await dispatch();

    expect(interaction.reply).toHaveBeenCalledExactlyOnceWith({
      content: expect.stringContaining("Something went wrong"),
      flags: MessageFlags.Ephemeral,
    });
    expect(interaction.editReply).not.toHaveBeenCalled();
  });

  it("edits a deferred response instead of acknowledging it again", async () => {
    const { interaction, execute, dispatch } = createInteraction();
    interaction.deferred = true;
    execute.mockRejectedValue(new Error("Command failed"));

    await dispatch();

    expect(interaction.editReply).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        content: expect.stringContaining("Something went wrong"),
      }),
    );
    expect(interaction.reply).not.toHaveBeenCalled();
  });

  it("does not send a duplicate response after the command already replied", async () => {
    const { interaction, execute, dispatch } = createInteraction();
    interaction.replied = true;
    execute.mockRejectedValue(new Error("Failed after replying"));

    await dispatch();

    expect(interaction.reply).not.toHaveBeenCalled();
    expect(interaction.editReply).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "contains expired-interaction errors when deferred is %s",
    async (deferred) => {
      const { interaction, execute, dispatch } = createInteraction();
      interaction.deferred = deferred;
      execute.mockRejectedValue(new Error("Command failed"));
      interaction.reply.mockRejectedValue(new Error("Unknown interaction"));
      interaction.editReply.mockRejectedValue(new Error("Unknown interaction"));

      await expect(dispatch()).resolves.toBeUndefined();

      const response = deferred ? interaction.editReply : interaction.reply;
      expect(response).toHaveBeenCalledOnce();
    },
  );
});
