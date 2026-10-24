/* ================= UPDATE (authoritative: solo, party, host) ================= */
const keys={};
function readInput(p){let mx=0,my=0;
  if(p.remote){mx=p.input.mx||0;my=p.input.my||0;if(p.input.ab!==p.abSeen){p.abSeen=p.input.ab;ability(p)}}
  else{mx=p.joy.dx;my=p.joy.dy;
    const wasd=p.ctrl!=='p2',arrows=p.ctrl!=='p1';
    if(wasd){if(keys.w)my-=1;if(keys.s)my+=1;if(keys.a)mx-=1;if(keys.d)mx+=1}
    if(arrows){if(keys.arrowup)my-=1;if(keys.arrowdown)my+=1;if(keys.arrowleft)mx-=1;if(keys.arrowright)mx+=1}}
  let m=Math.hypot(mx,my);if(m>1){mx/=m;my/=m;m=1}return[mx,my,m]}
function update(rdt){let dt=rdt;if(hitstop>0){hitstop-=rdt;dt=rdt*.15}
  time+=dt;dayT-=rdt;if(dayT<=0){dayT=10;ensureDaily()}
  for(const p of players)updatePlayer(p,dt);
  updateRivals(dt);updateEnemies(dt);updateBullets(dt);updatePickups(dt);updateWorld(dt);updateFx(rdt);
  if(mode==='party'){matchT-=dt;if(matchT<=0&&state==='play')endMatch()}
  saveT-=rdt;if(saveT<=0){saveT=3;if(dirty)persist()}}

