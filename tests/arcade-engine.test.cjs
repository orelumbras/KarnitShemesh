const assert=require('node:assert/strict');
const g=require('../arcade-engine.js');
const quiet=s=>{s.rowDistance=Infinity;s.objects=[];return s};
const frames=(s,n)=>{for(let i=0;i<n;i++)g.tick(s);return s};
assert.equal(g.version,'crew-rush-1');assert.equal(g.DT,1/60);assert.equal(g.MAX_STEPS,54000);
assert.deepEqual(g.friends,['אביחי','אוראל','עידן','אגם','יאנקו','איתי']);assert.equal(g.zones.length,12);
let s=quiet(g.create(7));assert.equal(s.lives,3);assert(!('left'in s));assert(!('progress'in s));
g.tick(s,.5);assert.equal(s.tick,1);assert.equal(s.elapsed,1/60,'simulation always advances one fixed step');
g.move(s,-1);g.move(s,-1);assert.equal(s.lane,0);g.move(s,Infinity);assert.equal(s.lane,0);g.move(s,1);g.move(s,1);g.move(s,1);assert.equal(s.lane,2);
// Actual collisions cost one of three lives; repeated contact does not instantly kill.
s=quiet(g.create(8));s.invincible=0;g.add(s,'car',1,.79);g.tick(s);assert.equal(s.lives,2);g.add(s,'cone',1,.79);g.tick(s);assert.equal(s.lives,2);frames(s,64);s.objects=[];g.add(s,'car',1,.79);g.tick(s);assert.equal(s.lives,1);frames(s,64);s.objects=[];g.add(s,'car',1,.79);g.tick(s);assert(s.ended);assert.equal(s.reason,'crash');const ended=JSON.stringify(s);g.tick(s);g.move(s,-1);g.boost(s,true);assert.equal(JSON.stringify(s),ended);
// Shields are single-hit protection, never an endlessly refreshed timer.
s=quiet(g.create(2));g.add(s,'shield',1,.79);g.tick(s);assert.equal(s.shield,1);s.invincible=0;g.add(s,'car',1,.79);g.tick(s);assert.equal(s.lives,3);assert.equal(s.shield,0);assert(s.events.some(e=>e.type==='blocked'));
// Six DISTINCT pickups deliver automatically without a pause, free life or reset.
s=quiet(g.create(5));g.add(s,'friend',1,.79,g.friends[0]);g.tick(s);g.add(s,'friend',1,.79,g.friends[0]);g.tick(s);assert.equal(s.totalCollected,1);
for(const name of g.friends.slice(1)){g.add(s,'friend',1,.79,name);g.tick(s)}
assert.equal(s.totalCollected,6);assert.equal(s.deliveries,1);assert.deepEqual(s.lastDelivery,g.friends);assert.equal(s.collected.length,0);assert(!s.ended);assert.equal(s.lives,3);assert(s.events.some(e=>e.type==='delivery'));const afterSet=s.score;g.add(s,'friend',1,.79,g.friends[0]);g.tick(s);assert.equal(s.totalCollected,7);assert(s.score>afterSet);
s.combo=12;s.multiplier=4;g.add(s,'friend',0,.95,'יאנקו');g.tick(s);assert.equal(s.combo,0);assert.equal(s.multiplier,1);assert(s.events.some(e=>e.type==='miss'));
// A genuinely close pass earns streak points; distant traffic gives no near bonus.
s=quiet(g.create(8));s.invincible=0;g.add(s,'car',2,.95,null,{closest:1.4});g.tick(s);assert(!s.events.some(e=>e.type==='near'));g.add(s,'car',0,.95,null,{closest:.64});g.tick(s);assert(s.events.some(e=>e.type==='near'));assert.equal(s.combo,1);
// Boost trades safety/recharge for speed and doubled distance points.
const boosted=quiet(g.create(1)),normal=quiet(g.create(1));g.boost(boosted,true);frames(boosted,100);frames(normal,100);assert(boosted.distance>normal.distance*1.35);assert(boosted.score>normal.score*2);assert(boosted.boostCharge<50);frames(boosted,100);assert(boosted.boostLocked);assert(!boosted.boosting);g.boost(boosted,false);frames(boosted,150);assert(boosted.boostCharge>=20);assert(!boosted.boostLocked);g.add(boosted,'nitro',1,.79);g.tick(boosted);assert(boosted.events.some(e=>e.type==='nitro'));
// The road becomes harder without waiting for a finish line.
s=quiet(g.create(9));frames(s,1080);assert.equal(s.level,2);s.deliveries=4;g.tick(s);assert.equal(s.level,4);
for(let level=2;level<=11;level++){assert(g.difficulty(level).speed>g.difficulty(level-1).speed);assert(g.difficulty(level).interval<g.difficulty(level-1).interval);assert(g.difficulty(level).doubleChance>g.difficulty(level-1).doubleChance)}
assert(g.difficulty(999).speed<=1.08);assert(g.difficulty(999).gap>=.365);assert(g.difficulty(999).doubleChance<1);
// Idle play loses quickly: surviving and collecting requires continuous decisions.
const idleTimes=[];for(let seed=1;seed<=30;seed++){s=g.create(seed);while(!s.ended&&s.tick<60*25)g.tick(s);assert(s.ended,'a parked player must not survive indefinitely');idleTimes.push(s.elapsed);assert.equal(s.reason,'crash')}
assert(Math.max(...idleTimes)<15);
// A human-style controller uses only legal one-lane input, with a 117ms decision
// interval. It can read the road, collect complete crews and reach the hard tier.
function drive(seed,seconds=180){
 const run=g.create(seed),actions=[];
 while(!run.ended&&run.tick<60*seconds){
  if(run.tick%7===0){let target=run.lane,best=-Infinity;
   for(let lane=0;lane<3;lane++){
    let utility=-Math.abs(lane-run.x)*1.5;
    for(const o of run.objects){if(o.passed)continue;const dx=Math.abs(lane-o.lane);if(['car','cone'].includes(o.type)&&o.y>.37&&o.y<.94&&dx<.5)utility-=120*(1-Math.abs(o.y-.79));if(o.type==='friend'&&o.y>.1&&o.y<.88&&dx<.5)utility+=25*o.y}
    if(utility>best){best=utility;target=lane}
   }
   if(target!==run.lane){const action={t:run.tick,k:'m',v:Math.sign(target-run.lane)};actions.push(action);g.move(run,action.v)}
  }
  g.tick(run);assert(run.objects.length<25);assert(run.lives>=0&&run.lives<=3);assert.equal(new Set(run.collected).size,run.collected.length);
  const pending=run.objects.filter(o=>o.type==='friend'&&!o.passed);assert.equal(new Set(pending.map(o=>o.friend)).size,pending.length);
  // Each generated traffic row has a free lane and no friend hidden in a car.
  const row=run.objects.filter(o=>o.row===run.row&&!o.passed),hazards=row.filter(o=>['car','cone'].includes(o.type));assert(hazards.length<=2);for(const pickup of row.filter(o=>!['car','cone'].includes(o.type)))assert(!hazards.some(o=>o.lane===pickup.lane));
 }
 return {run,actions};
}
let sets=0,minSurvival=Infinity;for(let seed=1;seed<=20;seed++){const {run}=drive(seed);sets+=run.deliveries;minSurvival=Math.min(minSurvival,run.elapsed);assert(run.elapsed>100);assert(run.deliveries>=10);assert(run.level>=8)}
const {run,actions}=drive(3);assert(run.ended,'known seed finishes naturally for the replay fixture');const replay=g.replay(3,actions,run.tick);assert.deepEqual(replay,run,'server replay reproduces every exact state field and score');
const mixed=[{t:0,k:'b',v:1},{t:15,k:'m',v:-1},{t:50,k:'b',v:0},{t:70,k:'m',v:1}];s=g.create(10);for(let i=0;i<150;i++){for(const a of mixed.filter(a=>a.t===s.tick)){if(a.k==='m')g.move(s,a.v);else g.boost(s,a.v===1)}g.tick(s)}assert.deepEqual(g.replay(10,mixed,150),s);
for(const bad of [[{t:-1,k:'m',v:1}],[{t:5,k:'m',v:0}],[{t:2,k:'b',v:true}],[{t:8,k:'m',v:1},{t:7,k:'m',v:-1}],[{t:100,k:'m',v:1}],[{t:4,k:'teleport',v:1}]])assert.throws(()=>g.replay(1,bad,100),RangeError);
assert.throws(()=>g.replay(1,Array(6001).fill({t:0,k:'m',v:1}),100),RangeError);assert.throws(()=>g.replay(1,Array(5).fill({t:0,k:'m',v:1}),100),RangeError);assert.throws(()=>g.replay(-1,[],100),RangeError);assert.throws(()=>g.replay(1,[],0),RangeError);assert.throws(()=>g.replay(3,actions,run.tick+1),/steps_after_end/);
s=quiet(g.create(4));frames(s,g.MAX_STEPS);assert(s.ended);assert.equal(s.reason,'complete');assert.equal(s.elapsed,900);assert.equal(s.tick,g.MAX_STEPS);
console.log('PASS: deterministic 60Hz simulation, escalating endless traffic, three lives, shields, six-person automatic deliveries, misses, close passes, boost exhaustion/recharge, 15min cap and strict server replay.');
console.log('PASS: 30 idle drivers die in '+Math.min(...idleTimes).toFixed(1)+'–'+Math.max(...idleTimes).toFixed(1)+'s; 20 legal seeded drivers survive at least '+minSurvival.toFixed(1)+'s and deliver '+sets+' crews.');
