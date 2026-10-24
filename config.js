// Salvage Run · online relay config.
// Online works out of the box on most wifi. On strict mobile networks (some 4G/5G carriers) peers need a TURN relay.
// Free option: create a free Metered account (20 GB/month), open TURN Server -> Credentials, copy the ICE servers array and paste it below.
// Example:
// window.SALVAGE_ICE=[{urls:'stun:stun.relay.metered.ca:80'},{urls:'turn:global.relay.metered.ca:80',username:'YOUR_USERNAME',credential:'YOUR_PASSWORD'},
//   {urls:'turn:global.relay.metered.ca:443',username:'YOUR_USERNAME',credential:'YOUR_PASSWORD'},{urls:'turns:global.relay.metered.ca:443?transport=tcp',username:'YOUR_USERNAME',credential:'YOUR_PASSWORD'}];
window.SALVAGE_ICE=null;
