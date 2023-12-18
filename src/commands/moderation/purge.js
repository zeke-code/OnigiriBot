const {SlashCommandBuilder, PermissionFlagsBits} = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
                .setName('purge')
                .setDescription('Deletes a specified amount of recent messages from a channel!')
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
                .addIntegerOption(option =>
                    option.setName('amount')
                    .setDescription('The number of messages to delete')
                    .setRequired(true)
                ),
                async execute(interaction) {
                    const amount = interaction.options.getInteger('amount', true);

                    if (amount <= 0 || amount > 100) {
                        return interaction.reply({content: 'The amount needs to be between 0 and 100', ephemeral: true});
                    } else {
                            const channel = interaction.channel;
                            channel.bulkDelete(amount, true)
                                .then(messages => {
                                    interaction.reply(`I deleted **${amount} recent messages** from this channel under ${interaction.member}'s request!`);
                                })
                                .catch(error => {
                                    logger.error(`Something went wrong while trying to purge messages from a channel: ${error}`);
                                    interaction.reply({ content: 'Something went wrong. Try again later.', ephemeral: true});
                                })
                    }
                }
}