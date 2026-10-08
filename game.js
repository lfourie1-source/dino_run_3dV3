
(function(){
'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const scoreEl=document.getElementById('score'),highEl=document.getElementById('high'),dimEl=document.getElementById('dim');
const start=document.getElementById('start'),over=document.getElementById('over'),shift=document.getElementById('shift');
const music=document.getElementById('music'),death=document.getElementById('death'),jumpSfx=document.getElementById('jumpSfx'),victorySfx=document.getElementById('victorySfx');
let W=innerWidth,H=innerHeight,DPR=Math.min(devicePixelRatio||1,1.5);
function resize(){W=innerWidth;H=innerHeight;DPR=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.floor(W*DPR));canvas.height=Math.max(1,Math.floor(H*DPR));canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0)}
resize();addEventListener('resize',resize);
const THEMES=[
 {sky:'#ffffff',ground:'#e6e6e6',line:'#777777',wall:'#111111',obs:'#111111',rock:'#555555',hud:'#111111'},
 {sky:'#67c9ff',ground:'#d8a256',line:'#fff0aa',wall:'#9b673d',obs:'#2f9149',rock:'#77563f',hud:'#102030'},
 {sky:'#050505',ground:'#151515',line:'#ffffff',wall:'#ffffff',obs:'#ffffff',rock:'#aaaaaa',hud:'#ffffff'}
];
let theme=THEMES[0];
const player={x:0,y:0,z:5,vy:0};
let alive=false,started=false,score=0,high=0,speed=23,phase=0,dimension=1,nextDimension=500,last=performance.now();
let obstacles=[],generatedTo=18,rowCounter=0;const keys={};
try{high=Number(localStorage.getItem('blockyDinoHigh')||0)||0}catch(e){} highEl.textContent=high;
function saveHigh(){try{localStorage.setItem('blockyDinoHigh',String(high))}catch(e){}}
function setTheme(){theme=dimension===1?THEMES[0]:dimension===2?THEMES[1]:THEMES[2];document.body.style.background=theme.sky;document.getElementById('hud').style.color=theme.hud;document.getElementById('hud').style.textShadow=dimension===3?'1px 1px #000':'1px 1px #fff'}
function addObstacle(type,x,z){obstacles.push({type,x,z,active:true,spin:Math.random()*Math.PI*2})}
function addLineCactus(z){const side=Math.random()<.5?-2:2;addObstacle('smallcactus',side,z)}
function hurdle(z){addObstacle('hurdle',0,z)}
function difficultyForZ(z){
 const projected=score+Math.max(0,z-player.z)*0.48;
 if(projected<180)return 0;
 if(projected<420)return 1;
 if(projected<800)return 2;
 return 3;
}
function addCoin(z){
 const spots=[-3.7,-2,0,2,3.7];
 addObstacle('coin',spots[Math.floor(Math.random()*spots.length)],z);
}
function spawnDesignedRow(z){
 rowCounter++;
 const diff=difficultyForZ(z);
 const lanes=[-3.7,0,3.7];
 const open=rowCounter%3;
 const hurdleEvery=diff===0?5:diff===1?4:3;
 if(rowCounter%hurdleEvery===0){
   hurdle(z);
 }else if(diff===0){
   // Early game: one clear obstacle at a time with lots of reaction space.
   addObstacle(rowCounter%2?'rock':'cactus',lanes[rowCounter%3],z);
 }else if(diff===1){
   addObstacle('rock',lanes[open],z);
   if(rowCounter%2===0)addObstacle('cactus',lanes[(open+1)%3],z+7);
 }else if(diff===2){
   addObstacle('cactus',lanes[(open+1)%3],z);
   addObstacle('rock',lanes[(open+2)%3],z);
   if(rowCounter%2)addObstacle('smallcactus',[-2,2][rowCounter%2],z+6);
 }else{
   addObstacle('rock',lanes[open],z);
   addObstacle('cactus',lanes[(open+1)%3],z+5.2);
   addObstacle('rock',lanes[(open+2)%3],z+10.4);
   if(Math.random()<0.55)addLineCactus(z+3+Math.random()*4);
 }
 // Coins are optional risk/reward pickups and do not replace obstacles.
 if(Math.random()<(diff===0?0.48:0.34)) addCoin(z+(diff===0?5:3.5));
}
function generateAhead(toZ){
 while(generatedTo<toZ){
   const diff=difficultyForZ(generatedTo);
   const minGap=diff===0?17:diff===1?14:diff===2?11:8.5;
   const extra=diff===0?7:diff===1?5:diff===2?4:3;
   generatedTo+=minGap+Math.random()*extra;
   spawnDesignedRow(generatedTo);
 }
}
function resetWorld(){
 player.x=0;player.y=0;player.z=5;player.vy=0;score=0;speed=18;phase=0;dimension=1;nextDimension=500;
 obstacles=[];generatedTo=18;rowCounter=0;
 addCoin(35);addObstacle('rock',3.7,58);hurdle(92);generatedTo=92;generateAhead(680);
 dimEl.textContent='1';scoreEl.textContent='0';setTheme();
}
function playMusic(){music.volume=.55;const p=music.play();if(p&&p.catch)p.catch(()=>{})}
function startGame(){resetWorld();started=true;alive=true;start.style.display='none';over.style.display='none';death.pause();death.currentTime=0;jumpSfx.pause();jumpSfx.currentTime=0;victorySfx.pause();victorySfx.currentTime=0;playMusic();last=performance.now()}
function gameOver(){if(!alive)return;alive=false;music.pause();music.currentTime=0;jumpSfx.pause();jumpSfx.currentTime=0;victorySfx.pause();victorySfx.currentTime=0;high=Math.max(high,Math.floor(score));highEl.textContent=high;saveHigh();document.getElementById('finalScore').textContent=Math.floor(score);document.getElementById('finalHigh').textContent=high;over.style.display='flex';death.pause();death.currentTime=0;death.volume=1.0;const p=death.play();if(p&&p.catch)p.catch(()=>{})}
function jump(){if(alive&&player.y<=.001){player.vy=11.7;jumpSfx.pause();jumpSfx.currentTime=0;jumpSfx.volume=.95;const p=jumpSfx.play();if(p&&p.catch)p.catch(()=>{})}}
function shiftDimension(){dimension++;nextDimension+=500;dimEl.textContent=dimension;setTheme();victorySfx.pause();victorySfx.currentTime=0;victorySfx.volume=1.0;const vp=victorySfx.play();if(vp&&vp.catch)vp.catch(()=>{});shift.textContent=dimension===2?'DIMENSION 2 — COLOR WORLD':'DIMENSION '+dimension+' — VOID';shift.classList.add('show');setTimeout(()=>shift.classList.remove('show'),1100)}
document.getElementById('play').addEventListener('click',startGame);document.getElementById('restart').addEventListener('click',startGame);
addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys[e.code]=true;if((e.code==='Space'||e.code==='ArrowUp')&&!e.repeat)jump();if(e.code==='KeyR'&&!alive&&started)startGame()},{passive:false});
addEventListener('keyup',e=>{keys[e.code]=false});
const CAM_Y=5.2,HORIZON=.53,DINO_GROUND=.78,DINO_H=1.6;
const HIT_W=.22,HIT_D=.12,HIT_H=1.35,FOOT_FORGIVE=.15; // dino hitbox is slightly SMALLER than the drawn dino
function focal(){return Math.min(W,H)*1.08}
function camDist(){return CAM_Y*focal()/(H*(DINO_GROUND-HORIZON))} // depth at which the track meets the dino's feet
function camZ(){return player.z-camDist()}
function project(x,y,z){const camX=player.x*.28,dz=z-camZ();if(dz<=.2)return null;const f=focal(),scale=f/dz;return{x:W/2+(x-camX)*scale,y:H*HORIZON-(y-CAM_Y)*scale,s:scale,dz}}
function poly(points,fill,stroke){if(points.some(p=>!p))return;ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}}
function shade(hex,amt){const n=parseInt(hex.slice(1),16),r=Math.max(0,Math.min(255,(n>>16)+amt)),g=Math.max(0,Math.min(255,((n>>8)&255)+amt)),b=Math.max(0,Math.min(255,(n&255)+amt));return'#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}
function box(cx,cy,cz,w,h,d,color){const x0=cx-w/2,x1=cx+w/2,y0=cy,y1=cy+h,z0=cz-d/2,z1=cz+d/2;const p000=project(x0,y0,z0),p100=project(x1,y0,z0),p110=project(x1,y1,z0),p010=project(x0,y1,z0),p001=project(x0,y0,z1),p101=project(x1,y0,z1),p111=project(x1,y1,z1),p011=project(x0,y1,z1);if(!p000||!p101)return;poly([p010,p110,p111,p011],shade(color,28));poly([p100,p101,p111,p110],shade(color,-18));poly([p000,p100,p110,p010],color,'rgba(0,0,0,.25)')}
const SHAPES={
 rock:[[0,0,2,1.45,1.8]],
 hurdle:[[0,0,10,1.15,.95]],
 cactus:[[-.1,0,.75,3,.75],[.35,1.45,1.45,.55,.58],[.83,1.45,.48,1.25,.48]],
 smallcactus:[[0,0,.36,1.15,.36],[-.24,.42,.34,.28,.32],[-.38,.56,.18,.58,.24],[.24,.62,.34,.28,.32],[.38,.76,.18,.58,.24]]
};
function drawGround(){ctx.fillStyle=theme.sky;ctx.fillRect(0,0,W,H);const cz=camZ(),nearZ=cz+.5,farZ=player.z+125;const a=project(-6,0,nearZ),b=project(6,0,nearZ),c=project(6,0,farZ),d=project(-6,0,farZ);poly([a,b,c,d],theme.ground);for(let z=Math.floor(cz/8)*8;z<player.z+125;z+=8){for(const x of[-2,2]){const p1=project(x-.08,.01,z),p2=project(x+.08,.01,z),p3=project(x+.08,.01,z+3.2),p4=project(x-.08,.01,z+3.2);poly([p1,p2,p3,p4],theme.line)}}for(let z=Math.floor(cz/12)*12;z<player.z+125;z+=12){box(-6.2,0,z+5.5,.5,2.4,11,theme.wall);box(6.2,0,z+5.5,.5,2.4,11,theme.wall)}}
function drawObstacle(o){if(o.z<camZ()+1||o.z>player.z+130)return;if(o.type==='coin'){const p=project(o.x,1.05+Math.sin(phase*2+o.spin)*.12,o.z);if(!p)return;const r=Math.max(3,Math.min(18,p.s*.34));ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.sin(phase*2.5+o.spin)*.55);ctx.fillStyle='#ffd21f';ctx.strokeStyle='#8b6500';ctx.lineWidth=Math.max(1,r*.12);ctx.beginPath();ctx.ellipse(0,0,r*.62,r,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#fff3a0';ctx.fillRect(-r*.12,-r*.58,r*.18,r*1.05);ctx.restore()}else{const col=o.type==='rock'?theme.rock:o.type==='smallcactus'?(dimension===2?'#2f9149':dimension>=3?'#ffffff':'#111111'):theme.obs;for(const[dx,y0,w,h,d]of SHAPES[o.type])box(o.x+dx,y0,o.z,w,h,d,col);if(o.type==='hurdle'){box(-4.55,0,o.z,.35,2,.35,theme.wall);box(4.55,0,o.z,.35,2,.35,theme.wall)}}}
function drawDino(){const f=project(player.x,player.y,player.z),g=project(player.x,0,player.z);if(!f)return;const k=DINO_H*f.s/67;ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(g.x-18*k,g.y-2*k,36*k,5*k);ctx.save();ctx.translate(f.x,f.y);ctx.scale(k,k);ctx.translate(0,-33);const bob=alive&&player.y<.02?Math.abs(Math.sin(phase*2))*2:0;ctx.translate(0,-bob);ctx.fillStyle=dimension===2?'#2f8d43':'#222';ctx.fillRect(-12,-11,24,28);ctx.fillStyle=dimension===2?'#43ad59':'#333';ctx.fillRect(-11,-28,22,18);ctx.fillRect(-9,-34,18,9);ctx.fillStyle='#fff';ctx.fillRect(-7,-26,4,4);ctx.fillRect(3,-26,4,4);ctx.fillStyle='#000';ctx.fillRect(-6,-25,2,2);ctx.fillRect(4,-25,2,2);const leg=Math.sin(phase)*7;ctx.fillStyle=dimension===2?'#2f8d43':'#222';ctx.fillRect(-10,14+Math.max(0,leg),7,17);ctx.fillRect(3,14+Math.max(0,-leg),7,17);ctx.fillStyle='#111';ctx.fillRect(-11,28+Math.max(0,leg),9,5);ctx.fillRect(2,28+Math.max(0,-leg),9,5);ctx.fillStyle=dimension===2?'#2f8d43':'#222';ctx.fillRect(-4,1,8,8);ctx.restore()}
function crossedZ(o,startZ,endZ,halfDepth){return endZ>=o.z-halfDepth-HIT_D&&startZ<=o.z+halfDepth+HIT_D}
function collision(o,startZ,endZ){
  if(o.type==='coin')return false;
  return SHAPES[o.type].some(([dx,y0,w,h,d])=>crossedZ(o,startZ,endZ,d/2)&&Math.abs(o.x+dx-player.x)<w/2+HIT_W&&player.y+FOOT_FORGIVE<y0+h&&player.y+HIT_H>y0);
}
function collectCoin(o,startZ,endZ){
  return o.type==='coin'&&o.active&&crossedZ(o,startZ,endZ,.18)&&Math.abs(o.x-player.x)<.72&&player.y<2.1;
}
function update(dt){let t=dt;while(t>1e-6&&alive){const h=Math.min(t,1/120);step(h);t-=h}}
function step(dt){
 if(!alive)return;
 score+=dt*11;
 high=Math.max(high,Math.floor(score));highEl.textContent=high;
 // Gentle opening, then progressively steeper speed ramp.
 if(score<180)speed=18+score*.018;
 else if(score<500)speed=21.2+(score-180)*.028;
 else speed=Math.min(54,30.2+(score-500)*.021+dimension*1.1);
 const startZ=player.z;
 player.z+=speed*dt;
 const endZ=player.z;
 if(keys.KeyA||keys.ArrowLeft)player.x-=8.5*dt;
 if(keys.KeyD||keys.ArrowRight)player.x+=8.5*dt;
 player.x=Math.max(-4.25,Math.min(4.25,player.x));
 player.vy-=34*dt;player.y+=player.vy*dt;if(player.y<0){player.y=0;player.vy=0}
 phase+=dt*speed*.85;
 for(const o of obstacles){
   if(collectCoin(o,startZ,endZ)){o.active=false;score+=10;high=Math.max(high,Math.floor(score));highEl.textContent=high;continue}
   if(o.active&&collision(o,startZ,endZ)){o.active=false;gameOver();break}
 }
 if(!alive){scoreEl.textContent=Math.floor(score);return}
 while(score>=nextDimension)shiftDimension();
 generateAhead(player.z+680);
 obstacles=obstacles.filter(o=>o.active&&o.z>player.z-35);
 scoreEl.textContent=Math.floor(score);
}
function draw(){drawGround();const vis=obstacles.filter(o=>o.z>camZ()&&o.z<player.z+130).sort((a,b)=>b.z-a.z);let d=false;for(const o of vis){if(!d&&o.z<=player.z){drawDino();d=true}drawObstacle(o)}if(!d)drawDino()}
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.033,(now-last)/1000||0);last=now;update(dt);draw()}
resetWorld();draw();requestAnimationFrame(loop);
})();
