const assert=require('node:assert/strict'),g=require('../arcade-engine.js');
assert.deepEqual(g.friends,['אביחי','אוראל','עידן','אגם','יאנקו','איתי']);assert.equal(g.zones.length,12);assert.equal(new Set(g.zones.map(z=>z[1])).size,12);
let s=g.create(7);assert.equal(s.left,100);assert.equal(s.lives,4);g.move(s,-1);g.move(s,-1);assert.equal(s.lane,0);g.move(s,1);g.move(s,1);g.move(s,1);assert.equal(s.lane,2);
s=g.create(8);g.add(s,'friend',1,.78,'איתי');g.tick(s,.016);assert.deepEqual(s.collected,['איתי']);assert.equal(s.score,175);g.add(s,'friend',1,.78,'איתי');g.tick(s,.016);assert.equal(s.totalCollected,1);assert.equal(s.score,175);
s=g.create();s.invincible=0;g.add(s,'car',1,.78);g.tick(s,.016);assert.equal(s.lives,3);g.add(s,'cone',1,.78);g.tick(s,.016);assert.equal(s.lives,3,'temporary immunity prevents double damage');
s=g.create();s.left=10;g.add(s,'clock',1,.78,null,{bonus:30});g.tick(s,.016);assert(s.left>39.9);assert.equal(s.score,75);
s=g.create();g.add(s,'shield',1,.78);g.tick(s,.016);assert(s.shield>0);s.invincible=0;g.add(s,'car',1,.78);g.tick(s,.016);assert.equal(s.lives,4);assert.equal(s.shield,0);
s=g.create();g.add(s,'slow',1,.78);g.tick(s,.016);assert(s.slow>0);
s=g.create();for(let level=1;level<=50;level++){
 assert.equal(s.level,level);assert(!s.ended);for(const f of g.friends)g.add(s,'friend',1,.78,f);g.tick(s,.016);assert(s.cleared);assert(!s.ended,'collecting the crew must NOT end the run');assert.equal(s.collected.length,6);assert.equal(s.totalCollected,level*6);const score=s.score,time=s.elapsed;g.tick(s,1);assert.equal(s.score,score,'clear bonus cannot repeat');assert.equal(s.elapsed,time,'level intermission must freeze the clock');assert(g.nextLevel(s));assert.equal(s.collected.length,0);assert.equal(s.objects.length,0);assert.equal(s.score,score);assert(s.left>=100&&s.left<=130);assert(s.lives<=5)
}
assert(g.difficulty(5).speed>g.difficulty(1).speed);assert(g.difficulty(8).interval<g.difficulty(3).interval);assert(g.difficulty(8).doubleChance>g.difficulty(3).doubleChance);assert(g.difficulty(100).speed<=.64);assert(g.difficulty(100).interval>=.7);
s=g.create();s.left=.01;g.tick(s,.016);assert.equal(s.reason,'time');const score=s.score;g.tick(s,1);g.move(s,1);assert.equal(s.score,score);assert(!g.nextLevel(s));
s=g.create();s.invincible=0;for(let i=0;i<4;i++){s.invincible=0;g.add(s,'car',1,.78);g.tick(s,.016)}assert.equal(s.reason,'crash');
for(let seed=1;seed<=30;seed++){s=g.create(seed);s.level=1+seed%12;for(let i=0;i<7500&&!s.ended&&!s.cleared;i++){if(i%30===0)g.move(s,(i%3)-1);g.tick(s,1/60);assert(s.lives>=0&&s.lives<=5);assert(s.lane>=0&&s.lane<=2);assert(s.objects.length<35);assert(new Set(s.collected).size===s.collected.length);assert(s.objects.every(o=>!o.friend||g.friends.includes(o.friend)))}assert(s.ended||s.cleared)}
console.log('PASS: six-person roster, all 12 zones, 50 consecutive levels with score continuity, no artificial final level, difficulty growth/caps, pickups/combo, shields, slow motion, collision immunity, terminal states and 30 seeded runs.');
// A driver using only legal lane input must be able to progress through spawned traffic.
let clears=0;
for(let seed=1;seed<=10;seed++){
 const run=g.create(seed);
 for(let frame=0;frame<60*240&&!run.ended;frame++){
  if(run.cleared){clears++;g.nextLevel(run)}
  let target=run.lane,best=-Infinity;
  for(let lane=0;lane<3;lane++){
   let utility=-Math.abs(lane-run.x)*2;
   for(const o of run.objects){if(o.passed||o.lane!==lane)continue;
    if(['car','cone'].includes(o.type)&&o.y>.48&&o.y<.92)utility-=100*(1-Math.abs(o.y-.77));
    if(o.type==='friend'&&o.y>.25&&o.y<.85)utility+=40*o.y;
   }
   if(utility>best){best=utility;target=lane}
  }
  g.move(run,target-run.lane);g.tick(run,1/60);
 }
}
assert(clears>=20,'spawned traffic must allow progression with ordinary steering');
console.log(`PASS: ordinary steering completed ${clears} naturally spawned levels across ten seeded runs.`);
