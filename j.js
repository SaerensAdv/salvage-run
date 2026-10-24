/* ================= v0.6 LAYER: GEAR FOUNDATION =================
   4 slots (weapon, armor, boots, backpack), 3 rarities, item level, affixes, stash, hot loot.
   Found gear is HOT: bank it (hub or beacon) to keep it, die and it drops. Equipped gear is always safe.
   Gear counts in Solo and Co-op raids. Online free-for-all keeps your weapon type but ignores gear stats (fair fights).
   Party (one device) plays without gear. Workshop upgrades stay as the account layer for now. Graphics stay simple on purpose. */
const GRAR=[['Common','#c9b8aa'],['Uncommon','#7be08f'],['Rare','#5aa9ff']];
const SLOTS=['weapon','armor','boots','pack'],SLOT_N={weapon:'Weapon',armor:'Armor',boots:'Boots',pack:'Backpack'},SLOT_L={weapon:'W',armor:'A',boots:'B',pack:'P'};
const BASES={
  weapon:{blaster:['Blaster','Steady auto-fire'],scatter:['Scattergun','3 pellets, short range'],rail:['Rail','Slow, heavy, pierces 1'],burst:['Burst SMG','Fast, light, sprays']},
  armor:{plate:['Plate','More hull'],vest:['Vest','Takes less damage'],coat:['Heat Coat','Heat builds slower']},
  boots:{runners:['Runners','More speed'],jumpers:['Jumpers','Faster ability'],treads:['Treads','Hull and a bit of speed']},
  pack:{satchel:['Satchel','Bigger bag'],hauler:['Hauler','Huge bag, a bit slower'],courier:['Courier','Bigger magnet']}};
const AFX={dmg:['Damage','%',4,8],rate:['Fire rate','%',3,7],crit:['Crit chance','%',2,5],range:['Range','%',4,8],hp:['Hull','',8,18],armor:['Armor','%',2,5],
  heat:['Heat resist','%',4,8],spd:['Speed','%',2,5],cd:['Ability cooldown','%',3,7],mag:['Magnet','%',6,12],bag:['Bag','',5,12],scrap:['Scrap find','%',3,7]};
const SLOT_AFX={weapon:['dmg','rate','crit','range'],armor:['hp','armor','heat'],boots:['spd','cd','hp'],pack:['bag','mag','scrap']};
const CAPS={dmg:150,rate:90,crit:40,range:80,hp:500,armor:50,heat:60,spd:60,cd:50,mag:200,bag:250,scrap:60};
const RW6={crate:[null,[80,18,2],[68,27,5],[52,36,12]],elite:[35,43,22],raider:[55,35,10],boss:[0,45,55]};
const DROPC={crate:[0,.02,.035,.06],elite:.2,raider:.1};
const PITY=15,STASH_MAX=40;
const rmul=r=>[1,1.2,1.4][r]||1;
const acctLv=()=>1+save.rank+Math.floor(totalLv()/5);
const iid=()=>'i'+Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36);
function itemName(it){return `${GRAR[it.rar][0]} ${BASES[it.slot][it.b][0]}`}
function makeItem(rar,il,slot,b){slot=slot||SLOTS[Math.floor(Math.random()*SLOTS.length)];const bs=Object.keys(BASES[slot]);b=b||bs[Math.floor(Math.random()*bs.length)];
  const pool=SLOT_AFX[slot].slice(),a={};for(let i=0;i<rar+1&&pool.length;i++){const k=pool.splice(Math.floor(Math.random()*pool.length),1)[0],[,,lo,hi]=AFX[k];a[k]=Math.round(rand(lo,hi)*(1+.02*il)*10)/10}
  const it={id:iid(),slot,b,rar,il,a};it.name=itemName(it);return it}
