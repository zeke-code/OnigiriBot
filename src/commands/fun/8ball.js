const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');

const responses = [
  'It is certain.',
  'It is decidedly so.',
  'Without a doubt.',
  'Yes – definitely.',
  'You may rely on it.',
  'As I see it, yes.',
  'Most likely.',
  'Outlook good.',
  'Yes.',
  'Signs point to yes.',
  'Reply hazy, try again.',
  'Ask again later.',
  'Better not tell you now.',
  'Cannot predict now.',
  'Concentrate and ask again.',
  'Don\'t count on it.',
  'My reply is no.',
  'My sources say no.',
  'Outlook not so good.',
  'Very doubtful.',
];

module.exports = {
  data: new SlashCommandBuilder()
      .setName('8ball')
      .setDescription('Ask me a question and I\'ll give you an answer...')
      .addStringOption((option) =>
        option.setName('question')
            .setDescription('Write a question you\'d like to ask me!')
            .setRequired(true)
            .setMaxLength(100)),
  async execute(interaction) {
    const question = interaction.options.getString('question');
    const response = responses[Math.floor(Math.random() * responses.length)];

    const embed = new EmbedBuilder()
        .setColor('White')
        .setAuthor({
          name: 'OnigiriBot',
          iconURL: 'https://i.ibb.co/bFJ5GC1/Oni-Avatar.png',
        })
        .setTitle(`🎱 8Ball with ${interaction.member.user.displayName}`)
        .addFields({name: 'Question: ', value: `${question}`},
            {name: 'Response: ', value: `${response}`});

    await interaction.reply({embeds: [embed]});

    // await interaction.reply(`Your question is: **${question}**\nAnswer: **${response}**`);
  },
};
