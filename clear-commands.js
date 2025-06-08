require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

async function clearAllGlobalCommands() {
    if (!process.env.BOT_TOKEN) {
        console.error('Error: BOT_TOKEN is not defined in the .env file.');
        return;
    }
    if (!process.env.CLIENT_ID) {
        console.error('Error: CLIENT_ID is not defined in the .env file.');
        return;
    }

    const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);

    try {
        console.log(`Attempting to clear ALL global application (/) commands for CLIENT_ID: ${process.env.CLIENT_ID}`);
        console.warn('WARNING: This will remove ALL global commands for this bot application. If this application is shared with other bots (e.g., a Python bot), their commands will also be deleted. Proceed with caution.');
        
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [] } 
        );

        console.log('Successfully submitted request to clear ALL global application (/) commands.');
        console.log('Please note: Global command changes can take up to an hour to propagate across all Discord servers.');

    } catch (error) {
        console.error('Failed to clear all global application commands:', error);
    }
}

async function clearAllGuildCommands(guildId) {
    if (!process.env.BOT_TOKEN) {
        console.error('Error: BOT_TOKEN is not defined in the .env file.');
        return;
    }
    if (!process.env.CLIENT_ID) {
        console.error('Error: CLIENT_ID is not defined in the .env file.');
        return;
    }
    if (!guildId) {
        console.error('Error: guildId was not provided to clearAllGuildCommands function.');
        return;
    }

    const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);

    try {
        console.log(`Attempting to clear ALL application (/) commands for GUILD_ID: ${guildId} (CLIENT_ID: ${process.env.CLIENT_ID})`);
        console.warn('WARNING: This will remove ALL commands for this bot application within the specified guild.');

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
            { body: [] } 
        );

        console.log(`Successfully submitted request to clear all application (/) commands for GUILD_ID: ${guildId}.`);
        console.log('Guild command changes should propagate quickly.');

    } catch (error) {
        console.error(`Failed to clear application commands for GUILD_ID ${guildId}:`, error);
    }
}

async function deleteSpecificGlobalCommandsByName(commandNamesToDelete) {
    if (!process.env.BOT_TOKEN) {
        console.error('Error: BOT_TOKEN is not defined in the .env file.');
        return;
    }
    if (!process.env.CLIENT_ID) {
        console.error('Error: CLIENT_ID is not defined in the .env file.');
        return;
    }
    if (!commandNamesToDelete || commandNamesToDelete.length === 0) {
        console.error('Error: No command names provided to delete.');
        return;
    }

    const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);

    try {
        console.log(`Fetching current global commands for CLIENT_ID: ${process.env.CLIENT_ID}...`);
        const currentCommands = await rest.get(
            Routes.applicationCommands(process.env.CLIENT_ID)
        );

        if (!currentCommands || currentCommands.length === 0) {
            console.log('No global commands found for this bot application. Nothing to delete.');
            return;
        }

        console.log(`Found ${currentCommands.length} global commands. Checking for commands to delete: ${commandNamesToDelete.join(', ')}`);

        let deleteCount = 0;
        for (const command of currentCommands) {
            if (commandNamesToDelete.includes(command.name)) {
                try {
                    console.log(`Attempting to delete global command: "${command.name}" (ID: ${command.id})`);
                    await rest.delete(
                        Routes.applicationCommand(process.env.CLIENT_ID, command.id)
                    );
                    console.log(`Successfully deleted global command: "${command.name}" (ID: ${command.id})`);
                    deleteCount++;
                } catch (delError) {
                    console.error(`Failed to delete global command "${command.name}" (ID: ${command.id}):`, delError);
                }
            }
        }

        if (deleteCount > 0) {
            console.log(`Successfully submitted deletion requests for ${deleteCount} global command(s).`);
            console.log('Please note: Global command changes can take up to an hour to propagate across all Discord servers.');
        } else {
            console.log('No commands matching the specified names were found among the registered global commands.');
        }

    } catch (error) {
        console.error('Failed to fetch or delete specific global application commands:', error);
    }
}

// --- How to use: ---
// 1. IMPORTANT: Ensure your .env file has the BOT_TOKEN and CLIENT_ID of the bot application 
//    whose commands you want to modify. This application is SHARED with your Python bot.

// 2. To delete SPECIFIC global commands by name (SAFER for shared bot applications):
//    Define the array of command names you want to delete (those from the old Node.js bot).
const oldNodeJsCommandNames = ['ip', 'ping', 'server', 'players'];
//    Then, uncomment the next line to run the function:
deleteSpecificGlobalCommandsByName(oldNodeJsCommandNames);

// -------------------------------------------------------------------------------------
// DANGEROUS if CLIENT_ID is shared with your Python bot, as these will WIPE ALL commands:
// -------------------------------------------------------------------------------------

// 3. To clear ALL GLOBAL commands (DANGEROUS - WILL WIPE PYTHON BOT'S COMMANDS TOO IF TOKEN/CLIENT_ID IS SHARED):
// console.warn("Attempting to clear ALL global commands. THIS IS DANGEROUS IF CLIENT_ID IS SHARED!");
// clearAllGlobalCommands(); 

// 4. To clear ALL commands from a SPECIFIC GUILD (Still potentially DANGEROUS for shared Client IDs if Python bot uses guild commands):
// console.warn("Attempting to clear ALL commands from a specific guild. THIS IS DANGEROUS IF CLIENT_ID IS SHARED AND PYTHON BOT USES GUILD COMMANDS!");
// clearAllGuildCommands('YOUR_GUILD_ID_HERE');

// console.log("Script loaded. Review and uncomment the desired function call within the script to execute."); 