function baseStats(it){const s=(1+.02*it.il)*rmul(it.rar),o={};
  switch(it.b){case 'blaster':case 'scatter':case 'rail':case 'burst':o.dmg=5*s;break;
    case 'plate':o.hp=15*s;break;case 'vest':o.armor=4*s;break;case 'coat':o.heat=6*s;break;
    case 'runners':o.spd=4*s;break;case 'jumpers':o.cd=5*s;break;case 'treads':o.hp=8*s;o.spd=1.5*s;break;
    case 'satchel':o.bag=8*s;break;case 'hauler':o.bag=16*s;o.spd=-5;break;case 'courier':o.mag=12*s;break}return o}
function itemStats(it){const o=baseStats(it);for(const k in it.a)o[k]=(o[k]||0)+it.a[k];return o}
const itemPower=it=>it?Math.round(10*(1+.02*it.il)*rmul(it.rar)*(1+.08*Object.keys(it.a).length)):0;
function cleanItem(x){if(!x||!SLOTS.includes(x.slot)||!BASES[x.slot][x.b])return null;const rar=clamp(x.rar|0,0,2),il=clamp(x.il|0,1,60),a={};
  if(x.a&&typeof x.a==='object')for(const k of SLOT_AFX[x.slot])if(x.a[k]!=null)a[k]=clamp(+x.a[k]||0,0,AFX[k][3]*3);
  const it={id:String(x.id||iid()).replace(/[^a-z0-9]/gi,'').slice(0,24)||iid(),slot:x.slot,b:x.b,rar,il,a};it.name=itemName(it);return it}
function ensureGear(){if(!Array.isArray(save.stash))save.stash=[];save.stash=save.stash.map(cleanItem).filter(Boolean);
  if(!save.equip||typeof save.equip!=='object')save.equip={};if(save.pity==null)save.pity=0;
  if(!save.stash.some(i=>i.slot==='weapon')){const st={id:iid(),slot:'weapon',b:'blaster',rar:0,il:1,a:{}};st.name=itemName(st);save.stash.unshift(st);save.equip.weapon=st.id}
  for(const s of SLOTS)if(save.equip[s]&&!save.stash.some(i=>i.id===save.equip[s]))save.equip[s]=null}
const equipped=s=>save.stash.find(i=>i.id===save.equip[s])||null;
function gearTotals(){const gs=gearScore();const st={};let wb='blaster';for(const s of SLOTS){const it=equipped(s);if(!it)continue;if(s==='weapon')wb=it.b;const o=itemStats(it);for(const k in o)st[k]=(st[k]||0)+o[k]}
  for(const k in st)st[k]=clamp(st[k],-30,CAPS[k]);return{wb,st,gs}}
const gearScore=()=>Math.round(SLOTS.reduce((s,k)=>s+itemPower(equipped(k)),0)/SLOTS.length);
let gearSig=1;const bumpGear=()=>{gearSig++;persist();if(mode==='guest')sendGear()};
function sendGear(){const g=gearTotals();netSendHost({t:'gear',wb:g.wb,st:g.st,gs:g.gs})}

/* ---------- applying gear to a player ---------- */
const _rc6=recalc;
recalc=function(p){_rc6(p);const g=p.gear;p.armor=0;p.heatRes=0;p.scrapF=0;p.wb=g?g.wb:'blaster';p.gs=g&&!g.norm?(g.gs||0):0;if(!g)return;
  const m=g.norm?{}:g.st;p.dmg*=1+(m.dmg||0)/100;p.rate*=1+(m.rate||0)/100;p.crit+=(m.crit||0)/100;p.range*=1+(m.range||0)/100;p.maxHp+=Math.round(m.hp||0);
  p.spd*=1+(m.spd||0)/100;p.abCdMax*=1-(m.cd||0)/100;p.mag*=1+(m.mag||0)/100;p.cap+=Math.round(m.bag||0);
  p.armor=(m.armor||0)/100;p.heatRes=(m.heat||0)/100;p.scrapF=(m.scrap||0)/100;
  const w=p.wb;if(w==='scatter'){p.dmg*=.42;p.rate*=.8;p.range*=.72}else if(w==='rail'){p.dmg*=2.2;p.rate*=.45;p.range*=1.3}else if(w==='burst'){p.dmg*=.6;p.rate*=1.75;p.range*=.9}};
