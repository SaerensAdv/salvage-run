/* ================= v0.12 · THE WASTES =================
   Everything past the Ditch (the Scrap Plains edge) is the Wastes: level 1 to 50, shown big in the HUD.
   Outposts are safe zones (no damage, bank + repair). Skulls: attack a player first, or take one in the hub:
   Wastes scrap pays double when you bank, but a skulled death costs 1 equipped item.
   PKer bots hunt skulled, glowing and loaded players. Three Wastes bosses with visible drop tables,
   uniques, pets (1/500) and bad-luck protection feed a collection log with milestone rewards.
   Weapon evolutions (maxed perk + partner perk) and run contracts give every trip a goal.
   Host-authoritative: guests get skulls, bosses and lair timers in the snapshot, and their own
   log, contract and skull-loss events by message. */
const DITCH=REG[0].out,WMAX=REG[3].out;
const wlAt=(x,y)=>{if(x>WORLD+500)return 0;const d=Math.hypot(x-HUB.x,y-HUB.y);return d<DITCH?0:clamp(Math.ceil((d-DITCH)/(WMAX-DITCH)*50),1,50)};
const wlMax=()=>curReg()<1?0:wlAt(HUB.x+FR(),HUB.y);
const OUTPOSTS=[[0.0,2200,'Rust Rest'],[2.9,2750,'Slag Hollow'],[5.0,3200,'Ash Camp'],[1.15,3700,'Last Light']].map(([a,d,n],i)=>{const x=HUB.x+Math.cos(a)*d,y=HUB.y+Math.sin(a)*d;return {i,n,x,y,r:150,reg:regAt(x,y),wl:wlAt(x,y)}});
const opOpen=o=>o.reg<=curReg();
const opAt=o=>(typeof VLT!=='undefined'&&VLT)||!o||o.x>WORLD+500?null:OUTPOSTS.find(q=>opOpen(q)&&Math.hypot(o.x-q.x,o.y-q.y)<q.r)||null;
const inWastes=o=>!VLT&&wlAt(o.x,o.y)>0;
const SKULL_PK=180,SKULL_VOL=300;

/* ---------- Wastes bosses: lair, pattern, drop table ---------- */
const WB={
  carrion:{n:'Carrion King',col:'#e0b43a',a:.8,d:2300,hp:.8,sc:140,pat:0,u:[['carrion_crown','helmet','visor','Carrion Crown'],['vulture_talons','gloves','grip','Vulture Talons']],pet:['pet_chick','Carrion Chick','#e0b43a']},
  chaos:{n:'Chaos Rig',col:'#b57cff',a:3.4,d:3000,hp:1,sc:240,pat:1,u:[['chaos_core','neck','totem','Chaos Core'],['rift_rail','weapon','rail','Rift Rail']],pet:['pet_sprite','Glitch Sprite','#b57cff']},
  warlord:{n:'The Warlord',col:'#ff4b3b',a:1.6,d:3700,hp:1.15,sc:380,pat:2,u:[['warlord_plate','armor','plate','Warlord Plate'],['skullsplitter','weapon','scatter','Skullsplitter']],pet:['pet_cub','War Cub','#ff4b3b']}};
const WBK=Object.keys(WB);
for(const k of WBK){const B=WB[k];B.x=HUB.x+Math.cos(B.a)*B.d;B.y=HUB.y+Math.sin(B.a)*B.d;B.reg=regAt(B.x,B.y);B.wl=wlAt(B.x,B.y)}
const WB_UNIQ=20,WB_PITY=40,WB_PET=500,WB_CD=75,PK_TAG=6,PK_PITY=15;
const TAGS=[['tag_bronze','Bronze Skull Tag','#c08048'],['tag_silver','Silver Skull Tag','#c9d3dd'],['tag_gold','Gold Skull Tag','#f5c34d']];
const WU={};for(const k of WBK)for(const u of WB[k].u)WU[u[0]]={boss:k,slot:u[1],b:u[2],n:u[3]};
const CLOG=[];for(const k of WBK){for(const u of WB[k].u)CLOG.push({k:u[0],n:u[3],g:k,col:WB[k].col});CLOG.push({k:WB[k].pet[0],n:WB[k].pet[1],g:k,col:WB[k].pet[2],pet:1})}
for(const t of TAGS)CLOG.push({k:t[0],n:t[1],g:'pk',col:t[2]});
const CMS=[[3,300,'Wanderer'],[6,800,'Skullhunter'],[9,1500,'Warlord'],[12,3000,'Completionist']];
let wbT={},wbLock=false;
function ensureWastes(){if(!save.clog||typeof save.clog!=='object')save.clog={};const L=save.clog;for(const f of['has','kc','dry','pdry'])if(!L[f]||typeof L[f]!=='object')L[f]={};
  if(L.tdry==null)L.tdry=0;if(L.ms==null)L.ms=0;if(save.wctDone==null)save.wctDone=0;return L}
const logCount=()=>{const L=ensureWastes();return CLOG.filter(c=>L.has[c.k]).length};
const logTitle=()=>{const n=logCount();let t='';for(const m of CMS)if(n>=m[0])t=m[2];return t};
function addLog(key){const L=ensureWastes(),first=!L.has[key];L.has[key]=(L.has[key]|0)+1;const C=CLOG.find(c=>c.k===key);
  if(first&&C){pushFeedLocal(`New collection log slot · ${C.n} (${logCount()}/${CLOG.length})`,C.col);fanfareLocal(698)}
  const n=logCount();while(L.ms<CMS.length&&n>=CMS[L.ms][0]){const m=CMS[L.ms];save.bank+=m[1];save.total+=m[1];pushFeedLocal(`LOG MILESTONE ${m[0]} · title "${m[2]}" · +${m[1]} safe scrap`,'#f5c34d');L.ms++}
  if(C&&C.pet)save.pet=key;persist()}
function wlog(p,key){if(!p)return;if(creditsSave(p))addLog(key);else if(p.remote)netSend(p,{t:'wlog',key})}
function wkc(p,b){if(!p)return;if(creditsSave(p)){const L=ensureWastes();L.kc[b]=(L.kc[b]|0)+1;persist()}else if(p.remote)netSend(p,{t:'wkc',b})}
// Item names: Wastes uniques keep their own name through save cleanup.
const _in12=itemName;itemName=function(it){return it&&it.wu&&WU[it.wu]?WU[it.wu].n:_in12(it)};
const _ci12=cleanItem;cleanItem=function(x){const it=_ci12(x);if(it&&x&&x.wu&&WU[x.wu]&&WU[x.wu].slot===it.slot&&it.rar===4){it.wu=x.wu;it.name=itemName(it)}return it};
function makeWU(key,il){const U=WU[key],it=makeItem(4,clamp(il,1,60),U.slot,U.b);it.wu=key;const pool=SLOT_AFX[U.slot].filter(k=>!(k in it.a));if(pool.length)rollAffix(it,pool);it.name=itemName(it);return it}

/* ---------- run contracts ---------- */
const CTD={wkill:{t:n=>`Kill ${n} monsters in the Wastes`,n:[25,40],rw:[90,140],c:1},deep:{t:(n,L)=>`Kill ${n} monsters at Wastes ${L}+`,n:[12,20],rw:[150,220],c:2},
  wboss:{t:()=>'Kill a Wastes boss',n:[1,1],rw:[260,320],c:3},pk:{t:n=>`Wreck ${n} PKer${n>1?'s':''}`,n:[1,2],rw:[150,240],c:2},
  wbank:{t:n=>`Bank ${n} scrap carried out of the Wastes`,n:[80,160],rw:[120,180],c:1},skbank:{t:()=>'Bank a haul while skulled',n:[1,1],rw:[220,260],c:3}};
