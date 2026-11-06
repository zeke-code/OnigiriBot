import fs from "fs";
import path from "path";
import { createRequire } from "node:module";
import { ExtendedClient } from "../../types/ExtendedClient";
import { Command } from "../../types/Command";
import logger from "../../utils/logger";

// Load CommonJS commands in both ts-node and the compiled bot.
const requireModule = createRequire(__filename);

async function loadCommands(
  client: ExtendedClient,
  commandsPath: string,
): Promise<void> {
  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const commandsFolderPath = path.join(commandsPath, folder);
    const commandFiles = fs
      .readdirSync(commandsFolderPath)
      .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(commandsFolderPath, file);

      try {
        const commandModule = requireModule(filePath);

        const command: Command | undefined =
          commandModule.default || commandModule;

        if (command && "data" in command && "execute" in command) {
          client.commands.set(command.data.name, command);
        } else {
          logger.warn(
            `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
          );
        }
      } catch (error) {
        logger.error(`Error loading command at ${filePath}:`, error);
      }
    }
  }
}

export default loadCommands;
