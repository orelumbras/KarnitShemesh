/* Shared leaderboard transport. Rendering and submission consent stay in arcade.js. */
'use strict';
(() => {
 const base='https://karnit-shemesh-notes.orel-umbras.chatgpt.site/api/arcade';
 const pendingKey='karnit-crew-pending-v2',nameKey='karnit-crew-name-v2';
 let keyPromise;
 function failure(code,status=0){const error=new Error(code);error.code=code;error.status=status;return error}
 function normalizeName(value){return [...String(value??'').normalize('NFC')].filter(letter=>/^\p{L}$/u.test(letter)).slice(0,6).join('')}
 function validName(value){return typeof value==='string'&&/^\p{L}{1,6}$/u.test(value.normalize('NFC'))}
 async function archiveKey(){
  if(!window.ARCHIVE?.password||!globalThis.crypto?.subtle)throw failure('access_unavailable');
  if(!keyPromise)keyPromise=crypto.subtle.digest('SHA-256',new TextEncoder().encode(window.ARCHIVE.password)).then(buffer=>[...new Uint8Array(buffer)].map(byte=>byte.toString(16).padStart(2,'0')).join('')).catch(error=>{keyPromise=null;throw error});
  return keyPromise;
 }
 async function request(path,payload){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
  try{
   const key=await archiveKey();
   const response=await fetch(base+path,{method:payload===undefined?'GET':'POST',headers:{'X-Archive-Key':key,...(payload===undefined?{}:{'Content-Type':'application/json'})},...(payload===undefined?{}:{body:JSON.stringify(payload)}),signal:controller.signal,cache:'no-store',credentials:'omit'});
   let data;try{data=await response.json()}catch{throw failure('invalid_response',response.status)}
   if(!response.ok)throw failure(typeof data?.error==='string'?data.error:'request_failed',response.status);
   if(!data||typeof data!=='object')throw failure('invalid_response',response.status);
   return data;
  }catch(error){
   if(error.code&&typeof error.status==='number')throw error;
   if(controller.signal.aborted||error.name==='AbortError')throw failure('timeout');
   throw failure('network_unavailable');
  }finally{clearTimeout(timeout)}
 }
 function scorePayload(value){
  if(!value||typeof value!=='object'||typeof value.runId!=='string'||!/^[-a-zA-Z0-9]{16,80}$/.test(value.runId)||!validName(value.name)||!Number.isInteger(value.steps)||value.steps<1||value.steps>54000||!Array.isArray(value.actions)||value.actions.length>6000)return null;
  let previous=-1;
  const actions=[];
  for(const action of value.actions){
   if(!action||typeof action!=='object'||!Number.isInteger(action.t)||action.t<0||action.t>=value.steps||action.t<previous)return null;
   if(action.k==='m'?(action.v!==-1&&action.v!==1):action.k==='b'?(action.v!==0&&action.v!==1):true)return null;
   previous=action.t;actions.push({t:action.t,k:action.k,v:action.v});
  }
  return {runId:value.runId,name:value.name.normalize('NFC'),steps:value.steps,actions};
 }
 const api={
  board(){return request('/leaderboard')},
  begin(){return request('/runs',{})},
  submit(payload){const value=scorePayload(payload);return value?request('/scores',value):Promise.reject(failure('invalid_score'))},
  normalizeName,validName,
  savePending(payload){const value=scorePayload(payload);if(!value)return false;try{localStorage.setItem(pendingKey,JSON.stringify(value));return true}catch{return false}},
  pending(){try{const raw=localStorage.getItem(pendingKey);if(!raw||raw.length>750000)return null;return scorePayload(JSON.parse(raw))}catch{return null}},
  clearPending(runId){try{const raw=localStorage.getItem(pendingKey);if(!raw)return true;if(raw.length>750000)return false;const value=JSON.parse(raw);if(value?.runId!==runId)return false;localStorage.removeItem(pendingKey);return true}catch{return false}},
  getName(){try{return normalizeName(localStorage.getItem(nameKey)||'')}catch{return ''}},
  setName(value){if(!validName(value))return false;try{localStorage.setItem(nameKey,value.normalize('NFC'));return true}catch{return false}}
 };
 window.KarnitScores=Object.freeze(api);
})();