function newContract(){const mx=Math.max(1,wlMax()),open=WBK.some(k=>WB[k].reg<=curReg());
  const keys=Object.keys(CTD).filter(k=>(k!=='wboss'||open)&&(k!=='deep'||mx>=8)&&(!save.wct||k!==save.wct.k));
  const k=keys[Math.floor(Math.random()*keys.length)],D=CTD[k],n=Math.round(rand(D.n[0],D.n[1])),L=k==='deep'?Math.max(5,Math.floor(mx*.6)):0;
  save.wct={k,n,g:0,L,rw:Math.round(rand(D.rw[0],D.rw[1])*(1+mx/50)/5)*5,c:D.c};return save.wct}
const ctText=c=>CTD[c.k]?CTD[c.k].t(c.n,c.L):'';
function ctEv(k,a=1,wl=0){if(curReg()<1)return;if(!save.wct||!CTD[save.wct.k])newContract();const c=save.wct;
  const hit=c.k===k||(k==='wkill'&&c.k==='deep'&&wl>=c.L);if(!hit)return;c.g=Math.min(c.n,c.g+a);
  if(c.g>=c.n){save.bank+=c.rw;save.total+=c.rw;save.cores=(save.cores||0)+c.c;save.wctDone++;
    banners[mode==='guest'?-1:0]={t:3,title:'CONTRACT DONE',sub:`${ctText(c)} · +${c.rw} safe scrap · +${c.c}⬢`};fanfareLocal(784);newContract()}
  persist()}
function wev(p,k,a,wl){if(!p)return;if(creditsSave(p))ctEv(k,a,wl);else if(p.remote)netSend(p,{t:'wct',k,a,wl})}

/* ---------- weapon evolutions (hidden from the normal perk pool) ---------- */
const EVO={ev_rail:{n:'⚡ Railstorm',d:'Evolution · shots pierce everything, +10% damage',max:1,r:2,req:['pierce','twin']},
  ev_nova:{n:'⚡ Supernova',d:'Evolution · the shock nova is far bigger and hits much harder',max:1,r:2,req:['nova','plating']},
  ev_saw:{n:'⚡ Buzz Halo',d:'Evolution · 7 orbit saws',max:1,r:2,req:['saw','rate']},
  ev_crit:{n:'⚡ Dead Eye',d:'Evolution · +15% crit chance and +15% damage',max:1,r:2,req:['crit','dmg']},
  ev_vamp:{n:'⚡ Blood Engine',d:'Evolution · kills repair 4 hull, +40 max hull',max:1,r:2,req:['leech','plating']}};
for(const k in EVO)Object.defineProperty(PERKS,k,{value:EVO[k],enumerable:false,configurable:true});
const evoReady=p=>Object.keys(EVO).filter(k=>{const E=EVO[k],P=p.run.perks;return !P[k]&&(P[E.req[0]]||0)>=PERKS[E.req[0]].max&&(P[E.req[1]]||0)>=1});
const _rp12=rollPerks;rollPerks=function(p){const out=_rp12(p),ev=evoReady(p);if(ev.length){const k=ev[Math.floor(Math.random()*ev.length)];out[0]=k}return out};
const _rc12=recalc;recalc=function(p){_rc12(p);const k=p.run&&p.run.perks;if(!k)return;if(k.ev_saw)k.saw=Math.max(k.saw||0,7);
  if(k.ev_crit){p.crit+=.15;p.dmg*=1.15}if(k.ev_rail)p.dmg*=1.1;if(k.ev_vamp){p.maxHp+=40;p.hp=Math.min(p.hp,p.maxHp)}};
const _vo12=volley;volley=function(p,t){const n0=bullets.length;_vo12(p,t);if(p.run.perks.ev_rail)for(let i=n0;i<bullets.length;i++){const b=bullets[i];b.pierce=99;b.w=7;if(!b.crit)b.col='#8fd6ff'}};
const _nv12=nova;nova=function(p){const k=p.run.perks;if(!k.ev_nova)return _nv12(p);const s=k.nova;k.nova=7;try{_nv12(p)}finally{k.nova=s}};
const _op12=openPickUI;openPickUI=function(p,opts,free,lvl){_op12(p,opts,free,lvl);const cs=pickEl.querySelectorAll?pickEl.querySelectorAll('.card'):[];
  opts.forEach((k,i)=>{if(!EVO[k]||!cs[i])return;const c=cs[i];c.style.borderColor='#f5c34d';c.style.boxShadow='0 0 0 3px rgba(245,195,77,.35),0 6px 0 #170804';
    const s=c.querySelector&&c.querySelector('.stk');if(s)s.innerHTML='<span class="tag max">EVOLUTION</span>'})};

/* ---------- PKers: bots that live in the Wastes ---------- */
const PKDEF=[['Skulk','#ff3b3b'],['Grim','#ff7a1a'],['Vandal','#e0245e']];
const PK0=RIVAL_DEF.length;RIVAL_DEF.push(...PKDEF);
function pkSpot(){for(let k=0;k<40;k++){const a=rand(0,TAU),d=rand(DITCH+160,Math.max(DITCH+200,FR()-120)),x=HUB.x+Math.cos(a)*d,y=HUB.y+Math.sin(a)*d;
    if(!opAt({x,y})&&!OUTPOSTS.some(o=>Math.hypot(o.x-x,o.y-y)<o.r+200)&&!players.some(p=>Math.hypot(p.x-x,p.y-y)<600))return[x,y]}return[HUB.x+DITCH+300,HUB.y]}
const _rs12=rivalStats;rivalStats=function(r){if(!r.pk)return _rs12(r);const w=r.wl||1;r.lvl=clamp(3+Math.floor(w/4),3,15);r.maxHp=110+w*14;r.dmg=9*(1+w*.035);r.spd=175+w;r.rate=1.6;r.range=250};
const _pw12=pickWander;pickWander=function(r){if(!r.pk)return _pw12(r);const[x,y]=pkSpot();r.tx=x;r.ty=y};
const _sr12=spawnRival;spawnRival=function(r){if(!r.pk)return _sr12(r);if(curReg()<1){r.dead=20;r.x=HUB.x;r.y=HUB.y-HUB.r*3;return}
  const[x,y]=pkSpot();r.x=x;r.y=y;r.wl=wlAt(x,y);rivalStats(r);r.hp=r.maxHp;r.carry=rand(10,30)+r.wl;r.goal='farm';r.greed=1e9;r.aggro=0;r.aggroP=null;r.chan=0;r.revengeOn=-1;pickWander(r)};
