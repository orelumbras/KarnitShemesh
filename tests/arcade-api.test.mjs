import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { arcadeApi,validateArcadeName,validateReplay } from '../backend/arcade/api.ts';
const engine=createRequire(import.meta.url)('../arcade-engine.js');
const sql=new DatabaseSync(':memory:');
sql.exec(readFileSync(new URL('../backend/wall/0000_notes.sql',import.meta.url),'utf8'));
sql.exec(readFileSync(new URL('../backend/arcade/0001_arcade.sql',import.meta.url),'utf8'));
class Statement {
 constructor(query,values=[]){this.query=query;this.values=values}
 bind(...values){return new Statement(this.query,values)}
 async first(){return sql.prepare(this.query).get(...this.values)||null}
 async all(){return {results:sql.prepare(this.query).all(...this.values)}}
 async run(){const result=sql.prepare(this.query).run(...this.values);return {meta:{changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid)}}}
}
const env={WALL_GATE_SHA256:'a'.repeat(64),DB:{prepare:query=>new Statement(query)}};
const headers={Origin:'http://localhost:8000','X-Archive-Key':'a'.repeat(64),'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.10'};
const request=(path,method='GET',body,override={})=>new Request('https://example.test/api/arcade/'+path,{method,headers:{...headers,...override},...(body===undefined?{}:{body:typeof body==='string'?body:JSON.stringify(body)})});
const send=(path,method='GET',body,override={})=>arcadeApi(request(path,method,body,override),env);
const data=async response=>({status:response.status,body:await response.json()});
async function ticket(){const response=await data(await send('runs','POST',{}));assert.equal(response.status,201);assert.equal(response.body.version,engine.version);assert.match(response.body.runId,/^[-a-zA-Z0-9]{16,64}$/);assert(Number.isInteger(response.body.seed)&&response.body.seed>=0&&response.body.seed<=0xffffffff);return response.body}
function age(run,ms=3600_000){sql.prepare('UPDATE arcade_runs SET created_at = ? WHERE run_id = ?').run(Date.now()-ms,run.runId)}
function fixture(run){const s=engine.create(run.seed);while(!s.ended&&s.tick<54_000)engine.tick(s,1/60);assert(s.ended);return s}

assert.deepEqual(validateArcadeName('  אביחי '),{name:'אביחי',nameKey:'אביחי'});
assert.deepEqual(validateArcadeName('OReL'),{name:'OReL',nameKey:'orel'});
assert.equal(validateArcadeName('e\u0301').name,'é');
assert.equal(validateArcadeName('好友').name,'好友');
for(const value of ['',null,'abcdefg','אוראלים','דן כהן','123','a1','A🦄','<img>','a\nb'])assert.equal(validateArcadeName(value),null,value);
const payload={runId:'01234567-1234-1234-1234-012345678901',name:'אוראל',steps:100,actions:[{t:0,k:'m',v:-1},{t:0,k:'b',v:1},{t:12,k:'b',v:0}]};
assert(validateReplay(payload));
for(const bad of [{...payload,steps:0},{...payload,steps:54001},{...payload,steps:1.5},{...payload,runId:'bad'},{...payload,actions:[{t:-1,k:'m',v:1}]},{...payload,actions:[{t:100,k:'m',v:1}]},{...payload,actions:[{t:5,k:'m',v:1},{t:4,k:'m',v:1}]},{...payload,actions:[{t:5,k:'m',v:0}]},{...payload,actions:[{t:5,k:'x',v:1}]},{...payload,actions:new Array(6001).fill({t:0,k:'m',v:1})}])assert.equal(validateReplay(bad),null);

assert.equal((await send('leaderboard','OPTIONS')).status,204);
assert.equal((await send('leaderboard','OPTIONS',undefined,{Origin:'https://other.test'})).status,403);
assert.equal((await send('leaderboard','GET',undefined,{Origin:'https://other.test'})).status,403);
assert.equal((await send('leaderboard','GET',undefined,{'X-Archive-Key':''})).status,401);
assert.equal((await send('leaderboard','GET',undefined,{'X-Archive-Key':'b'.repeat(64)})).status,401);
assert.equal((await send('leaderboard','POST',{})).status,405);
assert.equal((await send('runs','GET')).status,405);
assert.equal((await send('not-found')).status,404);
assert.equal((await send('runs','POST','{')).status,400);
assert.equal((await send('runs','POST','{}',{'Content-Type':'text/plain'})).status,415);
assert.equal((await send('runs','POST','x'.repeat(240001))).status,413);
const empty=await data(await send('leaderboard'));assert.equal(empty.status,200);assert.deepEqual(empty.body.allTime,[]);assert.deepEqual(empty.body.today,[]);assert.match(empty.body.day,/^\d{4}-\d{2}-\d{2}$/);

