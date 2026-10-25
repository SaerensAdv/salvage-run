/* ================= v0.13 · UI PASS: logo, custom SVG icons, readable interfaces =================
   One icon set for HTML and canvas. Old text glyphs (◆ ⬢ ☠ ★ ⚡ ≡ ♪ ⌂ …) and private-use characters are swapped for
   the same SVG paths everywhere: HTML text through a MutationObserver, canvas text through a fillText wrapper.
   Game-world graphics stay simple on purpose; this pass is only about recognisable, reachable UI. */
/* v0.13 UI: custom icon set. 24×24 grid. Each icon is a list of parts: [mode, pathData].
   mode: s = stroke (2px, round), f = fill, e = fill with even-odd holes. One colour: currentColor in HTML, fillStyle on canvas. */
const C_=(x,y,r)=>`M${x-r} ${y}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0Z`;
const BOOT='M8 3h5v8l5.6 2.3A3.2 3.2 0 0 1 20.6 16.3V19H6.5v-8.5Z',SKULL='M12 2.5C7 2.5 3.5 6 3.5 10.5c0 2.8 1.3 4.6 3 5.6V19a1.5 1.5 0 0 0 1.5 1.5h8a1.5 1.5 0 0 0 1.5-1.5v-2.9c1.7-1 3-2.8 3-5.6C20.5 6 17 2.5 12 2.5Z'+C_(8.6,11,2.1)+C_(15.4,11,2.1)+'M12 13.4 13.4 16H10.6Z M9.6 17.6h1.2v2.9H9.6Z M13.2 17.6h1.2v2.9h-1.2Z';
const PACK='M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6h1a3 3 0 0 1 3 3v10.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5V9a3 3 0 0 1 3-3Z M10 6h4V4.8h-4Z M7.5 12.5h9v5h-9Z';
const SHIELD='M12 2.5 20 5.5v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6Z',HELM='M3.5 16.5A8.5 8.5 0 0 1 20.5 16.5V19h-17Z M7 14h10v1.8H7Z',GUN='M2.5 7h15.5l2 2h1.5v3H18v1.5h-6.2L10.2 18H6.3l1.3-4.5H2.5Z M12 13.5v-2';
const MAGNET='M4.5 3.5h5v8.5a2.5 2.5 0 0 0 5 0V3.5h5V12a7.5 7.5 0 0 1-15 0Z M4.5 6.6h5v1.3h-5Z M14.5 6.6h5v1.3h-5Z';
const ICONS={
 scrap:[['e','M12 2.5 21.5 12 12 21.5 2.5 12Z M12 8.6 15.4 12 12 15.4 8.6 12Z']],
 core:[['e','M12 2 20.7 7 20.7 17 12 22 3.3 17 3.3 7Z M12 6.6 16.4 9.2 16.4 14.8 12 17.4 7.6 14.8 7.6 9.2Z'],['f',C_(12,12,2.4)]],
 skull:[['e',SKULL]],
 star:[['f','M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9Z']],
 bolt:[['f','M13.5 2 4.5 13.5h6L9.5 22l9-11.5h-6Z']],
 close:[['s','M6 6 18 18M18 6 6 18']],
 chevL:[['s','M15 5 8 12l7 7']],chevR:[['s','M9 5l7 7-7 7']],
 soundOff:[['f','M3.5 9h4l5-4.5v15l-5-4.5h-4Z'],['s','M16 9l5 6M21 9l-5 6']],
 sound:[['f','M3.5 9h4l5-4.5v15l-5-4.5h-4Z'],['s','M16 8.5a5 5 0 0 1 0 7M18.8 5.8a9 9 0 0 1 0 12.4']],
 menu:[['s','M4 6.5h16M4 12h16M4 17.5h16']],
 base:[['s','M3.5 11 12 4l8.5 7M5.5 9.5V20h13V9.5M9.5 20v-5.5h5V20']],
 crown:[['f','M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5Z']],
 outpost:[['s','M3 20h18M5 20 12 7l7 13M10 20l2-4 2 4M12 7V3l4 1.5L12 6']],
 play:[['f','M8 5l11 7-11 7Z']],
 heart:[['f','M12 20.5S3 15 3 8.8A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 9 2.2C21 15 12 20.5 12 20.5Z']],
 pad:[['s','M7 8h10a4 4 0 0 1 4 4l.6 4.4a2.2 2.2 0 0 1-3.9 1.7L15.5 15h-7l-2.2 3.1a2.2 2.2 0 0 1-3.9-1.7L3 12a4 4 0 0 1 4-4Z M7.5 10.5v3M6 12h3'],['f',C_(15.5,11,1.1)+C_(17.5,13,1.1)]],
 dot:[['f',C_(12,12,5)]],
 blaster:[['e',GUN]],
 speed:[['f',BOOT],['s','M2.5 12.5H5M2 16h3']],
 hull:[['e',SHIELD+'M10.8 8h2.4v3h3v2.4h-3v3h-2.4v-3h-3V11h3Z']],
 magnet:[['e',MAGNET]],
 pack:[['e',PACK]],
 turret:[['f','M5 20.5h14l-2-5H7Z'+C_(12,11.5,4.2)],['s','M13 10.5 20.5 5.5']],
 medic:[['e',C_(12,12,9)+'M10.6 7.2h2.8v3.4h3.4v2.8h-3.4v3.4h-2.8v-3.4H7.2v-2.8h3.4Z']],
 aegis:[['e',SHIELD+'M12 6.2l4.6 1.7v3.6c0 3.2-1.9 5.6-4.6 6.6Z']],
 scout:[['e','M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12Z'+C_(12,12,3.8)],['f',C_(12,12,1.7)]],
 rat:[['e','M3.5 16c0-4.4 3.6-8 8-8 2.4 0 4.6 1.1 6 2.8L21.5 13l-3.6 2.2c-1.1 2.7-3.6 4.3-6.6 4.3H7Z'+C_(15.2,12.4,1.1)],['f',C_(9.5,7.6,2.9)],['s','M4 16c-1.6.8-2.2 2.6-1.4 4']],
 hound:[['f','M6 4.5C3.6 5 2.4 8.6 3.2 13.2L6.6 11.6Z M18 4.5c2.4.5 3.6 4.1 2.8 8.7l-3.4-1.6Z'],['e','M8 4h8c1.6 0 2.6 1.7 2.6 4.2v4c0 4.6-3 8.3-6.6 8.3s-6.6-3.7-6.6-8.3v-4C5.4 5.7 6.4 4 8 4Z'+C_(9.6,10.6,1.25)+C_(14.4,10.6,1.25)+'M10.3 14h3.4L12 16.4Z']],
 golem:[['e','M5 4h14v12l-3 4.5H8L5 16Z M7.8 8.8h3.2v2.8H7.8Z M13 8.8h3.2v2.8H13Z M9 14.4h6v1.6H9Z']],
 grenade:[['e',C_(12,14.2,6.8)+'M5.4 13.4h13.2v1.5H5.4Z'],['f','M9.6 4.6h4.8v3H9.6Z'],['s','M14.4 5.8c2 0 3.4.9 4 2.4']],
 medkit:[['e','M3 7.5h18v12.5H3Z M10.8 10.2h2.4v2.5h2.5v2.4h-2.5v2.5h-2.4v-2.5H8.3v-2.4h2.5Z'],['f','M8.5 7.5V4.5h7v3h-1.8V6.2h-3.4v1.3Z']],
 mine:[['f',C_(12,14.5,5.4)],['s','M12 4.5v3M5.6 7.6l2 2M18.4 7.6l-2 2M3.4 14.5h2.4M18.2 14.5h2.4M5 21h14']],
 smoke:[['f','M7 19a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 17.8 8.6 4.6 4.6 0 0 1 17.5 19Z']],
 decoy:[['e',C_(12,12,9.2)+C_(12,12,6)+C_(12,12,2.8)]],
 weapon:[['e',GUN]],
 helmet:[['e',HELM]],
 armor:[['e','M7 3 3.5 5.2v6l2.5 1.2V21h12v-8.6l2.5-1.2v-6L17 3c-.8 1.8-2.8 3-5 3S7.8 4.8 7 3Z M11.3 8.5h1.4V21h-1.4Z']],
 legs:[['f','M6 3h12l1 18h-5.2L12 10.5 10.2 21H5Z']],
 boots:[['f',BOOT]],
 gloves:[['e','M7 21v-3.4L4.2 13.4a1.5 1.5 0 0 1 2.4-1.8L8 13.2V5.5a1.4 1.4 0 0 1 2.8 0V4a1.4 1.4 0 0 1 2.8 0v1a1.4 1.4 0 0 1 2.8 0v2a1.4 1.4 0 0 1 2.8 0V15c0 2.8-1.2 4.6-2.8 6Z M7 17.6h10.4v1.2H7Z']],
 ring:[['e',C_(12,14.6,6.6)+C_(12,14.6,4.2)],['f','M9.4 3.4h5.2L16.2 6 12 9.6 7.8 6Z']],
 neck:[['s','M5 3c0 5 3.2 8 7 8s7-3 7-8'],['f','M12 11l3.6 4.8L12 21l-3.6-5.2Z']],
 wrench:[['f','M14.7 3.3a5.5 5.5 0 0 0-6.9 7.1L3 15.2a2.4 2.4 0 0 0 3.4 3.4l4.8-4.8a5.5 5.5 0 0 0 7.1-6.9l-3.2 3.2-2.8-.7-.7-2.8Z']],
 drone:[['s','M3.5 6.5h7M13.5 6.5h7M7 6.5V10M17 6.5V10'],['e','M6.5 10h11l-1.8 6.8H8.3Z'+C_(12,13,1.6)]],
 map:[['s','M3 6l6-2.5 6 2.5 6-2.5v14.5l-6 2.5-6-2.5-6 2.5Z M9 3.5V18M15 6v14.5']],
 dash:[['s','M3 8h6M2 12h7M3 16h6'],['f','M11 5l10 7-10 7Z']],
 dome:[['e','M2.5 19a9.5 9.5 0 0 1 19 0Z M6 19a6 6 0 0 1 12 0Z'],['f',C_(12,16.5,2)]],
 ghost:[['e','M5 21V11a7 7 0 0 1 14 0v10l-2.3-2-2.4 2-2.3-2-2.3 2-2.4-2Z'+C_(9.5,11,1.4)+C_(14.5,11,1.4)]],
 sword:[['f','M18.6 2.5h2.9v2.9L11 16l-2.9-2.9Z'],['s','M5.5 13.5l5 5M8 16l-4.5 4.5']],
 bow:[['s','M6 3c6 3 9 6 9 9s-3 6-9 9M6 3v18M3 12h15M15.5 9.5 18.5 12l-3 2.5']],
 staff:[['s','M5 21 14.6 8.4'],['e',C_(17,6,3.8)+C_(17,6,1.6)]],
 fire:[['f','M12 2.5c1 3.5 5.5 5.5 5.5 11a5.5 5.5 0 0 1-11 0c0-2.4 1.1-4 2.6-5.3.1 1.8.9 3 2.1 3.6-.6-3.4.1-6.4.8-9.3Z']],
 water:[['f','M12 2.5S5.5 10 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10 12 2.5 12 2.5Z']],
 earth:[['f','M2.5 20 8.5 8l3.5 6 2.5-4 7 10Z']],
 wind:[['s','M3 9h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h7']],
 up:[['f','M12 5l7 9H5Z']],down:[['f','M12 19l-7-9h14Z']],
 lock:[['e','M5 11h14v10H5Z M10.8 14h2.4v4h-2.4Z'],['s','M8 11V8a4 4 0 0 1 8 0v3']],
 chest:[['e','M3 9a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v11H3Z M3 11h18v1.6H3Z M10.6 10.4h2.8v4h-2.8Z']],
};

