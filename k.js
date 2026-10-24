/* ================= VAULTS (v0.8) =================
   Random dungeons behind a rift. Floors of seeded rooms (start, arena, trap, treasure, boss, exit). After every floor: EXTRACT (bank it all)
   or go DEEPER (better loot, harder monsters, a visible modifier). 4 biomes, each with its own monster, boss and gear set.
   Sets only drop in vaults. Daily Vault: same layout for everyone each day. Solo only in v0.8 (co-op vaults later).
   Vault space sits outside the overworld (x > WORLD), so the overworld simply waits while you dive.
   Structure: DATA · GEN · STATE · COLLISION · TICK · HOOKS · SETS · RENDER · UI. Rendering is kept apart for the visual remake. */

/* ---------- DATA ---------- */
let VLT=null;/* the active vault; d.js skips its world clamps while this is set */
const VC=40,VSW=4,VSH=3,VSLOT=16,VGW=VSW*VSLOT,VGH=VSH*VSLOT,VOX=WORLD+2000,VOY=0;
const BIOMES={
  scrapyard:{n:'Scrapyard',floor:'#3a2416',line:'#43291a',wall:'#6b3a1e',top:'#8a5030',acc:'#ed9b49',foe:['crab','Magnet Crab','crawler','#c08048'],boss:['Crusher','#d08a4a'],slots:['pack','boots'],set:'rig'},
  foundry:{n:'Foundry',floor:'#2a0f08',line:'#31130a',wall:'#5a1a0a',top:'#7a2a12',acc:'#ff6a3d',foe:['slag','Slag Golem','brute','#ff6a3d'],boss:['Forge Warden','#ff8a3c'],slots:['weapon','ring'],set:'oath'},
  sewer:{n:'Sewer',floor:'#13201a',line:'#17271f',wall:'#2c3b2e',top:'#3e5240',acc:'#7be08f',foe:['rat','Rat swarm','crawler','#9aaa62'],boss:['The Rat King','#b8c86a'],slots:['gloves','helmet'],set:'veil'},
  reactor:{n:'Reactor',floor:'#0f1822',line:'#131e2a',wall:'#22344a',top:'#34507a',acc:'#8fd6ff',foe:['wisp','Arc Wisp','dasher','#8fd6ff'],boss:['Core Prime','#bfe8ff'],slots:['neck','armor'],set:'regalia'}};
const BIOKEYS=Object.keys(BIOMES);
const MODS={overheat:['OVERHEAT','Heat builds twice as fast · monsters hit harder · +25% scrap'],fog:['FOG','You see a lot less'],
  swarm:['SWARM','+50% monsters per wave'],glass:['GLASS','Everyone deals and takes double damage'],greed:['GREED','Double crates and chest loot · no repair after rooms']};
const MODKEYS=Object.keys(MODS);
const SETS={rig:{n:"Scrapper's Rig",sh:'Rig',s:['weapon','boots','gloves','pack'],b2:'Ability cooldown -20%',b4:'Your ability releases a shockwave',bio:'scrapyard'},
  oath:{n:"Warden's Oath",sh:'Oath',s:['helmet','armor','legs','ring'],b2:'+15% armor',b4:'Your ability repairs 25% hull',bio:'foundry'},
  veil:{n:'Ghost Veil',sh:'Veil',s:['helmet','boots','ring','neck'],b2:'+10% speed',b4:'Every shot crits for 1.5 s after your ability',bio:'sewer'},
  regalia:{n:"Collector's Regalia",sh:'Regalia',s:ITYPES.slice(),b2:'Heat builds 25% slower',b4:'At full heat: +50% damage',bio:'reactor',salv:true}};
const SETB={rig:['cd',20],oath:['armor',15],veil:['spd',10],regalia:['heat',25]};
UKEYS.push('rig4','oath4','veil4','regalia4');
const HZ={name:'The vault',col:'#ff6a3d'};
const EXTRACT_T=1.2,RIFT_T=1.4;

/* ---------- GEN (seeded: same seed = same floor) ---------- */
const modFor=(seed,d)=>d<=1?null:MODKEYS[Math.floor(mulberry(hashStr(seed+':m'+d))()*MODKEYS.length)];
function genFloor(V){const R=mulberry(hashStr(V.seed+':'+V.depth)),ri=(a,b)=>a+Math.floor(R()*(b-a+1)),g=new Uint8Array(VGW*VGH);
  const L=Math.min(6,4+Math.floor(V.depth/2));let path=[];
  for(let k=0;k<60;k++){path=[[ri(0,VSW-1),ri(0,VSH-1)]];
    while(path.length<L){const[x,y]=path[path.length-1],nb=[[1,0],[-1,0],[0,1],[0,-1]].map(([a,b])=>[x+a,y+b]).filter(([a,b])=>a>=0&&b>=0&&a<VSW&&b<VSH&&!path.some(q=>q[0]===a&&q[1]===b));
      if(!nb.length)break;path.push(nb[Math.floor(R()*nb.length)])}
    if(path.length>=L)break}
  const rooms=path.map(([sx,sy],i)=>{const w=ri(9,13),h=ri(9,12),x0=sx*VSLOT+ri(1,VSLOT-1-w),y0=sy*VSLOT+ri(1,VSLOT-1-h);
    return{i,x0,y0,w,h,cx:x0+Math.floor(w/2),cy:y0+Math.floor(h/2),type:'arena',state:'idle',wave:0,waves:0,seen:false,doors:[]}});
  const set=(x,y,v)=>{if(x>=0&&y>=0&&x<VGW&&y<VGH)g[y*VGW+x]=v};
  for(const r of rooms)for(let y=r.y0;y<r.y0+r.h;y++)for(let x=r.x0;x<r.x0+r.w;x++)set(x,y,1);
  for(let i=1;i<rooms.length;i++){const a=rooms[i-1],b=rooms[i];
    for(let x=Math.min(a.cx,b.cx);x<=Math.max(a.cx,b.cx);x++)for(let d=-1;d<=1;d++)set(x,a.cy+d,1);
    for(let y=Math.min(a.cy,b.cy);y<=Math.max(a.cy,b.cy);y++)for(let d=-1;d<=1;d++)set(b.cx+d,y,1)}
  const last=rooms.length-1,boss=V.depth%3===0;rooms[0].type='start';rooms[last].type='exit';if(boss)rooms[last-1].type='boss';
  const bag=['arena','trap','treasure','arena'];for(let i=1;i<last;i++){if(rooms[i].type==='boss')continue;rooms[i].type=i===1?'arena':bag[Math.floor(R()*bag.length)]}
  V.hz=[];V.fire=[];V.shock=[];V.pads=[];V.cur=0;
  for(const r of rooms){
    if(r.type==='arena'||r.type==='boss'){const n=ri(0,3);for(let k=0;k<n;k++){const px=ri(r.x0+2,r.x0+r.w-4),py=ri(r.y0+2,r.y0+r.h-4);
        if(Math.abs(px-r.cx)<=2||Math.abs(py-r.cy)<=2||Math.abs(px+1-r.cx)<=2||Math.abs(py+1-r.cy)<=2)continue;for(const[dx,dy]of[[0,0],[1,0],[0,1],[1,1]])set(px+dx,py+dy,3)}}
    if(r.type==='trap'){const n=ri(2,3);for(let k=0;k<n;k++){const hor=R()<.5;
        if(hor){const y=ri(r.y0+1,r.y0+r.h-3);V.hz.push({x:VOX+r.x0*VC,y:VOY+y*VC,w:r.w*VC,h:VC*1.5,ph:R()*3.2,room:r.i})}
        else{const x=ri(r.x0+1,r.x0+r.w-3);V.hz.push({x:VOX+x*VC,y:VOY+r.y0*VC,w:VC*1.5,h:r.h*VC,ph:R()*3.2,room:r.i})}}}
    if(r.type==='exit'){const y=VOY+(r.cy+.5)*VC;V.pads.push({k:'extract',x:VOX+(r.cx-2.2)*VC,y,prog:0},{k:'deeper',x:VOX+(r.cx+3.2)*VC,y,prog:0})}}
  V.g=g;V.rooms=rooms;V.mod=modFor(V.seed,V.depth);V.nextMod=modFor(V.seed,V.depth+1);
  for(let i=crates.length-1;i>=0;i--)if(crates[i].vault)crates.splice(i,1);
  const cm=V.mod==='greed'?2:1;
  for(const r of rooms){if(r.type==='treasure'){addChest(r);for(let k=0;k<3*cm;k++)addCrate(r,R)}
    else if(r.type==='arena'||r.type==='trap'){for(let k=0;k<(R()<.5?1:0)*cm;k++)addCrate(r,R)}}}
