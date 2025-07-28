import { Events, ButtonInteraction, Interaction } from "discord.js";
import pauseresume from "../../commands/music/pause";
import skip from "../../commands/music/skip";
import stop from "../../commands/music/stop";
import shuffle from "../../commands/music/shuffle";
import previous from "../../commands/music/previous";
import volume from "../../commands/music/volume";

const commands: {
  [key: string]: { execute: (interaction: ButtonInteraction) => Promise<void> };
} = {
  pauseresume,
  skip,
  stop,
  shuffle,
  previous,
  volume,
};

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction): Promise<void> {
    if (!interaction.isButton()) return;

    const buttonId = interaction.customId;
    const command = commands[buttonId];

    if (command) {
      await command.execute(interaction as ButtonInteraction);
    }
  },
};
