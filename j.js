/* ================= GEAR SYSTEM (v0.7) =================
   10 slots, 6 rarities, item level, affixes, Epic perks, Legendary effects, Salvaged exotics, forge +1..+10, dismantle to cores.
   Found gear is HOT until banked (hub or beacon); die and it drops. Equipped gear is always safe.
   Full gear in Solo and Co-op raids. Online free-for-all keeps your weapon type only. Party on one device plays without gear.
   Workshop upgrades (hub shop) stay as the account level; gear stacks on top.
   Structure: DATA · ITEMS · STASH · EFFECTS · LOOT · NETWORK · RENDER · UI. Rendering is kept apart so a visual remake can reuse the logic. */

/* ---------- DATA ---------- */
const GRAR=[['Common','#c9b8aa'],['Uncommon','#7be08f'],['Rare','#5aa9ff'],['Epic','#b57cff'],['Legendary','#f5c34d'],['Salvaged','#f6e7d8']];
const RMUL=[1,1.2,1.4,1.6,1.8,2],NAFX=[1,2,3,3,3,4],CORES=[1,3,8,20,50,0];
const SLOTS=['weapon','helmet','armor','legs','boots','gloves','pack','ring1','ring2','neck'];
const ITYPES=['weapon','helmet','armor','legs','boots','gloves','pack','ring','neck'];
const typeOf=s=>s==='ring1'||s==='ring2'?'ring':s;
const SLOT_N={weapon:'Weapon',helmet:'Helmet',armor:'Armor',legs:'Legs',boots:'Boots',gloves:'Gloves',pack:'Backpack',ring:'Ring',ring1:'Ring',ring2:'Ring',neck:'Necklace'};
const SLOT_L={weapon:'W',helmet:'H',armor:'A',legs:'L',boots:'B',gloves:'G',pack:'P',ring:'R',neck:'N'};
const BASES={
  weapon:{blaster:['Blaster','Steady auto-fire'],scatter:['Scattergun','3 pellets, short range'],rail:['Rail','Slow, heavy, pierces 1'],burst:['Burst SMG','Fast, light, sprays']},
  helmet:{visor:['Visor','Sharper crits'],hood:['Hood','Heat builds slower'],cap:['Hard Cap','More hull']},
  armor:{plate:['Plate','More hull'],vest:['Vest','Takes less damage'],coat:['Heat Coat','Heat builds slower']},
  legs:{cargo:['Cargo Pants','Bigger bag'],greaves:['Greaves','More hull'],coolant:['Coolant Legs','Heat builds slower']},
  boots:{runners:['Runners','More speed'],jumpers:['Jumpers','Faster ability'],treads:['Treads','Hull and a bit of speed']},
  gloves:{grip:['Trigger Grip','Faster fire'],magnets:['Magnet Gloves','Bigger magnet'],quick:['Quick Hands','Faster ability']},
  pack:{satchel:['Satchel','Bigger bag'],hauler:['Hauler','Huge bag, a bit slower'],courier:['Courier','Bigger magnet']},
  ring:{band:['Band','More damage'],loop:['Loop','Harder crits'],fang:['Fang','Lifesteal']},
  neck:{charm:['Charm','More scrap'],sigil:['Sigil','More XP'],totem:['Totem','Hurts bosses and elites']}};
const AFX={dmg:['Damage','%',4,8],rate:['Fire rate','%',3,7],crit:['Crit chance','%',2,5],critdmg:['Crit damage','%',8,15],range:['Range','%',4,8],hp:['Hull','',8,18],
  armor:['Armor','%',2,5],thorns:['Thorns','%',10,20],heat:['Heat resist','%',4,8],spd:['Speed','%',2,5],cd:['Ability cooldown','%',3,7],mag:['Magnet','%',6,12],
  bag:['Bag','',5,12],scrap:['Scrap find','%',3,7],xp:['XP','%',5,10],ls:['Lifesteal','%',.5,1.5],vsr:['vs Raiders','%',6,12],vsb:['vs Bosses & elites','%',6,12]};
const SLOT_AFX={weapon:['dmg','rate','crit','critdmg','range'],helmet:['crit','heat','xp','hp'],armor:['hp','armor','thorns','heat'],legs:['bag','hp','heat','armor'],
  boots:['spd','cd','hp'],gloves:['rate','mag','cd','scrap'],pack:['bag','mag','scrap'],ring:['dmg','critdmg','ls','vsr','vsb','crit'],neck:['scrap','xp','vsb','vsr','ls','heat']};
const CAPS={dmg:200,rate:120,crit:50,critdmg:200,range:100,hp:800,armor:60,thorns:150,heat:70,spd:70,cd:60,mag:250,bag:300,scrap:100,xp:150,ls:12,vsr:150,vsb:150};
const UNIQ={weapon:['coil','Twin Coil','Every 5th volley chains lightning to 3 nearby enemies'],helmet:['overseer','Overseer','+5% crit, and every crit repairs 1 hull'],
  armor:['bulwark','Bulwark','Blocks the first hit every 10 s'],legs:['mule','Mule Frame','+40% bag, -10% speed'],
  boots:['afterburn','Afterburn','Ability recharges 30% faster and gives a 1.5 s speed burst'],gloves:['magpie','Magpie Grip','Scrap pickups count double for 3 s after a kill'],
  pack:['blackbox','Black Box','Keep 20% of your bag when you die'],ring:['ember','Ember Loop','Kills explode for 80% damage'],neck:['debt',"Collector's Debt",'Heat adds up to +60% damage']};
