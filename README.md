# Salvage Run v0.10

Grab scrap. Get out alive. Bank it before someone takes it.

## Play

- **Fastest:** open `index.html` in a browser (keep all files together). Solo and Party work right away, with or without internet.
- **Install on your phone (offline):** put this folder on any static host (GitHub Pages, Netlify Drop, Cloudflare Pages). Open the URL on your phone and choose "Add to Home Screen". After the first visit Solo and Party run fully offline.
- **Online:** needs internet on every device. The host taps ONLINE → HOST, then SHARE INVITE (or reads out the 5-letter code). Friends open the invite link (`?join=CODE` prefills the code) or type the code and tap JOIN. Max 4 humans plus raiders.

## Modes

- **Co-op raid (Party or Online):** 8 minutes, no friendly fire, one shared team bank. Bank the target together. At 3:00 left the Collector Prime wakes up and walks to your hub; while it stands at the hub it eats the team bank. Kill it for a big team bounty. Clear the raid for a bonus on everyone's safe bank. The target scales with player count and upgrades.

- **Solo:** the full game. Progress is saved in the browser.
- **Party (2-4 players, one screen):** 6-minute match, most scrap banked wins. 2 players split the screen in half, 3-4 players get a 2×2 grid (with 3 players the 4th quadrant shows a live scoreboard). Touch: each player uses their own part of the screen and their own ability button in the corner.
  - Keyboard: P1 WASD + Space · P2 arrows + Enter · P3 IJKL + O · P4 numpad 8456 + 0
  - Controllers: plug in or pair up to 4 gamepads. Stick or d-pad moves, A = ability, X / Y / B pick perk cards 1 / 2 / 3. In Solo, Start pauses and A on the main menu starts a run.
- **Online:** the host's device runs the world. Guests send input and receive snapshots 15 times per second. Peers find each other through the free PeerJS signaling server; game data then flows peer-to-peer (WebRTC). Controllers work for guests too.

## Gear (v0.7)

