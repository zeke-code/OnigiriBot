import { VoiceChannel, TextChannel, GuildMember, Message } from "discord.js";

export interface QueueMetadata {
  voiceChannel: VoiceChannel;
  textChannel: TextChannel;
  requestedBy: GuildMember;
  nowPlayingMessage?: Message;
}
