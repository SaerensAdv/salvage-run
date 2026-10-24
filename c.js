/* ================= COMBAT ================= */
const greedMul=p=>1+.25*((p&&p.run.perks.greed)||0);
const cloaked=p=>p.char==='ghost'&&p.abT>0;
const targetable=p=>p.dead<=0&&!inHub(p)&&!cloaked(p)&&!p.picking;
const pvp=()=>mode!=='solo'&&!raid&&!(typeof VLT!=='undefined'&&VLT&&VLT.coop);
function dropScrap(x,y,total,spread=1){total=Math.floor(total);if(total<=0)return;const n=Math.min(14,Math.max(1,Math.ceil(total/3)));let left=total;
  for(let i=0;i<n;i++){const v=i===n-1?left:Math.max(1,Math.floor(total/n));left-=v;if(v<=0)continue;const a=rand(0,TAU),s=rand(60,220)*spread;
    pickups.push({id:++pid2,k:'s',x,y,v,vx:Math.cos(a)*s,vy:Math.sin(a)*s,age:0})}}
function dropOrb(x,y){const a=rand(0,TAU);pickups.push({id:++pid2,k:'o',x,y,v:0,vx:Math.cos(a)*120,vy:Math.sin(a)*120,age:0})}
function nearestTarget(src,range,o){let best=null,bd=range*range;
  for(const e of enemies){if(e.dead)continue;const d=(e.x-src.x)**2+(e.y-src.y)**2;if(d<bd){bd=d;best=e}}
  if(o.rivals)for(const r of rivals){if(r===src||r.dead>0||inHub(r))continue;const d=((r.x-src.x)**2+(r.y-src.y)**2)*1.1;if(d<bd){bd=d;best=r}}
  if(o.players)for(const p of players){if(p===src||!targetable(p))continue;const d=((p.x-src.x)**2+(p.y-src.y)**2)*1.1;if(d<bd){bd=d;best=p}}
  if(o.crates)for(const c of crates){if(c.dead>0)continue;const d=((c.x-src.x)**2+(c.y-src.y)**2)*1.8;if(d<bd){bd=d;best=c}}
  return best}
function volley(p,t){const k=p.run.perks,n=1+(k.twin||0),base=Math.atan2(t.y-p.y,t.x-p.x),crit=Math.random()<p.crit;
  let dmg=p.dmg*(crit?2.5:1);if(k.last&&p.hp<p.maxHp*.35)dmg*=1.6;
  for(let i=0;i<n;i++){const a=base+(i-(n-1)/2)*.14+rand(-.03,.03);
    bullets.push({x:p.x+Math.cos(a)*p.r,y:p.y+Math.sin(a)*p.r,vx:Math.cos(a)*700,vy:Math.sin(a)*700,dmg,owner:p,col:crit?'#f5c34d':p.col,
      life:p.range/700+.06,pierce:k.pierce||0,bounce:k.bounce||0,hit:new Set(),crit,w:crit?6:4})}}
function rivalFire(r,t){const a=Math.atan2(t.y-r.y,t.x-r.x)+rand(-.12,.12);r.face=a;
  bullets.push({x:r.x+Math.cos(a)*r.r,y:r.y+Math.sin(a)*r.r,vx:Math.cos(a)*600,vy:Math.sin(a)*600,dmg:r.dmg,owner:r,col:r.col,life:.45,hit:null,w:4})}
