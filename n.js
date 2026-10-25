/* ================= v0.10 · UI SHELL =================
   One BASE screen with tabs (Upgrades · Gear · Crew · Map) that fits the screen: select, don't scroll.
   Responsive menu, hub bar, clearer level-up cards, pause in columns. Portrait and landscape. */
const nst=document.createElement('style');nst.textContent=`
#shop,#gearBtn,#crewBtn,#goGear,#goCrew,#menuMeta,#menu>small{display:none!important}
#menu{padding:max(14px,env(safe-area-inset-top)) 18px 14px;gap:0;justify-content:center}
.mwrap{display:flex;flex-direction:column;align-items:center;gap:14px;width:min(94vw,440px)}
.mL,.mR{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}
#menu h1{font-size:clamp(52px,15vw,104px)}#menu .mL>p{font-size:16px;max-width:320px}
#prof{width:100%;background:rgba(60,13,3,.62);border:2px solid #5a2a1a;border-radius:16px;padding:10px 14px;display:flex;flex-direction:column;gap:7px;text-align:left}
#prof .pr1{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:15px}#prof .pr1 b{font-size:18px;color:var(--gold)}
#prof .gbar{height:6px}#prof .chips{display:flex;gap:8px;flex-wrap:wrap}.chip{font:700 14px Sora,system-ui,sans-serif;background:rgba(23,8,4,.7);border-radius:999px;padding:4px 10px;white-space:nowrap}
#menu .chars{flex-wrap:nowrap}#menu .chars button{width:auto;flex:1;min-width:0;padding:8px 6px}
#menu .modes{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:10px}#menu .modes #go{grid-column:1/-1;padding:18px}
#menu .modes .alt{padding:12px 10px;font-size:16px;min-height:64px}#menu .modes .alt small{font-size:14px}
#goBase{border-color:var(--gold)!important}#menu #reset{margin-top:6px}
@media (orientation:landscape) and (max-height:620px){
  .mwrap{flex-direction:row;align-items:center;gap:26px;width:min(96vw,900px)}.mL,.mR{flex:1;gap:9px}
  #menu h1{font-size:clamp(44px,9.5vh,74px)}#menu .mL>p{display:none}#menu .modes #go{padding:14px}#menu .modes .alt{min-height:56px;padding:9px}}
#hudBtns button#baseBtn{font-size:22px}
#hubBar{position:fixed;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);display:none;flex-direction:column;align-items:center;gap:8px;z-index:3}
#hubBar .t{font:700 14px Sora,system-ui,sans-serif;letter-spacing:.14em;color:var(--gold);text-shadow:0 2px 0 var(--deep)}
#hubBar .r{display:flex;gap:8px}#hubBar button{font:800 15px Sora,system-ui,sans-serif;letter-spacing:.06em;padding:12px 16px;border-radius:14px;border:2px solid var(--gold);background:rgba(60,13,3,.94);box-shadow:0 4px 0 var(--soot);color:var(--ink)}
#hubBar button.hot{background:var(--gold);color:var(--deep)}
@media (orientation:landscape) and (max-height:620px){#gad0{right:118px!important;bottom:24px!important}#gad1{right:190px!important;bottom:24px!important}#hubBar{bottom:12px}}
#base{position:fixed;inset:0;display:none;flex-direction:column;background:rgba(23,8,4,.97);z-index:5;padding:max(10px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));gap:8px;touch-action:none}
#base .bh{display:flex;align-items:center;gap:10px}#base .bh h2{margin:0;font-size:26px;font-weight:800;color:var(--gold);letter-spacing:-.01em;text-shadow:0 3px 0 var(--blood)}
#base .bh .chips{display:flex;gap:6px;flex:1;justify-content:flex-end;flex-wrap:wrap}#base .x{width:44px;height:44px;border-radius:12px;border:2px solid #5a2a1a;background:rgba(60,13,3,.9);font-size:20px;flex:none}
#base .tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}#base .tabs button{font:800 14px Sora,system-ui,sans-serif;letter-spacing:.08em;padding:11px 4px;border-radius:12px;border:2px solid #5a2a1a;background:rgba(60,13,3,.8)}
#base .tabs button.on{border-color:var(--gold);background:var(--gold);color:var(--deep)}
#bbody{flex:1;min-height:0;display:grid;gap:10px}
.pan{background:rgba(60,13,3,.55);border:2px solid #3a1a10;border-radius:14px;padding:10px;min-height:0;min-width:0;display:flex;flex-direction:column;gap:8px;overflow:hidden}
.pan h4{margin:0;font-size:14px;letter-spacing:.14em;color:var(--scrap);font-weight:700}
.note2{font-size:14px;opacity:.7;line-height:1.4}
.ugrid{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));align-content:start}
.ut{background:rgba(60,13,3,.7);border:2px solid #5a2a1a;border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:8px;text-align:left}
.ut b{font-size:18px}.ut .d{font-size:14px;opacity:.75}.pips{display:flex;gap:3px}.pips i{flex:1;height:8px;border-radius:2px;background:#3c0d03}.pips i.f{background:var(--gold)}.pips i.n{background:#7be08f}
.buy{font:800 15px Sora,system-ui,sans-serif;padding:10px;border-radius:12px;border:0;background:var(--gold);color:var(--deep)!important;box-shadow:0 4px 0 var(--blood)}
.buy.no{background:#5a2a1a;color:rgba(246,231,216,.6)!important;box-shadow:none}.buy.sec{background:rgba(23,8,4,.8);color:var(--ink)!important;border:2px solid var(--scrap);box-shadow:none}
.tiles{display:grid;gap:6px;align-content:start}
.tl{position:relative;border-radius:12px;border:2px solid #3a1a10;background:rgba(23,8,4,.7);padding:6px;display:flex;flex-direction:column;justify-content:space-between;text-align:left;min-width:0;overflow:hidden;height:66px}
.tl .sh{display:none}.ctl{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}.ctl .tl{height:56px}
.tl.sel{outline:3px solid var(--ink);outline-offset:-1px}.tl .n{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tl .s{font-size:14px;opacity:.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tl .bd{position:absolute;top:3px;right:5px;font-size:14px;font-weight:800}.tl.lock{opacity:.5}.tl.empty{opacity:.45;border-style:dashed}
.pager{display:flex;align-items:center;justify-content:space-between;gap:6px}.pager button{width:44px;height:36px;border-radius:10px;border:2px solid #5a2a1a;background:rgba(23,8,4,.8);font-size:18px}
.det{gap:6px}.det .nm{font-size:18px;font-weight:800}.det .sb{font-size:14px;opacity:.75}.det .st{font-size:14px;line-height:1.45}.det .acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:auto}
.det .acts button{flex:1;min-width:110px}.up{color:#7be08f}.dn{color:#ff6a3d}.uq{color:#f5c34d}.pk{color:#b57cff}
.rl{display:grid;gap:8px;align-content:start}.rc{border-radius:12px;border:2px solid #3a1a10;padding:9px 11px;background:rgba(23,8,4,.6);display:flex;flex-direction:column;gap:3px;text-align:left;font-size:14px}
.rc b{font-size:16px}.rc.cur{border-color:var(--gold)}.rc.lock{opacity:.55}
#mapc{width:100%;height:100%;display:block}
@media (orientation:portrait),(max-width:700px){
  #bbody.t-gear{grid-template-columns:1fr;grid-template-rows:auto 1fr auto}#bbody.t-crew{grid-template-columns:1fr;grid-template-rows:1fr auto}#bbody.t-map{grid-template-rows:minmax(0,1fr) auto}
  #bbody.t-gear .det,#bbody.t-crew .det{min-height:178px}.slots{grid-template-columns:repeat(5,1fr)}.slots .lf{display:none}.slots .sh{display:inline}}
@media (orientation:landscape) and (min-width:701px){
  #bbody.t-gear{grid-template-columns:minmax(0,.85fr) minmax(0,1.3fr) minmax(0,1fr)}#bbody.t-crew{grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)}#bbody.t-map{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
  .slots{grid-template-columns:repeat(2,1fr)}.slots .tl{height:auto;min-height:44px}#base .tabs{grid-template-columns:repeat(4,minmax(0,140px));justify-content:start}}
@media (orientation:landscape) and (max-height:620px){.slots{grid-template-columns:repeat(3,1fr)}.slots .lf{display:none}.slots .sh{display:inline}.slots .tl{min-height:0;height:50px}
  .ctl .tl{height:50px}.ctl.c4{grid-template-columns:repeat(4,minmax(0,1fr))}.ctl.g5{grid-template-columns:repeat(5,minmax(0,1fr))}#bbody.t-crew .pan h4{margin-top:2px}
  #bbody.t-map .rl{grid-template-columns:1fr 1fr;gap:6px}.rc{padding:6px 9px;gap:1px}.rc .foe{display:none}.rc b{font-size:15px}#bbody.t-map .pan h4{font-size:14px;letter-spacing:.08em}
  #base .bh h2{font-size:22px}#base .tabs button{padding:8px 4px}.tl{height:58px}.ut{padding:9px;gap:6px}.ut b{font-size:16px}}
.card .stk{display:flex;flex-direction:column;align-items:center;gap:5px;opacity:1}.card .tag{font-size:14px;font-weight:800;letter-spacing:.1em;padding:2px 10px;border-radius:999px;background:#3c0d03}
.card .tag.new{background:#7be08f;color:#123}.card .tag.max{background:var(--gold);color:var(--deep)}.card .pp{display:flex;gap:4px}.card .pp i{width:12px;height:12px;border-radius:3px;background:#3c0d03;border:1px solid rgba(246,231,216,.25)}
.card .pp i.f{background:var(--scrap)}.card .pp i.n{background:#7be08f;box-shadow:0 0 8px #7be08f}
@media (orientation:landscape) and (max-height:620px){#pick .cards{flex-wrap:nowrap}.card{min-height:0;padding:12px;gap:6px}#pick .pt{font-size:34px}}
#pause{background:rgba(23,8,4,.95)!important}
.ptop{display:flex;gap:8px;flex-wrap:wrap;column-span:all;margin-bottom:6px}.ptop .big{flex:1;padding:12px 16px}.ptop .alt{padding:10px 16px}
@media (orientation:landscape){#pause .pbox{width:min(96vw,1060px);display:block;columns:3 280px;column-gap:20px}#pause .pbox>*{break-inside:avoid;margin-bottom:10px}#pause .pbox h2{column-span:all}}
`;document.head.appendChild(nst);

