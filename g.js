/* ================= NETWORK (PeerJS: free signaling, data flows peer-to-peer) ================= */
let NET=null;
const G={joy:{on:false,id:null,bx:0,by:0,kx:0,ky:0,dx:0,dy:0},ab:0,boss:null,inT:0,started:false,pmap:new Map(),emap:new Map(),kmap:new Map()};
const ETYPES=Object.keys(ET),CODECH='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',PREFIX='salvagerun-v3-';
const netMsg=t=>{$('netMsg').textContent=t};
function loadPeer(){return new Promise((res,rej)=>{if(window.Peer)return res();const s=document.createElement('script');
  s.src='https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';s.onload=()=>window.Peer?res():rej(new Error('no peer'));s.onerror=()=>rej(new Error('load'));document.head.appendChild(s)})}
const offlineMsg='Online needs internet. Solo and Party work offline.';
function netClose(){if(!NET)return;try{(NET.conns||[]).forEach(c=>c.close());NET.conn&&NET.conn.close();NET.peer&&NET.peer.destroy()}catch(e){}NET=null;
  G.pmap.clear();G.emap.clear();G.kmap.clear();G.started=false}
/* ---------- host ---------- */
function netHost(tries=0){netMsg('Opening a room…');loadPeer().then(()=>{
  const code=Array.from({length:5},()=>CODECH[Math.floor(Math.random()*CODECH.length)]).join('');
  const peer=new Peer(PREFIX+code);NET={peer,conns:[],code,isHost:true,sendT:0,snapN:0};
  peer.on('open',()=>{setupWorld('host',[makePlayer({id:0,name:save.name,char:save.char,skin:save.skin,lv:save.lv})]);state='lobby';
    $('roomCode').textContent=code;lobbyList();showOnly('lobby')});
  peer.on('connection',conn=>{conn.q=[];conn.on('data',d=>hostOnData(conn,d));conn.on('close',()=>hostDrop(conn));conn.on('error',()=>hostDrop(conn))});
  peer.on('error',err=>{if(err.type==='unavailable-id'&&tries<3){netClose();netHost(tries+1)}else{netMsg(err.type==='network'||err.type==='server-error'?offlineMsg:'Could not open a room ('+err.type+')')}});
}).catch(()=>netMsg(offlineMsg))}
function lobbyList(){$('lobbyList').innerHTML=players.map(p=>`<div style="color:${p.col}">${p.name}${p.id===0?'<span class="badge">HOST</span>':''} · ${CHARS[p.char].n}</div>`).join('')+
  `<div style="opacity:.5">${players.length}/4 players</div>`}
const cleanLv=lv=>{const o={};for(const k in UPG)o[k]=clamp(Math.floor((lv&&lv[k])||0),0,UPMAX);return o};
function hostOnData(conn,d){if(!d||!NET)return;const p=players.find(q=>q.id===conn.pid);
  switch(d.t){
    case 'hello':{if(p)return;if(players.length>=4){conn.send({t:'full'});setTimeout(()=>conn.close(),300);return}
      const id=Math.max(...players.map(q=>q.id))+1,ch=CHARS[d.char]?d.char:'scrapper',sk=clamp(d.skin|0,0,SKINS.length-1);
      const np=makePlayer({id,name:String(d.name||'Guest').slice(0,10),remote:true,char:ch,skin:sk,lv:cleanLv(d.lv)});
      if(players.some(q=>q.col===np.col))np.col=['#ff9fd0','#8fd6ff','#b8f28a','#ffd27a'][id%4];
      np.conn=conn;conn.pid=id;players.push(np);respawn(np);NET.conns.push(conn);
      conn.send({t:'welcome',id,crates:crates.map(c=>[Math.round(c.x),Math.round(c.y),c.t]),rivals:rivals.map(r=>r.id)});
      feedTo(null,`${np.name} joined the room`,np.col);if(state==='lobby')lobbyList();break}
    case 'in':if(p){p.input.mx=clamp(+d.mx||0,-1,1);p.input.my=clamp(+d.my||0,-1,1);p.input.ab=d.ab|0}break;
    case 'choose':if(p)applyPick(p,d.k);break;
    case 'lv':if(p){p.lv=cleanLv(d.lv);const b=p.maxHp;recalc(p);if(inHub(p))p.hp+=Math.max(0,p.maxHp-b)}break}}
