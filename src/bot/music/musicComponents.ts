import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from "discord.js";
import type { GuildQueue } from "./GuildQueue";
import { MUSIC_BUTTONS } from "./constants";
import { safeText, shortText, trackColor, trackTitle } from "./track";
import { formatTime } from "../../utils/formatTime";

const text = (content: string) => new TextDisplayBuilder().setContent(content);
const separator = () => new SeparatorBuilder().setDivider(true);
const button = (
  id: string,
  label: string,
  disabled = false,
  style = ButtonStyle.Secondary,
) =>
  new ButtonBuilder()
    .setCustomId(id)
    .setLabel(label)
    .setStyle(style)
    .setDisabled(disabled);

export function remainingLabel(queue: GuildQueue): string {
  return queue.remainingMs === null
    ? "Includes a live stream"
    : `${formatTime(queue.remainingMs)} remaining`;
}

export function createMusicButtons(
  queue: GuildQueue,
): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      button(MUSIC_BUTTONS.PREVIOUS, "⏮ Prev", !queue.history.length),
      button(MUSIC_BUTTONS.PAUSE, queue.isPaused ? "▶ Resume" : "⏸ Pause"),
      button(MUSIC_BUTTONS.SKIP, "⏭ Skip", !queue.currentTrack),
      button(MUSIC_BUTTONS.STOP, "⏹ Stop", false, ButtonStyle.Danger),
      button(
        MUSIC_BUTTONS.LOOP,
        `Loop: ${queue.loopMode}`,
        false,
        queue.loopMode === "off" ? ButtonStyle.Secondary : ButtonStyle.Primary,
      ),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      button(MUSIC_BUTTONS.VOLUME_DOWN, "−10%", queue.volume <= 0),
      button(MUSIC_BUTTONS.VOLUME_UP, "+10%", queue.volume >= 150),
      button(MUSIC_BUTTONS.SHUFFLE, "Shuffle", queue.tracks.length < 2),
      button(MUSIC_BUTTONS.QUEUE, "Queue", false, ButtonStyle.Primary),
      button(
        MUSIC_BUTTONS.AUTOPLAY,
        `Autoplay: ${queue.autoplay ? "on" : "off"}`,
      ),
    ),
  ];
}

function jumpMenu(queue: GuildQueue, start: number, count: number) {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`music_jump:${queue.sessionId}`)
      .setPlaceholder("Jump to track…")
      .addOptions(
        queue.tracks.slice(start, start + count).map((track, index) => ({
          label: shortText(`${start + index + 1}. ${track.info.title}`),
          description: shortText(
            `${track.info.author} · ${track.info.isStream ? "LIVE" : formatTime(track.info.length)}`,
          ),
          value: track.queueId!,
        })),
      ),
  );
}

export function createNowPlayingCard(queue: GuildQueue, controls = true) {
  const track = queue.currentTrack!;
  const position = queue.positionMs;
  const filled = Math.min(
    10,
    Math.floor((position / Math.max(1, track.info.length)) * 10),
  );
  const progress = track.info.isStream
    ? "🔴 LIVE"
    : `${"▬".repeat(filled)}🔘${"─".repeat(10 - filled)}  ${formatTime(position)} / ${formatTime(track.info.length)}`;
  const end = queue.isPaused
    ? " · Paused"
    : queue.endsAt
      ? ` · Ends <t:${queue.endsAt}:R>`
      : "";
  const heading = text(
    `### ${queue.isPaused ? "Paused" : "Now Playing"}\n**${trackTitle(track)}**\n${safeText(track.info.author || "Unknown artist")} · ${track.requestedBy ? `Requested by <@${track.requestedBy}>` : "Autoplay"}`,
  );
  const container = new ContainerBuilder().setAccentColor(trackColor(track));
  const artwork = track.info.artworkUrl;
  if (artwork && /^https?:\/\//i.test(artwork)) {
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(heading)
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(artwork)),
    );
  } else container.addTextDisplayComponents(heading);
  container
    .addTextDisplayComponents(
      text(
        `${progress}${end}\n-# Volume ${queue.volume}% · Loop ${queue.loopMode} · Autoplay ${queue.autoplay ? "on" : "off"}`,
      ),
    )
    .addSeparatorComponents(separator())
    .addTextDisplayComponents(
      text(
        `**Up next · ${queue.tracks.length} queued · ${remainingLabel(queue)}**\n${
          queue.tracks
            .slice(0, 3)
            .map((item, index) => `${index + 1}. ${trackTitle(item)}`)
            .join("\n") || "No tracks queued"
        }${queue.tracks.length > 3 ? `\n-# +${queue.tracks.length - 3} more · Open Queue to browse all tracks` : ""}`,
      ),
    );
  if (controls) {
    container
      .addSeparatorComponents(separator())
      .addActionRowComponents(...createMusicButtons(queue));
    if (queue.tracks.length)
      container.addActionRowComponents(jumpMenu(queue, 0, 25));
  }
  return {
    flags: MessageFlags.IsComponentsV2 as const,
    components: [container],
    allowedMentions: { parse: [] as [] },
  };
}

export function createQueueCard(queue: GuildQueue, requestedPage = 0) {
  const pageSize = 10;
  const pages = Math.max(1, Math.ceil(queue.tracks.length / pageSize));
  const page = Math.max(0, Math.min(pages - 1, requestedPage));
  const start = page * pageSize;
  const container = new ContainerBuilder()
    .setAccentColor(0x5865f2)
    .addTextDisplayComponents(
      text(
        `### Queue · ${queue.tracks.length} tracks\n${remainingLabel(queue)} · Loop ${queue.loopMode}\n${queue.currentTrack ? `Playing: ${trackTitle(queue.currentTrack)}` : "Loading next track…"}`,
      ),
    )
    .addSeparatorComponents(separator())
    .addTextDisplayComponents(
      text(
        queue.tracks
          .slice(start, start + pageSize)
          .map(
            (track, index) =>
              `**${start + index + 1}.** ${safeText(track.info.title, 80)} · ${track.info.isStream ? "LIVE" : formatTime(track.info.length)}${track.requestedBy ? ` · <@${track.requestedBy}>` : ""}`,
          )
          .join("\n") || "The queue is empty.",
      ),
    )
    .addTextDisplayComponents(text(`-# Page ${page + 1} of ${pages}`));
  if (queue.tracks.length)
    container.addActionRowComponents(jumpMenu(queue, start, pageSize));
  container.addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      button(
        `music_page:${queue.sessionId}:${page - 1}`,
        "Previous page",
        page === 0,
      ),
      button(
        `music_page:${queue.sessionId}:${page + 1}`,
        "Next page",
        page === pages - 1,
      ),
    ),
  );
  return {
    flags: MessageFlags.IsComponentsV2 as const,
    components: [container],
    allowedMentions: { parse: [] as [] },
  };
}

export function createSessionSummary(queue: GuildQueue) {
  return {
    flags: MessageFlags.IsComponentsV2 as const,
    components: [
      new ContainerBuilder()
        .setAccentColor(0x5865f2)
        .addTextDisplayComponents(
          text(
            `### Session ended\nPlayed **${queue.playedTracks} tracks** · **${formatTime(queue.listenedMs)}** listening time`,
          ),
        ),
    ],
    allowedMentions: { parse: [] as [] },
  };
}
