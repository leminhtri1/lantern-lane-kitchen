# Kite Street Night Market

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/leminhtri1/lantern-lane-kitchen/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/leminhtri1/lantern-lane-kitchen/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Kite Street Night Market is a lantern-lit street-food stall. It is an original cooking game for the desktop browser: read the order board, plan your route through the kitchen, chop, cook and plate dishes against the clock as the evening rush builds. Plays offline from static files, with keyboard and mouse.

![Rush hour at the stall](screenshots/1-rush.jpg)

## How to play

Customers queue in the street and their orders hang on the ticket rail. Each ticket shows the dish, its parts, and the tools each part needs. Build every dish from raw ingredients and serve it at the hatch before the customer runs out of patience.

| Input | Action |
| --- | --- |
| WASD / arrow keys | Walk |
| Space / E | Pick up or put down; hold at a board to chop |
| Mouse click | Walk to a station and use it (a click on a board chops the food through) |
| Tab / click a ticket | Choose the ticket the route guide follows |
| 1-4 (results screen) | Buy a stall upgrade |
| P / Esc | Pause and open the recipe book |
| M | Music on or off |

- **Crates** give raw ingredients. **Boards** chop them. The **broth pot** boils, the **wok** fries, the **bamboo steamer** steams, and the **charcoal grill** grills. Each cooking station holds three things at once, so you can steam pork and bok choy together for dumplings, or boil noodles and an egg in the same pot.
- Take a **plate** from a stack and add parts in any order. A plate only accepts parts that still fit a dish on tonight's menu, and a finished plate shows a READY tag.
- Cooked food that stays on the heat starts to smoke and then **burns**. Put burnt food in the bin.
- A fast serve earns a **tip**, and serves in a row build a **combo**. A customer who gives up costs coins and breaks the combo.
- The street gets busier during the shift: orders come faster through **rush hour**, then ease near closing time. From night 2 a **VIP** sometimes orders: a gold ticket that pays double but has less patience.
- The **route guide** follows the most urgent ticket (or the one you pick with Tab). It numbers the stops still to make on the stations (crate, board, heat, plate, pick-ups, hatch), marks a dotted path between them, and prints the plan on a floor card. A half-built plate shows its missing parts as ghost slots.
- Dishes share parts (chopped scallion goes in four dishes), and the tickets and recipe book mark shared parts so you can prep them in a batch.
- From night 2 some tickets ask for **extras** (no scallion, double egg, add shrimp, extra mango) that change what goes on the plate. From night 3 **tables of two** order together and pay a bonus when both are served. From night 4 a **food critic** pays triple for a fast plate.
- Coins are banked between nights and buy **stall upgrades** on the results screen: hot burners, a sharp cleaver, tea for the queue and a tip jar.
- In the last 30 seconds the lantern clock turns red and pulses: last call.
- Each night has its own weather over the street: sky lanterns, rain, fireworks, a full moon.
- There are **five nights** and **eight dishes**: Lantern Noodle Soup, Firefly Skewers, Moon Dumplings, Golden Fried Rice, Pillow Pork Bao, Mango Sticky Rice, Harbour Shrimp Noodles and Sizzle Lane Stir-fry. Earn at least one star to unlock the next night.

All art is drawn with canvas 2D code and all sound is synthesised with WebAudio. The game has no assets and makes no network requests.

## Run it

```sh
node serve.ts            # serves game/ at http://localhost:8080
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # hand-in: copies game/ and screenshots/, writes dossier.json
node tools/shoot.mjs     # re-captures screenshots/ with headless Chrome (?shot=<name>&seed=<n> scenes)
node tools/playtest.mjs  # plays a night in headless Chrome: cooks and serves a soup, serves a ticket with an extra, buys an upgrade, starts the next night
node tools/validate.mjs  # hand-in checks: deterministic output, screenshots, references, parsing, vendored library
```

## Source layout

- `game/src/main.js` boots the game, runs the loop and switches screens. `shift.js` holds the state of one night and its fixed step.
- `ingredients.js`, `recipes.js` and `kitchen-layout.js` hold the data: what each tool makes of each ingredient, the dishes and nights, and the floor plan.
- `interact.js`, `stations.js`, `orders.js`, `player.js` and `pathfind.js` hold the rules: using a station, cooking and burning, tickets and scoring, movement, and click-to-walk. `modifiers.js` holds the ticket extras, `upgrades.js` the stall upgrades, and `route-guide.js` plans and draws the route for the focused ticket.
- `food-art.js`, `kitchen-art.js`, `people-art.js`, `night-sky.js`, `hud.js`, `screens.js` and `render.js` draw the frame on top of the canvas primitives in `paint.js`. `tool-icons.js` draws the tool pictograms and `stall-dressing.js` the awning, string lights, sign and rush glow. `effects.js` and `feedback.js` handle particles and pop-ups. `audio.js` makes the sound.
- `shots.js` stages the deterministic screenshot scenes.

---

<sub>Entered on [make.fun](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