const SALV={weapon:'Old Faithful',helmet:"Foreman's Visor",armor:'Hull of the Ark',legs:'Long Haul',boots:'First Out',gloves:'Sticky Fingers',pack:'The Last Load',ring:'Rust Halo',neck:"Collector's Key"};
const GPERKS=['pierce','twin','bounce','saw','nova','leech','thruster','vacuum'];
const RW7={crate:[null,[75,22,3,0,0,0],[62,28,8,2,0,0],[45,35,16,3.5,.5,0]],elite:[30,40,22,7,.8,.2],raider:[50,33,13,3.5,.5,0],boss:[0,30,45,20,4,1],prime:[0,0,40,40,17,3]};
const DROPC={crate:[0,.02,.035,.06],elite:.2,raider:.1};
const PITY=25,STASH_MAX=60,FMAX=10;

/* ---------- ITEMS ---------- */
const acctLv=()=>1+save.rank+Math.floor(totalLv()/5);
const iid=()=>'i'+Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36);
function itemName(it){if(it.rar>=5)return SALV[it.slot];const bn=BASES[it.slot][it.b][0];return it.rar===4?`${UNIQ[it.slot][1]} ${bn}`:`${GRAR[it.rar][0]} ${bn}`}
function rollAffix(it,pool){const k=pool.splice(Math.floor(Math.random()*pool.length),1)[0],[,,lo,hi]=AFX[k];it.a[k]=Math.round(rand(lo,hi)*(1+.02*it.il)*10)/10}
function makeItem(rar,il,slot,b){slot=slot||ITYPES[Math.floor(Math.random()*ITYPES.length)];const bs=Object.keys(BASES[slot]);b=b||bs[Math.floor(Math.random()*bs.length)];
  const it={id:iid(),slot,b,rar,il,a:{},f:0};const pool=SLOT_AFX[slot].slice();for(let i=0;i<NAFX[rar]&&pool.length;i++)rollAffix(it,pool);
  if(rar>=3)it.pk=GPERKS[Math.floor(Math.random()*GPERKS.length)];if(rar>=4)it.u=UNIQ[slot][0];it.name=itemName(it);return it}
function baseStats(it){const s=(1+.02*it.il)*(RMUL[it.rar]||1)*(1+.06*(it.f||0)),o={};
  switch(it.b){case 'blaster':case 'scatter':case 'rail':case 'burst':o.dmg=5*s;break;
    case 'visor':o.crit=2*s;break;case 'hood':o.heat=5*s;break;case 'cap':o.hp=10*s;break;
    case 'plate':o.hp=15*s;break;case 'vest':o.armor=4*s;break;case 'coat':o.heat=6*s;break;
    case 'cargo':o.bag=8*s;break;case 'greaves':o.hp=12*s;break;case 'coolant':o.heat=5*s;break;
    case 'runners':o.spd=4*s;break;case 'jumpers':o.cd=5*s;break;case 'treads':o.hp=8*s;o.spd=1.5*s;break;
    case 'grip':o.rate=4*s;break;case 'magnets':o.mag=10*s;break;case 'quick':o.cd=4*s;break;
    case 'satchel':o.bag=8*s;break;case 'hauler':o.bag=16*s;o.spd=-5;break;case 'courier':o.mag=12*s;break;
    case 'band':o.dmg=3*s;break;case 'loop':o.critdmg=10*s;break;case 'fang':o.ls=1*s;break;
    case 'charm':o.scrap=4*s;break;case 'sigil':o.xp=6*s;break;case 'totem':o.vsb=8*s;break}return o}
function itemStats(it){const o=baseStats(it),fm=1+.06*(it.f||0);for(const k in it.a)o[k]=(o[k]||0)+it.a[k]*fm;return o}
function itemPower(it){if(!it)return 0;return Math.round(10*(1+.02*it.il)*(RMUL[it.rar]||1)*(1+.08*Object.keys(it.a).length)*(1+.06*(it.f||0))*(it.pk?1.08:1)*(it.u?1.12:1))}
function cleanItem(x){if(!x||!ITYPES.includes(x.slot)||!BASES[x.slot][x.b])return null;const rar=clamp(x.rar|0,0,5),il=clamp(x.il|0,1,60),a={};
  if(x.a&&typeof x.a==='object')for(const k of SLOT_AFX[x.slot])if(x.a[k]!=null)a[k]=clamp(+x.a[k]||0,0,AFX[k][3]*3);
  const it={id:String(x.id||iid()).replace(/[^a-z0-9]/gi,'').slice(0,24)||iid(),slot:x.slot,b:x.b,rar,il,a,f:clamp(x.f|0,0,FMAX)};
  if(rar>=3)it.pk=GPERKS.includes(x.pk)?x.pk:GPERKS[0];if(rar>=4)it.u=UNIQ[x.slot][0];if(x.rr)it.rr=1;it.name=itemName(it);return it}

/* ---------- STASH ---------- */
function ensureGear(){if(!Array.isArray(save.stash))save.stash=[];save.stash=save.stash.map(cleanItem).filter(Boolean);
  if(!save.equip||typeof save.equip!=='object')save.equip={};if(save.pity==null)save.pity=0;if(save.cores==null)save.cores=0;
  if(!save.stash.some(i=>i.slot==='weapon')){const st={id:iid(),slot:'weapon',b:'blaster',rar:0,il:1,a:{},f:0};st.name=itemName(st);save.stash.unshift(st);save.equip.weapon=st.id}
  for(const s of SLOTS){const it=save.stash.find(i=>i.id===save.equip[s]);if(save.equip[s]&&(!it||it.slot!==typeOf(s)))save.equip[s]=null}
  if(save.equip.ring1&&save.equip.ring1===save.equip.ring2)save.equip.ring2=null}
