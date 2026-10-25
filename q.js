/* ================= v0.13 · COMBAT MASTERY =================
   Rustpunk weapon families, one readable element per weapon, persistent capped mastery.
   This file loads after the v0.12 modules so existing saves, gear, and host-authoritative
   combat remain the source of truth. */
const V13_FAMILY={blaster:'bow',burst:'bow',scatter:'sword',rail:'staff',sword:'sword',bow:'bow',staff:'staff'};
const V13_FAMILIES=['sword','bow','staff'];
const V13_ELEMENTS=['fire','water','earth','wind'];
const V13_EL_COL={fire:'#ff6a3d',water:'#5aa9ff',earth:'#c08b57',wind:'#b8f28a'};
const V13_EL_NAME={fire:'Fire',water:'Water',earth:'Earth',wind:'Wind'};
const V13_LEVEL_XP=[0,20,55,105,175,265,375,505,655,825,1020];
const v13Family=b=>V13_FAMILY[b]||'bow';
const v13ValidElement=e=>V13_ELEMENTS.includes(e);
const v13CleanMastery=o=>{const x={sword:0,bow:0,staff:0};if(o&&typeof o==='object')for(const f of V13_FAMILIES)x[f]=clamp(Math.floor(+o[f]||0),0,1000000);return x};
function v13Level(xp){let n=0;for(let i=1;i<V13_LEVEL_XP.length;i++)if(xp>=V13_LEVEL_XP[i])n=i;return n}
function v13Mastery(p){
  if(p&&p.remote&&mode==='host'){p.v13Mastery=v13CleanMastery(p.v13Mastery);return p.v13Mastery}
  save.mastery=v13CleanMastery(save.mastery);return save.mastery
}
function v13XpFor(p,f){return v13Mastery(p)[f]||0}
function v13Rank(p,f){return v13Level(v13XpFor(p,f))}
function v13Equipped(){try{return equipped('weapon')}catch(e){return null}}
function v13ElementOfItem(it){const m=save.v13Elements&&typeof save.v13Elements==='object'?save.v13Elements:{};return it&&v13ValidElement(m[it.id])?m[it.id]:'fire'}
function v13ElementFor(p){
  if(p&&p.remote&&mode==='host')return v13ValidElement(p.v13Element)?p.v13Element:'fire';
  return v13ElementOfItem(v13Equipped())
}
function v13SetElement(el){
  if(!v13ValidElement(el))return false;
  const it=v13Equipped();if(!it)return false;
  if(!save.v13Elements||typeof save.v13Elements!=='object')save.v13Elements={};
  save.v13Elements[it.id]=el;persist();
  if(mode==='guest'&&typeof sendGear==='function')sendGear();
  return true
}
function v13CycleElement(){
  const it=v13Equipped();if(!it)return false;const cur=v13ElementOfItem(it),i=V13_ELEMENTS.indexOf(cur);
  return v13SetElement(V13_ELEMENTS[(i+1)%V13_ELEMENTS.length])
}
function v13Migrate(){
  save.mastery=v13CleanMastery(save.mastery);
  if(!save.v13Elements||typeof save.v13Elements!=='object')save.v13Elements={};
  let changed=false;
  try{ensureGear()}catch(e){}
  for(const it of save.stash||[]){
    if(it.slot!=='weapon')continue;
    const f=V13_FAMILY[it.b];
    if(f&&it.b!==f){it.b=f;it.name=itemName(it);changed=true}
    if(!v13ValidElement(save.v13Elements[it.id]))save.v13Elements[it.id]='fire';
  }
  if(typeof WU==='object'){
    if(WU.rift_rail)WU.rift_rail.b='staff';
    if(WU.skullsplitter)WU.skullsplitter.b='sword';
  }
  if(save.v13Migration!==1){save.v13Migration=1;changed=true}
  if(changed)persist()
}

