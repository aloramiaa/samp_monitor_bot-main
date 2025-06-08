# SA-MP API Helper Service

This Node.js application acts as a flexible HTTP microservice to query any SA-MP (San Andreas Multiplayer) server. It's designed to be called by another application (e.g., a Discord bot) by providing the server address in the API call itself.

## Features

-   Provides HTTP GET endpoints to retrieve SA-MP server information dynamically.
-   Lightweight and focused solely on SA-MP queries via an HTTP interface.
-   No local server configuration needed; the SA-MP server address is provided in each request.
-   Includes a basic health check endpoint for uptime monitoring.

## Prerequisites

-   Node.js (v16 or newer recommended)
-   npm (usually comes with Node.js)

## Setup

1.  **Get the code:**
    Clone the repository or download the files (`bot.js`, `package.json`, etc.).

2.  **Install Dependencies:**
    Open your terminal in the project directory and run:
    ```bash
    npm install
    ```
    This will install `express`, `samp-query`, and `os`.

3.  **Run the Service:**
    ```bash
    node bot.js
    ```
    You should see a message like: `SA-MP API Helper server listening on port 3000`. You can optionally set a `PORT` environment variable if you need to use a port other than 3000.

## API Endpoints

### 1. Health Check

-   **Endpoint:** `/`
-   **Method:** `GET`
-   **Description:** A simple endpoint to check if the service is alive. Intended for uptime monitoring services like UptimeRobot.
-   **Success Response (200 OK):**
    ```text
    SA-MP API Helper is alive and running!
    ```

### 2. API Ping / Service Status

-   **Endpoint:** `/api/ping`
-   **Method:** `GET`
-   **Description:** Returns the status of the API helper service itself, including its uptime and memory usage. This endpoint does **not** query a SA-MP server.
-   **Success Response (200 OK):**
    ```json
    {
        "status": "ok",
        "uptimeSeconds": 12345.67,
        "uptimeFormatted": "3h 25m 45s",
        "memoryUsage": { ... }
    }
    ```

### 3. Server IP and Online Status

-   **Endpoint:** `/api/ip`
-   **Method:** `GET`
-   **Query Parameters:**
    -   `ip` (required): The IP address of the SA-MP server.
    -   `port` (required): The query port of the SA-MP server.
-   **Example URL:** `http://localhost:3000/api/ip?ip=127.0.0.1&port=7777`
-   **Description:** Returns basic server info and the latency of the query.
-   **Success Response (200 OK - Server Online):**
    ```json
    {
        "host": "127.0.0.1",
        "port": "7777",
        "online": true,
        "hostname": "My SA-MP Server",
        "queryLatencyMs": 35.67
    }
    ```

### 4. Detailed Server Information

-   **Endpoint:** `/api/server`
-   **Method:** `GET`
-   **Query Parameters:**
    -   `ip` (required): The IP address of the SA-MP server.
    -   `port` (required): The query port of the SA-MP server.
-   **Example URL:** `http://localhost:3000/api/server?ip=127.0.0.1&port=7777`
-   **Description:** Returns detailed information about the specified SA-MP server.
-   **Success Response (200 OK):**
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
        "rules": { ... }
    }
    ```

### 5. Online Players List

-   **Endpoint:** `/api/players`
-   **Method:** `GET`
-   **Query Parameters:**
    -   `ip` (required): The IP address of the SA-MP server.
    -   `port` (required): The query port of the SA-MP server.
-   **Example URL:** `http://localhost:3000/api/players?ip=127.0.0.1&port=7777`
-   **Description:** Returns a list of players online on the specified SA-MP server. It includes special notes for certain conditions.
-   **Success Response (200 OK - Players Online & List Available):**
    ```json
    {
        "host": "127.0.0.1",
        "port": "7777",
        "online": true,
        "onlineplayers": 2,
        "players": [
            { "id": 0, "name": "Player1", "score": 100, "ping": 50 },
            { "id": 1, "name": "Player2", "score": 85, "ping": 65 }
        ]
    }
    ```
-   **Success Response (200 OK - Player Count Over 100):**
    ```json
    {
        "host": "127.0.0.1",
        "port": "7777",
        "online": true,
        "onlineplayers": 105,
        "players": [],
        "note": "Players are more than 100 and hence cant list them"
    }
    ```

## Calling from Python Bot

Your main Python bot can now query any SA-MP server by dynamically building the URL.

```python
import requests

API_BASE_URL = "http://localhost:3000" # Or your deployed service URL

def get_samp_server_info(server_ip: str, server_port: int):
    try:
        # Construct the URL with query parameters
        url = f"{API_BASE_URL}/api/server?ip={server_ip}&port={server_port}"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error querying SA-MP API for {server_ip}:{server_port} - {e}")
        return None

# Example usage in your Python bot's command:
# server_data = get_samp_server_info("some.samp.server", 7777)
# if server_data and server_data.get('online'):
#     # Format and send to Discord
#     pass
```
