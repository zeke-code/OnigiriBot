import {
  TextChannel,
  VoiceBasedChannel,
  Message,
  ComponentType,
  ButtonInteraction,
  CollectorFilter,
  InteractionCollector,
} from "discord.js";
import { Player, Track } from "shoukaku";
import { MusicManager } from "./MusicManager";
import logger from "../../utils/logger";
import {
  createVolumeEmbed,
  createShuffleEmbed,
  createStopEmbed,
  createNowPlayingEmbed,
} from "./embedFactories";
import { createMusicButtons } from "./musicComponents";
import { MUSIC_BUTTONS } from "./constants";

export class GuildQueue {
  public readonly manager: MusicManager;
  public readonly guildId: string;
  public tracks: Track[] = [];
  public history: Track[] = [];
  public player: Player | null = null;
  public currentTrack: Track | null = null;
  public isPlaying = false;
  public isPaused = false;
  public isShuffled = false;
  public volume = 100;

  public textChannel: TextChannel | null = null;
  public voiceChannel: VoiceBasedChannel | null = null;
  public nowPlayingMessage: Message | null = null;
  public collector: InteractionCollector<ButtonInteraction> | null = null;

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
      await this.setVolume(this.volume); // Ensure volume is applied on play
      this.isPlaying = true;
      this.isPaused = false;
    } catch (_error) {
      logger.error(`Error playing track in guild ${this.guildId}`, _error);
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
      await this.destroy();
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

    await this.updateNowPlayingMessage();
  }

  public async previous(): Promise<Track | null> {
    if (this.history.length === 0) return null;

    const previousTrack = this.history.pop()!;

    // Put current track back to the start of the queue
    if (this.currentTrack) {
      this.tracks.unshift(this.currentTrack);
    }
    // Put previous track at the very start to play it next
    this.tracks.unshift(previousTrack);

    if (this.player && this.isPlaying) {
      await this.player.stopTrack(); // This triggers 'end', which calls play()
    } else {
      await this.play();
    }

    return previousTrack;
  }

  public shuffle(): void {
    for (let i = this.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
    }
    this.isShuffled = true;
    this.updateNowPlayingMessage();
  }

  public async setVolume(volume: number): Promise<boolean> {
    if (!this.player) return false;
    const clampedVolume = Math.max(0, Math.min(volume, 150));
    await this.player.setGlobalVolume(clampedVolume);
    this.volume = clampedVolume;
    this.updateNowPlayingMessage();
    return true;
  }

  public async updateNowPlayingMessage() {
    if (!this.nowPlayingMessage || !this.currentTrack) return;

    try {
      const embed = createNowPlayingEmbed(
        this.manager.client,
        this.currentTrack,
        this.volume,
        this.isShuffled,
      );

      await this.nowPlayingMessage.edit({
        embeds: [embed],
        components: createMusicButtons(this.isPaused),
      });
    } catch (error) {
      logger.error(
        `Failed to update now playing message in guild ${this.guildId}`,
        error,
      );
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

  public async destroy() {
    this.tracks = [];
    this.isPlaying = false;

    if (this.collector) {
      this.collector.stop();
      this.collector = null;
    }

    if (this.nowPlayingMessage) {
      // clear buttons from old message
      await this.nowPlayingMessage.edit({ components: [] }).catch(() => {});
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
      if (!this.currentTrack) return;

      const trackInfo = this.currentTrack.info;

      logger.info(
        `Started playing ${trackInfo.title} in guild ${this.guildId}`,
      );

      const embed = createNowPlayingEmbed(
        this.manager.client,
        this.currentTrack,
        this.volume,
        this.isShuffled,
      );

      if (this.textChannel) {
        if (this.nowPlayingMessage) {
          try {
            await this.nowPlayingMessage.edit({
              embeds: [embed],
              components: createMusicButtons(this.isPaused),
            });
            if (this.collector) this.collector.stop();
            this._setupCollector(this.nowPlayingMessage);
          } catch (error) {
            this.nowPlayingMessage = await this.textChannel.send({
              embeds: [embed],
              components: createMusicButtons(this.isPaused),
            });
            this._setupCollector(this.nowPlayingMessage);
          }
        } else {
          this.nowPlayingMessage = await this.textChannel.send({
            embeds: [embed],
            components: createMusicButtons(this.isPaused),
          });

          this._setupCollector(this.nowPlayingMessage);
        }
      }
    });

    this.player.on("end", async (reason) => {
      logger.info(
        `Track ended in guild ${this.guildId}. Reason: ${reason?.reason}`,
      );
      if (this.collector) {
        this.collector.stop();
        this.collector = null;
      }
      await this.handleTrackEnd();
    });

    this.player.on("exception", async (error) => {
      logger.error(`Player exception in guild ${this.guildId}`, error);
      if (this.textChannel) {
        this.textChannel.send(
          `An error occurred while playing: \`${error.exception.message}\`. Skipping...`,
        );
      }
      await this.skip();
    });

    this.player.on("closed", async (reason) => {
      logger.warn(`Player closed in guild ${this.guildId}`, reason);
      await this.destroy();
    });
  }

  private _setupCollector(message: Message) {
    const filter: CollectorFilter<[ButtonInteraction]> = (i) => {
      const member = i.guild?.members.cache.get(i.user.id);
      if (member?.voice.channelId !== this.voiceChannel?.id) {
        i.reply({
          content:
            "You must be in the same voice channel to use these buttons!",
          ephemeral: true,
        });
        return false;
      }
      return true;
    };

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: filter,
      time:
        (this.currentTrack?.info.length || 0) > 0
          ? this.currentTrack!.info.length
          : undefined,
    });

    this.collector = collector;

    collector.on("collect", async (interaction) => {
      try {
        // Handle Volume Buttons
        if (
          interaction.customId === MUSIC_BUTTONS.VOLUME_UP ||
          interaction.customId === MUSIC_BUTTONS.VOLUME_DOWN
        ) {
          const isUp = interaction.customId === MUSIC_BUTTONS.VOLUME_UP;
          const newVol = isUp ? this.volume + 10 : this.volume - 10;
          await this.setVolume(newVol);

          const embed = createVolumeEmbed(
            this.manager.client,
            this.volume,
            true,
            isUp,
          );

          await interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
          return;
        }

        // Handle Shuffle
        if (interaction.customId === MUSIC_BUTTONS.SHUFFLE) {
          this.shuffle();
          const embed = createShuffleEmbed(this.manager.client);

          await interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
          return;
        }

        // For Playback controls, we defer update to not change the view
        await interaction.deferUpdate();

        switch (interaction.customId) {
          case MUSIC_BUTTONS.PREVIOUS:
            if (this.history.length === 0) {
              await interaction.followUp({
                content: "No previous track found.",
                ephemeral: true,
              });
            } else {
              await this.previous();
            }
            break;

          case MUSIC_BUTTONS.PAUSE:
            await this.pause(!this.isPaused);
            break;

          case MUSIC_BUTTONS.STOP: {
            await this.destroy();
            const stopEmbed = createStopEmbed(this.manager.client);
            await this.textChannel?.send({ embeds: [stopEmbed] });
            break;
          }

          case MUSIC_BUTTONS.SKIP:
            await this.skip();
            break;
        }
      } catch (error) {
        logger.error(
          `Error handling button interaction in guild ${this.guildId}`,
          error,
        );
      }
    });
  }
}
