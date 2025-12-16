export function formatTime(ms: number): string {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

  const parts = [
    hours > 0 ? hours.toString().padStart(2, "0") : null,
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ].filter(Boolean); // Remove null hours if 0

  return parts.join(":");
}
