/* ================= v0.11 · CO-OP VAULTS + NEW CONTENT =================
   A seeded vault is shared by the Party / Online team. The host simulates the run;
   all living players gather to start rooms and vote by standing on the same exit pad.
   Carried scrap and hot loot remain individual. A death drops the player's haul;
   a short respawn returns them to the shared run. A team wipe loses the vault run. */
let coVaultActive=false,partyCoVault=false,lobbyCoVault=false,coVaultReturns=new Map(),coVaultStarted=false;

// Two new modifiers: denser room fights, and guarded mimic chests with a bonus drop.
MODS.siege=['SIEGE','Each combat room adds one extra wave · +25% vault scrap'];
MODS.mimic=['MIMIC','Treasure chests wake a guard · extra gear if you beat it'];
MODKEYS.push('siege','mimic');

function cvLiving(){return players.filter(p=>p&&p.dead<=0)}
function cvRoomAt(p){if(!VLT||!VLT.rooms)return null;const cx=Math.floor((p.x-VOX)/VC),cy=Math.floor((p.y-VOY)/VC);
  return VLT.rooms.find(r=>cx>=r.x0&&cx<r.x0+r.w&&cy>=r.y0&&cy<r.y0+r.h)||null}
function cvRoomInner(p,r){const cx=Math.floor((p.x-VOX)/VC),cy=Math.floor((p.y-VOY)/VC);
  return cx>=r.x0+1&&cx<r.x0+r.w-1&&cy>=r.y0+1&&cy<r.y0+r.h-1}
function cvSetPlayersInFloor(){if(!VLT||!VLT.rooms.length)return;const w=roomW(VLT.rooms[0]),off=[[-54,0],[54,0],[0,-54],[0,54]];
  players.forEach((p,i)=>{const d=off[i%off.length];p.x=w.x+d[0];p.y=w.y+d[1];p.cx=null;p.cy=null;p.inv=Math.max(p.inv||0,1.2);p.dashT=0;p.vRoom=0;p.dead=0})}
function startCoopVault(seed,biome){
  if(!players.length||!['party','host'].includes(mode))return false;
  ensureVault();coVaultReturns=new Map(players.map(p=>[p.id,{x:p.x,y:p.y}]));coVaultActive=true;coVaultStarted=true;
  raid=false;RS=null;rift=null;gkShots=[];fires=[];shocks=[];WEV=null;enemies=[];bullets=[];pickups=[];parts=[];texts=[];rings=[];feed=[];banners={};
  const now=Date.now().toString(36),s=seed||`coop:${now}:${Math.floor(Math.random()*1e8).toString(36)}`;
  const b=biome||BIOKEYS[Math.floor(Math.random()*BIOKEYS.length)];
  VLT={seed:s,biome:b,depth:1,daily:false,rx:HUB.x,ry:HUB.y+40,t:0,haul:0,coop:true,cur:0,returns:coVaultReturns};
  save.vault.runs=(save.vault.runs||0)+1;genFloor(VLT);cvSetPlayersInFloor();matchT=1e9;state='play';
  bannerTo(null,'CO-OP VAULT',`Shared ${BIOMES[b].n} run · clear together · extract or go deeper`,3.5);
  feedTo(null,'Stay together to start each room. A downed teammate returns in 3 s.','#8fd6ff');fan(null,392);persist();return true}
function endCoopVault(wipe=false,extracted=false){if(!VLT||!coVaultActive)return;const V=VLT,returns=coVaultReturns;
  for(let i=crates.length-1;i>=0;i--)if(crates[i].vault)crates.splice(i,1);
  enemies=[];bullets=[];pickups=pickups.filter(q=>q.x<WORLD+500);wloot=wloot.filter(l=>l.x<WORLD+500);VLT=null;
  coVaultActive=false;coVaultStarted=false;coVaultReturns=new Map();
  for(const p of players){const r=returns.get(p.id)||{x:HUB.x,y:HUB.y+40};p.x=r.x;p.y=r.y;p.cx=null;p.cy=null;p.vRoom=0;p.inv=Math.max(p.inv||0,1.2);p.dashT=0;
    if(wipe){p.dead=0;p.hp=p.maxHp;p.carry=0;p.hot=[];p.picking=null;p.pend=[];p.run={lvl:1,xp:0,next:5,perks:{}}}}
  if(wipe)bannerTo(null,'TEAM WIPED','Vault loot lost · regroup and dive again',3.5);
  else if(extracted)bannerTo(null,'TEAM EXTRACTED','Vault haul secured',3.5);
  persist()}
