(function(root,factory){const game=factory();if(typeof module==='object'&&module.exports)module.exports=game;else root.KarnitArcade=game})(globalThis,()=>{
 'use strict';
 const friends=['אביחי','אוראל','עידן','אגם','יאנקו','איתי'];
 const zones=[['טיילת השקיעה',0],['לילה בעיר',1],['המרינה',2],['שכונת הדקלים',3],['מרכז העיר',8],['הנמל',4],['שדה התעופה',6],['גשר האיים',10],['הביצות',7],['אתר הבנייה',9],['המחלף',5],['רחבת הדריפט',11]];
 function difficulty(level){const n=Math.max(0,Math.floor(level)-1);return {speed:Math.min(.49,.22+n*.022),interval:Math.max(.86,1.95-n*.105),doubleChance:n<2?0:Math.min(.5,.12+(n-2)*.045),duration:66+Math.min(n,11)*3,friendInterval:8.4}}
 function budget(level){return difficulty(level).duration+72}
 function create(seed=Date.now()){return {seed:seed>>>0,lane:1,x:1,elapsed:0,levelElapsed:0,distance:0,progress:0,level:1,left:budget(1),lives:4,score:0,collected:[],totalCollected:0,objects:[],spawn:3.5,friendTimer:1.4,bonusTimer:10,invincible:2,shield:0,slow:0,combo:0,cleared:false,ended:false,reason:null,events:[],serial:0,clearedBonus:0}}
 function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296}
 function move(s,direction){if(!s.ended&&!s.cleared&&Number.isFinite(direction))s.lane=Math.max(0,Math.min(2,s.lane+Math.sign(direction)))}
 function add(s,type,lane,y=-.15,friend=null,extra={}){s.objects.push({id:++s.serial,type,lane,y,friend,passed:false,...extra})}
 function finish(s,reason){if(s.ended)return;s.ended=true;s.reason=reason;s.score+=s.collected.length*100}
 function nextLevel(s){if(!s.cleared||s.ended)return false;s.level++;s.left=budget(s.level)+Math.min(15,Math.floor(s.left*.1));s.lives=Math.min(5,s.lives+1);s.levelElapsed=0;s.distance=0;s.progress=0;s.collected=[];s.objects=[];s.spawn=3.2;s.friendTimer=1.6;s.bonusTimer=9;s.invincible=2.5;s.shield=0;s.slow=0;s.cleared=false;s.combo=0;s.events=[];return true}
 const hazard=o=>o.type==='car'||o.type==='cone';
 function clearLanes(s,range=.3){return [0,1,2].filter(l=>!s.objects.some(o=>!o.passed&&o.lane===l&&o.y<range&&hazard(o)))}
 function tick(s,delta){
  if(s.ended||s.cleared)return;s.events=[];const dt=Math.max(0,Math.min(.05,Number.isFinite(delta)?delta:0));
  const settings=difficulty(s.level);s.elapsed+=dt;s.levelElapsed+=dt;s.left=Math.max(0,s.left-dt);s.invincible=Math.max(0,s.invincible-dt);s.shield=Math.max(0,s.shield-dt);s.slow=Math.max(0,s.slow-dt);
  s.x+=(s.lane-s.x)*(1-Math.exp(-15*dt));const speed=settings.speed*(s.slow>0?.65:1);s.distance+=speed*dt;s.progress=Math.min(1,s.distance/(settings.speed*settings.duration));
  s.spawn-=dt;s.friendTimer-=dt;s.bonusTimer-=dt;
  if(s.spawn<=0){
   const gap=Math.floor(random(s)*3),lanes=[0,1,2].filter(l=>l!==gap&&!s.objects.some(o=>!o.passed&&o.type==='friend'&&o.lane===l&&o.y<.32));
   if(lanes.length){const first=lanes[Math.floor(random(s)*lanes.length)];add(s,random(s)<.84?'car':'cone',first,-.15,null,{variant:Math.floor(random(s)*19)});if(lanes.length>1&&random(s)<settings.doubleChance)add(s,'car',lanes.find(l=>l!==first),-.15,null,{variant:Math.floor(random(s)*19)})}
   s.spawn=settings.interval;
  }
  if(s.friendTimer<=0){
   const pending=friends.filter(n=>!s.collected.includes(n)&&!s.objects.some(o=>o.friend===n&&!o.passed)),safe=clearLanes(s);
   if(pending.length&&safe.length){add(s,'friend',safe[Math.floor(random(s)*safe.length)],-.15,pending[Math.floor(random(s)*pending.length)]);s.friendTimer=settings.friendInterval}
   else s.friendTimer=pending.length ? .65 : 1.5;
  }
  if(s.bonusTimer<=0){const safe=clearLanes(s,.34);if(safe.length){const roll=random(s);add(s,roll<.45?'clock':roll<.74?'shield':'slow',safe[Math.floor(random(s)*safe.length)],-.15,null,{bonus:random(s)<.85?10:30})}s.bonusTimer=12.5}
  for(const o of s.objects){
   o.y+=speed*dt;
   if(!o.passed&&Math.abs(o.y-.79)<(hazard(o) ? .095 : .075)&&Math.abs(o.lane-s.x)<(hazard(o) ? .38 : .48)){
    if(o.type==='friend'){o.passed=true;if(!s.collected.includes(o.friend)){s.collected.push(o.friend);s.totalCollected++;s.combo++;s.score+=150+s.combo*25;s.events.push({type:'friend',name:o.friend,lane:o.lane,combo:s.combo})}}
    else if(o.type==='clock'){o.passed=true;s.left=Math.min(budget(s.level)+45,s.left+(o.bonus||10));s.score+=75;s.events.push({type:'clock',bonus:o.bonus||10})}
    else if(o.type==='shield'){o.passed=true;s.shield=9;s.score+=75;s.events.push({type:'shield'})}
    else if(o.type==='slow'){o.passed=true;s.slow=6;s.score+=75;s.events.push({type:'slow'})}
    else if(s.invincible<=0){o.passed=true;if(s.shield>0){s.shield=0;s.invincible=1;s.events.push({type:'blocked'})}else{s.lives--;s.combo=0;s.invincible=2;s.events.push({type:'hit'});if(s.lives<=0){finish(s,'crash');break}}}
   }
   if(!o.passed&&o.y>.94){o.passed=true;if(hazard(o))s.score+=15*s.level;else if(o.type==='friend')s.events.push({type:'miss',name:o.friend})}
  }
  s.objects=s.objects.filter(o=>o.y<1.18&&(!o.passed||hazard(o)));
  if(!s.ended&&s.collected.length===friends.length&&s.progress>=1){s.clearedBonus=500*s.level+Math.round(s.left)*2;s.score+=s.clearedBonus;s.cleared=true;s.events.push({type:'level'})}
  if(!s.ended&&!s.cleared&&s.left<=0)finish(s,'time');
 }
 return {friends,zones,difficulty,budget,create,move,tick,add,nextLevel};
});