function updatePlayer(p,dt){
  p.flash-=dt;p.sawCd-=dt;
  if(p.dead>0){p.dead-=dt;if(p.dead<=0)respawn(p);return}
  if(p.pickDelay>0){p.pickDelay-=dt;if(p.pickDelay<=0)tryPick(p)}else if(!p.picking&&p.pend.length)tryPick(p);
  if(p.picking){p.picking.t-=dt;if(p.picking.t<=0)applyPick(p,p.picking.opts[0]);p.inv=Math.max(p.inv,.1);return}
  const[mx,my,m]=readInput(p);if(m>.1){p.dx=mx/m;p.dy=my/m}
  const k=p.run.perks;p.abT-=dt;const cl=cloaked(p);
  if(p.dashT>0){p.dashT-=dt;const s=p.spd*3.4;p.x+=p.dashX*s*dt;p.y+=p.dashY*s*dt;
    parts.push({x:p.x,y:p.y,vx:0,vy:0,life:.25,col:p.col,s:9});
    const dd=p.dmg*2.5*(1+.5*(k.thruster||0));
    for(const e of enemies){if(e.dead||p.dashHit.has(e))continue;if((e.x-p.x)**2+(e.y-p.y)**2<(e.r+p.r+6)**2){p.dashHit.add(e);hitEnemy(e,dd,p,'dash')}}
    for(const r of rivals){if(r.dead>0||p.dashHit.has(r))continue;if((r.x-p.x)**2+(r.y-p.y)**2<(r.r+p.r+6)**2){p.dashHit.add(r);hitRival(r,dd,p)}}
    if(pvp())for(const q of players){if(q===p||p.dashHit.has(q)||!targetable(q))continue;if((q.x-p.x)**2+(q.y-p.y)**2<(q.r+p.r+6)**2){p.dashHit.add(q);hitPlayer(q,dd,p)}}
    for(const c of crates){if(c.dead>0||p.dashHit.has(c))continue;if((c.x-p.x)**2+(c.y-p.y)**2<(c.r+p.r+6)**2){p.dashHit.add(c);hitCrate(c,dd,p)}}}
  else{const s=p.spd*(cl?1.35:1);p.x+=mx*s*dt;p.y+=my*s*dt}
  p.x=clamp(p.x,p.r,WORLD-p.r);p.y=clamp(p.y,p.r,WORLD-p.r);
  p.abCd-=dt;p.inv-=dt;p.hurt-=dt;
  if(mode==='solo'&&save.ftue===0){p.ftueMove+=m*p.spd*dt;if(p.ftueMove>260)ftueNext()}
  const ih=inHub(p);
  if(ih){p.hp=Math.min(p.maxHp,p.hp+70*dt);p.abT=0;
    if(p.carry>0){p.bankT-=dt;if(p.bankT<=0){p.bankT=.04;const v=Math.min(p.carry,Math.max(1,Math.ceil(p.carry/10)));p.carry-=v;p.haul+=v;
      if(creditsSave(p)&&mode!=='party'){save.bank+=v;save.total+=v}
      snd(p,520+Math.min(p.haul,80)*10,.05,'triangle',.03);fxBurst(p.x,p.y,'#f5c34d',3,140);if(p.carry<=0){finishBank(p,p.haul,false);p.haul=0}}}}
  else{
    if(p.char==='warden'&&p.abT>0){for(const e of enemies){if(e.dead)continue;const d=Math.hypot(e.x-p.x,e.y-p.y),R=78+e.r;
      if(d<R&&d>0&&e.type!=='boss'&&e.type!=='collector'){e.x=p.x+(e.x-p.x)/d*R;e.y=p.y+(e.y-p.y)/d*R}
      if(d<R+4){e.domeCd-=dt;if(e.domeCd<=0){e.domeCd=.4;hitEnemy(e,p.dmg*.8,p)}}}}
    if(!cl){p.cd-=dt;const t=nearestTarget(p,p.range,{rivals:true,players:pvp(),crates:true});
      if(t){p.face=Math.atan2(t.y-p.y,t.x-p.x);if(p.cd<=0){volley(p,t);p.cd=1/p.rate}}else p.face=Math.atan2(p.dy,p.dx)}
    else p.face=Math.atan2(p.dy,p.dx);
    if(k.nova){p.novaT-=dt;if(p.novaT<=0){p.novaT=3.5;nova(p)}}}
  if(k.saw){const sp=sawPos(p);
    for(const e of enemies){if(e.dead||e.sawCd>0)continue;for(const[sx,sy]of sp)if((e.x-sx)**2+(e.y-sy)**2<(e.r+11)**2){e.sawCd=.35;hitEnemy(e,p.dmg*.7,p);break}}
    if(!ih)for(const r of rivals){if(r.dead>0||r.sawCd>0)continue;for(const[sx,sy]of sp)if((r.x-sx)**2+(r.y-sy)**2<(r.r+11)**2){r.sawCd=.35;hitRival(r,p.dmg*.7,p);break}}
    if(!ih&&pvp())for(const q of players){if(q===p||q.sawCd>0||!targetable(q))continue;for(const[sx,sy]of sp)if((q.x-sx)**2+(q.y-sy)**2<(q.r+11)**2){q.sawCd=.35;hitPlayer(q,p.dmg*.7,p);break}}
    for(const c of crates){if(c.dead>0)continue;for(const[sx,sy]of sp)if((c.x-sx)**2+(c.y-sy)**2<(c.r+11)**2){hitCrate(c,p.dmg*.05,p);break}}}
  const tr=ih?0:tierAt(p.x,p.y);if(tr===3)p.trip.z3=true;
  if(!ih)p.trip.t+=dt*[0,.8,1.1,1.5][tr];
  if(!ih&&heat(p)>=.75&&!p.warm){p.warm=true;feedTo(p,'Heat 75%. The Collector is coming.','#ff6a3d');snd(p,70,.4,'sawtooth',.05,.7)}if(ih)p.warm=false;
  if(tr>p.lastTier&&tr>1)feedTo(p,tr===2?'Zone 2 · ×2 scrap · dashers out here':'Zone 3 · ×3 scrap · brutes. Don\'t get greedy.','#ed9b49');
  p.lastTier=tr||1;
  const g=!ih&&p.carry>=Math.max(30,p.cap*.7);if(g&&!p.glow)feedTo(p,'You\'re glowing. Raiders can smell your scrap.','#ff6a3d');p.glow=g;
  if(!ih&&p.hp<p.maxHp*.3){p.beatT-=dt;if(p.beatT<=0){p.beatT=.75;snd(p,55,.16,'sine',.09)}}
  p.comboT-=dt;if(p.comboT<=0)p.combo=0;p.fullT-=dt}

