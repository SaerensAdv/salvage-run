/* ================= v0.13 · UI PASS 2: icons everywhere, readable items, iOS home-screen icon =================
   Loads after r.js and reuses its icon data. New icons are drawn as inline SVG, so they need no sprite update. */
Object.assign(ICONS,{
 gauge:[['s','M4 17a8 8 0 1 1 16 0M12 17l4-5'],['f',C_(12,17,1.8)]],
 crosshair:[['s',C_(12,12,7)+'M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5']],
 pierce:[['s','M2.5 12h13M9 4.5v15'],['f','M15.5 7l6.5 5-6.5 5Z']],
 twin:[['f','M3.5 6.5h10.5l4.5 2.25-4.5 2.25H3.5Z M3.5 13h10.5l4.5 2.25-4.5 2.25H3.5Z']],
 saw:[['e','M19.6 12.0 21.5 16.4 17.4 17.4 17.4 17.4 15.6 21.9 12.0 19.6 12.0 19.6 7.6 21.5 6.6 17.4 6.6 17.4 2.1 15.6 4.4 12.0 4.4 12.0 2.5 7.6 6.6 6.6 6.6 6.6 8.4 2.1 12.0 4.4 12.0 4.4 16.4 2.5 17.4 6.6 17.4 6.6 21.9 8.4 19.6 12.0Z'+C_(12,12,3.2)]],
 bounce:[['s','M3 6l5.5 12 5-9'],['f','M11.8 6.2 20 4.2 18.4 12.4Z']],
 burst:[['f','M12.0 1.5 13.8 7.8 19.4 4.6 16.2 10.2 22.5 12.0 16.2 13.8 19.4 19.4 13.8 16.2 12.0 22.5 10.2 16.2 4.6 19.4 7.8 13.8 1.5 12.0 7.8 10.2 4.6 4.6 10.2 7.8Z']]
});
const srSvg=(n,cls)=>{const P=ICONS[n]||ICONS.star;return `<svg class="sri${cls?' '+cls:''}" viewBox="0 0 24 24" aria-hidden="true">${P.map(([m,d])=>m==='s'?`<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`:`<path d="${d}" fill="currentColor"${m==='e'?' fill-rule="evenodd"':''}/>`).join('')}</svg>`};
const WPN_IC={blaster:'blaster',burst:'twin',scatter:'burst',rail:'pierce',sword:'sword',bow:'bow',staff:'staff'};
const itemIc=it=>it&&it.slot==='weapon'?(WPN_IC[it.b]||'weapon'):(it&&SLOT_IC[it.slot])||'chest';
const PERK_IC={dmg:'fire',rate:'gauge',crit:'crosshair',pierce:'pierce',range:'blaster',plating:'hull',leech:'water',vacuum:'magnet',thruster:'dash',twin:'twin',greed:'scrap',saw:'saw',bounce:'bounce',bounty:'crown',last:'heart',nova:'burst',shield:'aegis'};
const CHAR_IC={scrapper:'dash',warden:'dome',ghost:'ghost'},FAM_IC={SWORD:'sword',BOW:'bow',STAFF:'staff'},EL_IC={FIRE:'fire',WATER:'water',EARTH:'earth',WIND:'wind'};
const RAR_L=['C','U','R','E','L','S'];
const isHot=it=>!!it&&typeof players!=='undefined'&&players.some(p=>p&&p.hot&&p.hot.some(h=>h&&h.id===it.id));

/* ---------- styles ---------- */
const sst=document.createElement('style');if(document.head&&document.head.appendChild)sst.textContent=`
.gtile .rl{position:absolute;top:3px;left:5px;font-size:12px;font-weight:800;line-height:1;display:flex;align-items:center;gap:2px}
.gtile .rl .sri{width:12px;height:12px;color:#ff6a3d}.gtile.hot{box-shadow:inset 0 0 0 2px rgba(255,106,61,.6)}
.det .hotn{color:#ff6a3d;font-size:14px;font-weight:700;display:flex;align-items:center;gap:6px}.det .hotn .sri{width:16px;height:16px}
#pick .card .pic{display:flex;align-items:center;justify-content:center;flex:none}#pick .card .pic .sri{width:30px;height:30px}
@media (max-width:600px){#pick .card .pic .sri{width:26px;height:26px}}
.chars button .cic{display:flex;justify-content:center}.chars button .cic .sri{width:18px;height:18px}
#menu{overflow-y:auto;touch-action:pan-y;justify-content:safe center}
@media (orientation:landscape) and (max-height:520px){#dash,#dash2{font-size:12px!important}}
.v13row .sri{width:14px;height:14px;margin-right:4px;color:#f5c34d}.v13row>:first-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v13mastery button .sri{width:16px;height:16px;margin-right:6px}
@media (orientation:landscape) and (max-height:620px){.ctl .tl{padding:5px 4px!important}.ctl.g5 .tl .n{font-size:12.5px;gap:3px}.ctl.g5 .tl .n .sri{width:16px;height:16px}}
`;if(document.head&&document.head.appendChild)document.head.appendChild(sst);