const _vo6=volley;
volley=function(p,t){const w=p.wb;
  if(w==='scatter'){const a=Math.atan2(t.y-p.y,t.x-p.x),d=Math.hypot(t.x-p.x,t.y-p.y)||1;for(const o of[-.2,0,.2])_vo6(p,{x:p.x+Math.cos(a+o)*d,y:p.y+Math.sin(a+o)*d});return}
  const n0=bullets.length;_vo6(p,t);
  if(w==='rail')for(let i=n0;i<bullets.length;i++){const b=bullets[i];b.pierce+=1;b.w=7;b.vx*=1.4;b.vy*=1.4;b.life/=1.4}
  else if(w==='burst')for(let i=n0;i<bullets.length;i++){const b=bullets[i],a=rand(-.12,.12),c=Math.cos(a),s=Math.sin(a),vx=b.vx;b.vx=vx*c-b.vy*s;b.vy=vx*s+b.vy*c;b.w=3}};
const _hp6=hitPlayer;hitPlayer=function(p,dmg,by){_hp6(p,dmg*(1-(p.armor||0)),by)};
let lastBy=null;
const _me6=makeEnemy;makeEnemy=function(type,x,y,t,p){const e=_me6(type,x,y,t,p);const gs=p?p.gs||0:Math.max(0,...players.map(q=>q.gs||0));
  if(gs>0&&type!=='collector'){const k=1+.011*gs;e.hp*=k;e.max*=k;e.dmg*=1+.006*gs}return e};
const _ds6=dropScrap;dropScrap=function(x,y,total,spread){_ds6(x,y,total*(1+((lastBy&&lastBy.scrapF)||0)),spread)};

/* ---------- wloot in the world ---------- */
let wloot=[],lid=0;
const lootOn=()=>mode==='solo'||mode==='host';
function rollRar(w){if(save.pity>=PITY-1){save.pity=0;return 2}let tot=w[0]+w[1]+w[2],x=Math.random()*tot,r=0;for(;r<2;r++){x-=w[r];if(x<=0)break}
  if(r===2)save.pity=0;else save.pity++;return r}
function spawnLoot(x,y,it){const a=rand(0,TAU);wloot.push({id:++lid,x,y,vx:Math.cos(a)*140,vy:Math.sin(a)*140,age:0,it});if(wloot.length>60)wloot.shift()}
function dropItem(x,y,w,ilBonus){if(!lootOn()||ftueOn())return;const rar=rollRar(w),il=clamp(acctLv()+ilBonus+Math.round(rand(-2,2)),1,60);spawnLoot(x,y,makeItem(rar,il));dirty=true}
const _he6=hitEnemy;
hitEnemy=function(e,dmg,by,src,crit){const was=e.dead;lastBy=by;_he6(e,dmg,by,src,crit);lastBy=null;
  if(!e.dead||was||!by||!by.isP||!lootOn())return;const t=e.t||3;
  if(e.prime){for(let i=0;i<2;i++)dropItem(e.x,e.y,[0,0,1],9)}
  else if(e.type==='boss')dropItem(e.x,e.y,RW6.boss,8);
  else if(e.elite&&Math.random()<DROPC.elite)dropItem(e.x,e.y,RW6.elite,[0,0,3,6][t])};
const _hc6=hitCrate;
hitCrate=function(c,dmg,by){const was=c.dead>0;lastBy=by;_hc6(c,dmg,by);lastBy=null;if(was||c.dead<=0||!by||!by.isP||!lootOn())return;
  if(!save.firstDrop&&!ftueOn()&&mode==='solo'){save.firstDrop=true;spawnLoot(c.x,c.y,makeItem(1,acctLv()));bannerTo(by,'GEAR DROP','Walk over it, then bank it to keep it',3.5);return}
  if(Math.random()<DROPC.crate[c.t])dropItem(c.x,c.y,RW6.crate[c.t],[0,0,3,6][c.t])};
