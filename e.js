function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function bar(x,y,w,h,v,col,bg='rgba(23,8,4,.75)'){ctx.fillStyle=bg;ctx.fillRect(x,y,w,h);ctx.fillStyle=col;ctx.fillRect(x,y,w*clamp(v,0,1),h)}
function txt(t,x,y,col,shadow='#170804'){ctx.fillStyle=shadow;ctx.fillText(t,x+1,y+1.5);ctx.fillStyle=col;ctx.fillText(t,x,y)}
function drawBody(o,col,ring){ctx.save();ctx.translate(o.x,o.y);
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(0,o.r*.7,o.r*1.05,o.r*.45,0,0,TAU);ctx.fill();
  ctx.fillStyle=o.flash>0?'#fff':col;ctx.strokeStyle='#170804';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,o.r,0,TAU);ctx.fill();ctx.stroke();
  ctx.rotate(o.face||0);ctx.fillStyle='#170804';rr(o.r*.15,-o.r*.38,o.r*.75,o.r*.76,4);ctx.fill();
  ctx.fillStyle=ring;ctx.fillRect(o.r*.55,-o.r*.18,o.r*.3,o.r*.36);ctx.restore()}
function drawEnemy(e){ctx.save();ctx.translate(e.x,e.y);const col=e.flash>0?'#fff':e.col;
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(0,e.r*.7,e.r,e.r*.4,0,0,TAU);ctx.fill();
  ctx.strokeStyle='#170804';ctx.lineWidth=3;ctx.fillStyle=col;
  if(e.type==='crawler'){ctx.strokeStyle=col;for(let i=0;i<6;i++){const a=i/6*TAU+Math.sin(time*12+i)*.25;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*(e.r+6),Math.sin(a)*(e.r+6));ctx.stroke()}
    ctx.strokeStyle='#170804';ctx.beginPath();ctx.arc(0,0,e.r,0,TAU);ctx.fill();ctx.stroke()}
  else if(e.type==='dasher'){ctx.rotate(Math.atan2(e.vy,e.vx));ctx.beginPath();ctx.moveTo(e.r+6,0);ctx.lineTo(-e.r,-e.r*.85);ctx.lineTo(-e.r*.45,0);ctx.lineTo(-e.r,e.r*.85);ctx.closePath();ctx.fill();ctx.stroke();
    if(e.dash>0){ctx.strokeStyle='rgba(255,122,69,.5)';ctx.beginPath();ctx.moveTo(-e.r-4,0);ctx.lineTo(-e.r-26,0);ctx.stroke()}}
  else if(e.type==='brute'){ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU+Math.PI/6;ctx.lineTo(Math.cos(a)*e.r,Math.sin(a)*e.r)}ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#f5c34d';ctx.fillRect(-8,-5,5,5);ctx.fillRect(3,-5,5,5)}
  else if(e.type==='collector'){ctx.fillStyle='rgba(246,231,216,.12)';ctx.beginPath();ctx.arc(0,0,e.r+14+Math.sin(time*6)*4,0,TAU);ctx.fill();
    ctx.fillStyle=e.flash>0?'#fff':'#170804';ctx.strokeStyle='#f6e7d8';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-e.r-10);ctx.quadraticCurveTo(e.r+8,-e.r,e.r,e.r);ctx.lineTo(-e.r,e.r);ctx.quadraticCurveTo(-e.r-8,-e.r,0,-e.r-10);ctx.fill();ctx.stroke();
    ctx.fillStyle='#ff5a3c';ctx.beginPath();ctx.arc(-8,-4,4,0,TAU);ctx.arc(8,-4,4,0,TAU);ctx.fill()}
  else{const pul=1+Math.sin(time*4)*.03;ctx.scale(pul,pul);ctx.shadowColor='rgba(245,195,77,.7)';ctx.shadowBlur=30;
    ctx.beginPath();for(let i=0;i<8;i++){const a=i/8*TAU+Math.PI/8,rad=i%2?e.r:e.r*.9;ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad)}ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.stroke();
    ctx.fillStyle='#8d1c06';ctx.beginPath();ctx.moveTo(-22,-e.r+4);ctx.lineTo(-14,-e.r-16);ctx.lineTo(-5,-e.r+2);ctx.lineTo(0,-e.r-20);ctx.lineTo(5,-e.r+2);ctx.lineTo(14,-e.r-16);ctx.lineTo(22,-e.r+4);ctx.closePath();ctx.fill();
    ctx.fillStyle='#170804';ctx.fillRect(-16,-8,10,8);ctx.fillRect(6,-8,10,8)}
  if((e.t===3||e.elite)&&e.type!=='boss'&&e.type!=='collector'){ctx.lineWidth=e.elite?4:2;ctx.strokeStyle=e.elite?'#f5c34d':'rgba(245,195,77,.55)';ctx.beginPath();ctx.arc(0,0,e.r+5,0,TAU);ctx.stroke()}
  ctx.restore();
  if(e.type==='boss'){bar(e.x-50,e.y-e.r-30,100,8,e.hp/e.max,'#f5c34d');if(e.slamT>0){ctx.fillStyle=`rgba(255,90,60,${.15+(.85-e.slamT)*.35})`;ctx.beginPath();ctx.arc(e.x,e.y,165,0,TAU);ctx.fill();
      ctx.strokeStyle='rgba(255,90,60,.8)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,165*(1-e.slamT/.85),0,TAU);ctx.stroke()}}
  else if(e.type==='collector'){ctx.font=F(800,15);ctx.textAlign='center';txt('THE COLLECTOR',e.x,e.y-e.r-22,'#f6e7d8');if(e.hp<e.max)bar(e.x-40,e.y-e.r-16,80,5,e.hp/e.max,'#f6e7d8')}
  else if(e.hp<e.max)bar(e.x-e.r,e.y-e.r-10,e.r*2,4,e.hp/e.max,'#ff7a45')}
function drawCrate(c){ctx.save();ctx.translate(c.x,c.y);ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(-c.r+3,-c.r+6,c.r*2,c.r*2);
  ctx.fillStyle=c.flash>0?'#fff':['','#6b3a1e','#7a4422','#8d4f24'][c.t];ctx.strokeStyle='#170804';ctx.lineWidth=3;ctx.fillRect(-c.r,-c.r,c.r*2,c.r*2);ctx.strokeRect(-c.r,-c.r,c.r*2,c.r*2);
  ctx.strokeStyle='rgba(237,155,73,.55)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-c.r+4,-c.r+4);ctx.lineTo(c.r-4,c.r-4);ctx.moveTo(c.r-4,-c.r+4);ctx.lineTo(-c.r+4,c.r-4);ctx.stroke();ctx.restore();
  if(c.hp<c.max)bar(c.x-c.r,c.y-c.r-9,c.r*2,4,c.hp/c.max,'#ed9b49')}
let fdt=1/60;
function views(){if(state==='menu')return[{x:0,y:0,w:W,h:H,p:null}];
  const lp=mode==='guest'?[meP()].filter(Boolean):players.filter(p=>!p.remote);
  if(!lp.length)return[{x:0,y:0,w:W,h:H,p:null}];if(lp.length===1)return[{x:0,y:0,w:W,h:H,p:lp[0]}];
  return W>=H?[{x:0,y:0,w:W/2,h:H,p:lp[0]},{x:W/2,y:0,w:W/2,h:H,p:lp[1]}]:[{x:0,y:0,w:W,h:H/2,p:lp[0]},{x:0,y:H/2,w:W,h:H/2,p:lp[1]}]}
let menuCam={x:HUB.x,y:HUB.y},menuT=0;
function draw(){ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#170804';ctx.fillRect(0,0,W,H);
  const vs=views();for(const v of vs)drawView(v);
  if(vs.length>1){ctx.fillStyle='#170804';if(W>=H)ctx.fillRect(W/2-3,0,6,H);else ctx.fillRect(0,H/2-3,W,6)}
  if(mode==='party'&&state!=='menu'){const s=Math.max(0,Math.ceil(matchT)),t=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;ctx.textAlign='center';ctx.font=F(800,24);
    const w=92;ctx.fillStyle='rgba(23,8,4,.8)';rr(W/2-w/2,8,w,36,12);ctx.fill();txt(t,W/2,34,s<=30?'#ff6a3d':'#f6e7d8')}}
function drawGroundX(){}
function drawWorldX(){}
function drawMiniX(){}
function zoneLabel(p){const tz=tierAt(p.x,p.y);return `ZONE ${tz} · ×${MULT[tz]} scrap`}
function mmRad(){return WORLD/2}
const MM={x:0,y:0,s:1,ms:100};const MX=x=>MM.x+MM.ms/2+(x-HUB.x)*MM.s,MY=y=>MM.y+MM.ms/2+(y-HUB.y)*MM.s;
function drawView(v){const p=v.p,Zv=clamp(Math.min(v.w,v.h)/700,.5,1.15);let cx,cy;
  if(!p){menuT+=fdt;cx=HUB.x+Math.cos(menuT*.1)*520;cy=HUB.y+Math.sin(menuT*.1)*520}
  else{if(p.cx==null||Math.hypot(p.cx-p.x,p.cy-p.y)>900){p.cx=p.x;p.cy=p.y}const k=Math.min(1,fdt*7);p.cx+=(p.x-p.cx)*k;p.cy+=(p.y-p.cy)*k;cx=p.cx;cy=p.cy}
  const sh=p?(shakes[p.id]||0):0,sx=(Math.random()-.5)*sh,sy=(Math.random()-.5)*sh;
  ctx.save();ctx.beginPath();ctx.rect(v.x,v.y,v.w,v.h);ctx.clip();
  ctx.translate(v.x+v.w/2+sx,v.y+v.h/2+sy);ctx.scale(Zv,Zv);ctx.translate(-cx,-cy);
  const vw=v.w/Zv/2+60,vh=v.h/Zv/2+60,L=cx-vw,R=cx+vw,T=cy-vh,B=cy+vh,vis=o=>o.x>L&&o.x<R&&o.y>T&&o.y<B;
  ctx.fillStyle='#2b0f08';ctx.fillRect(0,0,WORLD,WORLD);
  ctx.fillStyle='#33150b';ctx.beginPath();ctx.arc(HUB.x,HUB.y,Z3,0,TAU);ctx.fill();
  ctx.fillStyle='#3d1b0e';ctx.beginPath();ctx.arc(HUB.x,HUB.y,Z2,0,TAU);ctx.fill();drawGroundX(vis,L,R,T,B);
  for(const d of decor){if(!vis(d))continue;
    if(d.k<.55){ctx.fillStyle='rgba(15,4,2,.28)';ctx.beginPath();ctx.ellipse(d.x,d.y,d.r,d.r*.62,d.a,0,TAU);ctx.fill();
      ctx.fillStyle='rgba(237,155,73,.06)';ctx.beginPath();ctx.ellipse(d.x-d.r*.2,d.y-d.r*.2,d.r*.5,d.r*.3,d.a,0,TAU);ctx.fill()}
    else if(d.k<.85){ctx.fillStyle='rgba(237,155,73,.10)';ctx.fillRect(d.x,d.y,3,3);ctx.fillRect(d.x+9,d.y+5,2,2);ctx.fillRect(d.x-6,d.y+8,2,2)}
    else{ctx.strokeStyle='rgba(15,4,2,.35)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(d.x-d.r,d.y);ctx.lineTo(d.x+d.r,d.y+d.r*.3);ctx.stroke()}}
  ctx.setLineDash([18,14]);ctx.lineWidth=3;ctx.strokeStyle='rgba(237,155,73,.28)';for(const z of [Z2,Z3]){ctx.beginPath();ctx.arc(HUB.x,HUB.y,z,0,TAU);ctx.stroke()}
  ctx.setLineDash([]);ctx.font=F(800,22);ctx.textAlign='center';ctx.fillStyle='rgba(237,155,73,.38)';
  for(const[z,l]of[[Z2,'ZONE 2 · ×2 SCRAP'],[Z3,'ZONE 3 · ×3 SCRAP']]){ctx.fillText(l,HUB.x,HUB.y-z-14);ctx.fillText(l,HUB.x,HUB.y+z+32)}
  ctx.strokeStyle='#8d1c06';ctx.lineWidth=8;ctx.strokeRect(0,0,WORLD,WORLD);
  const g=ctx.createRadialGradient(HUB.x,HUB.y,10,HUB.x,HUB.y,HUB.r+80);g.addColorStop(0,'rgba(245,195,77,.30)');g.addColorStop(.7,'rgba(245,195,77,.08)');g.addColorStop(1,'rgba(245,195,77,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(HUB.x,HUB.y,HUB.r+80,0,TAU);ctx.fill();
  ctx.strokeStyle='#f5c34d';ctx.lineWidth=5;ctx.setLineDash([26,12]);ctx.lineDashOffset=-time*30;ctx.beginPath();ctx.arc(HUB.x,HUB.y,HUB.r,0,TAU);ctx.stroke();ctx.setLineDash([]);
  for(let i=0;i<8;i++){const a=i/8*TAU+time*.15;ctx.fillStyle='#f5c34d';ctx.beginPath();ctx.arc(HUB.x+Math.cos(a)*(HUB.r-26),HUB.y+Math.sin(a)*(HUB.r-26),5,0,TAU);ctx.fill()}
  drawWorldX(vis);ctx.fillStyle='rgba(245,195,77,.55)';ctx.font=F(800,44);ctx.fillText('HUB',HUB.x,HUB.y-8);ctx.font=F(600,16);ctx.fillText('SAFE · BANK · UPGRADE',HUB.x,HUB.y+18);
  if(beacon){const b=beacon,pu=.5+Math.sin(time*5)*.5;
    const bg=ctx.createLinearGradient(b.x,b.y-260,b.x,b.y);bg.addColorStop(0,'rgba(255,243,196,0)');bg.addColorStop(1,'rgba(255,243,196,.35)');ctx.fillStyle=bg;ctx.fillRect(b.x-18,b.y-260,36,260);
    ctx.fillStyle=`rgba(255,243,196,${.08+pu*.06})`;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,TAU);ctx.fill();
    ctx.strokeStyle='#fff3c4';ctx.lineWidth=3;ctx.setLineDash([10,8]);ctx.lineDashOffset=time*40;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,TAU);ctx.stroke();ctx.setLineDash([]);
    if(b.prog>0){ctx.strokeStyle='#f5c34d';ctx.lineWidth=9;ctx.beginPath();ctx.arc(b.x,b.y,b.r+8,-Math.PI/2,-Math.PI/2+TAU*b.prog/3.5);ctx.stroke()}
    ctx.font=F(800,16);txt(`EXTRACT +30% · ${Math.ceil(b.life)}s`,b.x,b.y-b.r-16,'#fff3c4')}
  for(const c of crates)if(c.dead<=0&&vis(c))drawCrate(c);
  for(const q of pickups){if(q.age>=999||!vis(q))continue;const bob=Math.sin(time*6+q.x)*2;ctx.save();ctx.translate(q.x,q.y+bob);
    if(q.k==='o'){ctx.shadowColor='#f5c34d';ctx.shadowBlur=22;ctx.fillStyle='#fff3c4';ctx.beginPath();ctx.arc(0,0,9+Math.sin(time*8)*1.5,0,TAU);ctx.fill();ctx.shadowBlur=0;
      ctx.strokeStyle='#f5c34d';ctx.lineWidth=3;ctx.rotate(time*2);ctx.strokeRect(-12,-12,24,24)}
    else{const s=4+Math.min(q.v,10)*.6;ctx.rotate(Math.PI/4);ctx.fillStyle='rgba(237,155,73,.25)';ctx.fillRect(-s*1.8,-s*1.8,s*3.6,s*3.6);
      ctx.fillStyle='#ed9b49';ctx.fillRect(-s,-s,s*2,s*2);ctx.fillStyle='#f5c34d';ctx.fillRect(-s,-s,s,s)}ctx.restore()}
  for(const e of enemies)if(vis(e))drawEnemy(e);
  let rich=null;for(const r of rivals)if(r.dead<=0&&(!rich||r.carry>rich.carry))rich=r;
  ctx.textAlign='center';
  for(const r of rivals){if(r.dead>0||!vis(r))continue;drawBody(r,r.col,'#f6e7d8');
    bar(r.x-20,r.y-r.r-12,40,5,r.hp/r.maxHp,r.col);ctx.font=F(800,15);txt(`${r.name}${r.lvl?' · '+r.lvl:''}`,r.x,r.y-r.r-18,r.col);
    const c=Math.floor(r.carry);if(c>0){ctx.font=F(800,15);txt(`◆ ${c}`,r.x,r.y+r.r+20,'#ed9b49')}
    if(p&&r.revengeOn===p.id){ctx.font=F(800,15);txt('REVENGE ×2',r.x,r.y-r.r-36,'#ff6a3d')}else if(r===rich&&c>=15){ctx.font=F(800,15);txt('BOUNTY',r.x,r.y-r.r-36,'#f5c34d')}
    if(r.chan>0){ctx.strokeStyle=r.col;ctx.lineWidth=5;ctx.beginPath();ctx.arc(r.x,r.y,r.r+8,-Math.PI/2,-Math.PI/2+TAU*r.chan/3);ctx.stroke()}}
  for(const q of players)drawPlayer(q,q===p,vis);
  ctx.lineCap='round';for(const b of bullets){if(!vis(b))continue;ctx.strokeStyle=b.col;ctx.lineWidth=b.w;ctx.beginPath();ctx.moveTo(b.x-b.vx*.025,b.y-b.vy*.025);ctx.lineTo(b.x,b.y);ctx.stroke()}
  for(const r of rings){ctx.globalAlpha=clamp(r.life/.3,0,1);ctx.strokeStyle=r.col;ctx.lineWidth=6;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,TAU);ctx.stroke()}ctx.globalAlpha=1;
  for(const q of parts){if(!vis(q))continue;ctx.globalAlpha=clamp(q.life/.4,0,1);ctx.fillStyle=q.col;ctx.fillRect(q.x-q.s/2,q.y-q.s/2,q.s,q.s)}ctx.globalAlpha=1;
  ctx.textAlign='center';for(const t of texts){if(!vis(t))continue;ctx.globalAlpha=clamp(t.life/.5,0,1);ctx.font=F(800,t.size);txt(t.txt,t.x,t.y,t.col)}ctx.globalAlpha=1;
  ctx.restore();
  if(p){ctx.save();ctx.beginPath();ctx.rect(v.x,v.y,v.w,v.h);ctx.clip();ctx.translate(v.x,v.y);drawHud(p,v.w,v.h,Zv,v);ctx.restore()}}
function drawPlayer(q,me,vis){if(!vis(q))return;
  if(q.dead>0){if(me&&q.deathInfo){const d=q.deathInfo;ctx.strokeStyle='#ff6a3d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(d.x-10,d.y-10);ctx.lineTo(d.x+10,d.y+10);ctx.moveTo(d.x+10,d.y-10);ctx.lineTo(d.x-10,d.y+10);ctx.stroke()}return}
  const cl=q.char==='ghost'&&q.abT>0;
  if(q.glow){const pu=.5+Math.sin(time*7)*.5;ctx.strokeStyle=`rgba(255,106,61,${.3+pu*.4})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(q.x,q.y,q.r+10+pu*6,0,TAU);ctx.stroke()}
  const sn=q.sawN!=null?q.sawN:(q.run.perks.saw||0);
  for(const[sx2,sy2]of sawPos(q,sn)){ctx.save();ctx.translate(sx2,sy2);ctx.rotate(time*14);ctx.fillStyle='#f6e7d8';ctx.strokeStyle='#170804';ctx.lineWidth=2;
    ctx.beginPath();for(let i=0;i<12;i++){const a=i/12*TAU,rad=i%2?11:7;ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad)}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
  if(q.char==='warden'&&q.abT>0){ctx.fillStyle='rgba(143,214,255,.14)';ctx.strokeStyle='rgba(143,214,255,.85)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(q.x,q.y,78,0,TAU);ctx.fill();ctx.stroke()}
  ctx.globalAlpha=cl?(me?.35:.08):1;
  if(!(q.inv>.35&&Math.floor(time*12)%2))drawBody(q,q.col,q.skin===1?'#8d1c06':'#f5c34d');
  ctx.globalAlpha=1;if(cl&&!me)return;
  if(q.picking){ctx.strokeStyle='rgba(245,195,77,.9)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(q.x,q.y,q.r+14,0,TAU);ctx.stroke();ctx.font=F(800,14);txt('CHOOSING',q.x,q.y+q.r+30,'#f5c34d')}
  ctx.textAlign='center';
  if(!me||players.length>1){ctx.font=F(800,15);txt(q.name,q.x,q.y-q.r-(q.carry>0?34:14),q.col)}
  if(q.carry>0){ctx.font=F(800,18);txt(`◆ ${q.carry}`,q.x,q.y-q.r-12,q.carry>=q.cap?'#ff6a3d':'#ed9b49')}
  if(!me&&q.hp<q.maxHp)bar(q.x-20,q.y+q.r+8,40,5,q.hp/q.maxHp,q.col)}
function edgeArrow(p,W2,H2,Zv,tx,ty,col,label,alpha){const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy);if(d*Zv<Math.min(W2,H2)*.42)return;
  const a=Math.atan2(dy,dx),ex=W2/2-24,ey=H2/2-24,k=Math.min(Math.abs(ex/Math.cos(a)||1e9),Math.abs(ey/Math.sin(a)||1e9))*.86,ax=W2/2+Math.cos(a)*k,ay=H2/2+Math.sin(a)*k;
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(ax,ay);ctx.rotate(a);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-8,-11);ctx.lineTo(-3,0);ctx.lineTo(-8,11);ctx.closePath();ctx.fill();ctx.restore();
  ctx.globalAlpha=alpha;ctx.font=F(800,14);ctx.textAlign='center';txt(`${label} ${Math.round(d/10)}m`,ax,ay+(Math.sin(a)>0?-20:30),col);ctx.globalAlpha=1}
function drawHud(p,W2,H2,Zv,v){const ih=inHub(p),split=views().length>1;
  if(p.hurt>0){const g=ctx.createRadialGradient(W2/2,H2/2,Math.min(W2,H2)*.3,W2/2,H2/2,Math.max(W2,H2)*.7);g.addColorStop(0,'rgba(141,28,6,0)');g.addColorStop(1,`rgba(141,28,6,${p.hurt*1.4})`);ctx.fillStyle=g;ctx.fillRect(0,0,W2,H2)}
  if(p.dead<=0&&p.hp<p.maxHp*.3&&!ih){const g=ctx.createRadialGradient(W2/2,H2/2,Math.min(W2,H2)*.35,W2/2,H2/2,Math.max(W2,H2)*.75);g.addColorStop(0,'rgba(141,28,6,0)');
    g.addColorStop(1,`rgba(141,28,6,${.25+Math.sin(time*8)*.1})`);ctx.fillStyle=g;ctx.fillRect(0,0,W2,H2)}
  ctx.textAlign='left';const x=split?10:14,y=split?(mode==='party'&&v.y===0&&W<H?10:10):14;ctx.fillStyle='rgba(23,8,4,.88)';rr(x,y,200,156,14);ctx.fill();
  ctx.font=F(600,14);ctx.fillStyle='rgba(246,231,216,.7)';ctx.fillText('HULL',x+14,y+24);bar(x+64,y+14,122,12,p.hp/p.maxHp,p.hp<p.maxHp*.3?'#ff5a3c':'#e67424','#3c0d03');
  ctx.fillStyle='rgba(246,231,216,.7)';ctx.fillText('LV '+p.run.lvl,x+14,y+46);bar(x+64,y+38,122,8,p.run.xp/p.run.next,p.col,'#3c0d03');
  const full=p.carry>=p.cap;ctx.font=F(800,28);ctx.fillStyle=full?'#ff6a3d':'#ed9b49';ctx.fillText(`◆ ${p.carry}`,x+14,y+82);
  const cw=ctx.measureText(`◆ ${p.carry}`).width;ctx.font=F(600,14);ctx.fillStyle='rgba(237,155,73,.8)';ctx.fillText(`/${p.cap}`,x+18+cw,y+82);ctx.fillText(full?'FULL':'AT RISK',x+136,y+82);
  const safe=mode==='party'?p.score:save.bank;ctx.font=F(800,20);ctx.fillStyle='#f5c34d';ctx.fillText(`◆ ${safe}`,x+14,y+112);ctx.font=F(600,14);ctx.fillStyle='rgba(245,195,77,.8)';ctx.fillText(mode==='party'?'BANKED':'SAFE',x+136,y+110);
  const tr=ih?'HUB · safe':zoneLabel(p);ctx.fillStyle=p.glow?'#ff6a3d':'rgba(246,231,216,.75)';ctx.fillText(p.glow?'GLOWING · raiders hunt you':tr,x+14,y+136);
  if(!ih){const h=heat(p);bar(x+14,y+145,172,5,h,h>=1?'#ff5a3c':'#e67424','#3c0d03');ctx.textAlign='right';ctx.fillStyle='rgba(246,231,216,.55)';ctx.fillText('HEAT',x+186,y+136);ctx.textAlign='left'}
  // minimap
  const ms=Math.round(clamp(W2*.28,90,150)),mx=W2-ms-14,my=split?(mode==='party'&&W>=H?52:14):14,sc=ms/(2*mmRad());MM.x=mx;MM.y=my;MM.s=sc;MM.ms=ms;
  ctx.fillStyle='rgba(23,8,4,.7)';rr(mx-4,my-4,ms+8,ms+8,12);ctx.fill();ctx.save();ctx.beginPath();ctx.rect(mx,my,ms,ms);ctx.clip();
  ctx.fillStyle='#2b0f08';ctx.fillRect(mx,my,ms,ms);drawMiniX(mx,my,ms,sc);ctx.fillStyle='#33150b';ctx.beginPath();ctx.arc(MX(HUB.x),MY(HUB.y),Z3*sc,0,TAU);ctx.fill();
  ctx.fillStyle='#3d1b0e';ctx.beginPath();ctx.arc(MX(HUB.x),MY(HUB.y),Z2*sc,0,TAU);ctx.fill();
  ctx.fillStyle='#f5c34d';ctx.beginPath();ctx.arc(MX(HUB.x),MY(HUB.y),Math.max(4,HUB.r*sc),0,TAU);ctx.fill();
  if(beacon){ctx.fillStyle='#fff3c4';ctx.globalAlpha=.6+Math.sin(time*6)*.4;ctx.beginPath();ctx.arc(MX(beacon.x),MY(beacon.y),5,0,TAU);ctx.fill();ctx.globalAlpha=1}
  const boss=bossPos();if(boss){ctx.strokeStyle='#f5c34d';ctx.lineWidth=2;ctx.beginPath();ctx.arc(MX(boss.x),MY(boss.y),6,0,TAU);ctx.stroke()}
  for(const r of rivals){if(r.dead>0)continue;ctx.fillStyle=r.col;ctx.beginPath();ctx.arc(MX(r.x),MY(r.y),r.carry>=15?4.5:3,0,TAU);ctx.fill()}
  for(const q of players){if(q.dead>0||q===p||(q.char==='ghost'&&q.abT>0))continue;ctx.fillStyle=q.col;ctx.fillRect(MX(q.x)-3.5,MY(q.y)-3.5,7,7)}
  if(p.dead<=0){ctx.strokeStyle='rgba(246,231,216,.4)';ctx.lineWidth=1;ctx.strokeRect(MX(p.x-W2/Zv/2),MY(p.y-H2/Zv/2),W2/Zv*sc,H2/Zv*sc);
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(MX(p.x),MY(p.y),3.5,0,TAU);ctx.fill()}
  ctx.restore();
  const lb=[...rivals.map(r=>({n:r.name,v:r.bank,c:r.col}))];
  if(mode==='solo')lb.push({n:'YOU',v:save.total,c:'#f6e7d8',me:true});else for(const q of players)lb.push({n:q.name,v:q.score,c:q.col,me:q===p,hum:true});
  if(mode!=='solo'){lb.sort((a,b)=>(b.hum-a.hum)||(b.v-a.v))}else lb.sort((a,b)=>b.v-a.v);
  ctx.font=F(600,14);let ly=my+ms+26;const lbN=split?4:(W2<H2?5:Math.max(0,Math.min(6,Math.floor((H2-ly-130)/19))));(mode==='solo'?lb.filter((e,i)=>i<lbN-1||e.me).slice(0,lbN):lb.slice(0,lbN)).forEach((e,i)=>{ctx.globalAlpha=e.me?1:.8;ctx.fillStyle=e.c;ctx.textAlign='left';ctx.fillText(`${i+1} ${e.n}`,mx,ly);ctx.textAlign='right';ctx.fillText(e.v,mx+ms,ly);ly+=19});ctx.globalAlpha=1;
  ctx.textAlign='center';let fy=split?H2*.22:(W2<H2?246:Math.max(86,H2*.2));
  if(mode==='solo'&&save.ftue<5&&p.dead<=0){ctx.font=F(800,17);const t=FTUE[save.ftue],w=ctx.measureText(t).width+32;ctx.fillStyle='#f5c34d';rr(W2/2-w/2,fy-24,w,36,12);ctx.fill();
    ctx.fillStyle='#3c0d03';ctx.fillText(t,W2/2,fy);fy+=38}
  feed.filter(f=>f.pid<0||f.pid===p.id).slice(0,4).forEach((f,i)=>{ctx.globalAlpha=clamp(f.t,0,1);ctx.font=F(600,15);const yy=fy+i*26,w=ctx.measureText(f.txt).width+24;ctx.fillStyle='rgba(23,8,4,.62)';rr(W2/2-w/2,yy-17,w,25,10);ctx.fill();
    ctx.fillStyle=f.col;ctx.fillText(f.txt,W2/2,yy)});ctx.globalAlpha=1;
  if(p.dead<=0){edgeArrow(p,W2,H2,Zv,HUB.x,HUB.y,'#f5c34d','HUB',p.carry>0?.95:.4);if(beacon)edgeArrow(p,W2,H2,Zv,beacon.x,beacon.y,'#fff3c4','BEACON',.9);if(boss)edgeArrow(p,W2,H2,Zv,boss.x,boss.y,'#f5c34d','♛',.8)}
  const bn=banners[p.id]||banners[-1];if(bn){ctx.globalAlpha=clamp(bn.t,0,1);ctx.textAlign='center';ctx.font=F(800,Math.min(46,W2*.085));txt(bn.title,W2/2,H2*.4,'#f5c34d','#8d1c06');
    ctx.font=F(600,17);txt(bn.sub,W2/2,H2*.4+32,'#f6e7d8');ctx.globalAlpha=1}
  const j=p.joy;if(j&&j.on){ctx.fillStyle='rgba(23,8,4,.28)';ctx.strokeStyle='rgba(246,231,216,.35)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(j.bx-v.x,j.by-v.y,58,0,TAU);ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(246,231,216,.85)';ctx.beginPath();ctx.arc(j.kx-v.x,j.ky-v.y,24,0,TAU);ctx.fill()}
  else if(mode==='solo'&&save.ftue===0&&p.dead<=0){const hx=W2/2,hy=H2*.72;ctx.globalAlpha=.4+Math.sin(time*3)*.15;ctx.strokeStyle='#f6e7d8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(hx,hy,58,0,TAU);ctx.stroke();
    ctx.fillStyle='#f6e7d8';ctx.beginPath();ctx.arc(hx+Math.cos(time*2)*30,hy+Math.sin(time*2)*30,22,0,TAU);ctx.fill();ctx.globalAlpha=1}
  if(p.dead>0&&p.deathInfo){ctx.fillStyle='rgba(23,8,4,.62)';ctx.fillRect(0,0,W2,H2);ctx.textAlign='center';ctx.font=F(800,Math.min(96,W2*.18));txt('WRECKED',W2/2,H2*.4,'#ff6a3d','#3c0d03');
    ctx.font=F(600,Math.min(17,W2/26));const d=p.deathInfo;
    txt(d.lost>0?`${d.who} got you ${d.dist}m from the hub holding ${d.lost} scrap.`:`${d.who} got you. Nothing lost.`,W2/2,H2*.4+40,'#f6e7d8');
    if(d.perks>0)txt(`Your level ${d.lvl} build (${d.perks} perks) died with you.`,W2/2,H2*.4+66,'rgba(246,231,216,.75)');
    const R=RANKS[save.rank];if(R&&mode!=='party'){let bi=-1,bp=-1;R.g.forEach((g,i)=>{const pr=save.gp[i]/g[1];if(pr<1&&pr>bp){bp=pr;bi=i}});
      if(bi>=0){const g=R.g[bi];txt(`So close: ${g[2]} · ${Math.floor(save.gp[bi])}/${g[1]}`,W2/2,H2*.4+100,'#f5c34d')}}
    if(d.lost>0)txt('Your scrap is still on the floor. Go get it back.',W2/2,H2*.4+126,'#ed9b49');
    txt(`back in ${Math.ceil(p.dead)}`,W2/2,H2*.4+160,'rgba(246,231,216,.55)')}}
function bossPos(){if(mode==='guest')return G.boss;return enemies.find(e=>e.type==='boss')}