/* ---------- small DOM helpers (work in old browsers and the test harness) ---------- */
const tg=(e,c,on)=>{if(e&&e.classList&&e.classList.toggle)e.classList.toggle(c,on)};
const mk=(tag,id,cls,html)=>{const e=document.createElement(tag);if(id)e.id=id;if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};
const SC={weapon:'WPN',helmet:'HELM',armor:'ARMR',legs:'LEGS',boots:'BOOT',gloves:'GLOV',pack:'PACK',ring1:'RING',ring2:'RING',neck:'NECK'};
const nfmt=n=>n>=10000?(n/1000).toFixed(n>=100000?0:1)+'k':String(Math.floor(n));

/* ---------- MENU ---------- */
(()=>{const m=$('menu');if(!m)return;const h1=m.querySelector('h1'),tag=m.querySelector('p'),ch=$('charPick'),md=m.querySelector('.modes'),rs=$('reset');
  const w=mk('div',null,'mwrap'),L=mk('div',null,'mL'),R=mk('div',null,'mR'),pf=mk('div','prof');
  if(h1)L.appendChild(h1);if(tag)L.appendChild(tag);L.appendChild(pf);if(ch)L.appendChild(ch);if(md)R.appendChild(md);if(rs)R.appendChild(rs);w.appendChild(L);w.appendChild(R);m.appendChild(w);
  const gp=$('goParty'),go=$('goOnline');if(gp)gp.innerHTML='PARTY<small>2-4 · one screen</small>';if(go)go.innerHTML='ONLINE<small>up to 4 · code</small>';
  if(md){const b=mk('button','goBase','alt','BASE<small id="baseSub"></small>');b.addEventListener('click',()=>openBase('upg'));md.appendChild(b)}})();