function coVaultExtract(){if(!VLT||!coVaultActive)return;const V=VLT,mul=extractMul();let sum=0;
  for(const p of players){if(p.dead>0)continue;const amt=Math.round(p.carry*mul);sum+=amt;p.carry=0;secure(p);finishBank(p,amt,false);
    // Local Party shares one save; the online host credits itself here while remote guests
    // receive their own bank update from finishBank's normal network path.
    if(mode==='party'||(mode==='host'&&p.id===0)){save.bank+=amt;save.total+=amt}}
  recordVault(true,sum);if(mode==='party'||(mode==='host'&&players.some(p=>p.id===0)))ev('vault',V.depth);
  if(mode==='host')for(const p of players)if(p.remote)netSend(p,{t:'vaultProgress',depth:V.depth,extracted:1});
  bannerTo(null,'EXTRACTED',`Floor ${V.depth} · team haul secured at ×${mul.toFixed(1)}`,3.5);fan(null,659);refreshShop();endCoopVault(false,true)}
function coVaultDeeper(){if(!VLT||!coVaultActive)return;const V=VLT,depth=V.depth;
  vDeeper(players.find(p=>p.dead<=0)||players[0]);
  for(const p of players)if(p.dead<=0){p.gch&&refillGad(p,1);p.vRoom=0}
  cvSetPlayersInFloor();VLT.cur=0;VLT.returns=coVaultReturns;
  bannerTo(null,`TEAM · FLOOR ${V.depth}`,V.mod?MODS[V.mod][1]:'Deeper together. Better loot.',3.2);
  if(mode==='host')for(const p of players)if(p.remote)netSend(p,{t:'vaultProgress',depth,extracted:0});}

// Attach vault room identity to generated loot/chests for the Mimic modifier.
const _cvAddCrate=addCrate;addCrate=function(r,R){const n=crates.length;_cvAddCrate(r,R);if(crates.length>n)crates[crates.length-1].room=r.i};
const _cvAddChest=addChest;addChest=function(r){const n=crates.length;_cvAddChest(r);const c=crates[n];if(c)c.room=r.i;return c};
const _cvStartRoom=startRoom;startRoom=function(R,p){_cvStartRoom(R,p);if(VLT&&VLT.mod==='siege'&&R.type!=='boss'&&!R.siegeAdded){R.siegeAdded=true;R.waves++}};
const _cvSpawnWave=spawnWave;spawnWave=function(R,p){_cvSpawnWave(R,p);if(coVaultActive&&VLT){for(let i=1;i<Math.min(players.length,4);i++){const x=VOX+(R.cx+.5)*VC+rand(-90,90),y=VOY+(R.cy+.5)*VC+rand(-90,90),e=vScale(makeEnemy(i%2?'dasher':'brute',x,y,vTier(),p));e.room=R.i;e.wx=x;e.wy=y;enemies.push(e)}}};
const _cvClearRoom=clearRoom;clearRoom=function(R,p){_cvClearRoom(R,p);if(coVaultActive&&VLT.mod!=='greed'&&p){for(const q of players)if(q!==p&&q.dead<=0)q.hp=Math.min(q.maxHp,q.hp+q.maxHp*.2)}};
const _cvDropScrap=dropScrap;dropScrap=function(x,y,total,spread){_cvDropScrap(x,y,total*(VLT&&VLT.mod==='siege'?1.25:1),spread)};
const _cvHitCrate=hitCrate;hitCrate=function(c,dmg,by){const was=c.dead>0;_cvHitCrate(c,dmg,by);
  if(!VLT||VLT.mod!=='mimic'||!c.vault||!c.chest||was||c.dead<=0||c.mimicTriggered)return;c.mimicTriggered=true;
  const room=VLT.rooms[c.room];if(!room)return;room.state='fight';room.waves=0;room.wave=0;
  for(let i=0;i<2;i++){const a=i*Math.PI,ex=VOX+(room.cx+.5)*VC+Math.cos(a)*100,ey=VOY+(room.cy+.5)*VC+Math.sin(a)*100;
    const e=vScale(makeEnemy('brute',ex,ey,vTier(),by||players[0]));e.hp*=1.35;e.max=e.hp;e.elite=true;e.mimic=1;e.room=room.i;e.wx=ex;e.wy=ey;enemies.push(e)}
  fxRing(c.x,c.y,150,'#c9bfff',.45);bannerTo(null,'MIMIC!','Clear the guards for a bonus gear drop',2.6)};
