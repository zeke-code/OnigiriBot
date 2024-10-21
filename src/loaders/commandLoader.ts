import fs from "fs";
import path from "path";
import { ExtendedClient } from "../types/ExtendedClient";
import { Command } from "../types/Command";

function loadCommands(client: ExtendedClient, commandsPath: string): void {
  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const commandsFolderPath = path.join(commandsPath, folder);
    const commandFiles = fs
      .readdirSync(commandsFolderPath)
      .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(commandsFolderPath, file);
      const command: Command | undefined =
        require(filePath).default || require(filePath);

      if (command && "data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
        );
      }
    }
  }
}

export default loadCommands;