/* ---------- gear tab: weapon type icons, rarity letter, hot marker ---------- */
tabGear=function(){const L=stashList(),pages=Math.max(1,Math.ceil(L.length/bCap));bPage=clamp(bPage,0,pages-1);const view=L.slice(bPage*bCap,bPage*bCap+bCap),sel=save.stash.find(i=>i.id===bSel)||null;
  const rl=(it,c)=>`<span class="rl" style="color:${c}">${RAR_L[it.rar]||''}${isHot(it)?srSvg('fire'):''}</span>`;
  const slots=SLOTS.map(s=>{const it=equipped(s),t=typeOf(s),on=bFilt===t,c=it?rarCol(it):'rgba(246,231,216,.55)',ic=it?itemIc(it):SLOT_IC[s];return `<button class="tl gtile${it?'':' empty'}${on?' sel':''}" data-act="slot" data-s="${t}" title="${SLOT_N[s]}" aria-label="${SLOT_N[s]}${it?' · '+GRAR[it.rar][0]+' · '+esc(it.name):' · empty'}" style="border-color:${it?c:'#3a1a10'}">
    ${it?rl(it,c):''}<span class="gi" style="color:${c}">${srSvg(ic)}</span><span class="gp" style="color:${c}">${it?'IP '+itemPower(it)+(it.f?' +'+it.f:''):'empty'}</span></button>`}).join('');
  const tiles=view.map(it=>{const cm=cmpOf(it),eq=isEquipped(it),up=!eq&&itemPower(it)>itemPower(cm),c=rarCol(it),hot=isHot(it);return `<button class="tl gtile${it.id===bSel?' sel':''}${hot?' hot':''}" data-act="item" data-id="${it.id}" title="${esc(it.name)}" aria-label="${GRAR[it.rar][0]} ${SLOT_N[it.slot]} · IP ${itemPower(it)}${hot?' · hot':''}" style="border-color:${c}">
    ${rl(it,c)}<span class="bd" style="color:${eq?'#f5c34d':'#7be08f'}">${eq?'E':up?sri('up'):''}</span><span class="gi" style="color:${c}">${srSvg(itemIc(it))}</span><span class="gp" style="color:${c}">IP ${itemPower(it)}${it.f?' +'+it.f:''}</span></button>`}).join('');
  return `<div class="pan"><h4>EQUIPPED · GS ${gearScore()}</h4><div class="tiles slots">${slots}</div></div>
  <div class="pan"><div class="pager"><h4>STASH ${save.stash.length}/${STASH_MAX}${bFilt?' · '+SLOT_N[bFilt].toUpperCase():''}</h4><span style="display:flex;gap:6px;align-items:center">
    <button data-act="page" data-d="-1" aria-label="Previous page">‹</button><span style="font-size:14px">${bPage+1}/${pages}</span><button data-act="page" data-d="1" aria-label="Next page">›</button></span></div>
    <div class="tiles" id="bstash" style="grid-template-columns:repeat(auto-fill,minmax(70px,1fr));flex:1;min-height:0">${tiles||'<div class="note2">Nothing here yet. Crates, camps, gatekeepers and vaults drop gear.</div>'}</div>
    <div class="pager"><span class="note2">Epic+ within ${Math.max(1,PITY-(save.pity||0))} drops</span><button data-act="odds" style="width:auto;padding:0 12px;font:800 14px Sora,system-ui,sans-serif">ODDS</button></div></div>${bSel==='__odds'?oddsPanel():gearDetail2(sel)}`};
const gearDetail2=it=>{let h=gearDetail(it);if(!it)return h;const c=rarCol(it);
  h=h.replace('<div class="nm" style="color:'+c+'">','<div class="nm" style="color:'+c+'">'+srSvg(itemIc(it)));
  if(isHot(it))h=h.replace('<div class="st">','<div class="hotn">'+srSvg('fire')+'HOT · bank it to keep it, it drops if you die</div><div class="st">');return h};

/* ---------- level-up cards: one icon per perk ---------- */
const _opS2=openPickUI;openPickUI=function(p,opts,free,lvl){_opS2(p,opts,free,lvl);if(!pickEl||!pickEl.querySelectorAll)return;const cs=pickEl.querySelectorAll('.card');
  opts.forEach((k,i)=>{const c=cs[i];if(!c||!c.querySelector||c.querySelector('.pic'))return;const n=(typeof EVO!=='undefined'&&EVO[k])?'bolt':PERK_IC[k]||'star',b=c.querySelector('b');
    const s=document.createElement('span');s.className='pic';s.innerHTML=srSvg(n);if(b&&b.parentNode)b.parentNode.insertBefore(s,b);else c.insertBefore(s,c.firstChild)})};

