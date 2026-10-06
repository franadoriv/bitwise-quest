Original prompt: Add optional Google cloud saves through Supabase, alongside local saves with an export/import warning, matching the game's retro design and animations.

- Read the architecture, save system, localization, security rules, and Next.js client/env/CSP guides.
- Implement browser-only Supabase Auth and cloud sync; keep Vercel stateless and preserve existing local saves.
- Use account-isolated caches, revision checks, and explicit conflict resolution; prepare owner-only SQL for the user to apply.
- Verify unit tests, content, types, security probes, memory-card E2E, Japanese layouts, and production build.
- User steering: use three slots in each mode; Local and Cloud are separate cards, exchangeable through the same .bwq export/import format. Preserve previous slots 4–15 for export.
- Added bounded decompression and untrusted-save schema validation, including poison keys and JSON depth/node limits.
- SQL ownership/CAS/tombstone tests and local memory-card E2E pass. Corrected asynchronous waits and an EXPORT selector (the actual footer label includes an arrow) in cloud E2E.
- Cloud E2E passes: restore across devices, offline conflicts, recovery of the other version, export to local, account isolation, mode switching, and EN/ES/JA portrait/landscape. All Supabase requests were mocked.
- Japanese lesson playtest completed and saved progress. Production build and hostile request/CSP probes pass.
- Deployment prerequisites still require the user to apply the SQL in Supabase and set the two public environment variables in Vercel; real Google OAuth has not been exercised yet.
- Final validation: 63 unit tests, 0 content errors/warnings, typecheck, build and production dependency audit pass. Local/card and mocked cloud E2E, Japanese lesson playtest and hostile-request probes pass. Entry animations use explicit start/end transforms to avoid Strict Mode offsets; reduced motion is honored.