const equipped=s=>save.stash.find(i=>i.id===save.equip[s])||null;
const isEquipped=it=>SLOTS.some(s=>save.equip[s]===it.id);
function equipItem(it){let s=it.slot;if(it.slot==='ring'){if(isEquipped(it))return;const r1=equipped('ring1'),r2=equipped('ring2');
    s=!r1?'ring1':!r2?'ring2':(itemPower(r1)<=itemPower(r2)?'ring1':'ring2')}save.equip[s]=it.id;bumpGear()}
const gearScore=()=>Math.round(SLOTS.reduce((s,k)=>s+itemPower(equipped(k)),0)/SLOTS.length);
function gearTotals(){const st={},pk={},u={};let wb='blaster';
  for(const s of SLOTS){const it=equipped(s);if(!it)continue;if(s==='weapon')wb=it.b;const o=itemStats(it);for(const k in o)st[k]=(st[k]||0)+o[k];
    if(it.pk)pk[it.pk]=Math.min(3,(pk[it.pk]||0)+1);if(it.u)u[it.u]=1}
  for(const k in st)st[k]=clamp(st[k],-30,CAPS[k]);return{wb,st,gs:gearScore(),pk,u}}
let gearSig=1;const bumpGear=()=>{gearSig++;persist();if(mode==='guest')sendGear()};
function sendGear(){const g=gearTotals();netSendHost({t:'gear',wb:g.wb,st:g.st,gs:g.gs,pk:g.pk,u:g.u})}
const forgeCost=it=>({scrap:Math.round(30*Math.pow((it.f||0)+1,1.7)*(RMUL[it.rar]||1)),cores:((it.f||0)+1)*(1+it.rar)});
function forgeItem(it){if(!it||(it.f||0)>=FMAX)return false;const c=forgeCost(it);if(save.bank<c.scrap||save.cores<c.cores)return false;
  save.bank-=c.scrap;save.cores-=c.cores;it.f=(it.f||0)+1;
  if(it.f===5&&Object.keys(it.a).length<4){const pool=SLOT_AFX[it.slot].filter(k=>it.a[k]==null);if(pool.length)rollAffix(it,pool)}
  bumpGear();refreshShop();return true}
function rerollAffix(it,k){if(!it||(it.f||0)<FMAX||it.rr||it.a[k]==null)return false;delete it.a[k];const pool=SLOT_AFX[it.slot].filter(x=>it.a[x]==null);rollAffix(it,pool);it.rr=1;bumpGear();return true}
function dismantle(it){if(!it||isEquipped(it)||it.rar>=5)return false;if(it.slot==='weapon'&&save.stash.filter(i=>i.slot==='weapon').length<2)return false;
  save.stash=save.stash.filter(i=>i!==it);save.cores+=CORES[it.rar];bumpGear();return true}
function addToStash(it){ensureGear();if(save.stash.length>=STASH_MAX){if(it.rar>=5){pushFeedLocal('Stash full · make room for that Salvaged item!','#ff6a3d');save.stash.push(it);bumpGear();return true}
    save.cores+=CORES[it.rar];pushFeedLocal(`Stash full · ${it.name} dismantled for ${CORES[it.rar]} cores`,'#ed9b49');return false}
  save.stash.push(it);bumpGear();return true}

/* ---------- EFFECTS (authoritative: solo + host) ---------- */
function syncGearPerks(p){const g=p.gear,want=g&&!g.norm?g.pk||{}:{},had=p.run.gpk||{};
  for(const k of new Set([...Object.keys(want),...Object.keys(had)])){const v=(p.run.perks[k]||0)-(had[k]||0)+(want[k]||0);if(v>0)p.run.perks[k]=v;else delete p.run.perks[k]}p.run.gpk=Object.assign({},want)}
const _rc6=recalc;
recalc=function(p){if(p.run)syncGearPerks(p);_rc6(p);const g=p.gear;p.armor=0;p.heatRes=0;p.scrapF=0;p.critMul=2.5;p.xpMul=1;p.thorns=0;p.ls=0;p.vsr=0;p.vsb=0;p.u={};
  p.wb=g?g.wb:'blaster';p.gs=g&&!g.norm?(g.gs||0):0;if(!g)return;const m=g.norm?{}:g.st,u=g.norm?{}:(g.u||{});p.u=u;
  p.dmg*=1+(m.dmg||0)/100;p.rate*=1+(m.rate||0)/100;p.crit+=(m.crit||0)/100+(u.overseer?.05:0);p.range*=1+(m.range||0)/100;p.maxHp+=Math.round(m.hp||0);
  p.spd*=1+(m.spd||0)/100;p.abCdMax*=1-(m.cd||0)/100;p.mag*=1+(m.mag||0)/100;p.cap+=Math.round(m.bag||0);
  p.armor=(m.armor||0)/100;p.heatRes=(m.heat||0)/100;p.scrapF=(m.scrap||0)/100;p.critMul=2.5*(1+(m.critdmg||0)/100);p.xpMul=1+(m.xp||0)/100;
  p.thorns=(m.thorns||0)/100;p.ls=(m.ls||0)/100;p.vsr=(m.vsr||0)/100;p.vsb=(m.vsb||0)/100;
  if(u.mule){p.cap=Math.round(p.cap*1.4);p.spd*=.9}if(u.afterburn)p.abCdMax*=.7;
  const w=p.wb;if(w==='scatter'){p.dmg*=.42;p.rate*=.8;p.range*=.72}else if(w==='rail'){p.dmg*=2.2;p.rate*=.45;p.range*=1.3}else if(w==='burst'){p.dmg*=.6;p.rate*=1.75;p.range*=.9}};