function cellFree(x,y){return x>=0&&y>=0&&x<VGW&&y<VGH&&VLT.g[y*VGW+x]===1}
function addCrate(r,R){for(let k=0;k<20;k++){const x=r.x0+1+Math.floor(R()*(r.w-2)),y=r.y0+1+Math.floor(R()*(r.h-2));if(!cellFree(x,y)||(x===r.cx&&y===r.cy))continue;
    const c={i:-1,x:VOX+(x+.5)*VC,y:VOY+(y+.5)*VC,t:3,r:17,dead:0,flash:0,vault:true};c.max=c.hp=20*3.5*(1+.15*VLT.depth);crates.push(c);return}}
function addChest(r){const c={i:-1,x:VOX+(r.cx+.5)*VC,y:VOY+(r.cy+.5)*VC,t:3,r:22,dead:0,flash:0,vault:true,chest:true};c.max=c.hp=60*(1+.2*VLT.depth);crates.push(c)}
function shiftW(w,s){let o=w.slice();for(let k=0;k<s;k++){const n=o.slice();for(let i=4;i>=0;i--){const m=o[i]*(i===4?.15:.5);n[i]-=m;n[i+1]+=m}o=n}return o}
const roomW=r=>({x:VOX+(r.cx+.5)*VC,y:VOY+(r.cy+.5)*VC});

/* ---------- STATE ---------- */
let rift=null,riftT=95;
function ensureVault(){if(!save.vault||typeof save.vault!=='object')save.vault={runs:0,best:0,extracts:0,bosses:0,daily:{d:'',best:0,haul:0}};
  if(!save.vault.daily)save.vault.daily={d:'',best:0,haul:0}}
function enterVault(p,o={}){ensureVault();const daily=!!o.daily,seed=daily?'daily:'+today():'v:'+Date.now().toString(36)+Math.floor(Math.random()*1e9).toString(36);
  const biome=o.biome||(daily?BIOKEYS[hashStr(seed)%BIOKEYS.length]:BIOKEYS[Math.floor(Math.random()*BIOKEYS.length)]);
  VLT={seed,biome,depth:1,daily,rx:o.rx!=null?o.rx:p.x,ry:o.ry!=null?o.ry:p.y,t:0,haul:0};save.vault.runs++;
  enemies=[];bullets=[];genFloor(VLT);placeIn(p);rift=null;p.lastTier=3;
  bannerTo(p,`${daily?'DAILY VAULT':'VAULT'} · ${BIOMES[biome].n.toUpperCase()}`,'Clear the rooms. Then EXTRACT, or go DEEPER.',3.5);fan(p,392);persist();dirty=true}
function placeIn(p){const w=roomW(VLT.rooms[0]);p.x=w.x;p.y=w.y;p.cx=null;p.inv=Math.max(p.inv,1.2);p.dashT=0}
function endVault(p){const V=VLT;if(!V)return;for(let i=crates.length-1;i>=0;i--)if(crates[i].vault)crates.splice(i,1);
  enemies=[];bullets=[];pickups=pickups.filter(q=>q.x<WORLD+500);wloot=wloot.filter(l=>l.x<WORLD+500);VLT=null;
  if(p){p.x=V.rx;p.y=V.ry;p.cx=null;p.inv=Math.max(p.inv,1.2);p.dashT=0}rift=null;riftT=170}
function recordVault(extracted,haul){const V=VLT,s=save.vault;s.best=Math.max(s.best,V.depth);if(extracted)s.extracts++;
  if(V.daily){if(s.daily.d!==today())s.daily={d:today(),best:0,haul:0};s.daily.best=Math.max(s.daily.best,V.depth);if(extracted)s.daily.haul=Math.max(s.daily.haul,haul||0)}
  persist()}
const extractMul=()=>1+.1*VLT.depth;
function vExtract(p){const V=VLT,mul=extractMul(),amt=Math.round(p.carry*mul);if(amt>0){save.bank+=amt;save.total+=amt}p.carry=0;
  secure(p);finishBank(p,amt,false);recordVault(true,amt);ev('vault',V.depth);
  bannerTo(p,'EXTRACTED',`Floor ${V.depth} · +${amt} safe scrap (×${mul.toFixed(1)})`,3.5);fan(p,659);endVault(p);refreshShop()}
