'use strict';
(() => {
 const main=document.querySelector('#main'),intro=document.querySelector('#home');intro.id='archive-intro';
 const sections=[['files','התיקים','כל החבורה. כל הראיות.','01','▤'],['evidence','הראיות','התמונות שלא נמחקו בזמן.','02','▧'],['quiz','מי כתב את זה?','עשר תשובות בדרך להפתעה.','03','?'],['simulation','אוספים את החבורה','שישה חברים. שלבים בלי סוף.','04','↗'],['chat-lab','מודיעין קבוצתי','מספרים, פרסים ותחזיות.','05','⌁'],['heart','בינינו','מתחת לכל הצחוקים.','06','♡'],['memories','הקיר שלנו','פתק קטן. נשאר בשביל כולם.','07','↺']];
 const hub=document.createElement('section');hub.id='home';hub.className='control-room';hub.tabIndex=-1;
 const icons={memories:'<path d="M4 5h16v15H4zM8 3v4M16 3v4M4 10h16M8 14h3M8 17h6"/>',files:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 9h6M9 13h6M9 17h3"/>',evidence:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8" cy="9" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/>',quiz:'<path d="M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4M12 18h.01"/><circle cx="12" cy="12" r="10"/>',simulation:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>','chat-lab':'<path d="M5 20v-6M12 20V4M19 20V9"/>',heart:'<path d="M20 5c-3-3-6-1-8 1C5-2-3 9 12 20 27 9 21 6 20 5Z"/>'};
 hub.innerHTML=`<div class="hub-welcome"><div class="hub-topline"><span>ק״ש / חדר הבקרה</span><span class="hub-live"><i></i> חמש שנים. עדיין זורמים.</span></div><div class="hub-heading"><span class="hub-kicker">מהדורת החבורה · מאז 2021</span><h1>קרנית<br><em>שמש.</em></h1><p>אותה חבורה. כל הסיפורים.<br>התיקים, הראיות והערבים שלא יצאו לפועל.</p><a class="hub-cta" href="#departments">בוחרים לאן מסתבכים <span aria-hidden="true">↓</span></a></div><div class="hub-edition" aria-hidden="true"><span>מהדורה</span><strong>V</strong><span>חמש שנות חברות</span></div><div class="hub-hero-bottom"><span>137,422 הודעות מאוחר יותר</span><span>הכניסה באחריותכם. הרכב על מישהו אחר.</span></div></div>
 <div class="hub-stats" aria-label="הארכיון במספרים"><div><strong>05</strong><span>שנים של חברות</span></div><div><strong>137,422</strong><span>הודעות. אפס החלטות.</span></div><div><strong>168</strong><span>פעמים שנכתב ״פוצץ״</span></div><div class="hub-stat-note"><span>התוכנית להערב</span><strong>עוד לא סגרנו <i></i></strong></div></div>
 <div id="departments" class="hub-directory-heading"><div><span class="hub-kicker">בחרו את הסיפור הבא</span><h2>לאן מסתבכים היום?</h2></div><span>שבעה אגפים.<br>אפס מבוגרים אחראים.</span></div><nav class="room-grid" aria-label="בחירת אגף"></nav><p class="hub-note">נשמר בשביל החברות. וגם בשביל שיהיה במה לאיים. 🦄☀️</p>`;
 main.prepend(hub);
 sections.forEach(([id,label,desc,n],i)=>{
  const a=document.createElement('a');a.href='#'+id;a.className='room-card room-'+id;a.style.setProperty('--card-order',i);
  a.innerHTML='<div class="room-card-top"><span class="room-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+icons[id]+'</svg></span><span class="room-number">'+n+'</span></div><h3>'+label+'</h3><p>'+desc+'</p><span class="room-enter">כניסה לאגף <b aria-hidden="true">←</b></span>';
  hub.querySelector('.room-grid').append(a);
 });
 const quiz=document.createElement('section');quiz.id='quiz';quiz.className='section quiz-room';quiz.innerHTML='<div class="section-heading"><div><span class="eyebrow">03 / מבחן החברות</span><h2>מי כתב<br>את זה?</h2></div></div>';quiz.append(document.querySelector('.quote-game'),document.querySelector('.date-prize'));main.append(quiz);
 const memories=document.createElement('section');memories.id='memories';memories.className='section memories-room';main.append(memories);
 const groups={memories:[memories],home:[hub],files:[document.querySelector('#files')],evidence:[document.querySelector('#evidence')],simulation:[document.querySelector('#simulation')],'chat-lab':[document.querySelector('#chat-lab'),document.querySelector('.awards'),document.querySelector('.future')],heart:[document.querySelector('#heart'),intro],quiz:[quiz]};
 main.append(...groups['chat-lab'],...groups.heart);
 const nodes=[...new Set(Object.values(groups).flat())];document.querySelector('.ticker').hidden=true;
 const nav=document.querySelector('.nav nav');nav.innerHTML='<a href="#home">חדר הבקרה</a><a href="#files">התיקים</a><a href="#evidence">הראיות</a><a href="#quiz">המשחק</a>';document.body.classList.add('hub-enabled');
 const archive=document.querySelector('#archive');
 const dock=document.createElement('nav');dock.className='room-dock';dock.setAttribute('aria-label','מעבר בין אגפים');dock.innerHTML='<a href="#home" class="room-dock-back">↩ לבחירת אגפים</a><button type="button" class="room-switch" aria-haspopup="dialog" aria-controls="room-picker">החלפת אגף <span aria-hidden="true">⌘</span></button>';archive.append(dock);
 const picker=document.createElement('dialog');picker.id='room-picker';picker.className='room-picker';picker.setAttribute('aria-labelledby','room-picker-title');picker.innerHTML='<div class="room-picker-head"><div><span class="eyebrow">הסיפור הבא מחכה</span><h2 id="room-picker-title">לאן ממשיכים?</h2></div><button type="button" class="picker-close" aria-label="סגירת בחירת האגפים">×</button></div><nav aria-label="כל האגפים"></nav>';document.body.append(picker);
 sections.forEach(([id,label,desc,n])=>{const link=document.createElement('a');link.href='#'+id;link.className='picker-room';link.dataset.room=id;link.innerHTML='<span class="picker-num">'+n+'</span><strong>'+label+'</strong><small>'+desc+'</small><span class="picker-arrow" aria-hidden="true">←</span>';picker.querySelector('nav').append(link)});
 const preference=matchMedia('(prefers-reduced-motion: reduce)'),reduce=()=>preference.matches;
 function closePicker(){return closeArchiveDialog(picker)}
 dock.querySelector('button').onclick=()=>openArchiveDialog(picker);
 picker.querySelector('.picker-close').onclick=closePicker;
 picker.addEventListener('cancel',e=>{e.preventDefault();closePicker()});
 picker.addEventListener('click',e=>{
  const link=e.target.closest('a');
  if(link){e.preventDefault();e.stopPropagation();closePicker().then(closed=>{if(closed!==false)window.openArchiveRoom(link.hash.slice(1))});return}
  const r=picker.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePicker();
 });
 // Each room has one real DOM surface. During a transition the visible surfaces
 // stay pinned at their scroll offsets; no duplicate IDs or snapshot copies.
 const pages=new Map();
 for(const [id,content] of Object.entries(groups)){
  const page=document.createElement('div'),inner=document.createElement('div');
  page.className='archive-page';page.dataset.room=id;page.hidden=true;inner.className='route-content';
  page.append(inner);inner.append(...content);main.append(page);pages.set(id,{page,inner,x:0,y:0,animation:null});
 }
 document.documentElement.classList.add('coherent-motion');
 if('scrollRestoration' in history)history.scrollRestoration='manual';
 let roomScroll={};try{roomScroll=JSON.parse(sessionStorage.getItem('karnit-room-scroll')||'{}')}catch{}
 let freshLogin=false,current=null,currentIndex=0,lastFrom='files',serial=0,lastLocation='',routing=false,scrollTimer;
 const layers=new Map(),key=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
 const entry=()=>history.state?.karnitRoom||{key:key(),room:location.hash.slice(1)||'home',scroll:0,index:0};
 const replaceEntry=value=>history.replaceState({...history.state,karnitRoom:value},'',location.href);
 if(!history.state?.karnitRoom)replaceEntry(entry());
 function savePosition(){
  if(!current||archive.hidden||entry().room!==current)return;
  roomScroll[current]=scrollY;replaceEntry({...entry(),room:current,scroll:scrollY});
  try{sessionStorage.setItem('karnit-room-scroll',JSON.stringify(roomScroll))}catch{}
 }
 function directoryTop(){const inner=pages.get('home').inner;return Math.max(0,document.querySelector('#departments').getBoundingClientRect().top-inner.getBoundingClientRect().top-22)}
 function destination(id,options){
  if(archive.hidden)return 0;
  if(id==='home'&&options.returning){const anchor=directoryTop(),saved=Number(roomScroll.home)||0;return saved>=anchor-260?saved:anchor}
  if(options.history)return Math.max(0,Number(entry().scroll??roomScroll[id])||0);
  if(options.tab)return Math.max(0,Number(roomScroll[id])||0);
  return 0;
 }
 function focusRoom(id,options){
  if(!options.focus||archive.hidden||document.querySelector('dialog[open]'))return;const active=document.activeElement;if(pages.get(id).page.contains(active)&&active.matches('input,textarea,button,a,[contenteditable=true]'))return;
  const target=id==='home'&&options.returning?(hub.querySelector('.room-'+lastFrom)||document.querySelector('#departments')):groups[id][0];
  target.tabIndex=-1;target.focus({preventScroll:true});
 }
 function apply(id){
  current=id;currentIndex=Number(entry().index)||0;document.body.dataset.archiveRoom=id;
  for(const a of nav.querySelectorAll('a')){if(a.hash==='#'+id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')}
  for(const a of picker.querySelectorAll('a')){if(a.hash==='#'+id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')}
  document.title=id==='home'?'ארכיון קרנית שמש':(sections.find(s=>s[0]===id)?.[1]||'')+' | ארכיון קרנית שמש';
  document.dispatchEvent(new CustomEvent('archive:room-change',{detail:{room:id}}));
 }
 function freeze(id){
  const view=pages.get(id);if(layers.has(id))return view;
  const r=view.page.getBoundingClientRect(),top=document.querySelector('.nav').getBoundingClientRect().bottom;
  view.x=0;view.y=r.top-top;
  view.page.style.cssText=`position:fixed;top:${top}px;left:${r.left}px;width:${r.width}px;height:${Math.max(0,innerHeight-top)}px;`;
  view.page.dataset.routeLayer='';view.inner.style.transform=`translate3d(0,${view.y}px,0)`;
  layers.set(id,view);return view;
 }
 function capture(){
  for(const view of layers.values()){
   const value=getComputedStyle(view.inner).translate;view.x=value==='none'?0:parseFloat(value)||0;
   view.inner.style.translate=view.x+'px 0';view.animation?.cancel();view.animation=null;
  }
 }
 function clean(id){
  for(const [name,view]of pages){view.animation?.cancel();view.animation=null;view.page.hidden=name!==id;view.page.inert=name!==id;view.page.removeAttribute('data-route-layer');view.page.removeAttribute('data-route-phase');view.page.removeAttribute('style');view.inner.style.removeProperty('translate');view.inner.style.removeProperty('transform');view.x=0;view.y=0}
  layers.clear();main.style.removeProperty('min-height');main.removeAttribute('aria-busy');delete document.documentElement.dataset.routing;routing=false;
 }
 function finish(token,id,options){
  if(token!==serial)return;const y=scrollY;clean(id);window.scrollTo({top:y,behavior:'instant'});
  window.archiveMotion?.hold(false);window.archiveMotion?.enter(id);window.archiveShell?.refresh();focusRoom(id,options);savePosition();
  document.dispatchEvent(new CustomEvent('archive:route-settled',{detail:{room:id}}));
 }
 function show(id,options={}){
  if(!pages.has(id))id='home';const from=current,token=++serial,oldIndex=currentIndex;
  options={focus:true,returning:id==='home'&&from&&from!=='home',...options};
  const slots=['home','files','simulation','memories'],slot=name=>slots.includes(name)?slots.indexOf(name):4;
  const backwards=options.returning||(options.history&&(Number(entry().index)||0)<oldIndex)||(options.tab&&slot(id)<slot(from));
  if(from&&from!=='home')lastFrom=from;
  const canAnimate=!!from&&from!==id&&!archive.hidden&&!reduce()&&!document.hidden&&!document.body.classList.contains('arcade-active')&&!document.querySelector('dialog[open]');
  capture();window.archiveMotion?.hold(true);
  if(!canAnimate){clean(id);pages.get(id).page.hidden=false;pages.get(id).page.inert=false;apply(id);window.scrollTo({top:destination(id,options),behavior:'instant'});window.archiveMotion?.prepare(id);finish(token,id,options);return}
  routing=true;main.setAttribute('aria-busy','true');document.documentElement.dataset.routing='true';
  const old=pages.get(from);main.style.minHeight=old.inner.scrollHeight+'px';freeze(from);
  const target=pages.get(id),existing=layers.has(id);
  target.page.hidden=false;target.page.inert=false;
  if(!existing){target.page.style.cssText=`position:fixed;top:${document.querySelector('.nav').getBoundingClientRect().bottom}px;left:${main.getBoundingClientRect().left}px;width:${main.clientWidth}px;height:${innerHeight-document.querySelector('.nav').offsetHeight}px;`;target.page.dataset.routeLayer='';layers.set(id,target);target.x=backwards?innerWidth*.24:-innerWidth}
  main.style.minHeight=Math.max(target.inner.scrollHeight,innerHeight-document.querySelector('.nav').offsetHeight)+'px';
  const y=destination(id,options);target.y=-y;target.inner.style.transform=`translate3d(0,${-y}px,0)`;target.inner.style.translate=target.x+'px 0';
  for(const [name,view]of layers){view.page.inert=name!==id;view.page.style.zIndex=name===id?(backwards?'1':'20'):(backwards?'10':'2');view.page.dataset.routePhase=name===id?'entering':'leaving'}
  apply(id);window.scrollTo({top:y,behavior:'instant'});target.y=-scrollY;target.inner.style.transform=`translate3d(0,${target.y}px,0)`;
  window.archiveMotion?.prepare(id);window.archiveMotion?.enter(id,{route:true,backwards});window.archiveShell?.refresh();
  const animations=[];
  for(const [name,view]of layers){
   const end=name===id?0:backwards?-innerWidth:innerWidth*.24;
   view.animation=view.inner.animate([{translate:view.x+'px 0'},{translate:end+'px 0'}],{duration:window.ArchiveMotion?.durations.route||360,easing:window.ArchiveMotion?.ease||'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
   animations.push(view.animation.finished);
  }
  Promise.allSettled(animations).then(()=>finish(token,id,options));
 }
 window.openArchiveRoom=(id,routeOptions={})=>{
  if(!pages.has(id))return;
  if(id===current){if(id==='home')window.scrollTo({top:directoryTop(),behavior:reduce()?'instant':'smooth'});return}
  savePosition();history.pushState({...history.state,karnitRoom:{key:key(),room:id,scroll:routeOptions.tab?(Number(roomScroll[id])||0):0,index:currentIndex+1}},'','#'+id);lastLocation=location.href+'|'+entry().key;show(id,routeOptions);
 };
 document.addEventListener('click',e=>{
  const a=e.target.closest('a[href^="#"]');if(!a||e.defaultPrevented||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
  const id=a.getAttribute('href').slice(1);
  if(id==='departments'){e.preventDefault();const target=document.querySelector('#departments');target.tabIndex=-1;target.focus({preventScroll:true});window.scrollTo({top:directoryTop(),behavior:reduce()?'instant':'smooth'});return}
  if(!pages.has(id))return;e.preventDefault();if(id===current&&(a.classList.contains('dock-item')||a.classList.contains('brand'))){window.scrollTo({top:0,behavior:reduce()?'instant':'smooth'});return}window.openArchiveRoom(id,{tab:a.classList.contains('dock-item')});
 });
 function onLocation(){
  if(current&&!archive.hidden)roomScroll[current]=scrollY;
  const signature=location.href+'|'+entry().key;if(signature===lastLocation)return;lastLocation=signature;show(location.hash.slice(1)||'home',{history:true});
 }
 addEventListener('hashchange',onLocation);addEventListener('popstate',onLocation);addEventListener('pagehide',savePosition);
 addEventListener('scroll',()=>{
  if(current&&!archive.hidden){roomScroll[current]=scrollY;if(routing){const view=pages.get(current);view.y=-scrollY;view.inner.style.transform=`translate3d(0,${view.y}px,0)`}clearTimeout(scrollTimer);scrollTimer=setTimeout(savePosition,120)}
 },{passive:true});
 function settle(){if(routing)finish(++serial,current,{focus:false})}
 preference.addEventListener('change',()=>{if(reduce())settle()});document.addEventListener('visibilitychange',()=>{if(document.hidden)settle()});addEventListener('resize',settle);
 // A game's fixed canvas must never inherit a transient transformed surface.
 new MutationObserver(()=>{if(document.body.classList.contains('arcade-active'))settle()}).observe(document.body,{attributes:true,attributeFilter:['class']});
 document.querySelector('#login').addEventListener('submit',()=>{if(document.querySelector('#archive-code').value.trim()===window.ARCHIVE.password){freshLogin=true;history.replaceState({...history.state,karnitRoom:{key:key(),room:'home',scroll:0,index:0}},'','#home');lastLocation=location.href+'|'+entry().key;show('home',{focus:false,returning:false,history:false})}});
 document.addEventListener('archive:opened',()=>{window.scrollTo({top:destination(current||'home',{history:!freshLogin}),behavior:'instant'});freshLogin=false;window.archiveShell?.refresh()});
 show(location.hash.slice(1)||'home',{focus:false,returning:false,history:true});
})();
