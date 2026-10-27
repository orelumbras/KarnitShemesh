(function(root,factory){const game=factory();if(typeof module==='object'&&module.exports)module.exports=game;else root.KarnitArcade=game})(globalThis,()=>{
 'use strict';
 const friends=['אוראל','אגם','איתי','עידן','אביחי','יאנקו','רם','איליי'];
 function create(seed=Date.now()){return {seed:seed>>>0,lane:1,x:1,elapsed:0,left:60,lives:3,score:0,collected:[],objects:[],spawn:1,friendTimer:1.8,bonusTimer:8,invincible:0,ended:false,reason:null,events:[],serial:0}}
 function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296}
 function move(s,direction){if(!s.ended)s.lane=Math.max(0,Math.min(2,s.lane+Math.sign(direction)))}
 function add(s,type,lane,y=-.12,friend=null){s.objects.push({id:++s.serial,type,lane,y,friend,passed:false})}
 function finish(s,reason){s.ended=true;s.reason=reason;s.score+=s.collected.length*150+(reason==='crew'?Math.round(s.left)*10:0)}
 function tick(s,delta){if(s.ended)return;s.events=[];const dt=Math.max(0,Math.min(.05,delta));s.elapsed+=dt;s.left=Math.max(0,s.left-dt);s.invincible=Math.max(0,s.invincible-dt);s.x+=(s.lane-s.x)*Math.min(1,dt*16);const speed=.31+Math.min(.16,s.elapsed*.0028);
 s.spawn-=dt;s.friendTimer-=dt;s.bonusTimer-=dt;
 if(s.spawn<=0){const lane=Math.floor(random(s)*3);add(s,random(s)<.7?'car':'cone',lane);s.spawn=1.25-Math.min(.28,s.elapsed*.003)}
 if(s.friendTimer<=0){const pending=friends.filter(n=>!s.collected.includes(n)&&!s.objects.some(o=>o.friend===n));if(pending.length){const name=pending[Math.floor(random(s)*pending.length)];let lane=Math.floor(random(s)*3);if(s.objects.some(o=>o.lane===lane&&o.y<.12&&['car','cone'].includes(o.type)))lane=(lane+1)%3;add(s,'friend',lane,-.18,name)}s.friendTimer=2.8}
 if(s.bonusTimer<=0){add(s,'clock',Math.floor(random(s)*3),-.2);s.bonusTimer=10}
 for(const o of s.objects){o.y+=speed*dt;if(!o.passed&&Math.abs(o.y-.79)<.065&&Math.abs(o.lane-s.x)<.52){if(o.type==='friend'){o.passed=true;if(!s.collected.includes(o.friend)){s.collected.push(o.friend);s.score+=100;s.events.push({type:'friend',name:o.friend})}}else if(o.type==='clock'){o.passed=true;s.left=Math.min(75,s.left+5);s.score+=50;s.events.push({type:'clock'})}else if(s.invincible<=0){o.passed=true;s.lives--;s.invincible=1.5;s.events.push({type:'hit'});if(s.lives<=0){finish(s,'crash');break}}}else if(!o.passed&&o.y>.9&&['car','cone'].includes(o.type)){o.passed=true;s.score+=10}}
 s.objects=s.objects.filter(o=>o.y<1.15&&(!o.passed||['car','cone'].includes(o.type)));
 if(!s.ended&&s.collected.length===friends.length)finish(s,'crew');if(!s.ended&&s.left<=0)finish(s,'time');
 }
 return {friends,create,move,tick,add};
});
