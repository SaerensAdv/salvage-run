/* ================= STATE ================= */
let mode='solo',state='menu',myId=0,raid=false;
let players=[],enemies=[],bullets=[],pickups=[],parts=[],texts=[],feed=[],rings=[];
let time=0,hitstop=0,beacon=null,beaconT=45,bossT=120,dayT=10,eid=0,pid2=0,matchT=0,banners={},shakes={};
const MATCH_LEN=360;
const decor=[];for(let i=0;i<900;i++)decor.push({x:rand(0,WORLD),y:rand(0,WORLD),r:rand(5,26),k:Math.random(),a:rand(0,TAU)});
const crates=[];
function placeCrate(c){for(let i=0;i<20;i++){const x=rand(80,WORLD-80),y=rand(80,WORLD-80),d=Math.hypot(x-HUB.x,y-HUB.y);if(d<HUB.r+140)continue;
  const t=tierAt(x,y);if(t===1&&Math.random()<.4)continue;c.x=x;c.y=y;c.t=t;break}c.r=17;c.max=c.hp=20*[0,1,2,3.5][c.t];c.dead=0;c.flash=0;c.dirty=true}
for(let i=0;i<75;i++){const c={i};placeCrate(c);crates.push(c)}
const creditsSave=p=>mode==='solo'||mode==='party'||(mode==='host'&&p.id===0);
const localIds=()=>mode==='guest'?[myId]:players.filter(p=>!p.remote).map(p=>p.id);
const meP=()=>mode==='guest'?players.find(p=>p.id===myId):players[0];
const alive=p=>p&&p.dead<=0;
const heat=p=>Math.min(1,p.trip.t/240);
const ftueOn=()=>mode==='solo'&&save.ftue<5;
const avgLv=()=>{const ps=players.length?players:[{lv:save.lv}];return ps.reduce((s,p)=>s+Object.values(p.lv).reduce((a,b)=>a+b,0),0)/ps.length};

/* ================= PLAYERS ================= */
function makePlayer(o){const p={isP:true,id:o.id,name:o.name||'Player',ctrl:o.ctrl||'touch',remote:!!o.remote,skin:o.skin||0,char:o.char||'scrapper',col:o.col||null,
  lv:o.lv||save.lv,x:HUB.x+(o.ox||0),y:HUB.y+40,r:16,hp:100,maxHp:100,spd:190,dmg:12,rate:2.4,range:270,crit:.05,mag:100,cap:50,cd:0,carry:0,dead:0,inv:0,
  face:0,hurt:0,dashT:0,abCd:0,abCdMax:2.8,abT:0,dashX:0,dashY:1,dx:0,dy:1,dashHit:null,novaT:3.5,glow:false,warm:false,hot:false,run:null,
  trip:{z3:false,hit:false,t:0},haul:0,bankT:0,combo:0,comboT:0,lastTier:1,fullT:0,beatT:0,deathInfo:null,picking:null,pend:[],pickDelay:0,
  score:0,kills:0,ftueMove:0,ftueKills:0,input:{mx:0,my:0,ab:0},abSeen:0,joy:{on:false,id:null,bx:0,by:0,kx:0,ky:0,dx:0,dy:0},sawCd:0,flash:0};
  if(!p.col)p.col=SKINS[p.skin][1];newRun(p);p.hp=p.maxHp;return p}
function recalc(p){const k=p.run.perks,L=p.lv,C=CHARS[p.char]||CHARS.scrapper;
  p.dmg=12*Math.pow(1.2,L.dmg)*(1+.2*(k.dmg||0));p.rate=2.4*(1+.2*(k.rate||0));p.crit=.05+.1*(k.crit||0);p.range=270*(1+.15*(k.range||0));
  p.spd=(190+12*L.spd)*(1+C.spd);p.maxHp=Math.max(40,100+25*L.hp+25*(k.plating||0)+C.hp);p.hp=Math.min(p.hp,p.maxHp);
  p.mag=(100+18*L.mag)*(1+.5*(k.vacuum||0))*(p.char==='ghost'?1.3:1);p.cap=50+25*L.bag;
  p.abCdMax=C.cd*Math.pow(p.char==='scrapper'?.75:.85,k.thruster||0)}
function newRun(p){p.run={lvl:1,xp:0,next:5,perks:{}};p.pend=[];p.picking=null;recalc(p)}
function respawn(p){p.x=HUB.x+rand(-30,30);p.y=HUB.y+40;p.hp=p.maxHp;p.inv=1.5;p.abCd=0;p.abT=0}

