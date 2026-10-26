'use strict';
(() => {
 const main=document.querySelector('#main'),intro=document.querySelector('#home');intro.id='archive-intro';
 const sections=[['files','התיקים','כל החבורה. כל הראיות.','01','▤'],['evidence','הראיות','התמונות שלא נמחקו בזמן.','02','▧'],['quiz','מי כתב את זה?','עשר תשובות בדרך להפתעה.','03','?'],['simulation','יוצאים היום?','ספוילר: אל תתלבשו עדיין.','04','↗'],['chat-lab','מודיעין קבוצתי','מספרים, פרסים ותחזיות.','05','⌁'],['heart','בינינו','מתחת לכל הצחוקים.','06','♡']];
 const hub=document.createElement('section');hub.id='home';hub.className='control-room';hub.tabIndex=-1;
 hub.innerHTML='<div class="hub-heading"><span class="hub-kicker">ק״ש / מרכז השליטה</span><h1>לאן מסתבכים <br><em>היום?</em></h1><p>שישה אגפים. אפס מבוגרים אחראים.<br>בחרו אגף כדי לפתוח את הארכיון.</p></div><nav class="orbit" aria-label="בחירת אגף"><div class="orbit-rings" aria-hidden="true"></div><div class="orbit-core" aria-hidden="true"><span>🦄☀️</span><small>קרנית שמש</small></div></nav><details class="hub-list"><summary>כל האגפים · תצוגת רשימה</summary><div></div></details><p class="hub-note">🦄 הכניסה באחריותכם. היציאה תלויה במי שמוציא רכב.</p>';
 main.prepend(hub);
 sections.forEach(([id,label,desc,n,icon],i)=>{
  const a=document.createElement('a');a.href='#'+id;a.className='orbit-link';a.style.setProperty('--x',[50,84,84,50,16,16][i]+'%');a.style.setProperty('--y',[12,32,68,88,68,32][i]+'%');a.innerHTML='<span class="orbit-icon" aria-hidden="true">'+icon+'</span><strong>'+label+'</strong><small>אגף '+n+'</small>';hub.querySelector('.orbit').append(a);
  const row=document.createElement('a');row.href='#'+id;row.innerHTML='<strong>'+label+'</strong><span>'+desc+'</span><b aria-hidden="true">↙</b>';hub.querySelector('.hub-list div').append(row);
 });
 const quiz=document.createElement('section');quiz.id='quiz';quiz.className='section quiz-room';quiz.innerHTML='<div class="section-heading"><div><span class="eyebrow">03 / מבחן החברות</span><h2>מי כתב<br>את זה?</h2></div></div>';quiz.append(document.querySelector('.quote-game'),document.querySelector('.date-prize'));main.append(quiz);
 const groups={home:[hub],files:[document.querySelector('#files')],evidence:[document.querySelector('#evidence')],simulation:[document.querySelector('#simulation')],'chat-lab':[document.querySelector('#chat-lab'),document.querySelector('.awards'),document.querySelector('.future')],heart:[document.querySelector('#heart'),intro],quiz:[quiz]};
 const nodes=[...new Set(Object.values(groups).flat())];document.querySelector('.ticker').hidden=true;
 const nav=document.querySelector('.nav nav');nav.innerHTML='<a href="#home">כל האגפים ↙</a>';document.body.classList.add('hub-enabled');
 const back=document.createElement('a');back.href='#home';back.className='hub-back';back.textContent='↩ חזרה לחדר הבקרה';document.querySelector('#archive').append(back);
 function show(id,focus=true){if(!groups[id])id='home';nodes.forEach(n=>{n.hidden=!groups[id].includes(n)});back.hidden=id==='home';hub.querySelector('details').open=false;document.body.dataset.archiveRoom=id;document.title=id==='home'?'ארכיון קרנית שמש':(sections.find(s=>s[0]===id)?.[1]||'')+' | ארכיון קרנית שמש';window.scrollTo({top:0,behavior:'instant'});if(focus&&!document.querySelector('#archive').hidden){const target=groups[id][0];target.tabIndex=-1;target.focus({preventScroll:true})}}
 window.openArchiveRoom=id=>{if(!groups[id])return;history.pushState(null,'','#'+id);show(id)};
 document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const id=a.getAttribute('href').slice(1);if(!groups[id])return;e.preventDefault();window.openArchiveRoom(id)});
 addEventListener('hashchange',()=>show(location.hash.slice(1)));addEventListener('popstate',()=>show(location.hash.slice(1)));
 document.querySelector('#login').addEventListener('submit',()=>{if(document.querySelector('#archive-code').value.trim()===window.ARCHIVE.password){history.replaceState(null,'','#home');show('home',false)}});
 show(location.hash.slice(1),false);
})();
