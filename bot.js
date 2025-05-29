require('dotenv').config();
const fs = require('node:fs'); // Changed from require('fs') to require('node:fs') for consistency
const path = require('node:path'); // Added for path joining
const { Client, Collection, GatewayIntentBits, Partials, ActivityType, ChannelType } = require('discord.js');
const express = require('express');

// Web server setup
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is alive!'); // Basic response for root path
});

app.get('/ping', (req, res) => {
  res.status(200).send('Bot is active and pong!'); // Specific ping endpoint
});

app.listen(port, () => {
  console.log(`Web server listening on port ${port}`);
});
// End of web server setup

const client = new Client({
    failIfNotExists: false,
    partials: [
        Partials.Channel
    ],
    intents: [
        GatewayIntentBits.DirectMessages, // comment or remove this if bot shouldn't receive DM messages
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();
// const pCommandFiles = readdirSync('./commands').filter(file => file.endsWith('.js')); // Old command loading
const commandsPath = path.join(__dirname, 'commands'); // Path to commands directory
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js')); // Read command files

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

client.once('ready', async () => {
    console.log(`${client.user.username} is ready!`);
    client.user.setActivity("SA-MP", { type: ActivityType.Competing }); // use ActivityType enum to change it to Watching, Playing or Listening
});

// Remove old messageCreate handler for prefix commands
// client.on('messageCreate', async message => {
//     if (message.author.bot) return;
//
//     if(!message.content.toLowerCase().startsWith(process.env.PREFIX.toLowerCase())) return;
//
//     const args = message.content.slice(process.env.PREFIX.length).split(/ +/);
//     const commandName = args.shift().toLowerCase();
//
//     const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
//
//     if (!command) return;
//
//     try{
//         await command.run(client, message, args); // Old execution method
//
//         if(message.channel.type == ChannelType.DM)
//             console.log(`[CMD_DM] ${message.author.tag} (${message.author.id}) | ${message.content}`);
//         else
//             console.log(`[CMD] ${message.guild.name}(${message.guild.id}) | ${message.author.tag}(${message.author.id}) | ${message.content}`);
//     }
//     catch (error){
//         if(message.channel.type == ChannelType.DM)
//             console.log(`[CMD_DM_ERR] ${message.author.tag} (${message.author.id}) | ${message.content}`);
//         else
//             console.log(`[CMD_ERR] ${message.guild.name}(${message.guild.id}) | ${message.author.tag}(${message.author.id}) | ${message.content}`);
//
//         console.error(error);
//
//         message.reply('An error occurred!');
//     }
// });

// New interactionCreate handler for slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return; // Only handle slash commands

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction); // Execute new method

        // Logging for slash commands
        if (interaction.channel.type == ChannelType.DM) {
            console.log(`[SLASH_CMD_DM] ${interaction.user.tag} (${interaction.user.id}) | /${interaction.commandName} ${interaction.options.data.map(opt => `${opt.name}:${opt.value}`).join(' ')}`.trim());
        } else {
            console.log(`[SLASH_CMD] ${interaction.guild.name}(${interaction.guild.id}) | ${interaction.user.tag}(${interaction.user.id}) | /${interaction.commandName} ${interaction.options.data.map(opt => `${opt.name}:${opt.value}`).join(' ')}`.trim());
        }
    } catch (error) {
        console.error(error);
        // Logging for slash command errors
        if (interaction.channel.type == ChannelType.DM) {
            console.log(`[SLASH_CMD_DM_ERR] ${interaction.user.tag} (${interaction.user.id}) | /${interaction.commandName} ${interaction.options.data.map(opt => `${opt.name}:${opt.value}`).join(' ')}`.trim());
        } else {
            console.log(`[SLASH_CMD_ERR] ${interaction.guild.name}(${interaction.guild.id}) | ${interaction.user.tag}(${interaction.user.id}) | /${interaction.commandName} ${interaction.options.data.map(opt => `${opt.name}:${opt.value}`).join(' ')}`.trim());
        }

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.on('warn', console.warn);
client.on('error', console.error);

client.login(process.env.BOT_TOKEN);