function updateRivals(dt){
  for(const r of rivals){r.flash-=dt;r.sawCd-=dt;
    if(r.dead>0){r.dead-=dt;if(r.dead<=0)spawnRival(r);continue}
    const rh=inHub(r);let near=null,dP=1e9;
    for(const p of players){if(!targetable(p))continue;const d=Math.hypot(r.x-p.x,r.y-p.y);if(d<dP){dP=d;near=p}}
    const anyNear=players.some(p=>Math.hypot(r.x-p.x,r.y-p.y)<1000);
    if(!anyNear&&r.goal!=='bank')r.carry+=dt*tierAt(r.x,r.y)*.2;
    if(r.carry>=r.greed||(r.hp<r.maxHp*.3&&r.carry>6))r.goal='bank';
    r.aggro-=dt;let target=null;const fOk=!(mode==='solo'&&save.ftue<4);
    if(fOk&&!rh){
      if(r.aggro>0&&r.aggroP&&targetable(r.aggroP)&&Math.hypot(r.x-r.aggroP.x,r.y-r.aggroP.y)<520)target=r.aggroP;
      else if(near){const p=near;
        if((r.revengeOn===p.id&&dP<520)||(r.goal!=='bank'&&dP<420&&p.carry>=10&&p.carry>r.carry*.6&&r.hp>r.maxHp*.45))target=p}
      if(!target&&r.goal!=='bank'&&r.hp>r.maxHp*.5)for(const p of players)if(p.glow&&targetable(p)&&Math.hypot(r.x-p.x,r.y-p.y)<1400){target=p;break}}
    if(!target&&!rh){const e=nearestTarget(r,r.goal==='bank'?r.range:460,{});if(e)target=e}
    if(!target&&!rh&&r.goal!=='bank')for(const o of rivals){if(o===r||o.dead>0||inHub(o))continue;if(Math.hypot(o.x-r.x,o.y-r.y)<240){target=o;break}}
    let gx=r.x,gy=r.y,sp=r.spd;
    if(r.goal==='bank'){gx=HUB.x;gy=HUB.y;
      if(beacon&&Math.hypot(beacon.x-r.x,beacon.y-r.y)<Math.hypot(HUB.x-r.x,HUB.y-r.y)){gx=beacon.x;gy=beacon.y;
        if(Math.hypot(beacon.x-r.x,beacon.y-r.y)<beacon.r){r.chan+=dt;sp=r.spd*.2;
          if(r.chan>=3){r.bank+=Math.floor(r.carry*1.3);save.raiders[r.name]=r.bank;feedTo(null,`${r.name} extracted at the beacon. It\'s gone.`,r.col);
            r.carry=0;r.chan=0;beacon=null;rivalStats(r);r.goal='farm';r.greed=rand(22,65)*(1+r.lvl*.2);pickWander(r)}}}
      if(rh){const c=Math.floor(r.carry);r.bank+=c;save.raiders[r.name]=r.bank;if(c>=15&&dP<900)feedTo(null,`${r.name} banked ${c}`,r.col);
        r.carry=0;rivalStats(r);r.hp=r.maxHp;r.goal='farm';r.greed=rand(22,65)*(1+r.lvl*.2);pickWander(r)}}
    else if(target){const d=Math.hypot(target.x-r.x,target.y-r.y),a=Math.atan2(target.y-r.y,target.x-r.x),side=Math.sin(time*1.3+r.name.length)>0?1:-1;
      if(d>200){gx=target.x;gy=target.y}else if(d<130){gx=r.x-Math.cos(a)*60;gy=r.y-Math.sin(a)*60}
      else{gx=r.x+Math.cos(a+Math.PI/2*side)*60;gy=r.y+Math.sin(a+Math.PI/2*side)*60;sp*=.7}}
    else{gx=r.tx;gy=r.ty;if(Math.hypot(r.tx-r.x,r.ty-r.y)<40)pickWander(r)}
    const ga=Math.atan2(gy-r.y,gx-r.x),gd=Math.hypot(gx-r.x,gy-r.y);
    if(gd>4){r.vx=Math.cos(ga)*sp;r.vy=Math.sin(ga)*sp;r.x=clamp(r.x+r.vx*dt,20,WORLD-20);r.y=clamp(r.y+r.vy*dt,20,WORLD-20);r.face=ga}
    r.cd-=dt;
    if(target&&!rh&&r.cd<=0&&Math.hypot(target.x-r.x,target.y-r.y)<r.range){rivalFire(r,target);r.cd=1/r.rate}}}