const unfinished=await ticket();age(unfinished);
assert.equal((await data(await send('scores','POST',{runId:unfinished.runId,name:'אדם',steps:1,actions:[]}))).body.error,'run_not_finished');
const run=await ticket(),state=fixture(run);age(run);
const finish={runId:run.runId,name:'אוראל',steps:state.tick,actions:[],score:999_999_999};
assert.equal((await data(await send('scores','POST',{...finish,name:'longname'}))).body.error,'invalid_score');
const saved=await data(await send('scores','POST',finish));assert.equal(saved.status,201);assert.equal(saved.body.entry.score,state.score);assert.equal(saved.body.entry.id,run.runId);assert.equal(saved.body.entry.totalCollected,state.totalCollected);assert.equal(saved.body.duplicate,false);
const retry=await data(await send('scores','POST',finish));assert.equal(retry.status,200);assert.equal(retry.body.duplicate,true);assert.deepEqual(retry.body.entry,saved.body.entry);
assert.equal((await data(await send('scores','POST',{...finish,name:'איתי'}))).status,409);
assert.equal((await data(await send('scores','POST',{...finish,steps:state.tick-1}))).status,409);
const fast=await ticket(),fastState=fixture(fast);sql.prepare('UPDATE arcade_runs SET created_at = ? WHERE run_id = ?').run(Date.now()+1000,fast.runId);
assert.equal((await data(await send('scores','POST',{runId:fast.runId,name:'אגם',steps:fastState.tick,actions:[]}))).body.error,'invalid_duration');
age(fast,86_400_001);
assert.equal((await data(await send('scores','POST',{runId:fast.runId,name:'אגם',steps:fastState.tick,actions:[]}))).status,410);
age(fast);sql.prepare('UPDATE arcade_runs SET version = ? WHERE run_id = ?').run('old',fast.runId);
assert.equal((await data(await send('scores','POST',{runId:fast.runId,name:'אגם',steps:fastState.tick,actions:[]}))).body.error,'version_expired');
const mismatch=await ticket();age(mismatch);const actual=fixture(mismatch);
assert.equal((await data(await send('scores','POST',{runId:mismatch.runId,name:'איתי',steps:Math.min(54000,actual.tick+1),actions:[]}))).body.error,'invalid_replay');
assert.equal((await data(await send('scores','POST',{...finish,runId:'00000000-0000-0000-0000-000000000000'}))).status,404);

const insert=(id,name,key,score,date)=>sql.prepare('INSERT INTO arcade_scores (run_id,name,name_key,score,level,deliveries,total_collected,ticks,replay_hash,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id,name,key,score,2,1,6,1200,'test',date);
insert('rank-old','יאנקו','יאנקו',999999,'2000-01-01T00:00:00.000Z');
insert('rank-orel-low','OREL','orel',9998,new Date().toISOString());
insert('rank-orel-high','orel','orel',9999,new Date().toISOString());
const board=await data(await send('leaderboard'));assert.equal(board.body.allTime[0].name,'יאנקו');assert.equal(board.body.today.some(row=>row.name==='יאנקו'),false);assert.equal(board.body.allTime.filter(row=>row.name.toLowerCase()==='orel').length,1);assert.equal(board.body.today.find(row=>row.name==='orel').score,9999);assert.equal(board.body.allTime[0].rank,1);assert.equal(board.body.allTime[1].rank,2);assert.equal('seed' in board.body.allTime[0],false);assert.equal('replayHash' in board.body.allTime[0],false);assert.equal('nameKey' in board.body.allTime[0],false);
for(let i=0;i<40;i++){const response=await send('runs','POST',{}, {'CF-Connecting-IP':'192.0.2.99'});assert.equal(response.status,201)}
const throttled=await send('runs','POST',{}, {'CF-Connecting-IP':'192.0.2.99'});assert.equal(throttled.status,429);assert.equal(throttled.headers.get('Retry-After'),'60');
assert.equal(sql.prepare('SELECT count(*) AS n FROM arcade_scores WHERE run_id = ?').get(run.runId).n,1);
assert.equal(sql.prepare('SELECT count(*) AS n FROM wall_notes').get().n,0);
sql.close();
console.log('PASS: actual SQLite migrations, shared-code auth/CORS, Unicode six-letter names, bounded replays, server-computed scores, immutable idempotent submissions, duration/version checks, daily/all-time ranking and rate limits. Existing notes unchanged.');
