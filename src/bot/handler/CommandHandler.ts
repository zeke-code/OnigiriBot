import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { BotClient } from "../client/BotClient";
import { Command } from "../commands/base/Command";

export class CommandHandler {
  private client: BotClient;
  private rest: REST;

  constructor(client: BotClient) {
    this.client = client;
    this.rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN!);
  }

  public async loadCommands() {
    const commandsPath = join(__dirname, "..", "commands");
    const commandFolders = readdirSync(commandsPath);

    for (const folder of commandFolders) {
      if (folder === "base") continue;

      const folderPath = join(commandsPath, folder);
      const commandFiles = readdirSync(folderPath).filter(
        (file) => file.endsWith(".command.ts") || file.endsWith(".command.js")
      );

      for (const file of commandFiles) {
        const filePath = join(folderPath, file);
        const CommandClass = require(filePath).default;

        if (CommandClass && CommandClass.prototype instanceof Command) {
          const command = new CommandClass();
          this.client.commands.set(command.data.name, command);
          this.client.logger.info(`Loaded command: ${command.data.name}`);
        }
      }
    }

    await this.deployCommands();
  }

  private async deployCommands() {
    try {
      const commands = Array.from(this.client.commands.values()).map((cmd) =>
        cmd.data.toJSON()
      );

      await this.rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
        body: commands,
      });

      this.client.logger.info(`Deployed ${commands.length} commands`);
    } catch (error) {
      this.client.logger.error("Failed to deploy commands", error);
    }
  }
}
