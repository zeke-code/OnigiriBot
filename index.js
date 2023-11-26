const path = require('node:path');
const logger = require('./src/utils/logger');
const {commandLoader} = require('./loaders/commandLoader');
const {eventLoader} = require('./loaders/eventLoader');
const {Client, Collection, GatewayIntentBits} = require('discord.js');
const {Player} = require('discord-player');
const loadCommands = require('./loaders/commandLoader');
const readEvents = require('./loaders/eventLoader');
require('dotenv').config({ path: path.resolve(__dirname, './config/.env')});

const discordToken = process.env.DISCORD_TOKEN;

const client = new Client({intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildWebhooks
]});
client.commands = new Collection();

const player = new Player(client, {
  ytdlOptions: {
    quality: 'highestaudio',
    filter: 'audioonly'
  }
});
player.extractors.loadDefault();

const commandsPath = path.join(__dirname, 'src', 'commands');
loadCommands(client, commandsPath);

const eventsPath = path.join(__dirname, 'src', 'events');
readEvents(client, eventsPath);


client.login(discordToken);
