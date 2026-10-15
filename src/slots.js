// Slot RNG and timing are independent of board RNG, rendering and wall-clock time.
const rewardTypes=new Set(['preview','burning','infection','color','gold','none']);
export function createSlots(config,seed){
 if(!config)return null;
 if(!Number.isInteger(config.ballsPerSpin)||config.ballsPerSpin<1||!Number.isFinite(config.spinSeconds)||config.spinSeconds<=0||!Number.isFinite(config.resultSeconds)||config.resultSeconds<0||!Array.isArray(config.rewards)||!config.rewards.length)throw Error('Invalid slot configuration');
 for(const r of config.rewards)if(!rewardTypes.has(r.type)||typeof r.label!=='string'||!r.label.trim()||typeof r.symbol!=='string'||!r.symbol.trim()||!Number.isFinite(r.weight)||r.weight<=0||(r.type!=='none'&&(!Number.isFinite(r.amount)||r.amount<=0))||(['burning','infection','gold'].includes(r.type)&&!Number.isInteger(r.amount)))throw Error('Invalid slot reward');
 let state=(seed^0x9e3779b9)>>>0;
 const random=()=>{state=(1664525*state+1013904223)>>>0;return state/4294967296;};
 return {config,random,charge:0,phase:'idle',elapsed:0,spinId:0,reward:null,reels:['·','·','·'],message:`Clear ${config.ballsPerSpin} balls to spin`};
}
export function chargeSlots(slots,count){if(slots)slots.charge+=count;}
export function weightedReward(rewards,random){const total=rewards.reduce((n,r)=>n+r.weight,0);let pick=random()*total;for(const r of rewards){pick-=r.weight;if(pick<0)return {...r};}return {...rewards.at(-1)};}
export function advanceSlots(slots,dt,events){
 if(!slots)return null;
 if(slots.phase==='result'){slots.elapsed+=dt;if(slots.elapsed>=slots.config.resultSeconds)slots.phase='idle';}
 if(slots.phase==='idle'&&slots.charge>=slots.config.ballsPerSpin){
  slots.charge-=slots.config.ballsPerSpin;slots.phase='spinning';slots.elapsed=0;slots.spinId++;slots.reward=weightedReward(slots.config.rewards,slots.random);slots.message='Spinning…';events.push({type:'slots-started',spinId:slots.spinId});return null;
 }
 if(slots.phase!=='spinning')return null;
 slots.elapsed+=dt;
 if(slots.elapsed<slots.config.spinSeconds)return null;
 slots.phase='result';slots.elapsed=0;const reward=slots.reward;
 slots.reels=reward.type==='none'?['◎','◆','▲']:Array(3).fill(reward.symbol);
 events.push({type:'slots-result',spinId:slots.spinId,reward:reward.type});
 return reward;
}
export function reelSymbols(slots){
 if(slots.phase!=='spinning')return slots.reels;
 const symbols=slots.config.rewards.map(r=>r.symbol||'—');
 return [0,1,2].map(i=>slots.elapsed>=slots.config.spinSeconds*(.5+i*.17)?(slots.reward.type==='none'?['◎','◆','▲'][i]:slots.reward.symbol):symbols[(Math.floor(slots.elapsed*(16-i*2))+i*3+slots.spinId)%symbols.length]);
}