/* ================= FX DISPATCH (local + network) ================= */
function burst(x,y,col,n=10,sp=180){for(let i=0;i<n;i++){const a=rand(0,TAU),s=rand(.3,1)*sp;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.25,.6),col,s:rand(2,5)})}}
function pushFeedLocal(txt,col,pid=-1){feed.unshift({txt,col,t:4.5,pid});if(feed.length>6)feed.pop()}
function applyFx(e){const mine=id=>id==null||id<0||localIds().includes(id);
  switch(e[0]){
    case 'b':burst(e[1],e[2],e[3],e[4],e[5]);break;
    case 't':texts.push({x:e[1],y:e[2],txt:e[3],col:e[4],size:e[5],life:.9});break;
    case 'r':rings.push({x:e[1],y:e[2],r:10,max:e[3],life:e[5]||.4,col:e[4]});break;
    case 'f':if(mine(e[3]))pushFeedLocal(e[1],e[2],mode==='guest'?-1:e[3]);break;
    case 'n':if(mine(e[3]))banners[mode==='guest'?-1:e[3]]={t:e[4]||3.5,title:e[1],sub:e[2]};break;
    case 's':if(mine(e[1]))beep(e[2],e[3],e[4],e[5],e[6]);break;
    case 'F':if(mine(e[1]))fanfareLocal(e[2]);break;
    case 'k':if(mine(e[1])){const id=mode==='guest'?myId:e[1];if(id<0)localIds().forEach(i=>shakes[i]=Math.max(shakes[i]||0,e[2]));else shakes[id]=Math.max(shakes[id]||0,e[2])}break;
    case 'v':if(mine(e[1]))vibLocal(e[2]);break;
    case 'd':if(mine(e[1])){const p=meP();if(mode==='guest'&&p)p.deathInfo=e[2]}break;
    case 'x':if(mode==='guest'&&e[1]===myId)guestPick(e[2],e[3],e[4]);break}}
function fx(e){applyFx(e);if(mode==='host')netQueue(e)}
const snd=(p,f,d,type,v,slide)=>fx(['s',p?p.id:-1,f,d,type,v,slide||0]);
const fan=(p,base)=>fx(['F',p?p.id:-1,base]);
const shk=(p,a)=>fx(['k',p?p.id:-1,a]);
const vb=(p,pat)=>fx(['v',p?p.id:-1,pat]);
const feedTo=(p,txt,col)=>fx(['f',txt,col,p?p.id:-1]);
const bannerTo=(p,title,sub,t)=>fx(['n',title,sub,p?p.id:-1,t||3.5]);
const fxBurst=(x,y,col,n,sp)=>fx(['b',Math.round(x),Math.round(y),col,n,Math.round(sp||180)]);
const fxText=(x,y,txt,col,size)=>fx(['t',Math.round(x),Math.round(y),txt,col,size||16]);
const fxRing=(x,y,max,col,life)=>fx(['r',Math.round(x),Math.round(y),max,col,life||.4]);

/* ================= RAIDERS ================= */
const rivals=[];
function rivalStats(r){r.lvl=clamp(Math.floor(Math.sqrt(r.bank/60))+Math.round(avgLv()/4+(r.name.length%3)-1),0,15);r.maxHp=80+r.lvl*24;r.dmg=8*(1+r.lvl*.2);r.spd=165+r.lvl*4;r.rate=1.5;r.range=235}
function pickWander(r){const a=rand(0,TAU),d=rand(400,1650);r.tx=clamp(HUB.x+Math.cos(a)*d,60,WORLD-60);r.ty=clamp(HUB.y+Math.sin(a)*d,60,WORLD-60)}
function spawnRival(r){const a=rand(0,TAU),d=rand(750,1500);r.x=clamp(HUB.x+Math.cos(a)*d,60,WORLD-60);r.y=clamp(HUB.y+Math.sin(a)*d,60,WORLD-60);
  rivalStats(r);r.hp=r.maxHp;r.carry=rand(0,8);r.goal='farm';r.greed=rand(22,65)*(1+r.lvl*.2);r.aggro=0;r.aggroP=null;r.chan=0;r.revengeOn=-1;pickWander(r)}
function makeRivals(n){rivals.length=0;RIVAL_DEF.slice(0,n).forEach(([name,col],i)=>{const r={id:i,name,col,r:16,bank:save.raiders[name]!=null?save.raiders[name]:Math.floor(rand(0,80)),
  carry:0,lvl:0,dead:0,aggro:0,aggroP:null,cd:0,flash:0,goal:'farm',greed:0,tx:0,ty:0,face:0,vx:0,vy:0,revengeOn:-1,sawCd:0,chan:0};spawnRival(r);rivals.push(r)})}

/* ================= WORLD SETUP ================= */
function setupWorld(m,plist){mode=m;players=plist;enemies=[];bullets=[];pickups=[];parts=[];texts=[];feed=[];rings=[];beacon=null;banners={};shakes={};
  time=0;eid=0;hitstop=0;beaconT=ftueOn()?1e9:40;bossT=ftueOn()?1e9:110;matchT=MATCH_LEN;crates.forEach(placeCrate);
  makeRivals(m==='solo'?5:4);players.forEach(p=>respawn(p))}

