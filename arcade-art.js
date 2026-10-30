/* Original large portraits and freshly illustrated transparent arcade assets. */
'use strict';
(() => {
 const names=['אביחי','אוראל','עידן','אגם','יאנקו','איתי'];
 const base='assets/arcade/v2/',images=[],walks=[],cars=[];
 let started=false,complete;
 const ready=new Promise(resolve=>complete=resolve);
 function image(file){
  const img=new Image();img.decoding='async';
  const entry={img,src:base+file,done:new Promise(resolve=>{img.onload=()=>resolve(true);img.onerror=()=>resolve(false)})};
  images.push(entry);return img;
 }
 const faces=names.map((_,i)=>base+'face-'+i+'.webp');
 names.forEach((_,i)=>walks.push(Array.from({length:4},(_,frame)=>image('walk-'+i+'-'+frame+'.webp'))));
 for(let i=0;i<6;i++)cars.push(image('car-'+i+'.webp'));
 const background=image('road.webp');
 const available=img=>img?.complete&&img.naturalWidth?img:null;
 window.KarnitArt={
  ready,background,road:background,backgroundImage:background,names,
  load(){if(!started){started=true;images.forEach(entry=>entry.img.src=entry.src);Promise.all(images.map(entry=>entry.done)).then(results=>complete(results.every(Boolean)))}return ready},
  face(name){const i=names.indexOf(name);return i>=0?faces[i]:null},
  person(name,frame=0){const i=names.indexOf(name);return i>=0?available(walks[i][((Math.floor(frame)%4)+4)%4]):null},
  car(index=0){return available(cars[((Math.floor(index)%6)+6)%6])}
 };
})();
