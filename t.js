/* ================= v0.13 · SETTINGS =================
   Local preferences: audio, comfort, haptics, controls. No external settings service. */
{
const SR_SETTING_DEFAULTS={muted:false,sfx:100,music:100,shake:true,reduceHitFlashes:false,haptics:true};
const srSettings=Object.assign({},SR_SETTING_DEFAULTS,save.settings&&typeof save.settings==='object'?save.settings:{});
srSettings.sfx=clamp(Number.isFinite(+srSettings.sfx)?+srSettings.sfx:100,0,100);
srSettings.music=clamp(Number.isFinite(+srSettings.music)?+srSettings.music:100,0,100);
srSettings.muted=!!srSettings.muted;srSettings.shake=srSettings.shake!==false;
srSettings.reduceHitFlashes=!!srSettings.reduceHitFlashes;srSettings.haptics=srSettings.haptics!==false;
let srSettingsReturn='menu',srSettingsFocus='';
const srSettingsEl=document.createElement('div');srSettingsEl.id='srSettings';srSettingsEl.className='sub';srSettingsEl.setAttribute('role','dialog');srSettingsEl.setAttribute('aria-modal','true');srSettingsEl.setAttribute('aria-labelledby','srSettingsTitle');
srSettingsEl.innerHTML=`<div class="sr-set-wrap">
  <header class="sr-set-head"><div><small>FIELD KIT · PERSONAL CONFIG</small><h2 id="srSettingsTitle" tabindex="-1">SETTINGS</h2></div><button type="button" class="alt sr-set-back" data-sr-action="back" aria-label="Back to game">BACK</button></header>
  <p class="sr-set-intro">Tune the kit to your rig. Settings save on this device.</p><p class="sr-online-note" id="srOnlineNote" hidden>Online games keep running while Settings is open.</p>
  <section class="sr-set-panel" aria-labelledby="srAudioTitle"><h3 id="srAudioTitle">AUDIO</h3>
    <div class="sr-set-row"><div><b>Game sound</b><small>Mute or unmute sound effects and music together.</small></div><button type="button" class="sr-set-toggle" data-sr-action="mute" aria-pressed="false">ON</button></div>
    <div class="sr-set-slider"><label for="srSfx">Sound effects <output id="srSfxValue" for="srSfx">100%</output></label><input id="srSfx" type="range" min="0" max="100" step="1" value="100" aria-label="Sound effects volume"></div>
    <div class="sr-set-slider"><label for="srMusic">Music <output id="srMusicValue" for="srMusic">100%</output></label><input id="srMusic" type="range" min="0" max="100" step="1" value="100" aria-label="Music volume"></div>
  </section>
  <section class="sr-set-panel" aria-labelledby="srComfortTitle"><h3 id="srComfortTitle">COMFORT</h3>
    <div class="sr-set-row"><div><b>Screen shake</b><small>Turn off camera shake on hits and impacts.</small></div><button type="button" class="sr-set-toggle" data-sr-setting="shake" aria-pressed="true">ON</button></div>
    <div class="sr-set-row"><div><b>Reduce hit flashes</b><small>Softens the red damage vignette and white impact flashes.</small></div><button type="button" class="sr-set-toggle" data-sr-setting="reduceHitFlashes" aria-pressed="false">OFF</button></div>
    <div class="sr-set-row"><div><b>Haptics</b><small id="srHapticNote">Short vibration on supported devices.</small></div><button type="button" class="sr-set-toggle" data-sr-setting="haptics" aria-pressed="true">ON</button></div>
  </section>
  <section class="sr-set-panel sr-controls" aria-labelledby="srControlsTitle"><h3 id="srControlsTitle">FIELD MANUAL · CONTROLS</h3>
    <div class="sr-control-grid">
      <article><b>TOUCH</b><p>Drag anywhere to move. Auto-fire handles attacks. Tap the round ability button; unlocked gadgets appear as round buttons too.</p></article>
      <article><b>KEYBOARD</b><p>WASD move · Space ability · Q / E gadgets · P or Esc pause · M mute · B Base.</p></article>
      <article><b>GAMEPAD</b><p>Left stick or D-pad move · A ability · Start pauses outside Party · LB / RB gadgets · X / Y / B choose perk cards 1 / 2 / 3.</p></article>
      <article><b>PARTY KEYS</b><p>P1 WASD + Space · P2 arrows + Enter · P3 IJKL + O · P4 numpad 8456 + 0. Each player moves in their own screen section.</p></article>
    </div>
  </section>
  <section class="sr-set-panel sr-reset-panel" id="srResetPanel" aria-labelledby="srResetTitle"><h3 id="srResetTitle">SAVE DATA</h3>
    <p>Your progress is stored in this browser. Reset only if you want a fresh run.</p>
    <button type="button" class="sr-reset-start" data-sr-action="resetStart">RESET PROGRESS</button>
    <div class="sr-reset-confirm" hidden><strong>Erase this device's saved progress?</strong><p>This resets rank, bank, upgrades, gear, unlocks and lifetime stats. It also ends the current run or room. This cannot be undone.</p><div class="sr-reset-actions"><button type="button" class="sr-keep-save" data-sr-action="resetCancel">KEEP MY SAVE</button><button type="button" class="sr-erase-save" data-sr-action="resetConfirm">ERASE SAVE</button></div></div>
  </section>
  <footer class="sr-set-foot"><span>Salvage Run · v0.13</span><button type="button" class="alt sr-set-back" data-sr-action="back">BACK TO GAME</button></footer>
</div>`;
document.body.appendChild(srSettingsEl);

const srSettingsStyle=document.createElement('style');srSettingsStyle.textContent=`
#srSettings{z-index:20;justify-content:flex-start;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y;padding:max(14px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));text-align:left}
.sr-set-wrap{width:min(100%,620px);margin:0 auto;display:flex;flex-direction:column;gap:12px;padding:2px 0 14px}
.sr-set-head{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(237,155,73,.24);padding:4px 0 10px}
.sr-set-head small{font-size:11px;font-weight:800;letter-spacing:.16em;color:var(--scrap)}
.sr-set-head h2{margin:3px 0 0;font-size:clamp(30px,8vw,42px);line-height:1.05;color:var(--gold);text-shadow:0 3px 0 var(--blood)}
.sr-set-back{font-size:13px!important;padding:9px 14px!important;min-width:72px;min-height:44px;box-shadow:none!important}
.sr-set-intro{margin:0;font-size:14px!important;opacity:.68}
.sr-set-panel{display:flex;flex-direction:column;gap:10px;padding:12px;background:linear-gradient(135deg,rgba(60,13,3,.88),rgba(35,11,6,.94));border:1px solid rgba(237,155,73,.28);border-left:3px solid rgba(237,155,73,.7);border-radius:12px;box-shadow:inset 0 1px 0 rgba(246,231,216,.04)}
.sr-set-panel h3{margin:0;font-size:12px;letter-spacing:.16em;color:var(--scrap)}
.sr-set-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:8px 0;border-top:1px solid rgba(246,231,216,.08)}
.sr-set-row>div{display:flex;flex-direction:column;gap:3px;min-width:0}.sr-set-row b{font-size:15px}.sr-set-row small{font-size:12px;line-height:1.35;opacity:.62}
.sr-set-toggle{flex:none;min-width:76px;min-height:44px;border:1px solid #70401f;border-radius:9px;background:#2c1008;color:var(--ink);font:800 13px Sora,system-ui,sans-serif;letter-spacing:.08em}
.sr-set-toggle[aria-pressed="true"]{border-color:var(--gold);background:rgba(245,195,77,.16);color:var(--gold)}
.sr-set-toggle:disabled{opacity:.45;cursor:not-allowed}
.sr-set-slider{display:flex;flex-direction:column;gap:5px;border-top:1px solid rgba(246,231,216,.08);padding-top:9px}
.sr-set-slider label{display:flex;justify-content:space-between;align-items:center;font-size:14px;font-weight:700}.sr-set-slider output{font-variant-numeric:tabular-nums;color:var(--gold)}
.sr-set-slider input{width:100%;height:44px;margin:0;accent-color:var(--gold);touch-action:pan-x}
.sr-online-note{margin:0;padding:9px 11px;border-left:3px solid var(--gold);background:rgba(245,195,77,.1);font-size:13px!important;line-height:1.35;opacity:.9!important}
.sr-control-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.sr-control-grid article{min-width:0;padding:10px;background:rgba(23,8,4,.58);border:1px solid rgba(237,155,73,.16);border-radius:9px}
.sr-control-grid article b{font-size:11px;letter-spacing:.13em;color:var(--gold)}
.sr-control-grid article p{margin:5px 0 0;font-size:12px;line-height:1.5;opacity:.75}
.sr-reset-panel>p{margin:0;font-size:13px!important;line-height:1.4;opacity:.68}
.sr-reset-start,.sr-keep-save,.sr-erase-save{min-height:44px;padding:9px 13px;border-radius:9px;font:800 12px Sora,system-ui,sans-serif;letter-spacing:.07em}
.sr-reset-start{align-self:flex-start;border:1px solid #8b4325;background:rgba(141,28,6,.26);color:#ffb08a}
.sr-reset-confirm{padding:10px;background:rgba(23,8,4,.8);border:1px solid rgba(255,90,60,.45);border-radius:9px}
.sr-reset-confirm strong{font-size:14px;color:#ffb08a}.sr-reset-confirm p{margin:5px 0 10px;font-size:12px;line-height:1.4;opacity:.72}
.sr-reset-actions{display:flex;gap:8px;flex-wrap:wrap}.sr-keep-save{border:1px solid #70401f;background:transparent;color:var(--ink)}.sr-erase-save{border:1px solid #ff5a3c;background:#8d1c06;color:#fff3eb}
.sr-set-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:2px 0 10px;font-size:11px;letter-spacing:.08em;opacity:.58}
.sr-set-foot .sr-set-back{opacity:1}
#srSettings button:focus-visible,#srSettings input:focus-visible{outline:3px solid #f5c34d;outline-offset:2px}
.sr-pause-settings{width:100%;min-height:44px;padding:10px 14px!important;font-size:14px!important;box-shadow:none!important}
@media(max-width:420px){.sr-control-grid{grid-template-columns:1fr}.sr-set-panel{padding:10px}.sr-set-row{gap:8px}.sr-set-toggle{min-width:68px}}
`;
document.head.appendChild(srSettingsStyle);

function srStoreSettings(){save.settings={...srSettings};persist()}
function srPaintToggle(key){const b=srSettingsEl.querySelector(`[data-sr-setting="${key}"]`);if(!b)return;const on=!!srSettings[key];b.setAttribute('aria-pressed',String(on));b.textContent=on?'ON':'OFF'}
function srPaintMute(){const b=srSettingsEl.querySelector('[data-sr-action="mute"]');if(b){b.setAttribute('aria-pressed',String(!muted));b.textContent=muted?'MUTED':'ON'}if(muteEl)muteEl.textContent=muted?'×':'♪'}
function srApplyAudio(){muted=!!srSettings.muted;srHapticsEnabled=!!srSettings.haptics;if(MG&&AC){const v=.55*(srSettings.music/100);try{MG.gain.setTargetAtTime(v,AC.currentTime,.04)}catch(e){MG.gain.value=v}}srPaintMute()}
function srUpdateVolume(id,key){const input=srSettingsEl.querySelector('#'+id),output=srSettingsEl.querySelector('#'+id+'Value');if(!input)return;const v=clamp(+input.value||0,0,100);srSettings[key]=v;if(output)output.value=v+'%';srApplyAudio()}
function srRenderSettings(){const onlineNote=srSettingsEl.querySelector('#srOnlineNote');if(onlineNote)onlineNote.hidden=!(mode==='host'||mode==='guest');const sfx=srSettingsEl.querySelector('#srSfx'),music=srSettingsEl.querySelector('#srMusic');if(sfx)sfx.value=String(srSettings.sfx);if(music)music.value=String(srSettings.music);
  const so=srSettingsEl.querySelector('#srSfxValue'),mo=srSettingsEl.querySelector('#srMusicValue');if(so)so.value=srSettings.sfx+'%';if(mo)mo.value=srSettings.music+'%';
  for(const k of ['shake','reduceHitFlashes','haptics'])srPaintToggle(k);
  const hb=srSettingsEl.querySelector('[data-sr-setting="haptics"]'),note=srSettingsEl.querySelector('#srHapticNote'),supported=typeof navigator!=='undefined'&&typeof navigator.vibrate==='function';
  if(hb){hb.disabled=!supported;hb.textContent=supported?(srSettings.haptics?'ON':'OFF'):'UNAVAILABLE';hb.setAttribute('aria-pressed',String(supported&&srSettings.haptics))}
  if(note)note.textContent=supported?'Short vibration on supported devices.':'Vibration is not supported in this browser.';
  srPaintMute()}
function srOpenSettings(from='menu',focus=''){srSettingsReturn=from==='pause'?'pause':'menu';srSettingsFocus=focus;
  if(srSettingsReturn==='pause')pauseEl.style.display='none';else $('menu').style.display='none';
  srSettingsEl.style.display='flex';srRenderSettings();
  requestAnimationFrame(()=>{if(focus==='reset'){const p=srSettingsEl.querySelector('#srResetPanel');if(p)p.scrollIntoView({block:'center'});const b=srSettingsEl.querySelector('[data-sr-action="resetStart"]');if(b)b.focus()}else{const h=srSettingsEl.querySelector('#srSettingsTitle');if(h)h.focus()}})}
function srCloseSettings(){srSettingsEl.style.display='none';srSettingsEl.querySelector('.sr-reset-confirm').hidden=true;
  if(srSettingsReturn==='pause'){pauseEl.style.display='flex';const b=pauseEl.querySelector('.sr-pause-settings');if(b)b.focus()}
  else{$('menu').style.display='flex';const b=$('srOpenSettings');if(b)b.focus()}}
function srConfirmReset(){const pref={...srSettings};save=freshSave();Object.assign(srSettings,pref);save.settings={...srSettings};ensureDaily();persist();
  srSettingsEl.style.display='none';pauseEl.style.display='none';backToMenu();renderCharPick();menuMeta()}
srSettingsEl.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-sr-action]');if(!b)return;e.preventDefault();const a=b.dataset.srAction;
  if(a==='back')srCloseSettings();
  else if(a==='mute'){srSettings.muted=!srSettings.muted;srApplyAudio();srStoreSettings()}
  else if(a==='resetStart'){const c=srSettingsEl.querySelector('.sr-reset-confirm');c.hidden=false;c.scrollIntoView({block:'nearest'});srSettingsEl.querySelector('[data-sr-action="resetCancel"]').focus()}
  else if(a==='resetCancel'){srSettingsEl.querySelector('.sr-reset-confirm').hidden=true;srSettingsEl.querySelector('[data-sr-action="resetStart"]').focus()}
  else if(a==='resetConfirm')srConfirmReset()});