function vDeeper(p){const V=VLT;V.depth++;ev('vault',V.depth-1);enemies=[];bullets=[];pickups=pickups.filter(q=>q.x<WORLD+500);wloot=wloot.filter(l=>l.x<WORLD+500);
  genFloor(V);placeIn(p);const m=V.mod?MODS[V.mod]:null;bannerTo(p,`FLOOR ${V.depth}${m?' · '+m[0]:''}`,m?m[1]:'Deeper. Better loot.',3.2);fan(p,330);recordVault(false)}
function startDailyVault(){startSolo();const p=players[0];if(p)enterVault(p,{daily:true,rx:HUB.x,ry:HUB.y+40})}

/* ---------- COLLISION ---------- */
const vSolid=v=>v!==1;
function vcell(x,y){const cx=Math.floor((x-VOX)/VC),cy=Math.floor((y-VOY)/VC);if(cx<0||cy<0||cx>=VGW||cy>=VGH)return 0;return VLT.g[cy*VGW+cx]}
function vpush(o){const r=o.r||12,c0=Math.floor((o.x-r-VOX)/VC),c1=Math.floor((o.x+r-VOX)/VC),r0=Math.floor((o.y-r-VOY)/VC),r1=Math.floor((o.y+r-VOY)/VC);
  for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++){const v=(cx<0||cy<0||cx>=VGW||cy>=VGH)?0:VLT.g[cy*VGW+cx];if(!vSolid(v))continue;
    const x0=VOX+cx*VC,y0=VOY+cy*VC,nx=clamp(o.x,x0,x0+VC),ny=clamp(o.y,y0,y0+VC),dx=o.x-nx,dy=o.y-ny,d=Math.hypot(dx,dy);if(d>=r)continue;
    if(d>.01){o.x=nx+dx/d*r;o.y=ny+dy/d*r}
    else{const l=o.x-x0,rt=x0+VC-o.x,t=o.y-y0,b=y0+VC-o.y,m=Math.min(l,rt,t,b);if(m===l)o.x=x0-r;else if(m===rt)o.x=x0+VC+r;else if(m===t)o.y=y0-r;else o.y=y0+VC+r}}}
function vaultPath(p,tx,ty){const V=VLT;if(!V)return null;const sx=Math.floor((p.x-VOX)/VC),sy=Math.floor((p.y-VOY)/VC),gx=Math.floor((tx-VOX)/VC),gy=Math.floor((ty-VOY)/VC);
  if(sx===gx&&sy===gy)return{x:tx,y:ty};const prev=new Int32Array(VGW*VGH).fill(-1),q=[sy*VGW+sx];prev[q[0]]=q[0];
  for(let h=0;h<q.length;h++){const c=q[h],x=c%VGW,y=(c-x)/VGW;if(x===gx&&y===gy)break;
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=VGW||ny>=VGH)continue;const n=ny*VGW+nx;if(prev[n]>=0||V.g[n]!==1)continue;prev[n]=c;q.push(n)}}
  let c=gy*VGW+gx;if(prev[c]<0)return null;const pathC=[];while(c!==prev[c]){pathC.push(c);c=prev[c]}pathC.reverse();
  const k=pathC[Math.min(2,pathC.length-1)],x=k%VGW,y=(k-x)/VGW;return{x:VOX+(x+.5)*VC,y:VOY+(y+.5)*VC}}

/* ---------- TICK (replaces the overworld tick while you're in a vault) ---------- */
function setDoors(r,v){if(v===2){r.doors=[];for(let y=r.y0-1;y<=r.y0+r.h;y++)for(let x=r.x0-1;x<=r.x0+r.w;x++){
      if(x>=r.x0&&x<r.x0+r.w&&y>=r.y0&&y<r.y0+r.h)continue;if(x<0||y<0||x>=VGW||y>=VGH)continue;const i=y*VGW+x;if(VLT.g[i]===1){VLT.g[i]=2;r.doors.push(i)}}}
  else{for(const i of r.doors)VLT.g[i]=1;r.doors=[]}}
const vTier=()=>VLT.depth<=3?2:3;
function vScale(e){const V=VLT,d=V.depth-1;e.hp*=1+.18*d;e.max=e.hp;e.dmg*=(1+.1*d)*(V.mod==='overheat'?1.25:1);e.scrap*=(1+.15*d)*(V.mod==='overheat'?1.25:1);return e}
function spawnFoe(R,p,type,bio){const V=VLT,B=BIOMES[V.biome];let x,y;
  for(let k=0;k<30;k++){const cx=R.x0+1+Math.floor(Math.random()*(R.w-2)),cy=R.y0+1+Math.floor(Math.random()*(R.h-2));if(!cellFree(cx,cy))continue;
    x=VOX+(cx+.5)*VC;y=VOY+(cy+.5)*VC;if(Math.hypot(x-p.x,y-p.y)>170)break}
  if(x==null)return null;const e=vScale(makeEnemy(type,x,y,vTier(),p));e.room=R.i;e.wx=x;e.wy=y;
  if(bio){e.bio=bio;e.col=B.foe[3];e.bt=rand(1,3);if(bio==='rat'){e.r*=.75;e.hp*=.55;e.max=e.hp;e.spd*=1.25}if(bio==='crab'){e.r*=1.3;e.hp*=1.8;e.max=e.hp;e.spd*=.9}}
  enemies.push(e);fxRing(x,y,30,B.acc,.3);return e}
function spawnWave(R,p){const V=VLT,B=BIOMES[V.biome];R.wave++;let n=Math.round((2+V.depth+Math.floor(Math.random()*3))*(V.mod==='swarm'?1.5:1)*(R.type==='trap'?.6:1));n=Math.min(14,n);
  let br=V.depth<=1?1:1+Math.floor(V.depth/2);const big=t=>t==='brute'&&br--<=0?'dasher':t;
  for(let i=0;i<n;i++){const q=Math.random();
    if(q<.25){const f=B.foe;spawnFoe(R,p,big(f[2]),f[0]);if(f[0]==='rat')spawnFoe(R,p,f[2],f[0])}
    else spawnFoe(R,p,big(q<.55?'crawler':q<.8||V.depth<2?'dasher':'brute'))}
  R.lastN=n;R.nextT=1;snd(p,200,.15,'sawtooth',.04,1.4)}