function updateEnemies(dt){
  for(const p of players){if(p.dead>0)continue;const want=10+6*tierAt(p.x,p.y)+(p.glow?4:0)+Math.round(heat(p)*10)+Math.min(24,p.run.lvl);
    let n=0;for(const e of enemies)if(Math.abs(e.x-p.x)<1000&&Math.abs(e.y-p.y)<1000)n++;
    if(n<want&&Math.random()<dt*6)spawnEnemy(p)}
  for(const e of enemies){if(e.dead)continue;e.flash-=dt;e.hitCd-=dt;e.dashCd-=dt;e.sawCd-=dt;e.slamCd-=dt;
    if(e.type==='collector'){const p=players.find(q=>q.id===e.tgtId);
      if(!p||p.dead>0||inHub(p)){e.dead=true;fxRing(e.x,e.y,120,'#f6e7d8',.5);continue}
      const a=Math.atan2(p.y-e.y,p.x-e.x),sp=p.spd*(cloaked(p)?.4:.92);e.vx=Math.cos(a)*sp;e.vy=Math.sin(a)*sp;e.x+=e.vx*dt;e.y+=e.vy*dt;
      if(e.hitCd<=0&&!p.picking&&Math.hypot(p.x-e.x,p.y-e.y)<e.r+p.r){e.hitCd=.8;hitPlayer(p,p.maxHp*.35,e)}continue}
    const boss=e.type==='boss',range=boss?700:450;let tgt=null,bd=range*range;
    for(const p of players){if(!targetable(p))continue;const d=(p.x-e.x)**2+(p.y-e.y)**2;if(d<bd){bd=d;tgt=p}}
    for(const r of rivals){if(r.dead>0||inHub(r))continue;const d=(r.x-e.x)**2+(r.y-e.y)**2;if(d<bd){bd=d;tgt=r}}
    let sp=e.spd,ax=0,ay=0;
    if(tgt){const a=Math.atan2(tgt.y-e.y,tgt.x-e.x);ax=Math.cos(a);ay=Math.sin(a);
      if(e.type==='dasher'){if(e.dash>0){e.dash-=dt;ax=e.dax;ay=e.day;sp*=3.4}else if(e.dashCd<=0&&bd<240*240){e.dash=.32;e.dashCd=rand(1.6,2.6);e.dax=ax;e.day=ay}}}
    else{const a=Math.atan2(e.wy-e.y,e.wx-e.x);ax=Math.cos(a);ay=Math.sin(a);sp*=.35;if(Math.hypot(e.wx-e.x,e.wy-e.y)<20){e.wx=e.x+rand(-200,200);e.wy=e.y+rand(-200,200)}}
    if(boss){if(e.slamT>0){e.slamT-=dt;sp=0;if(e.slamT<=0){fxRing(e.x,e.y,165,'#f5c34d',.4);shk(null,6);snd(null,60,.3,'sawtooth',.06,.5);
          for(const p of players)if(p.dead<=0&&Math.hypot(p.x-e.x,p.y-e.y)<165)hitPlayer(p,35,e);for(const r of rivals)if(r.dead<=0&&Math.hypot(r.x-e.x,r.y-e.y)<165)hitRival(r,35,null);e.slamCd=2.6}}
      else if(tgt&&e.slamCd<=0&&bd<150*150)e.slamT=.85}
    e.vx=ax*sp;e.vy=ay*sp;e.x+=e.vx*dt;e.y+=e.vy*dt;
    const hd=Math.hypot(e.x-HUB.x,e.y-HUB.y);if(hd<HUB.r+e.r){e.x=HUB.x+(e.x-HUB.x)/hd*(HUB.r+e.r);e.y=HUB.y+(e.y-HUB.y)/hd*(HUB.r+e.r)}
    e.x=clamp(e.x,e.r,WORLD-e.r);e.y=clamp(e.y,e.r,WORLD-e.r);
    if(tgt&&e.hitCd<=0&&Math.hypot(tgt.x-e.x,tgt.y-e.y)<e.r+tgt.r){e.hitCd=.7;if(tgt.isP)hitPlayer(tgt,e.dmg,e);else hitRival(tgt,e.dmg,null)}
    if(!boss&&!players.some(p=>p.dead<=0&&Math.hypot(p.x-e.x,p.y-e.y)<1500))e.dead=true}
  for(let i=0;i<enemies.length;i++){const a=enemies[i];if(a.dead)continue;for(let j=i+1;j<enemies.length;j++){const b=enemies[j];if(b.dead)continue;
    const dx=b.x-a.x,dy=b.y-a.y;if(Math.abs(dx)>60||Math.abs(dy)>60)continue;const d=Math.hypot(dx,dy),m=a.r+b.r;
    if(d>0&&d<m){const p=(m-d)/2/d,wa=a.type==='boss'?.1:1,wb=b.type==='boss'?.1:1;a.x-=dx*p*wa;a.y-=dy*p*wa;b.x+=dx*p*wb;b.y+=dy*p*wb}}}}

