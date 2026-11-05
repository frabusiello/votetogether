# Plan: lobbies

Move the join code and the players from `games` into a new `lobbies` table. A lobby is a group of
friends at one TV: its code never changes, and every game they play (the first, and each Back to
the lobby) is a new row in `games` that points at it.

Why:

- **The code doesn't change on replays.** Screens stay in the same socket room, so `nextCode` and
  the "follow the new game" logic go away.
- **History.** Everything a lobby played is `games where lobby_id = X`, with its quiz,
  `game_items` and votes. Today that means following the `next_game_id` chain.
- **Players keep their id across replays**, so a phone's saved seat stays valid and results can
  later span the whole night (e.g. Most alike).

There's no live site and every deployment or test run starts from an empty database, so the
migration needs no data migration: reset the local database after generating it.

Each step should leave the app compiling. Run the backend tests from step 6 on.

## 1. Schema

In `backend/src/db/schema.ts`:

- [ ] New `lobbies` table:
  - `id` (serial)
  - `code` (text, not null, unique)
  - `currentGameId` (nullable, references `games.id`, `on delete set null`; needs `AnyPgColumn`,
    like `nextGameId` does today, because the two tables point at each other)
  - `createdAt`
- [ ] `games`:
  - add `lobbyId` (not null, references `lobbies.id`, `on delete cascade`)
  - remove `code` and `nextGameId`
- [ ] `players`:
  - replace `gameId` with `lobbyId` (cascade)
  - the unique name constraint becomes `(lobbyId, name)`
- [ ] `votes`: the unique constraint becomes `(gameId, playerId, itemId)`. Now that a player
  lasts across games, they can meet the same item again in a later game.
- [ ] Export a `Lobby` type next to the others.
- [ ] `npm run db:generate -- --name lobbies` in `backend/`. Read the SQL before running it.
- [ ] Reset the local database (drop and recreate it, or `docker compose down -v` for Docker),
  then `npm run db:migrate && npm run db:seed`.

The backend won't compile after this step. That's expected: steps 2–5 fix it.

## 2. Look up a game by code

Almost every service method does `where(eq(games.code, code))`. Replace those with one private
helper first, so the rest of the change is mechanical.

- [ ] `currentGame(code)`: join `lobbies` to `games` on `lobbies.currentGameId`, filtered by
  `lobbies.code`. Return the game's columns plus `lobbyId` and `code`. Throw the same
  `NotFoundException` as today when there's no lobby or no current game.
- [ ] The methods that **update** by code (`begin`, `advance`, `nextResult`): look the game up
  first, then update `where games.id = … and <the same status/index condition as today>`. The
  extra condition is what keeps two screens racing each other safe, so keep it.
- [ ] Go through every method: `getState`, `join`, `checkCanStart`, `begin`, `advance`,
  `nextResult`, `startNextGame`, `findGameForPlayer`, `vote`, `chooseQuiz`.

## 3. Creating a lobby

- [ ] `create()`, in a transaction:
  1. insert the lobby with a generated code (keep the retry-on-conflict loop, now on
     `lobbies.code`)
  2. insert its first game with `lobbyId`
  3. set `lobbies.currentGameId` to that game
- [ ] Pull out a small `newGame(tx, lobbyId, quizId)` helper for steps 2–3, because step 5
  reuses it.

## 4. Players belong to the lobby

- [ ] `join`: find and insert players by `lobbyId`. Keep the rules: rejoining by name always
  works, and a new name is only allowed while the current game is in `lobby` and not starting.
- [ ] `findGameForPlayer` and `vote`: check the player is in the **lobby**.
- [ ] `getState`: list the lobby's players.
- [ ] `MAX_PLAYERS` counts the lobby's players.

For now every player in the lobby is in every game. Whether that's right is a thing to settle at
the end.

## 5. Back to the lobby starts a new game in the same lobby

- [ ] Replace `startNextGame` with `startNewGame(code)`:
  - keep the "only on the last result" check for now
  - create the game with `newGame()`
  - move the pointer with `update lobbies set current_game_id = new where current_game_id = old`
- [ ] If that update changes no rows, someone else's tap got there first: delete the game you
  just made and return the current state. It's the same race guard as today, just on the
  pointer.
- [ ] Nothing to copy: the players are already in the lobby.
- [ ] `getState`:
  - drop `nextCode`
  - keep returning the game's `id`, because the frontend needs it (step 7)
  - `code` now comes from the lobby

## 6. Gateway and tests

- [ ] `games.gateway.ts`: the `back-to-lobby` handler clears `ready` and `startingSoon` for the
  code and broadcasts the new state to the same room. The room name stays the code.
- [ ] Remove the `nextGameId` and `nextCode` leftovers.
- [ ] Update `games.service.spec.ts` and the e2e tests (`test/games.e2e-spec.ts`,
  `test/games-gateway.e2e-spec.ts`). Add tests for:
  - after Back to the lobby, the code is the same and every player keeps their id
  - an item from the first game can be voted on again in the second
  - two Back to the lobby taps at once make only one new game
- [ ] Run `npm test` and `npm run test:e2e` against a fresh database.

## 7. Frontend

- [ ] `types.ts`: remove `nextCode`.
- [ ] `App.tsx`: remove `goToNextGame` and the `nextCode` branches in `loadSavedGame` and the
  socket callback. A replay is now just another `game` event.
- [ ] **Game id in keys:** the code, the player id and the question number now all repeat
  between games, so anything keyed on them must also include `game.id`:
  - `voteKey` in `phone/VoteScreen.tsx`. Without the game id, a phone thinks it already voted on
    question 1 of the next game.
  - the `key={game.question.number}` props in `phone/PlayerScreen.tsx`
  - the TV's `QuestionScreen` effect (`question.number` dependency)
  - anything else that holds state per question
- [ ] Check that both cookies (`vt_hosted_game`, `vt_player`) need no change. They shouldn't,
  because the code and player id are now stable.

## 8. Check it and update the README

- [ ] Play two games in a row in the browser: the TV and phones stay on the same code, the
  players are already there, and votes in game 2 start fresh.
- [ ] Reload a phone mid-way through game 2: it comes back into the right game.
- [ ] README:
  - "How a game works" step 7 (no new code, no `next_game_id`)
  - the Realtime table (`back-to-lobby`, no `nextCode`)
  - the cookies paragraph
  - a short note on lobbies vs games

## Things to settle at the end

- **Code lifetime.** Codes now last, and 4 letters give about 450,000 combinations. Should a lobby
  expire after some idle time, and should an expired lobby's code be reusable? The unique
  constraint on `lobbies.code` would block reuse unless old lobbies are deleted or the
  constraint only covers active ones.
- **Who is in a game.** For now that's every player in the lobby. Do you want a `game_players`
  table, so history shows who actually played each game? It would also decide:
  - what happens to someone who leaves between rounds
  - whether a late joiner should hold up "everyone has voted"
- **Quiz for the next game.** Should a new game keep the previous game's quiz, or start with the
  default again?
- **Using the history.** For example, skip questions this lobby has already played when picking a
  game's items, or show "played before" in the quiz picker. That's a query over `game_items` for
  the lobby's games.
- **Ending a game in progress** (parked). This becomes "start a new game in this lobby" without
  the last-result check, so it's mostly step 5 with that guard removed.
- **The in-memory maps** (`ready`, `startingSoon`, connected players) are keyed by code. They
  must be cleared every time the current game changes, not only on Back to the lobby.
