require('dotenv').config();
const express = require('express');
const samp = require('samp-query');
const AsciiTable = require('ascii-table'); // Keep for /api/players if it provides a raw data option, otherwise remove/replace
const os = require('os'); // For system information if needed for ping, or just process.uptime

const app = express();
const port = process.env.PORT || 3000;

// Middleware to ensure SAMP_IP is set for SA-MP related routes
const ensureSampIp = (req, res, next) => {
    if (!process.env.SAMP_IP) {
        return res.status(500).json({ error: 'SAMP_IP is not configured in the .env file.' });
    }
    req.sampOptions = {
        host: process.env.SAMP_IP.split(':')[0],
        port: process.env.SAMP_IP.split(':')[1] || '7777'
    };
    next();
};

// --- UptimeRobot Health Check ---
app.get('/', (req, res) => {
  res.status(200).send('SA-MP API Helper is alive and running!');
});

// --- API Endpoints ---

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
app.get('/api/ip', ensureSampIp, (req, res) => {
    const startTime = process.hrtime(); // Start timer

    samp(req.sampOptions, (error, query) => {
        const endTime = process.hrtime(startTime); // End timer
        const queryLatencyMs = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2); // Calculate latency in ms

        if (error) {
            // console.error(`SAMP Query Error for /api/ip on ${req.sampOptions.host}:${req.sampOptions.port}:`, error);
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
            hostname: query ? query.hostname : null, // Add hostname if available
            queryLatencyMs: parseFloat(queryLatencyMs)
        });
    });
});

// /api/server - returns detailed server information
app.get('/api/server', ensureSampIp, (req, res) => {
    samp(req.sampOptions, (error, query) => {
        if (error) {
            // console.error(`SAMP Query Error for /api/server on ${req.sampOptions.host}:${req.sampOptions.port}:`, error);
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
            onlineplayers: query.online, // 'online' is the key for current players from samp-query
            rules: query.rules // Includes mapname, weburl, version, etc.
        });
    });
});

// /api/players - returns list of online players
app.get('/api/players', ensureSampIp, (req, res) => {
    samp(req.sampOptions, (error, query) => {
        if (error) {
            // console.error(`SAMP Query Error for /api/players on ${req.sampOptions.host}:${req.sampOptions.port}:`, error);
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
                online: true, // Server is online, but no players
                hostname: query.hostname,
                onlineplayers: 0,
                maxplayers: query.maxplayers,
                players: []
            });
        }
        
        // Case 1: More than 100 players online
        if (query.online > 100) {
            return res.json({
                host: req.sampOptions.host,
                port: req.sampOptions.port,
                online: true,
                hostname: query.hostname,
                onlineplayers: query.online,
                maxplayers: query.maxplayers,
                players: [], // Player list is not provided in this case
                note: "Players are more than 100 and hence cant list them"
            });
        }

        // Case 2: 1-100 players online, but list is empty/unavailable from server
        if ((!query.players || query.players.length === 0) && query.online > 0) { // query.online > 0 is redundant here due to earlier checks, but good for clarity
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
        
        // Case 3: Players online (<=100) and list is available
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
  if (!process.env.SAMP_IP) {
    console.warn('Warning: SAMP_IP is not defined in the .env file. SA-MP related API endpoints will return an error.');
  }
});

// Helper function (msToTime) - adapted from original ping command
const msToTime = ms => {
    if (!ms || ms < 0) return '0s';
    if (ms < 1000) return `${ms}ms`; // Show ms if less than a second

    let seconds = Math.floor((ms / 1000) % 60);
    let minutes = Math.floor((ms / (1000 * 60)) % 60);
    let hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    let days = Math.floor(ms / (1000 * 60 * 60 * 24));

    let str = [];
    if (days) str.push(days + 'd');
    if (hours) str.push(hours + 'h');
    if (minutes) str.push(minutes + 'm');
    if (seconds) str.push(seconds + 's');

    return str.length > 0 ? str.join(' ') : '0s'; // Fallback for very small ms values that might result in empty array
};