const _cvHitEnemy=hitEnemy;hitEnemy=function(e,dmg,by,src,crit){const was=!!e.dead;_cvHitEnemy(e,dmg,by,src,crit);if(VLT&&!was&&e.dead&&e.mimic){dropItem(e.x,e.y,shiftW(RW7.elite,1),10+4*(VLT.depth-1));dropScrap(e.x,e.y,25*VLT.depth,1)}};

function coVaultTick(dt){const V=VLT;if(!V)return;V.t+=dt;for(const c of crates)if(c.vault)c.flash-=dt;
  const live=cvLiving();if(!live.length){endCoopVault(true,false);return}
  for(const p of live){const R=cvRoomAt(p);if(R){p.vRoom=R.i;R.seen=true;if(R.i>V.cur)V.cur=R.i;
      if(R.type==='start'&&R.state==='idle')R.state='done';
      if(R.type==='exit'&&R.state==='idle')R.state='done'}}
  // A combat room seals only once every living teammate has regrouped inside.
  for(const R of V.rooms){if(R.state!=='idle'||!['arena','trap','boss'].includes(R.type))continue;
    if(live.every(p=>p.vRoom===R.i&&cvRoomInner(p,R)))startRoom(R,live[0])}
  for(const R of V.rooms){if(R.state!=='fight')continue;const alive=enemies.filter(e=>!e.dead&&e.room===R.i).length;
    if(R.type==='boss'){if(alive===0)clearRoom(R,live[0]);continue}
    if(R.wave<R.waves){R.nextT-=dt;if(alive<=Math.max(1,Math.floor((R.lastN||1)*.2))&&R.nextT<=0)spawnWave(R,live[0])}
    else if(alive===0)clearRoom(R,live[0])}
  const hdmg=6+1.5*V.depth;
  for(const h of V.hz){const ph=(time+h.ph)%3.2;h.on=ph<1.4;h.warn=ph>2.7;
    if(h.on)for(const p of live)if(p.x>h.x&&p.x<h.x+h.w&&p.y>h.y&&p.y<h.y+h.h)hitPlayer(p,hdmg,HZ)}
  for(const f of V.fire){f.life-=dt;f.arm-=dt;if(f.arm<=0)for(const p of live)if(Math.hypot(p.x-f.x,p.y-f.y)<f.r+p.r*.5)hitPlayer(p,hdmg*.8,HZ)}V.fire=V.fire.filter(f=>f.life>0);
  for(const s of V.shock){s.t-=dt;if(s.t<=0){fxRing(s.x,s.y,s.r,'#8fd6ff',.3);for(const p of live)if(Math.hypot(p.x-s.x,p.y-s.y)<s.r+p.r)hitPlayer(p,s.dmg,HZ)}}V.shock=V.shock.filter(s=>s.t>0);
  for(const e of enemies){if(e.dead||!(e.bio||e.vboss))continue;e.bt-=dt;
    if(e.bio==='slag'&&e.bt<=0){e.bt=3;V.fire.push({x:e.x,y:e.y,r:34,life:4,arm:.5})}
    if(e.vboss){const nearest=live.slice().sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0],d=nearest?Math.hypot(nearest.x-e.x,nearest.y-e.y):1e9;
      if(e.vboss==='scrapyard'&&nearest&&d<330&&d>e.r+nearest.r&&!(e.slamT>0)){nearest.x+=(e.x-nearest.x)/d*80*dt;nearest.y+=(e.y-nearest.y)/d*80*dt}
      if(e.bt<=0){if(e.vboss==='foundry'){e.bt=2.2;V.fire.push({x:nearest?nearest.x:e.x,y:nearest?nearest.y:e.y,r:46,life:5,arm:.7})}
        else if(e.vboss==='sewer'){e.bt=6;const R=V.rooms[e.room];if(R&&enemies.length<26)for(let k=0;k<3;k++)spawnFoe(R,nearest||live[0],'crawler','rat')}
        else if(e.vboss==='reactor'){e.bt=3.4;for(const p of live)V.shock.push({x:p.x,y:p.y,r:72,t:.9,dmg:20+3*V.depth})}
        else e.bt=9}}}
  const exitRoom=V.rooms[V.rooms.length-1];if(!exitRoom||exitRoom.state!=='done')return;
  for(const pd of V.pads){const together=live.length>0&&live.every(p=>!p.picking&&Math.hypot(p.x-pd.x,p.y-pd.y)<44);
    pd.prog=together?pd.prog+dt:Math.max(0,pd.prog-dt*2);
    if(pd.prog>=EXTRACT_T){pd.prog=0;if(pd.k==='extract')coVaultExtract();else coVaultDeeper();return}}}

