# HUMANS.md — actions only a human can do

- [ ] Reconnect the timetable MCP server: run `/mcp` in Claude Code (or restart the session). The server itself is verified healthy (handshake ~115ms, 12 tools, token valid); the earlier timeout was a stale connection.
- [ ] If the live timetable still looks like the old week after this deploy, hard-refresh or tap the SW update bar so clients pick up `tt-v12`.
