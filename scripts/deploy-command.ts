import "dotenv/config";
import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";

const commands = [];
const commandsPath = join(__dirname, "..", "src", "bot", "commands");
const commandFolders = readdirSync(commandsPath);

for (const folder of commandFolders) {
  if (folder === "base") continue;
  const folderPath = join(commandsPath, folder);
  const commandFiles = readdirSync(folderPath).filter((file) =>
    file.endsWith(".command.ts")
  );

  for (const file of commandFiles) {
    const command = require(join(folderPath, file)).default;
    const instance = new command();
    commands.push(instance.data.toJSON());
  }
}

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN!);

(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID!),
      { body: commands }
    );

    console.log(`Successfully reloaded commands.`);
  } catch (error) {
    console.error(error);
  }
})();
