const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const samp = require('samp-query');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Displays information about the configured SA:MP Server'),
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
                embed.setTitle(`${options.host}:${options.port}`)
                     .setDescription('Server is offline');
                return interaction.editReply({ embeds: [embed] });
            } else {
                const pass = query['passworded'] ? 'Yes' : 'No'; // Capitalized for better readability
                const weburl = query.rules?.weburl || 'sa-mp.com'; // Default to sa-mp.com if not present
                const mapname = query.rules?.mapname || '-';
                const worldtime = query.rules?.worldtime || '-';
                const weather = query.rules?.weather || '-';
                const version = query.rules?.version || '-';

                embed.setTitle(`**${query['hostname']}**`)
                    .addFields(
                        { name: 'IP:PORT', value: `${options.host}:${options.port}`, inline: true },
                        { name: 'PLAYERS', value: `${query['online'] || 0}/${query['maxplayers'] || 0}`, inline: true },
                        { name: 'GAMEMODE', value: query['gamemode'] || '-', inline: true },
                        { name: 'MAP', value: mapname, inline: true },
                        { name: 'LANGUAGE', value: query['language'] || '-', inline: true },
                        { name: 'TIME - WEATHER', value: `${worldtime} - ${weather}`, inline: true },
                        { name: 'VERSION', value: version, inline: true },
                        { name: 'PASSWORD', value: pass, inline: true },
                        { name: 'URL', value: `[${weburl.startsWith('http') ? weburl : 'https://' + weburl}](${weburl.startsWith('http') ? weburl : 'https://' + weburl})`, inline: true }
                    );
                return interaction.editReply({ embeds: [embed] });
            }
        });
    }
}