const _hr6=hitRival;
hitRival=function(r,dmg,by){const was=r.dead>0;_hr6(r,dmg,by);if(!was&&r.dead>0&&by&&by.isP&&Math.random()<DROPC.raider)dropItem(r.x,r.y,RW6.raider,[0,0,3,6][tierAt(r.x,r.y)])};
const _kp6=killPlayer;
killPlayer=function(p,by){if(p.hot&&p.hot.length){for(const it of p.hot)spawnLoot(p.x,p.y,it);feedTo(p,`You dropped ${p.hot.length} hot item${p.hot.length>1?'s':''}. Go get ${p.hot.length>1?'them':'it'} back.`,'#ff6a3d');p.hot=[]}_kp6(p,by)};
function addToStash(it){ensureGear();if(save.stash.length>=STASH_MAX){const v=scrapValue(it);save.bank+=v;save.total+=v;pushFeedLocal(`Stash full · ${it.name} scrapped for ${v}`,'#ed9b49');return false}
  save.stash.push(it);bumpGear();return true}
const scrapValue=it=>Math.round([6,15,40][it.rar]*(1+.02*it.il));
function secure(p){if(!p.hot||!p.hot.length)return;for(const it of p.hot){
    if(p.remote)netSend(p,{t:'item',it});else addToStash(it);
    bannerTo(p,`SECURED · ${it.name.toUpperCase()}`,`iLvl ${it.il} · open GEAR (◈) to equip`,2.8);fan(p,it.rar===2?587:440)}
  p.hot=[];if(!p.remote)persist()}
function updateLoot(dt){for(const l of wloot){l.age+=dt;l.x+=l.vx*dt;l.y+=l.vy*dt;const f=Math.max(0,1-dt*5);l.vx*=f;l.vy*=f;
    if(l.age<.4||l.taken)continue;
    for(const p of players){if(p.dead>0||p.picking)continue;if((p.x-l.x)**2+(p.y-l.y)**2<(p.r+16)**2){p.hot=p.hot||[];
        if(p.hot.length>=3){if(!(p.fullT>0)){p.fullT=1.5;fxText(p.x,p.y-34,'3 HOT ITEMS · GO BANK','#ff6a3d',17)}continue}
        p.hot.push(l.it);l.taken=true;fxText(p.x,p.y-40,l.it.name.toUpperCase(),GRAR[l.it.rar][1],18);snd(p,l.it.rar===2?880:660,.12,'triangle',.05);
        feedTo(p,`Picked up ${l.it.name} · it's hot until you bank it`,GRAR[l.it.rar][1]);break}}}
  wloot=wloot.filter(l=>!l.taken)}
const _sw6=setupWorld;setupWorld=function(m,pl){_sw6(m,pl);wloot=[];for(const p of players)p.hot=[]};
const _fb6=finishBank;finishBank=function(p,h,vb){_fb6(p,h,vb);if(vb)secure(p)};

/* ---------- loop ---------- */
const _up6=update;
update=function(rdt){const lp=players.filter(p=>!p.remote),norm=mode==='host'&&!raid;
  if(mode==='solo'||mode==='host')for(const p of lp)if(p.gearSig!==gearSig){p.gear=Object.assign(gearTotals(),{norm});p.gearSig=gearSig;recalc(p)}
  for(const p of players)if(p.gear&&mode==='host'&&p.gear.norm!==norm){p.gear.norm=norm;recalc(p)}
  const t0=players.map(p=>p.trip.t);_up6(rdt);
  players.forEach((p,i)=>{if(p.heatRes&&p.trip.t>t0[i])p.trip.t=t0[i]+(p.trip.t-t0[i])*(1-p.heatRes)});
  if(state==='play'&&lootOn()){updateLoot(rdt);for(const p of players)if(p.hot&&p.hot.length&&p.dead<=0&&inHub(p))secure(p)}
  const gb=$('gearBtn');if(gb)gb.style.display=mode==='party'?'none':''};

