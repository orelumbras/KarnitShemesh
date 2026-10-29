/* Exact crops from the supplied artwork. Directional poses are not walk-cycle frames. */
'use strict';
(() => {
 function load(src){const image=new Image();let started=false;const promise=new Promise(resolve=>{image.onload=()=>resolve(true);image.onerror=()=>resolve(false)});return {image,promise,start(){if(!started){started=true;image.src=src}}}}
 const a=load('assets/arcade/crew-atlas.jpg'),b=load('assets/arcade/world-atlas.jpg'),c=load('assets/arcade/world-kit.jpg');
 const crew=a.image,world=b.image,kit=c.image;
 const layout={
  'אביחי':{body:[17,253,58,112],face:[17,380,48,56]},
  'אוראל':{body:[283,254,49,112],face:[285,381,46,55]},
  'עידן':{body:[525,254,47,112],face:[520,381,47,55]},
  'אגם':{body:[783,253,46,113],face:[779,380,46,56]},
  'יאנקו':{body:[1022,253,48,112],face:[1018,380,49,56]},
  'איתי':{body:[19,650,59,104],face:[20,768,51,58]}
 };
 const cars=[[304,569,63,115],[378,569,64,115],[453,569,65,115],[529,569,65,115],[604,569,65,115],[679,569,64,115],[754,569,65,115],[829,569,64,115],[308,700,59,119],[373,700,58,119],[435,700,58,119],[498,700,58,119],[560,700,58,119],[623,700,58,119],[685,700,58,119],[748,700,58,119],[810,700,58,119],[873,700,58,119],[936,700,64,119]];
 const icons={clock:[513,468,88,92],clock30:[613,468,88,92],slow:[976,468,82,95],cone:[1198,744,74,79]};
 const props={palm:[746,324,64,110],palm2:[813,325,68,112],hotel:[1024,113,130,231],building:[1159,113,115,231],billboard:[1027,549,164,112],sand:[12,778,49,61],paving:[204,783,46,53],water:[405,782,44,53],grass:[76,778,49,61]};
 const cache=new Map(),faces=new Map();
 function region(image,rect,alpha=false){
  if(!image.naturalWidth)return null;const key=image.src+rect.join(',')+alpha;if(cache.has(key))return cache.get(key);
  const [x,y,w,h]=rect,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:alpha});ctx.drawImage(image,x,y,w,h,0,0,w,h);
  if(alpha){
   const data=ctx.getImageData(0,0,w,h),p=data.data,seen=new Uint8Array(w*h),stack=[];
   const samples=[[1,1],[w-2,1],[1,h-2],[w-2,h-2]].map(([x,y])=>{const k=(y*w+x)*4;return [p[k],p[k+1],p[k+2]]});samples.sort((a,b)=>Math.max(...a)-Math.max(...b));const bg=samples[1];
   // Tight color matching preserves black outlines, trousers, tires and windows.
   for(let x=0;x<w;x++)stack.push(x,(h-1)*w+x);for(let y=0;y<h;y++)stack.push(y*w,y*w+w-1);
   while(stack.length){const i=stack.pop();if(seen[i])continue;seen[i]=1;const k=i*4;if(Math.max(Math.abs(p[k]-bg[0]),Math.abs(p[k+1]-bg[1]),Math.abs(p[k+2]-bg[2]))>15)continue;p[k+3]=0;const x=i%w,y=(i/w)|0;if(x)stack.push(i-1);if(x<w-1)stack.push(i+1);if(y)stack.push(i-w);if(y<h-1)stack.push(i+w)}
   // Keep the single connected figure; discard atlas dividers and neighboring fragments.
   const visited=new Uint8Array(w*h),queue=new Int32Array(w*h);let largest=[];
   for(let start=0;start<w*h;start++){if(visited[start]||!p[start*4+3])continue;let head=0,tail=1;queue[0]=start;visited[start]=1;while(head<tail){const i=queue[head++],x=i%w,y=(i/w)|0;for(const n of [x?i-1:-1,x<w-1?i+1:-1,y?i-w:-1,y<h-1?i+w:-1]){if(n<0||visited[n]||!p[n*4+3])continue;visited[n]=1;queue[tail++]=n}}if(tail>largest.length)largest=Array.from(queue.subarray(0,tail))}
   const keep=new Uint8Array(w*h);for(const i of largest)keep[i]=1;for(let i=0;i<w*h;i++)if(!keep[i])p[i*4+3]=0;ctx.putImageData(data,0,0);
   let left=w,top=h,right=0,bottom=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(p[(y*w+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
   if(right>left&&bottom>top){const trimmed=document.createElement('canvas');trimmed.width=right-left+1;trimmed.height=bottom-top+1;trimmed.getContext('2d').drawImage(canvas,left,top,trimmed.width,trimmed.height,0,0,trimmed.width,trimmed.height);cache.set(key,trimmed);return trimmed}
  }
  cache.set(key,canvas);return canvas;
 }
 const api={crew,world,kit,layout,load(){a.start();b.start();c.start()},
  face(name){if(!layout[name]||!crew.naturalWidth)return null;if(!faces.has(name))faces.set(name,region(crew,layout[name].face).toDataURL());return faces.get(name)},
  person(name){return layout[name]?region(crew,layout[name].body,true):null},
  car(index){return region(crew,cars[((index%cars.length)+cars.length)%cars.length],true)},
  icon(name){return icons[name]?region(crew,icons[name],true):null},
  prop(name){return props[name]?region(kit,props[name],!['sand','paving','water','grass'].includes(name)):null},
  scene(index){const col=index%4,row=Math.floor(index/4);return [col*320+4,row*278+4,312,row===2?288:260]}
 };
 api.ready=Promise.all([a.promise,b.promise,c.promise]).then(results=>{for(const name of Object.keys(layout)){api.face(name);api.person(name)}for(let i=0;i<cars.length;i++)api.car(i);for(const name of Object.keys(icons))api.icon(name);for(const name of Object.keys(props))api.prop(name);return results.every(Boolean)});
 window.KarnitSprites=api;
})();
