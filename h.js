/* ================= v0.4 LAYER =================
   Party for 2-4 players (grid split screen), gamepads in every mode, invite links, optional TURN relay.
   This file loads last and replaces a few functions from b-g.js (views, draw, readInput, uiTick, renderParty, startParty, netHost, netJoin). */
const VERSION='v0.4';
const PCOL=['#f6e7d8','#ff9fd0','#8fd6ff','#b8f28a'];
const KEYMAP={p1:['w','s','a','d'],p2:['arrowup','arrowdown','arrowleft','arrowright'],p3:['i','k','j','l'],p4:['8','5','4','6']};
const KEYHINT=['WASD + Space','Arrows + Enter','IJKL + O','Numpad 8456 + 0'];
let partyN=2;partyChars=['scrapper','scrapper','scrapper','scrapper'];

/* ---------- views: 1, 2 or 2x2 grid ---------- */
function views(){if(state==='menu')return[{x:0,y:0,w:W,h:H,p:null}];
  const lp=mode==='guest'?[meP()].filter(Boolean):players.filter(p=>!p.remote);
  if(!lp.length)return[{x:0,y:0,w:W,h:H,p:null}];if(lp.length===1)return[{x:0,y:0,w:W,h:H,p:lp[0]}];
  if(lp.length===2)return W>=H?[{x:0,y:0,w:W/2,h:H,p:lp[0]},{x:W/2,y:0,w:W/2,h:H,p:lp[1]}]:[{x:0,y:0,w:W,h:H/2,p:lp[0]},{x:0,y:H/2,w:W,h:H/2,p:lp[1]}];
  return lp.map((p,i)=>({x:(i%2)*W/2,y:Math.floor(i/2)*H/2,w:W/2,h:H/2,p}))}
function draw(){ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#170804';ctx.fillRect(0,0,W,H);
  const vs=views();for(const v of vs)drawView(v);
  if(vs.length===3)drawBoard(W/2,H/2,W/2,H/2);
  ctx.fillStyle='#170804';if(vs.length===2){if(W>=H)ctx.fillRect(W/2-3,0,6,H);else ctx.fillRect(0,H/2-3,W,6)}else if(vs.length>2){ctx.fillRect(W/2-3,0,6,H);ctx.fillRect(0,H/2-3,W,6)}
  if(mode==='party'&&state!=='menu'){const s=Math.max(0,Math.ceil(matchT)),t=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`,cy=vs.length>2?H/2:26;
    ctx.textAlign='center';ctx.font=F(800,24);const w=92;ctx.fillStyle='rgba(23,8,4,.9)';rr(W/2-w/2,cy-18,w,36,12);ctx.fill();txt(t,W/2,cy+8,s<=30?'#ff6a3d':'#f6e7d8')}}
function drawBoard(x,y,w,h){ctx.save();ctx.translate(x,y);ctx.fillStyle='#24100a';ctx.fillRect(0,0,w,h);ctx.textAlign='center';
  ctx.font=F(800,Math.min(40,w*.08));txt('SCOREBOARD',w/2,h*.28,'#f5c34d','#8d1c06');
  [...players].sort((a,b)=>b.score-a.score).forEach((p,i)=>{ctx.font=F(800,Math.min(28,w*.055));txt(`${i+1}. ${p.name}  ◆ ${p.score}`,w/2,h*.28+50+i*40,p.col)});
  ctx.font=F(600,15);txt('Most scrap banked when the clock hits zero wins.',w/2,h*.85,'rgba(246,231,216,.6)');ctx.restore()}

/* ---------- input: keyboard sets per player + gamepads ---------- */
function readInput(p){let mx=0,my=0;
  if(p.remote){mx=p.input.mx||0;my=p.input.my||0;if(p.input.ab!==p.abSeen){p.abSeen=p.input.ab;ability(p)}}
  else{mx=p.joy.dx;my=p.joy.dy;const sets=p.ctrl==='touch'?[KEYMAP.p1,KEYMAP.p2]:[KEYMAP[p.ctrl]].filter(Boolean);
    for(const[u,d,l,r]of sets){if(keys[u])my-=1;if(keys[d])my+=1;if(keys[l])mx-=1;if(keys[r])mx+=1}}
  let m=Math.hypot(mx,my);if(m>1){mx/=m;my/=m;m=1}return[mx,my,m]}
addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;const k=e.key.toLowerCase();
  if(mode==='party'){if(k==='o'){e.preventDefault();abFor(2)}if(k==='0'){e.preventDefault();abFor(3)}}});
const padPrev={};
const pads=()=>{try{return navigator.getGamepads?[...navigator.getGamepads()]:[]}catch(e){return[]}};
function padState(i){const g=pads()[i];if(!g||!g.connected)return null;const dz=v=>Math.abs(v)<.2?0:v;
  let ax=dz(g.axes[0]||0),ay=dz(g.axes[1]||0);const b=n=>!!(g.buttons[n]&&g.buttons[n].pressed);
  if(b(14))ax=-1;if(b(15))ax=1;if(b(12))ay=-1;if(b(13))ay=1;return{ax,ay,b,id:i}}
function edge(i,n,now){const k=i+':'+n,was=padPrev[k];padPrev[k]=now;return now&&!was}
function pollPads(){const lp=mode==='guest'?[meP()].filter(Boolean):players.filter(q=>!q.remote);
  lp.forEach((p,i)=>{const pi=mode==='party'?i:0,s=padState(pi);if(!s)return;const j=mode==='guest'?G.joy:p.joy;
    if(!j.on&&(state==='play'||state==='pick'||state==='pause')){j.dx=s.ax;j.dy=s.ay}
    if(edge(pi,0,s.b(0))&&state==='play')abFor(mode==='party'?i:0);
    if(edge(pi,9,s.b(9))&&mode!=='party'){pauseEl.style.display==='flex'?closePause():openPause()}
    if(pickEl.style.display==='flex'&&(pickFor===p||mode==='guest')){const cs=pickEl.querySelectorAll('.card');
      [[2,0],[3,1],[1,2]].forEach(([btn,ci])=>{if(edge(pi,btn,s.b(btn))&&cs[ci])cs[ci].click()})}});
  if(state==='menu'){const s=padState(0);if(s&&edge(0,0,s.b(0))&&$('menu').style.display==='flex')startSolo()}}

/* ---------- ability buttons: one per party player, in their own screen corner ---------- */
const pBtns=[0,1,2,3].map(i=>{const b=document.createElement('button');b.className='pab';b.setAttribute('aria-label',`Player ${i+1} ability`);
  b.style.cssText=`position:fixed;width:76px;height:76px;border-radius:50%;border:3px solid ${PCOL[i]};display:none;font-weight:800;font-size:14px;letter-spacing:.06em;background:rgba(60,13,3,.85);box-shadow:0 5px 0 #170804;padding:0;color:#f6e7d8`;
  b.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();abFor(i)});document.body.appendChild(b);return b});