srSettingsEl.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-sr-setting]');if(!b||b.disabled)return;const k=b.dataset.srSetting;srSettings[k]=!srSettings[k];if(k==='haptics')srHapticsEnabled=srSettings.haptics;srPaintToggle(k);srStoreSettings()});
srSettingsEl.addEventListener('input',e=>{if(e.target&&e.target.id==='srSfx'){srUpdateVolume('srSfx','sfx')}else if(e.target&&e.target.id==='srMusic'){srUpdateVolume('srMusic','music')}});
srSettingsEl.addEventListener('change',e=>{if(e.target&&['srSfx','srMusic'].includes(e.target.id)){srUpdateVolume(e.target.id,e.target.id==='srSfx'?'sfx':'music');srStoreSettings()}});
window.addEventListener('keydown',e=>{if(srSettingsEl.style.display!=='flex')return;
  if(e.key==='Escape'||e.key==='Backspace'){e.preventDefault();e.stopImmediatePropagation();srCloseSettings();return}
  if(e.key==='Tab'){const f=[...srSettingsEl.querySelectorAll('button:not(:disabled),input:not(:disabled)')].filter(x=>x.offsetWidth||x.offsetHeight);const first=f[0],last=f[f.length-1],active=document.activeElement;
    if(e.shiftKey&&(active===first||active===srSettingsEl.querySelector('#srSettingsTitle'))){e.preventDefault();last&&last.focus()}
    else if(!e.shiftKey&&active===last){e.preventDefault();first&&first.focus()}}
  e.stopImmediatePropagation()},true);

