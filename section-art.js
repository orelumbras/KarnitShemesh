'use strict';
(() => {
 const artworks={
  home:{src:'assets/sections/home.webp',position:'center 48%'},
  files:{src:'assets/sections/files.webp',position:'center 52%'},
  evidence:{src:'assets/sections/evidence.webp',position:'center 48%'},
  quiz:{src:'assets/sections/quiz.webp',position:'center 50%'},
  'chat-lab':{src:'assets/sections/chat-lab.webp',position:'center 48%'},
  heart:{src:'assets/sections/heart.webp',position:'center 57%'},
  memories:{src:'assets/sections/memories.webp',position:'center 53%'},
  simulation:{src:'assets/sections/simulation.webp',position:'center 55%'}
 };
 function picture(id,cls,lazy=true){const art=artworks[id],img=document.createElement('img');img.className=cls;img.src=art.src;img.alt='';img.setAttribute('aria-hidden','true');img.width=1536;img.height=1024;img.loading=lazy?'lazy':'eager';img.decoding='async';img.style.objectPosition=art.position;if(!lazy)img.fetchPriority='high';return img}
 const welcome=document.querySelector('.hub-welcome');welcome.prepend(picture('home','hub-scene',false));
 for(const [id]of Object.entries(artworks)){
  const card=document.querySelector('.room-'+id);if(card){card.prepend(picture(id,'room-card-art'));card.classList.add('has-section-art')}
  if(['home','simulation','heart'].includes(id))continue;
  const section=document.getElementById(id),heading=section?.querySelector(':scope > .section-heading');if(!heading)continue;
  const cover=document.createElement('div');cover.className='section-cover cover-'+id;heading.before(cover);cover.append(picture(id,'section-cover-image'),heading);
 }
 const grid=document.querySelector('.room-grid');
 if(grid){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){grid.querySelectorAll('.room-card-art').forEach(img=>img.loading='eager');observer.disconnect()}},{rootMargin:'900px 0px'});observer.observe(grid)}
 const heart=document.querySelector('#heart'),heartHeading=heart?.querySelector(':scope > h2');
 if(heartHeading){const cover=document.createElement('div');cover.className='section-cover cover-heart';const copy=document.createElement('div');copy.className='heart-cover-copy';heart.prepend(cover);cover.append(picture('heart','section-cover-image'),copy);for(const selector of [':scope > .eyebrow',':scope > .heart-mark',':scope > h2']){const node=heart.querySelector(selector);if(node)copy.append(node)}}
})();
