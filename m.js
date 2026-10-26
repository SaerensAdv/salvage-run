/* ================= v0.10 · FRONTIER =================
   The world is now 4 rings around the hub. Each next ring is locked behind a Gatekeeper boss at its gate.
   Camps, shrines and world events give every trip something to chase. Solo, party and host (online guests just see it).
   Logic first, drawing deliberately simple so the visual remake can reuse everything. */
const REG=[
  {n:'Scrap Plains',out:1800,acc:'#ed9b49'},
  {n:'Rust Flats',out:2600,gr:'rgba(150,90,40,.16)',acc:'#e8a660',bio:'crab',bc:'#c08048',gk:['Rustjaw','#d08a4a'],foe:'Magnet Crabs steal from your bag'},
  {n:'Slag Fields',out:3300,gr:'rgba(160,40,12,.2)',acc:'#ff6a3d',bio:'slag',bc:'#ff6a3d',gk:['The Foreman','#ff8a3c'],foe:'Slag Golems leave burning ground'},
  {n:'Dead Reactor',out:3950,gr:'rgba(40,110,150,.2)',acc:'#8fd6ff',bio:'wisp',bc:'#8fd6ff',gk:['Core Tyrant','#bfe8ff'],foe:'Arc Wisps explode when they die'}];
const RSC=[{hp:1,dmg:1,sc:1,xp:1},{hp:1.9,dmg:1.3,sc:1.6,xp:1.5},{hp:3.3,dmg:1.7,sc:2.4,xp:2.2},{hp:5.4,dmg:2.2,sc:3.4,xp:3}];
const GA=[-.7,2.3,4.4],GATE_HOLD=1.6,GATE_CD=240;
const GATES=[0,1,2].map(r=>({r,a:GA[r],x:HUB.x+Math.cos(GA[r])*REG[r].out,y:HUB.y+Math.sin(GA[r])*REG[r].out,prog:0}));
const HZW={name:'Slag',col:'#ff6a3d'},HZS={name:'An Arc Wisp',col:'#8fd6ff'};
const BUFFS={fury:['FURY','+40% damage','#ff6a3d'],swift:['SWIFT','+30% speed','#7be08f'],magnet:['MAGNET','×2 pickup range','#5aa9ff'],fortune:['FORTUNE','+60% scrap','#f5c34d']};
const BUFFK=Object.keys(BUFFS),BUFF_T=30,SHRINE_CD=120;
const EVN={drop:['SUPPLY DROP','A crate is falling. Guards included.','#fff3c4'],goblin:['LOOT GOBLIN','It runs. It drops scrap. Catch it.','#f5c34d'],
  horde:['HORDE','A wave is coming. Clear it for a chest.','#ff6a3d'],storm:['SCRAP STORM','Scrap rains in the marked zone. 25 s.','#ed9b49']};
const EVK=Object.keys(EVN);
const regAt=(x,y)=>{const d=Math.hypot(x-HUB.x,y-HUB.y);return d<REG[0].out?0:d<REG[1].out?1:d<REG[2].out?2:3};
const curReg=()=>mode==='guest'?(G.reg|0):clamp(save.region|0,0,3);
const FR=()=>REG[curReg()].out;
let frAnim=REG[0].out,WEV=null,evT=55,fires=[],shocks=[],gkShots=[],crMul=0;

/* ---------- static points of interest (same on every device) ---------- */
const CAMPS=[],SHRINES=[];
(()=>{const R=mulberry(hashStr('frontier-v1'));const near=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)))<.45;
  for(let r=0;r<4;r++){const lo=r===0?1080:REG[r-1].out+170,hi=REG[r].out-200,nc=r===0?2:3,ns=r===0?1:2,used=GATES.filter(g=>g.r===r||g.r===r-1).map(g=>g.a);
    for(let i=0;i<nc+ns;i++){let a,k=0;do{a=R()*TAU;k++}while(k<40&&used.some(u=>near(u,a)));used.push(a);const d=lo+R()*(hi-lo);
      const o={x:HUB.x+Math.cos(a)*d,y:HUB.y+Math.sin(a)*d,r};
      if(i<nc)CAMPS.push(Object.assign(o,{i:CAMPS.length,R:170,st:0,t:0,fx:0}));else SHRINES.push(Object.assign(o,{i:SHRINES.length,k:BUFFK[SHRINES.length%BUFFK.length],cd:0}))}}})();

function ensureRegion(){if(save.region==null)save.region=0;save.region=clamp(save.region|0,0,3);if(!save.gcd||typeof save.gcd!=='object')save.gcd={};if(!save.regStats)save.regStats={gk:0,camps:0,events:0}}
ensureRegion();frAnim=REG[curReg()].out;
const onWorld=()=>(state==='play'||state==='pick')&&!VLT&&!ftueOn()&&mode!=='guest';

/* ---------- scaling: deeper rings = tougher monsters, more scrap, better gear ---------- */
const _me10=makeEnemy;makeEnemy=function(type,x,y,t,p){const e=_me10(type,x,y,t,p);if(VLT||type==='collector')return e;
  const r=Math.min(regAt(x,y),curReg()),S=RSC[r];if(!r)return e;e.reg=r;
  e.hp*=S.hp;e.max=e.hp;e.dmg*=S.dmg;e.scrap*=S.sc;e.xp*=S.xp;if(!e.elite&&type!=='boss'&&Math.random()<.04*r){e.elite=true;e.hp*=3;e.max=e.hp;e.r*=1.25}
  if((type==='crawler'||type==='dasher'||type==='brute')&&Math.random()<.35){const b=REG[r].bio;e.rb=b;e.col=REG[r].bc;e.bt=rand(1,3);e.loot=0;e.stealCd=0;
    if(b==='crab'){e.r*=1.25;e.hp*=1.5;e.max=e.hp;e.spd*=.9}else if(b==='slag'){e.hp*=1.3;e.max=e.hp;e.spd*=.85}else{e.spd*=1.2;e.hp*=.8;e.max=e.hp}}
  return e};
