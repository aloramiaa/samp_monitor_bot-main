# SA-MP API Helper Service

This Node.js application acts as an HTTP microservice to query SA-MP (San Andreas Multiplayer) servers. It's designed to be called by another application (e.g., a Discord bot written in Python) to offload SA-MP query logic.

## Features

-   Provides HTTP GET endpoints to retrieve SA-MP server information.
-   Lightweight and focused solely on SA-MP queries via an HTTP interface.
-   Includes a basic health check endpoint for uptime monitoring services.

## Prerequisites

-   Node.js (v16 or newer recommended)
-   npm (usually comes with Node.js)

## Setup

1.  **Clone the Repository (or download the files):**
    ```bash
    # If this were a git repository
    # git clone <repository_url>
    # cd <repository_directory>
    ```
    Ensure you have `bot.js`, `package.json`, and create a `.env` file.

2.  **Install Dependencies:**
    Open your terminal in the project directory and run:
    ```bash
    npm install
    ```
    This will install `express`, `dotenv`, `samp-query`, `ascii-table` (if still used, though current API returns JSON), and `os`.

3.  **Create `.env` File:**
    Create a file named `.env` in the root of your project directory. Add the following environment variables:

    ```env
    # SA-MP Server Configuration
    SAMP_IP=YOUR_SAMP_SERVER_IP:PORT

    # Web Server Configuration (Optional - defaults to 3000)
    PORT=3000
    ```

    Replace `YOUR_SAMP_SERVER_IP:PORT` with the actual IP address and query port of the SA-MP server you want to monitor (e.g., `127.0.0.1:7777`).

4.  **Run the Service:**
    ```bash
    node bot.js
    ```
    You should see a message like: `SA-MP API Helper server listening on port 3000`.

## API Endpoints

All SA-MP related endpoints require the `SAMP_IP` environment variable to be correctly set in the `.env` file. If not set, these endpoints will return a 500 error.

If the SA-MP server is offline or unreachable during a query, the respective endpoint will typically return a 503 error or a JSON response indicating the server is offline.

### 1. Health Check

-   **Endpoint:** `/`
-   **Method:** `GET`
-   **Description:** A simple endpoint to check if the service is alive. Intended for uptime monitoring services like UptimeRobot.
-   **Success Response (200 OK):
    ```text
    SA-MP API Helper is alive and running!
    ```

### 2. API Ping / Service Status

-   **Endpoint:** `/api/ping`
-   **Method:** `GET`
-   **Description:** Returns basic status of the API helper service, including its uptime and memory usage.
-   **Success Response (200 OK):
    ```json
    {
        "status": "ok",
        "uptimeSeconds": 12345.67,
        "uptimeFormatted": "3h 25m 45s",
        "memoryUsage": {
            "rssMb": "50.25",
            "heapTotalMb": "30.10",
            "heapUsedMb": "20.50",
            "externalMb": "2.00"
        }
    }
    ```

### 3. Server IP and Online Status

-   **Endpoint:** `/api/ip`
-   **Method:** `GET`
-   **Description:** Returns the configured SA-MP server IP, port, its online status, and the latency of the query to the SA-MP server.
-   **Success Response (200 OK - Server Online):
    ```json
    {
        "host": "127.0.0.1",
        "port": "7777",
        "online": true,
        "hostname": "My SA-MP Server",
        "queryLatencyMs": 35.67
    }
    ```
-   **Success Response (200 OK - Server Offline/Unreachable):
    ```json
    {
        "host": "127.0.0.1",
        "port": "7777",
        "online": false,
        "queryLatencyMs": 15.23, 
        "error": "Server is offline or unreachable."
    }
    ```

### 4. Detailed Server Information

-   **Endpoint:** `/api/server`
-   **Method:** `GET`
-   **Description:** Returns detailed information about the SA-MP server.
-   **Success Response (200 OK):
    ```json
    {
        "host": "127.0.0.1",
        "port": "7777",
        "online": true,
        "hostname": "My SA-MP Server",
        "gamemode": "Freeroam",
        "language": "English",
        "passworded": false,
        "maxplayers": 50,
        "onlineplayers": 10,
        "rules": {
            "mapname": "San Andreas",
            "weburl": "www.example.com",
            "version": "0.3.7-R2",
            "weather": "10",
            "worldtime": "12:00",
            "lagcomp": "On",
            // ... other rules
        }
    }
    ```