function addPKers(n){for(let i=0;i<n;i++){const[name,col]=PKDEF[i];const r={id:PK0+i,name,col,r:17,pk:true,bank:0,carry:0,lvl:0,dead:0,aggro:0,aggroP:null,cd:0,flash:0,goal:'farm',greed:1e9,tx:0,ty:0,face:0,vx:0,vy:0,revengeOn:-1,sawCd:0,chan:0};spawnRival(r);rivals.push(r)}}
const _sw12=setupWorld;setupWorld=function(m,pl){_sw12(m,pl);wbT={};gkShots=[];addPKers(m==='solo'?2:m==='party'?2:3);for(const p of players){p.skull=0;p.skEarn=0;p._pc=0;p.atk={}}};
const OPK={opts:[],free:0,t:1e9,safe:1};
function safeWrap(f){return function(dt){const S=players.filter(p=>!p.picking&&p.dead<=0&&opAt(p));for(const p of S)p.picking=OPK;try{return f(dt)}finally{for(const p of S)if(p.picking===OPK)p.picking=null}}}
function pushOut(o,cx,cy,R){const d=Math.hypot(o.x-cx,o.y-cy);if(d<R&&d>0){o.x=cx+(o.x-cx)/d*R;o.y=cy+(o.y-cy)/d*R}else if(d===0)o.x+=R}
const _ur12=updateRivals;updateRivals=safeWrap(function(dt){
  for(const r of rivals){if(!r.pk||r.dead>0)continue;let best=null,bs=0;
    for(const p of players){if(!targetable(p)||p.picking||!inWastes(p))continue;const d=Math.hypot(p.x-r.x,p.y-r.y);
      const s=p.skull>0&&d<1200?3:p.glow&&d<1400?2:p.carry>=15&&d<800?1:0;if(s>bs||(s===bs&&s&&best&&d<Math.hypot(best.x-r.x,best.y-r.y))){bs=s;best=p}}
    if(best){r.aggro=Math.max(r.aggro,1.5);r.aggroP=best;r.tx=best.x;r.ty=best.y}}
  _ur12(dt);
  for(const r of rivals){if(!r.pk||r.dead>0)continue;const d=Math.hypot(r.x-HUB.x,r.y-HUB.y);
    if(d<DITCH+30){pushOut(r,HUB.x,HUB.y,DITCH+30);if(r.aggroP&&!inWastes(r.aggroP)){r.aggro=0;r.aggroP=null;pickWander(r)}}
    for(const o of OUTPOSTS)if(opOpen(o))pushOut(r,o.x,o.y,o.r+r.r)}});
const _ue12=updateEnemies;updateEnemies=safeWrap(function(dt){_ue12(dt);if(VLT)return;
  for(const e of enemies){if(e.dead)continue;for(const o of OUTPOSTS)if(opOpen(o))pushOut(e,o.x,o.y,o.r+e.r);if(e.wb)wbTick(e,dt)}
  // The Wastes are busier the deeper you go.
  for(const p of players){if(p.dead>0||!inWastes(p)||opAt(p))continue;const w=wlAt(p.x,p.y);if(Math.random()<dt*2*w/50){let n=0;for(const e of enemies)if(Math.abs(e.x-p.x)<1000&&Math.abs(e.y-p.y)<1000)n++;if(n<16+w/2)spawnEnemy(p)}}});
const _db12=domeBlocks;domeBlocks=function(b){return _db12(b)||!!opAt(b)};

/* ---------- PvP, skulls, safe zones ---------- */
const _hp12=hitPlayer;hitPlayer=function(p,dmg,by){if(!VLT&&(opAt(p)||(by&&by.isP&&opAt(by))))return;const h0=p.hp,alive=p.dead<=0;_hp12(p,dmg,by);
  if(!alive||!(by&&by.isP)||by===p||VLT||!pvp()||p.hp>=h0)return;
  const retal=p.atk&&(p.atk[by.id]||0)>time;if(!retal){if(!(by.skull>0)){feedTo(by,'You attacked first · SKULLED · Wastes scrap ×2, a skulled death costs 1 item','#ff3b3b');bannerTo(by,'☠ SKULLED','You attacked first',2)}by.skull=Math.max(by.skull||0,SKULL_PK)}
  by.atk=by.atk||{};by.atk[p.id]=time+30};
function takeSkull(p){if(!p||p.dead>0||VLT)return false;p.skull=SKULL_VOL;p.skEarn=p.skEarn||0;p._pc=p.carry;bannerTo(p,'☠ SKULL TAKEN','5 min · Wastes scrap ×2 at the bank · die and lose 1 item',3);fan(p,330);return true}
function skullLossLocal(x,y,drop){if(mode==='party')return null;ensureGear();const weps=save.stash.filter(i=>i.slot==='weapon').length;
  const cand=SLOTS.map(s=>[s,equipped(s)]).filter(([s,it])=>it&&!(s==='weapon'&&weps<2));if(!cand.length)return null;
  const[s,it]=cand[Math.floor(Math.random()*cand.length)];save.equip[s]=null;save.stash=save.stash.filter(i=>i.id!==it.id);ensureGear();
  if(typeof bumpGear==='function')bumpGear();if(drop&&lootOn())spawnLoot(x,y,it);persist();return it}
const _kp12=killPlayer;killPlayer=function(p,by){const sk=p.skull>0&&!VLT,x=p.x,y=p.y;_kp12(p,by);p.skull=0;p.skEarn=0;p._pc=0;if(!sk)return;
  if(p.remote){netSend(p,{t:'skullLoss'});return}if(!creditsSave(p))return;const it=skullLossLocal(x,y,true);
  if(it)bannerTo(p,'☠ SKULLED DEATH',`${it.name} dropped where you fell`,3.5)};
const _fb12=finishBank;finishBank=function(p,h,viaB){const ws=p.trip&&p.trip.ws,sk=p.skull>0,bonus=sk?Math.min(Math.round(p.skEarn||0),h):0;p.skEarn=0;
  if(bonus>0&&creditsSave(p)&&mode!=='party'){save.bank+=bonus;save.total+=bonus}
  _fb12(p,h+bonus,viaB);if(bonus>0)feedTo(p,`☠ Skull bonus · +${bonus} scrap`,'#ff3b3b');
  if(ws&&h>0)wev(p,'wbank',h);if(sk&&h>0)wev(p,'skbank',1)};
const _upl12=updatePlayer;updatePlayer=function(p,dt){_upl12(p,dt);if(VLT||p.dead>0){p._pc=p.carry;return}
  p.skull=Math.max(0,(p.skull||0)-dt);const iw=inWastes(p);if(iw){p.trip=p.trip||{};p.trip.ws=true}
  if(p.skull>0&&iw&&p.carry>(p._pc||0))p.skEarn=(p.skEarn||0)+(p.carry-(p._pc||0));p._pc=p.carry;
  const w=wlAt(p.x,p.y);if(p.lastWl!=null&&!p.remote){if(w>0&&p.lastWl===0)bannerTo(p,'THE WASTES','You crossed the Ditch · bosses, PKers, skulls · outposts are safe',3);
    else if(w===0&&p.lastWl>0)bannerTo(p,'BACK IN THE PLAINS','The Ditch is behind you',1.6)}p.lastWl=w;
  const o=opAt(p);if(o){p.hp=Math.min(p.maxHp,p.hp+45*dt);if(p.lastOp!==o.i&&!p.remote)bannerTo(p,o.n.toUpperCase(),'OUTPOST · safe · bank and repair',2);
    if(p.carry>0){p.bankT=(p.bankT||0)-dt;if(p.bankT<=0){p.bankT=.04;const v=Math.min(p.carry,Math.max(1,Math.ceil(p.carry/10)));p.carry-=v;p.haul=(p.haul||0)+v;p._pc=p.carry;
      if(creditsSave(p)&&mode!=='party'){save.bank+=v;save.total+=v}snd(p,520+Math.min(p.haul,80)*10,.05,'triangle',.03);fxBurst(p.x,p.y,'#7be08f',3,140);
      if(p.carry<=0){finishBank(p,p.haul,false);p.haul=0;secure(p)}}}else if(p.hot&&p.hot.length)secure(p)}
  p.lastOp=o?o.i:-1};
const _hr12=hitRival;hitRival=function(r,dmg,by){const alive=r.dead<=0;if(r.pk&&opAt(r))return;_hr12(r,dmg,by);if(!alive||r.dead<=0||!r.pk)return;
  const w=r.wl||wlAt(r.x,r.y);dropScrap(r.x,r.y,20+w*2,1.2);if(lootOn())dropItem(r.x,r.y,shiftW(RW7.raider,w>=35?2:w>=20?1:0),4+Math.round(w/5));
  const P=by&&by.isP?by:null;if(!P)return;feedTo(null,`${P.name} wrecked the PKer ${r.name}`,r.col);wev(P,'pk',1);
  const L=creditsSave(P)?ensureWastes():null,tier=w>=35?2:w>=20?1:0;let drop=Math.random()<1/PK_TAG;
  if(L){L.tdry=(L.tdry|0)+1;if(L.tdry>=PK_PITY)drop=true;if(drop)L.tdry=0}if(drop){wlog(P,TAGS[tier][0]);bannerTo(P,TAGS[tier][1].toUpperCase(),'Skull tag · collection log',2.6)}};