const SRI_N=Object.keys(ICONS),SRI_PU={};SRI_N.forEach((n,i)=>{SRI_PU[n]=String.fromCharCode(0xE000+i)});
const SRI_GLYPH={'◆':'scrap','⬢':'core','☠':'skull','★':'star','⚡':'bolt','✕':'close','‹':'chevL','›':'chevR','♪':'sound','≡':'menu','⌂':'base','♛':'crown','⛺':'outpost','▸':'play','♥':'heart','●':'dot','✸':'blaster','➤':'speed','✚':'medkit','▣':'pack','◇':'aegis','◉':'scout','◎':'decoy','☁':'smoke','▲':'up','▼':'down','🎮':'pad'};
SRI_N.forEach(n=>{SRI_GLYPH[SRI_PU[n]]=n});
const SRI_KEYS=Object.keys(SRI_GLYPH).sort((a,b)=>b.length-a.length);
const SRI_RE=new RegExp('('+SRI_KEYS.join('|')+')','u'),SRI_RES=new RegExp(SRI_RE.source,'gu');
const sri=n=>SRI_PU[n]||'';
const srQ=s=>typeof document!=='undefined'&&document.querySelector?document.querySelector(s):null,srQA=(r,s)=>r&&r.querySelectorAll?[...r.querySelectorAll(s)]:[];
function sriSplit(t){const out=[];let last=0;SRI_RES.lastIndex=0;let m;while((m=SRI_RES.exec(t))){if(m.index>last)out.push({t:t.slice(last,m.index)});out.push({i:SRI_GLYPH[m[0]]});last=m.index+m[0].length}if(last<t.length)out.push({t:t.slice(last)});return out}
const SRI_LOGO=`<svg xmlns='http://www.w3.org/2000/svg' viewBox='-14 -14 784.7 268.6' role='img' aria-label='Salvage Run'><defs><linearGradient id='srg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffe08a'/><stop offset='.55' stop-color='#f5c34d'/><stop offset='1' stop-color='#e67424'/></linearGradient><mask id='srm' maskUnits='userSpaceOnUse' x='-14' y='-14' width='784.7' height='268.6'><rect x='-14' y='-14' width='784.7' height='268.6' fill='#fff'/><rect x='-14' y='77.1' width='784.7' height='9' fill='#000'/></mask><path id='srw' d='M98.2 97.9Q99.3 107.3 97.4 115Q95.6 122.7 90.3 128.1Q85.1 133.6 76.3 136.6Q67.5 139.6 54.8 139.6Q43.6 139.6 34.8 137.1Q25.9 134.7 19.2 129.9Q12.5 125.1 7.9 118Q3.2 110.9 0.4 101.8L22.7 97.2Q24.2 101.8 26.5 105.6Q28.8 109.4 32.4 112.2Q36 114.9 41 116.5Q46 118 52.9 118Q64.9 118 70.7 113.5Q76.6 109.1 75.4 99.6Q74.7 93.9 71.8 90.3Q68.8 86.7 64.3 84.4Q59.7 82 54 80.5Q48.3 78.9 42.1 77.4Q42.1 77.4 32.1 74.6Q27.1 73.1 22.5 71.1Q17.9 69 13.8 66.2Q9.7 63.4 6.5 59.2Q3.2 55.1 1 49.5Q-1.3 43.9 -2.2 36.4Q-3.4 26.2 -0.9 18.8Q1.6 11.5 7 6.9Q12.5 2.2 20.4 0.1Q28.4 -2.1 38.1 -2.1Q49.2 -2.1 57.3 0Q65.5 2.1 71.3 6.4Q77.2 10.7 81 17.2Q84.9 23.7 87.4 32.4L65 36.2Q62.2 27.3 56.2 22.9Q50.2 18.4 40.2 18.4Q33.9 18.4 29.9 19.7Q25.9 21 23.8 23.2Q21.6 25.5 20.9 28.5Q20.3 31.4 20.7 34.8Q21.3 39.8 23.7 43.1Q26.1 46.4 29.9 48.6Q33.8 50.8 39 52.3Q44.1 53.8 50.4 55.4Q55.8 56.7 61.2 58.3Q66.5 59.8 71.5 61.8Q76.5 63.9 81 66.8Q85.4 69.7 88.9 74Q92.4 78.2 94.8 84.1Q97.2 89.9 98.2 97.9ZM194 137.6 179.8 102.4H136.9L131.1 137.6H107.5L132.1 0H159.9L217.4 137.6ZM156.1 41.2Q156.1 41.2 153.3 34.3Q152 30.9 151 28L149.2 23.2Q148.6 21.4 148.6 21.2Q148.5 21.5 148.4 23.3Q148.2 25.2 147.8 28Q147.5 30.9 147 34.3L145.9 41.2L139.5 80.8H171.9ZM226.7 137.6 210.2 0H233.8L247.6 115.3H308.2L310.9 137.6ZM376.7 137.6H352.8L294.5 0H319.2L353 88.4Q353 88.4 356.3 97.4L359.2 105.8Q360.8 110.3 362 114.4Q362.3 110.4 362.8 106Q363.1 102.2 363.6 97.6L364.7 88.4L377.2 0H401.7ZM503.9 137.6 489.8 102.4H446.8L441 137.6H417.4L442 0H469.8L527.4 137.6ZM466 41.2Q466 41.2 463.2 34.3Q461.9 30.9 460.9 28L459.2 23.2Q458.5 21.4 458.5 21.2Q458.5 21.5 458.3 23.3Q458.1 25.2 457.8 28Q457.4 30.9 457 34.3L455.8 41.2L449.5 80.8H481.9ZM587.7 117Q592.9 117 597.5 116Q602.2 115 606 113.4Q609.8 111.8 612.8 109.7Q615.8 107.6 617.6 105.4L615.3 86.3H587.8L585.2 65H634.4L640.5 115.6Q637.3 120.4 632.3 124.8Q627.4 129.1 620.9 132.4Q614.5 135.6 606.7 137.6Q598.8 139.6 589.9 139.6Q574.9 139.6 563.4 134.2Q552 128.9 543.8 119.4Q535.7 109.9 530.8 96.8Q525.9 83.7 524.1 68.2Q522.1 52.1 524.1 39.1Q526.1 26.1 532.1 16.9Q538.2 7.8 548.5 2.9Q558.7 -2.1 573.4 -2.1Q584 -2.1 592.6 0.5Q601.2 3 608 7.7Q614.8 12.4 619.8 19Q624.8 25.6 628.2 33.8L607.4 41.8Q605.4 37.5 602.6 33.6Q599.7 29.8 595.8 26.9Q591.9 24 587 22.3Q582.1 20.6 576.1 20.6Q567.3 20.6 561.3 24Q555.3 27.3 551.9 33.6Q548.5 39.8 547.6 48.6Q546.6 57.3 547.9 68.2Q549.2 78.9 552.3 87.9Q555.3 96.9 560.4 103.3Q565.4 109.8 572.2 113.4Q579.1 117 587.7 117ZM658.2 137.6 641.7 0H730.5L733.2 22.3H668L672.2 56.8H732.4L735.1 79.1H674.9L679.2 115.3H747.6L750.2 137.6Z'/></defs><g transform='translate(0 9)'><use href='#srw' fill='#8d1c06' mask='url(#srm)'/></g><use href='#srw' fill='url(#srg)' mask='url(#srm)'/><rect x='172.3' y='168.6' width='412' height='81' rx='40.5' fill='#170804'/><rect x='172.3' y='163.6' width='412' height='81' rx='40.5' fill='#3c0d03' stroke='#ed9b49' stroke-width='4'/><path d='M286 231.6 273 210.7H261.9L264.5 231.6H255L248.4 176.6H270.9Q275.2 176.6 278.5 177.8Q281.8 178.9 284.1 181Q286.5 183.2 287.9 186.2Q289.3 189.2 289.7 193Q290.1 196.1 289.7 198.6Q289.2 201.2 288.1 203.2Q287.1 205.2 285.4 206.5Q283.7 207.9 281.6 208.5L296.6 231.6ZM280.3 193.5Q279.8 189.4 277.4 187.5Q275 185.5 271 185.5H258.9L260.9 201.8H273.2Q275.3 201.8 276.8 201.2Q278.2 200.6 279.1 199.5Q279.9 198.4 280.2 196.8Q280.5 195.3 280.3 193.5ZM381.2 232.4Q377 232.4 373.3 231.2Q369.6 230 366.8 227.4Q363.9 224.8 362 220.7Q360.1 216.6 359.4 211L355.3 176.6H364.8L368.8 210.1Q369.2 213.6 370.2 216.1Q371.2 218.6 372.7 220.2Q374.2 221.9 376.2 222.6Q378.1 223.4 380.4 223.4Q382.7 223.4 384.5 222.6Q386.4 221.8 387.5 220.1Q388.7 218.4 389.2 215.9Q389.7 213.3 389.2 209.7L385.3 176.6H394.7L398.8 210.4Q399.5 216.1 398.5 220.2Q397.4 224.4 395.1 227.1Q392.7 229.8 389.2 231.1Q385.6 232.4 381.2 232.4ZM497.1 231.6 472.4 189.3Q472.8 191 473.1 192.7Q473.4 194.2 473.7 195.9Q474 197.6 474.2 199.2L478.1 231.6H469.7L463.1 176.6H473.9L499 219.3Q498.6 217.7 498.3 215.9Q498 214.4 497.6 212.5Q497.3 210.5 497.1 208.6L493.2 176.6H501.6L508.2 231.6Z' fill='#f6e7d8'/><path d='M206.3 181L229.4 204.1L206.3 227.2L183.2 204.1ZM206.3 194.4L216 204.1L206.3 213.8L196.6 204.1ZM550.4 181L573.5 204.1L550.4 227.2L527.2 204.1ZM550.4 194.4L560.1 204.1L550.4 213.8L540.6 204.1Z' fill='#ed9b49' fill-rule='evenodd'/></svg>`;

