import path from "node:path";
import { config } from "dotenv";
import connectToDatabase from "./services/database";
import client from "./bot/client";
import loadCommands from "./bot/loaders/commandLoader";
import readEvents from "./bot/loaders/eventLoader";
import { MusicManager } from "./bot/music/MusicManager";

config({ path: path.resolve(__dirname, "../.env") });
const discordToken: string | undefined = process.env.DISCORD_TOKEN;

if (!discordToken) {
  throw new Error("Discord token is missing in environment variables.");
}

connectToDatabase();

const commandsPath: string = path.join(__dirname, "bot/commands");
loadCommands(client, commandsPath);

const eventsPath: string = path.join(__dirname, "bot/events");
readEvents(client, eventsPath);

const musicManager = new MusicManager(client);
client.musicManager = musicManager;

client.login(discordToken);
