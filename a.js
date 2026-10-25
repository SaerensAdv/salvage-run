// Salvage Run v0.3 · data, save, audio
const TAU=Math.PI*2,rand=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>v<a?a:v>b?b:v;
const $=id=>document.getElementById(id);
const cv=$('c'),ctx=cv.getContext('2d');
let W=0,H=0,DPR=1,Z=1;
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;Z=clamp(Math.min(W,H)/700,.62,1.15)}
addEventListener('resize',resize);resize();

const WORLD=8000,HUB={x:4000,y:4000,r:170},Z2=700,Z3=1250,MULT=[0,1,2,3];
const tierAt=(x,y)=>{const d=Math.hypot(x-HUB.x,y-HUB.y);return d<Z2?1:d<Z3?2:3};
const inHub=o=>Math.hypot(o.x-HUB.x,o.y-HUB.y)<HUB.r;
const F=(w,s)=>`${w} ${s}px Sora, system-ui, sans-serif`;
const today=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};

/* ================= DATA ================= */
const UPG={dmg:{n:'Blaster',base:25},spd:{n:'Boots',base:20},hp:{n:'Hull',base:25},mag:{n:'Magnet',base:15},bag:{n:'Backpack',base:20}};
const UPMAX=10;
const RAR=['COMMON','RARE','EPIC'],RW=[60,30,10];
const PERKS={
  dmg:{n:'Hot Rounds',d:'+20% damage',max:5,r:0},
  rate:{n:'Overclock',d:'+20% fire rate',max:5,r:0},
  crit:{n:'Lucky Shot',d:'+10% crit chance. Crits hit ×2.5',max:4,r:0},
  pierce:{n:'Railgun',d:'Shots pierce 1 more target',max:3,r:0},
  range:{n:'Long Barrel',d:'+15% range',max:3,r:0},
  plating:{n:'Plating',d:'+25 max hull and a full repair',max:4,r:0},
  leech:{n:'Leech',d:'Every kill repairs 1 hull',max:3,r:0},
  vacuum:{n:'Vacuum',d:'+50% pickup radius',max:2,r:0},
  thruster:{n:'Thrusters',d:'Ability recharges faster. Rams hit 50% harder',max:3,r:0},
  twin:{n:'Twin Barrel',d:'+1 shot per volley',max:3,r:1},
  greed:{n:'Greed',d:'+25% scrap. Monsters hit 20% harder',max:3,r:1},
  saw:{n:'Orbit Saw',d:'+1 saw circling you',max:4,r:1},
  bounce:{n:'Ricochet',d:'Shots bounce to 1 more target',max:2,r:1},
  bounty:{n:'Bounty Hunter',d:'+30% damage to raiders, +75% of their loot',max:2,r:1},
  last:{n:'Last Stand',d:'Under 35% hull: +60% damage',max:1,r:2},
  nova:{n:'Shock Nova',d:'A shock ring every 3.5 s',max:3,r:2},
  shield:{n:'Scrap Shield',d:'Carrying 40+ scrap: take 30% less damage',max:1,r:2}
};
const SPECIAL={_cache:{n:'Scrap Cache',d:'+25 scrap in your bag right now',r:0},_heal:{n:'Field Repair',d:'Full hull repair',r:0}};
const RANKS=[
  {g:[['kill:crawler',25,'Kill 25 crawlers'],['haul',20,'Bank a haul of 20'],['upgrade',2,'Own 2 upgrade levels']],u:'saw'},
  {g:[['raider',1,'Wreck a raider'],['level',5,'Reach run level 5'],['crate',8,'Break 8 crates']],u:'bounce'},
  {g:[['haul',60,'Bank a haul of 60'],['kill:brute',10,'Kill 10 brutes'],['dashkill',5,'Ram 5 monsters to death']],u:'nova'},
  {g:[['deepbank',1,'Bank after visiting Zone 3'],['beacon',1,'Extract at a beacon'],['level',8,'Reach run level 8']],u:'skin:1'},
  {g:[['boss',1,'Kill a Golden Brute'],['raider',3,'Wreck 3 raiders'],['upgrade',10,'Own 10 upgrade levels']],u:'shield'},
  {g:[['revenge',1,'Wreck the raider who wrecked you'],['haul',150,'Bank a haul of 150'],['nohit',30,'Bank 30+ without taking a hit']],u:'bounty'},
  {g:[['beacon',3,'Extract at 3 beacons'],['kill',300,'Kill 300 monsters'],['level',12,'Reach run level 12']],u:'skin:2'},
  {g:[['boss',3,'Kill 3 Golden Brutes'],['haul',300,'Bank a haul of 300'],['raider',10,'Wreck 10 raiders']],u:'skin:3'},
  {g:[['deepbank',5,'Bank after Zone 3, 5 times'],['nohit',80,'Bank 80+ without taking a hit'],['upgrade',25,'Own 25 upgrade levels']],u:'skin:4'},
  {g:[['haul',500,'Bank a haul of 500'],['boss',5,'Kill 5 Golden Brutes'],['level',15,'Reach run level 15']],u:'legend'}
];
const RANK_NAMES=['Scavenger','Picker','Tinker','Runner','Breaker','Stalker','Reaver','Warlord','Ghost','Salvage Legend','Salvage Legend'];
const MAXMODE=new Set(['haul','level','nohit','upgrade']);
const DAILY=[['kill:crawler',[80,120],'Kill {n} crawlers'],['kill:dasher',[50,80],'Kill {n} dashers'],['kill:brute',[15,25],'Kill {n} brutes'],
  ['bankTotal',[400,800,1200],'Bank {n} scrap today'],['raider',[3,5],'Wreck {n} raiders'],['crate',[15,25],'Break {n} crates'],
  ['beacon',[1,2],'Extract at {n} beacon(s)'],['dashkill',[10,20],'Ram {n} monsters to death'],['haul',[80,150],'Bank one haul of {n}'],['level',[8,12],'Reach run level {n}']];
