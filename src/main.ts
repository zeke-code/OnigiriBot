import path from "node:path";
import { ExtendedClient } from "./types/ExtendedClient";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import { Player, PlayerInitOptions } from "discord-player";
import { YoutubeiExtractor } from "discord-player-youtubei";
import loadCommands from "./loaders/commandLoader";
import readEvents from "./loaders/eventLoader";
import connectToDatabase from "./database/database";
import { config } from "dotenv";

config({ path: path.resolve(__dirname, "../.env") });
const discordToken: string | undefined = process.env.DISCORD_TOKEN;

if (!discordToken) {
  throw new Error("Discord token is missing in environment variables.");
}

const client: ExtendedClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildWebhooks,
  ],
}) as ExtendedClient;

client.commands = new Collection<string, any>();

connectToDatabase();

const player = new Player(client, {
  ytdlOptions: {
    quality: "highestaudio",
    filter: "audioonly",
  },
} as PlayerInitOptions);
player.extractors.loadDefault();
player.extractors.register(YoutubeiExtractor, undefined);

const commandsPath: string = path.join(__dirname, "commands");
loadCommands(client, commandsPath);

const eventsPath: string = path.join(__dirname, "events");
readEvents(client, eventsPath);

client.login(discordToken);