function startRoom(R,p){const V=VLT,B=BIOMES[V.biome];R.state='fight';setDoors(R,2);
  if(R.type==='boss'){R.waves=0;const w=roomW(R),e=vScale(makeEnemy('boss',w.x,w.y,vTier(),p));e.hp*=.6+.15*V.depth;e.max=e.hp;e.vboss=V.biome;e.vname=B.boss[0];e.col=B.boss[1];e.room=R.i;e.bt=3;
    enemies.push(e);bannerTo(p,B.boss[0].toUpperCase(),`Floor ${V.depth} boss · ${B.n}`,3);snd(p,70,.7,'sawtooth',.06,.6);vb(p,[80,40,80])}
  else{R.waves=R.type==='trap'?1:2+(V.depth>=3?1:0);spawnWave(R,p)}}
function clearRoom(R,p){const V=VLT;R.state='done';setDoors(R,1);fxText(p.x,p.y-50,'ROOM CLEARED','#f5c34d',24);fan(p,523);
  if(V.mod!=='greed')p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.2);
  if(R.type==='boss'||(R.type==='arena'&&Math.random()<(V.mod==='greed'?.8:.4)))addChest(R)}
function vaultTick(dt){const V=VLT,p=players[0];if(!p)return;V.t+=dt;
  for(const c of crates)if(c.vault)c.flash-=dt;
  if(p.dead<=0){const cx=Math.floor((p.x-VOX)/VC),cy=Math.floor((p.y-VOY)/VC),R=V.rooms.find(r=>cx>=r.x0&&cx<r.x0+r.w&&cy>=r.y0&&cy<r.y0+r.h);
    if(R){R.seen=true;V.cur=R.i;const inner=cx>=R.x0+1&&cx<R.x0+R.w-1&&cy>=R.y0+1&&cy<R.y0+R.h-1;
      if(inner&&R.state==='idle'){if(R.type==='arena'||R.type==='trap'||R.type==='boss')startRoom(R,p);
        else{R.state='done';if(R.type==='exit'){const nm=V.nextMod?MODS[V.nextMod][0]:'no modifier';
            bannerTo(p,`FLOOR ${V.depth} DONE`,`Left: EXTRACT ×${extractMul().toFixed(1)} · Right: DEEPER (floor ${V.depth+1} · ${nm})`,3.5);fan(p,494)}}}}}
  for(const R of V.rooms){if(R.state!=='fight')continue;const alive=enemies.filter(e=>!e.dead&&e.room===R.i).length;
    if(R.type==='boss'){if(alive===0)clearRoom(R,p);continue}
    if(R.wave<R.waves){R.nextT-=dt;if(alive<=Math.max(1,Math.floor(R.lastN*.2))&&R.nextT<=0)spawnWave(R,p)}else if(alive===0)clearRoom(R,p)}
  const hdmg=6+1.5*V.depth;
  for(const h of V.hz){const ph=(time+h.ph)%3.2;h.on=ph<1.4;h.warn=ph>2.7;
    if(h.on&&p.dead<=0&&p.x>h.x&&p.x<h.x+h.w&&p.y>h.y&&p.y<h.y+h.h)hitPlayer(p,hdmg,HZ)}
  for(const f of V.fire){f.life-=dt;f.arm-=dt;if(f.arm<=0&&p.dead<=0&&Math.hypot(p.x-f.x,p.y-f.y)<f.r+p.r*.5)hitPlayer(p,hdmg*.8,HZ)}V.fire=V.fire.filter(f=>f.life>0);
  for(const s of V.shock){s.t-=dt;if(s.t<=0){fxRing(s.x,s.y,s.r,'#8fd6ff',.3);if(p.dead<=0&&Math.hypot(p.x-s.x,p.y-s.y)<s.r+p.r)hitPlayer(p,s.dmg,HZ)}}V.shock=V.shock.filter(s=>s.t>0);
  for(const e of enemies){if(e.dead||!(e.bio||e.vboss))continue;e.bt-=dt;
    if(e.bio==='slag'&&e.bt<=0){e.bt=3;V.fire.push({x:e.x,y:e.y,r:34,life:4,arm:.5})}
    if(e.vboss){const d=Math.hypot(p.x-e.x,p.y-e.y);
      if(e.vboss==='scrapyard'&&p.dead<=0&&d<330&&d>e.r+p.r&&!(e.slamT>0)){p.x+=(e.x-p.x)/d*80*dt;p.y+=(e.y-p.y)/d*80*dt}
      if(e.bt<=0){if(e.vboss==='foundry'){e.bt=2.2;V.fire.push({x:p.x,y:p.y,r:46,life:5,arm:.7})}
        else if(e.vboss==='sewer'){e.bt=6;const R=V.rooms[e.room];if(enemies.length<26)for(let k=0;k<3;k++)spawnFoe(R,p,'crawler','rat')}
        else if(e.vboss==='reactor'){e.bt=3.4;V.shock.push({x:p.x,y:p.y,r:72,t:.9,dmg:20+3*V.depth})}
        else e.bt=9}}}
  if(V.cur===V.rooms.length-1&&p.dead<=0&&!p.picking)for(const pd of V.pads){if(Math.hypot(p.x-pd.x,p.y-pd.y)<44){pd.prog+=dt;
      if(pd.prog>=EXTRACT_T){pd.prog=0;if(pd.k==='extract')vExtract(p);else vDeeper(p);return}}else pd.prog=Math.max(0,pd.prog-dt*2)}}
function riftTick(dt){if(mode!=='solo'||ftueOn()||state!=='play')return;const p=players[0];if(!p)return;
  riftT-=dt;if(!rift&&riftT<=0){const a=rand(0,TAU),d=rand(Z2+150,Z3+300);rift={x:clamp(HUB.x+Math.cos(a)*d,140,WORLD-140),y:clamp(HUB.y+Math.sin(a)*d,140,WORLD-140),r:58,life:60,prog:0,biome:BIOKEYS[Math.floor(Math.random()*BIOKEYS.length)]};
    riftT=170;bannerTo(null,'A VAULT RIFT OPENED',`${BIOMES[rift.biome].n} · step in to dive · bring your haul`,3);snd(null,180,.6,'sine',.05,2)}
  if(!rift)return;rift.life-=dt;
  if(p.dead<=0&&!p.picking&&Math.hypot(p.x-rift.x,p.y-rift.y)<rift.r){rift.prog+=dt;if(rift.prog>=RIFT_T){const r=rift;enterVault(p,{biome:r.biome,rx:r.x,ry:r.y});return}}
  else rift.prog=Math.max(0,rift.prog-dt);
  if(rift&&rift.life<=0){feedTo(null,'The rift closed','rgba(246,231,216,.7)');rift=null}}

