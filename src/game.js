import {createPath} from './path.js';
export function createGame(level,seed=12345){
 if(!Number.isInteger(level.colors)||level.colors<2||level.colors>5||level.ballCount<1||level.ballRadius<=0||level.feedSpacing<level.ballRadius*2||level.speed<=0||level.shotSpeed<=0)throw Error('Invalid level rules');
 let randomState=seed>>>0;const random=()=>{randomState=(1664525*randomState+1013904223)>>>0;return randomState/4294967296;};
 const g={level,path:createPath(level.path),balls:[],shots:[],events:[],score:0,cleared:0,spawned:0,status:'playing',angle:-Math.PI/2,current:0,next:1,cooldown:0,chain:0,chainTimer:0,time:0,effects:{previewUntil:0},random};
 for(let i=0;i<20&&g.spawned<level.ballCount;i++)spawn(g,(19-i)*level.feedSpacing);
 g.current=pick(g);g.next=pick(g);return g;
}
function pick(g){const available=[...new Set(g.balls.map(b=>b.color))];if(g.spawned<g.level.ballCount)for(let i=0;i<g.level.colors;i++)if(!available.includes(i))available.push(i);return available.length?available[Math.floor(g.random()*available.length)]:0;}
function spawn(g,s){let color=Math.floor(g.random()*g.level.colors);const tail=g.balls.slice(-2);if(tail.length===2&&tail.every(b=>b.color===color))color=(color+1)%g.level.colors;g.balls.push({id:g.spawned++,s,color});}
export function swap(g){if(g.status==='playing')[g.current,g.next]=[g.next,g.current];}
export function fire(g){if(g.status!=='playing'||g.cooldown>0)return false;g.shots.push({x:500+Math.cos(g.angle)*42,y:500+Math.sin(g.angle)*42,vx:Math.cos(g.angle)*g.level.shotSpeed,vy:Math.sin(g.angle)*g.level.shotSpeed,color:g.current});g.current=g.next;g.next=pick(g);g.cooldown=.19;g.events.push({type:'shot'});return true;}
export function matchAt(g,index){
 const b=g.balls[index];if(!b)return false;let lo=index,hi=index;const touching=(a,b)=>Math.abs(a.s-b.s)<=g.level.feedSpacing*1.08;
 while(lo>0&&g.balls[lo-1].color===b.color&&touching(g.balls[lo-1],g.balls[lo]))lo--;
 while(hi<g.balls.length-1&&g.balls[hi+1].color===b.color&&touching(g.balls[hi],g.balls[hi+1]))hi++;
 if(hi-lo<2)return false;
 const removed=g.balls.splice(lo,hi-lo+1);g.chain=g.chainTimer>0?g.chain+1:1;g.chainTimer=2;g.cleared+=removed.length;const points=removed.length*10*g.chain;g.score+=points;
 g.events.push({type:'balls-cleared',count:removed.length,color:b.color,combo:g.chain,points,positions:removed.map(b=>g.path.at(b.s))});return true;
}
export function insertBall(g,index,color,after){
 const spacing=g.level.feedSpacing;const hit=g.balls[index];const n=after?index+1:index;const ball={id:`shot-${g.time}-${g.shots.length}`,color,s:hit.s+(after?0:spacing)};
 g.balls.splice(n,0,ball);
 // Make room by pushing the leading segment. Never teleport the trailing segment.
 for(let i=n-1;i>=0;i--)g.balls[i].s=Math.max(g.balls[i].s,g.balls[i+1].s+spacing);
 matchAt(g,n);
}
function collisionT(x,y,dx,dy,cx,cy,r){const fx=x-cx,fy=y-cy,a=dx*dx+dy*dy,c=fx*fx+fy*fy-r*r;if(c<=0)return 0;const b=2*(fx*dx+fy*dy),d=b*b-4*a*c;if(d<0||a===0)return null;const t=(-b-Math.sqrt(d))/(2*a);return t>=0&&t<=1?t:null;}
export function step(g,dt){
 if(g.status!=='playing')return;dt=Math.min(.04,Math.max(0,dt));g.time+=dt;g.cooldown=Math.max(0,g.cooldown-dt);g.chainTimer=Math.max(0,g.chainTimer-dt);
 const spacing=g.level.feedSpacing;
 for(let i=0;i<g.balls.length;i++){const b=g.balls[i];b.s+=g.level.speed*dt;if(i>0){const target=g.balls[i-1].s-spacing;if(b.s<target)b.s=Math.min(target,b.s+250*dt);}}
 // Only match newly reconnected groups; ordinary pairs stay in the chain.
 for(let i=0;i<g.balls.length;i++)if(matchAt(g,i)){i=-1;}
 if(g.spawned<g.level.ballCount&&(!g.balls.length||g.balls.at(-1).s>=spacing))spawn(g,0);
 for(let j=g.shots.length-1;j>=0;j--){const shot=g.shots[j],dx=shot.vx*dt,dy=shot.vy*dt;let nearest=null;
  for(let i=0;i<g.balls.length;i++){const p=g.path.at(g.balls[i].s),t=collisionT(shot.x,shot.y,dx,dy,p.x,p.y,g.level.ballRadius*1.9);if(t!==null&&(!nearest||t<nearest.t))nearest={i,t,p};}
  if(nearest){const b=g.balls[nearest.i],before=g.path.at(b.s-2),after=g.path.at(b.s+2),hx=shot.x+dx*nearest.t-nearest.p.x,hy=shot.y+dy*nearest.t-nearest.p.y;insertBall(g,nearest.i,shot.color,hx*(after.x-before.x)+hy*(after.y-before.y)<0);g.shots.splice(j,1);g.events.push({type:'impact'});}
  else{shot.x+=dx;shot.y+=dy;if(shot.x<0||shot.x>1000||shot.y<0||shot.y>1000)g.shots.splice(j,1);}
 }
 // End-of-feed ammunition cannot strand a player with colors that no longer exist.
 if(g.spawned>=g.level.ballCount&&g.balls.length){const colors=new Set(g.balls.map(b=>b.color));if(!colors.has(g.current))g.current=pick(g);if(!colors.has(g.next))g.next=pick(g);}
 if(g.balls.some(b=>b.s>=g.path.length)){g.status='lost';g.events.push({type:'level-lost'});}
 else if(g.spawned>=g.level.ballCount&&g.balls.length===0&&g.shots.length===0){g.status='won';g.events.push({type:'level-won'});}
}