const _di10=dropItem;dropItem=function(x,y,w,il){if(VLT)return _di10(x,y,w,il);const r=Math.min(regAt(x,y),curReg());return _di10(x,y,r?shiftW(w,r*2):w,(il||0)+4*r)};
const _ds10=dropScrap;dropScrap=function(x,y,total,spread){_ds10(x,y,total*(crMul||1),spread)};
const _pc10=placeCrate;placeCrate=function(c){_pc10(c);const r=regAt(c.x,c.y);if(r){c.max=c.hp=c.max*(1+.8*r)}};
for(const c of crates){const r=regAt(c.x,c.y);if(r){c.max=c.hp=c.max*(1+.8*r)}}
const _se10=spawnEnemy;spawnEnemy=function(p){const n=enemies.length;_se10(p);if(VLT||enemies.length<=n)return;const e=enemies[enemies.length-1];
  if(Math.hypot(e.x-HUB.x,e.y-HUB.y)>FR()-30)enemies.pop()};

/* ---------- gatekeepers ---------- */
function gkAlive(r){return enemies.find(e=>!e.dead&&e.gk===r+1)}
function spawnGK(r,p){const g=GATES[r],d=REG[r].out-260,x=HUB.x+Math.cos(g.a)*d,y=HUB.y+Math.sin(g.a)*d,N=REG[r+1].gk;
  const e=makeEnemy('boss',x,y,3,p);e.hp*=[.7,.9,1.05][r]*(1+.25*(players.length-1));e.max=e.hp;
  e.gk=r+1;e.vname=N[0];e.col=N[1];e.r*=1.15;e.scrap*=2+r;e.bt=2.2;e.sum=0;e.gx=g.x;e.gy=g.y;e.rep=r<curReg();enemies.push(e);
  bannerTo(null,`${N[0].toUpperCase()} WAKES UP`,e.rep?'Gatekeeper rematch · loot only':`Beat it to open the ${REG[r+1].n}`,3.2);fan(null,262);shk(null,14);snd(null,70,.7,'sawtooth',.06,.6);return e}
function gkTick(e,dt){const r=e.gk-1,enr=e.hp<e.max*.3,col=REG[r+1].acc;e.bt-=dt;
  const dg=Math.hypot(e.x-e.gx,e.y-e.gy);if(dg>900){e.x+=(e.gx-e.x)/dg*120*dt;e.y+=(e.gy-e.y)/dg*120*dt}
  if(!players.some(p=>p.dead<=0&&Math.hypot(p.x-e.x,p.y-e.y)<1600)){e.dead=true;feedTo(null,`${e.vname} went back to its gate`,col);gkShots=[];return}
  if(e.bt<=0){e.bt=enr?1.6:2.5;const n=8+2*r,sp=200+20*r,dmg=6*(1+.45*r)*(enr?1.2:1),o=time*.7;
    for(let i=0;i<n;i++){const a=o+i/n*TAU;gkShots.push({x:e.x,y:e.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:3.4,dmg,r:8,col,by:e})}
    if(r>=1){const t=players.filter(p=>targetable(p)).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];
      if(t){const a0=Math.atan2(t.y-e.y,t.x-e.x);for(const k of[-.12,0,.12])gkShots.push({x:e.x,y:e.y,vx:Math.cos(a0+k)*(sp+120),vy:Math.sin(a0+k)*(sp+120),life:2.6,dmg:dmg*1.2,r:9,col:'#fff3c4',by:e})}}
    fxRing(e.x,e.y,e.r+30,col,.3);snd(null,180,.12,'square',.03)}
  const th=e.sum===0?.66:e.sum===1?.33:-1;if(th>0&&e.hp<e.max*th){e.sum++;bannerTo(null,`${e.vname.toUpperCase()} CALLS FOR HELP`,'',1.6);
    for(let k=0;k<3+r;k++){const a=rand(0,TAU),x=e.x+Math.cos(a)*120,y=e.y+Math.sin(a)*120,a2=makeEnemy(Math.random()<.3?'brute':'dasher',x,y,3,players[0]);a2.wx=x;a2.wy=y;enemies.push(a2);fxRing(x,y,30,col,.3)}}}
function onGK(e,by){const r=e.gk-1;gkShots=[];if(mode==='guest')return;
  if(!e.rep&&curReg()===r){save.region=r+1;ensureRegion();save.regStats.gk++;const bonus=150*(r+1);save.bank+=bonus;save.total+=bonus;
    setTimeout(()=>{bannerTo(null,`${REG[r+1].n.toUpperCase()} UNLOCKED`,`The map just grew · +${bonus} safe scrap · tougher monsters, better gear`,4.5);fan(null,523)},900);
    feedTo(null,`New region: ${REG[r+1].n}. ${REG[r+1].foe}.`,REG[r+1].acc);if(r===2)setTimeout(()=>feedTo(null,'Every gate is open. Gatekeepers now return every few minutes for loot.','#f5c34d'),3500)}
  else{save.gcd[r]=Date.now()+GATE_CD*1000;feedTo(null,`${e.vname} is down. It comes back in ${GATE_CD/60} min.`,REG[r+1].acc)}
  dropItem(e.x,e.y,RW7.boss,10+4*r);if(!e.rep)dropItem(e.x,e.y,shiftW(RW7.boss,2),12+4*r);dropOrb(e.x,e.y);dropOrb(e.x,e.y);persist();menuMeta()}