/* ---------- HOOKS ---------- */
const _uw8=updateWorld;updateWorld=function(dt){if(VLT)return vaultTick(dt);_uw8(dt);riftTick(dt)};
const _ur8=updateRivals;updateRivals=function(dt){if(!VLT)_ur8(dt)};
const _se8=spawnEnemy;spawnEnemy=function(p){if(!VLT)_se8(p)};
const _upl8=updatePlayer;updatePlayer=function(p,dt){_upl8(p,dt);if(VLT&&p.dead<=0){vpush(p);vpush(p)}};
const _uen8=updateEnemies;updateEnemies=function(dt){_uen8(dt);if(!VLT)return;for(const e of enemies){if(e.dead)continue;
    for(const p of players){if(p.dead>0)continue;const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy),m=e.r+p.r*.8;if(d<m){const k=d>.01?m/d:0;e.x=k?p.x+dx*k:p.x+m;e.y=k?p.y+dy*k:e.y}}vpush(e)}};
const _ub8=updateBullets;updateBullets=function(dt){if(VLT)for(const b of bullets){if(b.life<=0)continue;if(vSolid(vcell(b.x+b.vx*dt,b.y+b.vy*dt))){b.life=0;if(Math.random()<.5)parts.push({x:b.x,y:b.y,vx:0,vy:0,life:.15,col:b.col,s:4})}}_ub8(dt)};
const _upk8=updatePickups;updatePickups=function(dt){if(!VLT)return _upk8(dt);const pos=pickups.map(q=>[q.x,q.y]);_upk8(dt);
  pickups.forEach((q,i)=>{if(pos[i]&&vSolid(vcell(q.x,q.y))){q.x=pos[i][0];q.y=pos[i][1];q.vx=0;q.vy=0}})};
const _up8=update;update=function(rdt){for(const p of players)if(p.critT>0)p.critT-=rdt;if(!VLT)return _up8(rdt);
  const t0=players.map(p=>p.trip.t);_up8(rdt);if(!VLT)return;const f=VLT.mod==='overheat'?.67:.33;players.forEach((p,i)=>{if(p.trip.t>t0[i])p.trip.t=t0[i]+(p.trip.t-t0[i])*f})};
const _sw8=setupWorld;setupWorld=function(m,pl){VLT=null;rift=null;riftT=95;for(let i=crates.length-1;i>=0;i--)if(crates[i].vault)crates.splice(i,1);_sw8(m,pl)};
const _hp8=hitPlayer;hitPlayer=function(p,dmg,by){if(VLT){if(VLT.mod==='glass')dmg*=2;
    if(by&&by.bio==='crab'&&p.carry>0&&!(p.dead>0||p.inv>0||p.picking)){const n=Math.min(p.carry,5);p.carry-=n;by.stolen=(by.stolen||0)+n;fxText(p.x,p.y-50,`-${n} ◆ STOLEN`,'#ed9b49',16)}}
  _hp8(p,dmg,by)};
const _he8=hitEnemy;hitEnemy=function(e,dmg,by,src,crit){if(e.dead)return;if(VLT&&VLT.mod==='glass'&&by&&by.isP)dmg*=2;_he8(e,dmg,by,src,crit);
  if(!VLT||!e.dead||e._vd)return;e._vd=true;const V=VLT;
  if(e.stolen)dropScrap(e.x,e.y,e.stolen,1);
  if(e.bio==='wisp')V.shock.push({x:e.x,y:e.y,r:70,t:.6,dmg:10+2*V.depth});
  if(e.vboss&&by&&by.isP){dropItem(e.x,e.y,shiftW(RW7.boss,Math.floor(V.depth/3)),8+2*V.depth);save.vault.bosses++;
    bannerTo(by,`${e.vname.toUpperCase()} IS DOWN`,'The exit is open. Grab the loot.',3);fan(by,587)}};
const _hc8=hitCrate;hitCrate=function(c,dmg,by){const was=c.dead>0;_hc8(c,dmg,by);if(!VLT||!c.chest||was||c.dead<=0||!by||!by.isP)return;
  const V=VLT,n=V.mod==='greed'?2:1;for(let i=0;i<n;i++)dropItem(c.x,c.y,shiftW(RW7.crate[3],1+Math.floor(V.depth/2)),6+2*V.depth);
  dropScrap(c.x,c.y,18+6*V.depth,1.2);fxRing(c.x,c.y,60,'#f5c34d',.35);snd(by,880,.15,'triangle',.05)};
const _kp8=killPlayer;killPlayer=function(p,by){if(!VLT)return _kp8(p,by);_kp8(p,by);const V=VLT;if(p.deathInfo){p.deathInfo.vault=true;p.deathInfo.vf=V.depth;p.deathInfo.x=-9999}
  recordVault(false);feedTo(p,`Lost on floor ${V.depth} of the ${BIOMES[V.biome].n}`,'#c59bff');endVault(p)};
const _ab8=ability;ability=function(p){const c=p.abCd;_ab8(p);if(!(c<=0&&p.abCd>0)||!p.u)return;
  if(p.u.rig4){fxRing(p.x,p.y,120,'#ed9b49',.3);for(const e of enemies)if(!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<120+e.r)hitEnemy(e,p.dmg*3,p)}
  if(p.u.oath4)p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.25);
  if(p.u.veil4)p.critT=1.5};
const _vo8=volley;volley=function(p,t){const n0=bullets.length;_vo8(p,t);const ct=p.critT>0,rg=p.u&&p.u.regalia4&&heat(p)>=1;if(!ct&&!rg)return;
  for(let i=n0;i<bullets.length;i++){const b=bullets[i];if(ct&&!b.crit){b.crit=true;b.dmg*=p.critMul||2.5}if(rg)b.dmg*=1.5}};
const _ea8=edgeArrow;edgeArrow=function(p,W2,H2,Zv,tx,ty,col,label,alpha){if(VLT&&tx<WORLD+200)return;_ea8(p,W2,H2,Zv,tx,ty,col,label,alpha)};

/* ---------- SETS (only drop in vaults) ---------- */
function setCounts(){const n={};for(const s of SLOTS){const it=equipped(s);if(it&&it.set)n[it.set]=(n[it.set]||0)+1}return n}
const setOk=(k,it)=>!!SETS[k]&&(SETS[k].salv?it.rar===5:SETS[k].s.includes(it.slot)&&it.rar<4);
const _in8=itemName;itemName=function(it){if(it.set&&it.rar<4&&SETS[it.set])return `${SETS[it.set].sh} ${BASES[it.slot][it.b][0]}`;return _in8(it)};
const _mi8=makeItem;makeItem=function(rar,il,slot,b){const V=VLT;if(V&&!slot&&Math.random()<.45){const sl=BIOMES[V.biome].slots;slot=sl[Math.floor(Math.random()*sl.length)]}
  const it=_mi8(rar,il,slot,b);
  if(V){const k=BIOMES[V.biome].set,S=SETS[k];if(setOk(k,it)&&(S.salv?Math.random()<.6:it.rar>=2&&Math.random()<.5)){it.set=k;it.name=itemName(it)}}return it};
