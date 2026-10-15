import {createGame,step,fire,swap} from './game.js';import {createRenderer} from './render.js';import {attachInput} from './input.js';import {createAudio} from './audio.js';
const $=s=>document.querySelector(s),menu=$('#menu');
try{
 const fetchJSON=async p=>{const r=await fetch(p);if(!r.ok)throw Error(`Could not load ${p}`);return r.json();};
 const [campaign,skin]=await Promise.all([fetchJSON('./levels/campaign.json'),fetchJSON('./skins/orbit.json')]);
 let saved={};try{saved=JSON.parse(localStorage.getItem('ballpromax.settings.v1')||'{}');}catch{}
 $('#controls').value=['one','two','mouse'].includes(saved.controls)?saved.controls:matchMedia('(pointer:coarse)').matches?'one':'mouse';$('#hand').value=saved.hand==='right'?'right':'left';$('#sound').checked=saved.sound!==false;
 let index=0,g=createGame(campaign.levels[0]),paused=true,last=performance.now(),messageUntil=0;
 const renderer=createRenderer($('#game'),skin),audio=createAudio();
 const mode=()=>$('#controls').value,hand=()=>$('#hand').value;
 function settings(){document.body.classList.toggle('two',mode()==='two');document.body.classList.toggle('right',hand()==='right');$('#hand-label').hidden=mode()!=='two';$('#control-title').textContent=mode()==='two'?'AIM + FIRE':mode()==='mouse'?'POINT TO AIM':'DRAG OUTSIDE TO AIM';$('#control-sub').textContent=mode()==='two'?'Drag aim pad · tap FIRE':mode()==='mouse'?'Click to fire · Space also works':'Tap inside the ring to fire';try{localStorage.setItem('ballpromax.settings.v1',JSON.stringify({controls:mode(),hand:hand(),sound:$('#sound').checked}));}catch{}requestAnimationFrame(()=>renderer.resize());}
 function updateHUD(){$('#level').textContent=String(index+1).padStart(2,'0');$('#score').textContent=g.score.toLocaleString();$('#next-ball').style.color=skin.colors[g.next];$('#next-ball').textContent=skin.symbols[g.next];}
 function shoot(){if(paused)return;audio.unlock();fire(g);}
 attachInput({canvas:$('#game'),renderer,game:()=>g,mode,hand,shoot});
 function showMenu(title,text,button){paused=true;$('#menu-title').textContent=title;$('#menu-text').textContent=text;$('#play').textContent=button;if(!menu.open)menu.showModal();}
 function pause(){if(g.status==='playing')showMenu('Take a breather.','Your spiral is paused. Adjust your controls or jump back in.','RESUME ↗');}
 $('#settings').onclick=pause;$('#pause').onclick=pause;
 $('#play').onclick=()=>{audio.unlock();if(g.status==='won'){index=(index+1)%campaign.levels.length;g=createGame(campaign.levels[index]);}else if(g.status==='lost')g=createGame(campaign.levels[index]);paused=false;last=performance.now();menu.close();updateHUD();};
 $('#restart').onclick=()=>{g=createGame(campaign.levels[index]);paused=false;menu.close();last=performance.now();};
 $('#swap').onclick=()=>{if(!paused)swap(g);updateHUD();};
 $('#controls').onchange=settings;$('#hand').onchange=settings;$('#sound').onchange=settings;
 $('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else $('#install').textContent='For iPhone immersion: Safari Share → Add to Home Screen. Enable Open as Web App, then launch the new icon.';}catch{$('#install').textContent='Use Add to Home Screen to launch the game without browser bars.';}};
 menu.addEventListener('cancel',e=>{e.preventDefault();if(g.status==='playing'){$('#play').click();}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',pause);window.addEventListener('keydown',e=>{if(e.code==='Escape'&&!menu.open)pause();if(e.code==='KeyX'&&!menu.open){swap(g);updateHUD();}});
 new ResizeObserver(()=>renderer.resize()).observe($('#arena'));settings();renderer.resize();updateHUD();menu.showModal();
 function frame(now){const dt=Math.min((now-last)/1000,.04);last=now;if(!paused){let remaining=dt;while(remaining>0){const h=Math.min(remaining,1/120);step(g,h);remaining-=h;}}
  for(const e of g.events.splice(0)){audio.play(e.type,$('#sound').checked);if(e.type==='balls-cleared'){renderer.burst(e);$('#callout').textContent=e.combo>1?`${e.combo}× CHAIN · +${e.points}`:`+${e.points}`;messageUntil=now+1100;}if(e.type==='level-lost')showMenu('Spiral over.','The chain reached the center. Swap colors and build matches to hold it back.','TRY AGAIN ↗');if(e.type==='level-won')showMenu(index===2?'Orbit complete!':'Beautifully cleared.',`${campaign.levels[index].name} · ${g.score.toLocaleString()} points`,index===2?'PLAY AGAIN ↗':'NEXT LEVEL ↗');}
  if(now>messageUntil)$('#callout').textContent='';updateHUD();renderer.draw(g,paused?0:dt);requestAnimationFrame(frame);
 }requestAnimationFrame(frame);
}catch(error){$('#menu-title').textContent='Unable to launch';$('#menu-text').textContent=error.message;$('#play').hidden=true;menu.showModal();console.error(error);}