/* ---------- HTML: sprite + live glyph swap ---------- */
(()=>{if(typeof document==='undefined'||!document.createElementNS||!document.body)return;try{
  const part=([m,d])=>m==='s'?`<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`:`<path d="${d}" fill="currentColor"${m==='e'?' fill-rule="evenodd"':''}/>`;
  const host=document.createElement('div');host.style.cssText='position:absolute;width:0;height:0;overflow:hidden';host.setAttribute('aria-hidden','true');
  host.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg">${SRI_N.map(n=>`<symbol id="sri-${n}" viewBox="0 0 24 24">${ICONS[n].map(part).join('')}</symbol>`).join('')}</svg>`;document.body.insertBefore(host,document.body.firstChild);
  const ico=n=>{const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('class','sri sri-'+n);s.setAttribute('aria-hidden','true');s.setAttribute('viewBox','0 0 24 24');
    const u=document.createElementNS('http://www.w3.org/2000/svg','use');u.setAttribute('href','#sri-'+n);s.appendChild(u);return s};
  const skip=e=>{for(;e&&e!==document.body;e=e.parentNode){const t=e.nodeName;if(t==='SCRIPT'||t==='STYLE'||t==='TEXTAREA'||t==='INPUT'||t==='svg'||t==='SVG'||t==='TITLE')return true}return false};
  const swapText=n=>{const t=n.nodeValue;if(!t||!n.parentNode||!SRI_RE.test(t)||skip(n.parentNode))return;const f=document.createDocumentFragment();
    for(const s of sriSplit(t))f.appendChild(s.i?ico(s.i):document.createTextNode(s.t));n.parentNode.replaceChild(f,n)};
  const walk=r=>{if(r.nodeType===3){swapText(r);return}if(r.nodeType!==1||skip(r))return;const w=document.createTreeWalker(r,4),L=[];while(w.nextNode())L.push(w.currentNode);L.forEach(swapText)};
  const mute=()=>{const m=document.getElementById('mute');if(m&&m.firstChild&&m.firstChild.nodeType===3&&m.textContent.trim()==='×'){m.textContent='';m.appendChild(ico('soundOff'))}};
  walk(document.body);mute();
  new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')swapText(m.target);else m.addedNodes.forEach(walk)}mute()}).observe(document.body,{childList:true,subtree:true,characterData:true});
}catch(e){}})();