function gateTick(dt){for(const g of GATES){const R=curReg();g.open=g.r<R;g.live=g.r<=R&&g.r<3;
    if(!g.live){g.prog=0;continue}const cd=g.open&&(save.gcd[g.r]||0)>Date.now();g.cd=cd?Math.ceil(((save.gcd[g.r]||0)-Date.now())/1000):0;
    if(cd||gkAlive(g.r)){g.prog=0;continue}
    const on=players.some(p=>p.dead<=0&&!p.picking&&Math.hypot(p.x-g.x,p.y-g.y)<120);
    g.prog=on?g.prog+dt:Math.max(0,g.prog-dt*2);if(g.prog>=GATE_HOLD){g.prog=0;spawnGK(g.r,players.find(p=>p.dead<=0)||players[0])}}}

/* ---------- camps, shrines ---------- */
function chestAt(x,y,r,tag){const c={i:-1,x,y,t:3,r:22,dead:0,flash:0,chest:true};c.max=c.hp=70*(1+.8*r);Object.assign(c,tag);crates.push(c);return c}
function campTick(dt){for(const c of CAMPS){if(c.r>curReg()){c.st=0;continue}
    if(c.st===0){if(players.some(p=>p.dead<=0&&Math.hypot(p.x-c.x,p.y-c.y)<c.R)){c.st=1;c.t=0;const n=5+2*c.r+Math.max(0,players.length-1)*2,P=players[0];
        for(let k=0;k<n;k++){const a=rand(0,TAU),d=rand(30,c.R),x=c.x+Math.cos(a)*d,y=c.y+Math.sin(a)*d,t=c.r?3:tierAt(x,y);
          const e=makeEnemy(k===0?'brute':Math.random()<.5?'dasher':'crawler',x,y,t,P);if(k===0){e.hp*=2;e.max=e.hp;e.elite=true}e.campI=c.i;e.wx=x;e.wy=y;enemies.push(e)}
        feedTo(null,`Raider camp! Clear it for a chest.`,REG[c.r].acc);snd(null,220,.2,'sawtooth',.04)}}
    else if(c.st===1){c.t+=dt;const left=enemies.some(e=>!e.dead&&e.campI===c.i);
      if(!left){c.st=2;chestAt(c.x,c.y,c.r,{camp:c.i});fxRing(c.x,c.y,c.R,'#f5c34d',.5);feedTo(null,'Camp cleared · break the chest','#f5c34d');fan(null,440)}
      else if(c.t>90&&!players.some(p=>p.dead<=0&&Math.hypot(p.x-c.x,p.y-c.y)<1400)){c.st=0;for(const e of enemies)if(e.campI===c.i)e.dead=true}}
    else if(c.st===3){c.t-=dt;if(c.t<=0)c.st=0}}}
function shrineTick(dt){for(const s of SHRINES){if(s.cd>0){s.cd-=dt;continue}if(s.r>curReg())continue;
    const p=players.find(q=>q.dead<=0&&!q.picking&&Math.hypot(q.x-s.x,q.y-s.y)<52);if(!p)continue;const B=BUFFS[s.k];
    p.buff={k:s.k,t:BUFF_T};recalc(p);s.cd=SHRINE_CD;bannerTo(p,`${B[0]} SHRINE`,`${B[1]} for ${BUFF_T} s`,2.2);fxRing(s.x,s.y,140,B[2],.5);fan(p,587)}
  for(const p of players)if(p.buff){p.buff.t-=dt;if(p.buff.t<=0){p.buff=null;recalc(p)}}}
const _rc10=recalc;recalc=function(p){_rc10(p);const b=p.buff&&p.buff.t>0?p.buff.k:null;if(!b)return;
  if(b==='fury')p.dmg*=1.4;else if(b==='swift')p.spd*=1.3;else if(b==='magnet')p.mag*=2.2;else if(b==='fortune')p.scrapF=(p.scrapF||0)+.6};

/* ---------- world events ---------- */
function evSpot(p,lo,hi){for(let k=0;k<30;k++){const a=rand(0,TAU),d=rand(lo,hi),x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d,dh=Math.hypot(x-HUB.x,y-HUB.y);
    if(dh<HUB.r+260||dh>FR()-160)continue;return{x,y}}return null}
function startEvent(k){const ps=players.filter(p=>p.dead<=0&&!inHub(p));const p=ps[Math.floor(Math.random()*ps.length)];if(!p)return false;
  const s=evSpot(p,k==='goblin'?420:650,k==='goblin'?520:1250);if(!s)return false;const r=Math.min(regAt(s.x,s.y),curReg()),N=EVN[k];
  WEV={k,x:s.x,y:s.y,r,t:k==='storm'?25:k==='drop'?75:k==='goblin'?22:45,ph:0,tk:0,n:0};
  if(k==='goblin'){const e=makeEnemy('dasher',s.x,s.y,3,p);e.gob=1;e.hp=e.max=Math.max(e.hp*6,90*(1+r));e.spd=155;e.r=15;e.col='#f5c34d';e.hitCd=1e9;e.wx=s.x;e.wy=s.y;enemies.push(e);WEV.id=e.id}
  if(k==='drop')WEV.ph=3;
  bannerTo(null,N[0],N[1],2.6);snd(null,880,.2,'triangle',.05,.6);save.regStats.events++;return true}
