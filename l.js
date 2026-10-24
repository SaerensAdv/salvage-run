/* ================= v0.9 · COMPANIONS + GADGETS =================
   One companion (5 drones, 3 minions) + 2 gadget slots with charges.
   Counts where gear counts: Solo, vaults and Co-op raid. Party and online free-for-all stay pure skill.
   Logic first, drawing deliberately simple (visual remake later reuses the logic). */
const CDEF={
  turret:{n:'Turret',k:'drone',ic:'T',col:'#8fd6ff',d:l=>`Shoots the nearest monster · ${(1.1+.1*l).toFixed(1)}/s at ${Math.round(25+3.5*l)}% damage`},
  medic:{n:'Medic',k:'drone',ic:'+',col:'#7be08f',d:l=>`Heals ${(1+.2*l).toFixed(1)}% hp/s after 3 s without a hit`},
  magnet:{n:'Magnet',k:'drone',ic:'U',col:'#f5c34d',d:l=>`Pulls scrap and tech from ${200+18*l} px`},
  aegis:{n:'Aegis',k:'drone',ic:'◇',col:'#c9bfff',d:l=>`Blocks one hit every ${(7.5-.4*l).toFixed(1)} s`},
  scout:{n:'Scout',k:'drone',ic:'◉',col:'#ffd27a',d:l=>`Arrows to elites, chests and rifts · +${(1.5*l).toFixed(1)}% scrap`},
  rat:{n:'Scrap Rat',k:'minion',ic:'r',col:'#c58b5a',hp:l=>40+12*l,d:l=>`Fetches loose scrap (${10+3*l}) · runs 1 hot item home`},
  hound:{n:'Hound',k:'minion',ic:'h',col:'#ff9f6a',hp:l=>70+18*l,d:l=>`Bites for ${Math.round(55+7*l)}% damage · barks to taunt`},
  golem:{n:'Golem',k:'minion',ic:'G',col:'#9aa7b0',hp:l=>180+45*l,d:l=>`Taunts monsters near you, blocks raider shots, slams`}};
const CT=Object.keys(CDEF);
const GDEF={
  grenade:{n:'Grenade',ic:'●',col:'#ff7a45',max:3,cost:0,d:'Thrown at the nearest target · big blast'},
  medkit:{n:'Medkit',ic:'✚',col:'#7be08f',max:2,cost:0,d:'Instantly heals 45% hp'},
  mine:{n:'Mine',ic:'✸',col:'#ff5a3c',max:3,cost:80,d:'Drops at your feet · arms in 0.8 s'},
  smoke:{n:'Smoke',ic:'☁',col:'#c9c2bd',max:2,cost:100,d:'5 s cloud · monsters slow, half their hits miss'},
  decoy:{n:'Decoy',ic:'◎',col:'#c9bfff',max:2,cost:120,d:'Pulls monsters for 6 s, then pops'}};
const GK=Object.keys(GDEF);
const CREW_RANK=2,GAD_RANK=1,CREW_MAX=10,CREW_UNLOCK=120;
let gads=[],crewSig=1,gadSeq=0;
const crewCost=l=>({s:Math.round(40*Math.pow(1.4,l-1)),c:l>=4?l-2:0});
const crewOn=()=>(mode==='solo'||(mode==='host'&&raid)||(mode==='guest'&&!!G.raid))&&!ftueOn();
function ensureCrew(){let c=save.crew;if(!c||typeof c!=='object')c=save.crew={};
  if(typeof c.unl!=='object'||!c.unl)c.unl={};if(typeof c.lv!=='object'||!c.lv)c.lv={};if(typeof c.gu!=='object'||!c.gu)c.gu={};
  for(const k of Object.keys(c.unl))if(!CDEF[k])delete c.unl[k];for(const k of Object.keys(c.gu))if(!GDEF[k])delete c.gu[k];
  for(const k of CT)c.lv[k]=clamp(Math.floor(c.lv[k]||1),1,CREW_MAX);
  if(!CDEF[c.sel]||!c.unl[c.sel])c.sel=null;
  if(!Array.isArray(c.g))c.g=['grenade','medkit'];c.g=[0,1].map(i=>GDEF[c.g[i]]&&(c.gu[c.g[i]]||GDEF[c.g[i]].cost===0)?c.g[i]:null);
  if(c.g[0]&&c.g[0]===c.g[1])c.g[1]=null;
  if(save.rank>=CREW_RANK&&!c.unl.turret&&!Object.keys(c.unl).length){c.unl.turret=1;if(!c.sel)c.sel='turret'}
  return c}
const gadOwned=k=>GDEF[k]&&(GDEF[k].cost===0||!!ensureCrew().gu[k]);
function localCrew(){const c=ensureCrew();return{sel:save.rank>=CREW_RANK?c.sel:null,lv:c.sel?c.lv[c.sel]:1,g:save.rank>=GAD_RANK?c.g.slice():[null,null]}}
function bumpCrew(){crewSig++;persist();if(mode==='guest')sendCrew()}
function sendCrew(){const L=localCrew();netSendHost({t:'crew',sel:L.sel,lv:L.lv,g:L.g})}
const crewLv=p=>(p.crew&&p.crew.lv)||1;
const gadMax=k=>GDEF[k]?GDEF[k].max:0;
function refillGad(p,amt){if(!p.crew)return false;let ch=false;p.gch=p.gch||[0,0];
  for(let i=0;i<2;i++){const k=p.crew.g[i],m=gadMax(k),v=amt==null?m:Math.min(m,p.gch[i]+amt);if(v!==p.gch[i]){p.gch[i]=v;ch=true}}return ch}
function setCrew(p,c){const old=p.crew;p.crew=c;if(!old||old.g[0]!==c.g[0]||old.g[1]!==c.g[1]){p.gch=[0,0];refillGad(p)}
  if(p.cm&&p.cm.type!==c.sel)p.cm=null;recalc(p)}