function rankFrac(){const R=RANKS[save.rank];if(!R)return 1;return R.g.reduce((s,g,i)=>s+Math.min(1,save.gp[i]/g[1]),0)/R.g.length}
const _mm10=menuMeta;menuMeta=function(){_mm10();ensureGear();const pf=$('prof');if(pf){const r=curReg(),R=RANKS[save.rank];
    pf.innerHTML=`<div class="pr1"><b>Rank ${save.rank+1} · ${RANK_NAMES[save.rank]}</b><span style="opacity:.7">${R?'next: '+esc(unlockLabel(R.u)):'max rank'}</span></div>
    <div class="gbar"><i style="width:${Math.round(rankFrac()*100)}%"></i></div>
    <div class="chips"><span class="chip" style="color:#f5c34d">◆ ${nfmt(save.bank)}</span><span class="chip">⬢ ${save.cores||0}</span><span class="chip">GS ${gearScore()}</span><span class="chip" style="color:${REG[r].acc}">${REG[r].n} · ${r+1}/4</span></div>`}
  const bs=$('baseSub');if(bs)bs.textContent=`upgrades · gear · crew`};

/* ---------- BASE ---------- */
const baseEl=mk('div','base');document.body.appendChild(baseEl);
let bTab='upg',bSel=null,bFilt=null,bPage=0,bCap=12,bWasPlay=false,bCrew=null;
const UDESC={dmg:'+20% damage',spd:'+12 speed',hp:'+25 hull',mag:'+50% magnet',bag:'+25 bag space'},UIC={dmg:'✸',spd:'➤',hp:'✚',mag:'U',bag:'▣'};
const baseOpen=()=>baseEl.style.display==='flex';
function openBase(tab){ensureGear();ensureCrew();if(tab)bTab=tab;if(state==='play'&&pausing()){state='pause';bWasPlay=true}releaseAll();baseEl.style.display='flex';bPage=0;renderBase()}
function closeBase(){baseEl.style.display='none';if(bWasPlay&&state==='pause')state='play';bWasPlay=false;if(state==='menu')menuMeta()}
function rarCol(it){return GRAR[it.rar][1]}
function cmpOf(it){return it.slot==='ring'?[equipped('ring1'),equipped('ring2')].sort((a,b)=>itemPower(a)-itemPower(b))[0]:equipped(it.slot)}
function stashList(){return save.stash.filter(i=>!bFilt||i.slot===bFilt).sort((a,b)=>(isEquipped(b)-isEquipped(a))||itemPower(b)-itemPower(a))}
function gearDetail(it){if(!it)return `<div class="pan det"><h4>DETAILS</h4><div class="note2">Tap an item to see it. Tap a slot on the left to show only that kind.<br>Found gear is <b>hot</b> until you bank it. Equipped gear is always safe.</div></div>`;
  const c=rarCol(it),eq=isEquipped(it),ok=canSwap(),cmp=cmpOf(it),d=itemPower(it)-itemPower(cmp),fc=forgeCost(it),canF=ok&&(it.f||0)<FMAX&&save.bank>=fc.scrap&&save.cores>=fc.cores;
  let st=esc(BASES[it.slot][it.b][1])+'<br>'+(statLine(itemStats(it))||'no bonus stats');if(it.pk)st+=`<br><span class="pk">Perk: ${PERKS[it.pk].n} +1</span>`;
  if(it.u){const U=UNIQ[it.slot];st+=`<br><span class="uq">★ ${U[1]}: ${U[2]}</span>`}
  if(it.set&&typeof SETS!=='undefined'&&SETS[it.set]){const S=SETS[it.set],n=setCounts()[it.set]||0;st+=`<br><span style="color:#7be08f">${S.n} ${n}/4 · 2: ${S.b2} · 4: ${S.b4}</span>`}
  const dm=!eq&&it.rar<5&&!(it.slot==='weapon'&&save.stash.filter(i=>i.slot==='weapon').length<2);
  let a='';if(!eq)a+=`<button class="buy${ok?'':' no'}" data-act="eq" data-id="${it.id}">EQUIP</button>`;
  if((it.f||0)<FMAX)a+=`<button class="buy sec${canF?'':' no'}" data-act="fg" data-id="${it.id}">FORGE +${(it.f||0)+1} · ${fc.scrap}◆ ${fc.cores}⬢</button>`;
  else if(!it.rr)a+=Object.keys(it.a).map(k=>`<button class="buy sec" data-act="rr" data-id="${it.id}" data-k="${k}">REROLL ${AFX[k][0]}</button>`).join('');
  if(dm)a+=`<button class="buy sec" data-act="dm" data-id="${it.id}">SCRAP · +${CORES[it.rar]}⬢</button>`;
  return `<div class="pan det" style="border-color:${c}"><div class="nm" style="color:${c}">${esc(it.name)}${it.f?' +'+it.f:''}</div>
  <div class="sb">${GRAR[it.rar][0]} ${SLOT_N[it.slot]} · iLvl ${it.il} · IP ${itemPower(it)} · ${eq?'equipped':cmp?`<span class="${d>=0?'up':'dn'}">${d>=0?'▲ +':'▼ '}${d} vs equipped</span>`:'<span class="up">▲ empty slot</span>'}</div>
  <div class="st">${st}</div>${ok?'':'<div class="note2">Swap and forge in the hub or the menu.</div>'}<div class="acts">${a}</div></div>`}
