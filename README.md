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

## Scripts

- `npm run dev` — start both apps in watch mode
- `npm run build` — build both apps
