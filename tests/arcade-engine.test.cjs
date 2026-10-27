const assert=require('node:assert/strict'),g=require('../arcade-engine.js');
let s=g.create(7);g.move(s,-1);g.move(s,-1);assert.equal(s.lane,0);g.move(s,1);g.move(s,1);g.move(s,1);assert.equal(s.lane,2);
s=g.create(8);g.add(s,'friend',1,.78,'איתי');g.tick(s,.016);assert.deepEqual(s.collected,['איתי']);assert.equal(s.score,100);g.add(s,'friend',1,.78,'איתי');g.tick(s,.016);assert.equal(s.collected.length,1);assert.equal(s.score,100);
s=g.create();g.add(s,'car',1,.78);g.tick(s,.016);assert.equal(s.lives,2);g.add(s,'cone',1,.78);g.tick(s,.016);assert.equal(s.lives,2,'temporary immunity prevents double damage');s.invincible=0;g.add(s,'car',1,.78);g.tick(s,.016);s.invincible=0;g.add(s,'car',1,.78);g.tick(s,.016);assert.equal(s.reason,'crash');const score=s.score;g.tick(s,20);assert.equal(s.score,score);
s=g.create();s.left=10;g.add(s,'clock',1,.78);g.tick(s,.016);assert(s.left>14.9);assert.equal(s.score,50);
s=g.create();for(const f of g.friends)g.add(s,'friend',1,.78,f);g.tick(s,.016);assert.equal(s.reason,'crew');assert.equal(s.collected.length,8);assert(s.score>2000);
s=g.create();s.left=.01;g.tick(s,.016);assert.equal(s.reason,'time');
for(let seed=1;seed<=25;seed++){s=g.create(seed);for(let i=0;i<5000&&!s.ended;i++){if(i%30===0)g.move(s,(i%3)-1);g.tick(s,1/60);assert(s.lives>=0&&s.lives<=3);assert(s.lane>=0&&s.lane<=2);assert(s.objects.length<30);assert(new Set(s.collected).size===s.collected.length)}assert(s.ended)}
console.log('PASS: lane bounds, pickups, duplicate protection, collisions/immunity, lives, clock bonuses, eight-friend win, timeout, terminal score and 25 deterministic full runs.');
