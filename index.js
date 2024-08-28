const path = require("node:path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { Player } = require("discord-player");
const { YoutubeiExtractor } = require("discord-player-youtubei");
const loadCommands = require("./loaders/commandLoader");
const readEvents = require("./loaders/eventLoader");
const logger = require("./src/utils/logger");
require("dotenv").config();

const discordToken = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildWebhooks,
  ],
});
client.commands = new Collection();

client.on("debug", (message) => logger.debug(`Discord.js Debug: ${message}`));
client.on("warn", (message) => logger.warn(`Discord.js Warning: ${message}`));
client.on("error", (error) =>
  logger.error(`Discord.js Error: ${error.stack || error}`)
);

const player = new Player(client, {
  ytdlOptions: {
    quality: "highestaudio",
    filter: "audioonly",
  },
});
player.extractors.loadDefault();
player.extractors.register(YoutubeiExtractor);

const commandsPath = path.join(__dirname, "src", "commands");
loadCommands(client, commandsPath);

const eventsPath = path.join(__dirname, "src", "events");
readEvents(client, eventsPath);

client.login(discordToken);