function mkCm(p){const t=p.crew.sel,D=CDEF[t],lv=crewLv(p),m=D.hp?Math.round(D.hp(lv)*(1+.05*(p.run.lvl-1))):1;
  return{type:t,x:p.x+30,y:p.y+24,hp:m,max:m,r:t==='golem'?18:t==='hound'?13:t==='rat'?9:9,down:0,cd:0,bark:4,taunt:0,sc:0,bag:null,trip:false,tt:0,grab:0,hide:false,ang:rand(0,TAU),slam:2}}
const isMinion=cm=>cm&&CDEF[cm.type].k==='minion';
function cmHome(p,cm){cm.x=p.x+rand(-30,30);cm.y=p.y+30;cm.hide=false}
function downCm(p,cm){cm.down=20;cm.hp=0;fxBurst(cm.x,cm.y,CDEF[cm.type].col,18,220);feedTo(p,`${CDEF[cm.type].n} is down · back in 20 s`,'#ff6a3d');snd(p,140,.2,'sawtooth',.04,.5);
  if(cm.bag){spawnLoot(cm.x,cm.y,cm.bag);feedTo(p,`It dropped ${cm.bag.name}. Go get it.`,GRAR[cm.bag.rar][1]);cm.bag=null;cm.trip=false}
  if(cm.sc>0){dropScrap(cm.x,cm.y,cm.sc,.8);cm.sc=0}}
function deliverItem(p,it){if(p.remote)netSend(p,{t:'item',it});else addToStash(it);
  bannerTo(p,`RAT DELIVERY · ${it.name.toUpperCase()}`,`${GRAR[it.rar][0]} · safe in your stash`,2.8);fan(p,it.rar>=3?587:440);if(!p.remote)persist()}
const notTauntable=e=>e.dead||e.type==='boss'||e.type==='collector'||e.prime||e.bossV;
function nearFoe(x,y,R,skip){let b=null,bd=R*R;for(const e of enemies){if(e.dead||(skip&&skip(e)))continue;const d=(e.x-x)**2+(e.y-y)**2;if(d<bd){bd=d;b=e}}return b}
function stepTo(o,tx,ty,sp,dt){const dx=tx-o.x,dy=ty-o.y,d=Math.hypot(dx,dy);if(d<2)return d;const s=Math.min(d,sp*dt);o.x+=dx/d*s;o.y+=dy/d*s;return d}
function tickCm(p,dt){const cm=p.cm,D=CDEF[cm.type],lv=crewLv(p);cm.cd-=dt;
  if(p.dead>0&&!cm.trip){cm.hide=true;return}
  if(cm.hide&&!cm.trip)cmHome(p,cm);
  if(D.k==='drone'){cm.ang+=dt*1.6;const ox=Math.cos(cm.ang)*40,oy=Math.sin(cm.ang)*22-30;stepTo(cm,p.x+ox,p.y+oy,600,dt);
    if(cm.type==='turret'&&cm.cd<=0&&!inHub(p)&&!p.picking){const t=nearestTarget(cm,340,{rivals:true});
      if(t){cm.cd=1/(1.1+.1*lv);const a=Math.atan2(t.y-cm.y,t.x-cm.x);
        bullets.push({x:cm.x,y:cm.y,vx:Math.cos(a)*720,vy:Math.sin(a)*720,dmg:p.dmg*(.25+.035*lv),owner:p,col:'#8fd6ff',life:.5,pierce:0,bounce:0,hit:new Set(),crit:false,w:3})}}
    else if(cm.type==='medic'&&!inHub(p)&&p.hp<p.maxHp){const calm=time-(p.lastHurt||-99)>3;p.hp=Math.min(p.maxHp,p.hp+p.maxHp*(calm?(1+.2*lv):.2)/100*dt);
      if(calm&&Math.random()<dt*4)parts.push({x:p.x+rand(-12,12),y:p.y-10,vx:0,vy:-40,life:.4,col:'#7be08f',s:3})}
    else if(cm.type==='magnet'){const R=200+18*lv,room=p.carry<p.cap;
      for(const q of pickups){if(q.age>=999||q.age<.25)continue;if(q.k==='s'&&!room)continue;const dx=p.x-q.x,dy=p.y-q.y,d=Math.hypot(dx,dy);
        if(d<R&&d>p.mag*.6){q.x+=dx/d*520*dt;q.y+=dy/d*520*dt}}}
    return}
  if(cm.down>0){cm.down-=dt;cm.hide=true;if(cm.down<=0){const n=mkCm(p);Object.assign(cm,n);cmHome(p,cm);feedTo(p,`${D.n} is back`,D.col)}return}
  if(inHub(p)&&!cm.trip)cm.hp=cm.max;
  if(!cm.trip&&Math.hypot(cm.x-p.x,cm.y-p.y)>750)cmHome(p,cm);
  const fol=(ox,oy,sp)=>stepTo(cm,p.x+ox,p.y+oy,sp,dt);
  if(cm.type==='rat'){const cap=10+3*lv;
    if(cm.trip){if(VLT){cm.burrow=false;cm.hide=false;fol(-26,22,240);vpush(cm);return}
      stepTo(cm,HUB.x,HUB.y,170+10*lv,dt);if(inHub(cm)){deliverItem(p,cm.bag);cm.bag=null;cm.trip=false;cm.hide=true;cm.tt=2}return}
    if(cm.hide){cm.tt-=dt;if(cm.tt>0)return;cmHome(p,cm)}
    if(p.hot&&p.hot.length&&!inHub(p)&&!p.picking){cm.grab+=dt;if(cm.grab>1.5&&Math.hypot(cm.x-p.x,cm.y-p.y)<90){cm.grab=0;
        let bi=0;p.hot.forEach((it,i)=>{if(it.rar>p.hot[bi].rar)bi=i});cm.bag=p.hot.splice(bi,1)[0];cm.trip=true;cm.tt=Math.max(12,30-1.5*lv);
        feedTo(p,`Scrap Rat is running ${cm.bag.name} home`,GRAR[cm.bag.rar][1]);snd(p,880,.1,'triangle',.04);return}}else cm.grab=0;
    if(cm.sc<cap){let best=null,bd=360*360;for(const q of pickups){if(q.k!=='s'||q.age>=999||q.age<.4)continue;if((q.x-p.x)**2+(q.y-p.y)**2>360*360)continue;
        const d=(q.x-cm.x)**2+(q.y-cm.y)**2;if(d<bd){bd=d;best=q}}
      if(best&&(best.x-p.x)**2+(best.y-p.y)**2>(p.mag*.8)**2){if(stepTo(cm,best.x,best.y,240+8*lv,dt)<14){cm.sc+=best.v;best.age=999}return}}
    if(VLT)vpush(cm);if(fol(-26,22,260)<40&&cm.sc>0){const g=Math.min(cm.sc,Math.max(0,p.cap-p.carry));if(g>0){p.carry+=g;cm.sc-=g;fxText(cm.x,cm.y-18,'+'+g,'#c58b5a',14)}}
    return}
  if(cm.type==='hound'){cm.taunt-=dt;cm.bark-=dt;const e=nearFoe(p.x,p.y,320,ee=>ee.type==='collector');
    if(e){if(stepTo(cm,e.x,e.y,280,dt)<e.r+cm.r+4&&cm.cd<=0){cm.cd=.6;hitEnemy(e,p.dmg*(.55+.07*lv),p)}
      if(cm.bark<=0){cm.bark=7;cm.taunt=2.5;fxRing(cm.x,cm.y,230,'#ff9f6a',.35);snd(p,200,.12,'square',.04)}}
    else fol(30,24,300);if(VLT)vpush(cm);return}
  if(cm.type==='golem'){cm.slam-=dt;const e=nearFoe(p.x,p.y,280,ee=>ee.type==='collector');
    if(e){const a=Math.atan2(e.y-p.y,e.x-p.x);stepTo(cm,p.x+Math.cos(a)*55,p.y+Math.sin(a)*55,Math.min(230,p.spd*.9),dt)}else fol(-34,10,Math.min(230,p.spd*.9));
    if(cm.slam<=0&&enemies.some(o=>!o.dead&&Math.hypot(o.x-cm.x,o.y-cm.y)<80+o.r)){cm.slam=3;fxRing(cm.x,cm.y,80,'#9aa7b0',.3);
      for(const o of enemies)if(!o.dead&&Math.hypot(o.x-cm.x,o.y-cm.y)<80+o.r)hitEnemy(o,p.dmg*(.9+.12*lv),p)}
    if(VLT)vpush(cm)}}