/* ---------- canvas: draw the same icons inside fillText ---------- */
(()=>{if(typeof CanvasRenderingContext2D==='undefined'||typeof Path2D==='undefined')return;
  const P=CanvasRenderingContext2D.prototype,oF=P.fillText,oM=P.measureText,cache={};
  const paths=n=>cache[n]||(cache[n]=ICONS[n].map(([m,d])=>[m,new Path2D(d)]));
  const fsOf=c=>{const f=String(c.font).split('px')[0].split(' ').pop();return parseFloat(f)||12};
  function drawIco(c,n,x,top,sz){c.save();c.translate(x,top);const k=sz/24;c.scale(k,k);
    for(const [m,p] of paths(n)){if(m==='s'){c.strokeStyle=c.fillStyle;c.lineWidth=2.4;c.lineCap='round';c.lineJoin='round';c.stroke(p)}else c.fill(p,m==='e'?'evenodd':'nonzero')}c.restore()}
  const width=(c,segs,fs)=>segs.reduce((w,s)=>w+(s.i?fs:oM.call(c,s.t).width),0);
  P.measureText=function(t){const s=String(t);if(!SRI_RE.test(s))return oM.call(this,t);const r=oM.call(this,s.replace(SRI_RES,'M'));
    return {width:width(this,sriSplit(s),fsOf(this)),actualBoundingBoxAscent:r.actualBoundingBoxAscent,actualBoundingBoxDescent:r.actualBoundingBoxDescent,actualBoundingBoxLeft:r.actualBoundingBoxLeft,actualBoundingBoxRight:r.actualBoundingBoxRight}};
  P.fillText=function(t,x,y,mw){const s=String(t);if(!SRI_RE.test(s))return mw===undefined?oF.call(this,t,x,y):oF.call(this,t,x,y,mw);
    const fs=fsOf(this),segs=sriSplit(s),w=width(this,segs,fs),al=this.textAlign,bl=this.textBaseline;
    let cx=al==='center'?x-w/2:(al==='right'||al==='end')?x-w:x;
    const top=bl==='middle'?y-fs*.5:(bl==='top'||bl==='hanging')?y:(bl==='bottom'||bl==='ideographic')?y-fs:y-fs*.8;
    this.textAlign='left';try{for(const g of segs){if(g.i){drawIco(this,g.i,cx+fs*.03,top+fs*.02,fs*.94);cx+=fs}else{oF.call(this,g.t,cx,y);cx+=oM.call(this,g.t).width}}}finally{this.textAlign=al}}})();