/* ---------- network ---------- */
const _ho6=hostOnData;
hostOnData=function(conn,d){if(d&&d.t==='gear'){const p=players.find(q=>q.id===conn.pid);if(!p)return;const st={};
    if(d.st&&typeof d.st==='object')for(const k in AFX)if(d.st[k]!=null)st[k]=clamp(+d.st[k]||0,-30,CAPS[k]);
    p.gear={wb:BASES.weapon[d.wb]?d.wb:'blaster',st,gs:clamp(d.gs|0,0,80),norm:!raid};const b=p.maxHp;recalc(p);if(inHub(p))p.hp+=Math.max(0,p.maxHp-b);return}
  _ho6(conn,d)};
const _bs6=buildSnap;
buildSnap=function(c){const s=_bs6(c);if(!s)return s;const P=players.find(q=>q.id===c.pid);
  s.L=wloot.filter(l=>P&&Math.abs(l.x-P.x)<1600&&Math.abs(l.y-P.y)<1600).map(l=>[l.id,Math.round(l.x),Math.round(l.y),l.it.rar,SLOTS.indexOf(l.it.slot)]);
  s.H=P&&P.hot?P.hot.map(it=>[it.rar,it.name]):[];return s};
const _as6=applySnap;
applySnap=function(s){_as6(s);if(mode!=='guest')return;
  G.wloot=Array.isArray(s.L)?s.L.map(a=>({id:a[0],x:a[1],y:a[2],it:{rar:clamp(a[3]|0,0,2),slot:SLOTS[a[4]]||'weapon'}})):[];
  G.hot=Array.isArray(s.H)?s.H.slice(0,3).map(h=>({rar:clamp(h[0]|0,0,2),name:String(h[1]).slice(0,30)})):[]};
const _go6=guestOnData;
guestOnData=function(d){if(d&&d.t==='item'){const it=cleanItem(d.it);if(it){it.id=iid();addToStash(it);refreshGearUI()}return}
  _go6(d);if(d&&d.t==='welcome')sendGear()};

/* ---------- drawing (deliberately simple) ---------- */
function drawLoot(l){const c=GRAR[l.it.rar][1],bob=Math.sin(time*5+l.x)*3;ctx.save();ctx.translate(l.x,l.y);
  ctx.globalAlpha=.22+.08*Math.sin(time*4+l.y);ctx.fillStyle=c;ctx.fillRect(-4,-80,8,80);ctx.globalAlpha=1;
  ctx.translate(0,bob-6);ctx.rotate(Math.PI/4);ctx.fillStyle=c;ctx.strokeStyle='#170804';ctx.lineWidth=3;ctx.fillRect(-9,-9,18,18);ctx.strokeRect(-9,-9,18,18);ctx.rotate(-Math.PI/4);
  ctx.font=F(800,14);ctx.textAlign='center';ctx.fillStyle='#170804';ctx.fillText(SLOT_L[l.it.slot]||'',0,5);ctx.restore()}
