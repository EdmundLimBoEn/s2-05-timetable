# timetable-mcp

MCP server that wraps the S2-05 timetable admin API. Gives AI agents (Claude Desktop, Claude Code, etc.) full admin parity — they can read and write the timetable, exams, announcements, overrides, and custom subjects.

---

## Option A — Hosted HTTP (recommended, zero install)

The MCP server runs on the Hack Club container at `mcp.timetable.edmundlim.systems`. No local install needed.

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "timetable": {
      "url": "https://mcp.timetable.edmundlim.systems/mcp",
      "headers": {
        "Authorization": "Bearer your-raw-token-here"
      }
    }
  }
}
```

### Claude Code (`.mcp.json` in repo root)

```json
{
  "mcpServers": {
    "timetable": {
      "url": "https://mcp.timetable.edmundlim.systems/mcp",
      "headers": {
        "Authorization": "Bearer your-raw-token-here"
      }
    }
  }
}
```

> **Note:** `.mcp.json` is gitignored — create it locally, never commit it.

### Getting a token

See [AGENTS.md § 1 — Generate an API token](../AGENTS.md#1-generate-an-api-token).

---

## Option B — Local stdio (development)

Runs as a subprocess on your machine. Useful for local development or when you want to point at the testing server.

### Prerequisites

- Node.js 18+
- A bearer API token (see [AGENTS.md](../AGENTS.md#1-generate-an-api-token))

### Install

```bash
cd mcp-server
npm install
```

### Claude Desktop

```json
{
  "mcpServers": {
    "timetable": {
      "command": "node",
      "args": ["/absolute/path/to/timetable/mcp-server/server.js"],
      "env": {
        "TIMETABLE_API_URL": "https://timetable.edmundlim.systems",
        "TIMETABLE_API_TOKEN": "your-raw-token-here"
      }
    }
  }
}
```

### Claude Code

```json
{
  "mcpServers": {
    "timetable": {
      "command": "node",
      "args": ["./mcp-server/server.js"],
      "env": {
        "TIMETABLE_API_URL": "https://timetable.edmundlim.systems",
        "TIMETABLE_API_TOKEN": "your-raw-token-here"
      }
    }
  }
}
```

---

## Environment variables

| Variable | When required | Description |
|---|---|---|
| `TIMETABLE_API_URL` | Always | Base URL, e.g. `https://timetable.edmundlim.systems` (no trailing slash) |
| `TIMETABLE_API_TOKEN` | stdio mode only | Bearer token for all API calls |
| `MCP_PORT` | HTTP mode only | Port to listen on (e.g. `3002`). Omit for stdio. |

---

## Tools

| Tool | What it does |
|---|---|
| `get_timetable` | Fetch the full timetable, exams, announcements, overrides, custom subjects |
| `set_week` | Replace all 5 days of one week (odd or even) |
| `add_custom_subject` | Add a new custom subject type |
| `delete_custom_subject` | Delete a custom subject; rewrites affected blocks to "empty" |
| `add_announcement` | Post a new announcement (server assigns id/createdAt/createdBy) |
| `delete_announcement` | Remove an announcement by id |
| `add_exam` | Add an exam or event to the events list |
| `delete_exam` | Remove an exam/event by id |
| `add_override` | Add a holiday or custom-schedule override for a date |
| `delete_override` | Remove a day override by date |
| `list_custom_subjects` | Return just the custom subjects array |
| `save_timetable` | Advanced: POST a full payload directly (escape hatch — prefer specific tools) |

---

## Hosted server setup (admin reference)

The HTTP MCP server is deployed on the Hack Club container as PM2 process `timetable-mcp` on port 3002, proxied at `mcp.timetable.edmundlim.systems`.

### First-time setup on the server

```bash
ssh edmundlim@hackclub.app
source ~/.nvm/nvm.sh
cd ~/timetable

# Start the MCP HTTP server (only needed once — PM2 remembers it)
pm2 start ecosystem.config.cjs --only timetable-mcp
pm2 save
```

Then in the Hack Club proxy dashboard (`dashboard.hackclub.app`):
- Add domain: `mcp.timetable.edmundlim.systems → 10.60.1.113:3002`

And in Cloudflare DNS:
- Add CNAME: `mcp.timetable → hackclub.app` (proxied)

After that, future deployments restart it automatically.

### Manage the process

```bash
pm2 status
pm2 logs timetable-mcp
pm2 restart timetable-mcp
```

### Token management

The MCP HTTP server validates each request's bearer token against `/api/me` on the main timetable server. Add tokens the same way as any admin token — see `API_TOKENS_JSON` in `~/.env` and `AGENTS.md § 1`.
