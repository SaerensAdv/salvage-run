# Salvage Run v0.3

Grab scrap. Get out alive. Bank it before someone takes it.

## Play

- **Fastest:** open `index.html` in a browser (keep all files together). Solo and Party work right away, with or without internet.
- **Install on your phone (offline):** put this folder on any static host (GitHub Pages, Netlify Drop, Cloudflare Pages). Open the URL on your phone and choose "Add to Home Screen". After the first visit Solo and Party run fully offline.
- **Online:** needs internet on every device. The host taps ONLINE → HOST and shares the 5-letter code. Friends tap ONLINE, type the code, JOIN. Max 4 humans plus raiders.

## Modes

- **Solo:** the full game. Progress is saved in the browser.
- **Party:** 2 players on one device, split screen, 6-minute match, most scrap banked wins. Touch: each player uses their own half of the screen. Keyboard: P1 WASD + Space, P2 arrows + Enter.
- **Online:** the host's device runs the world. Guests send input and receive snapshots 15 times per second. Peers find each other through the free PeerJS signaling server; game data then flows peer-to-peer (WebRTC).

## Hosting on GitHub Pages

Settings → Pages → Deploy from branch → `main` / root. On a free plan the repo must be public for Pages.

## Known limits

- Online can fail on strict networks (symmetric NAT / some mobile carriers) because there is no TURN relay yet.
- Online is host-authoritative with no anti-cheat. Fine for friends, not for public matchmaking.