/* ---------- boss lairs ---------- */
function wbAlive(k){return enemies.find(e=>!e.dead&&e.wb===k)}
function spawnWB(k,p){const B=WB[k],np=Math.max(1,players.filter(q=>q.dead<=0).length);const e=makeEnemy('boss',B.x,B.y,3,p);
  e.hp*=B.hp*(1+.3*(np-1));e.max=e.hp;e.wb=k;e.vname=B.n;e.col=B.col;e.r*=1.2;e.scrap*=2+B.reg;e.bt=2;e.st=4;e.lx=B.x;e.ly=B.y;enemies.push(e);
  bannerTo(null,`${B.n.toUpperCase()} RISES`,`Wastes boss · level ${B.wl} · uniques and a pet inside`,3.2);fan(null,247);shk(null,14);snd(null,62,.7,'sawtooth',.06,.6);return e}
function wbTarget(e){return players.filter(p=>targetable(p)&&!p.picking).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0]}
function wbTick(e,dt){const B=WB[e.wb],S=1+.45*B.reg,enr=e.hp<e.max*.35;e.bt-=dt;e.st-=dt;
  const dl=Math.hypot(e.x-e.lx,e.y-e.ly);if(dl>700){e.x+=(e.lx-e.x)/dl*160*dt;e.y+=(e.ly-e.y)/dl*160*dt}
  if(!players.some(p=>p.dead<=0&&Math.hypot(p.x-e.x,p.y-e.y)<1600)){e.dead=true;gkShots=gkShots.filter(b=>b.by!==e);feedTo(null,`${B.n} went back to its lair`,B.col);return}
  const t=wbTarget(e);
  if(B.pat===0){if(e.bt<=0){e.bt=enr?1.6:2.4;const n=10,o=time*1.3;for(let i=0;i<n;i++){const a=o+i/n*TAU;gkShots.push({x:e.x,y:e.y,vx:Math.cos(a)*210,vy:Math.sin(a)*210,life:3.2,dmg:7*S,r:8,col:B.col,by:e})}fxRing(e.x,e.y,e.r+26,B.col,.3)}
    if(e.st<=0){e.st=7;for(let k=0;k<4;k++){const a=rand(0,TAU),x=e.x+Math.cos(a)*110,y=e.y+Math.sin(a)*110,m=makeEnemy(Math.random()<.5?'dasher':'crawler',x,y,3,t||players[0]);m.wx=x;m.wy=y;enemies.push(m);fxRing(x,y,26,B.col,.3)}}}
  else if(B.pat===1){if(e.st<=0&&t){e.st=enr?3.2:4.5;fxBurst(e.x,e.y,B.col,20,240);const a=rand(0,TAU),d=rand(160,260);e.x=clamp(t.x+Math.cos(a)*d,40,WORLD-40);e.y=clamp(t.y+Math.sin(a)*d,40,WORLD-40);fxRing(e.x,e.y,e.r+40,B.col,.35);e.bt=.45;
      fires.push({x:t.x,y:t.y,r:42,life:3.5,arm:.6,dmg:6*S})}
    if(e.bt<=0){e.bt=enr?1.7:2.6;const n=14,o=rand(0,TAU);for(let i=0;i<n;i++){const a=o+i/n*TAU;gkShots.push({x:e.x,y:e.y,vx:Math.cos(a)*230,vy:Math.sin(a)*230,life:3,dmg:7*S,r:8,col:B.col,by:e})}}}
  else{if(e.bt<=0&&t){e.bt=enr?1.3:2;const a0=Math.atan2(t.y-e.y,t.x-e.x);for(const k of[-.3,-.15,0,.15,.3])gkShots.push({x:e.x,y:e.y,vx:Math.cos(a0+k)*330,vy:Math.sin(a0+k)*330,life:2.4,dmg:8*S,r:9,col:'#fff3c4',by:e})}
    if(e.st<=0&&t){e.st=enr?4:6;e.chg=.55;const a=Math.atan2(t.y-e.y,t.x-e.x);e.cvx=Math.cos(a)*560;e.cvy=Math.sin(a)*560;fxRing(e.x,e.y,e.r+30,B.col,.3);bannerTo(null,'',`${B.n} charges`,.8)}
    if(e.chg>0){e.chg-=dt;e.x+=e.cvx*dt;e.y+=e.cvy*dt;for(const p of players)if(targetable(p)&&!p.picking&&Math.hypot(p.x-e.x,p.y-e.y)<e.r+p.r)hitPlayer(p,14*S,e)}}}
function wbCheck(dt){if(VLT||ftueOn()||mode==='guest')return;for(const k of WBK){const B=WB[k];if(B.reg>curReg())continue;if(wbT[k]>0){wbT[k]-=dt;continue}
    if(wbAlive(k))continue;const p=players.find(q=>q.dead<=0&&!q.picking&&Math.hypot(q.x-B.x,q.y-B.y)<520);if(p)spawnWB(k,p)}}
function onWB(e,by){const B=WB[e.wb],k=e.wb;wbT[k]=WB_CD;gkShots=gkShots.filter(b=>b.by!==e);
  const P=by&&by.isP?by:players.filter(p=>p.dead<=0).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];
  dropScrap(e.x,e.y,B.sc*(1+.3*(players.length-1)),1.5);if(lootOn()){dropItem(e.x,e.y,RW7.boss,10+4*B.reg);if(B.reg>=2)dropItem(e.x,e.y,RW7.boss,10+4*B.reg)}dropOrb(e.x,e.y);dropOrb(e.x,e.y);
  bannerTo(null,`${B.n.toUpperCase()} DOWN`,`Back in ${WB_CD} s · loot on the floor`,2.6);fan(null,523);if(!P)return;
  wkc(P,k);wev(P,'wboss',1);
  // Bad-luck protection lives in the save for local players; remote guests use a per-session counter on the host.
  const L=creditsSave(P)?ensureWastes():null,dry=L?(L.dry[k]|0):((P.wdry=P.wdry||{})[k]|0),pd=L?(L.pdry[k]|0):((P.wpd=P.wpd||{})[k]|0);
  const uq=Math.random()<1/WB_UNIQ||dry+1>=WB_PITY,pet=Math.random()<(pd+1>WB_PET?2:1)/WB_PET;
  if(L){L.dry[k]=uq?0:dry+1;L.pdry[k]=pet?0:pd+1}else{P.wdry[k]=uq?0:dry+1;P.wpd[k]=pet?0:pd+1}
  if(uq){const u=B.u[Math.floor(Math.random()*B.u.length)],it=makeWU(u[0],12+5*B.reg+(acctLv?acctLv():1));if(lootOn())spawnLoot(e.x,e.y,it);wlog(P,u[0]);
    bannerTo(null,'★ UNIQUE DROP',`${u[3]} · from ${B.n}`,3.5);fan(null,880)}
  if(pet){wlog(P,B.pet[0]);bannerTo(P,'PET DROP',`${B.pet[1]} follows you now · 1/${WB_PET}`,4.5);fan(P,988)}
  persist()}
const _he12=hitEnemy;hitEnemy=function(e,dmg,by,src,crit){const was=e.dead;_he12(e,dmg,by,src,crit);if(was||!e.dead)return;
  if(e.wb&&!wbLock&&mode!=='guest'){wbLock=true;try{onWB(e,by)}finally{wbLock=false}}
  if(by&&by.isP){if(!VLT&&inWastes(e))wev(by,'wkill',1,wlAt(e.x,e.y));if(by.run.perks.ev_vamp&&by.dead<=0)by.hp=Math.min(by.maxHp,by.hp+4)}};
