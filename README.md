# ארכיון קרנית שמש

אתר סטטי בעברית, מותאם לטלפון. קבצי האתר נמצאים בשורש המאגר.

## הפעלה

אין צורך בהתקנה או בבנייה. אפשר להעלות את קובצי השורש ואת תיקיית `assets` לכל אחסון סטטי. סיסמת הכניסה הנוכחית: **פוצץ**.

## GitHub Pages

1. קובצי האתר, כולל `.nojekyll`, כבר נמצאים בשורש המאגר.
2. ב־Settings → Pages בחרו Deploy from a branch, את הענף הראשי, ו־`/ (root)`.
3. שמרו והמתינו לסיום הפריסה. GitHub יציג את כתובת האתר.
4. בדקו את הכתובת בטלפון שאינו מחובר לחשבון GitHub ורק אז צרו QR לכתובת הסופית.

כל כתובות הנכסים יחסיות, כך שהאתר מתאים גם לנתיב משנה של GitHub Pages.

## עריכה

- `content.js`: סיסמה, תיקים אישיים, פרסים, תחזיות ותמונות.
- `style.css`: עיצוב הבסיס והאפקטים של הארכיון.
- `studio.css`: עיצוב שקיעה בהשראת מיאמי, פונט Karantina והתאמות מובייל. נטען אחרי עיצוב הבסיס.
- `hub.js`: חדר הבקרה והניווט בין ששת האגפים.
- הפונט המקורי Karantina נטען מקומית מתוך `assets`, ללא תלות בשירות פונטים חיצוני.
- `app.js`: כניסה, נעילה, חיפוש, חלונות תיקים, סימולציה וגלריה.
- `index.html`: מבנה האתר והטקסטים הראשיים.

### תמונות

הוסיפו את התמונות לתיקיית `assets/photos`, ועדכנו ב־`content.js` את `photos`, לדוגמה:

```js
photos: [
  {src:'assets/photos/01.jpg', title:'ערב אצל החבורה', category:'ביחד', alt:'חברי הקבוצה יושבים יחד'}
],
```

הגלריה תופיע אוטומטית עם סינון לפי קטגוריות, פתיחה בגודל מלא, חיצים ומקלדת. ללא תמונות מוצג מסך המתנה מכוון. התמונות אינן מועלות דרך הדפדפן ואינן נשמרות במכשיר המבקר.

הסיסמה היא אפקט עיצובי בלבד: היא וקובצי האתר זמינים בקוד. אינה מגינה על התוכן או על התמונות. אין אנליטיקה. קיר הפתקים משתמש בשרת ובמסד נתונים לשמירת ההודעות שפורסמו. מצב הכניסה נשמר רק ללשונית הפעילה באמצעות sessionStorage. כפתור יאנקו פותח את הסרטון הרשמי ביוטיוב בלשונית נפרדת.

התוכן מבוסס על הספר שסופק. כל התיקים מנוסחים ברוח הספר; אין מדובר במסמכים רשמיים. לרם ולאיליי אין בספר תיק מפורט, והאתר מציין זאת.

## מהצ׳אט לקיר של החבורה

`memories-data.js` שומר ציטוטים נבחרים וספירות מצטברות בלבד מתוך הייצוא. `memories.js` מציג רגע יומי, נתוני פעילות ונספחים לתיקים. הייצוא הגולמי נשאר מחוץ למאגר. הנתונים כוללים מדיה ורשומות מערכת: 137,458 רשומות, 11,940 סטיקרים שהושמטו ו־168 רשומות עם ״פוצץ״ כמילה עצמאית. הכיסוי הוא 03.05.2022–25.10.2026.

האגף `#memories` הוא כעת קיר פתקים משותף במקום ציר הזמן. `wall.js` ו־`wall.css` מספקים כתיבת שם ותוכן, צבעי נייר, טעינת פתקים ישנים והורדת גיבוי JSON של כל הקיר. פתקים שנשלחו נשמרים ב־Cloudflare D1 דרך שירות Sites נפרד; טיוטה שלא נשלחה נשמרת רק במכשיר. אין מחיקה אוטומטית או פקיעת תוקף לפתקים. השמירה תלויה בהמשך פעילות האחסון, ולכן יש אפשרות לגיבוי.

פרטי השירות והעתק קוד השרת והסכמה נמצאים ב־`backend/wall`. פריסות מתבצעות באמצעות Sites לפרויקט הרשום שם; אין ליצור מחדש מסד נתונים לפריסת עדכון. ההודעות מתפרסמות לכל מי שנכנס לאתר. השם הוא טקסט חופשי ולא זהות מאומתת. מילת הקוד הקיימת נבדקת גם בשרת, אך אינה הגנה חזקה: היא כבר זמינה בקוד האתר. אין לשמור כאן מידע סודי. הסוד `WALL_GATE_SHA256` מוגדר רק בסביבת השרת ואינו נכלל בארכיון הפריסה.

