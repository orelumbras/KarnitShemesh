const origins=new Set(['https://orelumbras.github.io','http://localhost:8000','http://127.0.0.1:8000']);
const colors=['peach','pink','mint','lavender','yellow'];
export function validateNote(value:unknown){
 const v=value as Record<string,unknown>;
 if(!v||typeof v!=='object'||typeof v.author!=='string'||typeof v.body!=='string'||typeof v.id!=='string')return null;
 const author=v.author.trim(),body=v.body.trim();
 if(!author||author.length>60||!body||body.length>1200||!/^[-a-zA-Z0-9]{16,64}$/.test(v.id))return null;
 return {id:v.id,author,body,color:typeof v.color==='string'&&colors.includes(v.color)?v.color:'peach'};
}
export async function wallApi(req:Request,env:Cloudflare.Env){
 const origin=req.headers.get('origin')||'',allowed=origins.has(origin);
 const headers:Record<string,string>={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
 if(allowed){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Methods']='GET, POST, OPTIONS';headers['Access-Control-Allow-Headers']='Content-Type, X-Archive-Key';headers['Access-Control-Max-Age']='86400'}
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{status:allowed?204:403,headers});
 if(!allowed)return reply({error:'origin_not_allowed'},403);
 const expected=(env as unknown as Record<string,string>).WALL_GATE_SHA256;
 const supplied=req.headers.get('X-Archive-Key')||'';
 if(!expected||expected.length!==64||supplied.length!==64)return reply({error:'access_denied'},401);
 let mismatch=0;for(let i=0;i<64;i++)mismatch|=expected.charCodeAt(i)^supplied.charCodeAt(i);
 if(mismatch)return reply({error:'access_denied'},401);
 if(!env.DB)return reply({error:'storage_unavailable'},503);
 const url=new URL(req.url);if(url.pathname!=='/api/notes')return reply({error:'not_found'},404);
 try{
  if(req.method==='GET'){
   const before=Number(url.searchParams.get('before')||Number.MAX_SAFE_INTEGER);if(!Number.isSafeInteger(before)||before<1)return reply({error:'invalid_cursor'},400);
   const result=await env.DB.prepare('SELECT seq,id,author,body,color,created_at AS createdAt FROM wall_notes WHERE seq < ? ORDER BY seq DESC LIMIT 41').bind(before).all();
   const rows=result.results||[];return reply({notes:rows.slice(0,40),next:rows.length>40?(rows[39] as {seq:number}).seq:null});
  }
  if(req.method!=='POST')return reply({error:'method_not_allowed'},405);
  if(!req.headers.get('content-type')?.includes('application/json'))return reply({error:'invalid_content_type'},415);
  const reader=req.body?.getReader();if(!reader)return reply({error:'invalid_note'},400);let length=0;const chunks:Uint8Array[]=[];
  while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>8192){await reader.cancel();return reply({error:'too_large'},413)}chunks.push(value)}
  const bytes=new Uint8Array(length);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length}
  let value;try{value=JSON.parse(new TextDecoder().decode(bytes))}catch{return reply({error:'invalid_json'},400)}
  const note=validateNote(value);if(!note)return reply({error:'invalid_note'},400);
  const old=await env.DB.prepare('SELECT seq,id,author,body,color,created_at AS createdAt FROM wall_notes WHERE id = ?').bind(note.id).first();
  if(old)return reply({note:old},200);
  const now=new Date().toISOString(),minute=new Date(Date.now()-60000).toISOString();
  const result=await env.DB.prepare('INSERT OR IGNORE INTO wall_notes (id,author,body,color,created_at) SELECT ?,?,?,?,? WHERE (SELECT count(*) FROM wall_notes WHERE created_at > ?) < 15').bind(note.id,note.author,note.body,note.color,now,minute).run();
  if(!result.meta.changes){const existing=await env.DB.prepare('SELECT seq,id,author,body,color,created_at AS createdAt FROM wall_notes WHERE id = ?').bind(note.id).first();if(existing)return reply({note:existing});return reply({error:'slow_down'},429)}
  const saved=await env.DB.prepare('SELECT seq,id,author,body,color,created_at AS createdAt FROM wall_notes WHERE id = ?').bind(note.id).first();return reply({note:saved},201);
 }catch{return reply({error:'storage_unavailable'},503)}
}