function tabGear(){const L=stashList(),pages=Math.max(1,Math.ceil(L.length/bCap));bPage=clamp(bPage,0,pages-1);const view=L.slice(bPage*bCap,bPage*bCap+bCap),sel=save.stash.find(i=>i.id===bSel)||null;
  const slots=SLOTS.map(s=>{const it=equipped(s),t=typeOf(s),on=bFilt===t;return `<button class="tl${it?'':' empty'}${on?' sel':''}" data-act="slot" data-s="${t}" style="border-color:${it?rarCol(it):'#3a1a10'}">
    <span class="s"><span class="lf">${SLOT_N[s]}</span><span class="sh">${SC[s]}</span></span><span class="n" style="color:${it?rarCol(it):'inherit'}"><span class="lf">${it?esc(it.name)+(it.f?' +'+it.f:''):'empty'}</span><span class="sh">${it?'IP '+itemPower(it):'free'}</span></span></button>`}).join('');
  const tiles=view.map(it=>{const cm=cmpOf(it),up=!isEquipped(it)&&itemPower(it)>itemPower(cm);return `<button class="tl${it.id===bSel?' sel':''}" data-act="item" data-id="${it.id}" style="border-color:${rarCol(it)}">
    <span class="bd" style="color:${isEquipped(it)?'#f5c34d':'#7be08f'}">${isEquipped(it)?'E':up?'▲':''}</span><span class="s">${SLOT_N[it.slot]}${it.f?' +'+it.f:''}</span><span class="n" style="color:${rarCol(it)}">IP ${itemPower(it)}</span></button>`}).join('');
  return `<div class="pan"><h4>EQUIPPED · GS ${gearScore()}</h4><div class="tiles slots">${slots}</div></div>
  <div class="pan"><div class="pager"><h4>STASH ${save.stash.length}/${STASH_MAX}${bFilt?' · '+SLOT_N[bFilt].toUpperCase():''}</h4><span style="display:flex;gap:6px;align-items:center">
    <button data-act="page" data-d="-1" aria-label="Previous page">‹</button><span style="font-size:14px">${bPage+1}/${pages}</span><button data-act="page" data-d="1" aria-label="Next page">›</button></span></div>
    <div class="tiles" id="bstash" style="grid-template-columns:repeat(auto-fill,minmax(70px,1fr));flex:1;min-height:0">${tiles||'<div class="note2">Nothing here yet. Crates, camps, gatekeepers and vaults drop gear.</div>'}</div>
    <div class="pager"><span class="note2">Epic+ within ${Math.max(1,PITY-(save.pity||0))} drops</span><button data-act="odds" style="width:auto;padding:0 12px;font:800 14px Sora,system-ui,sans-serif">ODDS</button></div></div>${bSel==='__odds'?oddsPanel():gearDetail(sel)}`}