function taunters(){const T=[];for(const p of players){const cm=p.cm;if(!p.crew||!cm||cm.hide||cm.down>0||p.dead>0)continue;const lv=crewLv(p);
    if(cm.type==='golem')T.push({x:cm.x,y:cm.y,r:cm.r,R:140+6*lv,o:cm,p});
    else if(cm.type==='hound'&&cm.taunt>0)T.push({x:cm.x,y:cm.y,r:cm.r,R:230,o:cm,p});
    else if(cm.type==='rat'&&cm.trip&&!VLT)T.push({x:cm.x,y:cm.y,r:cm.r,R:140,o:cm,p})}
  for(const g of gads)if(g.k==='dc')T.push({x:g.x,y:g.y,r:14,R:420,o:g,p:g.own});return T}
function hurtTaunter(t,dmg){const o=t.o;if(o.k==='dc'){o.hp-=dmg;fxText(o.x,o.y-20,Math.round(dmg),'#c9bfff',13);return}
  dmg*=o.type==='golem'?.6:1;o.hp-=dmg;fxText(o.x,o.y-22,'-'+Math.round(dmg),'#ff9f6a',13);if(o.hp<=0)downCm(t.p,o)}
function blast(p,x,y,R,dmg,col){fxRing(x,y,R,col,.4);fxBurst(x,y,col,26,300);shk(p,9);snd(p,90,.3,'sawtooth',.06,.4);vb(p,[30,20,40]);
  for(const e of enemies)if(!e.dead&&Math.hypot(e.x-x,e.y-y)<R+e.r)hitEnemy(e,dmg,p);
  for(const r of rivals)if(r.dead<=0&&!inHub(r)&&Math.hypot(r.x-x,r.y-y)<R+r.r)hitRival(r,dmg,p);
  for(const c of crates)if(c.dead<=0&&Math.hypot(c.x-x,c.y-y)<R+c.r)hitCrate(c,dmg,p)}