function uiTick(){pollPads();const playing=state==='play'||state==='pick'||state==='pause';
  const lp=mode==='guest'?[meP()].filter(Boolean):players.filter(q=>!q.remote);
  const inH=playing&&lp.some(p=>p.dead<=0&&inHub(p));if((shopEl.style.display==='flex')!==inH){shopEl.style.display=inH?'flex':'none';if(inH)refreshShop()}
  const paint=(el,p)=>{if(!playing||!p||p.dead>0||inHub(p)){el.style.display='none';return}el.style.display='block';
    const pr=p.abCd>0?1-p.abCd/p.abCdMax:1;el.textContent=(CHARS[p.char]||CHARS.scrapper).ab;
    el.style.background=`conic-gradient(rgba(245,195,77,.55) ${clamp(pr,0,1)*360}deg, rgba(60,13,3,.85) 0)`;el.style.opacity=pr>=1?1:.7};
  dash2El.style.display='none';
  if(mode==='party'){dashEl.style.display='none';const vs=views();
    pBtns.forEach((b,i)=>{const v=vs[i];if(!v){b.style.display='none';return}b.style.left=(v.x+v.w-96)+'px';b.style.top=(v.y+v.h-100)+'px';paint(b,v.p)})}
  else{pBtns.forEach(b=>b.style.display='none');paint(dashEl,lp[0])}}

/* ---------- party setup for 2-4 ---------- */
function renderParty(){const box=$('party');const cnt=pads().filter(g=>g&&g.connected).length;
  box.querySelector('p').textContent=`One device, split screen. 6 minutes. Most scrap banked wins. You can shoot each other.${cnt?` · 🎮 ${cnt} controller${cnt>1?'s':''} found`:''}`;
  let nr=box.querySelector('.pn');if(!nr){nr=document.createElement('div');nr.className='row2 pn';box.insertBefore(nr,box.querySelector('.pcol'))}
  nr.innerHTML='';[2,3,4].forEach(n=>{const b=document.createElement('button');b.className=n===partyN?'big':'alt';b.textContent=n+' PLAYERS';
    b.addEventListener('click',()=>{partyN=n;renderParty()});nr.appendChild(b)});
  const col=box.querySelector('.pcol');col.innerHTML='';
  for(let i=0;i<partyN;i++){const d=document.createElement('div');d.innerHTML=`<h3 style="color:${PCOL[i]}">P${i+1}</h3><div class="chars"></div><small style="opacity:.6">${KEYHINT[i]} · 🎮 ${i+1} · touch: own screen part</small>`;
    col.appendChild(d);charButtons(d.querySelector('.chars'),partyChars[i],k=>{partyChars[i]=k;renderParty()})}
  if(partyN>2&&W<700)box.querySelector('p').textContent+=' · 3-4 players works best on a tablet or laptop.'}