function oddsPanel(){return `<div class="pan det"><h4>DROP ODDS · FIXED, NEVER PAID</h4><div class="st" style="overflow:auto;flex:1;min-height:0">Crate drop chance zone 1/2/3: 2% / 3.5% / 6% (3× for your first 8 drops) · elite 20% · raider 10% · bosses always.<br>
  Zone 3 crate: Common 45 · Uncommon 35 · Rare 16 · Epic 3.5 · Legendary 0.5%<br>Golden Brute: Uncommon 30 · Rare 45 · Epic 20 · Legendary 4 · Salvaged 1%<br>
  Each region ring past the Plains shifts drops up one step and adds +4 iLvl. Gatekeepers drop 2 items.<br>Bad luck protection: Epic or better within <b>${Math.max(1,PITY-(save.pity||0))}</b> drops.</div></div>`}
function tabUpg(){const ok=canSwap();return `<div class="pan" style="grid-column:1/-1"><h4>WORKSHOP · ${ok?'spend safe scrap':'go to the hub to buy'}</h4><div class="ugrid">`+Object.keys(UPG).map(k=>{const lv=save.lv[k],mx=lv>=UPMAX,c=cost(k),can=ok&&!mx&&save.bank>=c;
    return `<div class="ut"><b>${UIC[k]} ${UPG[k].n}</b><span class="d">${UDESC[k]} per level · LV ${lv}/${UPMAX}</span><div class="pips">${Array.from({length:UPMAX},(_,i)=>`<i class="${i<lv?'f':''}"></i>`).join('')}</div>
    <button class="buy${can?'':' no'}" data-act="buy" data-k="${k}">${mx?'MAX':'BUY · ◆ '+c}</button></div>`}).join('')+`</div></div>`}
function crewDetail(){const c=ensureCrew(),ok=canSwap();if(!bCrew)return `<div class="pan det"><h4>DETAILS</h4><div class="note2">Tap a companion or a gadget. One companion at a time, two gadget slots (Q/E, LB/RB or the round buttons). They count in Solo, vaults and Co-op raids.</div></div>`;
  if(bCrew.t==='c'){const k=bCrew.k,D=CDEF[k],own=!!c.unl[k],l=c.lv[k],q=crewCost(l),on=c.sel===k,lock=save.rank<CREW_RANK;let a='';
    if(lock)a=`<div class="note2">Companions unlock at rank ${CREW_RANK+1}. The Turret is free.</div>`;
    else if(!own)a=`<button class="buy${ok&&save.bank>=CREW_UNLOCK?'':' no'}" data-act="cu" data-k="${k}">UNLOCK · ◆ ${CREW_UNLOCK}</button>`;
    else{a=on?`<button class="buy sec${ok?'':' no'}" data-act="cs" data-k="">UNEQUIP</button>`:`<button class="buy${ok?'':' no'}" data-act="cs" data-k="${k}">EQUIP</button>`;
      a+=l<CREW_MAX?`<button class="buy sec${ok&&save.bank>=q.s&&(save.cores||0)>=q.c?'':' no'}" data-act="cf" data-k="${k}">FEED · ◆ ${q.s}${q.c?' + '+q.c+'⬢':''}</button>`:'<span class="uq">MAX LEVEL</span>'}
    return `<div class="pan det" style="border-color:${D.col}"><div class="nm" style="color:${D.col}">${D.ic} ${D.n}</div><div class="sb">${D.k==='drone'?'Drone · never dies':'Minion · back in 20 s when downed'}${own?` · Lv ${l}/${CREW_MAX}`:''}${on?' · <span class="uq">equipped</span>':''}</div>
      <div class="st">${D.d(l)}${D.hp?` · ${D.hp(l)} hp`:''}</div>${ok?'':'<div class="note2">Change crew in the hub or the menu.</div>'}<div class="acts">${a}</div></div>`}
  const k=bCrew.k,D=GDEF[k],own=gadOwned(k),si=c.g.indexOf(k),lock=save.rank<GAD_RANK;let a='';
  if(lock)a=`<div class="note2">Gadgets unlock at rank ${GAD_RANK+1}.</div>`;else if(!own)a=`<button class="buy${ok&&save.bank>=D.cost?'':' no'}" data-act="gu" data-k="${k}">UNLOCK · ◆ ${D.cost}</button>`;
  else a=[0,1].map(i=>`<button class="buy${c.g[i]===k?' sec no':ok?'':' no'}" data-act="gs" data-k="${k}" data-i="${i}">${c.g[i]===k?'IN SLOT '+(i+1):'PUT IN SLOT '+(i+1)}</button>`).join('');
  return `<div class="pan det" style="border-color:${D.col}"><div class="nm" style="color:${D.col}">${D.ic} ${D.n}</div><div class="sb">${D.max} charges · refill when you bank, respawn or enter a vault${si>=0?' · <span class="uq">slot '+(si+1)+'</span>':''}</div>
    <div class="st">${D.d}</div><div class="acts">${a}</div></div>`}
