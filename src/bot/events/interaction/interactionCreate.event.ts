import { Interaction, Collection } from "discord.js";
import { Event } from "../base/Event";
import { BotClient } from "../../client/BotClient";

export default class InteractionCreateEvent extends Event {
  constructor() {
    super("interactionCreate");
  }

  public async execute(client: BotClient, interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      // Check cooldowns
      const cooldownAmount = (command.cooldown || 3) * 1000;
      const now = Date.now();
      const timestamps =
        client.cooldowns.get(command.data.name) ||
        new Collection<string, number>();
      const userId = interaction.user.id;

      if (timestamps.has(userId)) {
        const expirationTime = timestamps.get(userId)! + cooldownAmount;
        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          await interaction.reply({
            content: `Please wait ${timeLeft.toFixed(
              1
            )} seconds before using this command again.`,
            ephemeral: true,
          });
          return;
        }
      }

      timestamps.set(userId, now);
      client.cooldowns.set(command.data.name, timestamps);

      // Execute command
      await command.execute(interaction, client);
    } catch (error) {
      client.logger.error(
        `Error executing command ${interaction.commandName}`,
        error
      );

      const reply = {
        content: "There was an error executing this command!",
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  }
}
