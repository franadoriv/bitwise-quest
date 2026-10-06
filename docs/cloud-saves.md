# Optional cloud saves

The game has three slots per card and two separate cards: Local (the original browser saves) and Cloud (the signed-in Google account's Supabase saves). Both use the existing `SaveData` shape and `.bwq` exports. Import/export works in either direction. Switching cards never copies or overwrites a save. Previous local slots 4–15 remain available for export.

Vercel remains stateless. Browser components connect directly to Supabase Auth and its Data API. No progress API, private service key, server-side session or database connection is added to Next.js.

## Setup

1. Create a Supabase project and configure its Google provider with the OAuth Client ID and Client Secret from Google Auth Platform (web application).
2. In Google, authorize the game's HTTPS origin and the Supabase callback `https://<project>.supabase.co/auth/v1/callback`. Use external audience; add test users while in Testing, then publish the consent configuration when ready for everyone.
3. In Supabase Auth URL Configuration, set Site URL to the game's HTTPS origin. Allow `https://<game-host>/auth/callback` and `http://localhost:3000/auth/callback` for development. The browser's PKCE callback exchanges the one-time code; no server handles it.
4. Run [`supabase/migrations/202610060001_cloud_saves.sql`](../supabase/migrations/202610060001_cloud_saves.sql) in the Supabase SQL Editor. The publishable key cannot create the schema. The migration is safely repeatable.
5. Configure these **public** values in `.env.local` and Vercel Production/Preview, then rebuild:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_public_key
   ```

   Keep the Google Client Secret in Supabase's provider settings. Never use a Supabase secret/service-role key in this application. Without the public configuration, local saving still works and the cloud option is disabled.

## Data and security

- `public.cloud_saves` has `(user_id, slot)` as its primary key, JSONB `data`, a server-controlled `revision`, and `updated_at`. Slots are 1–3. Each JSON payload is bounded at 256 KiB. A null payload is a deletion tombstone.
- RLS permits an authenticated user to select only rows owned by `auth.uid()`. Anonymous users have no table access. Direct inserts, updates and deletes are revoked from application roles.
- The only write path is `sync_cloud_save(slot, expected_revision, data)`. It derives the owner from the verified JWT, validates the bounds, and atomically creates or advances that owner's slot only when the expected revision matches. A two-second per-slot cooldown limits rapid successive writes. This is not a global protection against many abusive accounts; monitor Supabase usage and Auth abuse controls.
- The strict CSP allows only the configured HTTPS `*.supabase.co` project **origin**, with no wildcard sources or Google scripts/iframes. OAuth uses top-level navigation. Script, worker, frame and other security directives stay unchanged.
- Cloud data is validated before migration. Imported `.bwq` files additionally validate magic, container/flags, lengths, checksum, header version and schema. Both compressed input and expanded output are bounded at 2 MB; depth and node-count limits prevent pathological JSON. Known fields must have valid types/ranges. Safe unknown fields and language keys are preserved.
- The checksum is corruption detection, not authentication or encryption. Players control their own saves and scores. Cloud saving is not a trusted leaderboard.

## Sync and recovery

Local storage keeps the original keys `bwq:slot:<n>` / `bwq:active`. Account caches use `bwq:cloud:<user-id>:slot:<n>` / `active`, with a separate per-slot journal (`revision`, `dirty`, `generation`). The save format remains v2; this feature does not change `SaveData`.

Writes persist locally first and flush after a three-second debounce. Edits are serialized so compression cannot reorder them. Cloud downloads cannot overwrite a local edit started in flight. On entering the card, on focus while viewing it, on reconnect, or with SYNC NOW, the card reconciles with the cloud. It does not poll or subscribe to Realtime. Uploads only send dirty slots; a restore does not write the save back.

If both versions differ and the remote revision advanced, show a conflict instead of choosing by device clocks. Players can export either version and choose which to keep. The most recent losing version for each slot is retained locally at `bwq:cloud:<user-id>:backup:<slot>`; RECOVER BACKUP imports it into a chosen slot with the usual overwrite confirmation. This backup is device-local, not a separate cloud slot.

If the cloud is unavailable, keep dirty data and display CLOUD UNAVAILABLE · SAVED LOCALLY. Retry when reconnecting/returning to the card or using SYNC NOW. Pending changes survive a reload unless the browser's storage is cleared. Leaving before the CLOUD SAVED confirmation may leave edits available only on that device. Logout and changing modes preserve each card's cache and pending writes independently.

COPY LOCAL SAVES explicitly copies different local saves into empty cloud slots and never overwrites occupied ones. The local originals remain intact. Export/import is available in both modes, including when the cloud is temporarily unavailable.

## Verification

- `npm test`: actual SQL against ephemeral PostgreSQL (PGlite), ownership/RLS, CAS, cooldown, size bounds and tombstones; sync races, offline retry, account namespaces, legacy saves and hostile imports.
- `npm run e2e`: local choice, new game, galaxy, export/import, overwrite confirmation and corrupted-file rejection.
- `node scripts/e2e-cloud-saves.mjs`: mocked Supabase sessions/transport in a real browser; restore between devices, offline conflicts, recovery, account isolation, local/cloud switching, and EN/ES/JA portrait/landscape layouts. All Supabase traffic is intercepted; it does not test the real Google OAuth provider.
- Real setup still needs a Google sign-in and a save restored in another browser after applying the migration and configuring the deployed env values.
