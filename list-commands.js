require('dotenv').config(); // Load environment variables from .env file
const https = require('https');

async function listGlobalCommands() {
    const botToken = process.env.BOT_TOKEN;
    const clientId = process.env.CLIENT_ID;

    if (!botToken) {
        console.error('Error: BOT_TOKEN is not defined in the .env file.');
        return;
    }

    if (!clientId) {
        console.error('Error: CLIENT_ID is not defined in the .env file.');
        return;
    }

    const options = {
        hostname: 'discord.com',
        path: `/api/v10/applications/${clientId}/commands`,
        method: 'GET',
        headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json' // Good practice, though not strictly needed for GET
        }
    };

    console.log(`Fetching global commands for Application ID (CLIENT_ID): ${clientId}...`);

    const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    const commands = JSON.parse(data);
                    if (commands && commands.length > 0) {
                        console.log(`\nFound ${commands.length} global command(s):`);
                        commands.forEach(command => {
                            console.log(`  - Name: ${command.name}, ID: ${command.id}, Description: ${command.description || 'N/A'}`);
                            if (command.options && command.options.length > 0) {
                                console.log("    Options:");
                                command.options.forEach(option => {
                                    console.log(`      - ${option.name}: ${option.description}`);
                                });
                            }
                        });
                        console.log("\nNote: Command visibility in Discord clients can take up to an hour to update after changes.");
                    } else {
                        console.log("No global commands are currently registered for this bot application.");
                    }
                } catch (e) {
                    console.error("Error parsing JSON response from Discord API:", e);
                    console.error("Response body:", data);
                }
            } else {
                console.error(`HTTP error occurred: ${res.statusCode} ${res.statusMessage}`);
                console.error("Response body:", data);
            }
        });
    });

    req.on('error', (error) => {
        console.error('Request error occurred:', error);
    });

    req.end();
}

if (require.main === module) {
    listGlobalCommands();
} 