/* Add new item bases without removing legacy keys; old saves and special drops stay readable. */
Object.assign(BASES.weapon,{
  sword:['Salvage Sword','Close-range sweep · risky reach'],
  bow:['Bolt Bow','Precise auto-aim · long reach'],
  staff:['Reactor Staff','Slow area attack · status pressure']
});
const _v13BaseStats=baseStats;
baseStats=function(it){
  const o=_v13BaseStats(it);
  if(it&&it.slot==='weapon'&&V13_FAMILIES.includes(v13Family(it.b))){
    const s=(1+.02*it.il)*(RMUL[it.rar]||1)*(1+.06*(it.f||0));o.dmg=5*s
  }
  return o
};
const _v13MakeItem=makeItem;
makeItem=function(rar,il,slot,b){
  if(slot==='weapon'){
    if(!b)b=V13_FAMILIES[Math.floor(Math.random()*V13_FAMILIES.length)];
    else b=v13Family(b)
  }
  const it=_v13MakeItem(rar,il,slot,b);
  if(it&&it.slot==='weapon'){const f=v13Family(it.b);if(it.b!==f){it.b=f;it.name=itemName(it)}}
  return it
};
v13Migrate();

function v13RewardXp(p){
  if(!p||!p.isP)return;
  const f=v13Family(p.wb),m=v13Mastery(p),old=v13Level(m[f]||0);
  m[f]=Math.min(1000000,(m[f]||0)+1);
  const next=v13Level(m[f]);
  if(p.remote&&mode==='host'){p.v13Mastery=m;p.v13MasteryDirty=true}
  else{dirty=true;if(next!==old)persist()}
  if(next!==old){
    if(next===3)feedTo(p,`${f.toUpperCase()} mastery · family technique unlocked`,'#f5c34d');
    else if(next===6)feedTo(p,`${f.toUpperCase()} mastery · stronger element effects`,'#f5c34d');
    else if(next===10)bannerTo(p,`${f.toUpperCase()} MASTERY MAXED`,'Damage mastery capped at +12%',2.5);
    recalc(p)
  }
}

