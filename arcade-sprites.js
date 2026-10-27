/* Sprite regions use the user's original atlases unchanged. */
'use strict';
(() => {
 const crew=new Image(),world=new Image();crew.src='assets/arcade/crew-atlas.jpg';world.src='assets/arcade/world-atlas.jpg';
 const layout={
  'אביחי':{frames:[[14,250,59,115],[77,250,59,115],[139,250,58,115]],face:[14,377,57,61]},
  'אוראל':{frames:[[283,251,49,115],[336,251,49,115],[390,251,49,115]],face:[283,378,51,60]},
  'עידן':{frames:[[519,251,51,115],[577,251,51,115],[635,251,51,115]],face:[517,378,53,60]},
  'אגם':{frames:[[778,250,50,116],[832,250,50,116],[886,250,50,116]],face:[775,377,53,61]},
  'יאנקו':{frames:[[1016,249,55,117],[1080,249,55,117],[1146,249,55,117]],face:[1015,376,56,62]},
  'איתי':{frames:[[16,648,62,105],[81,648,62,105],[146,648,62,105]],face:[16,764,60,66]}
 };
 const vehicleRects=[[302,566,58,122],[377,566,59,122],[454,566,59,122],[528,566,59,122],[604,566,59,122],[679,566,59,122],[754,566,59,122],[827,566,59,122],[307,699,61,120],[378,699,61,120],[454,699,61,120],[526,699,61,120],[598,699,61,120],[674,699,61,120],[747,699,61,120],[820,699,61,120],[891,699,61,120]];
 const icons={clock:[510,462,92,103],clock30:[609,462,94,103],shield:[973,464,93,100],slow:[858,465,88,97],cone:[1192,741,82,86]};
 const cache=new Map();
 // Background removal is a one-time edge flood-fill when reading each sprite.
 // It keeps enclosed dark windows and outlines; no work is done per animation frame.
 function region(rect,transparent=false){const key=rect.join(',')+transparent;if(cache.has(key))return cache.get(key);const [x,y,w,h]=rect,c=document.createElement('canvas');c.width=w;c.height=h;const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(crew,x,y,w,h,0,0,w,h);
  if(transparent){const image=cx.getImageData(0,0,w,h),p=image.data;const samples=[[1,1],[w-2,1],[1,h-2],[w-2,h-2]].map(([xx,yy])=>[p[(yy*w+xx)*4],p[(yy*w+xx)*4+1],p[(yy*w+xx)*4+2]]);samples.sort((a,b)=>a.reduce((s,n)=>s+n,0)-b.reduce((s,n)=>s+n,0));const bg=samples[1],tolerance=Math.max(...bg)>70?56:27,seen=new Uint8Array(w*h),stack=[];for(let xx=0;xx<w;xx++){stack.push(xx,(h-1)*w+xx)}for(let yy=0;yy<h;yy++){stack.push(yy*w,yy*w+w-1)}while(stack.length){const i=stack.pop();if(seen[i])continue;seen[i]=1;const k=i*4;if(Math.max(Math.abs(p[k]-bg[0]),Math.abs(p[k+1]-bg[1]),Math.abs(p[k+2]-bg[2]))>tolerance)continue;p[k+3]=0;const xx=i%w,yy=Math.floor(i/w);if(xx>0)stack.push(i-1);if(xx<w-1)stack.push(i+1);if(yy>0)stack.push(i-w);if(yy<h-1)stack.push(i+w)}cx.putImageData(image,0,0)}cache.set(key,c);return c;
 }
 const ready=Promise.all([new Promise(resolve=>{crew.onload=resolve;crew.onerror=resolve}),new Promise(resolve=>{world.onload=resolve;world.onerror=resolve})]);
 window.KarnitSprites={ready,crew,world,layout,
  face(name){return crew.complete&&crew.naturalWidth&&layout[name]?region(layout[name].face).toDataURL():null},
  person(name,frame){return crew.complete&&crew.naturalWidth&&layout[name]?region(layout[name].frames[frame%3],true):null},
  car(index){return crew.complete&&crew.naturalWidth?region(vehicleRects[index%vehicleRects.length],true):null},
  icon(name){return crew.complete&&crew.naturalWidth&&icons[name]?region(icons[name],true):null},
  scene(index){const col=index%4,row=Math.floor(index/4);return [col*320+4,row*278+4,312,row===2?288:260]}
 };
})();