השרת משתמש בשאילתות מוכנות, מגבלות אורך, הגבלת קצב וקודי בקשה ייחודיים למניעת כפילות בניסיון חוזר. כתיבה מוצגת כמוצלחת רק אחרי אישור שרת; בכשל הטיוטה נשמרת. אין ממשק עריכה או מחיקה של פתקים שפורסמו. API עם דפדפן מאושר דרך CORS; אין להטמיע סוד גישה של Sites בדפדפן.

## אוספים את החבורה — Crew Rush

משחק נהיגה מתמשך לנייד: אין מסלול קבוע, שעון הפסד או עצירה בסוף שלב. אוספים את ששת החברים, מקבלים בונוס ומתחילים סבב נוסף באותה נסיעה. שלושה חיים; צפיפות התנועה, מהירותה ותדירות חסימות של שני נתיבים עולות עם ההתקדמות. מסדרון בטוח יכול לזוז נתיב אחד בין שורות, והניקוד מתגמל איסוף רצוף ועקיפות קרובות. החמצת חבר או פגיעה מאפסות את הרצף. החזקת ניטרו מגבירה מהירות וניקוד, מכלה מטען וכוללת נעילת טעינה בהתרוקנות. ריצה ארוכה במיוחד מסתיימת אחרי 15 דקות; זהו גבול הריצה המדורגת ולא שעון שמוצג למשתמש.

- `arcade-engine.js`: סימולציה דטרמיניסטית של 60 צעדים לשנייה, משותפת לדפדפן ולשרת. אין תלות בקצב הציור או באקראיות של הדפדפן לצורך חישוב ציון.
- `arcade.js` ו־`arcade.css`: שליטה בהחלקה/לחצנים ובניטרו מוחזק, הליכה בארבעה פריימים, פורטרטים גדולים, תגובות איסוף והתנגשות, הפסקה אוטומטית ברקע, סיכום ריצה ושמירה מפורשת ללוח. אין איפוס חיים בין סבבי האיסוף. העדפת תנועה מופחתת מכבה אפקטים דקורטיביים.
- `arcade-art.js` ו־`assets/arcade/v2`: שישה פורטרטים מהאיורים הגדולים שסופקו, 24 פריימים שקופים חדשים להליכה, שישה רכבים שקופים וכביש מיאמי חדש. כ־2.2MiB בסך הכול, נטענים בכניסה למשחק. אין חיתוך מהדמויות הקטנות באטלס ואין הסרת רקע בזמן המשחק.
- `arcade-online.js`: חיבור לשרת המשותף, שם של עד שש אותיות Unicode, שמירת שם וניסיון שמירה חוזר לתוצאה שנכשלה. ריצה ללא חיבור יכולה להישמר כשיא במכשיר; כניסה ללוח המשותף דורשת כרטיס ריצה מהשרת.
- `backend/arcade`: עותק הקוד, המנוע, הסכמה והמיגרציה של שרת Sites הקיים. הוא שומר כרטיסי ריצה ותוצאות ב־D1 לצד קיר הפתקים. השרת משחזר את הקלט ומחשב את הציון בעצמו; אין אמון בשדה ציון שנשלח מהלקוח. כל הזמנים והיום מציגים את השיא לכל שם, עד 20 שמות. היום מתחלף לפי שעון ישראל. אין חיבור לחשבון אישי; זהו לוח לחבורה לפי השמות שבחרו.

בדיקות: `node tests/arcade-engine.test.cjs`, `node tests/arcade-api.test.mjs`, `node tests/wall-api.test.mjs`. בדיקות המנוע כוללות התקדמות וקושי, פגיעות, רצפים, ניטרו ושחזור מדויק; בדיקות API מריצות מיגרציות ושמירת תוצאה מול SQLite מקומי, כולל ניסיונות חוזרים, דירוג, מגבלות שם ואימות קלט. בדיקת הדפדפן `python tests/arcade.browser.py` משתמשת בתשובות שרת מדומות ואינה מוסיפה תוצאות בדיקה ללוח החי.

## איורים לכל אגף

שבעה איורים מקוריים חדשים למסך הבית, התיקים, הראיות, החידון, המודיעין, החברות והזיכרונות, לצד איור המשחק הקיים. `section-art.js` משייך את הסצנה לכרטיס הכניסה ולכותרת האגף; `section-art.css` שומר על קריאות הכותרות וחיתוך מותאם לנייד. התמונות הן איורים דקורטיביים ואינן חלק מגלריית הצילומים או תיעוד אמיתי של החבורה.

