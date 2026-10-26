'use strict';
(() => {
 const data=window.ARCHIVE_MEMORIES;if(!data)return;
 const $=s=>document.querySelector(s),make=(tag,value,cls)=>{const el=document.createElement(tag);el.textContent=value;if(cls)el.className=cls;return el};
 const dateLabel=iso=>iso.split('-').reverse().join('.');
 const fmt=n=>n.toLocaleString('he-IL');
 const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('gentle-motion');
 const source=q=>`${q.author} · ${dateLabel(q.date)} · ${q.time.slice(0,5)}`;
 function quoteCard(q,cls='memory-quote'){
  const card=make('article','',cls);card.append(make('span',q.title,'eyebrow'),make('blockquote','״'+q.quote+'״'),make('p',source(q),'memory-source'));return card;
 }
 // A local-calendar day, independent of DST and visits. No visitor data is stored.
 function dayKey(date){return Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000)}
 function dailyQuote(date=new Date()){const key=dayKey(date);return data.quotes[((key%data.quotes.length)+data.quotes.length)%data.quotes.length]}
 let dailyKey;
 const daily=make('section','','daily-memory');daily.setAttribute('aria-labelledby','daily-title');
 daily.innerHTML='<div class="daily-heading"><span class="eyebrow">תחנת עצירה / מהצ׳אט האמיתי</span><h2 id="daily-title">הרגע היומי.</h2><p>ציטוט אחר בכל יום. הזיכרון נשאר.</p><a class="pill" href="#memories">לכל הרגעים ←</a></div><div class="daily-content"></div>';
 $('#home .hub-stats').after(daily);
 function renderDaily(){dailyKey=dayKey(new Date());const q=dailyQuote();const card=quoteCard(q,'daily-quote');const share=make('button','שתפו בקבוצה ↗','pill');share.type='button';const status=make('p','','share-status');status.setAttribute('role','status');
  share.onclick=async()=>{const message=`הרגע היומי · קרנית שמש\n״${q.quote}״\n${source(q)}`;try{if(navigator.share)await navigator.share({title:'הרגע היומי · קרנית שמש',text:message});else if(navigator.clipboard){await navigator.clipboard.writeText(message);status.textContent='הציטוט הועתק. אפשר להדביק בקבוצה.'}else status.textContent='אפשר לסמן את הציטוט ולהעתיק אותו לקבוצה.'}catch(e){if(e.name!=='AbortError')status.textContent='השיתוף לא הושלם. אפשר לסמן את הציטוט ולהעתיק אותו.'}};
  card.append(share,status);daily.querySelector('.daily-content').replaceChildren(card);
 }
 renderDaily();document.addEventListener('visibilitychange',()=>{if(!document.hidden&&dailyKey!==dayKey(new Date()))renderDaily()});setInterval(()=>{if(!document.hidden&&dailyKey!==dayKey(new Date()))renderDaily()},60000);
 const room=$('#memories');room.innerHTML='<div class="section-heading"><div><span class="eyebrow">07 / ארכיון הזיכרונות</span><h2>יש לזה<br>תאריך.</h2></div><p>רגעים שנבחרו מתוך הצ׳אט.<br>הציטוטים מקוריים. הכותרות הן שלנו.</p></div><div class="memory-years" aria-label="סינון רגעים לפי שנה"></div><p class="memory-count" role="status"></p><ol class="memory-timeline"></ol><div class="memory-method"><h3>מה נשמר כאן?</h3><p>מבחר הודעות מתוך ייצוא שמכסה את 03.05.2022–25.10.2026. התאריכים הם תאריכי שליחת ההודעות; תוכנית בצ׳אט אינה הוכחה שהאירוע התקיים. הכתיב המקורי נשמר. הייצוא המלא אינו חלק מהאתר.</p></div>';
 const sorted=[...data.quotes].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 const years=[...new Set(sorted.map(q=>q.date.slice(0,4)))];
 function renderTimeline(year){const list=room.querySelector('.memory-timeline');const quotes=sorted.filter(q=>year==='all'||q.date.startsWith(year));list.replaceChildren();for(const q of quotes){const li=make('li','');const time=make('time',dateLabel(q.date));time.dateTime=q.date;li.append(time,quoteCard(q));list.append(li)}room.querySelector('.memory-count').textContent=`${quotes.length} רגעים מתועדים${year==='all'?'': ' · '+year}`;room.querySelectorAll('.memory-years button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.year===year)))}
 for(const year of ['all',...years]){const b=make('button',year==='all'?'כל השנים':year);b.type='button';b.dataset.year=year;b.onclick=()=>renderTimeline(year);room.querySelector('.memory-years').append(b)}renderTimeline('all');
 // Aggregate annual volume does not expose individual messages or phone numbers.
 const activity=make('section','','archive-activity');activity.setAttribute('aria-labelledby','activity-title');activity.innerHTML='<span class="eyebrow">הקבוצה במספרים / לפי הייצוא המצורף</span><h3 id="activity-title">כל שנה והבלגן שלה.</h3><div class="activity-bars"></div><p>רשומות בייצוא, כולל הודעות, מדיה ורשומות מערכת. 2022 ו־2026 מכוסות רק בחלקן.</p>';
 const max=Math.max(...Object.values(data.years));for(const [year,count] of Object.entries(data.years)){const row=make('div','','activity-row');row.append(make('span',year),make('strong',fmt(count)));const track=make('div','','activity-track');const bar=make('i','');bar.style.width=(count/max*100)+'%';track.append(bar);row.append(track);activity.querySelector('.activity-bars').append(row)}$('#chat-lab .chat-method').after(activity);
 const profileAliases={'עידן פייט בלילוס':'עידן','אגם ויגדר':'אגם','איתי זכרייב':'איתי','אוראל אומברס':'אוראל','טל יאנקו':'יאנקו','רם':'רם','איליי':'איליי'};
 // Observe the native dialog lifecycle; never alter the existing dossier content.
 new MutationObserver(()=>{const dialog=$('#dossier');if(!dialog.open||dialog.querySelector('.dossier-chat'))return;const name=profileAliases[$('#dossier-content h2')?.textContent];if(!name||!data.people[name])return;const stats=data.people[name];const panel=make('section','','dossier-chat');panel.append(make('span','נספח / מתוך הצ׳אט','eyebrow'),make('h3','התיק קיבל עדכון.'));const numbers=make('p',`${fmt(stats.records)} רשומות בשם זה · ${fmt(stats.stickers)} סטיקרים שהושמטו`,'dossier-chat-stats');panel.append(numbers);const q=data.quotes.find(q=>q.author===name);if(q)panel.append(quoteCard(q));panel.append(make('p','הספירה כוללת מדיה ורשומות מערכת שמופיעות בשם זה בייצוא. אינה מעידה על קריאה או זמינות.','memory-source'));$('#dossier-content').append(panel)}).observe($('#dossier'),{attributes:true,attributeFilter:['open']});
 // Update prior hard-coded figures from this exact export, with counting rules visible.
 const stats=$('#chat-lab .chat-stats');stats.querySelectorAll('strong').forEach((el,i)=>el.textContent=fmt([data.records,data.stickers,data.cancel][i]));
 $('#chat-lab .chat-method p').textContent='הנתונים חושבו מייצוא הצ׳אט המצורף, שמכסה את 03.05.2022–25.10.2026. סך הרשומות כולל הודעות, מדיה, הודעות מערכת ורשומות ריקות. סטיקרים נספרו לפי הרשומה המדויקת ״סטיקר הושמט״. ״פוצץ״ נספרה כמילה עצמאית, פעם אחת להודעה — זה אינו מספר היציאות שבוטלו. הנתונים עודכנו לספירה של הייצוא הנוכחי; אין מידע אמין על קריאת הודעות או זמינות.';
 const leaders=Object.entries(data.people).sort((a,b)=>b[1].stickers-a[1].stickers).slice(0,5);const board=$('.sticker-board ol');board.replaceChildren();for(const [name,s]of leaders){const li=make('li','');const bar=make('i','');bar.style.setProperty('--bar',s.stickers/leaders[0][1].stickers*100+'%');li.append(make('span',name),make('strong',fmt(s.stickers)),bar);board.append(li)}
 $('#home .hub-stats>div:nth-child(2) strong').textContent=fmt(data.records);$('#home .hub-hero-bottom>span').textContent=fmt(data.records)+' רשומות מאוחר יותר';
 // Expose only pure date selection for meaningful automated regression checks.
 window.archiveDailyQuoteForDate=iso=>dailyQuote(new Date(iso+'T12:00:00'))?.id;
})();