function startParty(){initAudio();showOnly(null);hudOn(true);
  const ps=[];for(let i=0;i<partyN;i++)ps.push(makePlayer({id:i,name:'P'+(i+1),ctrl:'p'+(i+1),char:partyChars[i],skin:i===0?save.skin:0,col:i===0?null:PCOL[i],lv:save.lv,ox:(i-(partyN-1)/2)*50}));
  setupWorld('party',ps);if(partyN>=4)makeRivals(3);state='play';pushFeedLocal(`${partyN} players · 6 minutes · most scrap banked wins`,'#f5c34d')}
for(const id of ['partyStart','resAgain']){const o=$(id);if(o&&o.cloneNode){const n=o.cloneNode(true);o.replaceWith(n);n.addEventListener('click',startParty)}}

/* ---------- online: invite links + optional TURN relay ---------- */
const peerOpts=()=>{const ice=window.SALVAGE_ICE;return ice&&ice.length?{config:{iceServers:[{urls:'stun:stun.l.google.com:19302'},...ice]}}:{}};
function netHost(tries=0){netMsg('Opening a room…');loadPeer().then(()=>{
  const code=Array.from({length:5},()=>CODECH[Math.floor(Math.random()*CODECH.length)]).join('');
  const peer=new Peer(PREFIX+code,peerOpts());NET={peer,conns:[],code,isHost:true,sendT:0,snapN:0};
  peer.on('open',()=>{setupWorld('host',[makePlayer({id:0,name:save.name,char:save.char,skin:save.skin,lv:save.lv})]);state='lobby';
    $('roomCode').textContent=code;lobbyList();showOnly('lobby')});
  peer.on('connection',conn=>{conn.q=[];conn.on('data',d=>hostOnData(conn,d));conn.on('close',()=>hostDrop(conn));conn.on('error',()=>hostDrop(conn))});
  peer.on('error',err=>{if(err.type==='unavailable-id'&&tries<3){netClose();netHost(tries+1)}else{netMsg(err.type==='network'||err.type==='server-error'?offlineMsg:'Could not open a room ('+err.type+')')}});
}).catch(()=>netMsg(offlineMsg))}
function netJoin(code){if(!/^[A-Z0-9]{5}$/.test(code)){netMsg('A code has 5 characters');return}netMsg('Looking for room '+code+'…');
  loadPeer().then(()=>{const peer=new Peer(peerOpts());NET={peer,isHost:false,conn:null};
    peer.on('open',()=>{const conn=peer.connect(PREFIX+code,{reliable:true,serialization:'json'});NET.conn=conn;
      conn.on('open',()=>conn.send({t:'hello',name:save.name,char:save.char,skin:save.skin,lv:save.lv,v:4}));
      conn.on('data',guestOnData);conn.on('close',()=>netLost('The host closed the room'))});
    peer.on('error',err=>{netMsg(err.type==='peer-unavailable'?'No room with that code':err.type==='network'||err.type==='server-error'?offlineMsg:'Connection failed ('+err.type+')')});
  }).catch(()=>netMsg(offlineMsg))}
const inviteUrl=code=>/^https?:/.test(location.protocol)?location.origin+location.pathname+'?join='+code:null;
(()=>{const lob=$('lobby'),rc=$('roomCode');if(!lob||!rc)return;const b=document.createElement('button');b.className='alt';b.id='shareBtn';b.textContent='SHARE INVITE';
  const note=document.createElement('p');note.id='shareNote';note.style.fontSize='14px';
  b.addEventListener('click',()=>{const code=NET&&NET.code;if(!code)return;const url=inviteUrl(code),text=`Join my Salvage Run room: ${code}`;
    if(navigator.share)navigator.share(url?{title:'Salvage Run',text,url}:{title:'Salvage Run',text}).catch(()=>{});
    else if(navigator.clipboard)navigator.clipboard.writeText(url||code).then(()=>{note.textContent='Invite copied'}).catch(()=>{note.textContent='Code: '+code});
    else note.textContent=url||code});
  if(rc.after){rc.after(b);b.after(note)}else{lob.appendChild(b);lob.appendChild(note)}})();
(()=>{try{const j=new URLSearchParams(location.search||'').get('join');if(j&&/^[A-Za-z0-9]{5}$/.test(j)){showOnly('online');$('nameIn').value=save.name;$('codeIn').value=j.toUpperCase();
  netMsg(`Invite for room ${j.toUpperCase()} · tap JOIN`)}}catch(e){}})();
document.title='Salvage Run · '+VERSION;
if(window.__game)Object.assign(window.__game,{startParty,netHost,netJoin,draw,views,uiTick,renderParty,setPartyN:n=>{partyN=n},get partyN(){return partyN}});
