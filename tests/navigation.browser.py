"""Optional mobile navigation regression. No production API writes.
Run: python tests/navigation.browser.py [http://localhost:8000]
"""
import json
import sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8000'
ROOMS = ['home', 'files', 'evidence', 'quiz', 'chat-lab', 'heart', 'memories', 'simulation']

def mock_api(route):
    request = route.request
    assert request.method in ['GET', 'OPTIONS'], 'Navigation must never publish records.'
    headers = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, X-Archive-Key'}
    data = {'allTime': [], 'today': [], 'version': 'crew-rush-1'} if '/arcade/' in request.url else {'notes': [], 'next': None}
    route.fulfill(status=204 if request.method == 'OPTIONS' else 200, headers=headers, body='' if request.method == 'OPTIONS' else json.dumps(data))

def settled(page, room):
    page.wait_for_function('(room)=>document.body.dataset.archiveRoom===room', arg=room)
    page.wait_for_timeout(650)
    assert page.locator('#' + room).is_visible(), room
    assert not page.locator('#' + room).evaluate("el=>!!el.closest('[inert]')"), room
    assert page.locator('#main').get_attribute('aria-busy') != 'true', room
    assert page.locator('.motion-pending').count() == 0, room

def open_room(page, room):
    page.evaluate('(room)=>openArchiveRoom(room)', room)
    settled(page, room)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    context.route('**/api/**', mock_api)
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(URL)
    page.locator('#archive-code').fill(page.evaluate('ARCHIVE.password'))
    page.locator('#login button[type=submit]').click()
    page.wait_for_function('!document.querySelector("#archive").hidden')
    settled(page, 'home')
    assert page.locator('.motion-toggle').count() == 0
    assert page.evaluate("!document.body.classList.contains('gentle-motion')")
    assert page.locator('.hub-heading .motion-title-line').count() == 2
    page.locator('.hub-cta').tap()
    page.wait_for_timeout(800)
    home_y = page.evaluate('scrollY')
    assert home_y > 100, home_y
    page.locator('.room-files').tap()
    settled(page, 'files')
    assert page.evaluate('scrollY') < 50
    page.evaluate('scrollTo(0,450)')
    page.wait_for_timeout(180)
    page.locator('.room-dock-back').tap()
    settled(page, 'home')
    assert abs(page.evaluate('scrollY') - home_y) < 80, (home_y, page.evaluate('scrollY'))
    page.go_back()
    settled(page, 'files')
    assert abs(page.evaluate('scrollY') - 450) < 70, page.evaluate('scrollY')
    page.go_forward()
    settled(page, 'home')
    assert abs(page.evaluate('scrollY') - home_y) < 80
    page.locator('.room-switch').tap()
    page.locator('#room-picker').wait_for(state='visible')
    page.locator('.picker-room[data-room=heart]').tap()
    settled(page, 'heart')
    assert not page.locator('#room-picker').is_visible()
    page.evaluate("openArchiveRoom('files');openArchiveRoom('quiz');openArchiveRoom('chat-lab')")
    settled(page, 'chat-lab')
    page.evaluate('scrollTo(0,420)')
    page.wait_for_timeout(200)
    page.reload()
    settled(page, 'chat-lab')
    assert abs(page.evaluate('scrollY') - 420) < 100, page.evaluate('scrollY')
    for room in ROOMS:
        open_room(page, room)
        for width in [320, 390, 430]:
            page.set_viewport_size({'width': width, 'height': 844})
            page.wait_for_timeout(80)
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), (room, width)
    page.set_viewport_size({'width': 390, 'height': 844})
    open_room(page, 'home')
    page.screenshot(path='/tmp/polish-home.png', full_page=True)
    page.locator('.room-switch').tap()
    page.wait_for_timeout(450)
    page.screenshot(path='/tmp/polish-picker.png')
    page.locator('.picker-close').tap()
    page.wait_for_timeout(350)
    reduced_home_y = page.evaluate('scrollY')
    page.emulate_media(reduced_motion='reduce')
    open_room(page, 'files')
    page.locator('.room-dock-back').tap()
    settled(page, 'home')
    assert abs(page.evaluate('scrollY') - reduced_home_y) < 80, (reduced_home_y, page.evaluate('scrollY'))
    assert not errors, errors
    print('PASS: section selection, return position, browser history, direct picker, rapid navigation, reload scroll, eight rooms at three phone widths, device motion preference and no manual toggle. No JavaScript errors or API writes.')
    context.close()
    browser.close()
