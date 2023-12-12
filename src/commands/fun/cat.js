const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const axios = require('axios');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
                .setName('cat')
                .setDescription('Sends a random cat GIF!'),
        async execute(interaction) {
            let url;
            await axios.get('https://api.thecatapi.com/v1/images/search')
            .then(response => {
                url = response.data[0].url;
            })
            .catch(error => {
                logger.error(`Error while trying to retrieve cat image from API: ${error}`);
            })

            if (url === null) {
                await interaction.reply({content: 'Something went wrong with the request. Try again.', ephemeral: true});
                return;
            }

            const embed = new EmbedBuilder()
                            .setImage(url)
                            .setColor('#ffffff')

            await interaction.reply({embeds: [embed]});
        }
    }
