import { REST, Routes } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import logger from "./logger";
import { config } from "dotenv";

config({ path: path.resolve(__dirname, "../../.env") });

const token: string | undefined = process.env.DISCORD_TOKEN;
const applicationId: string | undefined = process.env.APPLICATION_ID;

if (!token || !applicationId) {
  throw new Error(
    "Missing DISCORD_TOKEN or APPLICATION_ID in the environment variables."
  );
}

const commands: any[] = [];

const foldersPath = path.join(__dirname, "../bot/commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath).default || require(filePath);

    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON());
    } else {
      logger.warn(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    logger.info(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    const data: any = await rest.put(
      Routes.applicationCommands(applicationId),
      {
        body: commands,
      }
    );

    logger.info(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    logger.error(error);
  }
})();