function hitEnemy(e,dmg,by,src,crit){if(e.dead)return;e.hp-=dmg;e.flash=.08;const isP=by&&by.isP;
  if(isP)fxText(e.x+rand(-6,6),e.y-e.r-6,Math.round(dmg)+(crit?'!':''),crit?'#f5c34d':'#f6e7d8',crit?21:15);
  if(e.hp>0)return;e.dead=true;const boss=e.type==='boss',coll=e.type==='collector';
  fxBurst(e.x,e.y,coll?'#f6e7d8':e.col,boss||coll?60:e.type==='brute'?22:12,boss?420:e.type==='brute'?260:180);
  if(isP){const p=by;dropScrap(e.x,e.y,e.scrap*greedMul(p)*(e.elite?3:1),boss?1.6:.7);if(e.elite&&Math.random()<.25)dropOrb(e.x,e.y);gainXp(p,e.xp*(e.elite?3:1));
    if(p.run.perks.leech)p.hp=Math.min(p.maxHp,p.hp+p.run.perks.leech);p.kills++;
    if(creditsSave(p))save.stats.kills++;pev(p,'kill:'+e.type);if(!boss&&!coll)pev(p,'kill');if(src==='dash')pev(p,'dashkill');
    if(mode==='solo'&&save.ftue===1&&++p.ftueKills>=3)ftueNext();
    snd(p,boss?110:220+rand(0,40),boss?.4:.07,'square',boss?.06:.03,boss?.4:0);
    if(e.type==='brute'){shk(p,7);if(pausing())hitstop=Math.max(hitstop,.05)}else shk(p,3);
    if(coll){dropOrb(e.x,e.y);dropOrb(e.x,e.y);dropOrb(e.x,e.y);bannerTo(p,'YOU KILLED THE COLLECTOR','Nobody does that. Heat reset.');p.trip.t=0;fan(p,330);shk(p,24)}
    else if(boss){dropOrb(e.x,e.y);dropOrb(e.x,e.y);if(creditsSave(p))save.stats.bosses++;pev(p,'boss');shk(p,24);vb(p,[60,30,60,30,120]);
      bannerTo(null,`${p.name.toUpperCase()} DOWNED THE GOLDEN BRUTE`,'Now get that scrap home');fan(p,392);if(pausing())hitstop=.3}}
  else if(by&&by.name){by.carry+=e.scrap;if(boss)feedTo(null,`${by.name} killed the Golden Brute and took ${e.scrap} scrap`,by.col)}
  else if(boss)dropScrap(e.x,e.y,e.scrap,1.6)}
function hitCrate(c,dmg,by){if(c.dead>0)return;c.hp-=dmg;c.flash=.08;c.dirty=true;if(c.hp>0)return;c.dead=60;fxBurst(c.x,c.y,'#a0643a',16,200);
  dropScrap(c.x,c.y,2*MULT[c.t]*greedMul(by),.8);if(Math.random()<.16)dropOrb(c.x,c.y);if(by&&by.isP){pev(by,'crate');gainXp(by,1);snd(by,180,.08,'triangle',.04)}}
function hitPlayer(p,dmg,by){if(p.dead>0||p.inv>0||inHub(p)||p.picking)return;
  if(by&&by.type)dmg*=(1+.2*(p.run.perks.greed||0))*(1+heat(p));if(p.run.perks.shield&&p.carry>=40)dmg*=.7;
  p.hp-=dmg;p.hurt=.35;p.inv=.3;p.trip.hit=true;shk(p,8);vb(p,25);snd(p,90,.12,'sawtooth',.05);
  fxText(p.x,p.y-30,'-'+Math.round(dmg),'#ff5a3c',17);if(by&&by.name&&!by.isP){by.aggro=Math.max(by.aggro,3);by.aggroP=p}
  if(beacon&&Math.hypot(p.x-beacon.x,p.y-beacon.y)<beacon.r)beacon.prog=Math.max(0,beacon.prog-.8);
  if(p.hp<=0)killPlayer(p,by)}
function hitRival(r,dmg,by){if(r.dead>0||inHub(r))return;const isP=by&&by.isP;if(isP)dmg*=1+.3*(by.run.perks.bounty||0);r.hp-=dmg;r.flash=.08;
  if(isP){r.aggro=5;r.aggroP=by;fxText(r.x+rand(-6,6),r.y-30,Math.round(dmg),'#f6e7d8',15)}else if(by&&by.name)r.aggro=Math.max(r.aggro,2);
  if(r.hp>0)return;r.dead=30;r.chan=0;fxBurst(r.x,r.y,r.col,30,300);let loot=Math.floor(r.carry)+3+r.lvl;
  if(isP){const p=by;loot=Math.round(loot*(1+.75*(p.run.perks.bounty||0)));
    if(r.revengeOn===p.id){loot*=2;pev(p,'revenge');bannerTo(p,'REVENGE',`${r.name} pays double · ${loot} scrap`,3);fan(p,330)}
    else feedTo(p,`You wrecked ${r.name} · ${loot} scrap on the floor`,'#f5c34d');
    dropScrap(r.x,r.y,loot,1.1);gainXp(p,10*tierAt(r.x,r.y));if(creditsSave(p))save.stats.raiders++;pev(p,'raider');
    shk(p,12);vb(p,[30,30,60]);snd(p,330,.1,'square',.05);if(pausing())hitstop=.12}
  else if(by&&by.name){by.carry+=loot}else dropScrap(r.x,r.y,loot,1.1);
  r.carry=0;r.revengeOn=-1}
