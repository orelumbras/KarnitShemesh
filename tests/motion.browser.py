"""Coherent mobile motion QA; API writes are mocked.
Run: python tests/motion.browser.py [http://localhost:8000]
"""
import json
import sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8000'
ROOMS = ['home', 'files', 'evidence', 'quiz', 'chat-lab', 'heart', 'memories', 'simulation']
SIZES = [(320, 568), (390, 844), (430, 932), (844, 390), (1280, 844)]

def api(route):
    request = route.request
    assert '/notes' not in request.url or request.method != 'POST', 'The test never posts notes.'
    assert '/scores' not in request.url, 'The test never posts scores.'
    headers = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, X-Archive-Key', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'}
    if request.method == 'OPTIONS':
        route.fulfill(status=204, headers=headers, body='')
        return
    if '/arcade/runs' in request.url:
        data = {'runId': 'motion-qa-000000000000000000', 'seed': 17, 'version': 'crew-rush-1', 'createdAt': 0}
    elif '/arcade/' in request.url:
        data = {'allTime': [], 'today': [], 'version': 'crew-rush-1'}
    else:
        data = {'notes': [], 'next': None}
    route.fulfill(status=201 if '/runs' in request.url else 200, headers=headers, body=json.dumps(data))

def login(page):
    page.goto(URL)
    page.locator('#archive-code').fill(page.evaluate('ARCHIVE.password'))
    page.locator('#login button[type=submit]').click()
    page.wait_for_function('!document.querySelector("#archive").hidden')
    page.wait_for_timeout(650)

def wait_room(page, room):
    page.wait_for_function('(id)=>document.body.dataset.archiveRoom===id', arg=room)
    page.wait_for_timeout(650)
    assert page.locator('#' + room).is_visible()
    assert not page.locator('#' + room).evaluate("el=>!!el.closest('[inert]')")
    assert page.locator('#main').get_attribute('aria-busy') != 'true'
    assert page.locator('.motion-pending').count() == 0
    assert page.locator('.archive-page[data-route-layer]').count() == 0
    assert page.locator('.archive-page[inert]:not([hidden])').count() == 0

def room(page, name):
    page.evaluate('(id)=>openArchiveRoom(id)', name)
    wait_room(page, name)

def dock_box(page):
    return page.locator('.room-dock').bounding_box()

def close_enough(actual, expected):
    for key in ['x', 'y', 'width', 'height']:
        assert abs(actual[key] - expected[key]) < 2, (key, actual, expected)