- **10 slots:** weapon, helmet, armor, legs, boots, gloves, backpack, 2 rings, necklace. Every item has an item level, a base type and bonus stats from 18 affixes.
- **6 rarities:** Common, Uncommon, Rare, Epic (adds a run perk), Legendary (a unique effect, like Twin Coil, Bulwark or Mule Frame) and Salvaged (named, near-mythic, can't be scrapped).
- **Weapons change how you fire:** Blaster (steady), Scattergun (3 pellets, short range), Rail (slow, heavy, pierces), Burst SMG (fast, sprays).
- **Forge:** level any item +1 to +10 with scrap and cores (+6% stats per level). +5 adds an extra affix, +10 unlocks one affix reroll. Forging never fails and never breaks an item.
- **Cores:** dismantle spare gear for cores (1 / 3 / 8 / 20 / 50). A full stash (60) auto-dismantles new drops, except Salvaged.
- **Hot loot:** found gear is hot until you bank it in the hub or at a beacon. Die and it drops where you fell. Equipped gear is always safe. Max 3 hot items at once.
- **Fair odds:** every drop table is visible in the GEAR screen. An Epic or better is guaranteed within 25 drops. Your first 8 drops come 3x as often from crates so new players get a build going.
- **Where gear counts:** Solo and Co-op raids use full gear. Online free-for-all keeps your weapon type but evens out the stats. Party on one device plays without gear. Monsters scale a little with your gear score.

## Vaults (v0.8)

- **Rifts:** every few minutes a vault rift opens in Zone 2 or 3. Stand in it to dive, with everything you carry.
- **Floors:** 4 to 6 rooms per floor, built from a seed: arenas (doors lock until every wave is down), trap rooms, treasure rooms and an exit room. Every 3rd floor has a boss.
- **Push your luck:** in the exit room, stand on EXTRACT to bank it all (×1.1 per floor) or on DEEPER for the next floor. Its modifier is shown up front: Overheat, Fog, Swarm, Glass or Greed. Die in a vault and everything you carried stays down there.
- **4 biomes:** Scrapyard (Magnet Crabs steal scrap, boss Crusher), Foundry (Slag Golems leave fire, boss Forge Warden), Sewer (rat swarms, boss The Rat King), Reactor (Arc Wisps explode, boss Core Prime).
- **Loot:** chests always drop gear and get one rarity step better every 2 floors. **Sets** only drop in vaults: Scrapper's Rig, Warden's Oath, Ghost Veil and Collector's Regalia (Salvaged only), each with a 2-piece and a 4-piece bonus.
- **Daily Vault:** same layout, biome and modifiers for everyone each day. Start it from the menu. Your best floor is saved.
- Vaults are solo for now. Co-op vaults come later.

## Frontier, events & the Base screen (v0.10)

- **Bigger world in 4 rings:** Scrap Plains → Rust Flats → Slag Fields → Dead Reactor. You start in the Plains. Each ring is locked behind a **Gatekeeper** at its gate (Rustjaw, The Foreman, Core Tyrant): stand on the gate to wake it, beat it to open the next ring. Deeper rings: tougher monsters, more scrap, gear shifted up a rarity step and +4 iLvl per ring. Once a gate is open the Gatekeeper returns every 4 minutes for a loot rematch.
- **Region monsters:** Magnet Crabs steal from your bag (kill them to get it back), Slag Golems leave burning ground, Arc Wisps explode when they die.
- **Always something to do:** raider camps (clear them for a chest, back after 2.5 min), shrines (30 s buff: Fury, Swift, Magnet, Fortune) and a world event every 50-70 s (Supply Drop, Loot Goblin, Horde, Scrap Storm). Arrows and the minimap point you there.
- **BASE screen** (⌂ button, B key, the menu tile, or the hub bar): Upgrades · Gear · Crew · Map in one place, tap to select, paged stash, no long lists. Works in portrait and landscape. The pause screen shows missions in columns with Resume / Base / Quit on top.
- **Level-up cards** show stacks as pips with NEW, LV x → y or MAXES OUT, so the last level of a perk no longer reads as "already full".
- Pacing: gadgets are available from the start, companions from rank 2.

## Companions & gadgets (v0.9)

- **One companion** (Base → Crew). Unlocks at rank 2, the Turret drone is free; others cost 120 safe scrap. Feed them scrap (and cores from Lv 4) up to Lv 10.
- **Drones** float and never die: Turret (shoots), Medic (heals out of combat), Magnet (pulls scrap), Aegis (blocks a hit every few seconds), Scout (arrows to elites, chests, rifts, +scrap).
- **Minions** walk and can be downed (back in 20 s): Scrap Rat (fetches loose scrap, runs one hot item home; in vaults it only secures on extract, and you still lose it if you die), Hound (bites, barks to taunt), Golem (tank, taunts, blocks raider shots, slams).
- **Gadgets** are available from the start: 2 slots with charges on Q / E, LB / RB or the two round buttons. Grenade, Medkit (free), Mine, Smoke, Decoy. Charges refill when you bank, respawn or enter a vault (+1 per deeper floor). Grenade: 3, Medkit: 2, Mine: 3 (80 scrap), Smoke: 2 (100), Decoy: 2 (120).
- **Where it counts:** Solo, vaults and Co-op raids (host simulates, guests send their loadout). Party and online free-for-all stay pure skill. Monsters scale a little with companion level.
- Fix: buying upgrades or swapping gear no longer cuts your hp to the pre-gear max.

## Weekly contract

Every Monday a new contract: 10 tiers, earned with ★ from banking (1 per 15 scrap), 4 weekly goals, 1 co-op goal, daily chests and rank-ups. Rewards are safe scrap and cosmetic trails. Trails stay yours, every trail returns in later contracts, and after tier 10 overtime keeps paying. No paid track, nothing you can buy.

## Online on mobile networks (TURN)

Some carriers block direct peer-to-peer. Fix: create a free Metered account (20 GB/month), copy the TURN credentials and paste the ICE servers array into `config.js` (`window.SALVAGE_ICE=[...]`). Nothing else changes.

## Hosting on GitHub Pages

Settings → Pages → Deploy from branch → `main` / root. On a free plan the repo must be public for Pages.

## Development & QA

- Static HTML, canvas and JavaScript PWA. No package install or build step: keep the shipped files together; open `index.html` locally or serve the folder over HTTPS for install/offline support.
- Script order is intentional: `config.js`, then `a.js`–`k.js`, then `l.js` (companions and gadgets), `m.js` (frontier: regions, gatekeepers, camps, shrines, events) and `n.js` (UI shell: menu, Base screen, hub bar, cards, pause). Keep game logic separate from drawing so a later visual remake can reuse it.
- `sw.js` owns the offline cache. Bump its cache name for each release and add every new runtime file to `FILES`.
- Optional TURN credentials belong in `config.js` as `window.SALVAGE_ICE`; leave it `null` when unused and never commit real credentials.
- v0.10 validation: 47 unit checks, frontier smoke test (gate, Gatekeeper, region unlock, wall, all 4 events, draw), 800-pick perk-cap check (0 capped offers), network, party, FFA, raid and weekly regressions passed; menu, Base tabs, hub bar, level-up and pause checked in portrait 390×844 and landscape 844×390. Tests use an internal harness not included in this static app. Human balance, real phones and physical controllers still need playtesting.

## Known limits

- Without TURN credentials, online can fail on strict networks (symmetric NAT / some mobile carriers).
- Online is host-authoritative with no anti-cheat. Fine for friends, not for public matchmaking.
- 3-4 player party is cramped on a phone; a tablet, laptop or TV works best.