function domeBlocks(b){for(const p of players){if(p.char!=='warden'||p.abT<=0||p.dead>0||b.owner===p)continue;if((p.x-b.x)**2+(p.y-b.y)**2<78*78)return true}return false}
function updateBullets(dt){
  for(const b of bullets){b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.life<=0)continue;if(inHub(b)){b.life=0;continue}
    if(domeBlocks(b)){b.life=0;fxBurst(b.x,b.y,'#8fd6ff',4,90);continue}
    const own=b.owner;
    if(own&&own.isP){
      for(const e of enemies){if(e.dead||b.hit.has(e))continue;if((e.x-b.x)**2+(e.y-b.y)**2<(e.r+4)**2){hitEnemy(e,b.dmg,own,null,b.crit);b.hit.add(e);
        if(b.pierce>0)b.pierce--;
        else if(b.bounce>0){b.bounce--;let nt=null,nd=240*240;for(const o of enemies){if(o.dead||b.hit.has(o))continue;const d=(o.x-b.x)**2+(o.y-b.y)**2;if(d<nd){nd=d;nt=o}}
          if(nt){const a=Math.atan2(nt.y-b.y,nt.x-b.x);b.vx=Math.cos(a)*700;b.vy=Math.sin(a)*700;b.life=.4}else b.life=0}
        else b.life=0;break}}
      if(b.life<=0)continue;
      for(const r of rivals){if(r.dead>0||b.hit.has(r))continue;if((r.x-b.x)**2+(r.y-b.y)**2<(r.r+4)**2){hitRival(r,b.dmg,own);b.life=0;break}}
      if(b.life<=0)continue;
      if(pvp())for(const q of players){if(q===own||!targetable(q))continue;if((q.x-b.x)**2+(q.y-b.y)**2<(q.r+4)**2){hitPlayer(q,b.dmg,own);b.life=0;break}}
      if(b.life<=0)continue;
      for(const c of crates){if(c.dead>0)continue;if((c.x-b.x)**2+(c.y-b.y)**2<(c.r+4)**2){hitCrate(c,b.dmg,own);b.life=0;break}}}
    else{
      for(const e of enemies){if(e.dead)continue;if((e.x-b.x)**2+(e.y-b.y)**2<(e.r+4)**2){hitEnemy(e,b.dmg,own);b.life=0;break}}
      if(b.life<=0)continue;
      for(const r of rivals){if(r===own||r.dead>0)continue;if((r.x-b.x)**2+(r.y-b.y)**2<(r.r+4)**2){hitRival(r,b.dmg,own);b.life=0;break}}
      if(b.life<=0)continue;
      for(const q of players){if(q.dead>0||cloaked(q))continue;if((q.x-b.x)**2+(q.y-b.y)**2<(q.r+4)**2){hitPlayer(q,b.dmg,own);b.life=0;break}}}}}

function updatePickups(dt){
  for(const p of pickups){if(p.age>=999)continue;p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;const f=Math.max(0,1-dt*5);p.vx*=f;p.vy*=f;
    if(p.age>.25){let best=null,bd=1e9;for(const q of players){if(q.dead>0||q.picking)continue;const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<bd){bd=d;best=q}}
      if(best){const q=best,dx=q.x-p.x,dy=q.y-p.y,d=bd,room=p.k==='o'||q.carry<q.cap;
        if(d<q.r+8){if(p.k==='o'){p.age=999;q.pend.push(true);feedTo(q,'Salvaged tech. Pick a perk.','#f5c34d');tryPick(q);continue}
          if(room){q.carry+=p.v;p.age=999;q.combo++;q.comboT=.6;snd(q,600+Math.min(q.combo,20)*45,.05,'square',.025);
            if(mode==='solo'&&save.ftue===2&&q.carry>=8)ftueNext();continue}
          else if(q.fullT<=0){q.fullT=1.5;fxText(q.x,q.y-34,'BAG FULL · GO BANK','#ff6a3d',17);snd(q,120,.1,'square',.03)}}
        if(room&&d<q.mag&&d>.01){const s=(1-d/q.mag)*900+220;p.x+=dx/d*s*dt;p.y+=dy/d*s*dt}}}
    if(p.k==='s'&&p.age>.4)for(const r of rivals){if(r.dead>0)continue;if((r.x-p.x)**2+(r.y-p.y)**2<(r.r+10)**2){r.carry+=p.v;p.age=999;break}}}}