כל שמונת קובצי התצוגה נמצאים ב־`assets/sections` בפורמט WebP, ברזולוציה 1536×1024 ובמשקל של כ־232–329KB לקובץ. תמונת הפתיחה נטענת בעדיפות גבוהה, הכרטיסים מוכנים כשהם מתקרבים למסך ותמונות האגפים האחרים נטענות לפי הצורך. קובצי המקור שנוצרו נשמרו בסביבת העבודה ללא שינוי; אין תלות בשירות תמונות חיצוני.

## תנועה וניווט בין אגפים

`motion.js` ו־`motion.css` מוסיפים כניסת כותרות לפי שורות, חשיפה מדורגת של תוכן בגלילה, תנועה באיורים, תגובת מגע, מונים, פתיחת חלונות ותפריט אגפים תחתון. התנועה מבוססת על opacity/translate/scale ועל IntersectionObserver; תנועה באיורים נעצרת כשהם מחוץ למסך. אין יותר כפתור או מצב ידני של ״תנועה עדינה״. העדפת התנועה המופחתת של מערכת ההפעלה עדיין מכובדת אוטומטית.

הניווט ב־`hub.js` משתמש ב־View Transitions כשיש תמיכה כדי להעביר את האיור מהכרטיס לכותרת האגף ובחזרה. בדפדפנים אחרים הכניסה לתוכן נעשית באנימציות מקומיות. מעבר מהיר מבטל את המעבר הקודם; יש טיפול בדחיית הבטחת `ready` בעת ביטול.

החזרה לחדר הבקרה משחזרת את מקום בחירת האגפים ולא את הפתיח העליון. מיקומי הגלילה נשמרים ב־sessionStorage ובהיסטוריה של הלשונית, כולל אחורה/קדימה ורענון. במעבר מאגף שנפתח ללא גלילה קודמת בבית, החזרה מכוונת לבחירת האגפים. הלוגו בבית מאפשר לעלות לפתיח. בורר האגפים נפתח כ־dialog עם תמיכה במקלדת ומאפשר מעבר ישיר בין כל האגפים; הוא מוסתר בזמן משחק במסך מלא.

בדיקת דפדפן אופציונלית (לאחר התקנת Python Playwright ודפדפן Chromium): `python tests/navigation.browser.py http://localhost:8000`. הבדיקה מכסה חזרה למקום, אחורה/קדימה, רענון, בחירה מהתפריט, ניווט מהיר, ביטול המצב הישן, כל האגפים ו־24 שילובי רוחב/אגף, וכן העדפת תנועה מופחתת של המכשיר. הבדיקה אינה מפרסמת פתקים בקיר המשותף.

## Mobile app polish

Reading text uses the supplied Kammer Regular (400) from assets/fonts; display headings retain Karantina. app-shell.css and app-shell.js provide the compact mobile home, direct shortcuts, a local last-room shortcut, contextual bottom navigation, keyboard-aware dock visibility, bottom-sheet dialogs, and swipe photo navigation. The gallery starts paused and its arrows follow RTL scroll coordinates. Ambient artwork loops are disabled; reveals are shorter and do not repeat when returning to content. Browsers without View Transitions receive a short local entrance instead. Reduced-motion preferences still disable motion.

Validation: JavaScript syntax and Git whitespace checks pass. The existing browser navigation script was updated for the shorter home. The later interaction refinement was checked in the in-app browser as described below.


## Interaction refinement

`interactions.js` and `interactions.css` own press/release feedback, dialog opening and closing, mobile sheet gestures, and shared motion timing. Dialogs keep their native modal focus behavior and restore focus to their opener; mobile close controls remain visible while scrolling. Short drags spring back, deliberate drags dismiss, and movement during a press cancels its feedback. Reduced motion and background-tab changes cancel active effects.

Room transitions keep the header and dock stationary, avoid replaying an entrance over the incoming screen, and yield to new pointer input. The group content order now puts the intelligence heading before awards and forecasts, and the friendship section before its archive introduction. Text and content are retained.

Photos reserve their intrinsic dimensions. The viewer waits for decoding, reports loading/errors, ignores stale requests, and prepares adjacent photos. Search has a clear action and result count. Filters and quiz results have focused feedback. The game uses a centered canvas with matching drawing dimensions on wide screens and a compact landscape HUD; unchanged HUD values are no longer rewritten repeatedly. Its engine and rules are unchanged.

Validation: eight sections checked at widths 320, 390, 430, 768, and 1280 in the in-app browser, with no horizontal overflow observed. Checked dialog opening/closing, sticky close controls, short/long drag behavior, focus restoration, search/clear, photo decoding and next-photo controls, room picker, browser back/forward, note-form opening/closing without posting, and game start/pause/exit. Game canvas sizes were checked in portrait, landscape, and desktop viewports. No JavaScript warnings or errors were observed. JavaScript syntax checks, Git whitespace checks, and the arcade engine suite passed. Physical-device frame pacing and OS reduced-motion emulation were not measured in this browser session; a fixed 60 FPS rate is not claimed.