const inSmoke=o=>gads.some(g=>g.k==='sm'&&(o.x-g.x)**2+(o.y-g.y)**2<g.r*g.r);
function useGadget(p,i){if(!crewOn()||!p||!p.crew||state!=='play')return false;const k=p.crew.g[i];p.gch=p.gch||[0,0];
  if(!k||p.dead>0||p.picking||inHub(p)||(p.gcd||0)>0||p.gch[i]<=0)return false;p.gch[i]--;p.gcd=.5;const D=GDEF[k];
  if(k==='grenade'){const t=nearestTarget(p,430,{rivals:true,crates:true});const tx=t?t.x:p.x+p.dx*240,ty=t?t.y:p.y+p.dy*240;
    gads.push({id:++gadSeq,k:'gr',own:p,sx:p.x,sy:p.y,tx,ty,x:p.x,y:p.y,t:0,T:.55});snd(p,500,.1,'triangle',.04,.6)}
  else if(k==='medkit'){p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.45);fxRing(p.x,p.y,70,'#7be08f',.35);fxText(p.x,p.y-40,'+HP','#7be08f',20);snd(p,660,.2,'sine',.05,1.5)}
  else if(k==='mine'){const mine=gads.filter(g=>g.k==='mi'&&g.own===p);if(mine.length>=3)gads.splice(gads.indexOf(mine[0]),1);
    gads.push({id:++gadSeq,k:'mi',own:p,x:p.x,y:p.y,t:0,life:45});snd(p,300,.08,'square',.04)}
  else if(k==='smoke'){gads.push({id:++gadSeq,k:'sm',own:p,x:p.x,y:p.y,r:150,t:0,life:5});for(const r of rivals)if(r.aggroP===p){r.aggro=0;r.aggroP=null}
    fxBurst(p.x,p.y,'#c9c2bd',30,200);snd(p,180,.4,'sine',.04,.4)}
  else if(k==='decoy'){gads.push({id:++gadSeq,k:'dc',own:p,x:p.x+p.dx*50,y:p.y+p.dy*50,t:0,life:6,hp:60+15*p.run.lvl});fxRing(p.x,p.y,420,'#c9bfff',.4);snd(p,1100,.15,'sine',.04,.5)}
  fxText(p.x,p.y-56,D.n.toUpperCase(),D.col,15);pev(p,'gadget');return true}
function gadTick(dt){for(const g of gads){g.t+=dt;const p=g.own;
    if(g.k==='gr'){const f=Math.min(1,g.t/g.T);g.x=g.sx+(g.tx-g.sx)*f;g.y=g.sy+(g.ty-g.sy)*f;if(f>=1){g.dead=true;blast(p,g.x,g.y,120,p.dmg*4.5,'#ff7a45')}}
    else if(g.k==='mi'){if(g.t>.8&&enemies.some(e=>!e.dead&&Math.hypot(e.x-g.x,e.y-g.y)<44+e.r)){g.dead=true;blast(p,g.x,g.y,130,p.dmg*6,'#ff5a3c')}else if(g.t>g.life)g.dead=true}
    else if(g.k==='sm'){if(g.t>g.life)g.dead=true}
    else if(g.k==='dc'){if(g.t>g.life||g.hp<=0){g.dead=true;blast(p,g.x,g.y,110,p.dmg*3,'#c9bfff')}}}
  gads=gads.filter(g=>!g.dead&&players.includes(g.own))}
function crewTick(dt){const on=crewOn();
  if(mode==='solo'||mode==='host'){const L=on?localCrew():null;for(const p of players)if(!p.remote&&p.crewSig!==crewSig+(on?0:.5)){p.crewSig=crewSig+(on?0:.5);if(L)setCrew(p,L);else{p.crew=null;p.cm=null;recalc(p)}}}
  if(!on){if(gads.length)gads=[];return}
  for(const p of players){if(!p.crew)continue;p.gcd=(p.gcd||0)-dt;if(p.crew.sel){if(!p.cm)p.cm=mkCm(p);tickCm(p,dt)}else p.cm=null}
  gadTick(dt);
  for(const r of rivals)if(r.aggroP&&inSmoke(r.aggroP)){r.aggro=0;r.aggroP=null}}
const _up9=update;update=function(rdt){_up9(rdt);if(state==='play'||state==='pick')crewTick(hitstop>0?rdt*.15:rdt)};
const _uen9=updateEnemies;updateEnemies=function(dt){if(!crewOn())return _uen9(dt);for(const e of enemies){e._px=e.x;e._py=e.y}_uen9(dt);
  const T=taunters(),S=gads.filter(g=>g.k==='sm');if(!T.length&&!S.length)return;
  for(const e of enemies){if(e._px==null||e.dead)continue;
    if(!notTauntable(e)){let t=null,bd=1e18;for(const o of T){const d=(o.x-e.x)**2+(o.y-e.y)**2;if(d<o.R*o.R&&d<bd){bd=d;t=o}}
      if(t){const a=Math.atan2(t.y-e._py,t.x-e._px),d=Math.sqrt(bd);e.vx=Math.cos(a)*e.spd;e.vy=Math.sin(a)*e.spd;
        if(d>e.r+t.r){e.x=e._px+e.vx*dt;e.y=e._py+e.vy*dt}else{e.x=e._px;e.y=e._py}
        if(d<e.r+t.r+3&&e.hitCd<=0){e.hitCd=.7;hurtTaunter(t,e.dmg)}if(VLT)vpush(e)}}
    for(const g of S)if((e.x-g.x)**2+(e.y-g.y)**2<g.r*g.r&&e.type!=='collector'){e.x=e._px+(e.x-e._px)*.35;e.y=e._py+(e.y-e._py)*.35;break}}};
const _ub9=updateBullets;updateBullets=function(dt){if(crewOn()){const gs=players.map(p=>p.cm).filter(c=>c&&c.type==='golem'&&!c.hide&&!(c.down>0));
    if(gs.length)for(const b of bullets){if(b.life<=0||(b.owner&&b.owner.isP))continue;for(const c of gs)if((b.x-c.x)**2+(b.y-c.y)**2<(c.r+6)**2){b.life=0;fxBurst(b.x,b.y,'#9aa7b0',4,90);break}}}
  _ub9(dt)};
const _hp9=hitPlayer;hitPlayer=function(p,dmg,by){if(p.dead>0||p.inv>0||inHub(p)||p.picking||!crewOn())return _hp9(p,dmg,by);
  if(by&&by.type&&inSmoke(p)&&Math.random()<.5){fxText(p.x,p.y-30,'MISS','#c9c2bd',15);p.inv=.15;return}
  const cm=p.crew&&p.cm;if(cm&&cm.type==='aegis'&&cm.cd<=0){cm.cd=7.5-.4*crewLv(p);p.inv=.3;fxRing(p.x,p.y,46,'#c9bfff',.3);snd(p,1300,.08,'sine',.05,.5);return}
  const h=p.hp;_hp9(p,dmg,by);if(p.hp<h)p.lastHurt=time};