const _vo6=volley;
volley=function(p,t){const w=p.wb,n0=bullets.length;p.vc=(p.vc||0)+1;
  if(w==='scatter'){const a=Math.atan2(t.y-p.y,t.x-p.x),d=Math.hypot(t.x-p.x,t.y-p.y)||1;for(const o of[-.2,0,.2])_vo6(p,{x:p.x+Math.cos(a+o)*d,y:p.y+Math.sin(a+o)*d})}
  else _vo6(p,t);
  const db=p.u&&p.u.debt?1+.6*heat(p):1;
  for(let i=n0;i<bullets.length;i++){const b=bullets[i];if(b.crit&&p.critMul)b.dmg*=p.critMul/2.5;b.dmg*=db;
    if(w==='rail'){b.pierce+=1;b.w=7;b.vx*=1.4;b.vy*=1.4;b.life/=1.4}else if(w==='burst'){const a=rand(-.12,.12),c=Math.cos(a),s=Math.sin(a),vx=b.vx;b.vx=vx*c-b.vy*s;b.vy=vx*s+b.vy*c;b.w=3}}
  if(p.u&&p.u.coil&&p.vc%5===0){const near=enemies.filter(e=>!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<300).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)).slice(0,3);
    for(const e of near){fxRing(e.x,e.y,34,'#8fd6ff',.25);fxBurst(e.x,e.y,'#8fd6ff',6,160);hitEnemy(e,p.dmg*1.2,p)}if(near.length)snd(p,1400,.06,'square',.03,.4)}};
const _hp6=hitPlayer;
hitPlayer=function(p,dmg,by){if(p.dead>0||p.inv>0||inHub(p)||p.picking)return _hp6(p,dmg,by);
  if(p.u&&p.u.bulwark&&!(p.bwT>0)){p.bwT=10;p.inv=.3;fxRing(p.x,p.y,44,'#8fd6ff',.3);fxText(p.x,p.y-34,'BLOCKED','#8fd6ff',18);snd(p,500,.1,'triangle',.05);return}
  if(p.thorns>0&&by&&by.type&&!by.dead)hitEnemy(by,dmg*p.thorns,p);_hp6(p,dmg*(1-(p.armor||0)),by)};
let lastBy=null,emberLock=false;
const _me6=makeEnemy;makeEnemy=function(type,x,y,t,p){const e=_me6(type,x,y,t,p);const gs=p?p.gs||0:Math.max(0,...players.map(q=>q.gs||0));
  if(gs>0&&type!=='collector'){const k=1+.011*gs;e.hp*=k;e.max*=k;e.dmg*=1+.006*gs}return e};
const _ds6=dropScrap;dropScrap=function(x,y,total,spread){_ds6(x,y,total*(1+((lastBy&&lastBy.scrapF)||0)),spread)};
const _gx7=gainXp;gainXp=function(p,n){_gx7(p,n*(p.xpMul||1))};
const _ab7=ability;ability=function(p){const c=p.abCd;_ab7(p);if(c<=0&&p.abCd>0&&p.u&&p.u.afterburn){p.abBoostT=1.5;fxBurst(p.x,p.y,'#ff9a3c',14,200)}};
const _hr6=hitRival;
hitRival=function(r,dmg,by){const was=r.dead>0;_hr6(r,dmg*(by&&by.isP?1+(by.vsr||0):1),by);
  if(!was&&r.dead>0&&by&&by.isP&&lootOn()&&Math.random()<DROPC.raider)dropItem(r.x,r.y,RW7.raider,[0,0,3,6][tierAt(r.x,r.y)])};
const _kp6=killPlayer;
killPlayer=function(p,by){if(p.hot&&p.hot.length){for(const it of p.hot)spawnLoot(p.x,p.y,it);feedTo(p,`You dropped ${p.hot.length} hot item${p.hot.length>1?'s':''}. Go get ${p.hot.length>1?'them':'it'} back.`,'#ff6a3d');p.hot=[]}
  const keep=p.u&&p.u.blackbox?Math.floor(p.carry*.2):0;p.carry-=keep;_kp6(p,by);if(keep>0){p.carry=keep;feedTo(p,`Black Box kept ${keep} scrap`,'#f5c34d')}};
const _pu7=updatePickups;updatePickups=function(dt){const c0=players.map(p=>p.carry);_pu7(dt);
  players.forEach((p,i)=>{if(p.magT>0&&p.carry>c0[i])p.carry=Math.min(p.cap,p.carry+(p.carry-c0[i]))})};

/* ---------- LOOT ---------- */
let wloot=[],lid=0;
const lootOn=()=>mode==='solo'||mode==='host';
function rollRar(w){let r=0;const tot=w.reduce((a,b)=>a+b,0);let x=Math.random()*tot;for(;r<5;r++){x-=w[r];if(x<=0)break}
  if(r<3&&save.pity>=PITY-1)r=3;if(r>=3)save.pity=0;else save.pity++;return r}