/* Each weapon has a distinct attack loop. Mastery damage is linear and hard-capped at +12%. */
const _v13Recalc=recalc;
recalc=function(p){
  _v13Recalc(p);if(!p)return;
  const f=v13Family(p.wb),lv=v13Rank(p,f);p.wb=f;p.v13Family=f;
  p.dmg*=1+Math.min(12,lv*1.2)/100;
  if(f==='sword'){p.dmg*=1.14;p.rate*=.86;p.range=Math.max(135,Math.min(190,p.range*.62))}
  else if(f==='bow'){p.rate*=.94;p.range=Math.min(520,p.range*1.28)}
  else{p.dmg*=.9;p.rate*=.64;p.range=Math.min(420,p.range*1.1)}
};
function v13WeaponCoil(p){
  p.vc=(p.vc||0)+1;
  if(!(p.u&&p.u.coil&&p.vc%5===0))return;
  const near=enemies.filter(e=>!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<300)
    .sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)).slice(0,3);
  for(const e of near){fxRing(e.x,e.y,34,'#8fd6ff',.25);fxBurst(e.x,e.y,'#8fd6ff',6,160);hitEnemy(e,p.dmg*1.2,p)}
  if(near.length)snd(p,1400,.06,'square',.03,.4)
}
function v13AttackDamage(p,mult){
  const k=p.run.perks,crit=Math.random()<p.crit;let dmg=p.dmg*mult;
  if(k.last&&p.hp<p.maxHp*.35)dmg*=1.6;
  if(crit)dmg*=p.critMul||2.5;
  if(p.u&&p.u.debt)dmg*=1+.6*heat(p);
  return{dmg,crit}
}
function v13WithinArc(p,o,reach,half){
  const dx=o.x-p.x,dy=o.y-p.y,d=Math.hypot(dx,dy);
  if(d>reach+o.r||d<.01)return false;
  let a=Math.atan2(dy,dx)-p.face;while(a>Math.PI)a-=Math.PI*2;while(a< -Math.PI)a+=Math.PI*2;
  return Math.abs(a)<=half
}
function v13SwordSweep(p,t){
  const lv=v13Rank(p,'sword'),reach=lv>=3?166:146,half=lv>=3?.9:.72,el=v13ElementFor(p),hit=v13AttackDamage(p,.86);
  fxRing(t.x,t.y,reach,V13_EL_COL[el],.22);fxBurst(t.x,t.y,V13_EL_COL[el],6,130);
  for(const e of enemies)if(!e.dead&&v13WithinArc(p,e,reach,half))hitEnemy(e,hit.dmg,p,'v13_sword',hit.crit);
  for(const r of rivals)if(r.dead<=0&&v13WithinArc(p,r,reach,half))hitRival(r,hit.dmg,p);
  if(pvp())for(const q of players)if(q!==p&&targetable(q)&&v13WithinArc(p,q,reach,half))hitPlayer(q,hit.dmg,p);
  for(const c of crates)if(c.dead<=0&&v13WithinArc(p,c,reach,half))hitCrate(c,hit.dmg*.84,p);
  v13WeaponCoil(p)
}
function v13StaffBurst(p,t){
  const lv=v13Rank(p,'staff'),radius=lv>=3?112:88,el=v13ElementFor(p),hit=v13AttackDamage(p,.78);
  fxRing(t.x,t.y,radius,V13_EL_COL[el],.3);fxBurst(t.x,t.y,V13_EL_COL[el],10,180);snd(p,260,.1,'sine',.04,1.2);
  for(const e of enemies)if(!e.dead&&Math.hypot(e.x-t.x,e.y-t.y)<radius+e.r)hitEnemy(e,hit.dmg,p,'v13_staff',hit.crit);
  for(const r of rivals)if(r.dead<=0&&Math.hypot(r.x-t.x,r.y-t.y)<radius+r.r)hitRival(r,hit.dmg,p);
  if(pvp())for(const q of players)if(q!==p&&targetable(q)&&Math.hypot(q.x-t.x,q.y-t.y)<radius+q.r)hitPlayer(q,hit.dmg,p);
  for(const c of crates)if(c.dead<=0&&Math.hypot(c.x-t.x,c.y-t.y)<radius+c.r)hitCrate(c,hit.dmg,p);
  v13WeaponCoil(p)
}
const _v13Volley=volley;
volley=function(p,t){
  const f=v13Family(p.wb);
  if(f==='sword')return v13SwordSweep(p,t);
  if(f==='staff')return v13StaffBurst(p,t);
  const n0=bullets.length;_v13Volley(p,t);
  if(v13Rank(p,'bow')>=3)for(let i=n0;i<bullets.length;i++)bullets[i].pierce=Math.max(1,bullets[i].pierce||0)
};

/* Combat effects apply only to weapon hits. One status is active per enemy; same-element
   hits refresh, never stack. Fire ticks are ordinary host-side enemy damage. */