/* ---------- names → icons ---------- */
Object.assign(UIC,{dmg:sri('blaster'),spd:sri('speed'),hp:sri('hull'),mag:sri('magnet'),bag:sri('pack')});
for(const k of Object.keys(CDEF))if(ICONS[k])CDEF[k].ic=sri(k);
for(const k of Object.keys(GDEF))if(ICONS[k])GDEF[k].ic=sri(k);
const SLOT_IC={weapon:'weapon',helmet:'helmet',armor:'armor',legs:'legs',boots:'boots',gloves:'gloves',pack:'pack',ring:'ring',ring1:'ring',ring2:'ring',neck:'neck'};
const TAB_IC={upg:'wrench',gear:'helmet',crew:'drone',map:'map',wastes:'skull'};

/* ---------- styles ---------- */
const rst=document.createElement('style');if(document.head&&document.head.appendChild)rst.textContent=`
.sri{width:1.08em;height:1.08em;vertical-align:-.18em;display:inline-block;flex:none;overflow:visible}
#menu h1{font-size:0!important;line-height:0;text-shadow:none!important;width:min(84vw,400px);margin:0 auto}#menu h1 svg{width:100%;height:auto;display:block}
@media (orientation:landscape) and (max-height:620px){#menu h1{width:min(34vw,calc(22vh * 2.9),340px)}#menu .mL{gap:7px!important}}
#hudBtns button{width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:20px;padding:0}#hudBtns[data-compact="split"] button{width:40px;height:40px;font-size:18px}
body.sr-ovl #hudBtns,body.sr-ovl #dash,body.sr-ovl #dash2{display:none!important}
#hubBar{max-width:calc(100vw - 12px)}#hubBar .r{gap:6px;max-width:100%}
#hubBar button{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 10px 7px;font-size:13px;letter-spacing:.04em;min-width:0}
#hubBar button .sri{width:22px;height:22px}
#base{touch-action:pan-y}#bbody{overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y}.pan{overflow-y:auto!important;touch-action:pan-y}
#base .tabs{grid-template-columns:repeat(5,minmax(0,1fr))!important}#base .tabs button{display:flex;flex-direction:column;align-items:center;gap:3px;padding:7px 2px 6px!important;font-size:12.5px;letter-spacing:.03em;min-width:0}
#base .tabs button .sri{width:22px;height:22px}#base .x{display:flex;align-items:center;justify-content:center}
#base .chip .sri,#prof .chip .sri{width:16px;height:16px}
@media (orientation:landscape) and (max-height:620px){#base .bh .tabs{flex:1;max-width:600px}#base .tabs button{flex-direction:row;justify-content:center;gap:6px;padding:7px 4px!important;font-size:13px}#base .tabs button .sri{width:18px;height:18px}#base .bh h2{display:none}#base .bh .chips{flex:none}.ctl .tl .n .sri{width:18px;height:18px}.ctl .tl .n{gap:4px;font-size:13px}.ctl .tl .s{font-size:12px}}
.ut b{display:flex;align-items:center;gap:8px}.ut b .sri{width:26px;height:26px;color:var(--gold)}
.tl .sri{width:20px;height:20px}
.gtile{height:70px!important;display:grid!important;grid-template-rows:1fr auto;justify-items:center;align-items:center;padding:6px 4px 5px!important;gap:2px}
.gtile .gi .sri{width:28px;height:28px}.gtile .gp{font-size:14px;font-weight:800;line-height:1}.gtile .bd{top:2px!important;right:4px!important}.gtile.empty .gi{opacity:.4}
.slots .gtile{height:64px!important}.slots .gtile .gi .sri{width:26px;height:26px}
#bbody.t-gear #bstash{min-height:146px!important;overflow:hidden;grid-auto-rows:70px;align-content:start}
@media (orientation:portrait),(max-width:700px){#bbody.t-gear{display:flex!important;flex-direction:column}#bbody.t-gear>.pan{flex:none;overflow:visible!important}#bbody.t-gear .det{min-height:0!important}}
#base .pips i.x{width:auto;height:8px;border:0;border-radius:2px;flex:1;display:block}
.ctl .tl .n{display:flex;align-items:center;gap:6px}.ctl .tl .n .sri{width:22px;height:22px}
.det .nm{display:flex;align-items:center;gap:8px}.det .nm .sri{width:28px;height:28px}
.v13mastery button{min-height:40px}.v13mastery small,#prof small{font-size:13px!important}
.link{padding:10px 14px!important}
#pick .card .rar{display:flex;align-items:center;justify-content:center;gap:6px}
`;if(document.head&&document.head.appendChild)document.head.appendChild(rst);