/* ---------- characters, mastery rows, element button ---------- */
function srDeco(){
  for(const b of srQA(document,'.chars button')){if(b.dataset.ic)continue;const t=b.querySelector('b');const n=t&&CHAR_IC[t.textContent.trim().toLowerCase()];if(!n)continue;b.dataset.ic='1';const s=document.createElement('span');s.className='cic';s.innerHTML=srSvg(n);b.insertBefore(s,b.firstChild)}
  for(const r of srQA(document,'.v13row')){const h=r.firstElementChild||r;if(h.querySelector('svg'))continue;const n=FAM_IC[(h.textContent||'').trim().split(' ')[0]];if(n)h.insertAdjacentHTML('afterbegin',srSvg(n))}
  for(const b of srQA(document,'[data-v13-element]')){if(b.querySelector('svg'))continue;const t=b.textContent||'';const k=Object.keys(EL_IC).find(e=>t.indexOf(e)>=0);if(k)b.insertAdjacentHTML('afterbegin',srSvg(EL_IC[k]))}}
(()=>{if(typeof document==='undefined'||!document.body)return;try{srDeco();if(typeof MutationObserver==='undefined')return;let q=0;
  new MutationObserver(()=>{if(q)return;q=1;(window.requestAnimationFrame||setTimeout)(()=>{q=0;srDeco()})}).observe(document.body,{childList:true,subtree:true})}catch(e){}})();

/* ---------- map legend: shrines are small squares, not scrap ---------- */
(()=>{if(typeof CanvasRenderingContext2D==='undefined')return;const P=CanvasRenderingContext2D.prototype,oF=P.fillText;
  P.fillText=function(t,x,y,mw){if(typeof t==='string'&&t.indexOf('◆ shrine')>=0)t=t.replace('◆ shrine','▪ shrine');return mw===undefined?oF.call(this,t,x,y):oF.call(this,t,x,y,mw)}})();

/* ---------- iOS home screen: iOS ignores SVG touch icons, so draw a PNG from icon.svg ---------- */
(()=>{try{if(typeof Image==='undefined'||!document.querySelector)return;const l=document.querySelector('link[rel="apple-touch-icon"]');if(!l)return;const im=new Image();
  im.onload=()=>{try{const c=document.createElement('canvas');c.width=c.height=180;c.getContext('2d').drawImage(im,0,0,180,180);l.href=c.toDataURL('image/png')}catch(e){}};im.src='icon.svg'}catch(e){}})();

/* ---------- hot loot: a small chip next to the vital panel instead of a big box over the banners ---------- */
const _dhS2=drawHud;drawHud=function(p,W2,H2,Zv,v){const g=mode==='guest',hot=g?(G.hot||[]):(p.hot||[]);if(!hot.length||p.dead>0)return _dhS2(p,W2,H2,Zv,v);
  if(g)G.hot=[];else p.hot=[];try{_dhS2(p,W2,H2,Zv,v)}finally{if(g)G.hot=hot;else p.hot=hot}
  const L=HUD_LAYOUT||{};if(L.tiny)return;const sk=mySkull(p)>0,ws=!VLT&&(wlAt(p.x,p.y)>0||!!opAt(p)||sk);
  const x=(L.panelRight||168)+6,y=(L.panelY||10)+3+(ws?(sk&&(wlAt(p.x,p.y)>0||opAt(p))?36:23):0),t=`${sri('fire')} ${hot.length} HOT`;
  ctx.font=F(800,10);const w=ctx.measureText(t).width+12;if(x+w>(L.mapX==null?W2:L.mapX)-4)return;
  ctx.textAlign='left';ctx.fillStyle='rgba(40,6,4,.9)';rr(x,y,w,18,7);ctx.fill();ctx.fillStyle=Math.sin(time*6)>0?'#ff6a3d':'#f6e7d8';ctx.fillText(t,x+6,y+13)};

/* ---------- split screen: lift the hub bar above the shared buttons ---------- */
const _utS2=uiTick;uiTick=function(){_utS2();if(typeof hubBar==='undefined'||!hubBar.style)return;hubBar.style.bottom=(state==='play'||state==='pick')&&views().length>1?'58px':''};

if(window.__game)Object.defineProperties(window.__game,Object.getOwnPropertyDescriptors({srSvg,itemIc,isHot,srDeco,tabGear,openPickUI}));
