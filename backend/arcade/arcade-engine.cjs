/* Shared browser/server simulation. A ranked run is replayed at exactly 60 Hz. */
(function(root,factory){const game=factory();if(typeof module==='object'&&module.exports)module.exports=game;else root.KarnitArcade=game})(globalThis,()=>{
 'use strict';
 const version='crew-rush-1',DT=1/60,MAX_STEPS=54000,MAX_ACTIONS=6000;
 const friends=Object.freeze(['אביחי','אוראל','עידן','אגם','יאנקו','איתי']);
 const zones=Object.freeze([['טיילת השקיעה',0],['לילה בעיר',1],['המרינה',2],['שכונת הדקלים',3],['מרכז העיר',8],['הנמל',4],['שדה התעופה',6],['גשר האיים',10],['הביצות',7],['אתר הבנייה',9],['המחלף',5],['רחבת הדריפט',11]]);
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function difficulty(level=1){const n=clamp(Math.floor(Number(level)||1)-1,0,40);return {speed:Math.min(1.08,.62+n*.043),gap:Math.max(.365,.42-n*.005),interval:Math.max(.365,.42-n*.005)/Math.min(1.08,.62+n*.043),doubleChance:Math.min(.94,.62+n*.035),friendEvery:3,boostFactor:1.38}}
 function create(seed=Date.now()){
  const initialSeed=Number(seed)>>>0;
  return {version,initialSeed,seed:initialSeed,tick:0,elapsed:0,lane:1,x:1,level:1,speed:.62,distance:0,score:0,scoreRemainder:0,lives:3,collected:[],totalCollected:0,deliveries:0,lastDelivery:null,deliveryFlash:0,combo:0,multiplier:1,maxCombo:0,boostCharge:100,boostHeld:false,boosting:false,boostLocked:false,shield:0,invincible:1.4,objects:[],events:[],serial:0,row:0,rowDistance:.48,lastGap:1,spawn:0,friendTimer:0,bonusTimer:0,ended:false,reason:null};
 }
 function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296}
 function move(s,direction){if(s.ended||!Number.isFinite(direction)||!direction)return false;const lane=clamp(s.lane+Math.sign(direction),0,2);if(lane===s.lane)return false;s.lane=lane;return true}
 function boost(s,value){if(!s.ended)s.boostHeld=Boolean(value)}
 function finish(s,reason='quit'){if(s.ended)return false;s.ended=true;s.reason=reason;s.boosting=false;s.boostHeld=false;s.events.push({type:'end',reason});return true}
 function add(s,type,lane,y=-.17,friend=null,extra={}){
  const o={id:++s.serial,type,lane,y,friend,passed:false,closest:Infinity,...extra};s.objects.push(o);return o;
 }
 const hazard=o=>o.type==='car'||o.type==='cone';
 function points(s,base){const value=Math.round(base*s.multiplier*(s.boosting?2:1));s.score+=value;return value}
 function streak(s){s.combo++;s.maxCombo=Math.max(s.maxCombo,s.combo);s.multiplier=Math.min(5,1+Math.floor(s.combo/4))}
 function loseStreak(s){s.combo=0;s.multiplier=1}
 function row(s,d){
  s.row++;
  // The designated corridor changes at most one lane between rows. Even at
  // maximum boost it leaves >.24 s to complete the .13 s steering movement.
  const gaps=[0,1,2].filter(l=>Math.abs(l-s.lastGap)<=1),change=gaps.filter(l=>l!==s.lastGap);
  const gap=random(s)<.83?change[Math.floor(random(s)*change.length)]:s.lastGap;
  const other=[0,1,2].filter(l=>l!==gap),blocked=[];
  if(random(s)<d.doubleChance)blocked.push(...other);else blocked.push(other[Math.floor(random(s)*2)]);
  const variant=Math.floor(random(s)*8);
  for(let i=0;i<blocked.length;i++)add(s,random(s)<.14?'cone':'car',blocked[i],-.17,null,{variant:(variant+i*3)%8,row:s.row});
  let path=gap;
  if(s.row%3===1){
   const pending=friends.filter(name=>!s.collected.includes(name)&&!s.objects.some(o=>!o.passed&&o.friend===name));
   if(pending.length){
    const safe=[0,1,2].filter(l=>!blocked.includes(l)&&Math.abs(l-s.lastGap)<=1);
    // Single-blocker rows offer a collectible detour rather than giving every
    // pickup away on the same automatic path.
    const alternate=safe.filter(l=>l!==gap),lane=alternate.length&&random(s)<.72?alternate[Math.floor(random(s)*alternate.length)]:gap;
    add(s,'friend',lane,-.17,pending[Math.floor(random(s)*pending.length)],{row:s.row});path=lane;
   }
  }else if(s.row%17===9&&!s.shield){add(s,'shield',gap,-.17,null,{row:s.row})}
  else if(s.row%7===3){add(s,'nitro',gap,-.17,null,{row:s.row})}
  s.lastGap=path;
  s.rowDistance=d.gap+(random(s)-.5)*.035;
 }
 function collect(s,o){
  if(o.type==='friend'){
   if(s.collected.includes(o.friend))return;
   s.collected.push(o.friend);s.totalCollected++;streak(s);const value=points(s,180);
   s.boostCharge=Math.min(100,s.boostCharge+9);
   s.events.push({type:'friend',name:o.friend,lane:o.lane,combo:s.combo,multiplier:s.multiplier,points:value});
   if(s.collected.length===friends.length){
    s.deliveries++;const bonus=points(s,900+100*s.deliveries);s.lastDelivery=[...s.collected];s.deliveryFlash=1.5;s.collected=[];
    s.events.push({type:'delivery',deliveries:s.deliveries,bonus,crew:s.lastDelivery});
   }
  }else if(o.type==='nitro'){s.boostCharge=Math.min(100,s.boostCharge+35);const value=points(s,40);s.events.push({type:'nitro',points:value})}
  else if(o.type==='shield'){s.shield=1;const value=points(s,50);s.events.push({type:'shield',points:value})}
 }
 function tick(s){
  if(s.ended)return;s.events=[];s.tick++;s.elapsed=s.tick*DT;
  const level=1+Math.floor(s.tick/1080)+Math.floor(s.deliveries/2);
  if(level!==s.level){s.level=level;s.events.push({type:'level',level})}
  const d=difficulty(s.level);
  s.invincible=Math.max(0,s.invincible-DT);s.deliveryFlash=Math.max(0,s.deliveryFlash-DT);
  // An empty tank must refill to 20%; tapping cannot bypass exhaustion.
  if(s.boostLocked&&s.boostCharge>=20)s.boostLocked=false;
  s.boosting=s.boostHeld&&!s.boostLocked&&s.boostCharge>0;
  if(s.boosting){s.boostCharge=Math.max(0,s.boostCharge-31*DT);if(!s.boostCharge)s.boostLocked=true}
  else s.boostCharge=Math.min(100,s.boostCharge+10*DT);
  s.speed=d.speed*(s.boosting?d.boostFactor:1);
  const advance=s.speed*DT;s.distance+=advance*82;
  s.scoreRemainder+=advance*12*(s.boosting?2:1);
  const earned=Math.floor(s.scoreRemainder);s.score+=earned;s.scoreRemainder-=earned;
  s.x+=(s.lane-s.x)*(1-Math.exp(-27*DT));if(Math.abs(s.x-s.lane)<.0001)s.x=s.lane;
  s.rowDistance-=advance;if(s.rowDistance<=0)row(s,d);
  for(const o of s.objects){
   const before=o.y;o.y+=advance;if(o.passed)continue;
   const dx=Math.abs(o.lane-s.x);
   if(hazard(o)&&o.y>.64&&before<.94)o.closest=Math.min(o.closest,dx);
   if(before<.875&&o.y>=.705&&dx<(hazard(o)?.385:.48)){
    if(hazard(o)){
     if(s.invincible<=0){o.passed=true;if(s.shield){s.shield=0;s.invincible=.65;s.events.push({type:'blocked',lane:o.lane})}else{s.lives--;s.invincible=1.05;loseStreak(s);s.boostCharge=Math.max(0,s.boostCharge-20);s.events.push({type:'hit',lane:o.lane,lives:s.lives});if(!s.lives){finish(s,'crash');break}}}
    }else{o.passed=true;collect(s,o)}
   }
   if(!o.passed&&o.y>.94){
    o.passed=true;
    if(hazard(o)){
     if(o.closest<.94&&o.closest>=.385&&s.invincible<=0){streak(s);const value=points(s,35);s.boostCharge=Math.min(100,s.boostCharge+3);s.events.push({type:'near',lane:o.lane,points:value,combo:s.combo})}
    }else if(o.type==='friend'){loseStreak(s);s.events.push({type:'miss',name:o.friend})}
   }
  }
  s.objects=s.objects.filter(o=>o.y<1.2&&(!o.passed||hazard(o)));
  if(!s.ended&&s.tick>=MAX_STEPS)finish(s,'complete');
 }
 function replay(seed,actions,steps){
  if(!Number.isInteger(seed)||seed<0||seed>4294967295||!Number.isInteger(steps)||steps<1||steps>MAX_STEPS||!Array.isArray(actions)||actions.length>MAX_ACTIONS)throw new RangeError('invalid_replay');
  let previous=-1,count=0;
  for(const a of actions){
   if(!a||typeof a!=='object'||!Number.isInteger(a.t)||a.t<0||a.t>=steps||a.t<previous||!((a.k==='m'&&(a.v===-1||a.v===1))||(a.k==='b'&&(a.v===0||a.v===1))))throw new RangeError('invalid_action');
   count=a.t===previous?count+1:1;if(count>4)throw new RangeError('too_many_actions');previous=a.t;
  }
  const s=create(seed);let i=0;
  while(s.tick<steps){if(s.ended)throw new RangeError('steps_after_end');while(i<actions.length&&actions[i].t===s.tick){const a=actions[i++];if(a.k==='m')move(s,a.v);else boost(s,a.v===1)}tick(s)}
  return s;
 }
 return {version,DT,MAX_STEPS,MAX_ACTIONS,friends,zones,difficulty,create,move,boost,finish,tick,add,replay};
});
