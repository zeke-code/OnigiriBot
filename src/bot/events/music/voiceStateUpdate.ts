import { Events, VoiceState } from "discord.js";
import { ExtendedClient } from "../../../types/ExtendedClient";
import logger from "../../../utils/logger";

export default {
  name: Events.VoiceStateUpdate,
  async execute(oldState: VoiceState, _newState: VoiceState) {
    // Ignore if the event is not a user leaving a channel
    if (!oldState.channel) {
      return;
    }

    const client = oldState.client as ExtendedClient;
    const queue = client.musicManager.queues.get(oldState.guild.id);

    // If there's no queue for this guild, the bot isn't playing music, so do nothing.
    if (!queue || !queue.voiceChannel) {
      return;
    }

    // Check if the event happened in the channel the bot is currently in.
    if (oldState.channel.id !== queue.voiceChannel.id) {
      return;
    }

    // Check the number of human members remaining in the voice channel.
    const humanMembers = oldState.channel.members.filter(
      (member) => !member.user.bot,
    ).size;

    if (humanMembers === 0) {
      logger.info(
        `Voice channel in guild ${oldState.guild.name} is empty. Destroying player and leaving channel.`,
      );
      await queue.destroy();
    }
  },
};
