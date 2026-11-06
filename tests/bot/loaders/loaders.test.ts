import { EventEmitter } from "node:events";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { Collection, type Client } from "discord.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import loadCommands from "../../../src/bot/loaders/commandLoader";
import readEvents from "../../../src/bot/loaders/eventLoader";
import type { Command } from "../../../src/types/Command";
import type { ExtendedClient } from "../../../src/types/ExtendedClient";
import logger from "../../../src/utils/logger";

let fixtureRoot: string;

beforeEach(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), "onigiribot-loaders-"));
});

afterEach(() => {
  const target = resolve(fixtureRoot);
  if (
    dirname(target) !== resolve(tmpdir()) ||
    !basename(target).startsWith("onigiribot-loaders-")
  ) {
    throw new Error("Refusing to remove an unexpected fixture directory");
  }
  rmSync(target, { recursive: true, force: true });
});

function writeFixture(relativePath: string, source: string) {
  const filename = join(fixtureRoot, relativePath);
  mkdirSync(dirname(filename), { recursive: true });
  writeFileSync(filename, source);
}

describe("command loading", () => {
  it.each(["module.exports", "exports.default"])(
    "loads commands using %s from an absolute filesystem path",
    async (exportStyle) => {
      writeFixture(
        "fun/ping.js",
        `${exportStyle} = {
          data: { name: 'ping', description: 'Ping command' },
          execute(interaction) { interaction.executed = true; }
        };`,
      );
      const client = { commands: new Collection<string, Command>() };

      await loadCommands(client as ExtendedClient, fixtureRoot);

      expect([...client.commands.keys()]).toEqual(["ping"]);
      const interaction = { executed: false };
      await client.commands.get("ping")!.execute(interaction);
      expect(interaction.executed).toBe(true);
      expect(logger.error).not.toHaveBeenCalled();
    },
  );

  it("continues past broken or incomplete modules and ignores other files", async () => {
    writeFixture("fun/a-broken.js", "throw new Error('Broken command');");
    writeFixture("fun/b-incomplete.js", "module.exports = { data: {} };");
    writeFixture("fun/notes.txt", "This is not a JavaScript module.");
    writeFixture(
      "fun/ping.js",
      "module.exports = { data: { name: 'ping' }, execute() {} };",
    );
    const client = { commands: new Collection<string, Command>() };

    await loadCommands(client as ExtendedClient, fixtureRoot);

    expect([...client.commands.keys()]).toEqual(["ping"]);
    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.warn).toHaveBeenCalledOnce();
  });
});

describe("event loading", () => {
  it("loads nested events, supports both export styles, and forwards arguments", async () => {
    writeFixture(
      "guild/created.js",
      `exports.default = {
        name: 'guildCreated',
        execute(payload, value) { payload.value = value; }
      };`,
    );
    writeFixture(
      "message.js",
      `module.exports = {
        name: 'messageCreated',
        execute(payload) { payload.count += 1; }
      };`,
    );
    const client = new EventEmitter();

    await readEvents(client as Client, fixtureRoot);
    const payload = { value: "", count: 0 };
    client.emit("guildCreated", payload, "guild-a");
    client.emit("messageCreated", payload);
    client.emit("messageCreated", payload);

    expect(payload).toEqual({ value: "guild-a", count: 2 });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("registers once-only events so repeated emissions execute them once", async () => {
    writeFixture(
      "ready.js",
      `module.exports = {
        name: 'clientReady', once: true,
        execute(payload) { payload.count += 1; }
      };`,
    );
    const client = new EventEmitter();

    await readEvents(client as Client, fixtureRoot);
    const payload = { count: 0 };
    client.emit("clientReady", payload);
    client.emit("clientReady", payload);

    expect(payload.count).toBe(1);
  });

  it("continues loading events after a module throws during import", async () => {
    writeFixture("a-broken.js", "throw new Error('Broken event');");
    writeFixture("notes.txt", "This is not a JavaScript module.");
    writeFixture(
      "ready.js",
      "module.exports = { name: 'clientReady', execute() {} };",
    );
    const client = new EventEmitter();

    await readEvents(client as Client, fixtureRoot);

    expect(client.listenerCount("clientReady")).toBe(1);
    expect(logger.error).toHaveBeenCalledOnce();
  });
});