function hostDrop(conn){if(!NET)return;NET.conns=NET.conns.filter(c=>c!==conn);const i=players.findIndex(q=>q.id===conn.pid);
  if(i>0){const p=players[i];dropScrap(p.x,p.y,p.carry,1.2);players.splice(i,1);feedTo(null,`${p.name} left`,p.col);for(const e of enemies)if(e.type==='collector'&&e.tgtId===p.id)e.dead=true}
  if(state==='lobby')lobbyList()}
const TARGETED={f:3,n:3,s:1,F:1,k:1,v:1,d:1,x:1};
function netQueue(e){if(!NET||!NET.conns)return;const ti=TARGETED[e[0]];
  for(const c of NET.conns){if(ti!=null){const pid=e[ti];if(pid!=null&&pid>=0&&pid!==c.pid)continue}
    else{const p=players.find(q=>q.id===c.pid);if(p&&(Math.abs(e[1]-p.x)>1300||Math.abs(e[2]-p.y)>1300))continue}
    c.q.push(e);if(c.q.length>240)c.q.splice(0,c.q.length-240)}}
function netSend(p,m){try{p.conn&&p.conn.open&&p.conn.send(m)}catch(e){}}
const r2=v=>Math.round(v*100)/100;
function buildSnap(c){const P=players.find(q=>q.id===c.pid);if(!P)return null;const near=(o,r=1300)=>Math.abs(o.x-P.x)<r&&Math.abs(o.y-P.y)<r;const boss=enemies.find(e=>e.type==='boss');
  const s={t:'s',tm:r2(time),st:state==='lobby'?0:1,
    P:players.map(q=>[q.id,q.name,q.col,Math.round(q.x),Math.round(q.y),Math.round(q.hp),Math.round(q.maxHp),q.carry,q.cap,r2(Math.max(0,q.dead)),r2(q.face),q.glow?1:0,q.char,q.abT>0?1:0,
      q.run.lvl,r2(q.run.xp/q.run.next),q.picking?1:0,q.run.perks.saw||0,q.inv>.35?1:0,q.score,r2(heat(q)),q.dashT>0?1:0,q===P?r2(Math.max(0,q.abCd)/q.abCdMax):0,q.hurt>0?r2(q.hurt):0,q.skin]),
    E:enemies.filter(e=>!e.dead&&near(e)).map(e=>[e.id,ETYPES.indexOf(e.type),Math.round(e.x),Math.round(e.y),r2(e.hp/e.max),Math.round(e.r),e.t,e.elite?1:0,e.flash>0?1:0,r2(e.slamT||0),e.dash>0?1:0,Math.round(e.vx),Math.round(e.vy)]),
    R:rivals.map(r=>[r.id,Math.round(r.x),Math.round(r.y),r2(r.hp/r.maxHp),Math.floor(r.carry),r.lvl,r.dead>0?1:0,r.revengeOn,r2(r.chan),r2(r.face),r.bank,r.flash>0?1:0]),
    K:pickups.filter(q=>q.age<999&&near(q,1000)).map(q=>[q.id,q.k==='o'?1:0,Math.round(q.x),Math.round(q.y),q.v]),
    B:bullets.filter(b=>b.life>0&&near(b,900)).map(b=>[Math.round(b.x),Math.round(b.y),Math.round(b.vx),Math.round(b.vy),b.col,b.w]),
    bc:beacon?[Math.round(beacon.x),Math.round(beacon.y),r2(beacon.life),r2(beacon.prog)]:null,bo:boss?[Math.round(boss.x),Math.round(boss.y)]:null,fx:c.q.splice(0)};
  if(NET.snapN%5===0)s.C=crates.map(cr=>[Math.round(cr.x),Math.round(cr.y),cr.t,cr.dead>0?1:0,r2(cr.hp/cr.max)]);
  return s}
function netTick(dt){if(!NET||!NET.isHost)return;NET.sendT-=dt;if(NET.sendT>0)return;NET.sendT=1/15;NET.snapN++;
  for(const c of NET.conns){if(!c.open)continue;const s=buildSnap(c);if(s)try{c.send(s)}catch(e){}}}