/* Route the existing menu reset affordance through Settings so a destructive wipe always needs a second click. */
(()=>{const old=$('reset'),modes=$('menu')&&$('menu').querySelector('.modes');if(modes&&!$('srOpenSettings')){const b=document.createElement('button');b.type='button';b.id='srOpenSettings';b.className='alt';b.innerHTML='SETTINGS<small>audio · comfort · controls</small>';b.addEventListener('click',()=>srOpenSettings('menu'));modes.appendChild(b)}
  if(old){const b=document.createElement('button');b.type='button';b.id='reset';b.textContent='reset progress';b.className='link';old.replaceWith(b);b.addEventListener('click',()=>srOpenSettings('menu','reset'))}})();
const srOpenPauseBase=openPause;openPause=function(){srOpenPauseBase();if(pauseEl.style.display!=='flex')return;const box=pauseEl.querySelector('.pbox');if(!box||box.querySelector('.sr-pause-settings'))return;
  const b=document.createElement('button');b.type='button';b.className='alt sr-pause-settings';b.textContent='SETTINGS · AUDIO · COMFORT · CONTROLS';b.addEventListener('click',()=>srOpenSettings('pause'));
  const top=box.querySelector('.ptop');if(top&&top.parentNode)top.insertAdjacentElement('afterend',b);else box.insertBefore(b,box.firstChild)};