const _uw12=updateWorld;updateWorld=function(dt){_uw12(dt);wbCheck(dt)};
const _ev12=enterVault;enterVault=function(p,o){_ev12(p,o)};

/* ---------- network ---------- */
const _bs12=buildSnap;buildSnap=function(c){const s=_bs12(c);if(!s)return s;s.SK=players.filter(p=>p.skull>0).map(p=>[p.id,Math.ceil(p.skull)]);
  s.WB=enemies.filter(e=>!e.dead&&e.wb).map(e=>[e.id,WBK.indexOf(e.wb)]);s.WT=WBK.map(k=>Math.max(0,Math.ceil(wbT[k]||0)));return s};
const _as12=applySnap;applySnap=function(s){_as12(s);if(mode!=='guest')return;G.sk=new Map(Array.isArray(s.SK)?s.SK.map(a=>[a[0],a[1]|0]):[]);
  G.wbt=Array.isArray(s.WT)?s.WT.map(v=>v|0):[];const em=new Map(enemies.map(e=>[e.id,e]));
  for(const row of Array.isArray(s.WB)?s.WB:[]){const e=em.get(row[0]),k=WBK[row[1]];if(e&&k){e.wbk=k;e.vname=WB[k].n}}};
const _go12=guestOnData;guestOnData=function(d){if(d){switch(d.t){
    case 'wlog':if(CLOG.some(c=>c.k===d.key))addLog(d.key);return;
    case 'wkc':if(WB[d.b]){const L=ensureWastes();L.kc[d.b]=(L.kc[d.b]|0)+1;persist()}return;
    case 'wct':if(CTD[d.k]||d.k==='wkill')ctEv(d.k,clamp(+d.a||1,1,500),d.wl|0);return;
    case 'skullLoss':{const it=skullLossLocal(0,0,false);if(it){banners[-1]={t:3.5,title:'☠ SKULLED DEATH',sub:`${it.name} is gone`};typeof refreshGearUI==='function'&&refreshGearUI()}return}}}
  _go12(d)};
const _ho12=hostOnData;hostOnData=function(conn,d){if(d&&d.t==='skull'){const p=players.find(q=>q.id===conn.pid);if(p&&(inHub(p)||opAt(p)))takeSkull(p);return}_ho12(conn,d)};
const mySkull=p=>mode==='guest'?(G.sk&&G.sk.get(p.id))||0:p.skull||0;

