import { SlashCommandBuilder, CommandInteraction, MessageFlags } from "discord.js";

const quotes: string[] = [
  "Every day may not be good, but there's something good in every day.",
  "Keep your face always toward the sunshine, and shadows will fall behind you.",
  "The only way to do great work is to love what you do.",
  "Happiness is not something ready made. It comes from your own actions.",
  "It's not how much we have, but how much we enjoy, that makes happiness.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "In a gentle way, you can shake the world.",
  "The more you praise and celebrate your life, the more there is in life to celebrate.",
  "You are never too old to set another goal or to dream a new dream.",
  "A positive attitude causes a chain reaction of positive thoughts, events, and outcomes.",
];

const talkCommand = {
  data: new SlashCommandBuilder()
    .setName("talk")
    .setDescription("Make me say something!"),

  async execute(interaction: CommandInteraction) {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    await interaction.reply({ content: randomQuote, flags: MessageFlags.Ephemeral });
  },
};

export default talkCommand;