-   **Error Response (e.g., 503 Service Unavailable - Server Offline):
    ```json
    {
        "host": "127.0.0.1",
        "port": "7777",
        "online": false,
        "error": "Server is offline or unreachable."
    }
    ```

### 5. Online Players List

-   **Endpoint:** `/api/players`
-   **Method:** `GET`
-   **Description:** Returns a list of players currently online on the SA-MP server.
-   **Success Response (200 OK - Players Online & List Available):
    ```json
    {
        "host": "127.0.0.1",
        "port": "7777",
        "online": true,
        "hostname": "My SA-MP Server",
        "onlineplayers": 2,
        "maxplayers": 50,
        "players": [
            { "id": 0, "name": "Player1", "score": 100, "ping": 50 },
            { "id": 1, "name": "Player2", "score": 85, "ping": 65 }
        ]
    }
    ```
-   **Success Response (200 OK - Server Online, No Players):
    ```json
    {
        "host": "127.0.0.1",
        "port": "7777",
        "online": true,
        "hostname": "My SA-MP Server",
        "onlineplayers": 0,
        "maxplayers": 50,
        "players": []
    }
    ```
-   **Success Response (200 OK - Player Count Over 100):
    ```json
    {
        "host": "127.0.0.1",
        "port": "7777",
        "online": true,
        "hostname": "My SA-MP Server",
        "onlineplayers": 105, // Actual number of players online
        "maxplayers": 150,
        "players": [],
        "note": "Players are more than 100 and hence cant list them"
    }
    ```
-   **Success Response (200 OK - Player List Unavailable, Count Under 100):
    ```json
    {
        "host": "127.0.0.1",
        "port": "7777",
        "online": true,
        "hostname": "My SA-MP Server",
        "onlineplayers": 5, // Actual number of players online
        "maxplayers": 50,
        "players": [],
        "note": "Player list is unavailable or the server did not return player details (player count is under 100)."
    }
    ```
-   **Error Response (e.g., 503 Service Unavailable - Server Offline):
    ```json
    {
        "host": "127.0.0.1",
        "port": "7777",
        "online": false,
        "error": "Server is offline or unreachable."
    }
    ```

## Deployment (e.g., on Render)

This service is a standard Node.js application and can be deployed to platforms like Render, Heroku, etc.

For Render (Free Tier):

1.  Push your code to a GitHub/GitLab repository.
2.  Create a new "Web Service" on Render and connect it to your repository.
3.  **Build Command:** `npm install` (or `yarn install` if you switch to yarn)
4.  **Start Command:** `node bot.js`
5.  **Environment Variables:** Add your `SAMP_IP` (and optionally `PORT`) in the Render dashboard under your service's Environment settings.
6.  **Health Check:** Render's free web services will spin down due to inactivity. Use the `/` endpoint of your deployed service (e.g., `https://your-samp-api.onrender.com/`) with an external uptime monitoring service (like UptimeRobot) to ping it every 5-15 minutes to keep it alive. Render also has its own health check mechanism that will use the root path `/` by default if your application responds with a 200-299 status code.

## Calling from Python Bot

Your main Python Discord bot will use an HTTP client library (like `requests`) to call these endpoints.

Example (Python):

```python
import requests
import json

# Assuming your Node.js service is running on localhost:3000
API_BASE_URL = "http://localhost:3000"

def get_samp_server_info():
    try:
        response = requests.get(f"{API_BASE_URL}/api/server")
        response.raise_for_status()  # Raises an exception for HTTP errors (4xx or 5xx)
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error querying SA-MP API: {e}")
        return None

# Example usage in your Python bot's command:
# server_data = get_samp_server_info()
# if server_data and server_data.get('online'):
#     # Format and send to Discord
#     pass
# else:
#     # Send server offline message
#     pass
```