function updateWorld(dt){
  for(const c of crates){c.flash-=dt;if(c.dead>0){c.dead-=dt;if(c.dead<=0)placeCrate(c)}}
  if(ftueOn())return;
  beaconT-=dt;if(!beacon&&beaconT<=0){spawnBeacon();beaconT=80}
  if(beacon){beacon.life-=dt;const ins=players.filter(p=>p.dead<=0&&!p.picking&&p.carry>0&&Math.hypot(p.x-beacon.x,p.y-beacon.y)<beacon.r);
    if(ins.length){beacon.prog+=dt;if(Math.random()<dt*20)burst(beacon.x,beacon.y,'#fff3c4',1,120);
      if(beacon.prog>=3.5){for(const p of ins){const amt=Math.round(p.carry*1.3);if(creditsSave(p)&&mode!=='party'){save.bank+=amt;save.total+=amt}p.carry=0;fan(p,659);finishBank(p,amt,true)}
        fxRing(beacon.x,beacon.y,260,'#fff3c4',.6);beacon=null}}
    else beacon.prog=Math.max(0,beacon.prog-dt*.5);
    if(beacon&&beacon.life<=0){feedTo(null,'Beacon closed','rgba(246,231,216,.7)');beacon=null}}
  for(const p of players)if(p.dead<=0&&!inHub(p)&&!p.picking&&heat(p)>=1&&!enemies.some(e=>e.type==='collector'&&e.tgtId===p.id)){const a=rand(0,TAU);
    const e=makeEnemy('collector',clamp(p.x+Math.cos(a)*520,40,WORLD-40),clamp(p.y+Math.sin(a)*520,40,WORLD-40),3,p);e.tgtId=p.id;enemies.push(e);
    bannerTo(p,'THE COLLECTOR','It wants your scrap. Run home.',3);snd(p,50,.9,'sawtooth',.07,.5);vb(p,[100,50,100])}
  bossT-=dt;if(bossT<=0){if(!enemies.some(e=>e.type==='boss'))spawnBoss();bossT=160}}

function updateFxOnly(dt){
  for(const p of parts){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.92;p.vy*=.92}
  for(const t of texts){t.life-=dt;t.y-=40*dt}
  for(const f of feed)f.t-=dt;
  for(const r of rings){r.life-=dt;r.r+=(r.max-r.r)*Math.min(1,dt*14)}
  for(const k in banners){banners[k].t-=dt;if(banners[k].t<=0)delete banners[k]}
  for(const k in shakes)shakes[k]=Math.max(0,shakes[k]-dt*45);
  parts=parts.filter(p=>p.life>0);texts=texts.filter(t=>t.life>0);feed=feed.filter(f=>f.t>0);rings=rings.filter(r=>r.life>0);
  if(parts.length>600)parts.splice(0,parts.length-600);if(texts.length>120)texts.splice(0,texts.length-120)}
function updateFx(dt){
  for(const p of parts){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.92;p.vy*=.92}
  for(const t of texts){t.life-=dt;t.y-=40*dt}
  for(const f of feed)f.t-=dt;
  for(const r of rings){r.life-=dt;r.r+=(r.max-r.r)*Math.min(1,dt*14)}
  for(const k in banners){banners[k].t-=dt;if(banners[k].t<=0)delete banners[k]}
  for(const k in shakes)shakes[k]=Math.max(0,shakes[k]-dt*45);
  enemies=enemies.filter(e=>!e.dead);bullets=bullets.filter(b=>b.life>0);pickups=pickups.filter(p=>p.age<40);
  parts=parts.filter(p=>p.life>0);texts=texts.filter(t=>t.life>0);feed=feed.filter(f=>f.t>0);rings=rings.filter(r=>r.life>0);
  if(parts.length>600)parts.splice(0,parts.length-600);if(pickups.length>400)pickups.splice(0,pickups.length-400);if(texts.length>120)texts.splice(0,texts.length-120)}