/* ---------- guest ---------- */
function netSendHost(m){try{NET&&NET.conn&&NET.conn.open&&NET.conn.send(m)}catch(e){}}
function netJoin(code){if(!/^[A-Z0-9]{5}$/.test(code)){netMsg('A code has 5 characters');return}netMsg('Looking for room '+code+'…');
  loadPeer().then(()=>{const peer=new Peer();NET={peer,isHost:false,conn:null};
    peer.on('open',()=>{const conn=peer.connect(PREFIX+code,{reliable:true,serialization:'json'});NET.conn=conn;
      conn.on('open',()=>conn.send({t:'hello',name:save.name,char:save.char,skin:save.skin,lv:save.lv,v:3}));
      conn.on('data',guestOnData);conn.on('close',()=>netLost('The host closed the room'))});
    peer.on('error',err=>{netMsg(err.type==='peer-unavailable'?'No room with that code':err.type==='network'||err.type==='server-error'?offlineMsg:'Connection failed ('+err.type+')')});
  }).catch(()=>netMsg(offlineMsg))}
function netLost(msg){if(mode!=='guest'&&!(NET&&!NET.isHost))return;backToMenu();showOnly('online');netMsg(msg)}
function guestOnData(d){if(!d)return;
  switch(d.t){
    case 'full':netMsg('That room is full (4/4)');break;
    case 'welcome':mode='guest';myId=d.id;players=[];enemies=[];bullets=[];pickups=[];parts=[];texts=[];feed=[];rings=[];banners={};shakes={};beacon=null;
      d.crates.forEach((c,i)=>{const cr=crates[i];if(!cr)return;cr.x=c[0];cr.y=c[1];cr.t=c[2];cr.r=17;cr.max=cr.hp=1;cr.dead=0;cr.flash=0});
      rivals.length=0;RIVAL_DEF.forEach(([name,col],i)=>{if(d.rivals.includes(i))rivals.push({id:i,name,col,r:16,x:HUB.x,y:HUB.y,tx:HUB.x,ty:HUB.y,hp:1,maxHp:1,carry:0,lvl:0,dead:0,revengeOn:-1,chan:0,face:0,bank:0,flash:0})});
      G.pmap.clear();G.emap.clear();G.kmap.clear();showOnly(null);hudOn(true);state='play';pushFeedLocal('Joined. Waiting for the host to start…','#f5c34d');refreshShop();break;
    case 's':applySnap(d);break;
    case 'ev':ev(d.k,d.a);break;
    case 'bank':{const h=d.h|0;save.bank+=h;save.total+=h;if(h>save.best){if(save.best>0){banners[-1]={t:3,title:'NEW BEST HAUL',sub:`${h} scrap in one trip`};fanfareLocal(587)}save.best=h}persist();refreshShop();break}}}
