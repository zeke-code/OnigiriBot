import { useMainPlayer, GuildQueue, Player } from "discord-player";
import { EmbedBuilder } from "discord.js";
import logger from "../../../utils/logger";
import { QueueMetadata } from "../../../types/QueueMetadata";
import { createMusicEmbed } from "../../../utils/music/musicEmbed";

const player: Player | undefined = useMainPlayer();

if (player) {
  const handleQueueEnd = async (queue: GuildQueue<QueueMetadata>, reason: string) => {
    try {
      if (queue.metadata.nowPlayingMessage) {
        const finalEmbed = createMusicEmbed()
          .setColor("#ff5555")
          .setDescription(
            `${reason} See you next time!`
          );

        await queue.metadata.nowPlayingMessage.edit({
          embeds: [finalEmbed],
          components: [], // Pass an empty array to remove all buttons
        });

        queue.metadata.nowPlayingMessage = undefined;
      }
    } catch (e) {
      logger.error(`Error during queue end handling: ${e}`);
    }
  };

  player.events.on("disconnect", (queue: GuildQueue<QueueMetadata>) => {
    handleQueueEnd(queue, "The music has stopped and I have left the channel.");
  });

  player.events.on("emptyQueue", (queue: GuildQueue<QueueMetadata>) => {
    handleQueueEnd(queue, "The queue is now empty.");
  });
} else {
  logger.error("Player instance not available.");
}