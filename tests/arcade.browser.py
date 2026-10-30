"""Optional mobile browser QA. All arcade API requests are mocked; no live scores are posted.
Run: python tests/arcade.browser.py [http://localhost:8000]
Requires Python Playwright and its Chromium browser.
"""
import json
import sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8000'
VERSION = 'crew-rush-1'
WATCH_STATE = """
(() => {
 let engine;
 Object.defineProperty(window, 'KarnitArcade', {configurable:true,
  get(){return engine}, set(value){engine=value;const tick=value.tick;
   value.tick=function(state){window.__arcadeState=state;return tick(state)};
  }});
})();
"""

def check_fit(page, width, height):
    page.set_viewport_size({'width': width, 'height': height})
    page.wait_for_timeout(120)
    geometry = page.evaluate("""() => {
      const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
      return {canvas:box('.arcade-canvas'),hud:box('.arcade-hud'),controls:box('.arcade-controls'),
       overflow:document.documentElement.scrollWidth>innerWidth,viewport:{width:innerWidth,height:innerHeight}};
    }""")
    assert not geometry['overflow'], (width, height, geometry)
    for name in ['canvas', 'hud', 'controls']:
        r = geometry[name]
        assert r['x'] >= -1 and r['right'] <= width + 1, (width, height, name, r)
        assert r['y'] >= -1 and r['bottom'] <= height + 1, (width, height, name, r)
    assert geometry['controls']['y'] - geometry['hud']['bottom'] >= 140, geometry

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    context.add_init_script(WATCH_STATE)
    posts=[]
    run_count=0
    fail_save=True
    run_requests_fail=False
    all_time=[{'id':'leader-000000000001','rank':1,'name':'המלך','score':200000,'level':8,'deliveries':9,'totalCollected':54,'createdAt':'2026-10-29T12:00:00.000Z'}]
    today=[]
    def api(route):
        global run_count, fail_save
        request=route.request
        path=request.url.split('/api/',1)[-1].split('?',1)[0]
        headers={'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type, X-Archive-Key','Access-Control-Allow-Methods':'GET, POST, OPTIONS'}
        def reply(data,status=200): route.fulfill(status=status,headers=headers,body=json.dumps(data,ensure_ascii=False))
        if request.method=='OPTIONS':
            route.fulfill(status=204,headers=headers,body='');return
        if path=='arcade/leaderboard': reply({'allTime':all_time,'today':today,'version':VERSION,'day':'2026-10-29'});return
        if path=='arcade/runs':
            assert request.method=='POST' and request.post_data_json=={}
            if run_requests_fail:
                reply({'error':'storage_unavailable'},503);return
            run_count+=1
            reply({'runId':f'qa-run-{run_count:020d}','seed':17+run_count,'version':VERSION,'createdAt':'2026-10-29T12:00:00.000Z'},201);return
        if path=='arcade/scores':
            assert request.method=='POST'
            payload=request.post_data_json
            posts.append(payload)
            if fail_save:
                fail_save=False;reply({'error':'storage_unavailable'},503);return
            # Compute the mocked server result with exactly the shared replay, not posted score.
            result=page.evaluate('(p)=>{const s=KarnitArcade.replay(18,p.actions,p.steps);return {score:s.score,level:s.level,deliveries:s.deliveries,totalCollected:s.totalCollected,ended:s.ended}}',payload)
            assert result['ended']
            entry={'id':payload['runId'],'name':payload['name'],'rank':2,'score':result['score'],'level':result['level'],'deliveries':result['deliveries'],'totalCollected':result['totalCollected'],'createdAt':'2026-10-29T12:00:00.000Z'}
            all_time.append(entry);today.append({**entry,'rank':1})
            reply({'entry':entry,'duplicate':False},201);return
        # Other APIs are blocked locally so this test cannot post real notes or scores.
        reply({'notes':[],'next':None})
    context.route('**/api/**',api)
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda error: errors.append(str(error)))
    page.goto(URL)
    if page.locator('#archive-code').is_visible():
        page.locator('#archive-code').fill(page.evaluate('ARCHIVE.password'))
        page.locator('#login button[type=submit]').click()
    page.wait_for_function('!document.querySelector("#archive").hidden')
    page.evaluate("openArchiveRoom('simulation')")
    page.locator('.arcade-start').wait_for(state='visible')
    page.wait_for_function('!document.querySelector(".arcade-start").disabled',timeout=30000)
    page.wait_for_timeout(800)
    assert page.locator('.arcade-intro-crew img').count()==6
    assert page.evaluate('[...document.querySelectorAll(".arcade-intro-crew img")].every(i=>i.naturalWidth>=150&&i.naturalHeight>=120)'), 'Portraits must use the large artwork.'
    assert page.locator('.arcade-timer').count()==0
    page.screenshot(path='/tmp/karnit-rush-intro.png',full_page=True)
    assert page.locator('.arcade-board-list li').count()==1
    page.locator('[data-period=today]').click()
    assert page.locator('.arcade-board-list li').count()==0
    page.locator('[data-period=allTime]').click()
    page.locator('.arcade-start').click()
    page.wait_for_function('document.querySelector(".arcade-stage").dataset.mode==="running"')
    assert page.locator('body').evaluate('e=>e.classList.contains("arcade-active")')
    assert page.locator('.room-dock').is_hidden()
    # Genuine UI steering and hold/cancel boost; recorded actions must replay exactly.
    page.locator('[data-move="-1"]').tap()
    page.locator('[data-move="1"]').tap()
    nitro=page.locator('.arcade-nitro').bounding_box()
    page.mouse.move(nitro['x']+nitro['width']/2,nitro['y']+nitro['height']/2)
    page.mouse.down()
    page.wait_for_timeout(180)
    assert page.evaluate('__arcadeState.boostHeld')
    page.locator('.arcade-nitro').dispatch_event('pointercancel',{'pointerId':1,'isPrimary':True})
    page.mouse.up()
    page.wait_for_timeout(60)
    assert not page.evaluate('__arcadeState.boostHeld')
    page.screenshot(path='/tmp/karnit-rush-play.png')
    page.locator('.arcade-pause').click()
    page.wait_for_function('document.querySelector(".arcade-stage").dataset.mode==="paused"')
    paused=page.evaluate('__arcadeState.tick')
    page.wait_for_timeout(300)
    assert page.evaluate('__arcadeState.tick')==paused
    for size in [(320,568),(390,844),(430,932),(844,390)]: check_fit(page,*size)
    page.set_viewport_size({'width':390,'height':844})
    page.locator('.arcade-overlay-action').click()
    page.wait_for_function('document.querySelector(".arcade-stage").dataset.mode==="running"')
    page.wait_for_function('document.querySelector(".arcade-stage").dataset.mode==="ended"',timeout=20000)
    assert page.evaluate('__arcadeState.reason')=='crash'
    final=page.evaluate('({score:__arcadeState.score,tick:__arcadeState.tick})')
    assert page.locator('.arcade-score-form').is_visible()
    page.locator('#arcade-name').fill('אבגדהוז12!')
    assert page.locator('#arcade-name').input_value()=='אבגדהו'
    page.locator('.arcade-score-form button').click()
    page.wait_for_function('KarnitScores.pending()!==null')
    page.wait_for_function('document.querySelector(".arcade-save-status").textContent.includes("לא הסתיימה")')
    assert len(posts)==1 and posts[0]['name']=='אבגדהו'
    assert posts[0]['steps']==final['tick']
    assert any(a['k']=='m' for a in posts[0]['actions']) and any(a['k']=='b' for a in posts[0]['actions'])
    replay=page.evaluate('(p)=>{const s=KarnitArcade.replay(18,p.actions,p.steps);return {score:s.score,tick:s.tick,ended:s.ended}}',posts[0])
    assert replay['ended'] and replay['score']==final['score'] and replay['tick']==final['tick'], (replay,final)
    # Pending results survive an actual reload, then clear only after acknowledged save.
    page.reload()
    page.wait_for_function('document.body.dataset.archiveRoom==="simulation"')
    page.wait_for_function('!document.querySelector(".arcade-start").disabled',timeout=30000)
    page.locator('.arcade-pending-retry').wait_for(state='visible')
    page.locator('.arcade-pending-retry').click()
    page.wait_for_function('KarnitScores.pending()===null')
    page.wait_for_function('document.querySelectorAll(".arcade-board-list li").length===2')
    assert posts[0]==posts[1]
    assert page.locator('.arcade-board-list .is-mine').count()==1
    assert 'אבגדהו' in page.locator('.arcade-board-list').inner_text()
    page.locator('[data-period=today]').click()
    assert page.locator('.arcade-board-list li').count()==1
    # Server unavailable: a local run remains playable, with an honest unranked result.
    run_requests_fail=True
    page.locator('.arcade-start').click()
    page.wait_for_function('document.querySelector(".arcade-stage").dataset.mode==="running"')
    page.wait_for_function('document.querySelector(".arcade-stage").dataset.mode==="ended"',timeout=20000)
    assert page.locator('.arcade-score-form').is_hidden()
    assert 'במכשיר' in page.locator('.arcade-save-status').inner_text()
    page.locator('.arcade-overlay-exit').click()
    assert page.locator('.arcade-stage').is_hidden()
    assert not page.locator('body').evaluate('e=>e.classList.contains("arcade-active")')
    assert not errors,errors
    print('PASS: large portraits, mobile HUD bounds (4 sizes), live inputs + nitro cancel, pause/resume, natural crash, deterministic replay, six-letter name, saved-score retry across reload, shared board tabs, offline local run and clean exit. No JavaScript errors; all API requests mocked.')
    context.close();browser.close()