const _ci8=cleanItem;cleanItem=function(x){const it=_ci8(x);if(it&&x&&x.set&&setOk(x.set,it)){it.set=x.set;it.name=itemName(it)}return it};
const _ip8=itemPower;itemPower=function(it){const v=_ip8(it);return it&&it.set?Math.round(v*1.06):v};
const _gt8=gearTotals;gearTotals=function(){const g=_gt8(),n=setCounts();
  for(const k in n){if(n[k]>=2){const[s,v]=SETB[k];g.st[s]=clamp((g.st[s]||0)+v,-30,CAPS[s])}if(n[k]>=4)g.u[k+'4']=1}g.sets=n;return g};
const _ic8=itemCard;itemCard=function(it){let h=_ic8(it);if(it.set&&SETS[it.set]){const S=SETS[it.set],n=setCounts()[it.set]||0;
    h=h.replace('</div><div class="gb">',`<br><span style="color:#7be08f">Set · ${S.n} (${n}/4) · 2 pieces: ${S.b2} · 4 pieces: ${S.b4}</span></div><div class="gb">`)}return h};
const _rg8=refreshGearUI;refreshGearUI=function(){_rg8();if(gearEl.style.display!=='flex'||!gearEl.querySelectorAll)return;const n=setCounts();
  const h=`<h3>VAULT SETS</h3><div class="gi"><div class="gs">`+Object.keys(SETS).map(k=>{const S=SETS[k];return `<b style="color:${(n[k]||0)>=2?'#7be08f':'#f6e7d8'}">${S.n} ${n[k]||0}/4</b> · ${BIOMES[S.bio].n} vaults${S.salv?' (Salvaged only)':''} · 2: ${S.b2} · 4: ${S.b4}`}).join('<br>')+
    `<br><br>Vault chests always drop gear. Their odds climb one step every 2 floors. Bosses wait on floor 3, 6, 9...</div></div>`;
  const hs=gearEl.querySelectorAll('h3');for(const e of hs)if(e.textContent==='FORGE'&&e.insertAdjacentHTML){e.insertAdjacentHTML('beforebegin',h);break}};

/* ---------- RENDER (deliberately simple) ---------- */
function adjFloor(x,y){const g=VLT.g;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<VGW&&ny<VGH&&g[ny*VGW+nx]===1)return true}return false}
function drawRift(r){const B=BIOMES[r.biome],pu=.5+Math.sin(time*4)*.5;ctx.save();ctx.translate(r.x,r.y);
  ctx.fillStyle=`rgba(197,155,255,${.12+pu*.08})`;ctx.beginPath();ctx.arc(0,0,r.r,0,TAU);ctx.fill();ctx.strokeStyle='#c59bff';ctx.lineWidth=4;
  for(let i=0;i<3;i++){const a=time*(1.5+i)+i*2;ctx.beginPath();ctx.arc(0,0,r.r*(.35+i*.25),a,a+Math.PI*1.2);ctx.stroke()}
  if(r.prog>0){ctx.strokeStyle='#f6e7d8';ctx.lineWidth=8;ctx.beginPath();ctx.arc(0,0,r.r+8,-Math.PI/2,-Math.PI/2+TAU*r.prog/RIFT_T);ctx.stroke()}
  ctx.restore();ctx.font=F(800,16);ctx.textAlign='center';txt(`VAULT RIFT · ${B.n.toUpperCase()} · ${Math.ceil(r.life)}s`,r.x,r.y-r.r-16,'#c59bff')}