const SKINS=[['Bone','#f6e7d8'],['Gold','#f5c34d'],['Ember','#e67424'],['Ash','#b9a89c'],['Obsidian','#5a2414']];
const ET={
  crawler:{r:13,hp:20,spd:72,dmg:8,scrap:1,xp:1,col:'#c2361b'},
  dasher:{r:11,hp:14,spd:120,dmg:10,scrap:1,xp:1.5,col:'#ff7a45'},
  brute:{r:25,hp:95,spd:46,dmg:20,scrap:4,xp:4,col:'#8d1c06'},
  boss:{r:44,hp:1400,spd:42,dmg:30,scrap:90,xp:30,col:'#f5c34d'},
  collector:{r:30,hp:6000,spd:0,dmg:0,scrap:150,xp:40,col:'#170804'}
};
const RIVAL_DEF=[['Vex','#5ec4b6'],['Rook','#8fb3ff'],['Mara','#c59bff'],['Juno','#7be08f'],['Kiro','#ff9fd0']];
const FTUE=['Drag anywhere to move','Leave the hub · kill 3 monsters','Grab the scrap they drop','Bring it home · bank it in the HUB','Spend it · buy an upgrade'];

/* ================= SAVE ================= */
const SKEY='salvage-run-v02';
const NAMES=['Rust','Bolt','Nova','Cinder','Grit','Flux','Ash','Volt'];
function freshSave(){return{v:2,name:NAMES[Math.floor(Math.random()*NAMES.length)],char:'scrapper',bank:0,total:0,best:0,lv:{dmg:0,spd:0,hp:0,mag:0,bag:0},rank:0,gp:[0,0,0],ftue:0,skin:0,raiders:{},daily:null,
  stats:{kills:0,raiders:0,deaths:0,bosses:0,runs:0}}}
let save=freshSave();
try{const s=JSON.parse(localStorage.getItem(SKEY));
  if(s&&s.v===2){save=Object.assign(freshSave(),s);save.lv=Object.assign(freshSave().lv,s.lv);save.stats=Object.assign(freshSave().stats,s.stats)}
  else{const o=JSON.parse(localStorage.getItem('salvage-run-v01'));if(o&&o.lv){save.bank=o.bank|0;save.total=o.total|0;save.best=o.best|0;
    save.lv.dmg=o.lv.dmg|0;save.lv.spd=o.lv.spd|0;save.lv.hp=o.lv.hp|0;save.ftue=5}}}catch(e){}
let dirty=false,saveT=3;
const persist=()=>{dirty=false;try{localStorage.setItem(SKEY,JSON.stringify(save))}catch(e){}};
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function ensureDaily(){const d=today();if(save.daily&&save.daily.day===d)return;const streak=save.daily?save.daily.streak:0;
  const r=mulberry(hashStr('salvage'+d)),pool=DAILY.slice(),m=[];
  for(let i=0;i<3;i++){const j=Math.floor(r()*pool.length),[t,ns,l]=pool.splice(j,1)[0],n=ns[Math.floor(r()*ns.length)];m.push({t,n,p:0,done:false,label:l.replace('{n}',n),r:30+i*15})}
  save.daily={day:d,m,full:false,streak};persist()}
