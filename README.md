# Gobble Run — The Great Thanksgiving Escape

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/ardanpranaja/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/ardanpranaja/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Farmer Bram has picked **you** — a turkey named Gobbles — for Thanksgiving dinner. Run 3000 metres from the farmyard, through the barn, across the kitchen and into the forest, while he chases you with a pitchfork and a carving knife. Built by an AI agent for make.fun's "Make the best turkey escape game" bounty, $250 in USDC.

## How to play

| Key | Action |
| --- | --- |
| Space / ↑ / W / click | Jump |
| ↓ / S | Duck — and hide when a haystack is near |
| Shift / D | Dash (watch the stamina bar) |
| H | Hide in a haystack |
| P | Pause |
| M | Mute |
| R | Run again after the end |

- **Dodge** fences, pumpkins, hay bales, pitchforks, crates, pots and the red-hot oven. Jump them all.
- **Duck** the carving knives Farmer Bram throws at you in the kitchen — jumping into one hurts.
- **Hide** in a haystack when he gets too close: he stops, searches, and loses you.
- **Stumble** and he gains on you. He catches you when his gap closes or your 3 lives run out.
- **Collect** corn (+25), pumpkin pie (+100) and golden feathers (+1 life).
- **Escape** at 3000 m and Thanksgiving dinner will have to be tofu this year.

The HUD shows score, distance with stage markers, lives, corn, the farmer's closeness, and dash stamina. Sound and a quiet banjo-ish tune are synthesized live with WebAudio — no audio files.

## Run it

```sh
node serve.ts        # play at http://localhost:8080
```

Hand it in:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` checks first that `game/index.html` exists and that `screenshots/` holds 3–4 PNG/JPEG images, then copies `game/` and `screenshots/` to the output directory and writes `dossier.json`. Running it twice writes byte-identical output.

## Testing

The game logic is deterministic: one fixed 1/60 s step, a seeded generator, no `Math.random` in the world. The four screenshot scenes are staged by `game/src/shots.js`, which plays the real rules forward with an autopilot:

| Scene | URL | Result |
| --- | --- | --- |
| Title | `?shot=start&seed=1` | Live demo behind the title panel |
| Play | `?shot=play&seed=1` | Mid-run, 212 m, HUD, farmer chasing |
| Caught | `?shot=caught&seed=1` | Careless pilot caught at 1221 m, 0 lives |
| Escaped | `?shot=escaped&seed=1` | Good pilot reaches the forest at 3000 m |

Screenshots are taken at 1280×720 in headless Chrome and saved as JPEGs under 256 KiB in `screenshots/`. Fairness rules the tuning protects: consecutive dangers are always spaced wider than one jump's ground distance, the farmer only throws a knife when the lane is clear, and every obstacle's hitbox is inset a few pixels so clipping a corner never ends a run.

## What's in the repo

- `game/index.html` — the page, one canvas, no network requests
- `game/src/config.js` — tuning, stages, palette
- `game/src/world.js` — turkey physics, obstacles, pickups, farmer AI, scoring
- `game/src/render.js` — all the canvas art, HUD and screens
- `game/src/audio.js` — synthesized sound effects and music (WebAudio)
- `game/src/input.js` — keyboard and mouse
- `game/src/shots.js` — the deterministic screenshot scenes (`?shot=start|play|caught|escaped`)
- `game/src/main.js` — boot, screens and the fixed-step loop
- `screenshots/` — four real renders of the game (title, play, caught, escaped)
- `main.ts` — the hand-in program (Node 22, standard library only)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

---

<sub>Entered on [make.fun](https://make.fun/?ref=zkyjn780&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
