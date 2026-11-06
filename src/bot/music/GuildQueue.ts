import { randomUUID } from "node:crypto";
import { TextChannel, VoiceBasedChannel, Message } from "discord.js";
import { Player, Track, TrackEndReason } from "shoukaku";
import { MusicManager } from "./MusicManager";
import logger from "../../utils/logger";
import { createNowPlayingCard, createSessionSummary } from "./musicComponents";
import { LoopMode, QueuedTrack, MusicUserError } from "./track";

export class GuildQueue {
  public readonly sessionId = randomUUID();
  public tracks: QueuedTrack[] = [];
  public history: QueuedTrack[] = [];
  public player: Player | null = null;
  public currentTrack: QueuedTrack | null = null;
  public isPlaying = false;
  public isPaused = false;
  public loopMode: LoopMode = "off";
  public autoplay = false;
  public volume = 100;
  public playedTracks = 0;
  public endsAt: number | null = null;
  public textChannel: TextChannel | null = null;
  public voiceChannel: VoiceBasedChannel | null = null;
  public nowPlayingMessage: Message | null = null;
  private _destroyPromise: Promise<void> | null = null;
  private _connectPromise: Promise<void> | null = null;
  private _messageUpdates = Promise.resolve();
  private _actions = Promise.resolve();
  private _endEvents = Promise.resolve();
  private _playSequence = 0;
  private _playbackId: string | null = null;
  private _ending = false;
  private _pendingAction: "skip" | "previous" | "jump" | null = null;
  private _position = 0;
  private _positionAt = Date.now();
  private _listened = 0;
  private _listeningSince: number | null = null;

  constructor(
    public readonly manager: MusicManager,
    public readonly guildId: string,
  ) {}

  public get destroyed() {
    return this._destroyPromise !== null;
  }
  public get positionMs() {
    const elapsed =
      this.isPlaying && !this.isPaused ? Date.now() - this._positionAt : 0;
    const position = Math.max(0, this._position + elapsed);
    return this.currentTrack && !this.currentTrack.info.isStream
      ? Math.min(this.currentTrack.info.length, position)
      : position;
  }
  public get listenedMs() {
    return (
      this._listened +
      (this._listeningSince === null ? 0 : Date.now() - this._listeningSince)
    );
  }
  public get remainingMs(): number | null {
    if (
      this.currentTrack?.info.isStream ||
      this.tracks.some((track) => track.info.isStream)
    )
      return null;
    return (
      Math.max(0, (this.currentTrack?.info.length ?? 0) - this.positionMs) +
      this.tracks.reduce((sum, track) => sum + track.info.length, 0)
    );
  }

