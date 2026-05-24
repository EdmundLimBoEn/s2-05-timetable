# Agent guide — S2-05 timetable API

This guide is for admins who want to hand a screenshot or pasted text to an AI agent (Claude, ChatGPT, Claude Code, etc.) and have it update the timetable automatically — without opening the admin panel.

---

## 1. Generate an API token

Run this on the timetable server (or locally, then copy the hash to the server):

```bash
source ~/.nvm/nvm.sh
cd ~/timetable   # or ~/timetable-dev for the testing environment
node scripts/generate-token.js claude-desktop
```

The raw token is printed **once**. Save it somewhere safe (password manager, `.env.local`).

Copy the hash into `~/.env` on the server:

```env
API_TOKENS_JSON=[{"name":"claude-desktop","tokenHash":"$2a$10$..."}]
```

For multiple tokens (one per agent), add objects to the array:

```env
API_TOKENS_JSON=[{"name":"claude-desktop","tokenHash":"$2a$10$..."},{"name":"chatgpt","tokenHash":"$2a$10$..."}]
```

Restart the server after editing `.env`:

```bash
pm2 restart timetable-dev   # testing
pm2 restart timetable       # production
```

> **Security:** tokens have full admin access. Keep them out of git. Revoke by removing the entry from `API_TOKENS_JSON` and restarting.

---

## 2. Option A — MCP server (Claude Desktop / Claude Code)

The MCP server gives the agent named, schema-validated tools — the easiest path for Claude clients.

### Install

```bash
cd mcp-server
npm install
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "timetable": {
      "command": "node",
      "args": ["/Users/YOUR_USER/Documents/apps/claude/timetable/mcp-server/server.js"],
      "env": {
        "TIMETABLE_API_URL": "https://timetable.edmundlim.systems",
        "TIMETABLE_API_TOKEN": "your-raw-token-here"
      }
    }
  }
}
```

Restart Claude Desktop. The `get_timetable`, `set_week`, `add_custom_subject`, `list_custom_subjects`, and `save_timetable` tools will appear.

### Claude Code

Create `.mcp.json` in the repo root (it is gitignored — never commit it):

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

## 3. Option B — Raw HTTPS (any agent / script / curl)

All existing admin endpoints accept `Authorization: Bearer <token>` in addition to the session cookie.

```bash
TOKEN="your-raw-token-here"
BASE="https://timetable.edmundlim.systems"

# Read current data
curl -s -H "Authorization: Bearer $TOKEN" $BASE/api/admin-data | jq .

# Save changes (example: flip extendedHours)
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(curl -s -H "Authorization: Bearer $TOKEN" $BASE/api/admin-data | jq '. + {extendedHours: true}')" \
  $BASE/api/save | jq .
```

The `updatedBy` field in the saved data will be `agent:<name>` so you can tell agent edits from human edits.

---

## 4. Recommended agent system prompt

Paste this at the start of your conversation (after attaching the MCP server or pasting the curl docs):

```
You are helping me update the S2-05 school timetable.

Data model:
- The timetable has two weeks: "odd" and "even". Each week has 5 days (Mon–Fri).
- Each day is an array of block objects: { label: string, span: number, style: string }.
- `span` is the number of 20-minute slots the block occupies. Every day must total exactly 30 spans (08:00–14:00).
- `style` maps to a subject key: built-ins are el, math, sci, hum, mt, sw, cce, hsl, hbl, cm, admt, ict, brk, empty, holiday. Custom subjects are also valid.

Rules:
1. Always call get_timetable first to read the current state before any mutation.
2. Use set_week when replacing a full week from a schedule.
3. Use add_custom_subject when a subject type doesn't exist yet.
4. Confirm your plan with me before calling save_timetable or set_week.
5. Every day must sum to exactly 30 spans — double-check before saving.

I'll give you a schedule (screenshot description, slide text, or plain text). Convert it to the data model and apply it.
```

---

## 5. Example workflow — loading a special programme week

1. Take a screenshot of the Google Slides weekly programme (or copy the text).
2. Open Claude Desktop with the timetable MCP server attached.
3. Paste the system prompt above, then say:

   > "Here is the programme for Week 7 ODD. Please update the odd week timetable to match it."

4. Paste the screenshot or text.
5. The agent will call `get_timetable`, convert the schedule, show you a draft, then call `set_week` on your approval.

---

## 6. API reference

### `GET /api/admin-data`
Returns the full data blob:
```json
{
  "timetable": { "odd": [[...], ...], "even": [[...], ...] },
  "exams": [...],
  "announcements": [...],
  "overrides": [...],
  "customSubjects": [...],
  "extendedHours": false,
  "updatedAt": "ISO",
  "updatedBy": "username"
}
```

### `POST /api/save`
Body: same shape as the response above (spread `GET` result, mutate what you need).
Returns: `{ ok, updatedAt, updatedBy, announcements, exams, overrides, extendedHours, customSubjects }`.
Errors: `{ errors: ["field description..."] }` (400) or `{ error: "..." }` (401/500).
