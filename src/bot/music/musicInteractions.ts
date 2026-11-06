import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  MessageFlags,
  StringSelectMenuInteraction,
} from "discord.js";
import type { ExtendedClient } from "../../types/ExtendedClient";
import type { GuildQueue } from "./GuildQueue";
import { MUSIC_BUTTONS } from "./constants";
import { createQueueCard } from "./musicComponents";

type MusicInteraction =
  ButtonInteraction | StringSelectMenuInteraction | ChatInputCommandInteraction;

export async function inPlayerVoiceChannel(
  interaction: MusicInteraction,
  queue: GuildQueue,
) {
  if (!interaction.guild || !queue.voiceChannel) return false;
  // Fetch voice states directly instead of relying on a cached guild-member list.
  const [member, bot] = await Promise.all([
    interaction.guild.voiceStates
      .fetch(interaction.user.id, { force: true })
      .catch(() => null),
    interaction.guild.voiceStates
      .fetch("@me", { force: true })
      .catch(() => null),
  ]);
  return Boolean(
    member?.channelId && bot?.channelId && member.channelId === bot.channelId,
  );
}

export async function handleMusicComponent(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
) {
  const queue = interaction.guildId
    ? (interaction.client as ExtendedClient).musicManager.queues.get(
        interaction.guildId,
      )
    : undefined;
  const [id, session, pageValue] = interaction.customId.split(":");
  const privateView =
    id === "music_page" ||
    (id === "music_jump" &&
      interaction.message.flags.has(MessageFlags.Ephemeral));
  if (
    !queue ||
    queue.destroyed ||
    (session && session !== queue.sessionId) ||
    (!privateView && interaction.message.id !== queue.nowPlayingMessage?.id)
  ) {
    await interaction.reply({
      content: "This player is no longer active. Use /nowplaying or /queue.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const openQueue = id === MUSIC_BUTTONS.QUEUE;
  if (openQueue)
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  else await interaction.deferUpdate();
  if (openQueue || id === "music_page") {
    const page = Number(pageValue ?? 0);
    await interaction.editReply(
      createQueueCard(queue, Number.isInteger(page) ? page : 0),
    );
    await queue.updateNowPlayingMessage();
    return;
  }
  if (!(await inPlayerVoiceChannel(interaction, queue))) {
    await interaction.followUp({
      content:
        "You must be in the same voice channel as me to control playback.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  await queue.runExclusive(async () => {
    switch (id) {
      case MUSIC_BUTTONS.VOLUME_UP:
        await queue.setVolume(queue.volume + 10);
        return;
      case MUSIC_BUTTONS.VOLUME_DOWN:
        await queue.setVolume(queue.volume - 10);
        return;
      case MUSIC_BUTTONS.PAUSE:
        await queue.pause(!queue.isPaused);
        return;
      case MUSIC_BUTTONS.SHUFFLE:
        await queue.shuffle();
        return;
      case MUSIC_BUTTONS.SKIP:
        await queue.skip();
        break;
      case MUSIC_BUTTONS.PREVIOUS:
        await queue.previous();
        break;
      case MUSIC_BUTTONS.STOP:
        await queue.destroy();
        break;
      case MUSIC_BUTTONS.LOOP:
        queue.loopMode =
          queue.loopMode === "off"
            ? "track"
            : queue.loopMode === "track"
              ? "queue"
              : "off";
        break;
      case MUSIC_BUTTONS.AUTOPLAY:
        queue.autoplay = !queue.autoplay;
        break;
      case "music_jump":
        if (interaction.isStringSelectMenu())
          await queue.jump(interaction.values[0]);
        break;
      default:
        throw new Error("Unknown player control.");
    }
    await queue.updateNowPlayingMessage();
    if (privateView && !queue.destroyed)
      await interaction.editReply(createQueueCard(queue));
  });
}
