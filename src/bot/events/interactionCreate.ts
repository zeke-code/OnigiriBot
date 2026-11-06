import { Events, Interaction, MessageFlags } from "discord.js";
import { ExtendedClient } from "../../types/ExtendedClient";
import logger from "../../utils/logger";
import { handleMusicComponent } from "../music/musicInteractions";
import { MusicUserError } from "../music/track";

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction): Promise<void> {
    const client = interaction.client as ExtendedClient;
    try {
      if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.autocomplete) await command.autocomplete(interaction);
        else await interaction.respond([]);
        return;
      }
      if (
        (interaction.isButton() || interaction.isStringSelectMenu()) &&
        interaction.customId.startsWith("music_")
      ) {
        await handleMusicComponent(interaction);
        return;
      }
      if (!interaction.isChatInputCommand()) return;
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        logger.error(
          `No command matching ${interaction.commandName} was found.`,
        );
        return;
      }
      await command.execute(interaction);
    } catch (error) {
      logger.error("Error handling interaction", error);
      try {
        if (interaction.isAutocomplete()) {
          if (!interaction.responded) await interaction.respond([]);
        } else if (interaction.isRepliable()) {
          const content =
            error instanceof MusicUserError
              ? error.message
              : "Something went wrong while running this command. Please try again.";
          if (interaction.isMessageComponent() && interaction.deferred) {
            await interaction.followUp({
              content,
              flags: MessageFlags.Ephemeral,
            });
          } else if (interaction.deferred)
            await interaction.editReply({ content });
          else if (!interaction.replied)
            await interaction.reply({ content, flags: MessageFlags.Ephemeral });
        }
      } catch {
        /* The interaction may have expired. */
      }
    }
  },
};