const srInitAudioBase=initAudio;initAudio=function(){srInitAudioBase();srApplyAudio()};
const srBeepBase=beep;beep=function(f,d,type,v,slide){const mult=srSettings.sfx/100;if(mult<=0)return;return srBeepBase(f,d,type,v==null?undefined:v*mult,slide)};
const srToggleMuteBase=toggleMute;toggleMute=function(){srToggleMuteBase();srSettings.muted=muted;srStoreSettings();srPaintMute()};
const srDrawViewBase=drawView;drawView=function(v){if(srSettings.shake||!v||!v.p)return srDrawViewBase(v);const id=v.p.id,old=shakes[id];shakes[id]=0;try{return srDrawViewBase(v)}finally{if(old===undefined)delete shakes[id];else shakes[id]=old}};
const srDrawHudBase=drawHud;drawHud=function(p,...args){if(!srSettings.reduceHitFlashes||!p)return srDrawHudBase(p,...args);const hurt=p.hurt;p.hurt=0;try{return srDrawHudBase(p,...args)}finally{p.hurt=hurt}};
const srDrawEnemyBase=drawEnemy;drawEnemy=function(e,...args){if(!srSettings.reduceHitFlashes||!e)return srDrawEnemyBase(e,...args);const flash=e.flash;e.flash=0;try{return srDrawEnemyBase(e,...args)}finally{e.flash=flash}};
const srDrawCrateBase=drawCrate;drawCrate=function(c,...args){if(!srSettings.reduceHitFlashes||!c)return srDrawCrateBase(c,...args);const flash=c.flash;c.flash=0;try{return srDrawCrateBase(c,...args)}finally{c.flash=flash}};
const srDrawBodyBase=drawBody;drawBody=function(o,...args){if(!srSettings.reduceHitFlashes||!o)return srDrawBodyBase(o,...args);const flash=o.flash;o.flash=0;try{return srDrawBodyBase(o,...args)}finally{ o.flash=flash }};
srApplyAudio();srRenderSettings();

if(window.__game)Object.defineProperties(window.__game,Object.getOwnPropertyDescriptors({openSettings:srOpenSettings,closeSettings:srCloseSettings,get settings(){return {...srSettings}},get settingsHtml(){return srSettingsEl.innerHTML}}));

}