let v13BulletPass=false;
const _v13UpdateBullets=updateBullets;
updateBullets=function(dt){v13BulletPass=true;try{return _v13UpdateBullets(dt)}finally{v13BulletPass=false}};
function v13ApplyElement(e,p,dmg){
  if(!e||e.dead||!p)return;
  const el=v13ElementFor(p),old=e.v13Status;
  if(old&&old.t>0&&old.el!==el)return;
  const duration=v13Rank(p,v13Family(p.wb))>=6?1.2:1;
  if(el==='fire')e.v13Status={el,t:3*duration,tick:.65,base:Math.max(1,dmg*.08),owner:p};
  else if(el==='water'){e.v13Status={el,t:1.6*duration,owner:p};e.v13SlowT=1.6*duration}
  else if(el==='earth'){e.v13Status={el,t:1.7*duration,owner:p};e.v13StunT=Math.max(e.v13StunT||0,.28);e.v13ArmorT=Math.max(e.v13ArmorT||0,1.7*duration)}
  else{
    e.v13Status={el,t:.5,owner:p};
    const a=Math.atan2(e.y-p.y,e.x-p.x),push=e.type==='boss'||e.vboss?18:42;
    e.x+=Math.cos(a)*push;e.y+=Math.sin(a)*push
  }
  fxBurst(e.x,e.y,V13_EL_COL[el],4,100)
}
const _v13HitEnemy=hitEnemy;
hitEnemy=function(e,dmg,by,src,crit){
  if(e&&e.v13ArmorT>0&&by&&by.isP&&src!=='v13_element')dmg*=1.12;
  const hp=e&&e.hp,weaponHit=!!(by&&by.isP&&(src==='v13_sword'||src==='v13_staff'||v13BulletPass));
  _v13HitEnemy(e,dmg,by,src,crit);
  if(weaponHit&&hp!=null&&e.hp<hp){
    v13RewardXp(by);
    if(src!=='v13_element'&&!e.dead)v13ApplyElement(e,by,dmg)
  }
};
function v13TickStatuses(dt){
  for(const e of enemies){
    if(e.v13ArmorT>0)e.v13ArmorT=Math.max(0,e.v13ArmorT-dt);
    if(e.v13SlowT>0)e.v13SlowT=Math.max(0,e.v13SlowT-dt);
    if(e.v13StunT>0)e.v13StunT=Math.max(0,e.v13StunT-dt);
    const s=e.v13Status;if(!s||e.dead)continue;
    s.t-=dt;
    if(s.el==='fire'){s.tick-=dt;while(s.tick<=0&&s.t>0&&!e.dead){hitEnemy(e,s.base,s.owner,'v13_element');s.tick+=.65}}
    if(s.t<=0)e.v13Status=null
  }
}
const _v13UpdateEnemies=updateEnemies;
updateEnemies=function(dt){
  v13TickStatuses(dt);const prior=[];
  for(const e of enemies){if(e.dead)continue;if(e.v13StunT>0){prior.push([e,e.spd]);e.spd=0}
    else if(e.v13SlowT>0){prior.push([e,e.spd]);e.spd*=.72}}
  try{return _v13UpdateEnemies(dt)}finally{for(const[e,s]of prior)e.spd=s}
};

/* Guest mastery stays in that guest's own save; the host simulates XP and syncs it back. */
const _v13HostOnData=hostOnData;
hostOnData=function(conn,d){
  if(d&&d.t==='v13init'){const p=players.find(q=>q.id===conn.pid);if(p){
    const incoming=v13CleanMastery(d.mastery),current=v13CleanMastery(p.v13Mastery);
    for(const f of V13_FAMILIES)current[f]=Math.max(current[f],incoming[f]);
    p.v13Mastery=current;p.v13Element=v13ValidElement(d.element)?d.element:'fire';p.v13MasteryDirty=true
  }return}
  if(d&&d.t==='v13gear'){const p=players.find(q=>q.id===conn.pid);if(p)p.v13Element=v13ValidElement(d.element)?d.element:'fire';return}
  return _v13HostOnData(conn,d)
};
const _v13GuestOnData=guestOnData;
guestOnData=function(d){
  if(d&&d.t==='v13mastery'){save.mastery=v13CleanMastery(d.mastery);persist();return}
  _v13GuestOnData(d);
  if(d&&d.t==='welcome'&&mode==='guest')netSendHost({t:'v13init',mastery:v13CleanMastery(save.mastery),element:v13ElementOfItem(v13Equipped())})
};
const _v13SendGear=sendGear;
sendGear=function(){_v13SendGear();if(mode==='guest')netSendHost({t:'v13gear',element:v13ElementOfItem(v13Equipped())})};
const _v13Update=update;
update=function(dt){const r=_v13Update(dt);if(mode==='host')for(const p of players)if(p.remote&&p.v13MasteryDirty&&time-(p.v13MasterySent||0)>.45){
  netSend(p,{t:'v13mastery',mastery:v13CleanMastery(p.v13Mastery)});p.v13MasteryDirty=false;p.v13MasterySent=time
}return r};