  /** Serialize user actions across slash commands and components. */
  public runExclusive<T>(action: () => Promise<T>): Promise<T> {
    const result = this._actions.then(() => {
      if (this.destroyed)
        throw new MusicUserError("This music session has ended.");
      return action();
    });
    this._actions = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  public addTracks(tracks: Track[], requestedBy?: string) {
    const added = tracks.map((track) => ({
      ...track,
      queueId: randomUUID(),
      requestedBy,
    }));
    this.tracks.push(...added);
    return added;
  }

  public async play() {
    if (this.destroyed || this.isPlaying || !this.tracks.length) return;
    if (!this.player) return this.destroy();
    while (this.tracks.length && !this.destroyed) {
      this.currentTrack = this.tracks.shift()!;
      const sequence = ++this._playSequence;
      this._playbackId = `${this.sessionId}:${sequence}`;
      this.isPlaying = true; // Reserve the track before any asynchronous player calls.
      this.isPaused = false;
      this._position = 0;
      this._positionAt = Date.now();
      this._updateEndTime();
      try {
        await this.player.playTrack({
          track: {
            encoded: this.currentTrack.encoded,
            userData: { onigiriPlaybackId: this._playbackId },
          },
          paused: false,
        });
        if (this.destroyed || sequence !== this._playSequence) return;
        this.playedTracks++;
        this._listeningSince = Date.now();
        await this.player.setGlobalVolume(this.volume).catch((error) => {
          logger.warn(
            `Could not restore volume in guild ${this.guildId}`,
            error,
          );
        });
        return;
      } catch (error) {
        logger.error(`Error playing track in guild ${this.guildId}`, error);
        if (this.destroyed || sequence !== this._playSequence) return;
        this._settleListening();
        this.currentTrack = null;
        this.isPlaying = false;
      }
    }
    if (!this.destroyed) await this.destroy();
  }

  public async handleTrackEnd(reason: TrackEndReason = "finished") {
    if (this.destroyed || this._ending || reason === "replaced") return;
    if (reason === "cleanup") return this.destroy();
    this._ending = true;
    try {
      const ended = this.currentTrack;
      const action = this._pendingAction;
      this._pendingAction = null;
      this._settleListening();
      if (ended) {
        if (action !== "previous") {
          this.history.push(ended);
          if (this.history.length > 20) this.history.shift();
        }
        if (reason === "finished" && !action && this.loopMode === "track")
          this.tracks.unshift(ended);
        else if (
          this.loopMode === "queue" &&
          reason !== "loadFailed" &&
          action !== "previous" &&
          action !== "jump"
        )
          this.tracks.push(ended);
      }
      this.currentTrack = null;
      this.isPlaying = false;
      this.isPaused = false;
      this.endsAt = null;
      if (
        !this.tracks.length &&
        this.autoplay &&
        ended &&
        reason !== "loadFailed"
      ) {
        try {
          const related = await this.manager.relatedTrack(ended, this.history);
          if (
            !this.destroyed &&
            this.autoplay &&
            !this.isPlaying &&
            !this.tracks.length &&
            related
          )
            this.addTracks([related]);
        } catch (error) {
          logger.warn(`Autoplay unavailable in guild ${this.guildId}`, error);
        }
      }
      if (this.destroyed || this.isPlaying) return;
      if (this.tracks.length) await this.play();
      else await this.destroy();
    } finally {
      this._ending = false;
    }
  }

  private async _stopFor(action: "skip" | "previous" | "jump") {
    if (this._pendingAction)
      throw new MusicUserError(
        "The player is already changing tracks. Try again shortly.",
      );
    this._pendingAction = action;
    const sequence = this._playSequence;
    try {
      await this.player!.stopTrack();
    } catch (error) {
      this._pendingAction = null;
      throw error;
    }
    // The successful REST response confirms the track has stopped. Process it
    // on the same chain as websocket end events, so either path advances once.
    // Never leave controls locked waiting indefinitely for a websocket event.
    this._endEvents = this._endEvents.then(async () => {
      if (
        !this.destroyed &&
        sequence === this._playSequence &&
        this._pendingAction
      ) {
        await this.handleTrackEnd("stopped");
      }
    });
    await this._endEvents;
  }

  public async skip(): Promise<QueuedTrack | null> {
    if (!this.player || !this.currentTrack) return null;
    const skipped = this.currentTrack;
    await this._stopFor("skip");
    return skipped;
  }

  public async pause(state: boolean) {
    if (!this.player || this.isPaused === state) return;
    await this.player.setPaused(state);
    this._position = this.positionMs;
    this._positionAt = Date.now();
    this._settleListening();
    this.isPaused = state;
    if (!state && this.isPlaying) this._listeningSince = Date.now();
    this._updateEndTime();
    await this.updateNowPlayingMessage();
  }

  public async seek(position: number) {
    if (!this.player || !this.currentTrack)
      throw new MusicUserError("There is nothing playing.");
    if (!this.currentTrack.info.isSeekable || this.currentTrack.info.isStream)
      throw new MusicUserError("This track cannot be seeked.");
    if (
      !Number.isFinite(position) ||
      position < 0 ||
      position >= this.currentTrack.info.length
    )
      throw new MusicUserError(
        "Choose a position within the track's duration.",
      );
    await this.player.seekTo(position);
    this._position = position;
    this._positionAt = Date.now();
    this._updateEndTime();
    await this.updateNowPlayingMessage();
  }

  public async previous(): Promise<QueuedTrack | null> {
    if (!this.history.length || !this.player) return null;
    if (this._pendingAction)
      throw new MusicUserError("The player is already changing tracks.");
    const previous = this.history.pop()!;
    const before = [...this.tracks];
    if (this.currentTrack) this.tracks.unshift(this.currentTrack);
    this.tracks.unshift(previous);
    try {
      if (this.isPlaying) await this._stopFor("previous");
      else await this.play();
    } catch (error) {
      this.tracks = before;
      this.history.push(previous);
      throw error;
    }
    return previous;
  }

  /** Jump over earlier queued tracks; stable IDs prevent stale menus selecting another song. */
  public async jump(id: string) {
    const index = this.tracks.findIndex((track) => track.queueId === id);
    if (index < 0)
      throw new MusicUserError(
        "That track is no longer queued. Open Queue again.",
      );
    if (this._pendingAction)
      throw new MusicUserError("The player is already changing tracks.");
    const before = [...this.tracks];
    this.tracks.splice(0, index);
    try {
      if (this.isPlaying && this.player) await this._stopFor("jump");
      else await this.play();
    } catch (error) {
      this.tracks = before;
      throw error;
    }
  }

  public remove(position: number) {
    this._validatePosition(position);
    return this.tracks.splice(position - 1, 1)[0];
  }
  public move(from: number, to: number) {
    this._validatePosition(from);
    this._validatePosition(to);
    const [track] = this.tracks.splice(from - 1, 1);
    this.tracks.splice(to - 1, 0, track);
  }
  private _validatePosition(position: number) {
    if (
      !Number.isInteger(position) ||
      position < 1 ||
      position > this.tracks.length
    )
      throw new MusicUserError(
        "Choose a valid queue position (starting at 1).",
      );
  }
  public async shuffle() {
    for (let i = this.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
    }
    await this.updateNowPlayingMessage();
  }
  public async setVolume(volume: number): Promise<boolean> {
    if (!this.player) return false;
    const clamped = Math.max(0, Math.min(volume, 150));
    await this.player.setGlobalVolume(clamped);
    this.volume = clamped;
    await this.updateNowPlayingMessage();
    return true;
  }
  private _updateEndTime() {
    this.endsAt =
      this.currentTrack && !this.currentTrack.info.isStream && !this.isPaused
        ? Math.ceil(
            (Date.now() + this.currentTrack.info.length - this.positionMs) /
              1000,
          )
        : null;
  }
  private _settleListening() {
    this._listened = this.listenedMs;
    this._listeningSince = null;
  }

  public updateNowPlayingMessage(checkRecency = false): Promise<void> {
    this._messageUpdates = this._messageUpdates
      .then(async () => {
        if (this.destroyed || !this.currentTrack || !this.textChannel) return;
        if (checkRecency && this.nowPlayingMessage) {
          const recent = await this.textChannel.messages
            .fetch({ limit: 5 })
            .catch(() => null);
          if (recent && !recent.has(this.nowPlayingMessage.id)) {
            const old = this.nowPlayingMessage;
            await old.delete().catch(async () => {
              await old.edit(createNowPlayingCard(this, false)).catch(() => {});
            });
            this.nowPlayingMessage = null;
          }
        }
        if (this.destroyed || !this.currentTrack) return;
        const payload = createNowPlayingCard(this);
        if (this.nowPlayingMessage) {
          try {
            await this.nowPlayingMessage.edit(payload);
            return;
          } catch (error) {
            // Only recreate a deleted card; permission/network errors must not create duplicates.
            if ((error as { code?: number }).code !== 10008) throw error;
            this.nowPlayingMessage = null;
          }
        }
        this.nowPlayingMessage = await this.textChannel.send(payload);
      })
      .catch((error) => {
        logger.error(
          `Failed to update player card in guild ${this.guildId}`,
          error,
        );
      });
    return this._messageUpdates;
  }

  public async connect(voiceChannel: VoiceBasedChannel) {
    if (this.player) return;
    if (this._connectPromise) return this._connectPromise;
    this.voiceChannel = voiceChannel;
    this._connectPromise = (async () => {
      try {
        const player = await this.manager.shoukaku.joinVoiceChannel({
          guildId: this.guildId,
          channelId: voiceChannel.id,
          shardId: voiceChannel.guild.shardId,
          deaf: true,
        });
        if (this.destroyed) {
          await this.manager.shoukaku.leaveVoiceChannel(this.guildId);
          throw new MusicUserError("This music session has ended.");
        }
        this.player = player;
        this._attachPlayerListeners();
      } catch (error) {
        await this.destroy();
        throw error;
      }
    })();
    return this._connectPromise;
  }

  public destroy(): Promise<void> {
    if (this._destroyPromise) return this._destroyPromise;
    this._destroyPromise = Promise.resolve().then(async () => {
      this._settleListening();
      this.isPlaying = false;
      this.isPaused = false;
      this.tracks = [];
      this.currentTrack = null;
      this._playbackId = null;
      this.endsAt = null;
      await this._messageUpdates;
      if (this.nowPlayingMessage) {
        await this.nowPlayingMessage
          .edit(createSessionSummary(this))
          .catch(() => {});
        this.nowPlayingMessage = null;
      }
      try {
        if (this.player)
          await this.manager.shoukaku.leaveVoiceChannel(this.guildId);
      } finally {
        this.player = null;
        if (this.manager.queues.get(this.guildId) === this)
          this.manager.queues.delete(this.guildId);
      }
    });
    return this._destroyPromise;
  }

  private _attachPlayerListeners() {
    if (!this.player) return;
    this.player.on("start", async (event) => {
      if (this.destroyed || !this.currentTrack) return;
      if (!this._matchesPlayback(event.track)) return;
      this._position = 0;
      this._positionAt = Date.now();
      this._updateEndTime();
      await this.updateNowPlayingMessage(true);
    });
    this.player.on("update", (update) => {
      if (!this.currentTrack || this.destroyed) return;
      this._position = update.state.position;
      this._positionAt = Date.now();
    });
    this.player.on("end", (event) => {
      this._endEvents = this._endEvents
        .then(async () => {
          if (!this._matchesPlayback(event.track)) return;
          await this.handleTrackEnd(event.reason);
        })
        .catch((error) => {
          logger.error(
            `Track transition failed in guild ${this.guildId}`,
            error,
          );
        });
      return this._endEvents;
    });
    const failed = async (error: unknown) => {
      if (this.destroyed) return;
      logger.error(`Player exception in guild ${this.guildId}`, error);
      await this.textChannel
        ?.send("An error occurred while playing this track. Skipping...")
        .catch(() => {});
      // Lavalink sends loadFailed/end after an exception. Do not stop a newly-started track.
    };
    this.player.on("exception", failed);
    this.player.on("stuck", async (error) => {
      const stuck = this.currentTrack;
      await failed(error);
      if (
        stuck === this.currentTrack &&
        !this.destroyed &&
        !this._pendingAction
      ) {
        await this.skip().catch((error) =>
          logger.error("Could not skip stuck track", error),
        );
      }
    });
    this.player.on("closed", async () => {
      await this.destroy().catch((error) =>
        logger.error("Player cleanup failed", error),
      );
    });
  }

  private _matchesPlayback(track: Track): boolean {
    if (!track || !this.currentTrack) return false;
    // Lavalink re-encodes tracks at their current position. Encoded strings are
    // not stable identities. userData also distinguishes repeats of one song.
    const data = (
      track as Track & { userData?: { onigiriPlaybackId?: unknown } }
    ).userData;
    if (typeof data?.onigiriPlaybackId === "string") {
      return data.onigiriPlaybackId === this._playbackId;
    }
    // Support events from players created before playback IDs were attached.
    return (
      track.info.identifier === this.currentTrack.info.identifier &&
      track.info.sourceName === this.currentTrack.info.sourceName
    );
  }
}