// The normal vault renderer stays intact, but each view follows its own room marker.
const _cvDrawView=drawView;drawView=function(v){if(coVaultActive&&VLT&&v.p){const cur=VLT.cur;VLT.cur=v.p.vRoom||0;_cvDrawView(v);VLT.cur=cur;return}_cvDrawView(v)};
const _cvDraw=draw;draw=function(){_cvDraw();if(!coVaultActive||!VLT||mode==='host')return;
  const cy=mode==='party'&&views().length>2?H/2:26,label=`CO-OP VAULT · FLOOR ${VLT.depth}`;ctx.save();ctx.font=F(800,15);ctx.textAlign='center';const w=ctx.measureText(label).width+26;
  ctx.fillStyle='rgba(23,8,4,.94)';rr(W/2-w/2,cy-18,w,36,12);ctx.fill();ctx.strokeStyle='#8fd6ff';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#8fd6ff';ctx.fillText(label,W/2,cy+5);ctx.restore()};

const _cvUpdateWorld=updateWorld;updateWorld=function(dt){if(coVaultActive&&VLT)return coVaultTick(dt);_cvUpdateWorld(dt)};
const _cvEndMatch=endMatch;endMatch=function(){if(coVaultActive)return;return _cvEndMatch()};
const _cvBackToMenu=backToMenu;backToMenu=function(){if(coVaultActive)endCoopVault(true,false);coVaultActive=false;coVaultStarted=false;return _cvBackToMenu()};
const _cvRespawn=respawn;respawn=function(p){if(!coVaultActive||!VLT)return _cvRespawn(p);const R=VLT.rooms[clamp(p.vRoom|0,0,VLT.rooms.length-1)]||VLT.rooms[0],w=roomW(R);p.x=w.x+rand(-35,35);p.y=w.y+rand(-35,35);p.hp=p.maxHp;p.inv=2;p.abCd=0;p.abT=0;p.vRoom=R.i};
const _cvKillPlayer=killPlayer;killPlayer=function(p,by){if(!coVaultActive||!VLT)return _cvKillPlayer(p,by);const V=VLT;VLT=null;try{_cvKillPlayer(p,by)}finally{VLT=V}
  p.deathInfo=p.deathInfo||{};p.deathInfo.vault=true;p.deathInfo.vf=V.depth;feedTo(p,`Downed on floor ${V.depth}. Back in 3 s; your haul is on the floor.`,'#ff6a3d')};
const _cvBuildSnap=buildSnap;buildSnap=function(c){const s=_cvBuildSnap(c);if(!s)return s;
  if(coVaultActive&&VLT){s.VL={seed:VLT.seed,biome:VLT.biome,depth:VLT.depth,daily:0,cur:VLT.cur,mod:VLT.mod,nextMod:VLT.nextMod,
      rooms:VLT.rooms.map(r=>[r.state,r.wave,r.waves,r.seen?1:0,r.siegeAdded?1:0]),returns:[...coVaultReturns].map(([id,p])=>[id,Math.round(p.x),Math.round(p.y)])};
    const em=new Map(enemies.map(e=>[e.id,e]));for(const row of s.E){const e=em.get(row[0]);if(e)row.push(e.room==null?-1:e.room,e.vboss||'',e.vname||'',e.mimic?1:0)}
  }else s.VL=null;return s};
const _cvApplySnap=applySnap;applySnap=function(s){_cvApplySnap(s);if(mode!=='guest')return;
  if(s.VL){const z=s.VL,key=z.seed+':'+z.depth;
    if(!VLT||!VLT.coop||VLT.key!==key){coVaultActive=true;coVaultStarted=true;ensureVault();if(!VLT||!VLT.coop)save.vault.runs=(save.vault.runs||0)+1;
      VLT={seed:z.seed,biome:z.biome,depth:z.depth,daily:false,rx:HUB.x,ry:HUB.y+40,t:0,haul:0,coop:true,key,cur:z.cur|0,returns:new Map((z.returns||[]).map(r=>[r[0],{x:r[1],y:r[2]}]))};genFloor(VLT);G.vaultActive=true}
    VLT.key=key;VLT.cur=z.cur|0;VLT.mod=z.mod;VLT.nextMod=z.nextMod;VLT.returns=new Map((z.returns||[]).map(r=>[r[0],{x:r[1],y:r[2]}]));
    (z.rooms||[]).forEach((r,i)=>{const q=VLT.rooms[i];if(!q)return;q.state=r[0];q.wave=r[1];q.waves=r[2];q.seen=!!r[3];q.siegeAdded=!!r[4];if(q.state==='fight'&&q.doors.length===0)setDoors(q,2);else if(q.state!=='fight'&&q.doors.length)setDoors(q,1)});
    const em=new Map(enemies.map(e=>[e.id,e]));for(const row of s.E||[]){const e=em.get(row[0]);if(e){e.room=row[13];e.vboss=row[14]||null;e.vname=row[15]||null;e.mimic=!!row[16]}}
  }else if(VLT&&VLT.coop){VLT=null;coVaultActive=false;coVaultStarted=false;G.vaultActive=false}}

// The host stays authoritative even when a friend joins after the dive has started.
const _cvHostJoin=hostOnData;hostOnData=function(conn,d){_cvHostJoin(conn,d);if(d&&d.t==='hello'&&coVaultActive&&VLT){const p=players.find(q=>q.remote&&q.conn===conn);if(p){const r=VLT.rooms[clamp(VLT.cur|0,0,VLT.rooms.length-1)]||VLT.rooms[0],w=roomW(r);p.x=w.x+rand(-24,24);p.y=w.y+rand(-24,24);p.vRoom=r.i;p.inv=2;coVaultReturns.set(p.id,{x:HUB.x,y:HUB.y+40})}}};

// Host sends the same vault mode/floor to every guest; guests never simulate rooms.
const _cvHostOnData=hostOnData;hostOnData=function(conn,d){if(d&&d.t==='vaultProgress'){const p=players.find(q=>q.id===conn.pid);if(p)netSend(p,{t:'vaultProgressAck',depth:d.depth,extracted:d.extracted});return}_cvHostOnData(conn,d)};
const _cvGuestOnData=guestOnData;guestOnData=function(d){if(d&&d.t==='vaultProgressAck'){ensureVault();save.vault.best=Math.max(save.vault.best||0,d.depth|0);if(d.extracted)save.vault.extracts=(save.vault.extracts||0)+1;persist();return}_cvGuestOnData(d)};

// Party mode selector: preserve versus and raid, add a shared vault choice.
const _cvRenderParty=renderParty;renderParty=function(){_cvRenderParty();const box=$('party'),old=box.querySelector('.pm');if(old&&old.remove)old.remove();
  const row=modeRow('pm',[['VERSUS','versus'],['CO-OP RAID','raid'],['CO-OP VAULT','vault']],partyCoVault?'vault':partyRaid?'raid':'versus',v=>{partyCoVault=v==='vault';partyRaid=(v==='raid');renderParty()});
  box.insertBefore(row,box.querySelector('.pn')||box.querySelector('.pcol'));if(partyCoVault){box.querySelector('p').textContent='2-4 players · shared seeded vault · gather to clear rooms, then EXTRACT or DEEPER together.';$('partyStart').textContent='DIVE'} };
const _cvStartParty=startParty;startParty=function(){_cvStartParty();if(partyCoVault)startCoopVault();else coVaultActive=false};

// Online lobby selector and launch button: the host remains authoritative.
(()=>{const lob=$('lobby'),st=$('lobbyStart');if(!lob||!st)return;
  function paintLobby(){const cur=lob.querySelector('.lm');const row=modeRow('lm',[['FREE-FOR-ALL','ffa'],['CO-OP RAID','raid'],['CO-OP VAULT','vault']],lobbyCoVault?'vault':lobbyRaid?'raid':'ffa',v=>{lobbyCoVault=v==='vault';lobbyRaid=(v==='raid');paintLobby()});
    if(cur)cur.replaceWith(row);else lob.insertBefore(row,st)}paintLobby();
  const n=st.cloneNode(true);st.replaceWith(n);n.addEventListener('click',()=>{showOnly(null);hudOn(true);state='play';
    if(lobbyCoVault){raid=false;lobbyRaid=false;startCoopVault();for(const p of players)if(p.remote)netSend(p,{t:'vaultStart'})}
    else if(lobbyRaid){coVaultActive=false;beginRaid();for(const p of players)if(p.remote)netSend(p,{t:'raidStart'})}
    else{coVaultActive=false;raid=false;RS=null;feedTo(null,'Room is live. Everyone is a target.','#f5c34d')}})})();
const _cvGuestVaultOnData=guestOnData;guestOnData=function(d){_cvGuestVaultOnData(d);if(d&&d.t==='vaultStart'){pushFeedLocal('Co-op Vault · follow the host, gather for each room.','#8fd6ff')}};

if(window.__game){Object.defineProperties(window.__game,Object.getOwnPropertyDescriptors({startCoopVault,coVaultTick,coVaultExtract,coVaultDeeper,endCoopVault,
  get coVaultActive(){return coVaultActive},get coVaultMode(){return partyCoVault||lobbyCoVault}}));
  window.__game.startParty=startParty;window.__game.renderParty=renderParty;window.__game.draw=draw;window.__game.update=update;
  window.__game.hitCrate=hitCrate;window.__game.hitEnemy=hitEnemy;window.__game.hitPlayer=hitPlayer;window.__game.buildSnap=buildSnap;window.__game.applySnap=applySnap;
  window.__game.setPartyCoVault=v=>{partyCoVault=!!v;partyRaid=false};
  window.__game.setLobbyCoVault=v=>{lobbyCoVault=!!v;lobbyRaid=false}}

/* ---------- v0.11 compact party + lobby layout (segmented selectors, no scrolling) ---------- */
(()=>{const st=document.createElement('style');st.textContent=`
#party.sub,#lobby.sub{gap:10px;padding:14px;justify-content:safe center}
#party>p,#lobby>p{margin:0;max-width:600px;font-size:15px;line-height:1.35}
.ptop{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;width:min(96vw,860px)}
.pm,.pn,.lm{display:grid!important;grid-template-columns:repeat(3,1fr);gap:4px;width:min(94vw,420px);background:rgba(60,13,3,.7);border:2px solid #5a2a1a;border-radius:14px;padding:4px;box-sizing:border-box}
.pm button,.pn button,.lm button{font:800 14px Sora,system-ui,sans-serif!important;letter-spacing:.06em;padding:10px 4px!important;margin:0!important;border:0!important;border-radius:10px!important;background:transparent!important;color:var(--ink)!important;box-shadow:none!important;opacity:.7;white-space:nowrap;min-width:0;width:auto!important}
.pm button[style*="border-color"],.lm button[style*="border-color"],.pn button.big{background:var(--gold)!important;color:var(--deep)!important;opacity:1}
#party .pcol{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:8px;width:min(96vw,860px)}
#party .pcol>div{display:grid;grid-template-columns:auto 1fr;align-items:center;column-gap:10px;row-gap:4px;padding:8px 10px;border-radius:14px}
#party .pcol h3{font-size:18px;min-width:28px}
#party .pcol small{grid-column:1/-1;font-size:14px}
#party .chars{flex-wrap:nowrap;gap:6px}
#party .chars button{width:auto;flex:1;min-width:0;padding:6px 4px;gap:1px}
#party #partyStart{padding:12px 48px}
@media (max-height:520px){#party .pcol small{display:none}#party.sub,#lobby.sub{gap:8px;padding:10px}#party h2,#lobby h2{font-size:28px}#party>p{font-size:14px}}`;
document.head.appendChild(st)})();
const _cvRP2=renderParty;renderParty=function(){_cvRP2();const box=$('party');if(!box||!box.querySelector)return;
  const p=box.querySelector('p');if(!p)return;
  if(partyCoVault)p.textContent='Shared vault · gather to open rooms · EXTRACT or go DEEPER together.';
  else if(partyRaid)p.textContent=`Co-op raid · 8 min · bank ${raidTarget(partyN)} together. At 3:00 the Collector Prime hunts your bank.`;
  else p.textContent='Split screen · 6 minutes · most scrap banked wins. Friendly fire is on.'};
