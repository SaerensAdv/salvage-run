/* ================= INPUT ================= */
const ptrOwner={};
function ownerAt(x,y){if(mode==='guest')return meP();const lp=players.filter(q=>!q.remote);if(lp.length===1)return lp[0];
  for(const v of views())if(x>=v.x&&x<v.x+v.w&&y>=v.y&&y<v.y+v.h)return v.p;return null}
cv.addEventListener('pointerdown',e=>{if(state!=='play'&&!(state==='pick'&&!pausing()))return;const p=ownerAt(e.clientX,e.clientY);if(!p)return;const j=p.joy;if(j.on)return;
  j.on=true;j.id=e.pointerId;j.bx=j.kx=e.clientX;j.by=j.ky=e.clientY;j.dx=j.dy=0;ptrOwner[e.pointerId]=p;try{cv.setPointerCapture(e.pointerId)}catch(_){}});
cv.addEventListener('pointermove',e=>{const p=ptrOwner[e.pointerId];if(!p)return;const j=p.joy;let dx=e.clientX-j.bx,dy=e.clientY-j.by;const m=Math.hypot(dx,dy),R=58;
  if(m>R){j.bx+=dx/m*(m-R);j.by+=dy/m*(m-R);dx=dx/m*R;dy=dy/m*R}j.kx=j.bx+dx;j.ky=j.by+dy;j.dx=dx/R;j.dy=dy/R});
const endPtr=e=>{const p=ptrOwner[e.pointerId];if(p){p.joy.on=false;p.joy.id=null;p.joy.dx=p.joy.dy=0;delete ptrOwner[e.pointerId]}};
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
function releaseAll(){for(const k in ptrOwner){const p=ptrOwner[k];p.joy.on=false;p.joy.dx=p.joy.dy=0;delete ptrOwner[k]}}
function abFor(slot){if(state!=='play'&&!(state==='pick'&&!pausing()))return;if(mode==='guest'){G.ab++;return}
  const lp=players.filter(q=>!q.remote);const p=mode==='party'?lp[slot]:lp[0];if(p)ability(p)}
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(e.target&&e.target.tagName==='INPUT')return;keys[k]=true;
  if(k===' '||k==='shift'||(k==='f'&&mode==='party')){e.preventDefault();abFor(0)}
  if(k==='enter'&&mode==='party'){e.preventDefault();abFor(1)}
  if(k==='m')toggleMute();
  if(k==='escape'||k==='p'){pauseEl.style.display==='flex'?closePause():openPause()}
  if(pickEl.style.display==='flex'&&'123'.includes(k)){const c=pickEl.querySelectorAll('.card')[+k-1];c&&c.click()}});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});

/* ================= UI ================= */
const shopEl=$('shop'),shopRow=shopEl.querySelector('.row'),pickEl=$('pick'),pauseEl=$('pause'),dashEl=$('dash'),dash2El=$('dash2'),muteEl=$('mute');
const shopBtns={};
for(const k in UPG){const b=document.createElement('button');b.innerHTML=`<b>${UPG[k].n}</b><i>LV 0</i><span>◆ 0</span>`;
  b.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();buy(k)});shopRow.appendChild(b);shopBtns[k]=b}
function refreshShop(){for(const k in shopBtns){const b=shopBtns[k],mx=save.lv[k]>=UPMAX,c=cost(k);b.querySelector('i').textContent='LV '+save.lv[k];
  b.querySelector('span').textContent=mx?'MAX':'◆ '+c;b.classList.toggle('max',mx);b.classList.toggle('no',!mx&&save.bank<c)}}
function buy(k){if(save.lv[k]>=UPMAX)return;const c=cost(k);if(save.bank<c){beep(140,.12,'sawtooth',.03);return}
  save.bank-=c;save.lv[k]++;beep(520,.08,'triangle',.05);setTimeout(()=>beep(780,.12,'triangle',.05),70);vibLocal(20);
  if(mode==='guest')netSendHost({t:'lv',lv:save.lv});
  else for(const p of players)if(!p.remote&&p.lv===save.lv){const before=p.maxHp;recalc(p);if(k==='hp')p.hp+=p.maxHp-before;burst(p.x,p.y,'#f5c34d',26,260);texts.push({x:p.x,y:p.y-34,txt:UPG[k].n.toUpperCase()+' '+save.lv[k],col:'#f5c34d',size:20,life:.9})}
  ev('upgrade',totalLv());if(mode==='solo'&&save.ftue===4)ftueNext();persist();refreshShop()}
