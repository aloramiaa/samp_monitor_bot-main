// require('dotenv').config(); // No longer needed
const express = require('express');
const samp = require('samp-query');
const os = require('os');

const app = express();
const port = process.env.PORT || 3000;

// --- UptimeRobot Health Check ---
app.get('/', (req, res) => {
  res.status(200).send('SA-MP API Helper is alive and running!');
});

// --- API Endpoints ---

// Middleware to extract and validate samp options from query string
const getSampOptions = (req, res, next) => {
    const { ip, port } = req.query;
    if (!ip) {
        return res.status(400).json({ error: 'Missing required query parameter: ip' });
    }
    if (!port) {
        return res.status(400).json({ error: 'Missing required query parameter: port' });
    }
    req.sampOptions = {
        host: ip,
        port: port
    };
    next();
};

// /api/ping - for basic service status, uptime, and memory usage
app.get('/api/ping', (req, res) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    res.json({
        status: 'ok',
        uptimeSeconds: uptime,
        uptimeFormatted: msToTime(uptime * 1000), // Convert seconds to ms for msToTime
        memoryUsage: {
            rssMb: (memoryUsage.rss / 1024 / 1024).toFixed(2),
            heapTotalMb: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
            heapUsedMb: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
            externalMb: (memoryUsage.external / 1024 / 1024).toFixed(2),
        }
    });
});

// /api/ip - returns basic server IP, port and online status
app.get('/api/ip', getSampOptions, (req, res) => {
    const startTime = process.hrtime();

    samp(req.sampOptions, (error, query) => {
        const endTime = process.hrtime(startTime);
        const queryLatencyMs = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);

        if (error) {
            return res.json({
                host: req.sampOptions.host,
                port: req.sampOptions.port,
                online: false,
                queryLatencyMs: parseFloat(queryLatencyMs),
                error: 'Server is offline or unreachable.'
            });
        }
        res.json({
            host: req.sampOptions.host,
            port: req.sampOptions.port,
            online: true,
            hostname: query ? query.hostname : null,
            queryLatencyMs: parseFloat(queryLatencyMs)
        });
    });
});

// /api/server - returns detailed server information
app.get('/api/server', getSampOptions, (req, res) => {
    samp(req.sampOptions, (error, query) => {
        if (error) {
            return res.status(503).json({
                host: req.sampOptions.host,
                port: req.sampOptions.port,
                online: false,
                error: 'Server is offline or unreachable.'
            });
        }
        res.json({
            host: req.sampOptions.host,
            port: req.sampOptions.port,
            online: true,
            hostname: query.hostname,
            gamemode: query.gamemode,
            language: query.language,
            passworded: query.passworded,
            maxplayers: query.maxplayers,
            onlineplayers: query.online,
            rules: query.rules
        });
    });
});

// /api/players - returns list of online players
app.get('/api/players', getSampOptions, (req, res) => {
    samp(req.sampOptions, (error, query) => {
        if (error) {
            return res.status(503).json({
                host: req.sampOptions.host,
                port: req.sampOptions.port,
                online: false,
                error: 'Server is offline or unreachable.'
            });
        }

        if (query.online === 0) {
            return res.json({
                host: req.sampOptions.host,
                port: req.sampOptions.port,
                online: true,
                hostname: query.hostname,
                onlineplayers: 0,
                maxplayers: query.maxplayers,
                players: []
            });
        }
        
        if (query.online > 100) {
            return res.json({
                host: req.sampOptions.host,
                port: req.sampOptions.port,
                online: true,
                hostname: query.hostname,
                onlineplayers: query.online,
                maxplayers: query.maxplayers,
                players: [],
                note: "Players are more than 100 and hence cant list them"
            });
        }

        if ((!query.players || query.players.length === 0) && query.online > 0) {
             return res.json({
                host: req.sampOptions.host,
                port: req.sampOptions.port,
                online: true,
                hostname: query.hostname,
                onlineplayers: query.online,
                maxplayers: query.maxplayers,
                players: [],
                note: "Player list is unavailable or the server did not return player details (player count is under 100)."
            });
        }
        
        res.json({
            host: req.sampOptions.host,
            port: req.sampOptions.port,
            online: true,
            hostname: query.hostname,
            onlineplayers: query.online,
            maxplayers: query.maxplayers,
            players: query.players.map(p => ({ id: p.id, name: p.name, score: p.score, ping: p.ping }))
        });
    });
});


app.listen(port, () => {
  console.log(`SA-MP API Helper server listening on port ${port}`);
});

// Helper function (msToTime)
const msToTime = ms => {
    if (!ms || ms < 0) return '0s';
    if (ms < 1000) return `${ms}ms`;

    let seconds = Math.floor((ms / 1000) % 60);
    let minutes = Math.floor((ms / (1000 * 60)) % 60);
    let hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    let days = Math.floor(ms / (1000 * 60 * 60 * 24));

    let str = [];
    if (days) str.push(days + 'd');
    if (hours) str.push(hours + 'h');
    if (minutes) str.push(minutes + 'm');
    if (seconds) str.push(seconds + 's');

    return str.length > 0 ? str.join(' ') : '0s';
};