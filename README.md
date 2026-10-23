# votetogether

Votetogether is a web app that allows groups of friends to vote on things together. FOr example, how much does everyone love cheese?
The app consists of a backend and a pgsql db (vote_together). The frontend has 2 main screens:

- a shared game screen to be projected on a tv
- individual player screens where they can access and interact with the tv game using a code

The shared gamescreen thus needs to have a code the players can use.
Then the game starts, an image of the thing to vote on appears on the main screen. ON individual players screens the name of the thing appears as well as a 1-10 scale they can click on. As players vote, the game screen updates in real time of who voted already. When everyone has voted, we move on to the next question. Once the questions are over a screen on the main game shows how everyone voted on each thing, to spark discussion. The players can then choose to play again in a different category, like 'actors' or 'movies' or 'pizza toppings'.

- `backend/` — NestJS API (port 3000, routes under `/api`)
- `frontend/` — React + Vite + TypeScript (port 5173, proxies `/api` to the backend)

## Getting started

```sh
npm install && npm run install:all
npm run dev        # runs backend and frontend together
```

Open http://localhost:5173.

## Database

The backend connects using the `VOTE_TOGETHER_PG_URL` connection string from your shell env
(e.g. `postgres://user:pass@localhost:5432/vote_together`). The schema is defined with Drizzle in
`backend/src/db/schema.ts`. To set up the database, run this in `backend/`:

```sh
npm run db:migrate && npm run db:seed
```

After changing the schema, run `npm run db:generate` to create a new migration.

## How a game works

1. **Create (TV).** _Create game_ makes a game with a 4-letter join code (no I or O, so it can't be
   misread on a TV). Every game currently uses the _Foods_ category. The TV shows the code and
   lists players as they join.
2. **Join (phones).** Players enter the code and a name. A game holds up to 20 players.
3. **Start (any phone).** Any player can press _Start game_ once everyone is in. That starts a
   10-second countdown on every screen and closes the game to new players. Anyone can cancel it,
   which reopens the lobby.
4. **Vote (phones).** Each phone shows the current question with a 1–10 slider and a _Vote_ button.
   A player can change their vote until the game moves on. The TV ticks off each player as they
   vote, without showing the scores.
5. **Next question.** Once everyone has voted, the TV counts down 5 seconds and then moves everyone
   to the next question.
6. **Results.** After the last question, the TV goes through the results one question at a time.
   Each question's chart is made of people's names: there's a column for each score from 1 to 10,
   and every player's name is stacked in the column for the score they gave, coloured on the same
   warm scale as the slider (red for "hate it", through mustard, to green for "love it"). Everyone
   sees who voted what. Each phone shows that player's own score and a **Next** button. Tapping it
   can't be undone. Once every *connected* player has tapped it, everyone moves straight on to the
   next question's results, with no countdown. Players who have dropped out don't hold the others
   up. The results go in question order for now; ordering them by how much people agreed is
   planned.

The TV and the phones each remember their game in a cookie (`vt_hosted_game` for the TV,
`vt_player` for a phone), so a refresh or a dropped connection drops them back into the game.

## Player identity (a deliberate trade-off)

There are no accounts yet, so **a player is identified by their name within a game**. Joining with
a name that's already in the game, in any letter case, rejoins as that player instead of failing.
That means someone who loses their cookie, switches phone or closes the tab can get straight back
in just by typing their name again.

The cost is that anyone who knows the code can take over another player's seat by typing their
name. In the same spirit, socket actions (start, cancel, vote, next) take a player id with no
authentication. This is a deliberate choice of ease of rejoining over security, because
Votetogether is a party game played with friends in the same room. Revisit it when signup is
added.

## Realtime

The TV and the phones stay in sync over a Socket.IO WebSocket at `/api/socket.io` (handled by
`backend/src/games/games.gateway.ts`, used through `frontend/src/socket.ts`). Joining is the only
player action that stays HTTP (`POST /api/games/:code/players`), because the phone needs its player
id first. Everything after that goes over the socket:

| Message | Sent by | What it does |
| --- | --- | --- |
| `watch` `{ code, playerId? }` | TV and phones (phones include their `playerId`) | Subscribe to a game. The reply carries the current state, so a screen that reconnects catches up. |
| `start` `{ code, playerId }` | a phone | Begin the start countdown and close joining. |
| `cancelStart` `{ code, playerId }` | a phone | Stop the start countdown and reopen joining. |
| `begin` `{ code }` | every screen, when the start countdown hits 0 | Move to question 1. Only the first one counts. |
| `vote` `{ code, playerId, score }` | a phone | Record or change a 1–10 vote on the current question. |
| `next` `{ code, questionNumber }` | the TV, when its countdown hits 0 | Move to the next question, or to the results after the last. A repeated or late `next` does nothing. |
| `next-result` `{ code, playerId, questionNumber }` | a phone, on the results | Mark this player ready to move on (it can't be undone). Once every connected player is ready, move to the next question's results. |

After any change (a player joining, a countdown starting or being cancelled, a first vote on a
question, the game moving on, a player tapping Next on the results, a phone connecting or
dropping out), the server pushes the updated game to every screen in the room as a `game` event.
Scores stay hidden while the game is being played. Only `votedPlayerIds` is sent until the results,
which include each player's score.

**Countdowns run on the screens, not the server.** Nothing about them is stored in the database and
the server runs no timers. The screens count down and send `begin` or `next` when they reach 0. The
server only remembers, in memory, which lobbies are counting down to the start. That's how it keeps
joining closed and tells a screen that reloads mid-countdown how long is left. If the server
restarts, that's forgotten and the lobby simply reopens.

**Who's connected, and who has tapped Next on the results, are also only kept in memory.** A player
counts as connected while their phone's socket is watching the game, so a player with two tabs
open still counts once. These come with every update as `connectedPlayerIds` and `readyPlayerIds`.
If the server restarts, the phones reconnect and the players tap Next again.

## Tests

In `backend/`, with `VOTE_TOGETHER_PG_URL` pointing at a migrated and seeded database:

```sh
npm test           # unit tests
npm run test:e2e   # end-to-end tests: HTTP endpoints and the WebSocket, against the real database
```

The end-to-end tests create their own games and delete them afterwards.

## Scripts

- `npm run dev` — start both apps in watch mode
- `npm run build` — build both apps
