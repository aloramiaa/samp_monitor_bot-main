const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const samp = require('samp-query');

// const embed = new EmbedBuilder(); // Embed should be created inside the execute function

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ip')
        .setDescription('Shows IP address of the configured SA:MP Server'),
    async execute(interaction) { // Changed from run(client, message, args)
        if (!process.env.SAMP_IP) {
            return interaction.reply({ content: 'IP address is not set in the .env file!', ephemeral: true });
        }

        const ipParts = process.env.SAMP_IP.split(':');
        const options = {
            host: ipParts[0],
            port: ipParts[1] || '7777' // Ensure port is a string if not provided
        };

        const client = interaction.client;
        const color = await interaction.guild?.members.fetch(client.user.id).then(member => member.displayHexColor) || '#000000';
        
        await interaction.deferReply(); // Defer reply as samp-query is async

        samp(options, (error, query) => {
            const embed = new EmbedBuilder(); // Create embed here
            embed.setColor(color);
            embed.setDescription(`**IP:** \`${options.host}:${options.port}\``);

            if (error) {
                embed.setTitle('Server is offline');
                return interaction.editReply({ embeds: [embed] });
            } else {
                embed.setTitle('Server is online!');
                return interaction.editReply({ embeds: [embed] });
            }
        });
    }
    // Old properties no longer needed for slash commands
    // name: 'ip',
    // aliases: [],
    // description: 'Shows IP address of a SA:MP Server',
    // run: async (client, message, args) => { ... }
};