/* ---------- menu logo ---------- */
(()=>{const h=srQ('#menu h1');if(h){h.innerHTML=SRI_LOGO;h.setAttribute('aria-label','Salvage Run')}})();

/* ---------- landscape menu: character picker moves to the right column ---------- */
const srMenuFit=()=>{const ch=document.getElementById('charPick'),L=srQ('#menu .mL'),R=srQ('#menu .mR'),pf=document.getElementById('prof');if(!ch||!L||!R||!R.insertBefore)return;
  const land=innerWidth>innerHeight&&innerHeight<=620;if(land&&ch.parentNode!==R)R.insertBefore(ch,R.firstChild);else if(!land&&ch.parentNode!==L){if(pf&&pf.nextSibling)L.insertBefore(ch,pf.nextSibling);else L.appendChild(ch)}};
srMenuFit();addEventListener('resize',srMenuFit);

/* ---------- gear tab: icon tiles that stay readable ---------- */
tabGear=function(){const L=stashList(),pages=Math.max(1,Math.ceil(L.length/bCap));bPage=clamp(bPage,0,pages-1);const view=L.slice(bPage*bCap,bPage*bCap+bCap),sel=save.stash.find(i=>i.id===bSel)||null;
  const slots=SLOTS.map(s=>{const it=equipped(s),t=typeOf(s),on=bFilt===t,c=it?rarCol(it):'rgba(246,231,216,.55)';return `<button class="tl gtile${it?'':' empty'}${on?' sel':''}" data-act="slot" data-s="${t}" title="${SLOT_N[s]}" aria-label="${SLOT_N[s]}${it?' · '+esc(it.name):' · empty'}" style="border-color:${it?c:'#3a1a10'}">
    <span class="gi" style="color:${c}">${sri(SLOT_IC[s])}</span><span class="gp" style="color:${c}">${it?'IP '+itemPower(it)+(it.f?' +'+it.f:''):'empty'}</span></button>`}).join('');
  const tiles=view.map(it=>{const cm=cmpOf(it),eq=isEquipped(it),up=!eq&&itemPower(it)>itemPower(cm),c=rarCol(it);return `<button class="tl gtile${it.id===bSel?' sel':''}" data-act="item" data-id="${it.id}" title="${esc(it.name)}" aria-label="${GRAR[it.rar][0]} ${SLOT_N[it.slot]} · IP ${itemPower(it)}" style="border-color:${c}">
    <span class="bd" style="color:${eq?'#f5c34d':'#7be08f'}">${eq?'E':up?sri('up'):''}</span><span class="gi" style="color:${c}">${sri(SLOT_IC[it.slot])}</span><span class="gp" style="color:${c}">IP ${itemPower(it)}${it.f?' +'+it.f:''}</span></button>`}).join('');
  return `<div class="pan"><h4>EQUIPPED · GS ${gearScore()}</h4><div class="tiles slots">${slots}</div></div>
  <div class="pan"><div class="pager"><h4>STASH ${save.stash.length}/${STASH_MAX}${bFilt?' · '+SLOT_N[bFilt].toUpperCase():''}</h4><span style="display:flex;gap:6px;align-items:center">
    <button data-act="page" data-d="-1" aria-label="Previous page">‹</button><span style="font-size:14px">${bPage+1}/${pages}</span><button data-act="page" data-d="1" aria-label="Next page">›</button></span></div>
    <div class="tiles" id="bstash" style="grid-template-columns:repeat(auto-fill,minmax(70px,1fr));flex:1;min-height:0">${tiles||'<div class="note2">Nothing here yet. Crates, camps, gatekeepers and vaults drop gear.</div>'}</div>
    <div class="pager"><span class="note2">Epic+ within ${Math.max(1,PITY-(save.pity||0))} drops</span><button data-act="odds" style="width:auto;padding:0 12px;font:800 14px Sora,system-ui,sans-serif">ODDS</button></div></div>${bSel==='__odds'?oddsPanel():gearDetailIc(sel)}`};
