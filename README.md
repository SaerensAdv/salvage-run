# Salvage Run v0.6

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

## Gear (v0.6)

- **4 slots:** weapon, armor, boots, backpack. **3 rarities:** Common (grey), Uncommon (green), Rare (blue). Every item has an item level, a base type and 1-3 bonus stats.
- **Weapons change how you fire:** Blaster (steady), Scattergun (3 pellets, short range), Rail (slow, heavy, pierces), Burst SMG (fast, sprays).
- **Hot loot:** found gear is hot until you bank it in the hub or at a beacon. Die and it drops where you fell. Equipped gear is always safe. Max 3 hot items at once.
- **GEAR screen** (◈ in a run, or GEAR in the menu): compare, equip (only in the hub or the menu) and scrap items. Drop odds are visible, and a Rare is guaranteed within 15 drops.
- **Where gear counts:** Solo and Co-op raids use full gear. Online free-for-all keeps your weapon type but evens out the stats. Party on one device plays without gear. Monsters scale a little with your gear score.

## Weekly contract

Every Monday a new contract: 10 tiers, earned with ★ from banking (1 per 15 scrap), 4 weekly goals, 1 co-op goal, daily chests and rank-ups. Rewards are safe scrap and cosmetic trails. Trails stay yours, every trail returns in later contracts, and after tier 10 overtime keeps paying. No paid track, nothing you can buy.

## Online on mobile networks (TURN)

Some carriers block direct peer-to-peer. Fix: create a free Metered account (20 GB/month), copy the TURN credentials and paste the ICE servers array into `config.js` (`window.SALVAGE_ICE=[...]`). Nothing else changes.

## Hosting on GitHub Pages

Settings → Pages → Deploy from branch → `main` / root. On a free plan the repo must be public for Pages.

## Known limits

- Without TURN credentials, online can fail on strict networks (symmetric NAT / some mobile carriers).
- Online is host-authoritative with no anti-cheat. Fine for friends, not for public matchmaking.
- 3-4 player party is cramped on a phone; a tablet, laptop or TV works best.