function toggleMute(){muted=!muted;muteEl.textContent=muted?'×':'♪'}
muteEl.addEventListener('pointerdown',e=>{e.stopPropagation();toggleMute()});
$('menuBtn').addEventListener('pointerdown',e=>{e.stopPropagation();openPause()});
dashEl.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();abFor(mode==='party'?1:0)});
dash2El.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();abFor(0)});
function uiTick(){const playing=state==='play'||state==='pick'||state==='pause';
  const lp=mode==='guest'?[meP()].filter(Boolean):players.filter(q=>!q.remote);
  const inH=playing&&lp.some(p=>p.dead<=0&&inHub(p));if((shopEl.style.display==='flex')!==inH){shopEl.style.display=inH?'flex':'none';if(inH)refreshShop()}
  const btn=(el,p)=>{if(!playing||!p||p.dead>0||inHub(p)){el.style.display='none';return}el.style.display='block';
    const pr=p.abCd>0?1-p.abCd/p.abCdMax:1;el.textContent=(CHARS[p.char]||CHARS.scrapper).ab;
    el.style.background=`conic-gradient(rgba(245,195,77,.55) ${clamp(pr,0,1)*360}deg, rgba(60,13,3,.85) 0)`;el.style.opacity=pr>=1?1:.7};
  if(mode==='party'){btn(dash2El,lp[0]);btn(dashEl,lp[1]);
    if(W>=H){dash2El.style.left='22px';dash2El.style.right='';dash2El.style.top='';dash2El.style.bottom='26px'}
    else{dash2El.style.left='';dash2El.style.right='22px';dash2El.style.bottom='';dash2El.style.top=(H/2-110)+'px'}}
  else{btn(dashEl,lp[0]);dash2El.style.display='none'}}

/* ---- perk cards ---- */
let pickFor=null;
function openPickUI(p,opts,free,lvl){pickFor=p;if(pausing())state='pick';releaseAll();
  pickEl.querySelector('.pt').textContent=(mode==='party'?p.name+' · ':'')+(free?'SALVAGED TECH':`LEVEL ${lvl||p.run.lvl}`);
  pickEl.querySelector('.pt').style.color=mode==='party'?p.col:'';
  pickEl.querySelector('.ps').textContent=pausing()?'Pick one. It dies with you.':'You\'re shielded while you choose · 8 s';
  pickEl.style.background=pausing()?'':'rgba(23,8,4,.55)';
  const cards=pickEl.querySelector('.cards');cards.innerHTML='';
  opts.forEach(k=>{const d=PERKS[k]||SPECIAL[k],c=document.createElement('button');c.className='card r'+d.r;
    const have=mode==='guest'?0:(p.run.perks[k]||0);
    c.innerHTML=`<span class="rar">${RAR[d.r]}</span><b>${d.n}</b><p>${d.d}</p>${PERKS[k]?`<span class="stk">${mode==='guest'?'':(have+1)+'/'+d.max}</span>`:''}`;
    c.addEventListener('click',()=>{if(mode==='guest'){netSendHost({t:'choose',k});closePickUI(p)}else applyPick(p,k)});cards.appendChild(c)});
  pickEl.style.display='flex';fanfareLocal(free?660:523)}
function closePickUI(p){if(pickFor!==p&&pickFor)return;pickEl.style.display='none';pickFor=null;if(state==='pick')state='play'}
function guestPick(opts,free,lvl){const me=meP();if(me)openPickUI(me,opts,free,lvl)}

/* ---- pause / missions ---- */
function goalHtml(label,p,n,done){const pr=Math.min(p,n);return `<div class="goal${done?' done':''}"><div class="gl"><span>${done?'✓ ':''}${label}</span><span>${Math.floor(pr)}/${n}</span></div>
  <div class="gbar"><i style="width:${pr/n*100}%"></i></div></div>`}