/* ================= PROGRESSION ================= */
function ev(t,a=1){if(save.rank<RANKS.length){const R=RANKS[save.rank];
    R.g.forEach((g,i)=>{if(g[0]!==t)return;const b=save.gp[i];save.gp[i]=MAXMODE.has(t)?Math.max(b,a):b+a;
      if(b<g[1]&&save.gp[i]>=g[1]){pushFeedLocal('Goal done · '+g[2],'#f5c34d');beep(880,.12,'triangle',.05)}});
    if(R.g.every((g,i)=>save.gp[i]>=g[1]))rankUp()}
  const d=save.daily;d.m.forEach(m=>{if(m.t!==t||m.done)return;m.p=MAXMODE.has(t)?Math.max(m.p,a):m.p+a;
    if(m.p>=m.n){m.done=true;save.bank+=m.r;save.total+=m.r;pushFeedLocal(`Daily done · ${m.label} · +${m.r}`,'#f5c34d');beep(760,.12,'triangle',.05);refreshShop()}});
  if(!d.full&&d.m.every(m=>m.done)){d.full=true;d.streak++;const bonus=d.streak%5===0?300:100;save.bank+=bonus;save.total+=bonus;
    banners[-1]={t:3.5,title:'DAILY CHEST',sub:`+${bonus} safe scrap · streak ${d.streak}`};fanfareLocal(440);refreshShop()}
  dirty=true}
function rankUp(){const R=RANKS[save.rank];save.rank++;save.gp=[0,0,0];const bonus=40*save.rank;save.bank+=bonus;save.total+=bonus;
  banners[-1]={t:4,title:`RANK ${save.rank+1} · ${RANK_NAMES[save.rank].toUpperCase()}`,sub:`Unlocked ${unlockLabel(R.u)} · +${bonus} safe scrap`};
  const nc=Object.keys(CHARS).find(k=>CHARS[k].unlock===save.rank);if(nc)pushFeedLocal(`New character unlocked: ${CHARS[nc].n}`,'#f5c34d');
  fanfareLocal(523);vibLocal([40,40,80]);const me=meP();if(me)burst(me.x,me.y,'#f5c34d',50,380);persist();refreshShop();
  if(save.rank<RANKS.length)ev('upgrade',totalLv())}
function unlockLabel(u){if(!u)return'';if(u==='legend')return'the Legend title';if(u.startsWith('skin:'))return SKINS[+u.slice(5)][0]+' skin';return PERKS[u].n+' perk'}
function pev(p,t,a=1){if(creditsSave(p))ev(t,a);else if(p.remote)netSend(p,{t:'ev',k:t,a})}
function ftueNext(){save.ftue++;persist();if(save.ftue>=5){pushFeedLocal('That\'s the loop. Go deeper. Bank more. Don\'t die holding it.','#f5c34d');beaconT=40;bossT=110;fanfareLocal(600)}
  else beep(700,.1,'triangle',.05)}
function gainXp(p,n){const r=p.run;r.xp+=n;while(r.xp>=r.next){r.xp-=r.next;r.lvl++;r.next=Math.round(5*Math.pow(1.3,r.lvl-1));p.pend.push(false);pev(p,'level',r.lvl)}tryPick(p)}
function rollPerks(p){const pool=Object.keys(PERKS).filter(k=>perkUnlocked(k)&&(p.run.perks[k]||0)<PERKS[k].max),out=[];
  while(out.length<3&&pool.length){let tot=0;for(const k of pool)tot+=RW[PERKS[k].r];let x=Math.random()*tot,i=0;
    for(;i<pool.length;i++){x-=RW[PERKS[pool[i]].r];if(x<=0)break}out.push(pool.splice(Math.min(i,pool.length-1),1)[0])}
  for(const s of ['_cache','_heal'])if(out.length<3)out.push(s);return out}
const pausing=()=>mode==='solo'||mode==='party';
function tryPick(p){if(p.picking||!p.pend.length||p.dead>0||p.pickDelay>0)return;if(pausing()&&state!=='play')return;
  const free=p.pend.shift(),opts=rollPerks(p);p.picking={opts,free,t:pausing()?1e9:8};
  if(p.remote)fx(['x',p.id,opts,free,p.run.lvl]);else openPickUI(p,opts,free)}
function applyPick(p,k){if(!p.picking||!p.picking.opts.includes(k))return;
  if(k==='_cache')p.carry+=25;else if(k==='_heal')p.hp=p.maxHp;else{p.run.perks[k]=(p.run.perks[k]||0)+1;recalc(p);if(k==='plating')p.hp=p.maxHp}
  fxText(p.x,p.y-36,(PERKS[k]||SPECIAL[k]).n.toUpperCase(),'#f5c34d',20);fxBurst(p.x,p.y,'#f5c34d',20,240);snd(p,990,.1,'triangle',.05);
  p.picking=null;p.pickDelay=.22;if(!p.remote)closePickUI(p)}
