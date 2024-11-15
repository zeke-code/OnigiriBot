import { VoiceChannel, TextChannel, GuildMember } from "discord.js";

export interface QueueMetadata {
  voiceChannel: VoiceChannel;
  textChannel: TextChannel;
  requestedBy: GuildMember;
}