function openPause(){if(!(state==='play'||state==='pause'))return;if(pausing())state='pause';releaseAll();const R=RANKS[save.rank],d=save.daily;
  let h=`<h2>Rank ${save.rank+1} · ${RANK_NAMES[save.rank]}</h2>`;
  if(R)h+=`<h3>MASTERY · unlocks ${unlockLabel(R.u)}</h3>`+R.g.map((g,i)=>goalHtml(g[2],save.gp[i],g[1],save.gp[i]>=g[1])).join('');
  else h+=`<div class="note">Every rank cleared. You are the Salvage Legend.</div>`;
  h+=`<h3>DAILY · streak ${d.streak}</h3>`+d.m.map(m=>goalHtml(`${m.label} · +${m.r}`,m.p,m.n,m.done)).join('');
  h+=`<div class="note">All 3 = bonus chest (+100, every 5th streak day +300). Missed a day? The streak pauses, it never resets.</div>`;
  if(mode==='solo'){h+=`<h3>SKIN</h3><div class="skins">`+SKINS.map((s,i)=>`<button data-s="${i}" class="${i===save.skin?'on':''}${skinUnlocked(i)?'':' lock'}" style="background:${s[1]}" aria-label="${s[0]}"></button>`).join('')+`</div>`}
  const me=meP();if(me&&mode!=='guest'){const pk=Object.keys(me.run.perks);h+=`<h3>THIS RUN · LV ${me.run.lvl}</h3><div class="note">${pk.length?pk.map(k=>`${PERKS[k].n} ×${me.run.perks[k]}`).join(' · '):'No perks yet. Kill things.'}</div>`}
  h+=`<div class="note">Lifetime: ${save.stats.kills} kills · ${save.stats.raiders} raiders wrecked · ${save.stats.bosses} Golden Brutes · ${save.stats.deaths} deaths</div>`;
  if(!pausing())h+=`<div class="note">Online games don't pause. You're still out there.</div>`;
  h+=`<button class="big" id="resume">RESUME</button><button class="link" id="quit">quit to menu</button>`;
  pauseEl.querySelector('.pbox').innerHTML=h;pauseEl.style.display='flex';
  pauseEl.querySelectorAll('.skins button').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.s;if(!skinUnlocked(i))return;save.skin=i;persist();
    const p=players[0];if(p){p.skin=i;p.col=SKINS[i][1]}openPause()}));
  $('resume').addEventListener('click',closePause);$('quit').addEventListener('click',()=>{closePause();backToMenu()})}
function closePause(){pauseEl.style.display='none';if(state==='pause')state='play'}

/* ---- menu, party, results ---- */
function charButtons(el,sel,onPick){el.innerHTML='';for(const k in CHARS){const c=CHARS[k],b=document.createElement('button'),ok=charUnlocked(k);
  b.className=(k===sel?'on':'')+(ok?'':' lock');b.innerHTML=`<b>${c.n}</b><span>${ok?c.ab:'rank '+(c.unlock+1)}</span>`;
  b.addEventListener('click',()=>{if(ok)onPick(k)});el.appendChild(b)}}
function renderCharPick(){charButtons($('charPick'),save.char,k=>{save.char=k;persist();renderCharPick()})}
function menuMeta(){const d=save.daily,done=d.m.filter(m=>m.done).length;
  $('menuMeta').innerHTML=`Rank ${save.rank+1} · ${RANK_NAMES[save.rank]} · ${CHARS[save.char].d}<br>Daily ${done}/3 · streak ${d.streak} · best haul ${save.best}`}
function showOnly(id){['menu','party','online','lobby','results'].forEach(x=>$(x).style.display=x===id?'flex':'none')}
function hudOn(on){$('hudBtns').style.display=on?'flex':'none'}
function startSolo(){initAudio();showOnly(null);hudOn(true);save.stats.runs++;
  setupWorld('solo',[makePlayer({id:0,name:save.name,char:save.char,skin:save.skin,lv:save.lv})]);state='play';
  if(save.ftue>=5)pushFeedLocal('Bank before you get greedy. Or don\'t.','#f5c34d');refreshShop()}