function tabCrew(){const c=ensureCrew();
  const ct=CT.map(k=>{const D=CDEF[k],own=!!c.unl[k],on=c.sel===k,sel=bCrew&&bCrew.t==='c'&&bCrew.k===k;return `<button class="tl${own?'':' lock'}${sel?' sel':''}" data-act="comp" data-k="${k}" style="border-color:${on?D.col:'#3a1a10'}">
    <span class="bd" style="color:${D.col}">${on?'●':''}</span><span class="s">${D.k==='drone'?'Drone':'Minion'}${own?' · Lv '+c.lv[k]:''}</span><span class="n" style="color:${D.col}">${D.ic} ${D.n}</span></button>`}).join('');
  const gt=GK.map(k=>{const D=GDEF[k],own=gadOwned(k),si=c.g.indexOf(k),sel=bCrew&&bCrew.t==='g'&&bCrew.k===k;return `<button class="tl${own?'':' lock'}${sel?' sel':''}" data-act="gad" data-k="${k}" style="border-color:${si>=0?D.col:'#3a1a10'}">
    <span class="bd" style="color:${D.col}">${si>=0?si+1:''}</span><span class="s">${D.max} charges</span><span class="n" style="color:${D.col}">${D.ic} ${D.n}</span></button>`}).join('');
  return `<div class="pan"><h4>COMPANION${save.rank<CREW_RANK?' · rank '+(CREW_RANK+1):''}</h4><div class="tiles ctl c4">${ct}</div>
    <h4>GADGETS · Q / E${save.rank<GAD_RANK?' · rank '+(GAD_RANK+1):''}</h4><div class="tiles ctl g5">${gt}</div></div>${crewDetail()}`}
function tabMap(){const R=curReg(),s=save.regStats||{gk:0,camps:0,events:0};
  const cards=REG.map((g,i)=>{const st=i<R?'conquered':i===R?'you are here':'locked';const boss=i<3?REG[i+1].gk[0]:null;
    return `<div class="rc${i===R?' cur':''}${i>R+1?' far':''}${i>R?' lock':''}" style="${i<=R?'border-color:'+g.acc:''}"><b style="color:${g.acc}">${i+1}. ${g.n}</b><span>${st}${i>0?` · monsters ×${RSC[i].hp.toFixed(1)} · scrap ×${RSC[i].sc.toFixed(1)}`:' · zones 1-3'}</span>
      ${g.foe?`<span class="foe" style="opacity:.7">${g.foe}</span>`:''}${boss?`<span style="opacity:.8">Gate: ${boss}${i<R?' · rematch for loot':i===R?' · beat it to open the next ring':''}</span>`:'<span class="uq">The last ring</span>'}</div>`}).join('');
  return `<div class="pan"><canvas id="mapc" aria-label="World map"></canvas></div><div class="pan"><h4>FRONTIER · ${R+1}/4 · ${s.gk} gatekeepers · ${s.camps} camps · ${s.events} events</h4><div class="rl">${cards}</div></div>`}
