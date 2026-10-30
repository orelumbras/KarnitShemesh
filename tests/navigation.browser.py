import sys
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(headless=True)
 page=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(sys.argv[1] if len(sys.argv)>1 else 'http://localhost:8000');page.locator('#archive-code').fill(page.evaluate('ARCHIVE.password'));page.locator('#login button[type=submit]').click();page.wait_for_timeout(3600)
 assert page.locator('.motion-toggle').count()==0
 assert page.evaluate("!document.body.classList.contains('gentle-motion')")
 assert page.locator('.hub-heading .motion-title-line').count()==2
 page.locator('.hub-cta').tap();page.wait_for_timeout(1300)
 home_y=page.evaluate('scrollY');assert home_y>100,home_y
 # Open a room, then return to the saved place rather than the hero.
 page.locator('.room-files').tap();page.wait_for_timeout(1400);assert page.locator('#files').is_visible();assert page.evaluate('scrollY')<50
 assert page.locator('#files .motion-title-line').count()==2
 page.evaluate('scrollTo(0,450)');page.wait_for_timeout(250)
 page.locator('.room-dock-back').tap();page.wait_for_timeout(1400);assert page.locator('#home').is_visible();assert abs(page.evaluate('scrollY')-home_y)<80,(home_y,page.evaluate('scrollY'))
 # Browser history restores both rooms and their positions.
 page.go_back();page.wait_for_timeout(1400);assert page.locator('#files').is_visible();assert abs(page.evaluate('scrollY')-450)<70,page.evaluate('scrollY')
 page.go_forward();page.wait_for_timeout(1400);assert page.locator('#home').is_visible();assert abs(page.evaluate('scrollY')-home_y)<80
 # Sheet switches directly between sections, is usable with mobile touch.
 page.locator('.room-switch').tap();assert page.locator('#room-picker').is_visible();page.locator('.picker-room[data-room=heart]').tap();page.wait_for_timeout(1500);assert page.locator('#heart').is_visible();assert not page.locator('#room-picker').is_visible()
 # Rapid changes cannot leave stale views or invisible content behind.
 page.evaluate("openArchiveRoom('files');openArchiveRoom('quiz');openArchiveRoom('chat-lab')");page.wait_for_timeout(1800);assert page.locator('#chat-lab').is_visible();assert page.evaluate("document.body.dataset.archiveRoom")=='chat-lab';assert page.locator('.motion-pending').count()==0
 # Reload preserves a room scroll position.
 page.evaluate('scrollTo(0,420)');page.wait_for_timeout(250);page.reload();page.wait_for_timeout(1400);assert page.locator('#chat-lab').is_visible();assert abs(page.evaluate('scrollY')-420)<100,page.evaluate('scrollY')
 for room in ['home','files','evidence','quiz','chat-lab','heart','memories','simulation']:
  page.evaluate('(id)=>openArchiveRoom(id)',room);page.wait_for_timeout(1250)
  assert page.locator('#'+room).is_visible(),room
  assert page.locator('.motion-pending').count()==0,room
  for width in [320,390,430]:
   page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(room,width)
 page.set_viewport_size({'width':390,'height':844});page.evaluate("openArchiveRoom('home')");page.wait_for_timeout(1500);page.screenshot(path='/tmp/motion-home.png',full_page=True)
 page.locator('.room-switch').tap();page.wait_for_timeout(500);page.screenshot(path='/tmp/motion-picker.png');page.locator('.picker-close').tap();page.wait_for_timeout(400)
 assert not errors,errors
 print('PASS: motion mode removed, animated title lines, room return position, browser back/forward, animated picker, rapid navigation, reload scroll, all rooms and 24 phone/room checks. No JS errors.')
 # OS reduced motion restores the current home position after viewport changes.
 reduced_home_y=page.evaluate('scrollY')
 page.emulate_media(reduced_motion='reduce');page.evaluate("openArchiveRoom('files')");page.wait_for_timeout(200);assert page.locator('#files').is_visible();assert page.locator('.motion-pending').count()==0
 page.locator('.room-dock-back').tap();page.wait_for_timeout(200);assert page.locator('#home').is_visible();assert abs(page.evaluate('scrollY')-reduced_home_y)<80,(reduced_home_y,page.evaluate('scrollY'))
 print('PASS: device reduced-motion fallback and non-top return.')
 b.close()