function evTick(dt){if(!WEV){evT-=dt;if(evT<=0){evT=rand(50,70);startEvent(EVK[Math.floor(Math.random()*EVK.length)])}return}
  const E=WEV,r=E.r;E.t-=dt;
  if(E.k==='drop'){if(E.ph>0){E.ph-=dt;if(E.ph<=0){E.chest=chestAt(E.x,E.y,r,{evc:1});shk(null,10);fxBurst(E.x,E.y,'#fff3c4',40,320);fxRing(E.x,E.y,180,'#fff3c4',.5);
        for(let k=0;k<3+r;k++){const a=rand(0,TAU),x=E.x+Math.cos(a)*90,y=E.y+Math.sin(a)*90,e=makeEnemy(k?'dasher':'brute',x,y,3,players[0]);e.elite=k===0;if(k===0){e.hp*=2;e.max=e.hp}e.wx=x;e.wy=y;enemies.push(e)}}}
    else if(!E.chest||E.chest.dead>0||!crates.includes(E.chest)){WEV=null;return}}
  else if(E.k==='goblin'){const g=enemies.find(e=>e.id===E.id&&!e.dead);if(!g){WEV=null;return}E.x=g.x;E.y=g.y;E.tk-=dt;if(E.tk<=0){E.tk=.6;_ds10(g.x,g.y,1+r,.6)}
    if(E.t<=0){g.dead=true;fxBurst(g.x,g.y,'#f5c34d',20,200);feedTo(null,'The goblin got away. Next time.','#ed9b49');WEV=null;return}}
  else if(E.k==='horde'){E.tk-=dt;if(E.n<3&&E.tk<=0){E.tk=3;E.n++;const p=players.find(q=>q.dead<=0)||players[0];const a0=Math.atan2(E.y-p.y,E.x-p.x);
      for(let k=0;k<6+2*r;k++){const a=a0+rand(-.5,.5),d=rand(560,720),x=clamp(p.x+Math.cos(a)*d,40,WORLD-40),y=clamp(p.y+Math.sin(a)*d,40,WORLD-40);
        if(Math.hypot(x-HUB.x,y-HUB.y)>FR()-40)continue;const e=makeEnemy(Math.random()<.2?'brute':Math.random()<.5?'dasher':'crawler',x,y,3,p);e.hord=1;e.wx=p.x;e.wy=p.y;enemies.push(e)}
      if(E.n===1)feedTo(null,'Here they come','#ff6a3d')}
    if(E.n>=3&&!enemies.some(e=>!e.dead&&e.hord)){const p=players.find(q=>q.dead<=0)||players[0];chestAt(p.x+40,p.y-40,r,{evc:1});feedTo(null,'Horde cleared · reward chest dropped','#f5c34d');fan(null,523);WEV=null;return}
    if(E.t<=0){for(const e of enemies)if(e.hord)e.hord=0;feedTo(null,'The horde scattered','#ed9b49');WEV=null;return}}
  else if(E.k==='storm'){E.tk-=dt;if(E.tk<=0){E.tk=.3;const a=rand(0,TAU),d=Math.sqrt(Math.random())*230;pickups.push({id:++pid2,k:'s',x:E.x+Math.cos(a)*d,y:E.y+Math.sin(a)*d,v:1+r,vx:0,vy:0,age:0})}
    E.n+=dt;if(E.n>3){E.n=0;for(let k=0;k<2;k++){const a=rand(0,TAU),x=E.x+Math.cos(a)*200,y=E.y+Math.sin(a)*200;enemies.push(makeEnemy('crawler',x,y,3,players[0]))}}
    if(E.t<=0){WEV=null;return}}
  if(E.t<=-1)WEV=null}

/* ---------- region monsters + hazards ---------- */
function hazTick(dt){for(const f of fires){f.life-=dt;f.arm-=dt;if(f.arm<=0)for(const p of players)if(p.dead<=0&&Math.hypot(p.x-f.x,p.y-f.y)<f.r+p.r*.5)hitPlayer(p,f.dmg,HZW)}fires=fires.filter(f=>f.life>0);
  for(const s of shocks){s.t-=dt;if(s.t<=0){fxRing(s.x,s.y,s.r,'#8fd6ff',.3);for(const p of players)if(p.dead<=0&&Math.hypot(p.x-s.x,p.y-s.y)<s.r+p.r)hitPlayer(p,s.dmg,HZS)}}shocks=shocks.filter(s=>s.t>0);
  for(const b of gkShots){b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.life<=0)continue;if(inHub(b)){b.life=0;continue}
    for(const p of players)if(targetable(p)&&(p.x-b.x)**2+(p.y-b.y)**2<(p.r+b.r)**2){hitPlayer(p,b.dmg,b.by);b.life=0;break}}gkShots=gkShots.filter(b=>b.life>0);
  for(const e of enemies){if(e.dead||!e.rb)continue;e.bt-=dt;e.stealCd-=dt;const S=1+.4*(e.reg||1);
    if(e.rb==='slag'&&e.bt<=0){e.bt=2.6;fires.push({x:e.x,y:e.y,r:30,life:3.5,arm:.4,dmg:5*S})}
    if(e.rb==='crab'&&e.stealCd<=0)for(const p of players){if(p.dead>0||p.carry<=0||Math.hypot(p.x-e.x,p.y-e.y)>e.r+p.r+4)continue;
      const n=Math.min(p.carry,2+(e.reg|0));p.carry-=n;e.loot+=n;e.stealCd=1.2;fxText(p.x,p.y-40,`-${n} STOLEN`,'#c08048',16);snd(p,300,.08,'square',.03);break}}}
