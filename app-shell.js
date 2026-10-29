'use strict';
(() => {
 const home=document.querySelector('#home'),heading=home?.querySelector('.hub-heading');
 if(!heading)return;
 const quick=document.createElement('nav');quick.className='hub-quick';quick.setAttribute('aria-label','קיצורי דרך');
 for(const [id,label] of [['files','התיקים'],['simulation','אוספים את החבורה'],['memories','הקיר שלנו']]){const a=document.createElement('a');a.href='#'+id;a.textContent=label;quick.append(a)}
 heading.append(quick);
 const labels={files:'התיקים',evidence:'הראיות',quiz:'מי כתב את זה?',simulation:'אוספים את החבורה','chat-lab':'מודיעין קבוצתי',heart:'בינינו',memories:'הקיר שלנו'};
 const resume=document.createElement('a');resume.className='continue-room';resume.hidden=true;
 const caption=document.createElement('span'),name=document.createElement('b'),arrow=document.createElement('span');caption.textContent='ממשיכים מאיפה שעצרתם';arrow.textContent='←';arrow.setAttribute('aria-hidden','true');resume.append(caption,name,arrow);
 home.querySelector('.hub-welcome').after(resume);
 function showResume(id){if(!labels[id])return;resume.href='#'+id;name.textContent=labels[id];resume.hidden=false}
 try{showResume(localStorage.getItem('karnit-last-room'))}catch{}
 const switcher=document.querySelector('.room-switch');switcher.replaceChildren();
 const current=document.createElement('span');current.className='dock-room-name';const hint=document.createElement('small');hint.textContent='כל האגפים ⌃';switcher.append(current,hint);
 function update(id){current.textContent=labels[id]||'חדר הבקרה';switcher.setAttribute('aria-label',(labels[id]||'חדר הבקרה')+' — פתיחת כל האגפים');if(labels[id]){showResume(id);try{localStorage.setItem('karnit-last-room',id)}catch{}}}
 update(document.body.dataset.archiveRoom||'home');document.addEventListener('archive:room-change',e=>update(e.detail.room));
 // Keep the bottom dock clear of the software keyboard without guessing a device type.
 function keyboard(){const editable=document.activeElement?.matches('input,textarea,[contenteditable=true]');document.body.classList.toggle('keyboard-open',!!editable&&!!window.visualViewport&&innerHeight-window.visualViewport.height>120)}
 window.visualViewport?.addEventListener('resize',keyboard);document.addEventListener('focusin',keyboard);document.addEventListener('focusout',()=>requestAnimationFrame(keyboard));
 const picker=document.querySelector('#room-picker');new MutationObserver(()=>{document.body.classList.toggle('sheet-lock',picker.open);switcher.setAttribute('aria-expanded',String(picker.open))}).observe(picker,{attributes:true,attributeFilter:['open']});switcher.setAttribute('aria-expanded','false');
 // A horizontal swipe changes photos; a vertical movement remains available for scrolling.
 const photo=document.querySelector('#full-photo');let touch=null;
 photo.addEventListener('touchstart',e=>{touch=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null},{passive:true});
 photo.addEventListener('touchend',e=>{if(!touch||e.touches.length){touch=null;return}const point=e.changedTouches[0],dx=point.clientX-touch.x,dy=point.clientY-touch.y;touch=null;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)document.querySelector(dx>0?'#next-photo':'#prev-photo').click()},{passive:true});
 photo.addEventListener('touchcancel',()=>touch=null,{passive:true});
 const search=document.querySelector('#search'),field=document.createElement('div'),clear=document.createElement('button'),results=document.createElement('div');
 field.className='search-field';search.before(field);field.append(search);clear.type='button';clear.className='search-clear';clear.textContent='×';clear.setAttribute('aria-label','ניקוי החיפוש');clear.hidden=true;field.append(clear);
 results.id='search-results';results.className='search-results';results.setAttribute('role','status');field.append(results);search.setAttribute('aria-describedby',results.id);
 search.addEventListener('input',()=>{clear.hidden=!search.value;const count=[...document.querySelectorAll('.person')].filter(el=>!el.hidden).length;results.textContent=search.value?count+' תיקים תואמים':''});
 clear.onclick=()=>{search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));search.focus({preventScroll:true})};
 const gallery=document.querySelector('#gallery'),count=document.createElement('p');count.className='gallery-count';count.setAttribute('role','status');gallery.before(count);
 const galleryCount=()=>count.textContent=gallery.children.length+' תמונות באוסף';galleryCount();new MutationObserver(galleryCount).observe(gallery,{childList:true});
 document.querySelector('#gallery-filters').addEventListener('click',e=>{const button=e.target.closest('button');if(button)button.scrollIntoView({block:'nearest',inline:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})});
 const result=document.querySelector('#quiz-result');new MutationObserver(()=>{if(result.textContent)window.archiveFeedback?.(result,[{opacity:.4,translate:'0 5px'},{opacity:1,translate:'0 0'}],{duration:220})}).observe(result,{childList:true,subtree:true});
 document.querySelector('#future-next').addEventListener('click',()=>{for(const selector of ['#future-name','#future-text'])window.archiveFeedback?.(document.querySelector(selector),[{opacity:.3,translate:'0 8px'},{opacity:1,translate:'0 0'}],{duration:240})});
})();
