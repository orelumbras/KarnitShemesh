const assert=require('node:assert/strict');
const game=require('../mission-engine.js');
const seen=new Set();let paths=0;
function walk(s){assert(s.patience>=0&&s.patience<=100);assert(s.ready>=0&&s.ready<=100);assert(s.step===s.history.length);assert(game.score(s)>=0&&game.score(s)<=100);if(s.ending){paths++;seen.add(s.ending);assert(game.endings[s.ending]);assert.equal(game.choose(s,0),s);return}const snapshot=JSON.stringify(s);for(let i=0;i<3;i++){const n=game.choose(s,i);assert.equal(JSON.stringify(s),snapshot,'choices must not mutate prior state');assert(n.minutes>s.minutes);assert(n.step===s.step+1);walk(n)}}
walk(game.initial());assert.deepEqual([...seen].sort(),Object.keys(game.endings).sort(),'all advertised endings must be reachable');
assert.equal(game.choose(game.initial(),-1).step,0);assert.equal(game.choose(game.initial(),3).step,0);assert.equal(game.choose(game.initial(),0.5).step,0);
assert.equal(game.clock(1455),'00:15 · למחרת');assert.equal(game.clock(1200),'20:00');
assert.equal([0,0,0,0,0,0].reduce((s,i)=>game.choose(s,i),game.initial()).ending,'perfect');
assert.equal([0,0,0,1,0,0].reduce((s,i)=>game.choose(s,i),game.initial()).ending,'beach');
assert.equal([0,0,0,2,0,0].reduce((s,i)=>game.choose(s,i),game.initial()).ending,'home');
console.log(`PASS: ${paths} terminal paths, all ${seen.size} endings reachable, bounded scores/meters, immutable transitions, midnight clock, invalid and terminal choices.`);
