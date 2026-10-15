export function createRenderer(canvas,skin){
 const c=canvas.getContext('2d');let width=0,height=0,scale=1,ox=0,oy=0;const particles=[];
 function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);c.setTransform(dpr,0,0,dpr,0,0);scale=Math.min(width,height)/1000;ox=(width-1000*scale)/2;oy=(height-1000*scale)/2;}
 function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left-ox)/scale,y:(e.clientY-r.top-oy)/scale};}
 function ball(x,y,r,color){c.fillStyle=skin.colors[color];c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.strokeStyle='#00000035';c.lineWidth=3;c.stroke();c.fillStyle='#ffffff60';c.beginPath();c.arc(x-r*.27,y-r*.32,r*.24,0,Math.PI*2);c.fill();c.fillStyle='#10212b';c.font=`bold ${r*.95}px system-ui`;c.textAlign='center';c.textBaseline='middle';c.fillText(skin.symbols[color],x,y+1);}
 function burst(event){for(const p of event.positions)for(let i=0;i<7;i++){const a=Math.random()*Math.PI*2,v=35+Math.random()*130;particles.push({...p,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.6,color:event.color});}}
 function draw(g,dt){
 c.clearRect(0,0,width,height);c.save();c.translate(ox,oy);c.scale(scale,scale);
 const grad=c.createRadialGradient(500,500,20,500,500,480);grad.addColorStop(0,'#20333b');grad.addColorStop(1,skin.background);c.fillStyle=grad;c.fillRect(0,0,1000,1000);
 // This perimeter is the explicit boundary between aim and fire gestures.
 c.beginPath();c.arc(500,500,430,0,Math.PI*2);c.strokeStyle=skin.accent+'55';c.lineWidth=2;c.setLineDash([4,10]);c.stroke();c.setLineDash([]);
 c.fillStyle='#80939b';c.font='11px system-ui';c.textAlign='center';c.fillText('OUTER RING / AIM',500,49);
 c.lineCap='round';c.lineJoin='round';c.beginPath();g.path.points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle=skin.trackEdge;c.lineWidth=g.level.ballRadius*2+10;c.stroke();c.strokeStyle=skin.track;c.lineWidth=g.level.ballRadius*2+4;c.stroke();
 const end=g.path.at(g.path.length);c.beginPath();c.arc(end.x,end.y,25,0,Math.PI*2);c.fillStyle='#0a1118';c.fill();c.strokeStyle='#f58663';c.lineWidth=3;c.stroke();
 for(const b of g.balls){const p=g.path.at(b.s);ball(p.x,p.y,g.level.ballRadius,b.color);}
 for(const s of g.shots)ball(s.x,s.y,g.level.ballRadius,s.color);
 c.save();c.translate(500,500);c.rotate(g.angle);c.shadowColor=skin.accent;c.shadowBlur=18;c.fillStyle=skin.turret;c.beginPath();c.roundRect(-8,-15,70,30,12);c.fill();c.shadowBlur=0;c.restore();
 c.beginPath();c.arc(500,500,37,0,Math.PI*2);c.fillStyle='#334952';c.fill();c.strokeStyle=skin.turret;c.lineWidth=3;c.stroke();ball(500,500,23,g.current);
 c.fillStyle='#8aa0a8';c.font='10px system-ui';c.fillText('PRO MAX',500,560);
 // Reserved slot module position; no spins or rewards in this demo.
 c.fillStyle='#17262d';c.beginPath();c.roundRect(455,576,90,32,9);c.fill();c.fillStyle='#526a75';c.font='10px system-ui';c.fillText('·  ·  ·',500,593);
 const progress=g.spawned/g.level.ballCount;c.beginPath();c.arc(500,500,465,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);c.strokeStyle=skin.accent;c.lineWidth=4;c.stroke();
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;if(p.life<=0){particles.splice(i,1);continue;}p.x+=p.vx*dt;p.y+=p.vy*dt;c.globalAlpha=p.life/.6;c.fillStyle=skin.colors[p.color];c.beginPath();c.arc(p.x,p.y,4,0,Math.PI*2);c.fill();}c.globalAlpha=1;
 c.restore();}
 return {resize,point,draw,burst};
}