function drawVaultView(v){const V=VLT,B=BIOMES[V.biome],p=v.p,Zv=clamp(Math.min(v.w,v.h)/700,.5,1.15);
  if(p.cx==null||Math.hypot(p.cx-p.x,p.cy-p.y)>900){p.cx=p.x;p.cy=p.y}const k=Math.min(1,fdt*7);p.cx+=(p.x-p.cx)*k;p.cy+=(p.y-p.cy)*k;const cx=p.cx,cy=p.cy;
  const sh=shakes[p.id]||0,sx=(Math.random()-.5)*sh,sy=(Math.random()-.5)*sh;
  ctx.save();ctx.beginPath();ctx.rect(v.x,v.y,v.w,v.h);ctx.clip();ctx.fillStyle='#0b0402';ctx.fillRect(v.x,v.y,v.w,v.h);
  ctx.translate(v.x+v.w/2+sx,v.y+v.h/2+sy);ctx.scale(Zv,Zv);ctx.translate(-cx,-cy);
  const vw=v.w/Zv/2+60,vh=v.h/Zv/2+60,L=cx-vw,R=cx+vw,T=cy-vh,Bt=cy+vh,vis=o=>o.x>L&&o.x<R&&o.y>T&&o.y<Bt;
  const c0=Math.max(0,Math.floor((L-VOX)/VC)),c1=Math.min(VGW-1,Math.floor((R-VOX)/VC)),r0=Math.max(0,Math.floor((T-VOY)/VC)),r1=Math.min(VGH-1,Math.floor((Bt-VOY)/VC));
  for(let y=r0;y<=r1;y++)for(let x=c0;x<=c1;x++){const val=V.g[y*VGW+x],X=VOX+x*VC,Y=VOY+y*VC;
    if(val===1){ctx.fillStyle=(x+y)%2?B.floor:B.line;ctx.fillRect(X,Y,VC,VC)}
    else if(val===2){ctx.fillStyle=B.floor;ctx.fillRect(X,Y,VC,VC);ctx.globalAlpha=.5+.3*Math.sin(time*6);ctx.fillStyle=B.acc;ctx.fillRect(X+5,Y+5,VC-10,VC-10);ctx.globalAlpha=1}
    else if(adjFloor(x,y)){ctx.fillStyle=B.wall;ctx.fillRect(X,Y,VC,VC);ctx.fillStyle=B.top;ctx.fillRect(X,Y,VC,7)}}
  for(const h of V.hz){if(!vis({x:h.x+h.w/2,y:h.y+h.h/2})&&!(h.x<R&&h.x+h.w>L&&h.y<Bt&&h.y+h.h>T))continue;
    ctx.fillStyle=h.on?'rgba(255,106,61,.55)':h.warn?`rgba(255,106,61,${.15+.15*Math.sin(time*30)})`:'rgba(23,8,4,.45)';ctx.fillRect(h.x,h.y,h.w,h.h);
    ctx.strokeStyle='rgba(255,106,61,.6)';ctx.lineWidth=2;ctx.strokeRect(h.x,h.y,h.w,h.h)}
  for(const f of V.fire){ctx.globalAlpha=clamp(f.life,0,1)*(f.arm>0?.35:.6);ctx.fillStyle='#ff6a3d';ctx.beginPath();ctx.arc(f.x,f.y,f.r*(f.arm>0?.7:1),0,TAU);ctx.fill();ctx.globalAlpha=1}
  for(const s of V.shock){ctx.strokeStyle='#8fd6ff';ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='rgba(143,214,255,.18)';ctx.beginPath();ctx.arc(s.x,s.y,s.r*(1-s.t),0,TAU);ctx.fill()}
  ctx.textAlign='center';
  for(const pd of V.pads){const ex=pd.k==='extract',col=ex?'#f5c34d':'#c59bff';ctx.fillStyle=ex?'rgba(245,195,77,.16)':'rgba(197,155,255,.16)';ctx.beginPath();ctx.arc(pd.x,pd.y,44,0,TAU);ctx.fill();
    ctx.strokeStyle=col;ctx.lineWidth=4;ctx.setLineDash([12,8]);ctx.lineDashOffset=-time*30;ctx.beginPath();ctx.arc(pd.x,pd.y,44,0,TAU);ctx.stroke();ctx.setLineDash([]);
    if(pd.prog>0){ctx.lineWidth=8;ctx.beginPath();ctx.arc(pd.x,pd.y,52,-Math.PI/2,-Math.PI/2+TAU*pd.prog/EXTRACT_T);ctx.stroke()}
    ctx.font=F(800,16);txt(ex?'EXTRACT':'DEEPER',pd.x,pd.y-56,col);ctx.font=F(600,14);
    txt(ex?`bank ×${extractMul().toFixed(1)}`:`floor ${V.depth+1}${V.nextMod?' · '+MODS[V.nextMod][0]:''}`,pd.x,pd.y+66,'#f6e7d8')}
  for(const c of crates){if(!c.vault||c.dead>0||!vis(c))continue;if(!c.chest){drawCrate(c);continue}
    ctx.save();ctx.translate(c.x,c.y);ctx.shadowColor='rgba(245,195,77,.7)';ctx.shadowBlur=22;ctx.fillStyle=c.flash>0?'#fff':'#f5c34d';ctx.strokeStyle='#170804';ctx.lineWidth=3;
    ctx.fillRect(-c.r,-c.r*.75,c.r*2,c.r*1.5);ctx.shadowBlur=0;ctx.strokeRect(-c.r,-c.r*.75,c.r*2,c.r*1.5);ctx.fillStyle='#8d1c06';ctx.fillRect(-c.r,-4,c.r*2,6);ctx.fillRect(-4,-8,8,12);ctx.restore();
    if(c.hp<c.max)bar(c.x-c.r,c.y-c.r-10,c.r*2,4,c.hp/c.max,'#f5c34d')}
  for(const q of pickups){if(q.age>=999||!vis(q))continue;const bob=Math.sin(time*6+q.x)*2;ctx.save();ctx.translate(q.x,q.y+bob);
    if(q.k==='o'){ctx.fillStyle='#fff3c4';ctx.beginPath();ctx.arc(0,0,9,0,TAU);ctx.fill();ctx.strokeStyle='#f5c34d';ctx.lineWidth=3;ctx.rotate(time*2);ctx.strokeRect(-12,-12,24,24)}
    else{const s=4+Math.min(q.v,10)*.6;ctx.rotate(Math.PI/4);ctx.fillStyle='#ed9b49';ctx.fillRect(-s,-s,s*2,s*2);ctx.fillStyle='#f5c34d';ctx.fillRect(-s,-s,s,s)}ctx.restore()}
  for(const e of enemies){if(!vis(e))continue;drawEnemy(e);if(e.vboss){ctx.font=F(800,16);ctx.textAlign='center';txt(e.vname.toUpperCase(),e.x,e.y-e.r-38,BIOMES[e.vboss].acc)}
    else if(e.stolen){ctx.font=F(800,14);ctx.textAlign='center';txt(`◆ ${e.stolen}`,e.x,e.y+e.r+18,'#ed9b49')}}
  for(const q of players)drawPlayer(q,q===p,vis);
  ctx.lineCap='round';for(const b of bullets){if(!vis(b))continue;ctx.strokeStyle=b.col;ctx.lineWidth=b.w;ctx.beginPath();ctx.moveTo(b.x-b.vx*.025,b.y-b.vy*.025);ctx.lineTo(b.x,b.y);ctx.stroke()}
  for(const r of rings){ctx.globalAlpha=clamp(r.life/.3,0,1);ctx.strokeStyle=r.col;ctx.lineWidth=6;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,TAU);ctx.stroke()}ctx.globalAlpha=1;
  for(const q of parts){if(!vis(q))continue;ctx.globalAlpha=clamp(q.life/.4,0,1);ctx.fillStyle=q.col;ctx.fillRect(q.x-q.s/2,q.y-q.s/2,q.s,q.s)}ctx.globalAlpha=1;
  ctx.textAlign='center';for(const t of texts){if(!vis(t))continue;ctx.globalAlpha=clamp(t.life/.5,0,1);ctx.font=F(800,t.size);txt(t.txt,t.x,t.y,t.col)}ctx.globalAlpha=1;
  ctx.restore();
  if(V.mod==='fog'){ctx.save();ctx.beginPath();ctx.rect(v.x,v.y,v.w,v.h);ctx.clip();const px=v.x+v.w/2+(p.x-cx)*Zv,py=v.y+v.h/2+(p.y-cy)*Zv,
      g=ctx.createRadialGradient(px,py,170*Zv,px,py,330*Zv);g.addColorStop(0,'rgba(11,4,2,0)');g.addColorStop(1,'rgba(11,4,2,.94)');ctx.fillStyle=g;ctx.fillRect(v.x,v.y,v.w,v.h);ctx.restore()}
  ctx.save();ctx.beginPath();ctx.rect(v.x,v.y,v.w,v.h);ctx.clip();ctx.translate(v.x,v.y);drawHud(p,v.w,v.h,Zv,v);ctx.restore()}