const _rc9=recalc;recalc=function(p){const h=p.hp;_rc9(p);if(Number.isFinite(h))p.hp=Math.min(h,p.maxHp);if(p.crew&&p.crew.sel&&crewOn()){p.gs=(p.gs||0)+1.5*crewLv(p);if(p.crew.sel==='scout')p.scrapF=(p.scrapF||0)+.015*crewLv(p)}};
const _fb9=finishBank;finishBank=function(p,h,v){_fb9(p,h,v);if(crewOn()&&refillGad(p))fxText(p.x,p.y-70,'GADGETS REFILLED','#8fd6ff',15)};
const _rs9=respawn;respawn=function(p){_rs9(p);if(p.crew)refillGad(p);if(p.cm&&isMinion(p.cm)&&!p.cm.trip)cmHome(p,p.cm)};
const _ev9=enterVault;enterVault=function(p,o){_ev9(p,o);if(p.crew)refillGad(p);if(p.cm&&!p.cm.trip)cmHome(p,p.cm);gads=[]};
const _vx9=vExtract;vExtract=function(p){const cm=p&&p.cm;if(cm&&cm.type==='rat'&&cm.trip&&cm.bag){deliverItem(p,cm.bag);cm.bag=null;cm.trip=false;cm.burrow=false;cm.hide=false}return _vx9(p)};
const _kp9=killPlayer;killPlayer=function(p,by){const cm=p&&p.cm;if(cm&&cm.type==='rat'&&cm.trip&&cm.bag){spawnLoot(p.x,p.y,cm.bag);cm.bag=null;cm.trip=false;cm.burrow=false;cm.hide=false}return _kp9(p,by)};
const _vd9=vDeeper;vDeeper=function(p){_vd9(p);if(p.crew)refillGad(p,1);if(p.cm&&!p.cm.trip)cmHome(p,p.cm);gads=[]};
const _evx9=endVault;endVault=function(p){_evx9(p);gads=[];if(p&&p.cm&&!p.cm.trip)cmHome(p,p.cm)};
const _sw9=setupWorld;setupWorld=function(m,pl){_sw9(m,pl);gads=[];for(const p of players){p.cm=null;if(p.remote){if(p.crew)refillGad(p)}else{p.crewSig=0;p.gch=[0,0];p.crew=null}}};
const _btm9=backToMenu;backToMenu=function(){gads=[];_btm9()};
const _ru9=rankUp;rankUp=function(){const r=save.rank;_ru9();ensureCrew();
  if(r<GAD_RANK&&save.rank>=GAD_RANK)pushFeedLocal('Gadgets unlocked · Grenade + Medkit on Q / E','#8fd6ff');
  if(r<CREW_RANK&&save.rank>=CREW_RANK)pushFeedLocal('Companions unlocked · your Turret drone is live. Open CREW (✦)','#8fd6ff');bumpCrew()};
function crewUnlock(k){const c=ensureCrew();if(!CDEF[k]||c.unl[k]||save.rank<CREW_RANK||save.bank<CREW_UNLOCK)return false;save.bank-=CREW_UNLOCK;c.unl[k]=1;if(!c.sel)c.sel=k;bumpCrew();refreshShop();return true}
function crewSel(k){const c=ensureCrew();if(k!==null&&(!CDEF[k]||!c.unl[k]))return false;c.sel=k;bumpCrew();return true}
function crewFeed(k){const c=ensureCrew();if(!c.unl[k])return false;const l=c.lv[k];if(l>=CREW_MAX)return false;const q=crewCost(l);
  if(save.bank<q.s||(save.cores||0)<q.c)return false;save.bank-=q.s;save.cores=(save.cores||0)-q.c;c.lv[k]=l+1;bumpCrew();refreshShop();return true}
function gadUnlock(k){const c=ensureCrew();if(!GDEF[k]||gadOwned(k)||save.rank<GAD_RANK||save.bank<GDEF[k].cost)return false;save.bank-=GDEF[k].cost;c.gu[k]=1;bumpCrew();refreshShop();return true}
function gadSlot(k,i){const c=ensureCrew();if(!gadOwned(k)||save.rank<GAD_RANK||(i!==0&&i!==1))return false;if(c.g[1-i]===k)c.g[1-i]=c.g[i];c.g[i]=k;bumpCrew();return true}
const _ho9=hostOnData;hostOnData=function(conn,d){const p=d&&players.find(q=>q.id===conn.pid);
  if(d&&d.t==='crew'){if(!p)return;const sel=CDEF[d.sel]?d.sel:null,g=[0,1].map(i=>Array.isArray(d.g)&&GDEF[d.g[i]]?d.g[i]:null);if(g[0]&&g[0]===g[1])g[1]=null;
    setCrew(p,{sel,lv:clamp(d.lv|0,1,CREW_MAX),g});return}
  if(d&&d.t==='gad'){if(p)useGadget(p,(d.i|0)===1?1:0);return}
  _ho9(conn,d)};
const _bs9=buildSnap;buildSnap=function(c){const s=_bs9(c);if(!s||!raid)return s;const P=players.find(q=>q.id===c.pid);
  s.CM=players.filter(q=>q.crew&&q.cm&&!q.cm.hide&&!(q.cm.down>0)).map(q=>[q.id,CT.indexOf(q.cm.type),Math.round(q.cm.x),Math.round(q.cm.y),q.cm.max>1?Math.round(100*q.cm.hp/q.cm.max):100,q.cm.bag?q.cm.bag.rar+1:0,q.cm.taunt>0?1:0]);
  s.GD=gads.map(g=>[g.id,['gr','mi','sm','dc'].indexOf(g.k),Math.round(g.x),Math.round(g.y),r2(g.t)]);s.GC=P&&P.gch?P.gch.slice(0,2):[0,0];return s};
