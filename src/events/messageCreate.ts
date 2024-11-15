import {
  Events,
  Message,
  TextChannel,
  NewsChannel,
  EmbedBuilder,
} from "discord.js";
import logger from "../utils/logger";
import User from "../database/models/User";
import Guild from "../database/models/Guild";

const bannedWords = ["badword1", "badword2", "badword3"];
const processedUsers = new Set<string>();

export default {
  name: Events.MessageCreate,
  async execute(message: Message): Promise<void> {
    if (message.author.bot || !message.guild) return;

    const foundBannedWord = bannedWords.find((word) =>
      message.content.toLowerCase().includes(word)
    );

    if (foundBannedWord && !processedUsers.has(message.author.id)) {
      processedUsers.add(message.author.id);
      await handleUserWarning(message, foundBannedWord);
      processedUsers.delete(message.author.id);
    }
  },
};

/**
 * Handles the warning system for users who send messages with banned words.
 * @param message - The message containing the banned word.
 * @param bannedWord - The banned word that triggered the warning.
 */
async function handleUserWarning(message: Message, bannedWord: string) {
  try {
    const guild = await Guild.findOneAndUpdate(
      { guildId: message.guild?.id },
      { guildName: message.guild?.name },
      { upsert: true, new: true }
    );

    // Check if user exists first to avoid duplicate key errors
    let user = await User.findOne({
      userId: message.author.id,
      guildId: guild._id,
    });
    if (!user) {
      user = new User({
        userId: message.author.id,
        guildId: guild._id,
        userName: message.author.username,
        warnings: 0,
        isBanned: false,
      });
    }

    user.warnings += 1;

    // If the user reaches 3 warnings, ban them
    if (user.warnings >= 3) {
      await message.member?.ban({ reason: `Banned for using banned words.` });
      user.isBanned = true;

      const banEmbed = new EmbedBuilder()
        .setColor("#ffffff")
        .setTitle("User Banned")
        .setDescription(
          `${message.author.username} has been banned for exceeding warnings.`
        )
        .setTimestamp();

      if (message.channel.isTextBased() && !message.channel.isDMBased()) {
        await (message.channel as TextChannel | NewsChannel).send({
          embeds: [banEmbed],
        });
      }
    } else {
      // If the user is warned but not banned, send a warning embed
      const warningEmbed = new EmbedBuilder()
        .setColor("#ffffff")
        .setTitle("Warning Issued")
        .setDescription(
          `${message.author.username}, you have used a banned word.`
        )
        .addFields({ name: "Warning Count", value: `${user.warnings}` })
        .setTimestamp();

      if (message.channel.isTextBased() && !message.channel.isDMBased()) {
        await (message.channel as TextChannel | NewsChannel).send({
          embeds: [warningEmbed],
        });
        await message.delete();
      }
    }

    await user.save();
  } catch (error: any) {
    logger.error(`Duplicate user entry error: ${error.message}`);
    logger.error(`Error handling user warning: ${error}`);
  }
}
