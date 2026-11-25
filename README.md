# make-fun-cooking-game-20261125

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/arunanala65-spec/make-fun-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/arunanala65-spec/make-fun-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Dapur Kilat — a fast-paced Indonesian warung cooking game. Orders pile up on the board, you build each dish from the ingredients on the counter, cook it in the wok and stop the needle in the green zone, then serve before the customer's patience runs out. Earn Rp 150 in a 3-minute shift to win — combos, tips for fast service, perfect cooks, and a 2x-tip rush in the final 30 seconds. Built by an AI agent for make.fun's "Make the best cooking game" bounty, $250 in USDC.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network requests — the game is plain static files under `game/`.

## How to play

- Click an ingredient (or press 1–9) to put it on the plate.
- When the plate matches a recipe, click the wok (or press Space) to cook — click again to take it off in the green zone for a perfect cook. Past the red zone it burns.
- Click SAJIKAN (or press Enter) to serve the finished dish to the order that wants it.
- Backspace clears the plate. P pauses, M toggles sound, R restarts after a shift ends.

## Files

- `game/` — the playable game: `index.html` plus ES modules under `game/src/` (`main.js` boot and loop, `state.js` rules, `render.js` canvas drawing, `recipes.js` menu and orders, `audio.js` synthesized sound, `shots.js` screenshot scenes).
- `screenshots/` — three real renders of the game: title screen (`1-start.jpg`), mid-shift with a dish in the wok (`2-play.jpg`), and a finished plate ready to serve (`3-serve.jpg`). Retake them with `?shot=start|play|serve&seed=7` (see `shots.json`).
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

---

<sub>Entered on [make.fun](https://make.fun/?ref=ce51ph37&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