function drawMapCanvas(){const c=$('mapc');if(!c||!c.getContext||!c.clientWidth)return;const w=c.clientWidth,h=c.clientHeight,d=Math.min(2,window.devicePixelRatio||1);c.width=w*d;c.height=h*d;
  const x=c.getContext('2d');x.setTransform(d,0,0,d,0,0);const R=curReg(),rad=REG[3].out,s=Math.min(w,h)/2/rad*.94,cx=w/2,cy=h/2,P=(px,py)=>[cx+(px-HUB.x)*s,cy+(py-HUB.y)*s];
  for(let i=3;i>=0;i--){x.fillStyle=i>R?'#140604':i===0?'#3d1b0e':REG[i].gr.replace(/,[.0-9]+\)$/,',.75)');x.beginPath();x.arc(cx,cy,REG[i].out*s,0,TAU);x.fill();
    x.strokeStyle=i===R?'#ff6a3d':'rgba(246,231,216,.18)';x.lineWidth=i===R?3:1;x.stroke()}
  x.fillStyle='#f5c34d';x.beginPath();x.arc(cx,cy,Math.max(5,HUB.r*s),0,TAU);x.fill();
  for(const g of GATES){const [gx,gy]=P(g.x,g.y);x.fillStyle=g.r<R?REG[g.r+1].acc:g.r===R?'#ff6a3d':'#5a2a1a';x.fillRect(gx-5,gy-5,10,10)}
  for(const q of CAMPS){if(q.r>R)continue;const [qx,qy]=P(q.x,q.y);x.fillStyle=q.st===3?'rgba(246,231,216,.35)':REG[q.r].acc;x.beginPath();x.moveTo(qx,qy-6);x.lineTo(qx+6,qy+5);x.lineTo(qx-6,qy+5);x.fill()}
  for(const q of SHRINES){if(q.r>R)continue;const [qx,qy]=P(q.x,q.y);x.fillStyle=BUFFS[q.k][2];x.fillRect(qx-3,qy-3,6,6)}
  const me=meP();if(me&&state!=='menu'&&!VLT){const [px,py]=P(me.x,me.y);x.fillStyle='#fff';x.beginPath();x.arc(px,py,4,0,TAU);x.fill()}
  x.font='700 14px Sora, system-ui, sans-serif';x.textAlign='center';x.fillStyle='rgba(246,231,216,.8)';x.fillText('▲ camp  ■ gate  ◆ shrine',cx,h-8)}
function renderBase(){if(!baseOpen())return;const tabs=[['upg','UPGRADES'],['gear','GEAR'],['crew','CREW'],['map','MAP'],['wastes','WASTES']].filter(t=>mode!=='party'||t[0]==='upg'||t[0]==='map');
  if(!tabs.some(t=>t[0]===bTab))bTab='upg';
  baseEl.innerHTML=`<div class="bh"><h2>BASE</h2><div class="chips"><span class="chip" style="color:#f5c34d">◆ ${nfmt(save.bank)}</span><span class="chip">⬢ ${save.cores||0}</span><span class="chip">GS ${gearScore()}</span></div><button class="x" data-act="close" aria-label="Close">✕</button></div>
  <div class="tabs">${tabs.map(t=>`<button data-act="tab" data-t="${t[0]}" class="${t[0]===bTab?'on':''}">${t[1]}</button>`).join('')}</div>
  <div id="bbody" class="t-${bTab}">${bTab==='gear'?tabGear():bTab==='crew'?tabCrew():bTab==='map'?tabMap():bTab==='wastes'&&typeof tabWastes==='function'?tabWastes():tabUpg()}</div>`;
  if(bTab==='gear'){const g=$('bstash');if(g&&g.clientWidth){const cols=Math.max(1,Math.floor((g.clientWidth+6)/76)),rows=Math.max(1,Math.floor((g.clientHeight+6)/(g.querySelector&&g.querySelector('.tl')&&g.querySelector('.tl').offsetHeight?g.querySelector('.tl').offsetHeight+6:72))),cap=Math.max(cols,cols*rows);
      if(cap!==bCap){bCap=cap;renderBase();return}}}
  if(bTab==='map')drawMapCanvas()}
function baseAct(a,ds){const find=id=>save.stash.find(i=>i.id===id),ok=canSwap();let snd2=0;
  switch(a){case 'close':closeBase();return;case 'tab':bTab=ds.t;bPage=0;break;
    case 'slot':bFilt=bFilt===ds.s?null:ds.s;bPage=0;{const eq=SLOTS.filter(s=>typeOf(s)===ds.s).map(equipped).find(Boolean);if(eq&&bFilt)bSel=eq.id}break;
    case 'item':bSel=ds.id;break;case 'odds':bSel=bSel==='__odds'?null:'__odds';break;case 'page':bPage+= +ds.d;break;
    case 'eq':if(ok){const it=find(ds.id);if(it){equipItem(it);snd2=700}}break;
    case 'fg':if(ok&&forgeItem(find(ds.id)))fanfareLocal(660);break;
    case 'rr':if(ok&&rerollAffix(find(ds.id),ds.k))snd2=900;break;
    case 'dm':if(dismantle(find(ds.id))){bSel=null;snd2=300}break;
    case 'buy':if(ok)buy(ds.k);break;
    case 'comp':bCrew={t:'c',k:ds.k};break;case 'gad':bCrew={t:'g',k:ds.k};break;
    case 'cu':if(ok&&crewUnlock(ds.k))fanfareLocal(620);break;case 'cs':if(ok&&crewSel(ds.k||null))snd2=760;break;
    case 'cf':if(ok&&crewFeed(ds.k))fanfareLocal(620);break;case 'gu':if(ok&&gadUnlock(ds.k))snd2=760;break;case 'gs':if(ok&&gadSlot(ds.k,+ds.i))snd2=760;break}
  if(snd2)beep(snd2,.08,'triangle',.05);renderBase()}