const _dv8=drawView;drawView=function(v){if(VLT&&v.p)return drawVaultView(v);_dv8(v)};
const _dh8=drawHud;drawHud=function(p,W2,H2,Zv,v){const split=views().length>1,ms=Math.round(clamp(W2*.28,90,150)),mx=W2-ms-14,my=split?(mode==='party'&&W>=H?52:14):14;
  if(!VLT&&rift&&p.cx!=null){ctx.save();ctx.translate(W2/2,H2/2);ctx.scale(Zv,Zv);ctx.translate(-p.cx,-p.cy);drawRift(rift);ctx.restore()}
  let di=null;if(p.dead>0&&p.deathInfo&&p.deathInfo.vault){di=p.deathInfo;p.deathInfo=null}
  _dh8(p,W2,H2,Zv,v);
  if(di){p.deathInfo=di;ctx.fillStyle='rgba(23,8,4,.62)';ctx.fillRect(0,0,W2,H2);ctx.textAlign='center';ctx.font=F(800,Math.min(96,W2*.18));txt('WRECKED',W2/2,H2*.4,'#ff6a3d','#3c0d03');
    ctx.font=F(600,Math.min(17,W2/26));txt(`${di.who} got you on vault floor ${di.vf}.`,W2/2,H2*.4+40,'#f6e7d8');
    if(di.lost>0)txt(`The vault keeps the ${di.lost} scrap you carried, and your hot loot.`,W2/2,H2*.4+66,'#c59bff');
    if(di.perks>0)txt(`Your level ${di.lvl} build (${di.perks} perks) died with you.`,W2/2,H2*.4+92,'rgba(246,231,216,.75)');
    txt(`back in ${Math.ceil(p.dead)}`,W2/2,H2*.4+130,'rgba(246,231,216,.55)');return}
  if(!VLT){if(rift&&p.dead<=0){edgeArrow(p,W2,H2,Zv,rift.x,rift.y,'#c59bff','RIFT',.9);const sc=ms/WORLD;ctx.fillStyle='#c59bff';ctx.globalAlpha=.6+Math.sin(time*6)*.4;
      ctx.beginPath();ctx.arc(mx+rift.x*sc,my+rift.y*sc,5,0,TAU);ctx.fill();ctx.globalAlpha=1}return}
  const V=VLT,B=BIOMES[V.biome],x=split?10:14,y=split?10:14;
  ctx.fillStyle='#1d0a05';ctx.fillRect(x+8,y+121,186,32);ctx.textAlign='left';ctx.font=F(600,14);ctx.fillStyle=B.acc;
  ctx.fillText(`${V.daily?'DAILY ':''}VAULT · F${V.depth}${V.mod?' · '+MODS[V.mod][0]:''}`,x+14,y+136);const h=heat(p);bar(x+14,y+145,172,5,h,h>=1?'#ff5a3c':'#e67424','#3c0d03');
  ctx.fillStyle='#120604';rr(mx-4,my-4,ms+8,ms+8,12);ctx.fill();const sc=ms/(VGW*VC),oy=my+(ms-VGH*VC*sc)/2;
  for(let i=0;i<V.rooms.length;i++){const r=V.rooms[i];if(!r.seen&&!(i>0&&V.rooms[i-1].state==='done'))continue;
    ctx.fillStyle=r.seen?B.wall:'rgba(246,231,216,.15)';ctx.fillRect(mx+r.x0*VC*sc,oy+r.y0*VC*sc,r.w*VC*sc,r.h*VC*sc);
    if(i===V.cur){ctx.strokeStyle=B.acc;ctx.lineWidth=2;ctx.strokeRect(mx+r.x0*VC*sc,oy+r.y0*VC*sc,r.w*VC*sc,r.h*VC*sc)}
    if(r.type==='exit'&&r.seen){ctx.fillStyle='#f5c34d';ctx.fillRect(mx+(r.cx-1)*VC*sc,oy+(r.cy-1)*VC*sc,4,4)}}
  if(p.dead<=0){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(mx+(p.x-VOX)*sc,oy+(p.y-VOY)*sc,3,0,TAU);ctx.fill()}
  const R=V.rooms[V.cur];let line='',col=B.acc;
  if(R&&R.state==='fight'){const alive=enemies.filter(e=>!e.dead&&e.room===R.i).length;line=R.type==='boss'?`${B.boss[0].toUpperCase()} · ${alive} left`:`WAVE ${R.wave}/${R.waves} · ${alive} left`;col='#ff6a3d'}
  else if(R&&R.type==='exit')line=`EXTRACT ×${extractMul().toFixed(1)}  ·  DEEPER → F${V.depth+1}`;
  else line=`${B.n.toUpperCase()} · ROOM ${V.cur+1}/${V.rooms.length}`;
  ctx.font=F(800,15);ctx.textAlign='center';const w=ctx.measureText(line).width+28;ctx.fillStyle='rgba(23,8,4,.75)';rr(W2/2-w/2,y+168,w,30,12);ctx.fill();ctx.fillStyle=col;ctx.fillText(line,W2/2,y+188);
  if(p.dead<=0&&R&&R.state==='done'&&V.cur<V.rooms.length-1){const n=V.rooms[V.cur+1],t=roomW(n);_ea8(p,W2,H2,Zv,t.x,t.y,B.acc,n.type==='exit'?'EXIT':'NEXT',.9)}};

/* ---------- UI ---------- */
(()=>{const md=$('menu')&&$('menu').querySelector('.modes');if(md){const b=document.createElement('button');b.className='alt';b.id='goVault';b.innerHTML='DAILY VAULT<small id="vaultSub"></small>';
    b.addEventListener('click',startDailyVault);md.appendChild(b)}})();
const _mm8=menuMeta;menuMeta=function(){_mm8();ensureVault();const b=$('goVault'),s=$('vaultSub'),V=save.vault,d=V.daily&&V.daily.d===today()?V.daily:{best:0,haul:0};
  if(b)b.style.display=save.ftue>=5?'':'none';if(s)s.textContent=`same vault for everyone today · your best: floor ${d.best}${d.haul?' · '+d.haul+' banked':''} · deepest ever ${V.best}`};
ensureVault();menuMeta();document.title='Salvage Run · v0.8';
if(window.__game)Object.defineProperties(window.__game,Object.getOwnPropertyDescriptors({update,enterVault,endVault,vaultPath,startDailyVault,setCounts,shiftW,genFloor,
  get VLT(){return VLT},get rift(){return rift},set riftT(v){riftT=v},get crates(){return crates},get pickups(){return pickups},vcell,makeItem,itemPower,gearTotals,
  get wloot(){return wloot},get gearHtml(){return gearEl.innerHTML}}));