const _dh6=drawHud;
drawHud=function(p,W2,H2,Zv,v){const L=mode==='guest'?(G.wloot||[]):wloot;
  if(L.length&&p.cx!=null){ctx.save();ctx.translate(W2/2,H2/2);ctx.scale(Zv,Zv);ctx.translate(-p.cx,-p.cy);
    for(const l of L)if(Math.abs(l.x-p.cx)<W2/Zv/2+90&&Math.abs(l.y-p.cy)<H2/Zv/2+90)drawLoot(l);ctx.restore()}
  _dh6(p,W2,H2,Zv,v);
  for(const l of L)if(l.it.rar===2&&Math.hypot(l.x-p.x,l.y-p.y)<1700)edgeArrow(p,W2,H2,Zv,l.x,l.y,GRAR[2][1],'RARE',.85);
  const hot=mode==='guest'?(G.hot||[]):(p.hot||[]);
  if(hot.length&&p.dead<=0){const x=14,y=232;ctx.textAlign='left';ctx.fillStyle='rgba(23,8,4,.72)';rr(x,y,200,30+hot.length*22,12);ctx.fill();
    ctx.font=F(800,14);ctx.fillStyle=Math.sin(time*6)>0?'#ff6a3d':'#f6e7d8';ctx.fillText('HOT LOOT · bank to keep',x+12,y+20);
    hot.forEach((h,i)=>{ctx.fillStyle=GRAR[h.rar][1];ctx.fillText(h.name||'',x+12,y+42+i*22)})}};

/* ---------- GEAR screen ---------- */
const gst=document.createElement('style');gst.textContent=`.gi{background:rgba(60,13,3,.62);border:2px solid #5a2a1a;border-radius:14px;padding:10px 14px;text-align:left;display:flex;flex-direction:column;gap:6px;width:min(94vw,460px)}
.gi .gl{display:flex;justify-content:space-between;gap:8px;font-size:15px;align-items:baseline}.gi .gs{font-size:14px;opacity:.85;line-height:1.45}
.gi .gb{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.alt.sm{font-size:14px;padding:8px 16px}.up{color:#7be08f}.dn{color:#ff6a3d}
#gear h3{margin:6px 0 0;font-size:15px;letter-spacing:.14em;color:#ed9b49}#gear{justify-content:flex-start}`;document.head.appendChild(gst);
const gearEl=document.createElement('div');gearEl.id='gear';gearEl.className='sub';document.body.appendChild(gearEl);
let gearWasPlay=false;
const canSwap=()=>state==='menu'||state==='over'||(()=>{const me=meP();return !!(me&&inHub(me))})();
function statLine(o){return Object.keys(o).map(k=>{const v=o[k],[n,u]=AFX[k];return `${v>=0?'+':''}${Math.round(v*10)/10}${u} ${n}`}).join(' · ')}
function itemCard(it,eq){const c=GRAR[it.rar][1],cur=equipped(it.slot),d=itemPower(it)-itemPower(cur),ok=canSwap();
  const cmp=eq?'<span style="opacity:.7">equipped</span>':cur?`<span class="${d>=0?'up':'dn'}">${d>=0?'▲ +':'▼ '}${d} IP</span>`:'<span class="up">▲ empty slot</span>';
  return `<div class="gi" style="border-color:${c}"><div class="gl"><b style="color:${c}">${esc(it.name)}</b><span style="opacity:.75">${SLOT_N[it.slot]} · iLvl ${it.il} · IP ${itemPower(it)}</span></div>
  <div class="gs">${esc(BASES[it.slot][it.b][1])}<br>${statLine(itemStats(it))||'no bonus stats'}</div>
  <div class="gb">${cmp}${eq?'':`<button class="alt sm" data-eq="${it.id}" ${ok?'':'disabled style="opacity:.4"'}>EQUIP</button>`}
  ${eq||(it.slot==='weapon'&&save.stash.filter(i=>i.slot==='weapon').length<2)?'':`<button class="link" data-sc="${it.id}">scrap · +${scrapValue(it)}</button>`}</div></div>`}
