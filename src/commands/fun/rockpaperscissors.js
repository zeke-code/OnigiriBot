const {SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder} = require('discord.js');

/**
 * Picks a random element from an array of options
 * @param {String[]} options
 * @return {String}
 */
function randomChoice(options) {
  const result = options[Math.floor(Math.random() * options.length)];
  return result;
}

/**
 * Retrieves emoji based on which button was pressed in the embed
 * @param {String} choice
 * @return {String}
 */
function getEmoji(choice) {
  const emojis = {
    rock: '🪨', // Emoji for rock
    paper: '📄', // Emoji for paper
    scissors: '✂️', // Emoji for scissors
  };
  return emojis[choice] || '';
}

/**
 * Builds and returns an end game embed for rock paper scissors game
 * @param {String} winnerName
 * @param {String} loserName
 * @param {number} winnerScore
 * @param {number} loserScore
 * @return { Embed }
 */
function createEndGameEmbed(winnerName, loserName, winnerScore, loserScore) {
  return new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Rock, Paper, Scissors - Game Over')
      .addFields(
          {name: 'Winner', value: winnerName, inline: true},
          {name: 'Loser', value: loserName, inline: true},
          {name: 'Final Score', value: `${winnerScore} - ${loserScore}`, inline: true},
      )
      .setTimestamp();
}

module.exports = {
  data: new SlashCommandBuilder()
      .setName('rockpaperscissors')
      .setDescription('Play rock, paper, scissors with me!'),
  async execute(interaction) {
    const rock = new ButtonBuilder()
        .setCustomId('rock')
        .setLabel('Play Rock!🪨')
        .setStyle(ButtonStyle.Primary);

    const paper = new ButtonBuilder()
        .setCustomId('paper')
        .setLabel('Play Paper!📄')
        .setStyle(ButtonStyle.Secondary);

    const scissors = new ButtonBuilder()
        .setCustomId('scissors')
        .setLabel('Play Scissors!✂️')
        .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder()
        .addComponents(rock)
        .addComponents(paper)
        .addComponents(scissors);

    const response = await interaction.reply({
      content: `You dare challenge me, ${interaction.member}? Come on, pick something!`,
      components: [row],
    });

    let botScore = 0;
    let userScore = 0;
    let botChoice;
    const userName = interaction.user.username;

    const outcomes = {
      rock: {
        rock: {message: 'Draw!', scoreUpdate: () => {}},
        paper: {message: 'Bot wins this round!', scoreUpdate: () => botScore++},
        scissors: {message: `${userName} wins this round!`, scoreUpdate: () => userScore++},
      },
      paper: {
        rock: {message: `${userName} wins this round!`, scoreUpdate: () => userScore++},
        paper: {message: 'Draw!', scoreUpdate: () => {}},
        scissors: {message: 'Bot wins this round!', scoreUpdate: () => botScore++},
      },
      scissors: {
        rock: {message: 'Bot wins this round!', scoreUpdate: () => botScore++},
        paper: {message: `${userName} wins this round!`, scoreUpdate: () => userScore++},
        scissors: {message: 'Draw!', scoreUpdate: () => {}},
      },
    };

    const collectorFilter = (i) => i.user.id === interaction.user.id;

    try {
      while (botScore < 3 && userScore < 3) {
        const confirmation = await response.awaitMessageComponent({filter: collectorFilter, time: 60_000});
        botChoice = randomChoice(['rock', 'paper', 'scissors']);
        const result = outcomes[confirmation.customId][botChoice];
        result.scoreUpdate();

        const resultEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Rock, Paper, Scissors Game')
            .addFields(
                {name: `${userName} Choice`, value: `${confirmation.customId}${getEmoji(confirmation.customId)}`, inline: true},
                {name: 'Bot\'s Choice', value: `${botChoice}${getEmoji(botChoice)}`, inline: true},
                {name: 'Round Result', value: result.message, inline: false},
                {name: `${userName} Score`, value: `${userScore}`, inline: true},
                {name: 'Bot Score', value: `${botScore}`, inline: true},
            )
            .setTimestamp();

        if (botScore === 3 || userScore === 3) {
          break;
        }

        await confirmation.update({content: '', embeds: [resultEmbed], components: [row]});
      }

      let endEmbed;

      if (botScore === 3) {
        endEmbed = createEndGameEmbed('Bot', `${userName}`, botScore, userScore);
      } else if (userScore === 3) {
        endEmbed = createEndGameEmbed(`${userName}`, 'Bot', userScore, botScore);
      }

      await interaction.editReply({content: '', embeds: [endEmbed], components: []});
    } catch (e) {
      await interaction.editReply({content: 'You didn\'t click anything! Cancelling game 😓', components: []});
      return;
    }
  },
};
