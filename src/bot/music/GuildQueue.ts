import { TextChannel, VoiceBasedChannel, Message } from "discord.js";
import { Player, Track } from "shoukaku";
import { MusicManager } from "./MusicManager";
import logger from "../../utils/logger";
import { createMusicEmbed } from "../../utils/music/musicEmbed";

export class GuildQueue {
  public readonly manager: MusicManager;
  public readonly guildId: string;
  public tracks: Track[] = [];
  public history: Track[] = [];
  public player: Player | null = null;
  public currentTrack: Track | null = null;
  public isPlaying = false;
  public isPaused = false;
  public volume = 100;

  public textChannel: TextChannel | null = null;
  public voiceChannel: VoiceBasedChannel | null = null;
  public nowPlayingMessage: Message | null = null;

  constructor(manager: MusicManager, guildId: string) {
    this.manager = manager;
    this.guildId = guildId;
  }

  public addTracks(tracks: Track[]) {
    this.tracks.push(...tracks);
  }

  public async play() {
    if (this.isPlaying || this.tracks.length === 0) {
      return;
    }

    this.currentTrack = this.tracks.shift()!;
    if (!this.player || !this.currentTrack) {
      return this.destroy();
    }

    try {
      await this.player.playTrack({
        track: { encoded: this.currentTrack.encoded },
      });
      this.isPlaying = true;
      this.isPaused = false;
    } catch (error) {
      logger.error(`Error playing track in guild ${this.guildId}`, error);
      await this.handleTrackEnd();
    }
  }

  public async handleTrackEnd() {
    if (this.currentTrack) {
      this.history.push(this.currentTrack);
      if (this.history.length > 20) {
        this.history.shift();
      }
    }

    this.currentTrack = null;
    this.isPlaying = false;

    if (this.tracks.length > 0) {
      await this.play();
    } else {
      logger.info(`Queue for guild ${this.guildId} is empty.`);
    }
  }

  public async skip(): Promise<Track | null> {
    if (!this.player) return null;
    const skippedTrack = this.currentTrack;
    await this.player.stopTrack();
    return skippedTrack;
  }

  public async pause(state: boolean) {
    if (!this.player) return;
    await this.player.setPaused(state);
    this.isPaused = state;
  }

  public async previous(): Promise<Track | null> {
    if (this.history.length === 0) {
      return null;
    }

    const previousTrack = this.history.pop()!;

    if (this.currentTrack) {
      this.tracks.unshift(this.currentTrack);
    }

    this.tracks.unshift(previousTrack);

    if (this.player && this.isPlaying) {
      await this.player.stopTrack();
    } else {
      await this.play();
    }

    return previousTrack;
  }

  public shuffle(): void {
    // Fisher-Yates algorithm to mix up the array efficiently.
    for (let i = this.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
    }
  }

  public async connect(voiceChannel: VoiceBasedChannel) {
    if (this.player) return;
    this.voiceChannel = voiceChannel;
    try {
      const player = await this.manager.shoukaku.joinVoiceChannel({
        guildId: this.guildId,
        channelId: voiceChannel.id,
        shardId: voiceChannel.guild.shardId,
        deaf: true,
      });

      this.player = player;
      this._attachPlayerListeners();
    } catch (error) {
      logger.error(
        `Could not connect to voice channel in guild ${this.guildId}`,
        error,
      );
      this.destroy();
    }
  }

  public async setVolume(volume: number): Promise<boolean> {
    if (!this.player) return false;

    const clampedVolume = Math.max(0, Math.min(volume, 150));

    await this.player.setGlobalVolume(clampedVolume);
    this.volume = clampedVolume;
    return true;
  }

  public async destroy() {
    this.tracks = [];
    this.isPlaying = false;

    if (this.nowPlayingMessage) {
      await this.nowPlayingMessage.delete().catch(() => {});
      this.nowPlayingMessage = null;
    }

    if (this.player) {
      await this.manager.shoukaku.leaveVoiceChannel(this.guildId);
      this.player = null;
    }

    this.manager.queues.delete(this.guildId);
    logger.info(`Queue for guild ${this.guildId} has been destroyed.`);
  }

  private _attachPlayerListeners() {
    if (!this.player) return;

    this.player.on("start", async () => {
      logger.info(
        `Started playing ${this.currentTrack?.info.title} in guild ${this.guildId}`,
      );

      const embed = createMusicEmbed()
        .setTitle("Now Playing")
        .setDescription(
          `[${this.currentTrack?.info.title}](${this.currentTrack?.info.uri})`,
        );

      if (this.textChannel) {
        this.nowPlayingMessage = await this.textChannel.send({
          embeds: [embed],
        });
      }
    });

    this.player.on("end", async (reason) => {
      logger.info(
        `Track ended in guild ${this.guildId}. Reason: ${reason?.reason}`,
      );

      if (this.nowPlayingMessage) {
        await this.nowPlayingMessage.delete().catch(() => {});
        this.nowPlayingMessage = null;
      }
      await this.handleTrackEnd();
    });

    this.player.on("exception", async (error) => {
      logger.error(`Player exception in guild ${this.guildId}`, error);
      if (this.textChannel) {
        this.textChannel.send(
          `An error occurred while playing: \`${error.exception.message}\`. Skipping to the next track.`,
        );
      }
      await this.skip();
    });

    this.player.on("closed", async (reason) => {
      logger.warn(`Player closed in guild ${this.guildId}`, reason);
      await this.destroy();
    });
  }
}
