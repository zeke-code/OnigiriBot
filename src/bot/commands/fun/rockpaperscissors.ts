import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  CommandInteraction,
  ButtonInteraction,
  ComponentType,
} from "discord.js";

/**
 * Picks a random element from an array of options
 * @param {String[]} options
 * @return {String}
 */
function randomChoice(options: string[]): string {
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Retrieves emoji based on which button was pressed in the embed
 * @param {String} choice
 * @return {String}
 */
function getEmoji(choice: string): string {
  const emojis: { [key: string]: string } = {
    rock: "🪨",
    paper: "📄",
    scissors: "✂️",
  };
  return emojis[choice] || "";
}

/**
 * Builds and returns an end game embed for rock paper scissors game
 * @param {String} winnerName
 * @param {String} loserName
 * @param {number} winnerScore
 * @param {number} loserScore
 * @return {EmbedBuilder}
 */
function createEndGameEmbed(
  winnerName: string,
  loserName: string,
  winnerScore: number,
  loserScore: number
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor("#0099ff")
    .setTitle("Rock, Paper, Scissors - Game Over")
    .addFields(
      { name: "Winner", value: winnerName, inline: true },
      { name: "Loser", value: loserName, inline: true },
      {
        name: "Final Score",
        value: `${winnerScore} - ${loserScore}`,
        inline: true,
      }
    )
    .setTimestamp();
}

const rockPaperScissorsCommand = {
  data: new SlashCommandBuilder()
    .setName("rockpaperscissors")
    .setDescription("Play rock, paper, scissors with me!"),

  async execute(interaction: CommandInteraction) {
    const rock = new ButtonBuilder()
      .setCustomId("rock")
      .setLabel("Play Rock!🪨")
      .setStyle(ButtonStyle.Primary);

    const paper = new ButtonBuilder()
      .setCustomId("paper")
      .setLabel("Play Paper!📄")
      .setStyle(ButtonStyle.Secondary);

    const scissors = new ButtonBuilder()
      .setCustomId("scissors")
      .setLabel("Play Scissors!✂️")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      rock,
      paper,
      scissors
    );

    const response = await interaction.reply({
      content: `You dare challenge me, ${interaction.user.displayName}? Come on, pick something!`,
      components: [row],
    });

    let botScore = 0;
    let userScore = 0;
    let botChoice: string;
    const userName = interaction.user.displayName;

    const outcomes: {
      [key: string]: {
        [key: string]: { message: string; scoreUpdate: () => void };
      };
    } = {
      rock: {
        rock: { message: "Draw!", scoreUpdate: () => {} },
        paper: {
          message: "Bot wins this round!",
          scoreUpdate: () => botScore++,
        },
        scissors: {
          message: `${userName} wins this round!`,
          scoreUpdate: () => userScore++,
        },
      },
      paper: {
        rock: {
          message: `${userName} wins this round!`,
          scoreUpdate: () => userScore++,
        },
        paper: { message: "Draw!", scoreUpdate: () => {} },
        scissors: {
          message: "Bot wins this round!",
          scoreUpdate: () => botScore++,
        },
      },
      scissors: {
        rock: {
          message: "Bot wins this round!",
          scoreUpdate: () => botScore++,
        },
        paper: {
          message: `${userName} wins this round!`,
          scoreUpdate: () => userScore++,
        },
        scissors: { message: "Draw!", scoreUpdate: () => {} },
      },
    };

    const collectorFilter = (i: ButtonInteraction) =>
      i.componentType === ComponentType.Button &&
      i.user.id === interaction.user.id;

    try {
      while (botScore < 3 && userScore < 3) {
        const confirmation = (await response.awaitMessageComponent({
          filter: (i) =>
            i.isButton() && collectorFilter(i as ButtonInteraction),
          time: 60_000,
        })) as ButtonInteraction;

        botChoice = randomChoice(["rock", "paper", "scissors"]);
        const result = outcomes[confirmation.customId][botChoice];
        result.scoreUpdate();

        const resultEmbed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle("Rock, Paper, Scissors Game")
          .addFields(
            {
              name: `${userName} Choice`,
              value: `${confirmation.customId}${getEmoji(
                confirmation.customId
              )}`,
              inline: true,
            },
            {
              name: "Bot's Choice",
              value: `${botChoice}${getEmoji(botChoice)}`,
              inline: true,
            },
            { name: "Round Result", value: result.message, inline: false },
            { name: `${userName} Score`, value: `${userScore}`, inline: true },
            { name: "Bot Score", value: `${botScore}`, inline: true }
          )
          .setTimestamp();

        if (botScore === 3 || userScore === 3) {
          break;
        }

        await confirmation.update({
          content: "",
          embeds: [resultEmbed],
          components: [row],
        });
      }

      let endEmbed: EmbedBuilder | undefined;

      if (botScore === 3) {
        endEmbed = createEndGameEmbed(
          "Bot",
          `${userName}`,
          botScore,
          userScore
        );
      } else if (userScore === 3) {
        endEmbed = createEndGameEmbed(
          `${userName}`,
          "Bot",
          userScore,
          botScore
        );
      }

      if (endEmbed) {
        await interaction.editReply({
          content: "",
          embeds: [endEmbed],
          components: [],
        });
      }
    } catch (e) {
      await interaction.editReply({
        content: "You didn't click anything! Cancelling game 😓",
        components: [],
      });
      return;
    }
  },
};

export default rockPaperScissorsCommand;