let partyChars=['scrapper','scrapper'];
function renderParty(){charButtons($('p1c'),partyChars[0],k=>{partyChars[0]=k;renderParty()});charButtons($('p2c'),partyChars[1],k=>{partyChars[1]=k;renderParty()})}
function startParty(){initAudio();showOnly(null);hudOn(true);
  setupWorld('party',[makePlayer({id:0,name:'P1',ctrl:'p1',char:partyChars[0],skin:save.skin,lv:save.lv,ox:-40}),
    makePlayer({id:1,name:'P2',ctrl:'p2',char:partyChars[1],col:'#ff9fd0',lv:save.lv,ox:40})]);state='play';
  pushFeedLocal('6 minutes. Most scrap banked wins. Shoot each other.','#f5c34d')}
function endMatch(){state='over';releaseAll();const ps=[...players].sort((a,b)=>b.score-a.score),tie=ps[0].score===ps[1].score,tot=ps.reduce((s,p)=>s+p.score,0);
  save.bank+=tot;save.total+=tot;persist();fanfareLocal(392);
  $('resTitle').textContent=tie?'DRAW':`${ps[0].name} WINS`;$('resTitle').style.color=tie?'':ps[0].col;
  $('resBody').innerHTML=players.map(p=>`<div style="color:${p.col}">${p.name} · ◆ ${p.score} banked · ${p.kills} kills</div>`).join('')+`<div style="opacity:.7;font-size:15px;margin-top:8px">+${tot} scrap added to this device's safe bank</div>`;
  showOnly('results');hudOn(false)}
function backToMenu(){netClose();state='menu';mode='solo';players=[];enemies=[];bullets=[];pickups=[];releaseAll();pickEl.style.display='none';pauseEl.style.display='none';
  hudOn(false);showOnly('menu');renderCharPick();menuMeta()}
$('go').addEventListener('click',startSolo);
$('goParty').addEventListener('click',()=>{renderParty();showOnly('party')});
$('partyStart').addEventListener('click',startParty);
$('goOnline').addEventListener('click',()=>{$('nameIn').value=save.name;$('netMsg').textContent='';showOnly('online')});
document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>showOnly('menu')));
$('resAgain').addEventListener('click',startParty);$('resMenu').addEventListener('click',backToMenu);
$('nameIn').addEventListener('change',()=>{save.name=($('nameIn').value||'').trim().slice(0,10)||save.name;persist()});
$('hostBtn').addEventListener('click',()=>{save.name=($('nameIn').value||'').trim().slice(0,10)||save.name;persist();initAudio();netHost()});
$('joinBtn').addEventListener('click',()=>{save.name=($('nameIn').value||'').trim().slice(0,10)||save.name;persist();initAudio();netJoin(($('codeIn').value||'').trim().toUpperCase())});
$('lobbyStart').addEventListener('click',()=>{showOnly(null);hudOn(true);state='play';feedTo(null,'Room is live. Everyone is a target.','#f5c34d')});
$('lobbyBack').addEventListener('click',backToMenu);
$('reset').addEventListener('click',()=>{save=freshSave();ensureDaily();persist();renderCharPick();menuMeta();$('reset').textContent='progress reset'});
renderCharPick();menuMeta();
if('serviceWorker' in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});

/* ================= LOOP ================= */
let last=performance.now();
function loop(now){const rdt=Math.min(.033,(now-last)/1000);last=now;fdt=rdt;
  if(mode==='guest'){if(state==='play'||state==='pick'||state==='pause')guestUpdate(rdt)}
  else if(state==='play'||(!pausing()&&(state==='pick'||state==='pause')))update(rdt);
  if(mode==='host'&&NET)netTick(rdt);
  uiTick();const me=meP(),act=state==='play'||state==='pick';musicTick(me&&act?(inHub(me)?.08:.25+heat(me)*.75):0,act);
  draw();requestAnimationFrame(loop)}
requestAnimationFrame(loop);