const _he10=hitEnemy;hitEnemy=function(e,dmg,by,src,crit){if(e.dead)return _he10(e,dmg,by,src,crit);_he10(e,dmg,by,src,crit);if(!e.dead)return;
  if(e.rb==='crab'&&e.loot>0){_ds10(e.x,e.y,e.loot,1);e.loot=0}
  if(e.rb==='wisp')shocks.push({x:e.x,y:e.y,r:70,t:.6,dmg:12*(1+.4*(e.reg||1))});
  if(e.gk)onGK(e,by);
  if(e.gob&&mode!=='guest'){const r=WEV?WEV.r:0;_ds10(e.x,e.y,40*(1+r),1.4);dropItem(e.x,e.y,RW7.elite,6);bannerTo(by&&by.isP?by:null,'GOBLIN CAUGHT','Pick up the loot',2);fan(by&&by.isP?by:null,659);WEV=null}};
const _hc10=hitCrate;hitCrate=function(c,dmg,by){const was=c.dead>0,r=regAt(c.x,c.y);crMul=1+.6*Math.min(r,curReg());_hc10(c,dmg,by);crMul=0;if(was||c.dead<=0||!c.chest||VLT)return;
  if(c.camp!=null){const C=CAMPS[c.camp];C.st=3;C.t=150;save.regStats.camps++;dropItem(c.x,c.y,shiftW(RW7.crate[3],1),4+3*C.r);_ds10(c.x,c.y,20*(1+C.r),1.2);fan(by&&by.isP?by:null,587)}
  else if(c.evc){dropItem(c.x,c.y,RW7.elite,6+3*r);_ds10(c.x,c.y,30*(1+r),1.4);dropOrb(c.x,c.y);fan(by&&by.isP?by:null,659)}};
const _uen10=updateEnemies;updateEnemies=function(dt){const prev=new Map();if(!VLT)for(const e of enemies)if(e.gob)prev.set(e,[e.x,e.y]);_uen10(dt);if(VLT)return;
  const fr=FR();for(const e of enemies){if(e.dead)continue;
    if(e.gob){const pp=prev.get(e);if(pp){let fx=0,fy=0;for(const p of players){if(p.dead>0)continue;const d=Math.hypot(e.x-p.x,e.y-p.y)||1;if(d<700){fx+=(e.x-p.x)/d;fy+=(e.y-p.y)/d}}
        const dh=Math.hypot(pp[0]-HUB.x,pp[1]-HUB.y);if(dh>fr-260){fx+=(HUB.x-pp[0])/dh*1.5;fy+=(HUB.y-pp[1])/dh*1.5}const m=Math.hypot(fx,fy)||1;
        e.x=pp[0]+fx/m*e.spd*dt;e.y=pp[1]+fy/m*e.spd*dt;e.vx=fx/m*e.spd;e.vy=fy/m*e.spd}}
    if(e.gk)gkTick(e,dt);
    const d=Math.hypot(e.x-HUB.x,e.y-HUB.y);if(d>fr-e.r&&!(typeof pocketHold==='function'&&pocketHold(e))){e.x=HUB.x+(e.x-HUB.x)/d*(fr-e.r);e.y=HUB.y+(e.y-HUB.y)/d*(fr-e.r)}}};
const _upl10=updatePlayer;updatePlayer=function(p,dt){_upl10(p,dt);if(VLT||p.dead>0)return;const fr=FR(),d=Math.hypot(p.x-HUB.x,p.y-HUB.y);
  if(d>fr-p.r&&!(typeof pocketHold==='function'&&pocketHold(p))){p.x=HUB.x+(p.x-HUB.x)/d*(fr-p.r);p.y=HUB.y+(p.y-HUB.y)/d*(fr-p.r);if(!(p.wallT>0)&&curReg()<3){p.wallT=4;feedTo(p,`Locked. Beat ${REG[curReg()+1].gk[0]} at the gate to go further.`,'#ff6a3d')}}
  p.wallT=(p.wallT||0)-dt;const r=regAt(p.x,p.y);if(p.lastReg!=null&&r!==p.lastReg&&r>0&&!p.remote)bannerTo(p,REG[r].n.toUpperCase(),`Monsters ×${RSC[r].hp.toFixed(1)} tougher · scrap ×${RSC[r].sc.toFixed(1)} · gear +${4*r} iLvl`,2.2);p.lastReg=r};
const _uw10=updateWorld;updateWorld=function(dt){_uw10(dt);for(let i=crates.length-1;i>=0;i--){const c=crates[i];if((c.camp!=null||c.evc)&&c.dead>0)crates.splice(i,1)}
  if(VLT||ftueOn())return;gateTick(dt);campTick(dt);shrineTick(dt);evTick(dt);hazTick(dt)};
const _up10=update;update=function(rdt){_up10(rdt);frAnim+=(FR()-frAnim)*Math.min(1,rdt*1.5)};
const _sw10=setupWorld;setupWorld=function(m,pl){for(let i=crates.length-1;i>=0;i--)if(crates[i].camp!=null||crates[i].evc)crates.splice(i,1);
  _sw10(m,pl);WEV=null;evT=45;fires=[];shocks=[];gkShots=[];for(const c of CAMPS){c.st=0;c.t=0}for(const s of SHRINES)s.cd=0;for(const g of GATES)g.prog=0;ensureRegion();frAnim=FR()};
const _ev10=enterVault;enterVault=function(p,o){gkShots=[];fires=[];shocks=[];_ev10(p,o)};

