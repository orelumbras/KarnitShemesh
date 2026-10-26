/* Deterministic mission rules; shared by the browser and exhaustive Node checks. */
(function(root,factory){const engine=factory();if(typeof module==='object'&&module.exports)module.exports=engine;else root.KarnitMission=engine})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 const stages=[
  {id:'ride',title:'קודם כול, מי מוציא רכב?',brief:'השמש יורדת. כולם זורמים. מפתחות עדיין אין.',speaker:'אוראל',quoteId:'q13',icon:'car',choices:[
   {label:'אני מוציא רכב. בלי ועדת קבלה.',hint:'15 דקות · סוף סוף יש נהג',minutes:15,patience:5,ready:10,ride:true,reply:'נמצא נהג. הקבוצה לא יודעת איך להגיב להתקדמות הזאת.'},
   {label:'נחכה שמישהו יתנדב.',hint:'40 דקות · הסבלנות נשחקת',minutes:40,patience:-12,ready:0,reply:'כולם קראו את ההודעה. אף אחד לא מצא מפתחות.'},
   {label:'הולכים ברגל. זה גם צעדים.',hint:'25 דקות · תוכנית בלי רכב',minutes:25,patience:-4,ready:5,walk:true,reply:'המסלול הרגלי פתוח. לפחות אגם יכול לספור את זה.'}]},
  {id:'wake',title:'איתי לא עונה.',brief:'המשימה הבאה: להחזיר את איתי למצב אנכי.',speaker:'איתי',quoteId:'q3',icon:'moon',choices:[
   {label:'מתקשרים פעם אחת עם תוכנית סגורה.',hint:'20 דקות · יותר מוכנות, פחות רעש',minutes:20,patience:8,ready:20,reply:'איתי התעורר. יש תוכנית, אז הפעם יש על מה לדבר.'},
   {label:'נותנים לו עוד קצת לישון.',hint:'75 דקות · ״קצת״ במונחי הקבוצה',minutes:75,patience:-18,ready:5,reply:'השנ״צ קיבל הארכה. הערב פחות.'},
   {label:'מציעים קפה לפני היציאה.',hint:'25 דקות · התנעה רכה',minutes:25,patience:4,ready:15,reply:'הקפה בדרך. איתי כבר כמעט בן אדם מתפקד.'}]},
  {id:'steps',title:'אגם עוד לא סיים צעדים.',brief:'אפשר להתווכח עם השעון. אי אפשר להתווכח עם היעד היומי.',speaker:'אגם',quoteId:'q16',icon:'steps',choices:[
   {label:'משלבים הליכה בדרך למפגש.',hint:'35 דקות · צעדים עם כיוון',minutes:35,patience:6,ready:15,walk:true,reply:'הצעדים הפכו לחלק מהתוכנית. פתרון חשוד ברמת היעילות שלו.'},
   {label:'מחכים לו. מה כבר יכול לקרות?',hint:'60 דקות · כולם מתחילים להתפזר',minutes:60,patience:-15,ready:10,reply:'אגם התקדם. השעה גם. הסבלנות דווקא הלכה אחורה.'},
   {label:'משכנעים אותו להשלים אחר כך.',hint:'15 דקות · חוסכים זמן, משלמים בסבלנות',minutes:15,patience:-8,ready:8,reply:'אגם בא, אבל מכסת הצעדים תעלה שוב בשיחה.'}]},
  {id:'destination',title:'יפה. עכשיו לאן?',brief:'הבחירה הזאת קובעת איפה הערב יכול להסתיים.',speaker:'אגם',quoteId:'q11',icon:'pin',choices:[
   {label:'אוכל. מקום אחד. בלי סיבוב שני.',hint:'35 דקות · יעד: הדיינר',minutes:35,patience:12,ready:15,plan:'diner',reply:'נבחר מקום לאכול. אחד. התקנון של אגם נשמר.'},
   {label:'לטיילת. שקיעה, או מה שנשאר ממנה.',hint:'20 דקות · יעד: החוף',minutes:20,patience:5,ready:5,plan:'beach',reply:'הים לא צריך הזמנה. עכשיו צריך רק להביא לשם את החבורה.'},
   {label:'כולם אצל איתי. העיקר להיפגש.',hint:'15 דקות · יעד: הבית',minutes:15,patience:10,ready:10,plan:'home',reply:'אין דלת מסתובבת של מסעדה, אבל יש ספה. גם זה יעד.'}]},
  {id:'coordination',title:'הקבוצה פתחה דיון מחדש.',brief:'כבר הייתה תוכנית. עכשיו צריך להגן עליה.',speaker:'איתי',quoteId:'q1',icon:'chat',choices:[
   {label:'שולחים מקום ושעה. הודעה אחת.',hint:'10 דקות · חותכים את הרעש',minutes:10,patience:12,ready:15,reply:'מיקום, שעה, סוף פסוק. לקבוצה אין זמן להקים תת־ועדה.'},
   {label:'פותחים סקר. דמוקרטיה לפני הכול.',hint:'45 דקות · עוד סיבוב של דעות',minutes:45,patience:-18,ready:-5,reply:'הסקר נגמר בתיקו. גם התוכנית כרגע בתיקו.'},
   {label:'שכל אחד יציע משהו.',hint:'50 דקות · החופש להסתבך',minutes:50,patience:-25,ready:-10,reply:'התקבלו שמונה רעיונות. אף אחד מהם לא כולל לצאת עכשיו.'}]},
  {id:'departure',title:'הרגע האמיתי: יוצאים?',brief:'כל ההודעות בעולם לא מחליפות את הצעד הראשון מחוץ לדלת.',speaker:'רם',quoteId:'q5',icon:'flag',choices:[
   {label:'יוצאים עכשיו. נדבר בדרך.',hint:'15 דקות · צעד אחרון למשימה',minutes:15,patience:5,ready:15,reply:'הטלפון נכנס לכיס. לראשונה הערב, מישהו זז.'},
   {label:'רגע, תמונה לפני שיוצאים.',hint:'30 דקות · לפחות יהיו ראיות',minutes:30,patience:-8,ready:5,reply:'יש תמונה. עכשיו צריך לוודא שהיא לא תהיה כל הערב.'},
   {label:'אני רק נשכב לחמש דקות.',hint:'65 דקות · חמש דקות של החבורה',minutes:65,patience:-25,ready:-20,reply:'הספה קיבלה עוד משתתף. השעון לא עצר כדי להתחשב.'}]}
 ];
 const endings={
  cancelled:{label:'MISSION FAILED',title:'פוצץ.',text:'התוכנית נשארה בצ׳אט. הסבלנות או המוכנות נגמרו לפני שהערב התחיל.',badge:'יש תמיד מחר',art:'night',color:'pink'},
  late:{label:'MISSION TOO LATE',title:'יצאתם. לתוך מחר.',text:'השעון עבר את חצות ורבע. עד שסגרתם מה עושים, הערב החליף תאריך.',badge:'לילה לבן, תוכנית אפורה',art:'night',color:'purple'},
  home:{label:'MISSION ACCOMPLISHED',title:'כולם אצל איתי.',text:'היציאה הסתיימה בספה. אבל נפגשתם, וזה היה כל הרעיון.',badge:'יעד: חברות',art:'home',color:'aqua'},
  diner:{label:'MISSION PASSED',title:'הצלתם את הערב עם אוכל.',text:'לא הכול עבד לפי התוכנית, אבל יש שולחן וחבורה מסביבו. לפעמים זה מספיק.',badge:'צ׳יפס לפני עקרונות',art:'diner',color:'peach'},
  beach:{label:'MISSION PASSED',title:'הגעתם עד הים.',text:'מישהו מצא מסלול, מישהו יצא מהבית, וכולם הגיעו לאותה נקודה. זה כבר הישג קבוצתי.',badge:'החבורה על הטיילת',art:'beach',color:'aqua'},
  perfect:{label:'MISSION PASSED · GOLD',title:'יצאתם. כנגד כל הסיכויים.',text:'נהג או מסלול, יעד, שעה ואנשים שבאמת יצאו מהבית. תשמרו צילום מסך. לא יאמינו לכם.',badge:'אפס תירוצים. ערב אחד.',art:'drive',color:'peach'}
 };
 const clamp=n=>Math.min(100,Math.max(0,n));
 const initial=()=>({step:0,minutes:1200,patience:70,ready:25,ride:false,walk:false,plan:null,history:[],ending:null});
 function outcome(s){if(s.patience<=0||s.ready<25)return 'cancelled';if(s.minutes>=1455)return 'late';if(s.plan==='home')return 'home';if(!s.ride&&!s.walk)return 'cancelled';if(s.ready<60||s.patience<25)return 'diner';if(s.plan==='beach')return 'beach';if(s.plan==='diner'&&s.ready>=85&&s.patience>=65)return 'perfect';return 'diner'}
 function choose(state,index){if(state.ending||!Number.isInteger(index)||index<0||index>=stages[state.step]?.choices.length)return state;const c=stages[state.step].choices[index];const next={...state,step:state.step+1,minutes:state.minutes+c.minutes,patience:clamp(state.patience+c.patience),ready:clamp(state.ready+c.ready),history:[...state.history,{stage:stages[state.step].id,choice:index,label:c.label,reply:c.reply}]};for(const key of ['ride','walk','plan'])if(c[key]!==undefined)next[key]=c[key];if(next.patience<=0)next.ending='cancelled';else if(next.step===stages.length)next.ending=outcome(next);return next}
 function clock(minutes){const hours=Math.floor(minutes/60);return String(hours%24).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0')+(hours>=24?' · למחרת':'')}
 function score(s){return Math.max(0,Math.min(100,Math.round(s.ready*.45+s.patience*.4+Math.max(0,100-Math.max(0,s.minutes-1350)*.5)*.15)))}
 return {stages,endings,initial,choose,clock,score};
});