function spawnLoot(x,y,it){const a=rand(0,TAU);wloot.push({id:++lid,x,y,vx:Math.cos(a)*140,vy:Math.sin(a)*140,age:0,it});if(wloot.length>60)wloot.shift()}
function dropItem(x,y,w,ilBonus){if(!lootOn()||ftueOn())return;save.drops=(save.drops||0)+1;const rar=rollRar(w),il=clamp(acctLv()+ilBonus+Math.round(rand(-2,2)),1,60),it=makeItem(rar,il);spawnLoot(x,y,it);
  if(rar>=4)bannerTo(null,`${GRAR[rar][0].toUpperCase()} DROP`,it.name,3);dirty=true}
const _he6=hitEnemy;
hitEnemy=function(e,dmg,by,src,crit){if(e.dead)return;const isP=by&&by.isP,was=e.dead;
  if(isP&&(e.type==='boss'||e.type==='collector'||e.elite))dmg*=1+(by.vsb||0);
  lastBy=by;_he6(e,dmg,by,src,crit);lastBy=null;
  if(isP&&by.dead<=0){if(by.ls>0)by.hp=Math.min(by.maxHp,by.hp+dmg*by.ls);if(crit&&by.u&&by.u.overseer)by.hp=Math.min(by.maxHp,by.hp+1)}
  if(!e.dead||was||!isP)return;
  if(by.u&&by.u.magpie)by.magT=3;
  if(by.u&&by.u.ember&&!emberLock){emberLock=true;fxRing(e.x,e.y,80,'#ff7a45',.3);for(const o of enemies)if(!o.dead&&o!==e&&Math.hypot(o.x-e.x,o.y-e.y)<70+o.r)hitEnemy(o,by.dmg*.8,by);emberLock=false}
  if(!lootOn())return;const t=e.t||3;
  if(e.prime){for(let i=0;i<2;i++)dropItem(e.x,e.y,RW7.prime,9)}
  else if(e.type==='boss')dropItem(e.x,e.y,RW7.boss,8);
  else if(e.elite&&Math.random()<DROPC.elite)dropItem(e.x,e.y,RW7.elite,[0,0,3,6][t])};
const _hc6=hitCrate;
hitCrate=function(c,dmg,by){const was=c.dead>0;lastBy=by;_hc6(c,dmg,by);lastBy=null;if(was||c.dead<=0||!by||!by.isP||!lootOn())return;
  if(!save.firstDrop&&!ftueOn()&&mode==='solo'){save.firstDrop=true;spawnLoot(c.x,c.y,makeItem(1,acctLv()));bannerTo(by,'GEAR DROP','Walk over it, then bank it to keep it',3.5);return}
  if(Math.random()<DROPC.crate[c.t]*((save.drops||0)<8?3:1))dropItem(c.x,c.y,RW7.crate[c.t],[0,0,3,6][c.t])};
function secure(p){if(!p.hot||!p.hot.length)return;for(const it of p.hot){
    if(p.remote)netSend(p,{t:'item',it});else addToStash(it);
    bannerTo(p,`SECURED · ${it.name.toUpperCase()}`,`${GRAR[it.rar][0]} · iLvl ${it.il} · open GEAR (◈) to equip`,2.8);fan(p,it.rar>=3?587:440)}
  p.hot=[];if(!p.remote)persist()}
function updateLoot(dt){for(const l of wloot){l.age+=dt;l.x+=l.vx*dt;l.y+=l.vy*dt;const f=Math.max(0,1-dt*5);l.vx*=f;l.vy*=f;
    if(l.age<.4||l.taken)continue;
    for(const p of players){if(p.dead>0||p.picking)continue;if((p.x-l.x)**2+(p.y-l.y)**2<(p.r+16)**2){p.hot=p.hot||[];
        if(p.hot.length>=3){if(!(p.fullT>0)){p.fullT=1.5;fxText(p.x,p.y-34,'3 HOT ITEMS · GO BANK','#ff6a3d',17)}continue}
        p.hot.push(l.it);l.taken=true;fxText(p.x,p.y-40,l.it.name.toUpperCase(),GRAR[l.it.rar][1],18);snd(p,l.it.rar>=3?990:660,.12,'triangle',.05);
        feedTo(p,`Picked up ${l.it.name} · it's hot until you bank it`,GRAR[l.it.rar][1]);break}}}
  wloot=wloot.filter(l=>!l.taken)}
const _sw6=setupWorld;setupWorld=function(m,pl){_sw6(m,pl);wloot=[];for(const p of players)p.hot=[]};
const _fb6=finishBank;finishBank=function(p,h,vb){_fb6(p,h,vb);if(vb)secure(p)};

/* ---------- LOOP ---------- */
const _up6=update;
update=function(rdt){const lp=players.filter(p=>!p.remote),norm=mode==='host'&&!raid;
  if(mode==='solo'||mode==='host')for(const p of lp)if(p.gearSig!==gearSig){p.gear=Object.assign(gearTotals(),{norm});p.gearSig=gearSig;recalc(p)}
  for(const p of players)if(p.gear&&mode==='host'&&p.gear.norm!==norm){p.gear.norm=norm;recalc(p)}
  for(const p of players){p.magT=(p.magT||0)-rdt;p.bwT=(p.bwT||0)-rdt;if(p.abBoostT>0){p.abBoostT-=rdt;p._sb=p.spd;p.spd*=1.4}else p._sb=null}
  const t0=players.map(p=>p.trip.t);_up6(rdt);
  for(const p of players)if(p._sb!=null&&Math.abs(p.spd-p._sb*1.4)<.01)p.spd=p._sb;
  players.forEach((p,i)=>{if(p.heatRes&&p.trip.t>t0[i])p.trip.t=t0[i]+(p.trip.t-t0[i])*(1-p.heatRes)});
  if(state==='play'&&lootOn()){updateLoot(rdt);for(const p of players)if(p.hot&&p.hot.length&&p.dead<=0&&inHub(p))secure(p)}
  const gb=$('gearBtn');if(gb)gb.style.display=mode==='party'?'none':''};