const _as9=applySnap;applySnap=function(s){_as9(s);if(mode!=='guest')return;const old=new Map((G.cms||[]).map(o=>[o.id,o]));
  G.cms=Array.isArray(s.CM)?s.CM.slice(0,4).map(a=>{const o=old.get(a[0])||{x:a[2],y:a[3]};return Object.assign(o,{id:a[0],type:CT[a[1]]||'turret',tx:a[2],ty:a[3],hpf:clamp(a[4]|0,0,100)/100,bag:a[5]|0,taunt:a[6]?1:0})}):[];
  G.gads=Array.isArray(s.GD)?s.GD.slice(0,40).map(a=>({id:a[0],k:['gr','mi','sm','dc'][a[1]]||'mi',x:a[2],y:a[3],t:+a[4]||0,r:150,life:a[1]===2?5:6})):[];
  G.gch=Array.isArray(s.GC)?[clamp(s.GC[0]|0,0,9),clamp(s.GC[1]|0,0,9)]:[0,0]};
const _go9=guestOnData;guestOnData=function(d){_go9(d);if(d&&(d.t==='welcome'||d.t==='raidStart'))sendCrew()};
let gadSent=0;
function gadFor(i){if(mode==='guest'){if(!crewOn()||state!=='play'||time-gadSent<.3)return;gadSent=time;netSendHost({t:'gad',i});return}
  const p=players.find(q=>!q.remote);if(p)useGadget(p,i)}
addEventListener('keydown',e=>{const k=(e.key||'').toLowerCase();if(e.target&&e.target.tagName==='INPUT'||mode==='party')return;if(k==='q')gadFor(0);if(k==='e')gadFor(1)});
const gst9=document.createElement('style');gst9.textContent=`.gad{position:fixed;width:62px;height:62px;border-radius:50%;border:3px solid #8fd6ff;display:none;background:rgba(60,13,3,.85);box-shadow:0 4px 0 #170804;padding:0;color:#f6e7d8;font:800 18px Sora,system-ui,sans-serif;line-height:1}
.gad small{display:block;font-size:13px;margin-top:2px}.gad:active{transform:translateY(3px)}#gad0{right:118px;bottom:30px}#gad1{right:30px;bottom:124px}
#crew{justify-content:flex-start}#crew h3{margin:6px 0 0;font-size:15px;letter-spacing:.14em;color:#ed9b49}
.cw{width:min(94vw,480px);display:grid;gap:6px}.cw .ci{background:rgba(60,13,3,.55);border:2px solid #3a1a10;border-radius:12px;padding:8px 10px;text-align:left;font-size:14px}
.cw .ci.on{border-color:#8fd6ff}.cw .ci b{font-size:16px}.cw .ci .gb{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}.cw .lock{opacity:.55}`;document.head.appendChild(gst9);
const gadEls=[0,1].map(i=>{const b=document.createElement('button');b.className='gad';b.id='gad'+i;b.setAttribute('aria-label','Gadget '+(i+1));
  b.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();gadFor(i)});document.body.appendChild(b);return b});
const _ut9=uiTick;uiTick=function(){_ut9();const playing=state==='play'||state==='pick'||state==='pause',me=meP();
  if(playing&&mode!=='party'){const s=padState(0);if(s){if(edge(0,4,s.b(4)))gadFor(0);if(edge(0,5,s.b(5)))gadFor(1)}}
  const L=mode==='guest'?localCrew():me&&me.crew,ch=mode==='guest'?(G.gch||[0,0]):(me&&me.gch)||[0,0];
  gadEls.forEach((b,i)=>{const k=L&&L.g[i];if(!playing||mode==='party'||!crewOn()||!k||!me||me.dead>0||inHub(me)){b.style.display='none';return}
    const D=GDEF[k];b.style.display='block';b.style.borderColor=D.col;b.style.opacity=ch[i]>0?1:.45;b.innerHTML=`${D.ic}<small>${ch[i]}</small>`})};