function applySnap(s){if(mode!=='guest')return;if(Math.abs(s.tm-time)>1)time=s.tm;
  if(s.st&&!G.started){G.started=true;pushFeedLocal('Go. Everyone is a target.','#f5c34d')}
  const seenP=new Set();
  for(const a of s.P){let o=G.pmap.get(a[0]);if(!o){o={isP:true,id:a[0],r:16,x:a[3],y:a[4],flash:0,run:{lvl:1,xp:0,next:1,perks:{}},trip:{t:0},lv:save.lv,joy:a[0]===myId?G.joy:{on:false},pend:[]};G.pmap.set(a[0],o)}
    [o.name,o.col,o.tx,o.ty,o.hp,o.maxHp,o.carry,o.cap,o.dead,o.face,o.glow,o.char,o.abT,o.run.lvl,o.run.xp,o.picking,o.sawN,o.inv,o.score,o.heat,o.dashT,o.abCdR,o.hurt,o.skin]=a.slice(1);
    o.glow=!!o.glow;o.picking=!!o.picking;o.inv=o.inv?1:0;o.trip.t=o.heat*240;o.abCdMax=1;o.abCd=o.abCdR;seenP.add(o.id)}
  for(const k of [...G.pmap.keys()])if(!seenP.has(k))G.pmap.delete(k);players=[...G.pmap.values()];
  const seenE=new Set();
  for(const a of s.E){let o=G.emap.get(a[0]);if(!o){o={id:a[0],x:a[2],y:a[3],max:1};G.emap.set(a[0],o)}
    o.type=ETYPES[a[1]];o.tx=a[2];o.ty=a[3];o.hp=a[4];o.r=a[5];o.t=a[6];o.elite=!!a[7];o.flash=a[8]?.08:0;o.slamT=a[9];o.dash=a[10];o.vx=a[11];o.vy=a[12];o.col=ET[o.type].col;seenE.add(o.id)}
  for(const k of [...G.emap.keys()])if(!seenE.has(k)){const o=G.emap.get(k);G.emap.delete(k)}enemies=[...G.emap.values()];
  for(const a of s.R){const r=rivals.find(q=>q.id===a[0]);if(!r)continue;const wasDead=r.dead;
    [,r.tx,r.ty,r.hp,r.carry,r.lvl,r.dead,r.revengeOn,r.chan,r.face,r.bank,r.flash]=a;r.maxHp=1;r.flash=r.flash?.08:0;if(wasDead&&!r.dead){r.x=r.tx;r.y=r.ty}}
  const seenK=new Set();
  for(const a of s.K){let o=G.kmap.get(a[0]);if(!o){o={id:a[0],x:a[2],y:a[3],age:0};G.kmap.set(a[0],o)}o.k=a[1]?'o':'s';o.tx=a[2];o.ty=a[3];o.v=a[4];seenK.add(o.id)}
  for(const k of [...G.kmap.keys()])if(!seenK.has(k))G.kmap.delete(k);pickups=[...G.kmap.values()];
  bullets=s.B.map(b=>({x:b[0],y:b[1],vx:b[2],vy:b[3],col:b[4],w:b[5],life:.2}));
  beacon=s.bc?{x:s.bc[0],y:s.bc[1],r:72,life:s.bc[2],prog:s.bc[3]}:null;G.boss=s.bo?{x:s.bo[0],y:s.bo[1]}:null;
  if(s.C)s.C.forEach((c,i)=>{const cr=crates[i];if(!cr)return;cr.x=c[0];cr.y=c[1];cr.t=c[2];cr.dead=c[3];cr.max=1;cr.hp=c[4]});
  for(const e of s.fx)applyFx(e)}
function guestUpdate(dt){time+=dt;const k=Math.min(1,dt*12);
  for(const o of players){if(o.tx==null)continue;if(Math.hypot(o.tx-o.x,o.ty-o.y)>300){o.x=o.tx;o.y=o.ty}o.x+=(o.tx-o.x)*k;o.y+=(o.ty-o.y)*k;o.flash-=dt;
    if(o.dashT)parts.push({x:o.x,y:o.y,vx:0,vy:0,life:.25,col:o.col,s:9})}
  for(const o of enemies){o.x+=(o.tx-o.x)*k;o.y+=(o.ty-o.y)*k;o.flash-=dt}
  for(const r of rivals){if(r.tx==null)continue;if(Math.hypot(r.tx-r.x,r.ty-r.y)>300){r.x=r.tx;r.y=r.ty}r.x+=(r.tx-r.x)*k;r.y+=(r.ty-r.y)*k;r.flash-=dt}
  for(const o of pickups){o.x+=(o.tx-o.x)*k;o.y+=(o.ty-o.y)*k}
  for(const b of bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt}bullets=bullets.filter(b=>b.life>0);
  updateFxOnly(dt);
  G.inT-=dt;if(G.inT<=0){G.inT=1/20;let mx=G.joy.dx,my=G.joy.dy;if(keys.w||keys.arrowup)my-=1;if(keys.s||keys.arrowdown)my+=1;if(keys.a||keys.arrowleft)mx-=1;if(keys.d||keys.arrowright)mx+=1;
    const m=Math.hypot(mx,my);if(m>1){mx/=m;my/=m}netSendHost({t:'in',mx:r2(mx),my:r2(my),ab:G.ab})}}
window.__game={get players(){return players},get rivals(){return rivals},get enemies(){return enemies},get pickups(){return pickups},get state(){return state},get mode(){return mode},
  get beacon(){return beacon},crates,update,draw,save:()=>save,startSolo,startParty,endMatch,buy,ability,applyPick,openPause,closePause,keys,G,
  setHeat:(p,v)=>{p.trip.t=v},netHost,netJoin,netTick,guestUpdate,backToMenu,get matchT(){return matchT},set matchT(v){matchT=v},lobbyStart:()=>$('lobbyStart').click()};