/* ---------- NETWORK ---------- */
const UKEYS=Object.values(UNIQ).map(u=>u[0]);
const _ho6=hostOnData;
hostOnData=function(conn,d){if(d&&d.t==='gear'){const p=players.find(q=>q.id===conn.pid);if(!p)return;const st={},pk={},u={};
    if(d.st&&typeof d.st==='object')for(const k in AFX)if(d.st[k]!=null)st[k]=clamp(+d.st[k]||0,-30,CAPS[k]);
    if(d.pk&&typeof d.pk==='object')for(const k of GPERKS)if(d.pk[k])pk[k]=clamp(d.pk[k]|0,0,3);
    if(d.u&&typeof d.u==='object')for(const k of UKEYS)if(d.u[k])u[k]=1;
    p.gear={wb:BASES.weapon[d.wb]?d.wb:'blaster',st,pk,u,gs:clamp(d.gs|0,0,120),norm:!raid};const b=p.maxHp;recalc(p);if(inHub(p))p.hp+=Math.max(0,p.maxHp-b);return}
  _ho6(conn,d)};
const _bs6=buildSnap;
buildSnap=function(c){const s=_bs6(c);if(!s)return s;const P=players.find(q=>q.id===c.pid);
  s.L=wloot.filter(l=>P&&Math.abs(l.x-P.x)<1600&&Math.abs(l.y-P.y)<1600).map(l=>[l.id,Math.round(l.x),Math.round(l.y),l.it.rar,ITYPES.indexOf(l.it.slot)]);
  s.H=P&&P.hot?P.hot.map(it=>[it.rar,it.name]):[];return s};
const _as6=applySnap;
applySnap=function(s){_as6(s);if(mode!=='guest')return;
  G.wloot=Array.isArray(s.L)?s.L.map(a=>({id:a[0],x:a[1],y:a[2],it:{rar:clamp(a[3]|0,0,5),slot:ITYPES[a[4]]||'weapon'}})):[];
  G.hot=Array.isArray(s.H)?s.H.slice(0,3).map(h=>({rar:clamp(h[0]|0,0,5),name:String(h[1]).slice(0,30)})):[]};
const _go6=guestOnData;
guestOnData=function(d){if(d&&d.t==='item'){const it=cleanItem(d.it);if(it){it.id=iid();addToStash(it);refreshGearUI()}return}
  _go6(d);if(d&&d.t==='welcome')sendGear()};

/* ---------- RENDER (deliberately simple) ---------- */
function drawLoot(l){const r=l.it.rar,c=GRAR[r][1],big=r>=4,bob=Math.sin(time*5+l.x)*3;ctx.save();ctx.translate(l.x,l.y);
  ctx.globalAlpha=.22+.08*Math.sin(time*4+l.y)+(big?.12:0);ctx.fillStyle=c;ctx.fillRect(big?-6:-4,big?-130:-80,big?12:8,big?130:80);ctx.globalAlpha=1;
  ctx.translate(0,bob-6);ctx.rotate(Math.PI/4+(big?time:0));const z=big?12:9;ctx.fillStyle=c;ctx.strokeStyle=r===5?'#8d4f24':'#170804';ctx.lineWidth=3;ctx.fillRect(-z,-z,z*2,z*2);ctx.strokeRect(-z,-z,z*2,z*2);
  ctx.rotate(-(Math.PI/4+(big?time:0)));ctx.font=F(800,14);ctx.textAlign='center';ctx.fillStyle='#170804';ctx.fillText(SLOT_L[l.it.slot]||'',0,5);ctx.restore()}
const _dh6=drawHud;
drawHud=function(p,W2,H2,Zv,v){const L=mode==='guest'?(G.wloot||[]):wloot;
  if(L.length&&p.cx!=null){ctx.save();ctx.translate(W2/2,H2/2);ctx.scale(Zv,Zv);ctx.translate(-p.cx,-p.cy);
    for(const l of L)if(Math.abs(l.x-p.cx)<W2/Zv/2+90&&Math.abs(l.y-p.cy)<H2/Zv/2+140)drawLoot(l);ctx.restore()}
  _dh6(p,W2,H2,Zv,v);
  for(const l of L)if(l.it.rar>=2&&Math.hypot(l.x-p.x,l.y-p.y)<1700)edgeArrow(p,W2,H2,Zv,l.x,l.y,GRAR[l.it.rar][1],GRAR[l.it.rar][0].toUpperCase(),.85);
  const hot=mode==='guest'?(G.hot||[]):(p.hot||[]);
  if(hot.length&&p.dead<=0){const x=14,y=232;ctx.textAlign='left';ctx.fillStyle='rgba(23,8,4,.72)';rr(x,y,220,30+hot.length*22,12);ctx.fill();
    ctx.font=F(800,14);ctx.fillStyle=Math.sin(time*6)>0?'#ff6a3d':'#f6e7d8';ctx.fillText('HOT LOOT · bank to keep',x+12,y+20);
    hot.forEach((h,i)=>{ctx.fillStyle=GRAR[h.rar][1];ctx.fillText(h.name||'',x+12,y+42+i*22)})}};

