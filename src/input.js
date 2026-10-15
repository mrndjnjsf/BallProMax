export function attachInput({canvas,renderer,game,mode,hand,shoot}){
 const aimPointers=new Set();let padPointer=null,lastPad=null;const cleanups=[];
 const on=(el,type,fn)=>{el.addEventListener(type,fn);cleanups.push(()=>el.removeEventListener(type,fn));};
 function aim(p){if(Math.hypot(p.x-500,p.y-500)>20)game().angle=Math.atan2(p.y-500,p.x-500);}
 on(canvas,'pointerdown',e=>{e.preventDefault();if(game().status!=='playing')return;const p=renderer.point(e);if(e.pointerType==='mouse'||mode()==='mouse'){aim(p);shoot();return;}if(mode()==='one'){if(Math.hypot(p.x-500,p.y-500)>430){aimPointers.add(e.pointerId);canvas.setPointerCapture(e.pointerId);aim(p);}else shoot();}});
 on(canvas,'pointermove',e=>{if(e.pointerType==='mouse'||mode()==='mouse'||aimPointers.has(e.pointerId))aim(renderer.point(e));});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])on(canvas,type,e=>aimPointers.delete(e.pointerId));
 const pad=document.querySelector('#aim-pad'),firePad=document.querySelector('#fire-pad');
 on(pad,'pointerdown',e=>{e.preventDefault();if(padPointer!==null)return;padPointer=e.pointerId;lastPad={x:e.clientX,y:e.clientY};pad.setPointerCapture(e.pointerId);});
 on(pad,'pointermove',e=>{if(e.pointerId!==padPointer)return;const dx=e.clientX-lastPad.x,dy=e.clientY-lastPad.y;game().angle+=(dx+(hand()==='right'?-dy:dy))*.014;lastPad={x:e.clientX,y:e.clientY};});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])on(pad,type,()=>{padPointer=null;lastPad=null;});
 on(firePad,'pointerdown',e=>{e.preventDefault();shoot();});
 on(window,'keydown',e=>{if(document.querySelector('dialog').open)return;if(e.code==='Space'){e.preventDefault();shoot();}if(e.code==='ArrowLeft')game().angle-=.12;if(e.code==='ArrowRight')game().angle+=.12;});
 return ()=>cleanups.forEach(f=>f());
}