baseEl.addEventListener('click',e=>{let t=e.target;while(t&&t!==baseEl&&!(t.dataset&&t.dataset.act))t=t.parentElement;if(!t||t===baseEl)return;baseAct(t.dataset.act,t.dataset)});
addEventListener('resize',()=>{if(baseOpen())renderBase()});
addEventListener('keydown',e=>{const k=(e.key||'').toLowerCase();if(e.target&&e.target.tagName==='INPUT')return;
  if(baseOpen()&&(k==='escape'||k==='b')){e.preventDefault&&e.preventDefault();closeBase();return}
  if(k==='b'&&mode!=='party'&&(state==='play'||state==='pause'))openBase()});

/* ---------- HUD: base button, hub bar ---------- */
(()=>{const hb=$('hudBtns');if(hb){const b=mk('button','baseBtn',null,'⌂');b.setAttribute('aria-label','Base');b.addEventListener('pointerdown',e=>{e.stopPropagation();openBase()});hb.appendChild(b)}})();
const hubBar=mk('div','hubBar',null,`<div class="t">HUB · SAFE · SPEND SCRAP</div><div class="r"><button data-t="upg" class="hot">UPGRADES</button><button data-t="gear">GEAR</button><button data-t="crew">CREW</button></div>`);
document.body.appendChild(hubBar);
hubBar.addEventListener('pointerdown',e=>{let t=e.target;while(t&&t!==hubBar&&!(t.dataset&&t.dataset.t))t=t.parentElement;if(t&&t!==hubBar){e.stopPropagation();e.preventDefault&&e.preventDefault();openBase(t.dataset.t)}});
const _ut10=uiTick;uiTick=function(){_ut10();const playing=state==='play'||state==='pick',lp=mode==='guest'?[meP()].filter(Boolean):players.filter(q=>!q.remote);
  const inH=playing&&!baseOpen()&&pickEl.style.display!=='flex'&&lp.some(p=>p.dead<=0&&inHub(p));hubBar.style.display=inH?'flex':'none';
  if(inH&&hubBar.querySelector){const any=Object.keys(UPG).some(k=>save.lv[k]<UPMAX&&save.bank>=cost(k)),bs=hubBar.querySelectorAll?hubBar.querySelectorAll('button'):[];
    for(const b of bs){if(b.dataset.t!=='upg')b.style.display=mode==='party'?'none':'';if(b.dataset.t==='upg')tg(b,'hot',any)}}
  const bb=$('baseBtn');if(bb)bb.style.display=mode==='party'?'none':''};

/* ---------- level-up cards: show stacks as pips, tag NEW / MAX ---------- */
const _op10=openPickUI;openPickUI=function(p,opts,free,lvl){_op10(p,opts,free,lvl);const cs=pickEl.querySelectorAll('.card');
  opts.forEach((k,i)=>{const c=cs[i],d=PERKS[k];if(!c||!d||!c.querySelector)return;const s=c.querySelector('.stk');if(!s)return;
    const have=mode==='guest'?0:(p.run.perks[k]||0),nx=have+1,tag=have===0?'<span class="tag new">NEW</span>':nx>=d.max?'<span class="tag max">MAXES OUT</span>':`<span class="tag">LV ${have} → ${nx}</span>`;
    s.innerHTML=(mode==='guest'?'':tag)+`<span class="pp">${Array.from({length:d.max},(_,j)=>`<i class="${j<have?'f':j===have?'n':''}"></i>`).join('')}</span>`})};

/* ---------- pause: columns + actions on top ---------- */
const _op10p=openPause;openPause=function(){_op10p();if(pauseEl.style.display!=='flex')return;const box=pauseEl.querySelector('.pbox'),rs=$('resume'),q=$('quit');if(!box||!rs)return;
  const top=mk('div',null,'ptop');top.appendChild(rs);if(mode!=='party'){const b=mk('button',null,'alt','BASE');b.addEventListener('click',()=>{closePause();openBase()});top.appendChild(b)}
  if(q){q.className='alt';q.textContent='QUIT';top.appendChild(q)}if(box.insertBefore)box.insertBefore(top,box.firstChild||null)};

if(window.__game)Object.defineProperties(window.__game,Object.getOwnPropertyDescriptors({openBase,closeBase,baseAct,renderBase,menuMeta,uiTick,openPickUI,openPause,
  get baseHtml(){return baseEl.innerHTML},get baseTab(){return bTab},get hubBarShown(){return hubBar.style.display==='flex'},get pickHtml(){return pickEl.innerHTML}}));
menuMeta();