/* ---------- network: guests see the frontier, gates, camps, events ---------- */
const _bs10=buildSnap;buildSnap=function(c){const s=_bs10(c);if(!s)return s;const P=players.find(q=>q.id===c.pid),near=(o,r=1300)=>P&&Math.abs(o.x-P.x)<r&&Math.abs(o.y-P.y)<r;
  s.RG=curReg();s.WE=WEV?[EVK.indexOf(WEV.k),Math.round(WEV.x),Math.round(WEV.y),Math.max(0,Math.round(WEV.t)),WEV.ph>0?1:0]:null;
  s.GS=gkShots.filter(b=>near(b)).map(b=>[Math.round(b.x),Math.round(b.y),b.r]);s.FI=fires.filter(f=>near(f)).map(f=>[Math.round(f.x),Math.round(f.y),f.r]);
  s.CP=CAMPS.map(c=>c.st);s.SH=SHRINES.map(x=>x.cd>0?1:0);s.GP=GATES.map(g=>r2(g.prog));
  s.CH=crates.filter(cr=>(cr.camp!=null||cr.evc)&&cr.dead<=0).map(cr=>[Math.round(cr.x),Math.round(cr.y),r2(cr.hp/cr.max)]);return s};
const _as10=applySnap;applySnap=function(s){_as10(s);if(mode!=='guest')return;G.reg=clamp(s.RG|0,0,3);
  G.wev=Array.isArray(s.WE)?{k:EVK[s.WE[0]]||'drop',x:s.WE[1],y:s.WE[2],t:s.WE[3],ph:s.WE[4]}:null;
  G.gks=Array.isArray(s.GS)?s.GS.slice(0,80):[];G.fires=Array.isArray(s.FI)?s.FI.slice(0,40):[];G.chests=Array.isArray(s.CH)?s.CH.slice(0,8):[];
  if(Array.isArray(s.CP))s.CP.forEach((v,i)=>{if(CAMPS[i])CAMPS[i].st=v|0});if(Array.isArray(s.SH))s.SH.forEach((v,i)=>{if(SHRINES[i])SHRINES[i].cd=v?1:0});
  if(Array.isArray(s.GP))s.GP.forEach((v,i)=>{if(GATES[i])GATES[i].prog=+v||0})};
const _gu10=guestUpdate;guestUpdate=function(dt){_gu10(dt);frAnim+=(FR()-frAnim)*Math.min(1,dt*1.5)};

/* ---------- render ---------- */
mmRad=function(){return VLT?WORLD/2:Math.min(WORLD/2,frAnim+160)};
zoneLabel=function(p){const r=regAt(p.x,p.y);if(!r){const tz=tierAt(p.x,p.y);return `ZONE ${tz} · ×${MULT[tz]} scrap`}return `${REG[r].n.toUpperCase()} · ×${(3*RSC[r].sc).toFixed(1)}`};
function ringPath(r0,r1){ctx.beginPath();ctx.arc(HUB.x,HUB.y,r1,0,TAU);ctx.arc(HUB.x,HUB.y,r0,0,TAU,true)}
drawGroundX=function(){for(let r=1;r<4;r++){ctx.fillStyle=REG[r].gr;ringPath(REG[r-1].out,REG[r].out);ctx.fill()}
  const fr=frAnim;ctx.fillStyle='rgba(8,2,1,.6)';ctx.beginPath();ctx.rect(-2000,-2000,WORLD+4000,WORLD+4000);ctx.arc(HUB.x,HUB.y,fr,0,TAU,true);ctx.fill()};
function drawGate(g){const R=curReg();if(g.r>R)return;const N=REG[g.r+1].gk,col=REG[g.r+1].acc,lock=g.r===R,pu=.5+Math.sin(time*3)*.5;ctx.save();ctx.translate(g.x,g.y);
  ctx.globalAlpha=.18+.12*pu;ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,120,0,TAU);ctx.fill();ctx.globalAlpha=1;ctx.rotate(g.a+Math.PI/2);
  ctx.fillStyle='#170804';ctx.strokeStyle=col;ctx.lineWidth=4;for(const s of[-1,1]){ctx.fillRect(s*70-14,-30,28,60);ctx.strokeRect(s*70-14,-30,28,60)}
  ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,0,70,Math.PI,TAU);ctx.stroke();ctx.rotate(-(g.a+Math.PI/2));
  if(g.prog>0){ctx.strokeStyle='#f5c34d';ctx.lineWidth=10;ctx.beginPath();ctx.arc(0,0,128,-Math.PI/2,-Math.PI/2+TAU*g.prog/GATE_HOLD);ctx.stroke()}
  ctx.textAlign='center';ctx.font=F(800,18);txt(lock?`GATE · ${N[0].toUpperCase()}`:`${N[0].toUpperCase()} · REMATCH`,0,-140,col);
  ctx.font=F(600,14);txt(g.cd?`back in ${Math.floor(g.cd/60)}:${String(g.cd%60).padStart(2,'0')}`:lock?'stand here to challenge':'stand here for a rematch',0,-120,'#f6e7d8');ctx.restore()}
