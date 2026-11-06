import type { Track } from "shoukaku";

export type QueuedTrack = Track & { queueId?: string; requestedBy?: string };
export type LoopMode = "off" | "track" | "queue";
export class MusicUserError extends Error {}

export function trackColor(track: Track): number {
  const source = track.info.sourceName.toLowerCase();
  if (source.includes("youtube")) return 0xff0000;
  if (source.includes("soundcloud")) return 0xff5500;
  if (source.includes("spotify")) return 0x1db954;
  return 0x5865f2;
}

export function shortText(value: string, max = 100): string {
  return value.replace(/[\r\n]/g, " ").slice(0, max);
}

export function safeText(value: string, max = 100): string {
  return shortText(value, max).replace(/[\\*_`~|<>[\]]/g, "\\$&");
}

export function trackTitle(track: Track): string {
  const title = safeText(track.info.title, 100);
  const uri = track.info.uri;
  return uri && /^https?:\/\//i.test(uri) && uri.length <= 500
    ? `[${title}](<${uri.replace(/[<>\s]/g, encodeURIComponent)}>)`
    : title;
}
