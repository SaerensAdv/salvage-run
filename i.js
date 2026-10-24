/* ================= v0.5 LAYER =================
   Weekly contract (10 tiers, earned by playing), cosmetic trails, and CO-OP RAID (party + online):
   bank a team target in 8 minutes; at 3:00 the Collector Prime walks to the hub and eats the team bank.
   Loads after h.js. Wraps functions by assignment so earlier layers keep working. */
const esc=s=>String(s).replace(/[&<>"'`]/g,c=>'&#'+c.charCodeAt(0)+';');
const safeCol=c=>/^#[0-9a-f]{3,8}$/i.test(String(c))?c:'#f6e7d8';

/* ---------- cosmetic trails ---------- */
const TRAILS=[['None',null],['Sparks','#f5c34d'],['Embers','#e67424'],['Frost','#8fd6ff'],['Toxic','#b8f28a'],['Static','#c9bfff'],['Blood','#ff5a3c']];
let trailT=0;
function trailFx(dt){trailT-=dt;if(trailT>0)return;trailT=.045;
  for(const p of players){const ti=p.trail|0,px=p.x,py=p.y,lx=p._lx==null?px:p._lx,ly=p._ly==null?py:p._ly;p._lx=px;p._ly=py;
    if(!ti||!TRAILS[ti]||p.dead>0||(px-lx)**2+(py-ly)**2<1)continue;
    parts.push({x:px+rand(-6,6),y:py+rand(-6,6)+5,vx:rand(-25,25),vy:ti===2?rand(-70,-25):rand(-25,25),life:rand(.3,.6),col:TRAILS[ti][1],s:ti===1||ti===5?rand(2,3.5):rand(3,5.5)})}}

/* ---------- weekly contract ---------- */
const WEEK_COST=30,WEEK_TIERS=10;
const WEEKLY=[['bankTotal',[2500,3500],'Bank {n} scrap'],['kill',[500,800],'Kill {n} monsters'],['raider',[12,20],'Wreck {n} raiders'],['boss',[1,2],'Down {n} Golden Brute(s)'],
  ['deepbank',[4,6],'Bank {n} hauls from Zone 3'],['beacon',[3,5],'Extract at {n} beacons'],['crate',[50,80],'Break {n} crates'],['dashkill',[40,60],'Ram {n} monsters to death']];
const WEEK_REWARD=[0,60,80,'trail0',120,150,'trail1',200,250,300,'trail2'];
const weekTrails=idx=>[1+idx%6,1+(idx+2)%6,1+(idx+4)%6];
function weekInfo(){const d=new Date(),k=(d.getDay()+6)%7,m=new Date(d.getFullYear(),d.getMonth(),d.getDate()-k);
  return{key:m.getFullYear()+'-'+(m.getMonth()+1)+'-'+m.getDate(),idx:Math.round(Date.UTC(m.getFullYear(),m.getMonth(),m.getDate())/864e5/7)}}
function ensureWeek(){if(!Array.isArray(save.trails))save.trails=[0];if(typeof save.trail!=='number'||!save.trails.includes(save.trail))save.trail=0;
  if(!save.raids)save.raids={played:0,won:0,best:0};
  const w=weekInfo();if(save.week&&save.week.key===w.key)return save.week;
  const r=mulberry(hashStr('contract'+w.key)),pool=WEEKLY.slice(),m=[];
  for(let i=0;i<4;i++){const j=Math.floor(r()*pool.length),[t,ns,l]=pool.splice(j,1)[0],n=ns[Math.floor(r()*ns.length)];m.push({t,n,p:0,done:false,label:l.replace('{n}',n),r:40})}
  m.push({t:'raidwin',n:1,p:0,done:false,label:'Co-op: win a raid',r:60});
  save.week={key:w.key,idx:w.idx,marks:0,frac:0,tier:0,ot:0,m};persist();return save.week}
function grantTier(w,t){const R=WEEK_REWARD[t];let sub;
  if(typeof R==='string'){const ti=weekTrails(w.idx)[+R.slice(5)];
    if(!save.trails.includes(ti)){save.trails.push(ti);sub=`New trail: ${TRAILS[ti][0]} · equip it in the menu (≡)`}
    else{save.bank+=150;save.total+=150;sub=`${TRAILS[ti][0]} trail already yours · +150 safe scrap`}}
  else{save.bank+=R;save.total+=R;sub=`+${R} safe scrap`}
  banners[-1]={t:3.5,title:`CONTRACT TIER ${t}/${WEEK_TIERS}`,sub};fanfareLocal(494);refreshShop()}
function addMarks(n,why){const w=ensureWeek();w.frac=(w.frac||0)+n;const k=Math.floor(w.frac+1e-9);if(k<=0)return 0;w.frac-=k;w.marks+=k;
  while(w.tier<WEEK_TIERS&&w.marks>=(w.tier+1)*WEEK_COST){w.tier++;grantTier(w,w.tier)}
  if(w.tier>=WEEK_TIERS){const ot=Math.floor((w.marks-WEEK_TIERS*WEEK_COST)/WEEK_COST);while(w.ot<ot){w.ot++;save.bank+=100;save.total+=100;pushFeedLocal('Contract overtime · +100 safe scrap','#f5c34d');refreshShop()}}
  if(why)pushFeedLocal(`Contract +${k} ★ · ${why}`,'#8fd6ff');dirty=true;return k}
const _ev5=ev;
ev=function(t,a=1){const w=ensureWeek(),df=!!(save.daily&&save.daily.full),rk=save.rank;_ev5(t,a);
  w.m.forEach(m=>{if(m.t!==t||m.done)return;m.p+=a;if(m.p>=m.n){m.done=true;pushFeedLocal(`Weekly done · ${m.label} · +${m.r} ★`,'#8fd6ff');beep(660,.12,'triangle',.05);addMarks(m.r)}});
  if(t==='bankTotal'&&a>0)addMarks(a/15,'banked '+a);
  if(save.daily&&save.daily.full&&!df)addMarks(20,'daily chest');
  if(save.rank>rk)addMarks(10,'rank up');dirty=true};

/* ---------- co-op raid ---------- */
const RAID_LEN=480,PRIME_AT=180;let RS=null,partyRaid=false,lobbyRaid=false;
const raidTarget=n=>Math.round((200+260*n)*(1+.06*totalLv())/10)*10;
function beginRaid(){ensureWeek();raid=true;const n=players.length;
  RS={target:raidTarget(n),bank:0,prime:null,spawned:false,killed:false,winNow:false,drainT:0,warnT:0,drained:0,n};
  matchT=RAID_LEN;feed.length=0;for(const p of players)p.score=0;
  bannerTo(null,'CO-OP RAID',`Bank ${RS.target} together · the Prime wakes at 3:00`,4);feedTo(null,'No friendly fire. Monsters and raiders are the enemy.','#8fd6ff');
  save.raids.played++;persist()}
function spawnPrime(){const a=rand(0,TAU),x=clamp(HUB.x+Math.cos(a)*1350,120,WORLD-120),y=clamp(HUB.y+Math.sin(a)*1350,120,WORLD-120);
  const e=makeEnemy('boss',x,y,3,null);e.prime=true;e.r=60;e.hp=e.max=e.max*1.8;e.dmg*=1.25;e.scrap=60*RS.n;e.wx=HUB.x;e.wy=HUB.y;
  enemies.push(e);RS.prime=e;RS.spawned=true;bannerTo(null,'THE COLLECTOR PRIME IS AWAKE','It walks to your hub and eats the team bank',4);
  snd(null,50,.8,'sawtooth',.07,.4);shk(null,10);fxRing(x,y,200,'#c9bfff',.6)}
const _he5=hitEnemy;
hitEnemy=function(e,dmg,by,src,crit){const was=e.dead;_he5(e,dmg,by,src,crit);
  if(e.prime&&e.dead&&!was&&RS&&!RS.killed){RS.killed=true;
    if(by&&by.isP){const b=120*RS.n;RS.bank+=b;bannerTo(null,`${by.name.toUpperCase()} KILLED THE PRIME`,`Prime bounty +${b} to the team bank`,4);fan(null,330);shk(null,24);for(let i=0;i<3;i++)dropOrb(e.x,e.y)}
    else bannerTo(null,'A RAIDER STOLE THE PRIME KILL','No bounty. Bank what you can.',3.5);
    if(RS.bank>=RS.target)RS.winNow=true}};
const _nt5=nearestTarget;
nearestTarget=function(src,range,o){const pr=raid&&RS&&RS.prime;if(pr&&!pr.dead&&src&&src.isP&&(pr.x-src.x)**2+(pr.y-src.y)**2<(range+pr.r)**2)return pr;return _nt5(src,range,o)};
const _fb5=finishBank;
finishBank=function(p,h,vb){_fb5(p,h,vb);if(raid&&RS&&h>0){RS.bank+=h;if(RS.bank>=RS.target&&RS.bank-h<RS.target)bannerTo(null,'TARGET BANKED','Hold it until the clock runs out',3)}};
function raidTick(dt){if(!raid||!RS||state!=='play')return;
  if(mode==='host')matchT-=dt;
  if(!RS.spawned&&matchT<=PRIME_AT)spawnPrime();
  RS.drainT=Math.max(0,RS.drainT-dt);const e=RS.prime;
  if(e&&!e.dead){const near=players.some(p=>targetable(p)&&Math.hypot(p.x-e.x,p.y-e.y)<700);e.spd=near?80:120;e.wx=HUB.x;e.wy=HUB.y;
    if(Math.hypot(e.x-HUB.x,e.y-HUB.y)<HUB.r+e.r+30&&RS.bank>0){const amt=Math.min(RS.bank,(4+2*RS.n)*dt);RS.bank-=amt;RS.drained+=amt;RS.drainT=.3;RS.warnT-=dt;
      if(RS.warnT<=0){RS.warnT=6;bannerTo(null,'THE PRIME IS EATING THE BANK','Step out of the hub and kill it',2.5);shk(null,6)}}}
  if(RS.winNow){raidEnd(true);return}
  if(mode==='host'&&matchT<=0)raidEnd(RS.bank>=RS.target)}
function raidEnd(win){if(state==='over'||!RS)return;state='over';releaseAll();pickEl.style.display='none';pauseEl.style.display='none';
  const bonus=win?Math.round(RS.target*.3):0,tot=players.reduce((s,p)=>s+p.score,0),bank=Math.round(RS.bank),rows=players.map(q=>[q.name,q.col,q.score,q.kills]);
  if(mode==='party'){save.bank+=tot+bonus;save.total+=tot+bonus}else{save.bank+=bonus;save.total+=bonus}
  save.raids.best=Math.max(save.raids.best,bank);if(win){save.raids.won++;ev('raidwin')}persist();refreshShop();
  if(mode==='host')for(const p of players)if(p.remote)netSend(p,{t:'raidEnd',win:win?1:0,bank,target:RS.target,bonus,killed:RS.killed?1:0,rows});
  showRaidResult(win,bank,RS.target,bonus,RS.killed,rows,mode==='party'?tot:0)}
function showRaidResult(win,bank,target,bonus,killed,rows,devTot){
  $('resTitle').textContent=win?'RAID CLEARED':'RAID FAILED';$('resTitle').style.color=win?'#8fd6ff':'#ff6a3d';
  const add=[devTot?`+${devTot} banked scrap`:'',bonus?`+${bonus} raid bonus`:''].filter(Boolean).join(' · ');
  $('resBody').innerHTML=`<div style="color:#f5c34d">Team bank ◆ ${bank|0} / ${target|0}${killed?' · Prime down':''}</div>`+
    rows.map(r=>`<div style="color:${safeCol(r[1])}">${esc(r[0])} · ◆ ${r[2]|0} banked · ${r[3]|0} kills</div>`).join('')+
    `<div style="opacity:.7;font-size:15px;margin-top:8px">${add?add+' added to this device\'s safe bank':'No bonus this time. The Prime keeps its lunch.'}</div>`+
    (mode==='guest'?`<div style="opacity:.7;font-size:15px">Waiting for the host to start the next raid…</div>`:'');
  const ra=$('resAgain');if(ra){ra.style.display=mode==='guest'?'none':'';ra.textContent=mode==='host'?'NEXT RAID':'REMATCH'}
  fanfareLocal(win?523:262);showOnly('results');hudOn(false)}
function hostRaidAgain(){const ps=players;setupWorld('host',ps);
  for(const p of ps){newRun(p);respawn(p);p.dead=0;p.carry=0;p.score=0;p.kills=0;p.haul=0;p.trip={z3:false,hit:false,t:0}}
  showOnly(null);hudOn(true);state='play';if(lobbyRaid)beginRaid();else{raid=false;RS=null}
  for(const p of ps)if(p.remote)netSend(p,{t:'raidStart'})}
function rematch(){if(mode==='host'&&NET)return hostRaidAgain();startParty()}

/* ---------- network hooks ---------- */
const _ho5=hostOnData;
hostOnData=function(conn,d){if(d&&d.t==='hello')d.name=String(d.name||'Guest').replace(/[<>&"'`]/g,'').slice(0,10)||'Guest';
  if(d&&d.t==='trail'){const p=players.find(q=>q.id===conn.pid);if(p)p.trail=clamp(d.k|0,0,TRAILS.length-1);return}
  _ho5(conn,d);
  if(d&&d.t==='hello'&&raid&&RS&&state==='play'){const p=players.find(q=>q.id===conn.pid);if(p)netSend(p,{t:'raidStart'})}};
const _bs5=buildSnap;
buildSnap=function(c){const s=_bs5(c);if(!s)return s;s.P.forEach((row,i)=>row.push(players[i]?players[i].trail|0:0));
  if(raid&&RS){const pr=RS.prime;s.rd=[r2(Math.max(0,matchT)),Math.round(RS.bank),RS.target,pr?(pr.dead?2:1):0,pr&&!pr.dead?r2(pr.hp/pr.max):0,RS.drainT>0?1:0,pr&&!pr.dead?pr.id:-1]}
  return s};
const _as5=applySnap;
applySnap=function(s){if(s.rd&&s.st&&!G.started){G.started=true;pushFeedLocal('Co-op raid. Bank together. Stop the Prime.','#8fd6ff')}
  _as5(s);if(mode!=='guest')return;
  for(const a of s.P){const o=G.pmap.get(a[0]);if(o)o.trail=clamp(a[25]|0,0,TRAILS.length-1)}
  G.raid=s.rd?{t:s.rd[0],bank:s.rd[1],target:s.rd[2],ps:s.rd[3],php:s.rd[4],drain:!!s.rd[5]}:null;
  if(s.rd&&s.rd[6]>=0){const e=G.emap.get(s.rd[6]);if(e)e.prime=true}};
const _go5=guestOnData;
guestOnData=function(d){if(!d)return;
  if(d.t==='raidEnd'){ensureWeek();const b=Math.max(0,d.bonus|0);save.bank+=b;save.total+=b;save.raids.played++;save.raids.best=Math.max(save.raids.best,d.bank|0);
    if(d.win){save.raids.won++;ev('raidwin')}persist();refreshShop();showRaidResult(!!d.win,d.bank|0,d.target|0,b,!!d.killed,Array.isArray(d.rows)?d.rows.slice(0,4):[],0);return}
  if(d.t==='raidStart'){showOnly(null);hudOn(true);pushFeedLocal('Co-op raid. Bank together. Stop the Prime.','#8fd6ff');return}
  _go5(d);if(d.t==='welcome')netSendHost({t:'trail',k:save.trail})};

/* ---------- loop hooks ---------- */
const _up5=update;
update=function(rdt){if(mode==='solo'&&raid){raid=false;RS=null}
  const me=players.find(p=>!p.remote);if(me)me.trail=save.trail;
  _up5(rdt);if(raid&&RS&&(mode==='party'||mode==='host'))raidTick(rdt);trailFx(rdt)};
const _gu5=guestUpdate;guestUpdate=function(dt){_gu5(dt);trailFx(dt)};
const _em5=endMatch;endMatch=function(){if(raid&&RS)return raidEnd(RS.bank>=RS.target);return _em5()};
const _sp5=startParty;
startParty=function(){raid=false;RS=null;const ra=$('resAgain');if(ra){ra.style.display='';ra.textContent='REMATCH'}_sp5();if(partyRaid)beginRaid()};
const _btm5=backToMenu;
backToMenu=function(){raid=false;RS=null;G.raid=null;_btm5();const ra=$('resAgain');if(ra){ra.style.display='';ra.textContent='REMATCH'}};

/* ---------- drawing ---------- */
const raidView=()=>{if(mode==='guest')return G.raid;
  if(raid&&RS&&(mode==='party'||mode==='host')){const pr=RS.prime;return{t:Math.max(0,matchT),bank:RS.bank,target:RS.target,ps:pr?(pr.dead?2:1):0,php:pr&&!pr.dead?pr.hp/pr.max:0,drain:RS.drainT>0}}return null};
function drawRaidPill(cx,cy,R){const w=236,x=cx-w/2,y=cy-20,s=Math.ceil(R.t),t=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`,ok=R.bank>=R.target;
  ctx.fillStyle=R.drain&&Math.sin(time*14)>0?'rgba(141,28,6,.95)':'rgba(23,8,4,.92)';rr(x,y,w,40,13);ctx.fill();
  ctx.textAlign='center';ctx.font=F(800,18);txt(`${t} · ◆ ${Math.floor(R.bank)} / ${R.target}`,cx,y+21,s<=30?'#ff6a3d':ok?'#8fd6ff':'#f6e7d8');
  bar(x+14,y+29,w-28,5,R.bank/R.target,ok?'#8fd6ff':'#f5c34d');
  if(R.ps===1){ctx.fillStyle='rgba(23,8,4,.92)';rr(x+18,y+44,w-36,24,10);ctx.fill();ctx.font=F(800,14);
    txt(R.drain?'PRIME IS EATING THE BANK':'COLLECTOR PRIME',cx,y+61,R.drain?'#ff6a3d':'#c9bfff');bar(x+30,y+64,w-60,3,R.php,'#c9bfff')}
  else if(R.ps===0&&R.t>PRIME_AT&&R.t<PRIME_AT+20){ctx.font=F(800,14);txt('THE PRIME WAKES SOON',cx,y+60,'#c9bfff')}}
draw=function(){ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#170804';ctx.fillRect(0,0,W,H);
  const vs=views();for(const v of vs)drawView(v);if(vs.length===3)drawBoard(W/2,H/2,W/2,H/2);
  ctx.fillStyle='#170804';if(vs.length===2){if(W>=H)ctx.fillRect(W/2-3,0,6,H);else ctx.fillRect(0,H/2-3,W,6)}else if(vs.length>2){ctx.fillRect(W/2-3,0,6,H);ctx.fillRect(0,H/2-3,W,6)}
  if(state==='menu')return;const R=raidView();
  if(R){const cy=mode==='party'?(W<H&&vs.length===2?H/2-8:H/2):(W>=760?30:H-176);drawRaidPill(W/2,cy,R);return}
  if(mode==='party'){const s=Math.max(0,Math.ceil(matchT)),t=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`,cy=vs.length>2?H/2:26;
    ctx.textAlign='center';ctx.font=F(800,24);ctx.fillStyle='rgba(23,8,4,.9)';rr(W/2-46,cy-18,92,36,12);ctx.fill();txt(t,W/2,cy+8,s<=30?'#ff6a3d':'#f6e7d8')}};
drawBoard=function(x,y,w,h){ctx.save();ctx.translate(x,y);ctx.fillStyle='#24100a';ctx.fillRect(0,0,w,h);ctx.textAlign='center';
  ctx.font=F(800,Math.min(40,w*.08));txt(raid?'TEAM':'SCOREBOARD',w/2,h*.28,raid?'#8fd6ff':'#f5c34d','#8d1c06');
  [...players].sort((a,b)=>b.score-a.score).forEach((p,i)=>{ctx.font=F(800,Math.min(28,w*.055));txt(`${raid?'':i+1+'. '}${p.name}  ◆ ${p.score}`,w/2,h*.28+50+i*40,p.col)});
  ctx.font=F(600,15);txt(raid?'Bank the target together. Stop the Prime at the hub.':'Most scrap banked when the clock hits zero wins.',w/2,h*.85,'rgba(246,231,216,.6)');ctx.restore()};
const _de5=drawEnemy;
drawEnemy=function(e){if(!e.prime)return _de5(e);
  if(e.slamT>0){ctx.fillStyle=`rgba(201,191,255,${.12+(.85-e.slamT)*.3})`;ctx.beginPath();ctx.arc(e.x,e.y,165,0,TAU);ctx.fill();
    ctx.strokeStyle='rgba(201,191,255,.85)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,165*(1-e.slamT/.85),0,TAU);ctx.stroke()}
  ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle='rgba(201,191,255,.10)';ctx.beginPath();ctx.arc(0,0,e.r+26+Math.sin(time*5)*6,0,TAU);ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(0,e.r*.7,e.r,e.r*.4,0,0,TAU);ctx.fill();
  const pul=1+Math.sin(time*3)*.04;ctx.scale(pul,pul);ctx.fillStyle=e.flash>0?'#fff':'#2a1238';ctx.strokeStyle='#f6e7d8';ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(0,-e.r-16);ctx.quadraticCurveTo(e.r+14,-e.r,e.r,e.r);ctx.lineTo(-e.r,e.r);ctx.quadraticCurveTo(-e.r-14,-e.r,0,-e.r-16);ctx.fill();ctx.stroke();
  ctx.fillStyle='#f5c34d';ctx.beginPath();ctx.moveTo(-26,-e.r+2);ctx.lineTo(-16,-e.r-20);ctx.lineTo(-6,-e.r-2);ctx.lineTo(0,-e.r-28);ctx.lineTo(6,-e.r-2);ctx.lineTo(16,-e.r-20);ctx.lineTo(26,-e.r+2);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ff5a3c';ctx.shadowColor='#ff5a3c';ctx.shadowBlur=16;ctx.beginPath();ctx.arc(-14,-6,6,0,TAU);ctx.arc(14,-6,6,0,TAU);ctx.fill();ctx.shadowBlur=0;ctx.restore();
  ctx.font=F(800,16);ctx.textAlign='center';txt('COLLECTOR PRIME',e.x,e.y-e.r-52,'#c9bfff');bar(e.x-70,e.y-e.r-46,140,8,e.hp/e.max,'#c9bfff')};

/* ---------- menus ---------- */
const _op5=openPause;
openPause=function(){_op5();if(pauseEl.style.display!=='flex')return;const box=pauseEl.querySelector('.pbox'),rs=$('resume'),w=ensureWeek(),tr=weekTrails(w.idx);
  const nx=w.tier<WEEK_TIERS?WEEK_REWARD[w.tier+1]:null,nl=nx==null?'overtime · +100 per 30 ★':typeof nx==='string'?`${TRAILS[tr[+nx.slice(5)]][0]} trail`:`+${nx} scrap`;
  const into=w.tier<WEEK_TIERS?w.marks-w.tier*WEEK_COST:(w.marks-WEEK_TIERS*WEEK_COST)%WEEK_COST;
  let h=`<h3>WEEKLY CONTRACT · TIER ${w.tier}/${WEEK_TIERS}</h3>`+goalHtml(`Next: ${nl}`,into,WEEK_COST,false)+w.m.map(m=>goalHtml(`${m.label} · +${m.r} ★`,m.p,m.n,m.done)).join('')+
    `<div class="note">★ come from banking (1 per 15 scrap), weekly goals, daily chests and rank-ups. A new contract starts every Monday. Trails you earn stay yours, and every trail comes back in later contracts.</div>`;
  h+=`<h3>TRAIL</h3><div class="skins trails">`+TRAILS.map((t,i)=>{const own=save.trails.includes(i);
    return `<button data-t="${i}" class="${i===save.trail?'on':''}${own?'':' lock'}" aria-label="${t[0]} trail" style="background:${t[1]||'#2b0f08'};color:#f6e7d8;font-size:14px">${i===0?'off':''}</button>`}).join('')+`</div>`;
  h+=`<div class="note">Co-op raids: ${save.raids.won} won of ${save.raids.played} · best team bank ${save.raids.best}</div>`;
  const div=document.createElement('div');div.style.cssText='display:flex;flex-direction:column;gap:14px';div.innerHTML=h;box.insertBefore(div,rs);
  div.querySelectorAll('.trails button').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.t;if(!save.trails.includes(i))return;save.trail=i;persist();
    if(mode==='guest')netSendHost({t:'trail',k:i});else{const me=players.find(p=>!p.remote);if(me)me.trail=i}openPause()}))};
const _mm5=menuMeta;
menuMeta=function(){_mm5();const w=ensureWeek();$('menuMeta').innerHTML+=`<br>Weekly contract · tier ${w.tier}/${WEEK_TIERS} · ${w.marks} ★`};
const modeRow=(cls,opts,cur,onPick)=>{const row=document.createElement('div');row.className='row2 '+cls;
  opts.forEach(([l,v])=>{const b=document.createElement('button');b.className='alt';b.textContent=l;if(v===cur){b.style.borderColor='#f5c34d';b.style.boxShadow='0 0 18px rgba(245,195,77,.35)'}
    b.addEventListener('click',()=>onPick(v));row.appendChild(b)});return row};
const _rp5=renderParty;
renderParty=function(){_rp5();const box=$('party'),old=box.querySelector('.pm');if(old&&old.remove)old.remove();
  const row=modeRow('pm',[['VERSUS',false],['CO-OP RAID',true]],partyRaid,v=>{partyRaid=v;renderParty()});box.insertBefore(row,box.querySelector('.pn')||box.querySelector('.pcol'));
  if(partyRaid)box.querySelector('p').textContent=`Co-op raid · 8 minutes · bank ${raidTarget(partyN)} together. At 3:00 the Collector Prime walks to your hub and eats the bank. Stop it.`;
  const fb=$('partyStart');if(fb)fb.textContent=partyRaid?'RAID':'FIGHT'};
(()=>{const lob=$('lobby'),st=$('lobbyStart');if(!lob||!st)return;let row=null;
  const paint=()=>{const n=modeRow('lm',[['FREE-FOR-ALL',false],['CO-OP RAID',true]],lobbyRaid,v=>{lobbyRaid=v;paint()});if(row&&row.replaceWith)row.replaceWith(n);else lob.insertBefore(n,st);row=n};paint();
  st.addEventListener('click',()=>{if(lobbyRaid){beginRaid();for(const p of players)if(p.remote)netSend(p,{t:'raidStart'})}else{raid=false;RS=null}})})();
for(const[id,fn]of[['partyStart',()=>startParty()],['resAgain',()=>rematch()],['resMenu',()=>backToMenu()]]){const o=$(id);if(o&&o.cloneNode){const n=o.cloneNode(true);o.replaceWith(n);n.addEventListener('click',fn)}}
ensureWeek();menuMeta();document.title='Salvage Run · v0.5';
if(window.__game)Object.defineProperties(window.__game,Object.getOwnPropertyDescriptors({update,draw,startParty,endMatch,backToMenu,guestUpdate,openPause,beginRaid,raidEnd,rematch,hostRaidAgain,raidTarget,ensureWeek,addMarks,ev,
  get RS(){return RS},get raid(){return raid},setPartyRaid:v=>{partyRaid=v},setLobbyRaid:v=>{lobbyRaid=v},TRAILS}));
