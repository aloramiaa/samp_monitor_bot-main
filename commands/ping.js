const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Returns latency and API ping'),
    async execute(interaction) {
        const client = interaction.client;
        const color = await interaction.guild?.members.fetch(client.user.id).then(member => member.displayHexColor) || '#000000';

        await interaction.deferReply();

        const sent = await interaction.channel.send({ content: 'Pinging...', fetchReply: true });

        const embed = new EmbedBuilder()
            .setTitle('Pong!')
            .setDescription(`Server: \`${sent.createdTimestamp - interaction.createdTimestamp}ms\`\nAPI: \`${Math.round(client.ws.ping)}ms\`\nUptime: \`${msToTime(client.uptime)}\`\nMemory usage: \`${(process.memoryUsage().rss/1024/1024).toFixed(2)} MiB\``)
            .setColor(color);

        await interaction.editReply({ content: '\u200B', embeds: [embed] });
    },
};

const msToTime = ms => {
    if (ms < 1000) return 'ms';
    var str = [];
    let days = Math.floor(ms / 86400000);
    let daysms = ms % 86400000;
    let hours = Math.floor(daysms / 3600000);
    let hoursms = ms % 3600000;
    let minutes = Math.floor(hoursms / 60000);
    let minutesms = ms % 60000;
    let sec = Math.floor(minutesms / 1000);
    if (days) str.push(days + 'd');
    if (hours) str.push(hours + 'h');
    if (minutes) str.push(minutes + 'm');
    if (sec) str.push(sec + 's');
    return str.join(' ') || '0s';
};