/* Small in-context controls expose the equipped weapon's element and all three tracks. */
const v13PanelHtml=()=>{const it=v13Equipped(),m=v13Mastery(null);
  const rows=V13_FAMILIES.map(f=>{const lv=v13Level(m[f]),next=V13_LEVEL_XP[Math.min(10,lv+1)],prev=V13_LEVEL_XP[lv],pct=lv>=10?100:Math.round((m[f]-prev)/(next-prev)*100);
    return `<div class="v13row"><span>${f.toUpperCase()} · LV ${lv}/10</span><span class="v13bar"><i style="width:${pct}%"></i></span></div>`}).join('');
  const el=it?v13ElementOfItem(it):'fire';
  return `<section class="v13mastery"><b>COMBAT MASTERY</b><div class="v13rows">${rows}</div><button type="button" data-v13-element ${it?'':'disabled'}>ELEMENT · ${V13_EL_NAME[el].toUpperCase()} · CHANGE</button><small>Active mastery damage cap: +12% · one element at a time</small></section>`
};
const v13Style=document.createElement('style');
v13Style.textContent=`.v13mastery{grid-column:1/-1;display:flex;flex-direction:column;gap:6px;border:1px solid #76502b;border-radius:12px;background:rgba(23,8,4,.8);padding:9px 12px;color:#f6e7d8;text-align:left;font:700 13px Sora,system-ui,sans-serif}.v13mastery>b{color:#f5c34d;letter-spacing:.12em}.v13rows{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.v13row{display:flex;flex-direction:column;gap:4px;min-width:0}.v13bar{height:5px;background:#3c0d03;border-radius:5px;overflow:hidden}.v13bar i{display:block;height:100%;background:#f5c34d}.v13mastery button{align-self:flex-start;max-width:100%;border:1px solid #8c5c32;border-radius:8px;background:#3c0d03;color:#f6e7d8;padding:7px 10px;font:800 12px Sora,system-ui,sans-serif}.v13mastery button:disabled{opacity:.5}.v13mastery small{opacity:.65;font-size:11px}@media(max-width:560px){.v13rows{grid-template-columns:1fr}.v13row{display:grid;grid-template-columns:1fr 1fr;align-items:center}}`;
document.head.appendChild(v13Style);
function v13RenderPanel(){
  const pf=$('prof');if(pf){const old=pf.querySelector&&pf.querySelector('.v13menu');if(old)old.remove();const d=document.createElement('div');d.className='v13menu';d.innerHTML=v13PanelHtml();pf.appendChild(d)}
  if(typeof baseOpen==='function'&&baseOpen()&&bTab==='gear'){
    const body=$('bbody');if(body&&!(body.querySelector&&body.querySelector('.v13mastery'))){const d=document.createElement('div');d.innerHTML=v13PanelHtml();body.appendChild(d.firstElementChild)}
  }
}
const _v13MenuMeta=menuMeta;
menuMeta=function(){_v13MenuMeta();v13RenderPanel()};
const _v13RenderBase=renderBase;
renderBase=function(){_v13RenderBase();v13RenderPanel()};
const v13HandleElement=e=>{const b=e.target&&e.target.closest&&e.target.closest('[data-v13-element]');if(!b||b.disabled)return;
  e.preventDefault();v13CycleElement();v13RenderPanel();if(typeof renderBase==='function'&&baseOpen())renderBase();if(state==='menu')menuMeta()
};
const v13Base=$('base');if(v13Base)v13Base.addEventListener('click',v13HandleElement);
const v13Profile=$('prof');if(v13Profile)v13Profile.addEventListener('click',v13HandleElement);
if(window.__game)Object.assign(window.__game,{v13:{families:V13_FAMILIES,elements:V13_ELEMENTS,migrate:v13Migrate,mastery:v13Mastery,level:v13Level,element:v13ElementOfItem,cycleElement:v13CycleElement}});
v13RenderPanel();
document.title='Salvage Run · v0.13';
