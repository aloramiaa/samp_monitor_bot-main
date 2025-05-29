const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const samp = require('samp-query');
const AsciiTable = require('ascii-table');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('players')
        .setDescription('Lists all online players (up to 100)'),
    async execute(interaction) {
        if (!process.env.SAMP_IP) {
            return interaction.reply({ content: 'IP address is not set in the .env file!', ephemeral: true });
        }

        const client = interaction.client;
        const color = await interaction.guild?.members.fetch(client.user.id).then(member => member.displayHexColor) || '#000000';

        const ipParts = process.env.SAMP_IP.split(':');
        const options = {
            host: ipParts[0],
            port: ipParts[1] || '7777'
        };

        await interaction.deferReply();

        samp(options, (error, query) => {
            const embed = new EmbedBuilder().setColor(color);

            if (error) {
                console.log(error);
                embed.setTitle(`${options.host}:${options.port}`)
                     .setDescription('Server is offline');
                return interaction.editReply({ embeds: [embed] });
            }

            embed.setTitle(`**${query['hostname']}**`);

            if (query['online'] > 0) {
                if (query['online'] > 100) {
                    embed.addFields({ name: 'PLAYERS LIST', value: '*Number of players is greater than 100. I cannot list them!*' });
                } else if (!query['players'] || query['players'].length === 0) {
                    embed.addFields({ name: 'PLAYERS LIST', value: '*Could not retrieve the player list or server reported empty (but online > 0). Try again...*' });
                } else {
                    const players = query['players'];
                    let tablesContent = [];
                    const playersPerTable = 20;

                    for (let i = 0; i < players.length; i += playersPerTable) {
                        const table = new AsciiTable().setHeading('ID', 'NICK', 'SCORE').setAlign(2, AsciiTable.RIGHT);
                        const chunk = players.slice(i, i + playersPerTable);
                        chunk.forEach(player => {
                            table.addRow(player['id'], player['name'], player['score']);
                        });
                        tablesContent.push('```\n' + table.toString() + '\n```');
                    }
                    
                    embed.addFields({ name: `${query['online']}/${query['maxplayers']}`, value: tablesContent[0] });
                    for(let i = 1; i < tablesContent.length; i++) {
                        embed.addFields({ name: '\u200B', value: tablesContent[i] });
                    }
                }
            } else {
                embed.addFields({ name: 'PLAYERS LIST', value: '*Server is empty*' });
            }
            return interaction.editReply({ embeds: [embed] });
        });
    }
}