ensureDaily();
const cost=k=>Math.round(UPG[k].base*Math.pow(1.8,save.lv[k]));
const totalLv=()=>Object.values(save.lv).reduce((a,b)=>a+b,0);
const unlockIdx=u=>RANKS.findIndex(R=>R.u===u);
const perkUnlocked=k=>{const i=unlockIdx(k);return i<0||save.rank>i};
const skinUnlocked=i=>i===0||save.rank>unlockIdx('skin:'+i);


const CHARS={
  scrapper:{n:'Scrapper',ab:'DASH',d:'Dash rams through anything',cd:2.8,hp:0,spd:0,unlock:0},
  warden:{n:'Warden',ab:'DOME',d:'Dome blocks shots, burns monsters',cd:7,hp:40,spd:-.1,unlock:2},
  ghost:{n:'Ghost',ab:'CLOAK',d:'Vanish. Nobody can see you',cd:8,hp:-25,spd:.08,unlock:4}
};
const charUnlocked=k=>save.rank>=CHARS[k].unlock;

/* ================= AUDIO ================= */
let AC=null,muted=false,MG=null,noiseBuf=null;
function initAudio(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();AC.resume&&AC.resume();
  if(!MG){MG=AC.createGain();MG.gain.value=.55;MG.connect(AC.destination);noiseBuf=AC.createBuffer(1,AC.sampleRate*.3,AC.sampleRate);
    const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;MUS.next=AC.currentTime+.1}}catch(e){}}
function beep(f,d=.06,type='square',v=.035,slide=0){if(!AC||muted)return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+d);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+d+.02)}
const fanfareLocal=(base=520)=>{[0,4,7,12].forEach((s,i)=>setTimeout(()=>beep(base*Math.pow(2,s/12),.14,'triangle',.05),i*80))};
let srHapticsEnabled=true;const vibLocal=p=>{try{srHapticsEnabled&&navigator.vibrate&&navigator.vibrate(p)}catch(e){}}
/* procedural music: calm in the hub, layers stack with heat */
const MUS={next:0,step:0,bpm:104,int:0};
const BASS=[0,0,12,0,3,0,0,5,0,0,12,0,7,5,3,0];
function mNote(t,f,d,type,v,filt){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(v,t);
  g.gain.exponentialRampToValueAtTime(.0001,t+d);if(filt){const fl=AC.createBiquadFilter();fl.type='lowpass';fl.frequency.value=filt;o.connect(fl).connect(g)}else o.connect(g);
  g.connect(MG);o.start(t);o.stop(t+d+.02)}
function mNoise(t,d,v,freq,type){const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=noiseBuf;f.type=type;f.frequency.value=freq;
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f).connect(g).connect(MG);s.start(t);s.stop(t+d+.02)}
function musicTick(intensity,playing){if(!AC||!MG||muted||!playing){if(AC)MUS.next=AC.currentTime+.05;return}
  MUS.int+=(intensity-MUS.int)*.02;const h=MUS.int,spb=60/MUS.bpm/4;
  if(MUS.next<AC.currentTime-.3)MUS.next=AC.currentTime+.05;
  while(MUS.next<AC.currentTime+.12){const s=MUS.step%16,t=MUS.next,bar=Math.floor(MUS.step/16)%4,root=[55,55,49,41.2][bar];
    if(s%2===0)mNote(t,root*Math.pow(2,BASS[s]/12),.16,'sawtooth',.05+h*.03,380+h*900);
    if(h>.12&&s%4===0){const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);
      g.gain.setValueAtTime(.16*Math.min(1,h*2),t);g.gain.exponentialRampToValueAtTime(.0001,t+.16);o.connect(g).connect(MG);o.start(t);o.stop(t+.18)}
    if(h>.35&&s%2===1)mNoise(t,.03,.025,8000,'highpass');
    if(h>.55&&(s===4||s===12))mNoise(t,.12,.07,1800,'bandpass');
    if(h>.8&&s%4===2)mNote(t,root*4*Math.pow(2,[0,3,7,10][(MUS.step>>2)%4]/12),.09,'square',.018,2400);
    MUS.next+=spb;MUS.step++}}
