import engine from './arcade-engine.cjs';

const origins=new Set(['https://orelumbras.github.io','http://localhost:8000','http://127.0.0.1:8000']);
const MAX_BODY=240_000,MAX_ACTIONS=6000,MAX_STEPS=54_000;
type Action={t:number;k:'m'|'b';v:number};
type ScoreRow={runId:string;name:string;nameKey:string;score:number;level:number;deliveries:number;totalCollected:number;createdAt:string;replayHash:string};
type RunRow={runId:string;seed:number;version:string;createdAt:number};
const scoreColumns='run_id AS runId,name,name_key AS nameKey,score,level,deliveries,total_collected AS totalCollected,created_at AS createdAt,replay_hash AS replayHash';

export function validateArcadeName(value:unknown){
 if(typeof value!=='string')return null;
 const name=value.normalize('NFC').trim();
 if(!/^\p{L}{1,6}$/u.test(name))return null;
 return {name,nameKey:name.toLocaleLowerCase('en-US')};
}
export function validateReplay(value:unknown):{runId:string;name:string;nameKey:string;actions:Action[];steps:number}|null{
 if(!value||typeof value!=='object')return null;
 const v=value as Record<string,unknown>,name=validateArcadeName(v.name);
 if(!name||typeof v.runId!=='string'||!/^[-a-zA-Z0-9]{16,64}$/.test(v.runId)||!Number.isSafeInteger(v.steps)||(v.steps as number)<1||(v.steps as number)>MAX_STEPS||!Array.isArray(v.actions)||v.actions.length>MAX_ACTIONS)return null;
 let previous=-1;
 const actions:Action[]=[];
 for(const input of v.actions){
  if(!input||typeof input!=='object')return null;
  const a=input as Record<string,unknown>;
  if(!Number.isSafeInteger(a.t)||(a.t as number)<0||(a.t as number)>=(v.steps as number)||(a.t as number)<previous)return null;
  if(a.k!=='m'&&a.k!=='b')return null;
  if(a.k==='m'&&a.v!==-1&&a.v!==1||a.k==='b'&&a.v!==0&&a.v!==1)return null;
  previous=a.t as number;actions.push({t:previous,k:a.k,v:a.v as number});
 }
 return {runId:v.runId,...name,actions,steps:v.steps as number};
}

async function digest(value:string){const result=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(result),v=>v.toString(16).padStart(2,'0')).join('')}
function publicEntry(row:ScoreRow,rank:number|null){return {id:row.runId,rank,name:row.name,score:row.score,level:row.level,deliveries:row.deliveries,totalCollected:row.totalCollected,createdAt:row.createdAt}}
function dailyStart(now:Date){
 const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit'}),day=formatter.format(now),midnight=Date.parse(day+'T00:00:00Z');
 const clock=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Jerusalem',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',second:'numeric',hourCycle:'h23'});
 let candidate=midnight;
 // Resolve the offset at local midnight itself, including DST transition days.
 for(let i=0;i<3;i++){const p=Object.fromEntries(clock.formatToParts(new Date(candidate)).map(part=>[part.type,part.value]));const local=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second),next=midnight-(local-candidate);if(next===candidate)break;candidate=next}
 return {day,since:new Date(candidate).toISOString()};
}
async function rank(db:D1Database,score:number){const row=await db.prepare('SELECT 1+count(*) AS rank FROM (SELECT MAX(score) AS best FROM arcade_scores GROUP BY name_key) WHERE best > ?').bind(score).first<{rank:number}>();return row?.rank??null}
async function board(db:D1Database,since?:string){
 const sql=`WITH best AS (SELECT ${scoreColumns},ROW_NUMBER() OVER (PARTITION BY name_key ORDER BY score DESC,created_at ASC,run_id ASC) AS player_rank FROM arcade_scores ${since?'WHERE created_at >= ?':''}) SELECT * FROM best WHERE player_rank = 1 ORDER BY score DESC,createdAt ASC,runId ASC LIMIT 20`;
 const statement=db.prepare(sql),result=await (since?statement.bind(since):statement).all<ScoreRow>();
 return (result.results||[]).map((row,i)=>publicEntry(row,i+1));
}
async function body(req:Request){
 if(!req.headers.get('content-type')?.includes('application/json'))return {error:'invalid_content_type',status:415} as const;
 const reader=req.body?.getReader();if(!reader)return {error:'invalid_json',status:400} as const;
 const chunks:Uint8Array[]=[];let length=0;
 while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>MAX_BODY){await reader.cancel();return {error:'too_large',status:413} as const}chunks.push(value)}
 const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
 try{return {value:JSON.parse(new TextDecoder().decode(bytes))}}catch{return {error:'invalid_json',status:400} as const}
}