/* ---------- UI: GEAR screen ---------- */
const gst=document.createElement('style');gst.textContent=`.gi{background:rgba(60,13,3,.62);border:2px solid #5a2a1a;border-radius:14px;padding:10px 14px;text-align:left;display:flex;flex-direction:column;gap:6px;width:min(94vw,480px)}
.gi .gl{display:flex;justify-content:space-between;gap:8px;font-size:15px;align-items:baseline;flex-wrap:wrap}.gi .gs{font-size:14px;opacity:.88;line-height:1.45}
.gi .gb{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.alt.sm{font-size:14px;padding:8px 14px}.up{color:#7be08f}.dn{color:#ff6a3d}.uq{color:#f5c34d}.pk{color:#b57cff}
.gf{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;width:min(94vw,480px)}.gf button{font:700 14px Sora,system-ui,sans-serif;padding:6px 10px;border-radius:10px;border:2px solid #5a2a1a;background:rgba(60,13,3,.8);color:#f6e7d8}
.gf button.on{border-color:#f5c34d}.eqrow{display:grid;grid-template-columns:1fr 1fr;gap:6px;width:min(94vw,480px)}.eqrow div{font-size:14px;background:rgba(60,13,3,.55);border-radius:10px;padding:6px 10px;text-align:left;border:2px solid #3a1a10}
#gear h3{margin:6px 0 0;font-size:15px;letter-spacing:.14em;color:#ed9b49}#gear{justify-content:flex-start}`;document.head.appendChild(gst);
const gearEl=document.createElement('div');gearEl.id='gear';gearEl.className='sub';document.body.appendChild(gearEl);
let gearWasPlay=false,gearFilter='all',gearOpen=null;
const canSwap=()=>state==='menu'||state==='over'||(()=>{const me=meP();return !!(me&&inHub(me))})();
function statLine(o){return Object.keys(o).map(k=>{const v=o[k],[n,u]=AFX[k];return `${v>=0?'+':''}${Math.round(v*10)/10}${u} ${n}`}).join(' · ')}
function itemCard(it){const c=GRAR[it.rar][1],eq=isEquipped(it),ok=canSwap(),cmpTo=it.slot==='ring'?[equipped('ring1'),equipped('ring2')].sort((a,b)=>itemPower(a)-itemPower(b))[0]:equipped(it.slot);
  const d=itemPower(it)-itemPower(cmpTo),fc=forgeCost(it),canF=ok&&(it.f||0)<FMAX&&save.bank>=fc.scrap&&save.cores>=fc.cores;
  const cmp=eq?'<span style="opacity:.7">equipped</span>':cmpTo?`<span class="${d>=0?'up':'dn'}">${d>=0?'▲ +':'▼ '}${d} IP</span>`:'<span class="up">▲ empty slot</span>';
  let h=`<div class="gi" style="border-color:${c}"><div class="gl"><b style="color:${c}">${esc(it.name)}${it.f?` +${it.f}`:''}</b><span style="opacity:.75">${GRAR[it.rar][0]} ${SLOT_N[it.slot]} · iLvl ${it.il} · IP ${itemPower(it)}</span></div>
  <div class="gs">${esc(BASES[it.slot][it.b][1])}<br>${statLine(itemStats(it))||'no bonus stats'}`;
  if(it.pk)h+=`<br><span class="pk">Perk: ${PERKS[it.pk].n} +1</span>`;
  if(it.u){const U=UNIQ[it.slot];h+=`<br><span class="uq">★ ${U[1]}: ${U[2]}</span>`}
  h+=`</div><div class="gb">${cmp}`;
  if(!eq)h+=`<button class="alt sm" data-eq="${it.id}" ${ok?'':'disabled style="opacity:.4"'}>EQUIP</button>`;
  if((it.f||0)<FMAX)h+=`<button class="alt sm" data-fg="${it.id}" ${canF?'':'disabled style="opacity:.4"'}>FORGE +${(it.f||0)+1} · ${fc.scrap}◆ ${fc.cores}⬢</button>`;
  else if(!it.rr)h+=Object.keys(it.a).map(k=>`<button class="link" data-rr="${it.id}" data-k="${k}">reroll ${AFX[k][0]}</button>`).join('');
  if(!eq&&it.rar<5&&!(it.slot==='weapon'&&save.stash.filter(i=>i.slot==='weapon').length<2))h+=`<button class="link" data-dm="${it.id}">dismantle · +${CORES[it.rar]}⬢</button>`;
  return h+`</div></div>`}