function killPlayer(p,by){const n=p.carry;dropScrap(p.x,p.y,n,1.2);p.carry=0;p.dead=3;p.dashT=0;p.abT=0;shk(p,20);vb(p,[60,40,140]);snd(p,70,.5,'sawtooth',.06,.5);
  fxBurst(p.x,p.y,p.col,36,320);const who=by&&by.name?by.name:by&&by.type?(by.type==='boss'?'The Golden Brute':by.type==='collector'?'The Collector':'A '+by.type):'Something';
  p.deathInfo={lost:n,dist:Math.round(Math.hypot(p.x-HUB.x,p.y-HUB.y)/10),lvl:p.run.lvl,perks:Object.values(p.run.perks).reduce((a,b)=>a+b,0),who,x:Math.round(p.x),y:Math.round(p.y)};
  if(p.remote)fx(['d',p.id,p.deathInfo]);
  for(const r of rivals)if(r.revengeOn===p.id)r.revengeOn=-1;
  if(by&&by.name&&!by.isP){by.revengeOn=p.id;by.aggro=0}
  if(by&&by.isP){feedTo(null,`${by.name} wrecked ${p.name} · ${n} scrap on the floor`,by.col);by.kills++}
  else feedTo(p,`${who} wrecked you · ${n} scrap dropped`,'#ff6a3d');
  if(creditsSave(p))save.stats.deaths++;newRun(p);p.trip={z3:false,hit:false,t:0};p.haul=0;persist()}
function ability(p){if(p.dead>0||p.abCd>0||p.picking||inHub(p))return;p.abCd=p.abCdMax;
  if(p.char==='warden'){p.abT=2.5;snd(p,140,.4,'sine',.06,2.5);fxRing(p.x,p.y,80,'#8fd6ff',.3);return}
  if(p.char==='ghost'){p.abT=3;snd(p,900,.3,'sine',.04,.3);fxBurst(p.x,p.y,'#c9bfff',20,160);for(const r of rivals)if(r.aggroP===p){r.aggro=0;r.aggroP=null}return}
  p.dashT=.18;p.dashX=p.dx;p.dashY=p.dy;p.inv=Math.max(p.inv,.25);p.dashHit=new Set();snd(p,260,.12,'sawtooth',.035,2.2);vb(p,12)}
function nova(p){const st=p.run.perks.nova,R=110+30*(st-1),d=p.dmg*2*(1+.3*(st-1));fxRing(p.x,p.y,R,'#f5c34d',.35);snd(p,160,.18,'sine',.06,2);
  for(const e of enemies)if(!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<R+e.r)hitEnemy(e,d,p);
  for(const r of rivals)if(r.dead<=0&&Math.hypot(r.x-p.x,r.y-p.y)<R+r.r)hitRival(r,d,p);
  if(pvp())for(const q of players)if(q!==p&&targetable(q)&&Math.hypot(q.x-p.x,q.y-p.y)<R+q.r)hitPlayer(q,d,p);
  for(const c of crates)if(c.dead<=0&&Math.hypot(c.x-p.x,c.y-p.y)<R+c.r)hitCrate(c,d,p)}