function drawCamp(c){if(c.r>curReg())return;const col=REG[c.r].acc,act=c.st===1;ctx.save();ctx.translate(c.x,c.y);
  ctx.globalAlpha=c.st===3?.18:.32;ctx.strokeStyle=act?'#ff6a3d':col;ctx.lineWidth=3;ctx.setLineDash([12,10]);ctx.beginPath();ctx.arc(0,0,c.R,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=c.st===3?.45:1;
  for(const [dx,dy,s] of[[-50,-20,1],[40,-34,.8],[10,40,.9]]){ctx.fillStyle='#3c0d03';ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(dx-26*s,dy+18*s);ctx.lineTo(dx,dy-24*s);ctx.lineTo(dx+26*s,dy+18*s);ctx.closePath();ctx.fill();ctx.stroke()}
  ctx.globalAlpha=1;ctx.textAlign='center';ctx.font=F(800,15);txt(c.st===3?'CLEARED':act?'CAMP · FIGHT':'RAIDER CAMP',0,-c.R-10,act?'#ff6a3d':col);ctx.restore()}
function drawShrine(s){if(s.r>curReg())return;const B=BUFFS[s.k],ready=!(s.cd>0),pu=.5+Math.sin(time*4+s.x)*.5;ctx.save();ctx.translate(s.x,s.y);
  if(ready){ctx.globalAlpha=.15+.15*pu;ctx.fillStyle=B[2];ctx.beginPath();ctx.arc(0,0,60,0,TAU);ctx.fill();ctx.globalAlpha=1}
  ctx.rotate(Math.PI/4);ctx.fillStyle=ready?B[2]:'#3c0d03';ctx.strokeStyle='#170804';ctx.lineWidth=4;ctx.fillRect(-16,-16,32,32);ctx.strokeRect(-16,-16,32,32);ctx.rotate(-Math.PI/4);
  ctx.textAlign='center';ctx.font=F(800,14);txt(ready?`${B[0]} SHRINE`:'recharging',0,-34,ready?B[2]:'rgba(246,231,216,.5)');ctx.restore()}
drawWorldX=function(vis){const fr=frAnim;if(!VLT){ctx.save();ctx.lineWidth=10;ctx.strokeStyle=curReg()>=3?'rgba(143,214,255,.35)':'rgba(255,90,60,.55)';ctx.setLineDash([30,18]);ctx.lineDashOffset=time*20;
    ctx.beginPath();ctx.arc(HUB.x,HUB.y,fr,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.lineWidth=3;ctx.strokeStyle='rgba(246,231,216,.12)';
    for(let r=0;r<3;r++)if(REG[r].out<fr-5){ctx.beginPath();ctx.arc(HUB.x,HUB.y,REG[r].out,0,TAU);ctx.stroke()}ctx.restore()}
  const near=o=>vis({x:o.x,y:o.y})||Math.abs(o.x-(players[0]||{x:0}).x)<900;
  for(const c of CAMPS)if(vis({x:c.x-c.R,y:c.y})||vis({x:c.x+c.R,y:c.y})||vis(c))drawCamp(c);
  for(const s of SHRINES)if(vis(s))drawShrine(s);for(const g of GATES)if(vis({x:g.x,y:g.y-140})||vis(g))drawGate(g);
  const FL=mode==='guest'?(G.fires||[]).map(a=>({x:a[0],y:a[1],r:a[2]})):fires;
  for(const f of FL){if(!vis(f))continue;ctx.fillStyle=`rgba(255,106,61,${.22+.1*Math.sin(time*9+f.x)})`;ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,TAU);ctx.fill()}
  const E=mode==='guest'?G.wev:WEV;if(E){const N=EVN[E.k];
    if(E.k==='storm'){ctx.fillStyle='rgba(237,155,73,.12)';ctx.strokeStyle='#ed9b49';ctx.lineWidth=4;ctx.setLineDash([14,10]);ctx.lineDashOffset=-time*30;ctx.beginPath();ctx.arc(E.x,E.y,240,0,TAU);ctx.fill();ctx.stroke();ctx.setLineDash([])}
    if(E.k==='drop'&&E.ph>0){const g=ctx.createLinearGradient(E.x,E.y-600,E.x,E.y);g.addColorStop(0,'rgba(255,243,196,0)');g.addColorStop(1,'rgba(255,243,196,.5)');ctx.fillStyle=g;ctx.fillRect(E.x-22,E.y-600,44,600);
      ctx.strokeStyle='#fff3c4';ctx.lineWidth=4;ctx.beginPath();ctx.arc(E.x,E.y,40+20*Math.sin(time*8),0,TAU);ctx.stroke()}}
  if(mode==='guest')for(const c of G.chests||[]){const o={x:c[0],y:c[1]};if(vis(o))drawCrate({x:c[0],y:c[1],t:3,r:22,dead:0,flash:0,chest:true,hp:c[2],max:1})}};
function drawFrontierTop(p,W2,H2,Zv){if(VLT||p.cx==null)return;ctx.save();ctx.translate(W2/2,H2/2);ctx.scale(Zv,Zv);ctx.translate(-p.cx,-p.cy);
  const vis=o=>Math.abs(o.x-p.cx)<W2/Zv/2+80&&Math.abs(o.y-p.cy)<H2/Zv/2+80;
  const GL=mode==='guest'?(G.gks||[]).map(a=>({x:a[0],y:a[1],r:a[2]})):gkShots;
  for(const b of GL){if(!vis(b))continue;ctx.fillStyle=b.col||'#ffd27a';ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,TAU);ctx.fill();ctx.strokeStyle='#170804';ctx.lineWidth=2;ctx.stroke()}
  for(const e of enemies){if(e.dead||!vis(e))continue;if(e.gk){ctx.textAlign='center';ctx.font=F(800,18);txt(e.vname.toUpperCase(),e.x,e.y-e.r-30,'#f5c34d')}
    if(e.gob){ctx.textAlign='center';ctx.font=F(800,14);txt('LOOT GOBLIN',e.x,e.y-e.r-12,'#f5c34d');ctx.fillStyle='#ed9b49';ctx.beginPath();ctx.arc(e.x-8,e.y+6,8,0,TAU);ctx.fill()}
    if(e.rb==='crab'&&e.loot>0){ctx.textAlign='center';ctx.font=F(800,13);txt('◆'+e.loot,e.x,e.y-e.r-8,'#ed9b49')}}
  ctx.restore()}
