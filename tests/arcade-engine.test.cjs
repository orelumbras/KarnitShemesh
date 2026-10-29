const assert=require('node:assert/strict'),g=require('../arcade-engine.js');
assert.deepEqual(g.friends,['אביחי','אוראל','עידן','אגם','יאנקו','איתי']);assert.equal(g.zones.length,12);
let s=g.create(7);assert.equal(s.left,g.budget(1));assert.equal(s.lives,4);g.move(s,-1);g.move(s,-1);assert.equal(s.lane,0);g.move(s,1);g.move(s,1);g.move(s,1);assert.equal(s.lane,2);
s=g.create(8);g.add(s,'friend',1,.78,'איתי');g.tick(s,.016);assert.deepEqual(s.collected,['איתי']);assert.equal(s.score,175);g.add(s,'friend',1,.78,'איתי');g.tick(s,.016);assert.equal(s.totalCollected,1);
s=g.create();s.invincible=0;g.add(s,'car',1,.78);g.tick(s,.016);assert.equal(s.lives,3);g.add(s,'cone',1,.78);g.tick(s,.016);assert.equal(s.lives,3,'collision immunity prevents repeat damage');
s=g.create();s.left=10;g.add(s,'clock',1,.78,null,{bonus:30});g.tick(s,.016);assert(s.left>39.9);assert.equal(s.score,75);
s=g.create();g.add(s,'shield',1,.78);g.tick(s,.016);assert(s.shield>0);s.invincible=0;g.add(s,'car',1,.78);g.tick(s,.016);assert.equal(s.lives,4);assert.equal(s.shield,0);
s=g.create();g.add(s,'slow',1,.78);g.tick(s,.016);assert(s.slow>0);
s=g.create();s.collected=g.friends.filter(n=>n!=='איתי');g.add(s,'friend',0,.935,'איתי');g.tick(s,.05);assert(s.events.some(e=>e.type==='miss'&&e.name==='איתי'));s.friendTimer=0;g.tick(s,.016);assert(s.objects.some(o=>o.type==='friend'&&o.friend==='איתי'),'a missed friend returns instead of making the level unwinnable');
// Six early pickups cannot skip the drive to the destination.
s=g.create();for(const name of g.friends)g.add(s,'friend',1,.78,name);g.tick(s,.016);assert.equal(s.collected.length,6);assert(!s.cleared);s.objects=[];s.spawn=s.friendTimer=s.bonusTimer=Infinity;
for(let i=0;i<60*64;i++)g.tick(s,1/60);assert(!s.cleared,'first trip lasts at least 66 seconds');while(!s.cleared)g.tick(s,1/60);assert(s.levelElapsed>=66&&s.levelElapsed<67);
// Driving the full route without the crew cannot complete the level either.
s=g.create();s.spawn=s.friendTimer=s.bonusTimer=Infinity;for(let i=0;i<60*67;i++)g.tick(s,1/60);assert.equal(s.progress,1);assert(!s.cleared);for(const name of g.friends)g.add(s,'friend',1,.78,name);g.tick(s,.016);assert(s.cleared);
// Progression preserves the run, rewards each clear once, and resets the next trip.
s=g.create();for(let level=1;level<=50;level++){
 assert.equal(s.level,level);for(const name of g.friends)g.add(s,'friend',1,.78,name);s.distance=g.difficulty(level).speed*g.difficulty(level).duration;g.tick(s,.016);assert(s.cleared);assert.equal(s.totalCollected,level*6);
 const score=s.score,time=s.elapsed;g.tick(s,1);assert.equal(s.score,score);assert.equal(s.elapsed,time);assert(g.nextLevel(s));assert.equal(s.collected.length,0);assert.equal(s.objects.length,0);assert.equal(s.distance,0);assert.equal(s.progress,0);assert.equal(s.score,score);assert(s.left>=g.budget(s.level));assert(s.lives<=5);
}
for(let level=2;level<=12;level++){assert(g.difficulty(level).speed>g.difficulty(level-1).speed);assert(g.difficulty(level).interval<g.difficulty(level-1).interval);assert(g.difficulty(level).duration>g.difficulty(level-1).duration)}
assert(g.difficulty(100).speed<=.49);assert(g.difficulty(100).interval>=.86);assert(g.difficulty(100).doubleChance<=.5);
s=g.create();s.left=.01;g.tick(s,.016);assert.equal(s.reason,'time');const score=s.score;g.tick(s,1);assert.equal(s.score,score);assert(!g.nextLevel(s));
s=g.create();for(let i=0;i<4;i++){s.invincible=0;g.add(s,'car',1,.78);g.tick(s,.016)}assert.equal(s.reason,'crash');
// Seeded steering uses only the same lane inputs available to a human.
let clears=0,first=[];
for(let seed=1;seed<=20;seed++){
 const run=g.create(seed);
 for(let frame=0;frame<60*300&&!run.ended;frame++){
  if(run.cleared){if(run.level===1)first.push(run.levelElapsed);clears++;g.nextLevel(run)}
  let target=run.lane,best=-Infinity;
  for(let lane=0;lane<3;lane++){
   let utility=-Math.abs(lane-run.x)*2;
   for(const o of run.objects){if(o.passed||o.lane!==lane)continue;if(['car','cone'].includes(o.type)&&o.y>.55&&o.y<.90)utility-=120*(1-Math.abs(o.y-.79));if(o.type==='friend'&&o.y>.17&&o.y<.865)utility+=45*o.y}
   if(utility>best){best=utility;target=lane}
  }
  g.move(run,target-run.lane);g.tick(run,1/60);
  assert(run.objects.length<35);assert(run.lives>=0&&run.lives<=5);assert(run.lane>=0&&run.lane<=2);assert(run.progress>=0&&run.progress<=1);assert.equal(new Set(run.collected).size,run.collected.length);
  const pending=run.objects.filter(o=>o.type==='friend'&&!o.passed);assert.equal(new Set(pending.map(o=>o.friend)).size,pending.length);
 }
}
assert.equal(first.length,20,'all seeded drivers can finish the opening trip');assert(first.every(t=>t>=66&&t<100));assert(clears>=60,'ordinary steering must progress through multiple longer trips');
console.log('PASS: route + six-person objective, minimum trip length, missed-crew recovery, pickups, immunity, bounded difficulty, 50 consecutive synthetic levels, time/crash endings.');
console.log('PASS: '+clears+' naturally spawned trips across 20 seeded drivers; first-trip duration '+Math.min(...first).toFixed(1)+'–'+Math.max(...first).toFixed(1)+' seconds.');