function refreshGearUI(){if(gearEl.style.display!=='flex')return;ensureGear();const ok=canSwap();
  let h=`<h2>GEAR · GS ${gearScore()}</h2><p>◆ ${save.bank} scrap · ⬢ ${save.cores} cores. ${ok?'Swap and forge freely here.':'Go to the hub to swap or forge.'} Found gear is <b>hot</b> until you bank it. Equipped gear is always safe.</p>`;
  h+=`<h3>EQUIPPED</h3><div class="eqrow">`+SLOTS.map(s=>{const it=equipped(s);return `<div style="border-color:${it?GRAR[it.rar][1]:'#3a1a10'}"><span style="opacity:.6">${SLOT_N[s]}</span><br>${it?`<b style="color:${GRAR[it.rar][1]}">${esc(it.name)}${it.f?' +'+it.f:''}</b>`:'<span style="opacity:.5">empty</span>'}</div>`}).join('')+`</div>`;
  const types=['all',...ITYPES];h+=`<div class="gf">`+types.map(t=>`<button data-gf="${t}" class="${t===gearFilter?'on':''}">${t==='all'?'ALL':SLOT_N[t].toUpperCase()}</button>`).join('')+`</div>`;
  const list=save.stash.filter(i=>gearFilter==='all'||i.slot===gearFilter).sort((a,b)=>(isEquipped(b)-isEquipped(a))||b.rar-a.rar||itemPower(b)-itemPower(a));
  h+=`<h3>STASH · ${save.stash.length}/${STASH_MAX}</h3>`+(list.length?list.map(itemCard).join(''):`<div class="gi"><div class="gs">Nothing here yet. Crates, elites, raiders and bosses drop gear.</div></div>`);
  h+=`<h3>FORGE</h3><div class="gi"><div class="gs">Each forge level adds +6% to the whole item. At +5 it gains a bonus stat (max 4). At +10 you can reroll one stat. Forging never fails. Dismantle spare gear for cores (⬢). Salvaged items can't be dismantled.</div></div>`;
  h+=`<h3>DROP ODDS</h3><div class="gi"><div class="gs">Drop chance · crate zone 1/2/3: 2% / 3.5% / 6% (3x for your first 8 drops) · elite 20% · raider 10% · Golden Brute and Collector Prime always.<br>
    Zone 3 crate: Common 45% · Uncommon 35% · Rare 16% · Epic 3.5% · Legendary 0.5%<br>Golden Brute: Uncommon 30% · Rare 45% · Epic 20% · Legendary 4% · Salvaged 1%<br>
    Collector Prime (2 drops): Rare 40% · Epic 40% · Legendary 17% · Salvaged 3%<br>Bad luck protection: an Epic or better within <b>${Math.max(1,PITY-save.pity)}</b> drop${PITY-save.pity===1?'':'s'}.</div></div>`;
  h+=`<div class="gi"><div class="gs">Gear counts fully in Solo and Co-op raids. Online free-for-all keeps your weapon type only. Party on one device plays without gear.</div></div>`;
  h+=`<button class="big" id="gearClose">CLOSE</button>`;gearEl.innerHTML=h;
  const find=id=>save.stash.find(i=>i.id===id);
  gearEl.querySelectorAll('[data-gf]').forEach(b=>b.addEventListener('click',()=>{gearFilter=b.dataset.gf;refreshGearUI()}));
  gearEl.querySelectorAll('[data-eq]').forEach(b=>b.addEventListener('click',()=>{if(!canSwap())return;const it=find(b.dataset.eq);if(it){equipItem(it);beep(700,.08,'triangle',.05);refreshGearUI()}}));
  gearEl.querySelectorAll('[data-fg]').forEach(b=>b.addEventListener('click',()=>{if(!canSwap())return;if(forgeItem(find(b.dataset.fg))){fanfareLocal(660);refreshGearUI()}}));
  gearEl.querySelectorAll('[data-rr]').forEach(b=>b.addEventListener('click',()=>{if(!canSwap())return;if(rerollAffix(find(b.dataset.rr),b.dataset.k)){beep(900,.1,'triangle',.05);refreshGearUI()}}));
  gearEl.querySelectorAll('[data-dm]').forEach(b=>b.addEventListener('click',()=>{if(dismantle(find(b.dataset.dm))){beep(300,.08,'square',.04);refreshGearUI()}}));
  $('gearClose').addEventListener('click',closeGear)}
function openGear(){ensureGear();if(state==='play'&&pausing()){state='pause';gearWasPlay=true}releaseAll();gearEl.style.display='flex';refreshGearUI()}
function closeGear(){gearEl.style.display='none';if(gearWasPlay&&state==='pause')state='play';gearWasPlay=false;if(state==='menu')menuMeta()}
(()=>{const hb=$('hudBtns');if(hb){const b=document.createElement('button');b.id='gearBtn';b.setAttribute('aria-label','Gear');b.textContent='◈';
    b.addEventListener('pointerdown',e=>{e.stopPropagation();openGear()});hb.appendChild(b)}
  const md=$('menu')&&$('menu').querySelector('.modes');if(md){const b=document.createElement('button');b.className='alt';b.id='goGear';b.innerHTML='GEAR<small id="gearSub"></small>';
    b.addEventListener('click',openGear);md.appendChild(b)}})();
const _mm6=menuMeta;menuMeta=function(){_mm6();ensureGear();const s=$('gearSub');if(s)s.textContent=`gear score ${gearScore()} · ${save.stash.length} items · ${save.cores} cores`};
ensureGear();menuMeta();document.title='Salvage Run · v0.7';
if(window.__game)Object.defineProperties(window.__game,Object.getOwnPropertyDescriptors({update,openGear,closeGear,makeItem,addToStash,gearScore,gearTotals,ensureGear,itemPower,forgeItem,rerollAffix,dismantle,forgeCost,
  get wloot(){return wloot},get gearHtml(){return gearEl.innerHTML},equip:(id)=>{const it=save.stash.find(i=>i.id===id);if(it)equipItem(it)}}));