const gearDetailIc=it=>{const h=gearDetail(it);if(!it)return h;return h.replace('<div class="nm" style="color:'+rarCol(it)+'">','<div class="nm" style="color:'+rarCol(it)+'">'+sri(SLOT_IC[it.slot]))};

/* ---------- base: tab icons, one tab row, scrollable panels ---------- */
const _rb13ui=renderBase;renderBase=function(){_rb13ui();if(!baseOpen())return;
  for(const b of srQA(baseEl,'.tabs button')){const n=TAB_IC[b.dataset.t];if(n&&!b.dataset.ic&&b.firstChild){b.dataset.ic='1';b.insertBefore(document.createTextNode(sri(n)),b.firstChild)}}
  const bh=baseEl.querySelector&&baseEl.querySelector('.bh'),tb=baseEl.querySelector&&baseEl.querySelector('.tabs');if(bh&&tb&&bh.insertBefore){const land=innerWidth>innerHeight&&innerHeight<=620;if(land&&tb.parentNode!==bh)bh.insertBefore(tb,bh.querySelector('.chips'));}};

/* ---------- hub bar icons ---------- */
(()=>{if(typeof hubBar==='undefined'||!hubBar.querySelectorAll)return;for(const b of srQA(hubBar,'button')){if(!b.insertBefore||!b.dataset)continue;const n=TAB_IC[b.dataset.t];if(n)b.insertBefore(document.createTextNode(sri(n)),b.firstChild)}})();

/* ---------- overlays hide the in-game buttons ---------- */
const _ut13ui=uiTick;uiTick=function(){_ut13ui();if(!document.body||!document.body.classList)return;
  const vis=e=>e&&e.style&&e.style.display==='flex';const on=vis(baseEl)||vis(pickEl)||vis(pauseEl);document.body.classList.toggle('sr-ovl',on)};

if(window.__game)Object.defineProperties(window.__game,Object.getOwnPropertyDescriptors({ICONS,sri,sriSplit,tabGear,renderBase,uiTick,SRI_LOGO}));