function sawPos(p,n){n=n==null?(p.run.perks.saw||0):n;const out=[];for(let i=0;i<n;i++){const a=time*3.2+i/n*TAU;out.push([p.x+Math.cos(a)*62,p.y+Math.sin(a)*62])}return out}
function finishBank(p,h,viaBeacon){fxText(p.x,p.y-44,`+${h} BANKED`,'#f5c34d',26);vb(p,30);p.score+=h;
  if(creditsSave(p)){if(h>save.best&&mode!=='party'){if(save.best>0){bannerTo(p,'NEW BEST HAUL',`${h} scrap in one trip`,3);fan(p,587)}save.best=h}}
  else if(p.remote)netSend(p,{t:'bank',h});
  pev(p,'haul',h);pev(p,'bankTotal',h);if(p.trip.z3)pev(p,'deepbank');if(!p.trip.hit)pev(p,'nohit',h);if(viaBeacon)pev(p,'beacon');
  if(mode==='solo'&&save.ftue===3){save.bank+=20;save.total+=20;pushFeedLocal('Starter bonus +20. Now spend it.','#f5c34d');ftueNext()}
  p.trip={z3:false,hit:false,t:0};persist();refreshShop()}

/* ================= SPAWNING ================= */
function makeEnemy(type,x,y,t,p){const b=ET[type],tl=p?Object.values(p.lv).reduce((a,c)=>a+c,0):avgLv(),rl=p?p.run.lvl:1,
  pw=(1+.03*tl)*(1+.14*(rl-1)),m=type==='boss'?(1+.15*save.rank)*(1+.12*tl)*(1+.25*(players.length-1)):type==='collector'?(1+.12*tl)*(1+.1*rl):[0,1,1.9,3.3][t]*pw,
  elite=(type==='crawler'||type==='dasher'||type==='brute')&&(rl>=8||t===3)&&Math.random()<.08,em=elite?3:1;
  return{id:++eid,type,x,y,r:b.r*(elite?1.25:1),hp:b.hp*m*em,max:b.hp*m*em,spd:b.spd*(1+(t-1)*.12),dmg:b.dmg*(1+(t-1)*.45)*(1+.06*(rl-1))*(elite?1.3:1),
    scrap:type==='boss'?b.scrap:b.scrap*MULT[t],xp:b.xp*[0,1,1.6,2.5][t],col:b.col,t,elite,hitCd:0,dash:0,dashCd:rand(1,3),dax:0,day:0,wx:x,wy:y,
    flash:0,vx:0,vy:0,dead:false,slamT:0,slamCd:2,sawCd:0,domeCd:0,tgtId:p?p.id:-1}}
function spawnEnemy(p){for(let i=0;i<10;i++){const a=rand(0,TAU),d=rand(520,900),x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d;
  if(x<30||y<30||x>WORLD-30||y>WORLD-30)continue;if(Math.hypot(x-HUB.x,y-HUB.y)<HUB.r+220)continue;
  if(players.some(q=>q!==p&&q.dead<=0&&Math.hypot(q.x-x,q.y-y)<420))continue;
  const t=tierAt(x,y),q=Math.random();
  const type=t===1?(q<.82?'crawler':'dasher'):t===2?(q<.5?'crawler':q<.86?'dasher':'brute'):(q<.28?'crawler':q<.64?'dasher':'brute');
  enemies.push(makeEnemy(type,x,y,t,p));return}}
function spawnBoss(){const a=rand(0,TAU),d=1500,x=clamp(HUB.x+Math.cos(a)*d,120,WORLD-120),y=clamp(HUB.y+Math.sin(a)*d,120,WORLD-120);
  enemies.push(makeEnemy('boss',x,y,3,null));bannerTo(null,'A GOLDEN BRUTE WOKE UP','Zone 3 · 90 scrap + 2 tech · follow the crown',3);snd(null,80,.6,'sawtooth',.05,.6)}
function spawnBeacon(){const a=rand(0,TAU),d=rand(Z2+100,Z3+250);
  beacon={x:clamp(HUB.x+Math.cos(a)*d,120,WORLD-120),y:clamp(HUB.y+Math.sin(a)*d,120,WORLD-120),r:72,life:45,prog:0};
  feedTo(null,'Extraction beacon live · bank there for +30% · 45 s','#fff3c4');snd(null,1200,.2,'sine',.04,.5)}