const crewEl=document.createElement('div');crewEl.id='crew';crewEl.className='sub';document.body.appendChild(crewEl);let crewWasPlay=false;
function refreshCrewUI(){if(crewEl.style.display!=='flex')return;const c=ensureCrew(),ok=canSwap(),R=save.rank;
  let h=`<h2>CREW</h2><div style="opacity:.75;font-size:14px;max-width:440px">One companion, two gadgets. They count in Solo, vaults and Co-op raids. Party and free-for-all stay pure skill.${ok?'':' · Changes only in the hub.'}</div>`;
  h+=`<div style="font-size:14px">${save.bank} safe scrap · ${save.cores||0} cores</div><h3>COMPANIONS</h3><div class="cw">`;
  if(R<CREW_RANK)h+=`<div class="ci lock">Companions unlock at rank ${CREW_RANK+1}. Your first one, a Turret drone, is free.</div>`;
  else for(const k of CT){const D=CDEF[k],own=!!c.unl[k],l=c.lv[k],q=crewCost(l),on=c.sel===k;
    h+=`<div class="ci${on?' on':''}${own?'':' lock'}"><b style="color:${D.col}">${D.ic} ${D.n}</b> · ${D.k==='drone'?'Drone':'Minion'}${own?` · Lv ${l}/${CREW_MAX}`:''}<br>${D.d(l)}${D.hp?` · ${D.hp(l)} hp, back in 20 s when downed`:''}<div class="gb">`;
    if(!own)h+=`<button class="alt sm" data-cu="${k}" ${ok&&save.bank>=CREW_UNLOCK?'':'disabled'}>UNLOCK · ${CREW_UNLOCK}</button>`;
    else{h+=on?`<button class="alt sm" data-cs="" ${ok?'':'disabled'}>UNEQUIP</button>`:`<button class="alt sm" data-cs="${k}" ${ok?'':'disabled'}>EQUIP</button>`;
      h+=l<CREW_MAX?`<button class="alt sm" data-cf="${k}" ${ok&&save.bank>=q.s&&(save.cores||0)>=q.c?'':'disabled'}>FEED · ${q.s}${q.c?` + ${q.c} cores`:''}</button>`:'<span class="uq">MAX</span>'}
    h+='</div></div>'}
  h+=`</div><h3>GADGETS · Q / E · LB / RB</h3><div class="cw">`;
  if(R<GAD_RANK)h+=`<div class="ci lock">Gadgets unlock at rank ${GAD_RANK+1}.</div>`;
  else for(const k of GK){const D=GDEF[k],own=gadOwned(k),si=c.g.indexOf(k);
    h+=`<div class="ci${si>=0?' on':''}${own?'':' lock'}"><b style="color:${D.col}">${D.ic} ${D.n}</b> · ${D.max} charges · refills when you bank${si>=0?` · <span class="uq">slot ${si+1}</span>`:''}<br>${D.d}<div class="gb">`;
    if(!own)h+=`<button class="alt sm" data-gu="${k}" ${ok&&save.bank>=D.cost?'':'disabled'}>UNLOCK · ${D.cost}</button>`;
    else h+=[0,1].map(i=>`<button class="alt sm" data-gs="${k}" data-i="${i}" ${ok&&c.g[i]!==k?'':'disabled'}>SLOT ${i+1}</button>`).join('');
    h+='</div></div>'}
  h+=`</div><button class="big" id="crewClose">CLOSE</button>`;crewEl.innerHTML=h;
  const on=(sel,f)=>crewEl.querySelectorAll(sel).forEach(b=>b.addEventListener('click',()=>{if(!canSwap())return;if(f(b)){beep(760,.08,'triangle',.05);refreshCrewUI()}}));
  on('[data-cu]',b=>crewUnlock(b.dataset.cu));on('[data-cs]',b=>crewSel(b.dataset.cs||null));on('[data-cf]',b=>{const r=crewFeed(b.dataset.cf);if(r)fanfareLocal(620);return r});
  on('[data-gu]',b=>gadUnlock(b.dataset.gu));on('[data-gs]',b=>gadSlot(b.dataset.gs,+b.dataset.i));
  const cl=$('crewClose');if(cl&&cl.addEventListener)cl.addEventListener('click',closeCrew)}
function openCrew(){ensureCrew();if(state==='play'&&pausing()){state='pause';crewWasPlay=true}releaseAll();crewEl.style.display='flex';refreshCrewUI()}
function closeCrew(){crewEl.style.display='none';if(crewWasPlay&&state==='pause')state='play';crewWasPlay=false;if(state==='menu')menuMeta()}
(()=>{const hb=$('hudBtns');if(hb){const b=document.createElement('button');b.id='crewBtn';b.setAttribute('aria-label','Crew');b.textContent='✦';
    b.addEventListener('pointerdown',e=>{e.stopPropagation();openCrew()});hb.appendChild(b)}
  const md=$('menu')&&$('menu').querySelector('.modes');if(md){const b=document.createElement('button');b.className='alt';b.id='goCrew';b.innerHTML='CREW<small id="crewSub"></small>';
    b.addEventListener('click',openCrew);md.appendChild(b)}})();
const _mm9=menuMeta;menuMeta=function(){_mm9();const c=ensureCrew(),s=$('crewSub');if(!s)return;
  s.textContent=save.rank<GAD_RANK?`gadgets at rank ${GAD_RANK+1}`:save.rank<CREW_RANK?`companions at rank ${CREW_RANK+1}`:c.sel?`${CDEF[c.sel].n} Lv ${c.lv[c.sel]} · ${c.g.filter(Boolean).map(k=>GDEF[k].n).join(' + ')}`:'pick a companion'};
const _up9b=update;update=function(rdt){_up9b(rdt);const cb=$('crewBtn');if(cb)cb.style.display=mode==='party'||(mode==='host'&&!raid)?'none':''};
function drawCm(x,y,type,hpf,bag,taunt){const D=CDEF[type];if(!D)return;ctx.save();ctx.translate(x,y);
  if(D.k==='drone'){const b=Math.sin(time*4+x*.01)*3;ctx.fillStyle='rgba(23,8,4,.35)';ctx.beginPath();ctx.ellipse(0,26,8,3,0,0,TAU);ctx.fill();ctx.translate(0,b);
    ctx.fillStyle=D.col;ctx.strokeStyle='#170804';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,9,0,TAU);ctx.fill();ctx.stroke();
    ctx.strokeStyle=D.col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-14,-2);ctx.lineTo(14,-2);ctx.stroke()}
  else{const r=type==='golem'?18:type==='hound'?13:9;if(taunt){ctx.globalAlpha=.25+.15*Math.sin(time*10);ctx.strokeStyle=D.col;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r+10,0,TAU);ctx.stroke();ctx.globalAlpha=1}
    ctx.fillStyle=D.col;ctx.strokeStyle='#170804';ctx.lineWidth=3;if(type==='golem'){rr(-r,-r,r*2,r*2,5);ctx.fill();ctx.stroke()}
    else{ctx.beginPath();ctx.ellipse(0,0,r*1.25,r,0,0,TAU);ctx.fill();ctx.stroke()}
    if(hpf<1)bar(-16,-r-10,32,4,hpf,'#7be08f');
    if(bag){ctx.save();ctx.translate(0,-r-18);ctx.rotate(Math.PI/4);ctx.fillStyle=GRAR[bag-1][1];ctx.fillRect(-5,-5,10,10);ctx.restore()}}
  ctx.font=F(800,12);ctx.textAlign='center';ctx.fillStyle='#170804';ctx.fillText(D.ic,0,D.k==='drone'?4+Math.sin(time*4+x*.01)*3:4);ctx.restore()}