/* ---------- render: ditch, outposts, lairs, skulls, pets ---------- */
const _dwx12=drawWorldX;drawWorldX=function(vis){_dwx12(vis);if(VLT)return;const R=curReg();
  if(R>=1){ctx.save();ctx.strokeStyle='rgba(12,3,2,.7)';ctx.lineWidth=46;ctx.beginPath();ctx.arc(HUB.x,HUB.y,DITCH,0,TAU);ctx.stroke();
    ctx.strokeStyle='rgba(255,59,59,.85)';ctx.lineWidth=5;ctx.setLineDash([]);ctx.beginPath();ctx.arc(HUB.x,HUB.y,DITCH+23,0,TAU);ctx.stroke();
    ctx.strokeStyle='rgba(255,59,59,.18)';ctx.lineWidth=2;for(let l=10;l<50;l+=10){const d=DITCH+(l/50)*(WMAX-DITCH);if(d>FR())break;ctx.beginPath();ctx.arc(HUB.x,HUB.y,d,0,TAU);ctx.stroke()}
    ctx.textAlign='center';const anchors=[.1,Math.PI/2+.1,Math.PI+.1,Math.PI*1.5+.1];let ditched=false;
    for(const a of anchors){const x=HUB.x+Math.cos(a)*(DITCH+60),y=HUB.y+Math.sin(a)*(DITCH+60);if(ditched||!vis({x,y}))continue;ctx.font=F(800,14);txt('☠ THE WASTES · LV 1',x,y,'#ff6a5a');ditched=true}
    for(let l=10;l<50;l+=10){const d=DITCH+(l/50)*(WMAX-DITCH);if(d>FR())break;const a=.36,x=HUB.x+Math.cos(a)*d,y=HUB.y+Math.sin(a)*d;if(vis({x,y})){ctx.font=F(700,13);txt(`WASTES ${l}`,x,y-8,'rgba(255,106,90,.75)')}}
    ctx.restore()}
  for(const o of OUTPOSTS){if(!opOpen(o)||!vis({x:o.x,y:o.y}))continue;ctx.save();ctx.translate(o.x,o.y);ctx.fillStyle='rgba(123,224,143,.12)';ctx.beginPath();ctx.arc(0,0,o.r,0,TAU);ctx.fill();
    ctx.strokeStyle='rgba(123,224,143,.75)';ctx.lineWidth=4;ctx.setLineDash([18,12]);ctx.lineDashOffset=-time*14;ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#24361f';ctx.fillRect(-26,-18,52,36);ctx.strokeStyle='#7be08f';ctx.lineWidth=3;ctx.strokeRect(-26,-18,52,36);ctx.fillStyle='#7be08f';ctx.fillRect(-4,-40,8,24);
    ctx.textAlign='center';ctx.font=F(800,17);txt(o.n.toUpperCase(),0,-50,'#7be08f');ctx.font=F(700,14);txt('SAFE · BANK · REPAIR',0,44,'#cdeccf');ctx.restore()}
  const wt=mode==='guest'?G.wbt||[]:WBK.map(k=>wbT[k]||0);
  WBK.forEach((k,i)=>{const B=WB[k];if(B.reg>R||!vis({x:B.x,y:B.y}))return;const live=enemies.some(e=>!e.dead&&(e.wb===k||e.wbk===k));ctx.save();ctx.translate(B.x,B.y);
    ctx.strokeStyle=B.col;ctx.globalAlpha=.55;ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,0,120,0,TAU);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle='rgba(12,3,2,.55)';ctx.beginPath();ctx.arc(0,0,110,0,TAU);ctx.fill();
    if(!live){ctx.textAlign='center';ctx.font=F(800,34);txt('☠',0,12,B.col);ctx.font=F(800,16);txt(B.n.toUpperCase(),0,-30,B.col);ctx.font=F(700,14);txt(wt[i]>0?`back in ${Math.ceil(wt[i])} s`:`WASTES ${B.wl} · walk in to fight`,0,40,'#f6e7d8')}ctx.restore()});
  for(const e of enemies){if(e.dead||!(e.wb||e.wbk)||!vis(e))continue;ctx.textAlign='center';ctx.font=F(800,18);txt(e.vname.toUpperCase(),e.x,e.y-e.r-30,WB[e.wb||e.wbk].col)}
  for(const p of players){if(p.dead>0||!vis(p)||!(mySkull(p)>0))continue;ctx.textAlign='center';ctx.font=F(800,24);txt('☠',p.x,p.y-p.r-34,'#ff3b3b')}
  const me=mode==='guest'?meP():players.find(q=>!q.remote),pk=save.pet&&CLOG.find(c=>c.k===save.pet);
  if(me&&pk&&me.dead<=0&&vis(me)){me._px=me._px==null?me.x:me._px+(me.x-28-me._px)*.08;me._py=me._py==null?me.y:me._py+(me.y+22-me._py)*.08;const b=Math.sin(time*6)*3;
    ctx.fillStyle=pk.col;ctx.beginPath();ctx.arc(me._px,me._py+b,9,0,TAU);ctx.fill();ctx.strokeStyle='#170804';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#170804';ctx.fillRect(me._px-4,me._py+b-3,2,3);ctx.fillRect(me._px+2,me._py+b-3,2,3)}};
const _dmx12=drawMiniX;drawMiniX=function(mx,my,ms,sc){_dmx12(mx,my,ms,sc);if(VLT)return;
  for(const o of OUTPOSTS){if(!opOpen(o))continue;ctx.fillStyle='#7be08f';ctx.beginPath();ctx.arc(MX(o.x),MY(o.y),3.5,0,TAU);ctx.fill()}
  for(const k of WBK){const B=WB[k];if(B.reg>curReg())continue;ctx.fillStyle=B.col;ctx.fillRect(MX(B.x)-3.5,MY(B.y)-3.5,7,7)}
  if(curReg()>=1){ctx.strokeStyle='rgba(255,59,59,.7)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(MX(HUB.x),MY(HUB.y),DITCH*sc,0,TAU);ctx.stroke()}};
function wastesHud(p,W2,H2){if(VLT||p.dead>0||p.cx==null)return;const w=wlAt(p.x,p.y),o=opAt(p),sk=mySkull(p),split=views().length>1,cx=W2/2;
  let y=split?(mode==='party'&&W>=H?54:12):12;if(!split&&W2>=H2&&(mode==='guest'?G.wev:WEV))y=58;
  const items=[];if(o)items.push([`⛺ ${o.n.toUpperCase()} · SAFE`,'#7be08f','rgba(20,40,18,.88)']);else if(w>0)items.push([`☠ WASTES ${w}`,'#ff6a5a','rgba(40,6,4,.9)']);
  if(sk>0)items.push([`SKULLED ${Math.floor(sk/60)}:${String(Math.floor(sk%60)).padStart(2,'0')} · ×2`,'#ff3b3b','rgba(40,6,4,.9)']);
  ctx.textAlign='center';let x0=cx;const big=!split&&Math.min(W2,H2)>=340,fs=big&&items.length===1?22:15,h=big&&items.length===1?36:28;
  if(items.length){ctx.font=F(800,fs);const ws=items.map(i=>ctx.measureText(i[0]).width+24),tot=ws.reduce((a,b)=>a+b,0)+(items.length-1)*8,fit=Math.min(1,(W2-24)/Math.max(1,tot));
    ctx.font=F(800,Math.max(12,fs*fit));const fitted=items.map(i=>ctx.measureText(i[0]).width+24),sum=fitted.reduce((a,b)=>a+b,0)+(items.length-1)*8;x0=cx-sum/2;
    items.forEach((it,i)=>{ctx.fillStyle=it[2];rr(x0,y,fitted[i],h,h/2);ctx.fill();ctx.strokeStyle=it[1];ctx.lineWidth=2;ctx.stroke();txt(it[0],x0+fitted[i]/2,y+h*.72,it[1]);x0+=fitted[i]+8});y+=h+6}
  const c=mode!=='party'&&curReg()>=1?save.wct:null;if(c&&CTD[c.k]&&(w>0||inHub(p))&&!split){ctx.font=F(700,14);const s=`▸ ${ctText(c)} · ${c.g}/${c.n} · +${c.rw}◆`;const tw=Math.min(W2-24,ctx.measureText(s).width+22);
    ctx.fillStyle='rgba(23,8,4,.78)';rr(cx-tw/2,y,tw,24,12);ctx.fill();txt(s,cx,y+17,'#f6e7d8');y+=30}
  if(mode!=='guest'){const e=enemies.find(q=>!q.dead&&q.wb&&Math.hypot(q.x-p.x,q.y-p.y)<1400);if(e&&!enemies.some(q=>!q.dead&&q.gk)){const bw=Math.min(W2-40,360),portrait=W2<H2,yy=portrait?H2-247:y+20;
      ctx.font=F(800,15);txt(e.vname.toUpperCase(),cx,yy-6,WB[e.wb].col);ctx.fillStyle='rgba(23,8,4,.8)';rr(cx-bw/2-3,yy,bw+6,22,8);ctx.fill();bar(cx-bw/2,yy+3,bw,16,e.hp/(e.max||1),WB[e.wb].col,'#3c0d03')}}}
const _dh12=drawHud;drawHud=function(p,W2,H2,Zv,v){_dh12(p,W2,H2,Zv,v);wastesHud(p,W2,H2)};

/* ---------- BASE · WASTES tab ---------- */
const wst=document.createElement('style');wst.textContent=`
#bbody.t-wastes{grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);grid-template-rows:minmax(0,1fr)}
@media (orientation:portrait){#bbody.t-wastes{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}}
.t-wastes .ct{border:2px solid #5a2a1a;border-radius:12px;padding:8px 10px;background:rgba(23,8,4,.6);display:flex;flex-direction:column;gap:5px;font-size:14px;text-align:left}
.t-wastes .ct b{font-size:15px}.t-wastes .ct .gbar{height:6px}.t-wastes .row3{display:flex;gap:8px;flex-wrap:wrap}.t-wastes .row3 .buy{flex:1;min-width:120px}
.t-wastes .bl{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px;overflow:auto;min-height:0}
.t-wastes .bc{border:2px solid #3a1a10;border-radius:12px;padding:6px 9px;background:rgba(23,8,4,.6);display:flex;flex-direction:column;gap:2px;font-size:14px;text-align:left}
.t-wastes .bc b{font-size:15px}.t-wastes .sl{opacity:.45}.t-wastes .sl.on{opacity:1}.t-wastes .ms{display:flex;gap:6px;flex-wrap:wrap}.t-wastes .ms span{font-size:14px;border-radius:999px;padding:2px 8px;background:rgba(23,8,4,.7)}
.t-wastes .ms span.on{background:#f5c34d;color:#170804}`;document.head.appendChild(wst);
function tabWastes(){const L=ensureWastes(),R=curReg(),me=meP(),inH=(state==='play'||state==='pause')&&me&&me.dead<=0&&(inHub(me)||opAt(me)),n=logCount();
  if(R>=1&&(!save.wct||!CTD[save.wct.k]))newContract();const c=save.wct,sk=me?mySkull(me):0;
  const ct=R<1?`<div class="ct"><b>The Wastes are locked</b><span>Beat Rustjaw at the first gate. Everything past the Ditch is the Wastes.</span></div>`:
    `<div class="ct"><b>CONTRACT · ${save.wctDone} done</b><span>${esc(ctText(c))}</span><div class="gbar"><i style="width:${Math.round(c.g/c.n*100)}%"></i></div><span>${c.g}/${c.n} · reward +${c.rw}◆ +${c.c}⬢ safe</span>
      <div class="row3"><button class="buy sec" data-act="wct">NEW CONTRACT</button></div></div>`;
  const skc=`<div class="ct"><b style="color:#ff3b3b">☠ SKULL${sk>0?` · ${Math.ceil(sk)} s left`:''}</b><span>Wastes scrap pays ×2 when you bank. Die skulled and you lose 1 equipped item (never your last weapon). Attacking a player first skulls you too.</span>
    ${mode==='party'?'':`<div class="row3"><button class="buy${inH&&!(sk>0)&&R>=1?'':' no'}" data-act="wsk">${sk>0?'SKULLED':'TAKE SKULL · 5 MIN'}</button></div>`}${inH||sk>0?'':'<span style="opacity:.7">Take it in the hub or an outpost.</span>'}</div>`;
  const evo=`<div class="ct"><b>EVOLUTIONS</b><span>${Object.values(EVO).map(E=>`${E.n.replace('⚡ ','')}: max ${PERKS[E.req[0]].n} + ${PERKS[E.req[1]].n}`).join(' · ')}</span></div>`;
  const ms=CMS.map((m,i)=>`<span class="${L.ms>i?'on':''}">${m[0]} · ${m[2]} · +${m[1]}◆</span>`).join('');
  const bosses=WBK.map(k=>{const B=WB[k],kc=L.kc[k]|0,dry=L.dry[k]|0,lock=B.reg>R;
    const sl=B.u.map(u=>`<span class="sl${L.has[u[0]]?' on':''}">${L.has[u[0]]?'★':'·'} ${u[3]}</span>`).join('')+`<span class="sl${L.has[B.pet[0]]?' on':''}">${L.has[B.pet[0]]?'♥':'·'} ${B.pet[1]} (pet)</span>`;
    return `<div class="bc" style="border-color:${lock?'#3a1a10':B.col}${lock?';opacity:.55':''}"><b style="color:${B.col}">${B.n}</b><span>Wastes ${B.wl} · ${lock?'locked':`${kc} kills`}</span>${sl}
      <span style="opacity:.8">Unique 1/${WB_UNIQ} · sure by ${WB_PITY - dry} more · pet 1/${WB_PET}</span></div>`}).join('');
  const tags=`<div class="bc"><b>PKer tags</b><span>Wreck PKers · 1/${PK_TAG} · sure within ${PK_PITY-(L.tdry|0)}</span>${TAGS.map((t,i)=>`<span class="sl${L.has[t[0]]?' on':''}" style="color:${t[2]}">${L.has[t[0]]?'★':'·'} ${t[1]} · ${['Wastes 1-19','Wastes 20-34','Wastes 35+'][i]}</span>`).join('')}</div>`;
  return `<div class="pan">${ct}${skc}${evo}</div><div class="pan"><h4>COLLECTION LOG · ${n}/${CLOG.length}${logTitle()?' · "'+logTitle()+'"':''}</h4><div class="ms">${ms}</div><div class="bl">${bosses}${tags}</div></div>`}
const _ba12=baseAct;baseAct=function(a,ds){if(a==='wct'){if(curReg()>=1){newContract();persist();beep(700,.08,'triangle',.05)}renderBase();return}
  if(a==='wsk'){const me=meP();if(me&&(inHub(me)||opAt(me))&&curReg()>=1&&mode!=='party'){if(mode==='guest')netSendHost({t:'skull'});else takeSkull(me);beep(330,.12,'sawtooth',.05)}renderBase();return}
  _ba12(a,ds)};
(()=>{const r=hubBar.querySelector&&hubBar.querySelector('.r');if(r&&r.appendChild){const b=mk('button',null,null,'WASTES');b.dataset.t='wastes';r.appendChild(b)}})();
const _dmc12=drawMapCanvas;drawMapCanvas=function(){_dmc12();const c=$('mapc');if(!c||!c.getContext||!c.clientWidth)return;const w=c.clientWidth,h=c.clientHeight,x=c.getContext('2d'),s=Math.min(w,h)/2/REG[3].out*.94,P=(px,py)=>[w/2+(px-HUB.x)*s,h/2+(py-HUB.y)*s],R=curReg();
  if(R>=1){x.strokeStyle='#ff3b3b';x.lineWidth=2;x.beginPath();x.arc(w/2,h/2,DITCH*s,0,TAU);x.stroke()}
  for(const o of OUTPOSTS){if(!opOpen(o))continue;const[a,b]=P(o.x,o.y);x.fillStyle='#7be08f';x.beginPath();x.arc(a,b,4.5,0,TAU);x.fill()}
  for(const k of WBK){const B=WB[k];if(B.reg>R)continue;const[a,b]=P(B.x,B.y);x.fillStyle=B.col;x.font='800 14px Sora, system-ui, sans-serif';x.textAlign='center';x.fillText('☠',a,b+5)}};
// Outposts are hard safe areas: no player-origin damage in either direction.
const _svVolley=volley;volley=function(p,t){if(opAt(p))return;return _svVolley(p,t)};
const _svHitEnemy=hitEnemy;hitEnemy=function(e,dmg,by,src,crit){if(by&&by.isP&&opAt(by))return;return _svHitEnemy(e,dmg,by,src,crit)};
const _svHitCrate=hitCrate;hitCrate=function(c,dmg,by){if(by&&by.isP&&opAt(by))return;return _svHitCrate(c,dmg,by)};
const _svHitRival=hitRival;hitRival=function(r,dmg,by){if(by&&by.isP&&opAt(by))return;return _svHitRival(r,dmg,by)};
const _svGadget=useGadget;useGadget=function(p,i){if(opAt(p))return false;return _svGadget(p,i)};
ensureWastes();

if(window.__game)Object.defineProperties(window.__game,Object.getOwnPropertyDescriptors({wlAt,wlMax,OUTPOSTS,opAt,inWastes,WB,WBK,spawnWB,onWB,wbCheck,CLOG,addLog,ensureWastes,logCount,newContract,ctEv,EVO,evoReady,rollPerks,volley,
  takeSkull,skullLossLocal,tabWastes,addPKers,update,draw,hitEnemy,hitPlayer,hitRival,hitCrate,killPlayer,updatePlayer,updateWorld,updateEnemies,setupWorld,buildSnap,applySnap,baseAct,renderBase,drawHud,recalc,makeItem,cleanItem,
  get wbT(){return wbT},get wct(){return save.wct}}));

/* ================= v0.13 screen-density overlays =================
   This file loads after the frontier module, so these assignments are deterministic. */
eventPill=function(p,W2,H2){
  const L=HUD_LAYOUT||{},split=views().length>1,tiny=!!L.tiny;
  if(split&&L.viewIndex>0)return;
  const E=mode==='guest'?G.wev:WEV;
  const gk=mode==='guest'?enemies.find(e=>e.type==='boss'&&e.r>48):enemies.find(e=>!e.dead&&e.gk);
  const cx=W2/2,py=H2-(tiny?27:split?31:(W2<H2?166:30)),maxW=Math.max(84,W2-16);
  if(gk&&Math.hypot(gk.x-p.x,gk.y-p.y)<1400){
    const title=(gk.vname||'GATEKEEPER').toUpperCase();let fs=tiny?8:Math.min(12,W2*.035);
    ctx.textAlign='center';ctx.font=F(800,fs);
    while(ctx.measureText(title).width>maxW-12&&fs>7){fs-=.5;ctx.font=F(800,fs)}
    const bw=Math.min(maxW,Math.min(300,W2-20)),by=Math.max(6,py-35);
    txt(title,cx,by-4,'#f5c34d');ctx.fillStyle='rgba(23,8,4,.86)';rr(cx-bw/2-2,by,bw+4,12,6);ctx.fill();
    bar(cx-bw/2,by+2,bw,8,gk.hp/(gk.max||1),'#f5c34d','#3c0d03')
  }
  if(!E)return;
  const N=EVN[E.k];if(!N)return;
  const timer=E.k==='drop'&&E.ph>0?'INCOMING':`${Math.max(0,Math.ceil(E.t))}s`;
  const label=`${N[0]} · ${timer}`;let fs=tiny?9:12;
  ctx.textAlign='center';ctx.font=F(800,fs);
  while(ctx.measureText(label).width>maxW-18&&fs>7){fs-=.5;ctx.font=F(800,fs)}
  const w=Math.min(maxW,ctx.measureText(label).width+16),h=tiny?21:24,y=py;
  ctx.fillStyle='rgba(23,8,4,.9)';rr(cx-w/2,y,w,h,h/2);ctx.fill();ctx.strokeStyle=N[2];ctx.lineWidth=1.5;ctx.stroke();
  txt(label,cx,y+h*.72,N[2]);
  if(p.dead<=0)edgeArrow(p,W2,H2,clamp(Math.min(W2,H2)/700,.5,1.15),E.x,E.y,N[2],N[0].split(' ')[0],.9)
};
miniTop=function(p,W2,H2){
  if(VLT)return;
  const L=HUD_LAYOUT||{},split=views().length>1,ms=L.mapW||Math.round(clamp(W2*(split?.20:.22),72,126));
  const mx=L.mapX==null?W2-ms-10:L.mapX,my=L.mapY||10,R=curReg();
  ctx.save();ctx.beginPath();ctx.rect(mx,my,ms,ms);ctx.clip();
  for(const g of GATES){if(g.r>R)continue;ctx.fillStyle=g.r===R?'#ff6a3d':REG[g.r+1].acc;ctx.fillRect(MX(g.x)-3,MY(g.y)-3,6,6)}
  for(const c of CAMPS){if(c.r>R)continue;ctx.fillStyle=c.st===3?'rgba(246,231,216,.3)':c.st===1?'#ff6a3d':REG[c.r].acc;ctx.beginPath();ctx.moveTo(MX(c.x),MY(c.y)-3);ctx.lineTo(MX(c.x)+3,MY(c.y)+2);ctx.lineTo(MX(c.x)-3,MY(c.y)+2);ctx.fill()}
  for(const s of SHRINES){if(s.r>R||s.cd>0)continue;ctx.fillStyle=BUFFS[s.k][2];ctx.fillRect(MX(s.x)-2,MY(s.y)-2,4,4)}
  const E=mode==='guest'?G.wev:WEV;if(E){ctx.fillStyle=EVN[E.k][2];ctx.globalAlpha=.6+Math.sin(time*6)*.4;ctx.beginPath();ctx.arc(MX(E.x),MY(E.y),4,0,TAU);ctx.fill();ctx.globalAlpha=1}
  ctx.restore();
  const lg=GATES.find(g=>g.r===R);if(lg&&p.dead<=0&&!inHub(p))edgeArrow(p,W2,H2,clamp(Math.min(W2,H2)/700,.5,1.15),lg.x,lg.y,'#ff6a3d','GATE',Math.hypot(p.x-lg.x,p.y-lg.y)<1400?.9:.35)
};
wastesHud=function(p,W2,H2){
  if(VLT||p.dead>0||p.cx==null)return;
  const w=wlAt(p.x,p.y),o=opAt(p),sk=mySkull(p),L=HUD_LAYOUT||{};
  if(w||o||sk>0){
    const x=(L.panelRight||168)+6,limit=(L.mapX==null?W2-8:L.mapX-6),maxW=Math.min(220,W2-x-8,limit-x),lines=[];
    if(o)lines.push([`${o.n.toUpperCase()} · SAFE`,'#7be08f']);else if(w>0)lines.push([`WASTES ${w}`,'#ff6a5a']);
    if(sk>0)lines.push([`☠ ${Math.floor(sk/60)}:${String(Math.floor(sk%60)).padStart(2,'0')} · ×2`,'#ff3b3b']);
    if(maxW>=64&&lines.length){let fs=L.tiny?8:9;for(const [label] of lines){ctx.font=F(800,fs);while(ctx.measureText(label).width>maxW-12&&fs>7){fs-=.5;ctx.font=F(800,fs)}}
      ctx.font=F(800,fs);const width=Math.min(maxW,Math.max(...lines.map(([label])=>ctx.measureText(label).width))+12),rowH=13,height=lines.length*rowH+5,y=(L.panelY||10)+3;
      ctx.fillStyle=sk>0?'rgba(40,6,4,.88)':o?'rgba(20,40,18,.88)':'rgba(40,6,4,.86)';rr(x,y,width,height,7);ctx.fill();
      lines.forEach(([label,col],i)=>{ctx.textAlign='left';ctx.font=F(800,fs);ctx.fillStyle=col;ctx.fillText(label,x+6,y+11+i*rowH)})
    }
  }
  if(mode==='guest'||(L.split&&L.viewIndex>0))return;
  const e=enemies.find(q=>!q.dead&&q.wb&&Math.hypot(q.x-p.x,q.y-p.y)<1400);
  if(!e||enemies.some(q=>!q.dead&&q.gk))return;
  const tiny=!!L.tiny,split=!!L.split,bw=Math.max(76,Math.min(tiny?150:280,W2-20)),h=9;
  const y=H2-(tiny?46:split?59:(W2<H2?78:61)),cx=W2/2;
  ctx.textAlign='center';ctx.font=F(800,tiny?8:10);txt(e.vname.toUpperCase(),cx,y-4,WB[e.wb].col);
  ctx.fillStyle='rgba(23,8,4,.86)';rr(cx-bw/2-2,y,bw+4,h+4,6);ctx.fill();bar(cx-bw/2,y+2,bw,h,e.hp/(e.max||1),WB[e.wb].col,'#3c0d03')
};

/* Final screen-density safety: apply after the frontier wrapper and its earlier timer callback. */
const _v13HudWrapFinal=hudWrap;
hudWrap=function(text,maxW,weight,size,maxLines=2,minSize=9){if(weight===800&&maxLines===1&&size>=20)maxLines=2;return _v13HudWrapFinal(text,maxW,weight,size,maxLines,minSize)};
const _v13EdgeArrowFinal=edgeArrow;
edgeArrow=function(p,W2,H2,Zv,tx,ty,col,label,alpha){
  const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy);if(d*Zv<Math.min(W2,H2)*.42)return;
  const a=Math.atan2(dy,dx),ex=W2/2-24,ey=H2/2-24,k=Math.min(Math.abs(ex/Math.cos(a)||1e9),Math.abs(ey/Math.sin(a)||1e9))*.86;
  let ax=W2/2+Math.cos(a)*k,ay=H2/2+Math.sin(a)*k;const L=HUD_LAYOUT||{};
  const hit=(x,y,b,pad=18)=>b&&x>=b.x-pad&&x<=b.x+b.w+pad&&y>=b.y-pad&&y<=b.y+b.h+pad;
  const blocked=(x,y)=>hit(x,y,{x:L.panelX,y:L.panelY,w:L.panelW,h:L.panelH})||hit(x,y,{x:L.mapX,y:L.mapY,w:L.mapW,h:Math.max(L.mapW,(L.lbBottom||L.mapBottom)-L.mapY)});
  if(blocked(ax,ay)){const candidates=[[W2/2,H2-30],[W2-18,H2*.58],[18,H2*.58],[W2/2,28],[W2/2,H2*.72]],free=candidates.find(q=>!blocked(q[0],q[1]));if(free){ax=free[0];ay=free[1]}}
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(ax,ay);ctx.rotate(a);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(-7,-9);ctx.lineTo(-3,0);ctx.lineTo(-7,9);ctx.closePath();ctx.fill();ctx.restore();
  const t=`${label} ${Math.round(d/10)}m`;ctx.globalAlpha=alpha;ctx.font=F(800,12);ctx.textAlign='center';const tw=ctx.measureText(t).width,lx=clamp(ax,tw/2+4,W2-tw/2-4),ly=clamp(ay+(Math.sin(a)>0?-16:22),16,H2-16);txt(t,lx,ly,col);ctx.globalAlpha=1
};
const _v13DrawHudFinal=drawHud;
drawHud=function(...args){_v13DrawHudFinal(...args);const L=HUD_LAYOUT||{},b=$('hudBtns');if(L.split&&b&&b.style)b.style.top='calc(100% - 40px)'};
const _v13EventPillFinal=eventPill,_v13MiniTopFinal=miniTop,_v13WastesHudFinal=wastesHud;
const _v13RebindOverlays=()=>{eventPill=_v13EventPillFinal;miniTop=_v13MiniTopFinal;wastesHud=_v13WastesHudFinal};
_v13RebindOverlays();setTimeout(_v13RebindOverlays,0);

