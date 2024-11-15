import {
  ChatInputCommandInteraction,
  GuildMember,
  VoiceBasedChannel,
  TextChannel,
  ButtonInteraction,
} from "discord.js";
import { GuildQueue } from "discord-player";
import { QueueMetadata } from "../../types/QueueMetadata";

interface ValidationOptions {
  requireQueue?: boolean;
  requirePlaying?: boolean;
  requireBotInChannel?: boolean;
}

export async function validateMusicInteraction(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  queue: GuildQueue<QueueMetadata> | null,
  options: ValidationOptions = {
    requireQueue: true,
    requirePlaying: false,
    requireBotInChannel: true,
  }
): Promise<{ member: GuildMember; voiceChannel: VoiceBasedChannel } | null> {
  if (!interaction.guild || !interaction.member) {
    await interaction.reply({
      content: "This command can only be used in a server (guild).",
      ephemeral: true,
    });
    return null;
  }

  let member: GuildMember;

  if (interaction.member instanceof GuildMember) {
    member = interaction.member;
  } else {
    try {
      member = await interaction.guild.members.fetch(interaction.user.id);
    } catch {
      await interaction.reply({
        content: "Could not fetch your member data.",
        ephemeral: true,
      });
      return null;
    }
  }

  const voiceChannel = member.voice.channel;

  if (!voiceChannel) {
    await interaction.reply({
      content:
        "You need to be connected to a voice channel to use this command.",
      ephemeral: true,
    });
    return null;
  }

  const botMember = interaction.guild.members.me;
  if (!botMember) {
    await interaction.reply({
      content: "Could not access the bot's voice channel.",
      ephemeral: true,
    });
    return null;
  }

  if (options.requireBotInChannel) {
    const botVoiceChannelId = botMember.voice?.channelId;
    if (botVoiceChannelId && voiceChannel.id !== botVoiceChannelId) {
      await interaction.reply({
        content: "You are not in my voice channel!",
        ephemeral: true,
      });
      return null;
    }
  }

  if (options.requireQueue && !queue) {
    await interaction.reply({
      content: "There doesn't seem to be any active playlist in this server.",
      ephemeral: true,
    });
    return null;
  }

  if (queue && queue.metadata?.textChannel.id !== interaction.channel?.id) {
    await interaction.reply({
      content: `You are using the wrong channel. To send commands to the music player, use ${queue.metadata.textChannel}`,
      ephemeral: true,
    });
    return null;
  }

  return { member, voiceChannel };
}
