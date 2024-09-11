const { useMainPlayer } = require("discord-player");
const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const logger = require("../../utils/logger");
const player = useMainPlayer();

let embedMessageId = null;

const createButton = (
  customId,
  label,
  emoji,
  style = ButtonStyle.Secondary
) => {
  return new ButtonBuilder()
    .setCustomId(customId)
    .setStyle(style)
    .setLabel(label)
    .setEmoji(emoji);
};

try {
  player.events.on("playerStart", async (queue, track) => {
    try {
      const buttons = [
        { customId: "previous", label: "Previous", emoji: "⏮️" },
        { customId: "pauseresume", label: "Pause/Resume", emoji: "⏯️" },
        { customId: "skip", label: "Skip", emoji: "⏭️" },
        { customId: "stop", label: "Stop", emoji: "⏹️" },
        { customId: "shuffle", label: "Shuffle", emoji: "🔀" },
        { customId: "volume", label: "Volume", emoji: "🔊" },
      ];

      const row = new ActionRowBuilder().addComponents(
        buttons
          .slice(0, 5)
          .map(({ customId, label, emoji }) =>
            createButton(customId, label, emoji)
          )
      );

      const secondRow = new ActionRowBuilder().addComponents(
        buttons
          .slice(5)
          .map(({ customId, label, emoji }) =>
            createButton(customId, label, emoji)
          )
      );

      const embed = new EmbedBuilder()
        .setURL(track.url)
        .setTitle(`${track.title}`)
        .setAuthor({
          name: "OnigiriBot",
          iconURL: "https://i.ibb.co/bFJ5GC1/Oni-Avatar.png",
        })
        .addFields(
          {
            name: `Artist`,
            value: `${track.author}`,
            inline: true,
          },
          {
            name: `Now playing in ${queue.channel.name}`,
            value: `Requested by ${queue.metadata.requestedBy}`,
            inline: true,
          },
          { name: "Duration", value: track.duration, inline: true }
        )
        .setColor("#ffffff");

      if (track.thumbnail?.trim()) {
        embed.setThumbnail(track.thumbnail);
      }

      // Delete previous embed message if exists
      if (embedMessageId) {
        try {
          const message = await queue.metadata.channel.messages.fetch(
            embedMessageId
          );
          await message.delete();
        } catch (error) {
          logger.error("Error deleting the previous embed:", error);
        } finally {
          embedMessageId = null;
        }
      }

      // Send new embed message
      const sentMessage = await queue.metadata.channel.send({
        embeds: [embed],
        components: [row, secondRow],
      });
      embedMessageId = sentMessage.id;
    } catch (error) {
      logger.error("Error in playerStart event:", error);
    }
  });
} catch (error) {
  logger.error("Error setting up playerStart event listener:", error);
}
