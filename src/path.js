// Arc-length sampled geometry: simulation knows distances, never screen pixels.
export function createPath(spec){
 const points=[];
 if(spec.type==='spiral')for(let i=0;i<=1600;i++){const t=i/1600,a=spec.rotation+t*spec.turns*Math.PI*2,r=spec.startRadius+(spec.endRadius-spec.startRadius)*t;points.push({x:spec.cx+Math.cos(a)*r,y:spec.cy+Math.sin(a)*r});}
 else if(spec.type==='polyline'&&spec.points?.length>=2)for(const [x,y] of spec.points)points.push({x,y});
 else throw Error('Path must be spiral or a polyline with at least two points');
 const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y));
 const total=lengths.at(-1);if(!Number.isFinite(total)||total<=0)throw Error('Invalid path geometry');
 function at(s){s=Math.max(0,Math.min(total,s));let lo=0,hi=lengths.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(lengths[m]<s)lo=m;else hi=m;}const d=lengths[hi]-lengths[lo],t=d?(s-lengths[lo])/d:0;return {x:points[lo].x+(points[hi].x-points[lo].x)*t,y:points[lo].y+(points[hi].y-points[lo].y)*t};}
 return {points,length:total,at};
}