function refreshGearUI(){if(gearEl.style.display!=='flex')return;ensureGear();const ok=canSwap();
  let h=`<h2>GEAR · GS ${gearScore()}</h2><p>${ok?'Swap freely here.':'Go to the hub to swap gear.'} Found gear is <b>hot</b> until you bank it. Die and it drops. Equipped gear is always safe.</p>`;
  h+=`<h3>EQUIPPED</h3>`+SLOTS.map(s=>{const it=equipped(s);return it?itemCard(it,true):`<div class="gi"><div class="gl"><b style="opacity:.6">${SLOT_N[s]}</b><span style="opacity:.6">empty</span></div></div>`}).join('');
  const rest=save.stash.filter(i=>!SLOTS.some(s=>save.equip[s]===i.id)).sort((a,b)=>b.rar-a.rar||itemPower(b)-itemPower(a));
  h+=`<h3>STASH · ${save.stash.length}/${STASH_MAX}</h3>`+(rest.length?rest.map(it=>itemCard(it,false)).join(''):`<div class="gi"><div class="gs">Nothing yet. Crates, elites, raiders and bosses drop gear.</div></div>`);
  h+=`<h3>DROP ODDS</h3><div class="gi"><div class="gs">Crate zone 1/2/3: 2% / 3.5% / 6% chance · Elite 20% · Raider 10% · Golden Brute 100% · Collector Prime 2 Rares<br>
    Rarity in zone 3 crates: Common 52% · Uncommon 36% · Rare 12%<br>Bad luck protection: a Rare is guaranteed within <b>${Math.max(1,PITY-save.pity)}</b> drop${PITY-save.pity===1?'':'s'}.</div></div>`;
  h+=`<div class="gi"><div class="gs">Gear counts in Solo and Co-op raids. Online free-for-all keeps your weapon type but evens out stats. Party on one device plays without gear.</div></div>`;
  h+=`<button class="big" id="gearClose">CLOSE</button>`;gearEl.innerHTML=h;
  gearEl.querySelectorAll('[data-eq]').forEach(b=>b.addEventListener('click',()=>{if(!canSwap())return;const it=save.stash.find(i=>i.id===b.dataset.eq);if(!it)return;
    save.equip[it.slot]=it.id;bumpGear();beep(700,.08,'triangle',.05);refreshGearUI()}));
  gearEl.querySelectorAll('[data-sc]').forEach(b=>b.addEventListener('click',()=>{const i=save.stash.findIndex(x=>x.id===b.dataset.sc);if(i<0)return;const it=save.stash[i];
    if(SLOTS.some(s=>save.equip[s]===it.id))return;save.stash.splice(i,1);const v=scrapValue(it);save.bank+=v;save.total+=v;bumpGear();refreshShop();beep(300,.08,'square',.04);refreshGearUI()}));
  $('gearClose').addEventListener('click',closeGear)}
function openGear(){ensureGear();if(state==='play'&&pausing()){state='pause';gearWasPlay=true}releaseAll();gearEl.style.display='flex';refreshGearUI()}
function closeGear(){gearEl.style.display='none';if(gearWasPlay&&state==='pause')state='play';gearWasPlay=false;if(state==='menu')menuMeta()}
(()=>{const hb=$('hudBtns');if(hb){const b=document.createElement('button');b.id='gearBtn';b.setAttribute('aria-label','Gear');b.textContent='◈';
    b.addEventListener('pointerdown',e=>{e.stopPropagation();openGear()});hb.appendChild(b)}
  const md=$('menu')&&$('menu').querySelector('.modes');if(md){const b=document.createElement('button');b.className='alt';b.id='goGear';b.innerHTML='GEAR<small id="gearSub"></small>';
    b.addEventListener('click',openGear);md.appendChild(b)}})();
const _mm6=menuMeta;menuMeta=function(){_mm6();ensureGear();const s=$('gearSub');if(s)s.textContent=`gear score ${gearScore()} · ${save.stash.length} in stash`};
ensureGear();menuMeta();document.title='Salvage Run · v0.6';
if(window.__game)Object.defineProperties(window.__game,Object.getOwnPropertyDescriptors({update,openGear,closeGear,makeItem,addToStash,gearScore,gearTotals,ensureGear,itemPower,
  get wloot(){return wloot},get gearHtml(){return gearEl.innerHTML},equip:(id)=>{const it=save.stash.find(i=>i.id===id);if(it){save.equip[it.slot]=it.id;bumpGear()}}}));