def sheet_drag(page, dy, cancel=False):
    grip = page.locator('#room-picker .sheet-grip')
    box = grip.bounding_box()
    x, y = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
    page.mouse.move(x, y)
    page.mouse.down()
    for step in range(1, 11):
        page.mouse.move(x, y + dy * step / 10)
        page.wait_for_timeout(20)
    page.wait_for_timeout(100)
    if cancel:
        grip.dispatch_event('pointercancel', {'pointerId': 1, 'isPrimary': True})
    page.mouse.up()
    page.wait_for_timeout(420)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    context.route('**/api/**', api)
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    login(page)
    assert page.locator('.room-dock .dock-item').count() == 5
    assert page.locator('.motion-toggle').count() == 0
    # Four primary destinations stay one touch away; the fifth opens all rooms.
    original = dock_box(page)
    for target in ['files', 'simulation', 'memories', 'home']:
        page.locator('.room-dock a[href="#' + target + '"]').tap()
        wait_room(page, target)
        close_enough(dock_box(page), original)
        assert page.locator('.room-dock a[href="#' + target + '"]').get_attribute('aria-current') == 'page'
    # A new pointer/navigation action wins while the preceding transition is moving.
    page.locator('.room-dock a[href="#files"]').tap()
    page.wait_for_timeout(60)
    page.locator('.room-dock a[href="#memories"]').tap()
    page.wait_for_timeout(50)
    page.locator('.room-dock a[href="#simulation"]').tap()
    wait_room(page, 'simulation')
    assert page.locator('.room-dock a[href="#simulation"]').get_attribute('aria-current') == 'page'
    room(page, 'files')
    page.evaluate('scrollTo(0,650)')
    page.wait_for_timeout(250)
    title = page.locator('.app-context-title')
    assert title.get_attribute('aria-hidden') == 'false'
    assert title.get_attribute('tabindex') == '0'
    # Primary tabs preserve each room's reading position; reselecting goes to top.
    page.locator('.room-dock a[href="#simulation"]').tap()
    wait_room(page, 'simulation')
    page.locator('.room-dock a[href="#files"]').tap()
    wait_room(page, 'files')
    assert abs(page.evaluate('scrollY') - 650) < 3
    title.tap()
    page.wait_for_timeout(650)
    assert page.evaluate('scrollY') < 20
    page.evaluate('scrollTo(0,450)')
    page.wait_for_timeout(120)
    page.locator('.room-dock a[href="#files"]').tap()
    page.wait_for_timeout(650)
    assert page.evaluate('scrollY') < 20, 'Retapping the selected tab returns to its top.'
    page.screenshot(path='/tmp/polish-room.png')
    # Real sheet gestures: a small pull returns to rest; a cancelled big pull cannot dismiss.
    page.locator('.room-switch').tap()
    page.wait_for_timeout(420)
    sheet_drag(page, 45)
    assert page.locator('#room-picker').is_visible()
    sheet_drag(page, 140, cancel=True)
    assert page.locator('#room-picker').is_visible()
    # Reversing a close keeps the same native dialog open; stale completions cannot close it.
    result = page.evaluate('''async()=>{const d=document.querySelector('#room-picker');let closes=0;const onclose=()=>closes++;d.addEventListener('close',onclose);const closing=archiveDialogs.close(d);await new Promise(r=>setTimeout(r,75));archiveDialogs.open(d);const completed=await closing;await new Promise(r=>setTimeout(r,450));d.removeEventListener('close',onclose);return {open:d.open,closes,completed}}''')
    assert result['open'] and result['closes'] == 0 and result['completed'] is False, result
    page.locator('.picker-close').tap()
    page.wait_for_timeout(350)
    assert not page.locator('#room-picker').is_visible()
    assert page.locator('.room-switch').evaluate('el=>el===document.activeElement')
    page.locator('.room-switch').tap()
    page.wait_for_timeout(420)
    sheet_drag(page, 150)
    assert not page.locator('#room-picker').is_visible()
    # Native dialog focus and asynchronous photo loading remain intact.
    room(page, 'files')
    person = page.locator('.person').first
    person.tap()
    page.wait_for_timeout(420)
    assert page.locator('#dossier').is_visible()
    page.locator('#close-dossier').tap()
    page.wait_for_timeout(350)
    assert person.evaluate('el=>el===document.activeElement')
    room(page, 'evidence')
    photo = page.locator('#gallery button').first
    photo.tap()
    page.wait_for_function('document.querySelector("#full-photo").naturalWidth>0')
    assert page.locator('#lightbox').is_visible()
    page.locator('#close-lightbox').tap()
    page.wait_for_timeout(350)
    assert photo.evaluate('el=>el===document.activeElement')
    room(page, 'memories')
    page.locator('.wall-new').tap()
    page.wait_for_timeout(420)
    assert page.locator('.note-dialog').is_visible()
    page.locator('.note-close').tap()
    page.wait_for_timeout(350)
    assert page.locator('.wall-new').evaluate('el=>el===document.activeElement')
    room(page, 'simulation')
    page.wait_for_function('!document.querySelector(".arcade-start").disabled')
    page.locator('.arcade-start').tap()
    page.wait_for_function('document.querySelector(".arcade-stage").dataset.mode==="running"')
    assert page.locator('.room-dock').is_hidden()
    page.locator('.arcade-pause').tap()
    page.wait_for_function('document.querySelector(".arcade-stage").dataset.mode==="paused"')
    page.locator('.arcade-overlay-exit').tap()
    assert page.locator('.arcade-stage').is_hidden()
    assert page.locator('.room-dock').is_visible()
    # Every room stays readable with the same dock geometry at each selected width.
    for width, height in SIZES:
        page.set_viewport_size({'width': width, 'height': height})
        page.wait_for_timeout(150)
        baseline = dock_box(page)
        for name in ROOMS:
            room(page, name)
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), (name, width, height)
            close_enough(dock_box(page), baseline)
            box = dock_box(page)
            assert box['x'] >= 0 and box['x'] + box['width'] <= width + 1, box
            assert box['y'] >= 0 and box['y'] + box['height'] <= height + 1, box
    assert not errors, errors
    print('PASS: stable five-tab navigation, fast retargeting, collapsing header, reversible sheets, drag cancel/dismiss, native focus, photos, note composer, arcade isolation and all eight rooms at five viewport sizes. No JavaScript errors or production API writes.')
    context.close()
    # The same route engine also works without native View Transitions and with OS reduced motion.
    fallback = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    fallback.add_init_script('document.startViewTransition=undefined')
    fallback.route('**/api/**', api)
    page = fallback.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    login(page)
    for name in ['files', 'memories']:
        room(page, name)
    page.emulate_media(reduced_motion='reduce')
    for name in ['files', 'memories', 'heart', 'home']:
        page.evaluate('(id)=>openArchiveRoom(id)', name)
        page.wait_for_timeout(80)
        assert page.locator('#' + name).is_visible()
        assert page.locator('#main').get_attribute('aria-busy') != 'true'
        assert page.locator('.motion-pending').count() == 0
    assert not errors, errors
    print('PASS: device reduced motion and no-native-transition fallback show content immediately.')
    fallback.close()
    browser.close()