function eventPill(p,W2,H2){const E=mode==='guest'?G.wev:WEV;const gk=mode==='guest'?enemies.find(e=>e.type==='boss'&&e.r>48):enemies.find(e=>!e.dead&&e.gk);
  const portrait=W2<H2,cx=W2/2;let y=portrait?H2-205:20;
  if(gk&&Math.hypot(gk.x-p.x,gk.y-p.y)<1400){const w=Math.min(W2-40,360),h=16,yy=portrait?y-42:y+40;ctx.textAlign='center';ctx.font=F(800,15);
    txt(gk.vname?gk.vname.toUpperCase():'GATEKEEPER',cx,yy-6,'#f5c34d');ctx.fillStyle='rgba(23,8,4,.8)';rr(cx-w/2-3,yy,w+6,h+6,8);ctx.fill();bar(cx-w/2,yy+3,w,h,gk.hp/(gk.max||1),'#f5c34d','#3c0d03')}
  if(!E)return;const N=EVN[E.k],t=E.k==='drop'&&E.ph>0?'incoming':`${Math.max(0,Math.ceil(E.t))}s`,s=`${N[0]} · ${t}`;ctx.font=F(800,15);const w=ctx.measureText(s).width+30;
  ctx.fillStyle='rgba(23,8,4,.8)';rr(cx-w/2,y,w,30,15);ctx.fill();ctx.strokeStyle=N[2];ctx.lineWidth=2;ctx.stroke();ctx.textAlign='center';txt(s,cx,y+21,N[2]);
  if(p.dead<=0)edgeArrow(p,W2,H2,clamp(Math.min(W2,H2)/700,.5,1.15),E.x,E.y,N[2],N[0].split(' ')[0],.95)}
drawMiniX=function(mx,my,ms,sc){if(VLT)return;for(let r=1;r<4;r++){if(REG[r-1].out>frAnim)break;ctx.fillStyle=REG[r].gr.replace(/,[.0-9]+\)$/,',.55)');
    ctx.beginPath();ctx.arc(MX(HUB.x),MY(HUB.y),Math.min(REG[r].out,frAnim)*sc,0,TAU);ctx.arc(MX(HUB.x),MY(HUB.y),REG[r-1].out*sc,0,TAU,true);ctx.fill()}
  ctx.strokeStyle='rgba(255,90,60,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(MX(HUB.x),MY(HUB.y),frAnim*sc,0,TAU);ctx.stroke()};
function miniTop(p,W2,H2){if(VLT)return;const split=views().length>1,ms=Math.round(clamp(W2*.28,90,150)),mx=W2-ms-14,my=split?(mode==='party'&&W>=H?52:14):14;
  ctx.save();ctx.beginPath();ctx.rect(mx,my,ms,ms);ctx.clip();const R=curReg();
  for(const g of GATES){if(g.r>R)continue;ctx.fillStyle=g.r===R?'#ff6a3d':REG[g.r+1].acc;ctx.fillRect(MX(g.x)-4,MY(g.y)-4,8,8)}
  for(const c of CAMPS){if(c.r>R)continue;ctx.fillStyle=c.st===3?'rgba(246,231,216,.3)':c.st===1?'#ff6a3d':REG[c.r].acc;ctx.beginPath();ctx.moveTo(MX(c.x),MY(c.y)-4);ctx.lineTo(MX(c.x)+4,MY(c.y)+3);ctx.lineTo(MX(c.x)-4,MY(c.y)+3);ctx.fill()}
  for(const s of SHRINES){if(s.r>R||s.cd>0)continue;ctx.fillStyle=BUFFS[s.k][2];ctx.fillRect(MX(s.x)-2.5,MY(s.y)-2.5,5,5)}
  const E=mode==='guest'?G.wev:WEV;if(E){ctx.fillStyle=EVN[E.k][2];ctx.globalAlpha=.6+Math.sin(time*6)*.4;ctx.beginPath();ctx.arc(MX(E.x),MY(E.y),5,0,TAU);ctx.fill();ctx.globalAlpha=1}
  ctx.restore();const lg=GATES.find(g=>g.r===R);if(lg&&p.dead<=0&&!inHub(p))edgeArrow(p,W2,H2,clamp(Math.min(W2,H2)/700,.5,1.15),lg.x,lg.y,'#ff6a3d','GATE',Math.hypot(p.x-lg.x,p.y-lg.y)<1400?.9:.35)}
const _dh10=drawHud;drawHud=function(p,W2,H2,Zv,v){drawFrontierTop(p,W2,H2,Zv);_dh10(p,W2,H2,Zv,v);if(VLT)return;miniTop(p,W2,H2);if(p.dead<=0)eventPill(p,W2,H2);
  if(p.buff&&p.dead<=0){const B=BUFFS[p.buff.k],x=views().length>1?10:14,y=(views().length>1?10:14)+160;ctx.textAlign='left';ctx.font=F(800,14);txt(`${B[0]} · ${Math.ceil(p.buff.t)}s`,x+4,y+10,B[2])}};

if(window.__game)Object.defineProperties(window.__game,Object.getOwnPropertyDescriptors({update,REG,RSC,GATES,CAMPS,SHRINES,regAt,curReg,FR,spawnGK,startEvent,ensureRegion,
  get WEV(){return WEV},set WEV(v){WEV=v},get gkShots(){return gkShots},get fires(){return fires},get evT(){return evT},set evT(v){evT=v},get crates(){return crates},get frAnim(){return frAnim},
  makeEnemy,hitEnemy,hitCrate,dropItem,updateEnemies,updatePlayer,updateWorld,setupWorld,recalc,drawHud,buildSnap,applySnap}));