export async function arcadeApi(req:Request,env:Cloudflare.Env){
 const origin=req.headers.get('origin')||'',allowed=origins.has(origin);
 const headers:Record<string,string>={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
 if(allowed){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Methods']='GET, POST, OPTIONS';headers['Access-Control-Allow-Headers']='Content-Type, X-Archive-Key';headers['Access-Control-Max-Age']='86400'}
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{status:allowed?204:403,headers});
 if(!allowed)return reply({error:'origin_not_allowed'},403);
 const expected=(env as unknown as Record<string,string>).WALL_GATE_SHA256,supplied=req.headers.get('X-Archive-Key')||'';
 if(!expected||expected.length!==64||supplied.length!==64)return reply({error:'access_denied'},401);
 let mismatch=0;for(let i=0;i<64;i++)mismatch|=expected.charCodeAt(i)^supplied.charCodeAt(i);
 if(mismatch)return reply({error:'access_denied'},401);
 if(!env.DB)return reply({error:'storage_unavailable'},503);
 const db=env.DB,url=new URL(req.url),path=url.pathname;
 if(!['/api/arcade/leaderboard','/api/arcade/runs','/api/arcade/scores'].includes(path))return reply({error:'not_found'},404);
 try{
  if(path==='/api/arcade/leaderboard'){
   if(req.method!=='GET')return reply({error:'method_not_allowed'},405);
   // The daily table uses Israel's calendar date, not the visitor's timezone.
   const {day,since}=dailyStart(new Date());
   const [allTime,today]=await Promise.all([board(db),board(db,since)]);
   return reply({allTime,today,version:engine.version,day});
  }
  if(req.method!=='POST')return reply({error:'method_not_allowed'},405);
  const parsed=await body(req);if('error' in parsed)return reply({error:parsed.error},parsed.status);
  if(path==='/api/arcade/runs'){
   const now=Date.now(),clientHash=await digest(expected+':'+(req.headers.get('CF-Connecting-IP')||'unknown')),runId=crypto.randomUUID(),seed=crypto.getRandomValues(new Uint32Array(1))[0];
   const result=await db.prepare('INSERT INTO arcade_runs (run_id,seed,version,client_hash,created_at) SELECT ?,?,?,?,? WHERE (SELECT count(*) FROM arcade_runs WHERE client_hash = ? AND created_at > ?) < 40 AND (SELECT count(*) FROM arcade_runs WHERE created_at > ?) < 300').bind(runId,seed,engine.version,clientHash,now,clientHash,now-600_000,now-60_000).run();
   if(!result.meta.changes){headers['Retry-After']='60';return reply({error:'slow_down'},429)}
   return reply({runId,seed,version:engine.version,createdAt:now},201);
  }
  const value=validateReplay(parsed.value);if(!value)return reply({error:'invalid_score'},400);
  const replayHash=await digest(JSON.stringify({steps:value.steps,actions:value.actions}));
  const old=await db.prepare(`SELECT ${scoreColumns} FROM arcade_scores WHERE run_id = ?`).bind(value.runId).first<ScoreRow>();
  if(old){if(old.nameKey!==value.nameKey||old.replayHash!==replayHash)return reply({error:'run_already_saved'},409);return reply({entry:publicEntry(old,await rank(db,old.score)),duplicate:true})}
  const run=await db.prepare('SELECT run_id AS runId,seed,version,created_at AS createdAt FROM arcade_runs WHERE run_id = ?').bind(value.runId).first<RunRow>();
  if(!run)return reply({error:'run_not_found'},404);
  if(run.version!==engine.version)return reply({error:'version_expired'},409);
  const age=Date.now()-run.createdAt;
  if(age>86_400_000)return reply({error:'run_expired'},410);
  if(age<0||value.steps*1000/60>age+5000)return reply({error:'invalid_duration'},400);
  let state;try{state=engine.replay(run.seed,value.actions,value.steps)}catch{return reply({error:'invalid_replay'},400)}
  if(!state.ended||!Number.isSafeInteger(state.score)||state.score<0)return reply({error:'run_not_finished'},400);
  const now=new Date().toISOString();
  const inserted=await db.prepare('INSERT OR IGNORE INTO arcade_scores (run_id,name,name_key,score,level,deliveries,total_collected,ticks,replay_hash,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(value.runId,value.name,value.nameKey,state.score,state.level,state.deliveries,state.totalCollected,state.tick,replayHash,now).run();
  const saved=await db.prepare(`SELECT ${scoreColumns} FROM arcade_scores WHERE run_id = ?`).bind(value.runId).first<ScoreRow>();
  if(!saved)return reply({error:'storage_unavailable'},503);
  if(saved.nameKey!==value.nameKey||saved.replayHash!==replayHash)return reply({error:'run_already_saved'},409);
  const duplicate=!inserted.meta.changes;
  return reply({entry:publicEntry(saved,await rank(db,saved.score)),duplicate},duplicate?200:201);
 }catch{return reply({error:'storage_unavailable'},503)}
}
