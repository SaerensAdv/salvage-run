/* ================= v0.13 · MAP SLICE 1: event sites, Relay Core contract, corner pockets =================
   Feature-branch test build. Reuses existing events, contracts, enemies, chests, outposts and banking.
   1) Supply drops, hordes and scrap storms land on named sites along the routes instead of anywhere near you.
      The loot goblin still pops up close by, because it runs.
   2) Contract "Recover the Relay Core": clear the guards, take the hot core, bank it at the hub or an outpost.
      Carrying it makes PKers and monsters come for you. Die and you drop it. An optional second cache nearby
      pays a chest plus +50% contract reward, but opening it calls a telegraphed horde.
   3) Corner pockets: once the Dead Reactor is open, the four unused corners become short dead-end pockets
      with a guarded deep cache (Wastes 50). Once per run each.
   Host-authoritative. Guests get relay + pocket state through the snapshot. No new currency, mode or save field. */
{
const pol=(a,d)=>({x:HUB.x+Math.cos(a)*d,y:HUB.y+Math.sin(a)*d});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

/* ---------- 1. named event sites along the proposed routes ---------- */
const SITES=[
  ['Crane Yard',-.45,1150],['Old Pumphouse',2.3,1150],['Pylon Field',3.6,1250],['Rail Bend',.9,1050],
  ['Scrap Causeway',.45,2250],['Toll Bridge',1.5,2200],['North Cut',-1.15,2250],['Broken Rail',-2.6,2250],['Dry Dock',3.4,2200],
  ['Slag Weir',2.0,2950],['Melt Gate',3.75,2950],['East Flues',.5,2950],['Smoke Stacks',-.3,2950],['Crucible',4.1,2950],
  ['Coolant Lake',5.25,3650],['Cooling Towers',.2,3650],['Dead Switchyard',2.65,3650],['Ash Vents',3.6,3650],['Signal Mast',.85,3650]
].map(([n,a,d],i)=>{const o=pol(a,d);return {i,n,x:o.x,y:o.y,r:regAt(o.x,o.y)}});
let siteK=null,siteHit=null,lastSite=-1;
const _evSpotU=evSpot;
evSpot=function(p,lo,hi){
  if(siteK&&siteK!=='goblin'&&p){const R=curReg(),fr=FR(),pr=regAt(p.x,p.y);
    const c=SITES.filter(s=>s.r<=R&&Math.hypot(s.x-HUB.x,s.y-HUB.y)<fr-160&&!players.some(q=>q.dead<=0&&dist(q,s)<380)).map(s=>[s,dist(s,p)]).filter(([,d])=>d>=Math.min(lo,500)&&d<=Math.max(hi,1700));
    if(c.length){const w=c.map(([s,d])=>(s.r===pr?3:1)*(s.i===lastSite?.15:1)*(d<1300?1.5:1));let t=Math.random()*w.reduce((a,b)=>a+b,0),k=0;while(k<c.length-1&&(t-=w[k])>0)k++;
      const s=c[k][0];siteHit=s;lastSite=s.i;if(EVN[siteK])EVN[siteK][1]=`At ${s.n}. `+EVN[siteK][1];return {x:s.x+rand(-40,40),y:s.y+rand(-40,40)}}}
  siteHit=null;return _evSpotU(p,lo,hi)};
const _startEventU=startEvent;
startEvent=function(k){const N=EVN[k],sub=N&&N[1];siteK=k;siteHit=null;let ok=false;
  try{ok=_startEventU(k)}finally{if(N)N[1]=sub;siteK=null}
  if(ok&&WEV&&siteHit)WEV.site=siteHit.i;return ok};
const siteNear=(x,y)=>SITES.find(s=>Math.abs(s.x-x)<120&&Math.abs(s.y-y)<120);

/* ---------- 2. Relay Core contract ---------- */
const RSITES=[[-.55,2080],[2.6,2950],[4.65,3650]].map(([a,d],i)=>Object.assign(pol(a,d),{r:i+1}));
const RC_R=80,RC_HOLD=1.6,CACHE_R=110,CACHE_HOLD=1.2,CACHE_T=90,CACHE_WARN=3,CORE='#8fd6ff',CACHE='#f5c34d';
CTD.relay={t:()=>'Recover the Relay Core and bank it at the hub or an outpost',n:[1,1],rw:[200,260],c:2};
const relayContract=()=>{const mx=Math.max(1,wlMax()),D=CTD.relay;return {k:'relay',n:1,g:0,L:0,rw:Math.round(rand(D.rw[0],D.rw[1])*(1+mx/50)/5)*5,c:D.c}};
try{if(/[?&]test=relay\b/.test((typeof location!=='undefined'&&location.search)||'')&&curReg()>=1&&(!save.wct||save.wct.k!=='relay')){save.wct=relayContract();persist()}}catch(e){}
let RC=null;
const rcWant=()=>mode!=='guest'&&curReg()>=1&&!!save.wct&&save.wct.k==='relay';
function rcSpawn(){const R=Math.min(curReg(),3),s=RSITES.filter(q=>q.r<=R).pop();RC={x:s.x,y:s.y,r:s.r,ph:0,gs:0,gl:0,hold:0,cid:-1,lx:s.x,ly:s.y,c:null,bonus:0,pt:0}}
function rcGuards(p){for(let k=0;k<3+RC.r;k++){const a=k/(3+RC.r)*TAU+rand(-.3,.3),x=RC.x+Math.cos(a)*120,y=RC.y+Math.sin(a)*120,e=makeEnemy(k?'dasher':'brute',x,y,3,p);
  e.elite=k===0;if(k===0){e.hp*=2;e.max=e.hp}e.wx=x;e.wy=y;e.rcg=1;enemies.push(e)}}
function cacheSpot(){const out=Math.atan2(RC.y-HUB.y,RC.x-HUB.x),fr=FR();
  for(let k=0;k<40;k++){const a=out+rand(-1.3,1.3)+(k>25?Math.PI:0),d=rand(480,640),x=RC.x+Math.cos(a)*d,y=RC.y+Math.sin(a)*d,dh=Math.hypot(x-HUB.x,y-HUB.y);
    if(dh>fr-220||dh<DITCH+150)continue;if(OUTPOSTS.some(o=>Math.hypot(o.x-x,o.y-y)<o.r+160))continue;return {x,y}}return null}
function rcTake(p){RC.ph=1;RC.cid=p.id;RC.hold=0;fxBurst(RC.x,RC.y,CORE,30,260);fxRing(RC.x,RC.y,220,CORE,.5);snd(null,660,.18,'triangle',.05,.5);
  bannerTo(p,'RELAY CORE · HOT','Bank it at the hub or an outpost. PKers can see it.',3);
  const c=cacheSpot();if(c){RC.c={x:c.x,y:c.y,st:1,t:CACHE_T,hold:0,w:0,left:0};feedTo(null,'Second cache spotted nearby · optional · a horde guards it',CACHE)}}
function rcBank(p){const c=save.wct;if(RC.bonus&&c)c.rw=Math.round(c.rw*1.5/5)*5;
  fxBurst(p.x,p.y,CORE,40,300);fxRing(p.x,p.y,260,CORE,.6);feedTo(null,RC.bonus?'Relay Core banked · second cache bonus +50%':'Relay Core banked',CORE);
  if(!creditsSave(p))wev(p,'relay',1,0);RC=null;ctEv('relay',1)}
function rcCache(dt,alive){const C=RC.c;if(!C)return;
  if(C.st===1){C.t-=dt;if(C.t<=0){RC.c=null;feedTo(null,'The second cache got buried again','#ed9b49');return}
    if(alive.some(p=>dist(p,C)<CACHE_R)){C.hold+=dt;if(C.hold>=CACHE_HOLD){C.st=2;C.w=CACHE_WARN;bannerTo(null,'HORDE INCOMING','You cracked the second cache. Hold the area.',2.4);snd(null,220,.3,'sawtooth',.05,.4)}}
    else C.hold=Math.max(0,C.hold-dt)}
  else if(C.st===2){C.w-=dt;C.tk=(C.tk||0)-dt;if(C.tk<=0){C.tk=.75;fxRing(C.x,C.y,430,'#ff6a3d',.6)}
    if(C.w<=0){const p=alive.slice().sort((a,b)=>dist(a,C)-dist(b,C))[0]||players[0],n=6+2*RC.r;
      for(let k=0;k<n;k++){const a=k/n*TAU+rand(-.2,.2),d=rand(380,460),x=clamp(C.x+Math.cos(a)*d,40,WORLD-40),y=clamp(C.y+Math.sin(a)*d,40,WORLD-40);
        let q={x,y};const qd=Math.hypot(q.x-HUB.x,q.y-HUB.y),lim=FR()-60;if(qd>lim){q.x=HUB.x+(q.x-HUB.x)/qd*lim;q.y=HUB.y+(q.y-HUB.y)/qd*lim}const e=makeEnemy(Math.random()<.25?'brute':Math.random()<.5?'dasher':'crawler',q.x,q.y,3,p);e.rch=1;e.wx=C.x;e.wy=C.y;enemies.push(e)}
      C.st=3;C.t=40;feedTo(null,'Here they come','#ff6a3d')}}
  else if(C.st===3){C.t-=dt;C.left=enemies.filter(e=>!e.dead&&e.rch).length;
    if(!C.left){chestAt(C.x,C.y,RC.r,{evc:1});RC.bonus=1;bannerTo(null,'SECOND CACHE OPEN','Loot the chest. Bank the core for +50% contract reward.',2.6);fan(null,659);RC.c=null}
    else if(C.t<=0){for(const e of enemies)if(e.rch)e.rch=0;feedTo(null,'The horde kept the cache shut','#ed9b49');RC.c=null}}}
function rcTick(dt){
  if(!rcWant()){if(RC&&RC.ph>0)feedTo(null,'Contract changed. The Relay Core went cold.','#ed9b49');RC=null;return}
  if(!RC)rcSpawn();const alive=players.filter(p=>p.dead<=0);
  if(RC.ph===0){
    if(!RC.gs){const p=alive.find(q=>dist(q,RC)<950);if(p){RC.gs=1;rcGuards(p);bannerTo(null,'RELAY CORE','Clear the guards, then stand on the relay.',2.6)}}
    RC.gl=RC.gs?enemies.filter(e=>!e.dead&&e.rcg&&dist(e,RC)<520).length:0;
    const on=alive.filter(p=>dist(p,RC)<RC_R);
    if(RC.gs&&!RC.gl&&on.length){RC.hold+=dt;if(RC.hold>=RC_HOLD)rcTake(on[0])}else RC.hold=Math.max(0,RC.hold-dt*2)}
  else if(RC.ph===1){const p=players.find(q=>q.id===RC.cid);
    if(!p||p.dead>0){RC.ph=2;RC.cid=-1;if(p){RC.lx=p.x;RC.ly=p.y}fxBurst(RC.lx,RC.ly,CORE,20,200);feedTo(null,'Relay Core dropped. Pick it up where it fell.','#ff6a3d')}
    else{RC.lx=p.x;RC.ly=p.y;if(inHub(p)||opAt(p)){rcBank(p);return}
      if(inWastes(p)){RC.pt-=dt;if(RC.pt<=0){RC.pt=2.5;let n=0;for(const e of enemies)if(!e.dead&&Math.abs(e.x-p.x)<900&&Math.abs(e.y-p.y)<900)n++;if(n<12)spawnEnemy(p)}}}}
  else if(RC.ph===2){const p=alive.find(q=>Math.hypot(q.x-RC.lx,q.y-RC.ly)<60);if(p){RC.ph=1;RC.cid=p.id;feedTo(null,`${p.name||'You'} picked up the Relay Core`,CORE)}}
  if(RC)rcCache(dt,alive)}
// A hot core is a magnet: PKers in the Wastes go for the carrier.
const _urU=updateRivals;updateRivals=function(dt){if(RC&&RC.ph===1&&mode!=='guest'){const p=players.find(q=>q.id===RC.cid);
    if(p&&p.dead<=0&&inWastes(p)&&!opAt(p))for(const r of rivals){if(!r.pk||r.dead>0||Math.hypot(r.x-p.x,r.y-p.y)>1400)continue;r.aggro=Math.max(r.aggro,1.5);r.aggroP=p;r.tx=p.x;r.ty=p.y}}
  return _urU(dt)};

/* ---------- 3. corner pockets (Dead Reactor open) ---------- */
const PW=120,PR=300,PD=4480,PS=Math.sqrt(PR*PR-PW*PW);
const POCKETS=[[-Math.PI/4,'Reactor Sump'],[Math.PI/4,'Last Shelf'],[3*Math.PI/4,'Ash Cellar'],[-3*Math.PI/4,'Black Silo']].map(([a,n],i)=>Object.assign(pol(a,PD),{i,n,a,ux:Math.cos(a),uy:Math.sin(a),st:0,ch:null}));
const pkOn=()=>!VLT&&curReg()>=3;
const PT0=()=>REG[3].out-60;
const loc=(o,P)=>{const dx=o.x-HUB.x,dy=o.y-HUB.y;return [dx*P.ux+dy*P.uy,-dx*P.uy+dy*P.ux]};
const inPocket=(o,P,m)=>{const [t,v]=loc(o,P);return (t>=PT0()&&t<=PD&&Math.abs(v)<=PW-m)||Math.hypot(o.x-P.x,o.y-P.y)<=PR-m};
const pocketAt=(o,m=0)=>pkOn()?POCKETS.find(P=>loc(o,P)[0]>REG[3].out-40&&inPocket(o,P,m))||null:null;
// Called by the frontier clamp (m.js) before it pushes something back inside the ring. Returns true when the pocket owns it.
window.pocketHold=function(o){if(!pkOn())return false;const m=o.r||16;
  for(const P of POCKETS){const [t,v]=loc(o,P);if(t<PT0()-m)continue;if(inPocket(o,P,m))return true;
    const dc=Math.hypot(o.x-P.x,o.y-P.y),nearCor=t<=PD&&Math.abs(v)<PW+12,nearDisc=dc<PR+40;if(!nearCor&&!nearDisc)continue;
    const tc=clamp(t,PT0(),PD),vc=clamp(v,-(PW-m),PW-m),c1={x:HUB.x+tc*P.ux-vc*P.uy,y:HUB.y+tc*P.uy+vc*P.ux},k=(PR-m)/(dc||1),c2={x:P.x+(o.x-P.x)*k,y:P.y+(o.y-P.y)*k};
    const c=Math.hypot(c1.x-o.x,c1.y-o.y)<Math.hypot(c2.x-o.x,c2.y-o.y)?c1:c2;o.x=c.x;o.y=c.y;return true}
  return false};
function pocketTick(){if(!pkOn())return;
  for(const P of POCKETS){
    if(P.st===0){const p=players.find(q=>q.dead<=0&&loc(q,P)[0]>REG[3].out+10&&inPocket(q,P,0));if(!p)continue;
      P.st=1;P.ch=chestAt(P.x,P.y,3,{evc:1});P.ch.max=P.ch.hp=P.ch.max*1.6;
      for(let k=0;k<5;k++){const a=k/5*TAU,x=P.x+Math.cos(a)*150,y=P.y+Math.sin(a)*150,e=makeEnemy(k<2?'brute':'dasher',x,y,3,p);if(k<2){e.elite=true;e.hp*=2;e.max=e.hp}e.wx=x;e.wy=y;e.pkg=1;enemies.push(e)}
      bannerTo(p,P.n.toUpperCase(),'Deep cache · Wastes 50 · guarded',2.6);snd(null,330,.25,'triangle',.05,.5)}
    else if(P.st===1&&(!P.ch||P.ch.dead>0||!crates.includes(P.ch))){P.st=2;P.ch=null;dropItem(P.x,P.y,RW7.elite,16);dropScrap(P.x,P.y,80,1.4);feedTo(null,`${P.n} looted · it refills next run`,CORE)}}}

/* ---------- world hooks ---------- */
const _uwU=updateWorld;updateWorld=function(dt){_uwU(dt);if(VLT||ftueOn()||mode==='guest'||state!=='play')return;rcTick(dt);pocketTick()};
const _swU=setupWorld;setupWorld=function(m,pl){RC=null;for(const P of POCKETS){P.st=0;P.ch=null}_swU(m,pl)};

/* ---------- network ---------- */
const _bsU=buildSnap;buildSnap=function(c){const s=_bsU(c);if(!s)return s;
  s.RC=RC?[RC.ph,Math.round(RC.x),Math.round(RC.y),RC.cid,Math.round(RC.lx),Math.round(RC.ly),r2(RC.hold/RC_HOLD),RC.gl|0,RC.gs|0,RC.bonus|0,
    RC.c?[Math.round(RC.c.x),Math.round(RC.c.y),RC.c.st,r2(RC.c.hold/CACHE_HOLD),Math.ceil(RC.c.t),r2(RC.c.w),RC.c.left|0]:0]:null;
  s.PK=POCKETS.map(P=>P.st);return s};
const _asU=applySnap;applySnap=function(s){_asU(s);if(mode!=='guest')return;const a=s.RC;
  G.rc=Array.isArray(a)?{ph:a[0]|0,x:+a[1],y:+a[2],cid:a[3]|0,lx:+a[4],ly:+a[5],hp:+a[6]||0,gl:a[7]|0,gs:a[8]|0,bonus:a[9]|0,c:Array.isArray(a[10])?{x:+a[10][0],y:+a[10][1],st:a[10][2]|0,hp:+a[10][3]||0,t:a[10][4]|0,w:+a[10][5]||0,left:a[10][6]|0}:null}:null;
  if(Array.isArray(s.PK))s.PK.forEach((v,i)=>{if(POCKETS[i])POCKETS[i].st=v|0})};
const rcView=()=>mode==='guest'?G.rc:RC&&{ph:RC.ph,x:RC.x,y:RC.y,cid:RC.cid,lx:RC.lx,ly:RC.ly,hp:RC.hold/RC_HOLD,gl:RC.gl,gs:RC.gs,bonus:RC.bonus,
  c:RC.c&&{x:RC.c.x,y:RC.c.y,st:RC.c.st,hp:RC.c.hold/CACHE_HOLD,t:RC.c.t,w:RC.c.w,left:RC.c.left}};

/* ---------- render ---------- */
function keyhole(P,ex=0){const s=Math.sqrt((PR+ex)**2-(PW+ex)**2),t0=PT0()-(ex?0:20),f1=-(Math.PI-Math.asin((PW+ex)/(PR+ex))),pts=[];
  const W=(t,v)=>[HUB.x+t*P.ux-v*P.uy,HUB.y+t*P.uy+v*P.ux];pts.push(W(t0,-(PW+ex)),W(PD-s,-(PW+ex)));
  for(let k=0;k<=36;k++){const f=f1+(-2*f1)*k/36,t=PD+Math.cos(f)*(PR+ex),v=Math.sin(f)*(PR+ex);pts.push(W(t,v))}pts.push(W(t0,PW+ex));return pts}
function pathPts(pts){ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.closePath()}
const pocketsShown=()=>!VLT&&curReg()>=3&&frAnim>REG[3].out-30;
const _dgU=drawGroundX;drawGroundX=function(...a){if(!pocketsShown())return _dgU(...a);
  for(let r=1;r<4;r++){ctx.fillStyle=REG[r].gr;ringPath(REG[r-1].out,REG[r].out);ctx.fill()}
  ctx.save();ctx.beginPath();ctx.rect(-2000,-2000,WORLD+4000,WORLD+4000);for(const P of POCKETS)pathPts(keyhole(P));ctx.clip('evenodd');
  ctx.fillStyle='rgba(8,2,1,.6)';ctx.beginPath();ctx.rect(-2000,-2000,WORLD+4000,WORLD+4000);ctx.arc(HUB.x,HUB.y,frAnim,0,TAU,true);ctx.fill();ctx.restore();
  ctx.save();ctx.beginPath();ctx.rect(-2000,-2000,WORLD+4000,WORLD+4000);ctx.arc(HUB.x,HUB.y,frAnim,0,TAU,true);ctx.clip();ctx.fillStyle='rgba(40,110,150,.24)';for(const P of POCKETS){ctx.beginPath();pathPts(keyhole(P));ctx.fill()}ctx.restore()};
function mouthClip(){ctx.beginPath();ctx.rect(-2000,-2000,WORLD+4000,WORLD+4000);const fr=REG[3].out;
  for(const P of POCKETS){const W=(t,v)=>[HUB.x+t*P.ux-v*P.uy,HUB.y+t*P.uy+v*P.ux],q=[W(fr-14,-PW+6),W(fr+14,-PW+6),W(fr+14,PW-6),W(fr-14,PW-6)];pathPts(q)}ctx.clip('evenodd')}
function label(t,x,y,col,size,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.textAlign='center';ctx.font=F(800,size);txt(t,x,y,col);ctx.restore()}
function ringProg(x,y,r,f,col){ctx.save();ctx.strokeStyle='rgba(23,8,4,.7)';ctx.lineWidth=8;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();
  if(f>0){ctx.strokeStyle=col;ctx.lineWidth=8;ctx.beginPath();ctx.arc(x,y,r,-Math.PI/2,-Math.PI/2+TAU*clamp(f,0,1));ctx.stroke()}ctx.restore()}
function drawCore(x,y,s=1){const pu=.5+Math.sin(time*6)*.5;ctx.save();ctx.fillStyle=`rgba(143,214,255,${.18+.15*pu})`;ctx.beginPath();ctx.arc(x,y,26*s+6*pu,0,TAU);ctx.fill();
  ctx.fillStyle=CORE;ctx.strokeStyle='#170804';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y-14*s);ctx.lineTo(x+11*s,y);ctx.lineTo(x,y+14*s);ctx.lineTo(x-11*s,y);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
const _dwU=drawWorldX;drawWorldX=function(vis){
  const pk=pocketsShown();if(pk){ctx.save();mouthClip()}
  _dwU(vis);if(pk)ctx.restore();if(VLT)return;const R=curReg(),E=mode==='guest'?G.wev:WEV;
  for(const s of SITES){if(s.r>R||!vis(s))continue;const on=E&&Math.abs(E.x-s.x)<120&&Math.abs(E.y-s.y)<120;ctx.save();ctx.globalAlpha=on?.9:.4;
    ctx.strokeStyle=REG[s.r].acc;ctx.lineWidth=3;ctx.setLineDash([10,10]);ctx.beginPath();ctx.arc(s.x,s.y,90,0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#170804';ctx.fillRect(s.x-5,s.y-34,10,34);ctx.fillStyle=REG[s.r].acc;ctx.fillRect(s.x-3,s.y-32,6,6);ctx.restore();label(s.n.toUpperCase(),s.x,s.y+112,REG[s.r].acc,14,on?.95:.5)}
  if(pk)for(const P of POCKETS){ctx.save();ctx.strokeStyle='rgba(143,214,255,.45)';ctx.lineWidth=6;ctx.setLineDash([24,14]);ctx.lineDashOffset=time*16;ctx.beginPath();const k=keyhole(P,0).slice(1,-1),W=(t,v)=>[HUB.x+t*P.ux-v*P.uy,HUB.y+t*P.uy+v*P.ux],sv=Math.sqrt(REG[3].out**2-PW**2),a0=W(sv,-PW),a1=W(sv,PW);ctx.moveTo(a0[0],a0[1]);for(const q of k)ctx.lineTo(q[0],q[1]);ctx.lineTo(a1[0],a1[1]);ctx.stroke();ctx.restore();
    if(vis(P)||vis({x:P.x,y:P.y-PR}))label(P.n.toUpperCase(),P.x,P.y-PR+44,CORE,18,.85),label(P.st>=2?'LOOTED · REFILLS NEXT RUN':'DEEP CACHE · WASTES 50',P.x,P.y-PR+66,'#f6e7d8',13,.6)}
  const V=rcView();if(!V)return;
  if(V.ph===0&&vis(V)){ctx.save();ctx.translate(V.x,V.y);ctx.rotate(-.35);ctx.fillStyle='#2a3a44';ctx.strokeStyle='#170804';ctx.lineWidth=4;rr(-46,-16,92,32,6);ctx.fill();ctx.stroke();
      ctx.fillStyle='#5a6a74';ctx.fillRect(-40,-34,10,24);ctx.fillRect(30,-30,10,20);ctx.restore();drawCore(V.x,V.y-6);ringProg(V.x,V.y,RC_R,V.hp,CORE);
    label('RELAY CORE',V.x,V.y-RC_R-14,CORE,16);label(!V.gs?'GUARDED':V.gl?`${V.gl} GUARD${V.gl>1?'S':''} LEFT`:'STAND HERE TO TAKE IT',V.x,V.y+RC_R+26,'#f6e7d8',13,.85)}
  if(V.ph===2&&vis({x:V.lx,y:V.ly})){drawCore(V.lx,V.ly);label('RELAY CORE · PICK UP',V.lx,V.ly-40,CORE,14)}
  const C=V.c;if(C&&vis(C)){
    if(C.st===1){ctx.save();ctx.strokeStyle=CACHE;ctx.lineWidth=3;ctx.setLineDash([12,9]);ctx.lineDashOffset=-time*20;ctx.beginPath();ctx.arc(C.x,C.y,CACHE_R,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.restore();
      drawCrate({x:C.x,y:C.y,t:3,r:22,dead:0,flash:0,chest:true,hp:1,max:1});ringProg(C.x,C.y,CACHE_R-18,C.hp,'#ff6a3d');
      label('SECOND CACHE · OPTIONAL',C.x,C.y-CACHE_R-12,CACHE,14);label(`Opening calls a horde · ${Math.max(0,Math.ceil(C.t))}s`,C.x,C.y+CACHE_R+22,'#f6e7d8',13,.75)}
    if(C.st>=2){const pu=.5+Math.sin(time*10)*.5;ctx.save();ctx.strokeStyle=`rgba(255,106,61,${.35+.4*pu})`;ctx.lineWidth=6;ctx.setLineDash([18,12]);ctx.beginPath();ctx.arc(C.x,C.y,430,0,TAU);ctx.stroke();ctx.restore();
      drawCrate({x:C.x,y:C.y,t:3,r:22,dead:0,flash:0,chest:true,hp:1,max:1});label(C.st===2?'HORDE INCOMING':`HOLD · ${C.left} LEFT`,C.x,C.y-60,'#ff6a3d',16)}}};

const _edgeU=(...a)=>edgeArrow(...a);
const carrierOf=V=>V&&V.ph===1?players.find(q=>q.id===V.cid):null;
const bankTarget=p=>{let best={x:HUB.x,y:HUB.y,n:'HUB'},bd=Math.hypot(p.x-HUB.x,p.y-HUB.y);for(const o of OUTPOSTS){if(!opOpen(o))continue;const d=dist(p,o);if(d<bd){bd=d;best={x:o.x,y:o.y,n:'OUTPOST'}}}return best};
function relayPill(p,W2,H2,V){const L=HUD_LAYOUT||{},split=views().length>1,tiny=!!L.tiny;if(split&&L.viewIndex>0)return;
  if(enemies.some(e=>!e.dead&&(e.gk||(mode==='guest'&&e.type==='boss'&&e.r>48))&&Math.hypot(e.x-p.x,e.y-p.y)<1400))return;
  const E=mode==='guest'?G.wev:WEV,landscape=W2>=H2;if(E&&landscape&&enemies.some(e=>!e.dead&&e.wb&&Math.hypot(e.x-p.x,e.y-p.y)<1400))return;
  const car=carrierOf(V),C=V.c;let t,col=CORE;
  if(C&&C.st===2){t='HORDE INCOMING';col='#ff6a3d'}else if(C&&C.st===3){t=`HORDE · ${C.left} LEFT`;col='#ff6a3d'}
  else if(V.ph===0)t=!V.gs?'RELAY CORE · GO TO THE SITE':V.gl?`RELAY CORE · ${V.gl} GUARDS`:'RELAY CORE · TAKE IT';
  else if(V.ph===2)t='CORE DROPPED · PICK IT UP';
  else t=car===p?`HOT CORE · BANK IT${V.bonus?' · +50%':''}`:`HOT CORE · COVER ${String((car&&car.name)||'THE CARRIER').toUpperCase()}`;
  const py=H2-(tiny?27:split?31:(W2<H2?166:30)),h=tiny?21:24,y=E?py-h-4:py,maxW=Math.max(84,W2-16);let fs=tiny?9:12;
  ctx.textAlign='center';ctx.font=F(800,fs);while(ctx.measureText(t).width>maxW-18&&fs>7){fs-=.5;ctx.font=F(800,fs)}
  const w=Math.min(maxW,ctx.measureText(t).width+16),cx=W2/2;ctx.fillStyle='rgba(23,8,4,.9)';rr(cx-w/2,y,w,h,h/2);ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.stroke();txt(t,cx,y+h*.72,col)}
const _dhU=drawHud;drawHud=function(p,W2,H2,Zv,v){_dhU(p,W2,H2,Zv,v);if(VLT||!p||state==='menu')return;miniU(p,W2,H2);const V=rcView(),car=carrierOf(V);
  if(car&&p.cx!=null){ctx.save();ctx.translate(W2/2,H2/2);ctx.scale(Zv,Zv);ctx.translate(-p.cx,-p.cy);drawCore(car.x,car.y-(car.r||17)-26,.8);ctx.restore()}
  if(!V||p.dead>0)return;const S=clamp(Math.min(W2,H2)/700,.5,1.15);relayPill(p,W2,H2,V);const vx=p.cx==null?p.x:p.cx,vy=p.cy==null?p.y:p.cy,off=(x,y)=>Math.abs(x-vx)*Zv>W2/2-30||Math.abs(y-vy)*Zv>H2/2-30,edgeArrow=(pp,a,b,c,x,y,...r)=>{if(off(x,y))_edgeU(pp,a,b,c,x,y,...r)};
  if(V.ph===0)edgeArrow(p,W2,H2,S,V.x,V.y,CORE,'CORE',.9);
  else if(V.ph===2)edgeArrow(p,W2,H2,S,V.lx,V.ly,CORE,'CORE',.9);
  else if(car===p&&!inHub(p)&&!opAt(p)){const b=bankTarget(p);edgeArrow(p,W2,H2,S,b.x,b.y,'#7be08f','BANK',.9)}
  if(V.c&&V.c.st===1)edgeArrow(p,W2,H2,S,V.c.x,V.c.y,CACHE,'CACHE',.6)};
function miniU(p,W2,H2){if(VLT)return;const L=HUD_LAYOUT||{},split=views().length>1,ms=L.mapW||Math.round(clamp(W2*(split?.20:.22),72,126));
  const mx=L.mapX==null?W2-ms-10:L.mapX,my=L.mapY||10,V=rcView(),pk=pocketsShown();if(!V&&!pk)return;ctx.save();ctx.beginPath();ctx.rect(mx,my,ms,ms);ctx.clip();
  if(pk){ctx.strokeStyle='rgba(143,214,255,.8)';ctx.lineWidth=1.5;for(const P of POCKETS){ctx.beginPath();const k=keyhole(P);ctx.moveTo(MX(k[0][0]),MY(k[0][1]));for(const q of k)ctx.lineTo(MX(q[0]),MY(q[1]));ctx.stroke();
    if(P.st<2){ctx.fillStyle=CACHE;ctx.fillRect(MX(P.x)-2,MY(P.y)-2,4,4)}}}
  if(V){const car=carrierOf(V),o=V.ph===0?V:V.ph===2?{x:V.lx,y:V.ly}:car;ctx.globalAlpha=.65+Math.sin(time*6)*.35;
    if(o){ctx.fillStyle=CORE;ctx.beginPath();ctx.moveTo(MX(o.x),MY(o.y)-5);ctx.lineTo(MX(o.x)+4,MY(o.y));ctx.lineTo(MX(o.x),MY(o.y)+5);ctx.lineTo(MX(o.x)-4,MY(o.y));ctx.fill()}
    if(V.c){ctx.fillStyle=V.c.st>=2?'#ff6a3d':CACHE;ctx.fillRect(MX(V.c.x)-3,MY(V.c.y)-3,6,6)}ctx.globalAlpha=1}
  ctx.restore()};

if(window.__game)Object.defineProperties(window.__game,Object.getOwnPropertyDescriptors({SITES,RSITES,POCKETS,pocketAt,pocketHold:window.pocketHold,rcTick,pocketTick,siteNear,
  get RC(){return RC},set RC(v){RC=v},get rcView(){return rcView()},relayContract,startEvent,evSpot,EVN,CTD}));
}