function drawGad(g){ctx.save();ctx.translate(g.x,g.y);
  if(g.k==='gr'){const f=Math.min(1,g.t/.55),hgt=Math.sin(f*Math.PI)*40;ctx.fillStyle='rgba(23,8,4,.35)';ctx.beginPath();ctx.ellipse(0,4,6,2,0,0,TAU);ctx.fill();
    ctx.fillStyle='#ff7a45';ctx.strokeStyle='#170804';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-hgt,6,0,TAU);ctx.fill();ctx.stroke()}
  else if(g.k==='mi'){const armed=g.t>.8,bl=armed&&Math.sin(time*10)>0;ctx.fillStyle='#3a1a10';ctx.beginPath();ctx.arc(0,0,9,0,TAU);ctx.fill();
    ctx.fillStyle=bl?'#ff5a3c':'#7a3a20';ctx.beginPath();ctx.arc(0,0,4,0,TAU);ctx.fill();if(armed){ctx.globalAlpha=.12;ctx.strokeStyle='#ff5a3c';ctx.beginPath();ctx.arc(0,0,44,0,TAU);ctx.stroke()}}
  else if(g.k==='sm'){const life=g.life||5,a=Math.max(0,Math.min(1,(life-g.t)/1))*.55;ctx.globalAlpha=a;ctx.fillStyle='#c9c2bd';
    for(let i=0;i<7;i++){const an=i/7*TAU+time*.3;ctx.beginPath();ctx.arc(Math.cos(an)*70,Math.sin(an)*60,70,0,TAU);ctx.fill()}}
  else if(g.k==='dc'){const pu=.5+.5*Math.sin(time*8);ctx.globalAlpha=.25*pu;ctx.fillStyle='#c9bfff';ctx.fillRect(-4,-90,8,90);ctx.globalAlpha=1;
    ctx.fillStyle='#c9bfff';ctx.strokeStyle='#170804';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,12,0,TAU);ctx.fill();ctx.stroke();
    ctx.globalAlpha=.3*pu;ctx.beginPath();ctx.arc(0,0,30+pu*14,0,TAU);ctx.stroke()}
  ctx.restore()}
const _dh9=drawHud;drawHud=function(p,W2,H2,Zv,v){if(crewOn()&&p.cx!=null){const vis=o=>Math.abs(o.x-p.cx)<W2/Zv/2+160&&Math.abs(o.y-p.cy)<H2/Zv/2+160;
    ctx.save();ctx.translate(W2/2,H2/2);ctx.scale(Zv,Zv);ctx.translate(-p.cx,-p.cy);
    const GL=mode==='guest'?(G.gads||[]):gads;for(const g of GL)if(g.k==='sm'&&vis(g))drawGad(g);for(const g of GL)if(g.k!=='sm'&&vis(g))drawGad(g);
    if(mode==='guest'){const k=Math.min(1,fdt*10);for(const o of G.cms||[]){o.x+=(o.tx-o.x)*k;o.y+=(o.ty-o.y)*k;if(vis(o))drawCm(o.x,o.y,o.type,o.hpf,o.bag,o.taunt)}}
    else for(const q of players){const c=q.cm;if(q.crew&&c&&!c.hide&&!(c.down>0)&&q.dead<=0||c&&c.trip&&!c.hide&&q.crew)if(vis(c))drawCm(c.x,c.y,c.type,c.max>1?c.hp/c.max:1,c.bag?c.bag.rar+1:0,c.taunt>0)}
    ctx.restore()}
  _dh9(p,W2,H2,Zv,v);
  const sel=mode==='guest'?localCrew().sel:p.crew&&p.crew.sel;
  if(crewOn()&&sel==='scout'&&p.dead<=0&&!inHub(p)){let n=0;
    for(const e of enemies)if(!e.dead&&e.elite&&n<3&&Math.hypot(e.x-p.x,e.y-p.y)<1600){edgeArrow(p,W2,H2,Zv,e.x,e.y,'#ffd27a','ELITE',.85);n++}
    for(const c of crates)if(c.chest&&c.dead<=0&&n<5&&Math.hypot(c.x-p.x,c.y-p.y)<2000){edgeArrow(p,W2,H2,Zv,c.x,c.y,'#f5c34d','CHEST',.85);n++}
    if(rift&&!VLT)edgeArrow(p,W2,H2,Zv,rift.x,rift.y,'#b57cff','RIFT',.9)}
  if(crewOn()&&p.dead<=0){const c=mode==='guest'?null:p.cm;if(c&&isMinion(c)&&c.down>0){ctx.font=F(700,14);ctx.textAlign='center';txt(`${CDEF[c.type].n} back in ${Math.ceil(c.down)} s`,W2/2,H2-(views().length>1?20:130),'#ff9f6a')}
    if(c&&c.trip){ctx.font=F(700,14);ctx.textAlign='center';txt(VLT?`Rat carries ${c.bag?c.bag.name:'loot'} · extract to secure`:`Rat is running ${c.bag?c.bag.name:'loot'} home`,W2/2,H2-(views().length>1?38:148),'#c58b5a')}}};
if(window.__game)Object.defineProperties(window.__game,Object.getOwnPropertyDescriptors({update,crewTick,useGadget,gadFor,crewUnlock,crewSel,crewFeed,gadUnlock,gadSlot,crewCost,ensureCrew,localCrew,
  openCrew,closeCrew,refreshCrewUI,recalc,enterVault,endVault,startDailyVault,vExtract,killPlayer,hitPlayer,updateEnemies,taunters,inSmoke,CDEF,GDEF,
  get gads(){return gads},get bullets(){return bullets},set gads(v){gads=v},get crewHtml(){return crewEl.innerHTML},get crewSig(){return crewSig}}));
