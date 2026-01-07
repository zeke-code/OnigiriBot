import fs from "fs";
import path from "path";
import { ExtendedClient } from "../../types/ExtendedClient";
import { Command } from "../../types/Command";
import logger from "../../utils/logger";

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
        const commandModule = await import(filePath);

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
