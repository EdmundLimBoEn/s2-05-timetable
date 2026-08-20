# HUMANS.md — actions only a human can do

- [ ] Reconnect the timetable MCP server: run `/mcp` in Claude Code (or restart the session). The server itself is verified healthy (handshake ~115ms, 12 tools, token valid); the earlier timeout was a stale connection.
- [ ] Hard-refresh (or tap the SW update bar) on https://testing.timetable.edmundlim.systems so the client picks up `tt-v12`, then check Chrome Task Manager energy vs other tabs.
- [ ] Merge https://github.com/EdmundLimBoEn/s2-05-timetable/pull/24 when testing looks good. Production clients also need a hard refresh for `tt-v12`.
