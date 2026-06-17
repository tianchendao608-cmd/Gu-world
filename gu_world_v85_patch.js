
/* ===================== V8.5 诡域历练与斗蛊战场：大地图 / 妖兽 / WASD / 手机收纳 ===================== */
(function(){
  const V85 = { adv:null, duelTicker:null, lastKeyAt:0 };
  const AREAS = [
    {id:'blood_wolf_woods',name:'血狼林',rank:'一转',cost:6,stones:[18,48],guChance:18,materials:['狼牙','血苔','暗红狼皮','噬血草'],theme:'wolf',size:34,desc:'暗红古林，树影如爪。狼群会从雾中包围新入世蛊师。',beasts:[
      {id:'blood_wolf',icon:'🐺',shape:'赤狼轮廓，背脊生骨刺',name:'噬血狼',hp:26,attack:3,defense:1,speed:1.1,skill:'血牙扑杀',skillCd:4,range:1.8,drop:'狼牙'},
      {id:'rot_wolf',icon:'🩸',shape:'腐皮垂落，眼窝泛红',name:'腐皮狼',hp:32,attack:4,defense:2,speed:0.85,skill:'腐血撕咬',skillCd:5,range:1.6,drop:'暗红狼皮'},
      {id:'wolf_king',icon:'☾',shape:'额生月痕，血雾绕身',name:'血月狼王',hp:58,attack:7,defense:3,speed:1.0,skill:'狼王啸',skillCd:7,range:2.2,drop:'血月狼心'}]},
    {id:'bone_graveyard',name:'枯骨坟场',rank:'二转',cost:12,stones:[42,96],guChance:22,materials:['白骨粉','阴火石','尸犬爪','坟土'],theme:'bone',size:42,desc:'坟土翻动，骨灯无风自燃。脚下偶尔传出抓挠声。',beasts:[
      {id:'bone_hound',icon:'☠',shape:'犬骨拼合，肋骨外翻',name:'骨犬',hp:70,attack:9,defense:5,speed:1.05,skill:'碎骨冲撞',skillCd:4,range:2.0,drop:'尸犬爪'},
      {id:'corpse_ghoul',icon:'🕯',shape:'佝偻尸影，背负阴火',name:'尸鬼',hp:88,attack:11,defense:6,speed:0.75,skill:'阴火爪',skillCd:5,range:2.5,drop:'阴火石'},
      {id:'bone_general',icon:'♜',shape:'白骨披甲，持断刃',name:'白骨将',hp:130,attack:16,defense:9,speed:0.7,skill:'骨刃横扫',skillCd:7,range:3.0,drop:'将骨残片'}]},
    {id:'black_wind_gorge',name:'黑风峡谷',rank:'三转',cost:22,stones:[90,180],guChance:26,materials:['黑风羽','裂谷石','风煞晶','鸦目'],theme:'wind',size:50,desc:'峡谷狭长，黑风像刀子贴地刮过，远处有鸦群盘旋。',beasts:[
      {id:'black_crow',icon:'🜃',shape:'黑翼展开如破布，鸦眼泛银',name:'黑翼鸦',hp:150,attack:22,defense:10,speed:1.55,skill:'俯冲啄目',skillCd:4,range:4.5,drop:'黑风羽'},
      {id:'rift_leopard',icon:'⚡',shape:'豹身如烟，爪有裂风',name:'裂风豹',hp:190,attack:27,defense:12,speed:1.7,skill:'裂风突袭',skillCd:5,range:3.0,drop:'裂谷石'},
      {id:'wind_sha',icon:'◌',shape:'半透明风煞人形',name:'风煞',hp:230,attack:32,defense:14,speed:1.25,skill:'黑风刃',skillCd:6,range:6.0,drop:'风煞晶'}]},
    {id:'ghost_swamp',name:'幽魂沼泽',rank:'四转',cost:35,stones:[180,360],guChance:30,materials:['毒沼泥','蛛丝囊','怨魂珠','鬼面壳'],theme:'swamp',size:58,desc:'毒雾贴着水面游走，沼泽深处偶有白脸倒映。',beasts:[
      {id:'wraith',icon:'👁',shape:'白影无足，面孔不断变形',name:'怨魂',hp:360,attack:44,defense:22,speed:1.2,skill:'怨念侵神',skillCd:5,range:5.5,drop:'怨魂珠'},
      {id:'ghost_spider',icon:'✺',shape:'八足修长，腹部生鬼面',name:'鬼面蛛',hp:410,attack:48,defense:26,speed:0.9,skill:'蛛丝定身',skillCd:6,range:5.0,drop:'蛛丝囊',root:2},
      {id:'swamp_python',icon:'〜',shape:'黑鳞巨蟒，鳞缝渗毒',name:'毒沼蟒',hp:520,attack:58,defense:34,speed:0.65,skill:'毒沼缠杀',skillCd:8,range:2.5,drop:'毒沼泥'}]},
    {id:'gu_abyss',name:'万蛊深渊',rank:'五转',cost:55,stones:[360,720],guChance:36,materials:['血蛊晶','深渊虫壳','母虫卵','万蛊残蜕'],theme:'abyss',size:70,desc:'深渊内有无数虫鸣回荡，像有人在耳边低语。越往里走，地面越像活物。',beasts:[
      {id:'gu_demon',icon:'𖤐',shape:'人形蛊影，背生虫翼',name:'蛊魔',hp:760,attack:82,defense:46,speed:1.1,skill:'蛊影穿心',skillCd:5,range:4.2,drop:'万蛊残蜕'},
      {id:'blood_gu_king',icon:'◈',shape:'赤甲虫王，冠如血玉',name:'血蛊王',hp:980,attack:96,defense:58,speed:0.85,skill:'血蛊爆裂',skillCd:7,range:5.0,drop:'血蛊晶'},
      {id:'abyss_mother',icon:'◎',shape:'盘踞深坑的巨大母虫',name:'深渊母虫',hp:1350,attack:118,defense:72,speed:0.35,skill:'虫潮召唤',skillCd:9,range:7.0,drop:'母虫卵'}]}
  ];
  const CLAMPS=(v,min,max)=>Math.max(min,Math.min(max,v));
  function rnum(rank){return typeof rankNum==='function'?rankNum(rank):({'一转':1,'二转':2,'三转':3,'四转':4,'五转':5}[rank]||1)}
  function playerSpeed(){ const a=computedAttrs(me); return Math.max(0.7, Math.min(4.5, 0.85 + n(a.speed)/12)); }
  function dist(a,b){return Math.hypot(n(a.x)-n(b.x),n(a.y)-n(b.y));}
  function hpMax(){return (typeof hpMaxOf==='function')?hpMaxOf(me):(computedAttrs(me).life||5)}
  function seededObstacles(area){
    const obs=[]; const size=area.size||40; const count=Math.floor(size/2);
    for(let i=0;i<count;i++) obs.push({x:(i*7+9)%size,y:(i*11+13)%size,w:2+(i%4),h:1+(i%3),kind:i%3===0?'bone':i%3===1?'mist':'rift'});
    return obs;
  }
  function blocked(x,y,area){ const size=area.size||40; if(x<0||y<0||x>size||y>size)return true; return (area.obstacles||[]).some(o=>x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h); }
  function enrichArea(a){ return {...a, obstacles:seededObstacles(a)}; }
  function replaceAdventureAreas(){
    try{ if(Array.isArray(adventureAreas)){ adventureAreas.splice(0,adventureAreas.length,...AREAS.map(enrichArea)); } }catch(e){ console.warn('V8.5 replace adventure areas failed',e); }
  }
  replaceAdventureAreas();
  window.V85_AREAS = AREAS;

  function areaCard(a,i){
    const rate=typeof adventureRewardRate==='function'?adventureRewardRate(a):1;
    const dmg=typeof areaDamage==='function'?areaDamage(a):rnum(a.rank)*5;
    const cd=typeof areaCooldownLeft==='function'?areaCooldownLeft(a):0;
    const beasts=a.beasts||[];
    return `<div class="card adventure-card v85-area-card theme-${a.theme}">
      <div class="v85-map-thumb"><span>${beasts.map(b=>b.icon).join(' ')}</span><i></i></div>
      <h3>${safe(a.name)}</h3><span class="pill">推荐 ${safe(a.rank)}</span><span class="pill">大地图 ${a.size}×${a.size}</span><span class="pill">扣血 ${dmg}</span><span class="pill">收益 ${Math.round(rate*100)}%</span><span class="pill">${cd>0?'冷却 '+cd+'秒':'可进入'}</span>
      <p>${safe(a.desc)}</p><p class="muted">妖兽：${beasts.map(b=>b.name).join('、')}</p><p class="muted">掉落：元石 ${a.stones[0]}~${a.stones[1]}｜${a.materials.join('、')}｜蛊虫概率 ${a.guChance}%</p>
      <button ${cd>0||(typeof isDead==='function'&&isDead(me))?'disabled':''} onclick="window.startAdventure(${i})">进入诡域副本</button>
    </div>`;
  }

  renderAdventure = function(){
    if(!requireLogin())return;
    replaceAdventureAreas();
    const areas = (typeof v86AllAreas==='function'?v86AllAreas():adventureAreas).filter(a=>AREAS.some(x=>x.id===a.id));
    $('content').innerHTML=`<div class="scroll-panel v85-head"><h2>历练谷 · 诡域副本</h2><p>全部历练地已改为大地图副本。WASD移动，手机使用方向盘；妖兽会追击、释放技能，胜利后统一结算奖励。</p>${isAdmin()?'<p class="muted">管理员仍可使用旧的自定义地图功能，但V8.5主线副本以五大诡域为核心。</p>':''}</div><div class="grid adventure-grid v85-adventure-grid">${areas.map(areaCard).join('')}</div>`;
  };

  function spawnBeasts(area){
    const size=area.size||40;
    return (area.beasts||[]).map((b,i)=>({...b, maxHp:b.hp, hp:b.hp, x:CLAMPS(size-6-i*4,2,size-2), y:CLAMPS(6+i*9,2,size-2), dead:false, lastSkill:0, lastHit:0, flash:0}));
  }
  function startAdvState(area){
    return {area, player:{x:3,y:Math.floor((area.size||40)/2), hp:n(me.hp||hpMax()), maxHp:hpMax(), rootedUntil:0}, beasts:spawnBeasts(area), logs:[`进入【${area.name}】：${area.desc}`], selected:0, won:false, lost:false, started:Date.now()};
  }
  function advTarget(){ const b=V85.adv; if(!b)return null; return b.beasts[b.selected] || b.beasts.find(x=>!x.dead); }
  function renderAdvModal(){
    const b=V85.adv; if(!b)return; const area=b.area, size=area.size||40, p=b.player, target=advTarget();
    const scaleStyle=`--map-size:${size};`;
    const tokens = [`<div class="v85-token hero" style="left:${p.x/size*100}%;top:${p.y/size*100}%">人</div>`].concat(b.beasts.map((m,i)=>`<button class="v85-token beast ${m.dead?'dead':''} ${i===b.selected?'sel':''}" style="left:${m.x/size*100}%;top:${m.y/size*100}%" onclick="window.v85SelectBeast(${i})"><span>${m.icon}</span></button>`)).join('');
    const obs=(area.obstacles||[]).map(o=>`<i class="v85-ob o-${o.kind}" style="left:${o.x/size*100}%;top:${o.y/size*100}%;width:${o.w/size*100}%;height:${o.h/size*100}%"></i>`).join('');
    const beasts=b.beasts.map((m,i)=>`<div class="v85-beast-row ${m.dead?'dead':''} ${i===b.selected?'sel':''}" onclick="window.v85SelectBeast(${i})"><b>${m.icon} ${safe(m.name)}</b><span>${safe(m.shape)}</span><div class="bar"><i style="width:${Math.max(0,Math.min(100,m.hp/m.maxHp*100))}%"></i></div><small>${m.hp}/${m.maxHp}｜${safe(m.skill)}｜掉落 ${safe(m.drop)}</small></div>`).join('');
    const eq=(typeof v91EquipList==='function'?v91EquipList():(Array.isArray(me.equipped)?me.equipped:[])); while(eq.length<10)eq.push(null);
    const skills=eq.map((e,i)=>{ if(!e)return `<button class="v85-skill empty"><b>${i}</b><span>空</span></button>`; const it=getItem(e.type,e.id); return `<button class="v85-skill" onclick="window.v85AdvUse(${i})"><b>${i}</b>${img(it?.image)}<span>${safe(itemName(e.type,e.id)).slice(0,4)}</span></button>`; }).join('');
    const html=`${modalHead('历练谷 · '+area.name)}<div class="v85-battle theme-${area.theme}">
      <div class="v85-stage" style="${scaleStyle}"><div class="v85-fog"></div>${obs}${tokens}</div>
      <div class="v85-side"><h3>${safe(area.name)}</h3><p class="muted">WASD移动｜速度 ${playerSpeed().toFixed(2)}｜坐标 ${p.x.toFixed(1)}, ${p.y.toFixed(1)} ${Date.now()<p.rootedUntil?'｜被定身':''}</p><div class="bar hpbar"><i style="width:${Math.max(0,Math.min(100,p.hp/p.maxHp*100))}%"></i></div><p>生命 ${p.hp}/${p.maxHp}</p><div class="toolbar"><button onclick="window.v85AdvBasic()">普攻</button><button onclick="window.v85AdvSettle()" ${b.won?'':'disabled'}>胜利结算</button></div><div class="v85-pad"><button onclick="window.v85AdvMove(0,-1)">↑</button><button onclick="window.v85AdvMove(-1,0)">←</button><button onclick="window.v85AdvMove(1,0)">→</button><button onclick="window.v85AdvMove(0,1)">↓</button></div><h3>快捷栏</h3><div class="v85-skills">${skills}</div><h3>妖兽</h3><div class="v85-beasts">${beasts}</div><h3>战斗记录</h3><div class="battle-log v85-log">${b.logs.slice(0,24).map(x=>`<p>${safe(x)}</p>`).join('')}</div></div>
    </div>`;
    $('modalContent').innerHTML=html; document.querySelectorAll('[data-close]').forEach(x=>x.onclick=closeModal);
  }
  window.v85SelectBeast=i=>{ if(V85.adv){V85.adv.selected=i; renderAdvModal();} };
  window.startAdventure = function(i){
    if(!requireLogin())return; if(typeof actionLocked==='function' && actionLocked())return;
    replaceAdventureAreas(); const a=adventureAreas[i]; if(!a)return; const cd=typeof areaCooldownLeft==='function'?areaCooldownLeft(a):0; if(cd>0)return toast(`历练冷却中：${cd}秒`);
    V85.adv=startAdvState(a); openModal('<div></div>'); renderAdvModal(); v85StartAdvLoop();
  };
  window.v85AdvMove=function(dx,dy){ const b=V85.adv; if(!b||b.won||b.lost)return; const p=b.player; if(Date.now()<p.rootedUntil){toast('被定身，暂时不能移动');return;} const step=playerSpeed(); const nx=CLAMPS(p.x+dx*step,0,b.area.size), ny=CLAMPS(p.y+dy*step,0,b.area.size); if(blocked(nx,ny,b.area)){b.logs.unshift('前方是障碍，无法通过。');} else {p.x=Number(nx.toFixed(2));p.y=Number(ny.toFixed(2));} v85BeastAi(); renderAdvModal(); };
  function advDamage(dmg,label){ const b=V85.adv,p=b.player; p.hp=Math.max(0,Number((p.hp-dmg).toFixed(2))); b.logs.unshift(`${label}，你受到 ${dmg} 伤害`); fx(`-${dmg}`); if(p.hp<=0){b.lost=true;b.logs.unshift('失败：你倒在诡域之中。'); saveMe({hp:0,deadUntil:Date.now()+30000});}}
  function v85BeastAi(){ const b=V85.adv; if(!b||b.won||b.lost)return; const now=Date.now(); b.beasts.forEach(m=>{ if(m.dead)return; const d=dist(b.player,m); if(d>m.range){ const step=Math.max(0.25,n(m.speed)||0.8); const dx=(b.player.x-m.x)/Math.max(0.01,d), dy=(b.player.y-m.y)/Math.max(0.01,d); const nx=CLAMPS(m.x+dx*step,0,b.area.size), ny=CLAMPS(m.y+dy*step,0,b.area.size); if(!blocked(nx,ny,b.area)){m.x=Number(nx.toFixed(2));m.y=Number(ny.toFixed(2));} }
      else if(now-n(m.lastSkill)>n(m.skillCd||4)*1000){ m.lastSkill=now; const dmg=Math.max(1, Number((n(m.attack)*1.5 - computedAttrs(me).defense*0.15).toFixed(2))); if(m.root)b.player.rootedUntil=Date.now()+m.root*1000; advDamage(dmg,`${m.name} 使用【${m.skill}】${m.root?'，蛛丝缠身':''}`); }
      else if(now-n(m.lastHit)>1800){ m.lastHit=now; const dmg=Math.max(0.5, Number((n(m.attack)-computedAttrs(me).defense*0.12).toFixed(2))); advDamage(dmg,`${m.name} 近身攻击`); }
    }); }
  function advHit(dmg,name,range=2.2){ const b=V85.adv; if(!b||b.won||b.lost)return; let m=advTarget(); if(!m||m.dead)return toast('没有目标'); const d=dist(b.player,m); if(d>range)return toast(`距离过远：${d.toFixed(1)} / 需要 ${range}`); m.hp=Math.max(0,Number((m.hp-dmg).toFixed(2))); b.logs.unshift(`你使用【${name}】命中 ${m.name}，伤害 ${dmg}`); fx(`-${dmg}`); if(m.hp<=0){m.dead=true;b.logs.unshift(`${m.name} 被击杀，掉落气息凝聚。`); const next=b.beasts.findIndex(x=>!x.dead); if(next>=0)b.selected=next;} if(!b.beasts.find(x=>!x.dead)){b.won=true;b.logs.unshift('胜利！全部妖兽已被击败，可以开始结算奖励。');} v85BeastAi(); renderAdvModal(); }
  window.v85AdvBasic=function(){ const f=(typeof v93Fist==='function')?v93Fist():{name:'基础拳法',damage:0.25,range:2,cooldown:1}; const key='v85_basic_'+accountId; const left=n(localStorage.getItem(key))-Date.now(); if(left>0)return toast(`普攻冷却：${Math.ceil(left/1000)}秒`); localStorage.setItem(key,String(Date.now()+Math.max(1,n(f.cooldown)||1)*1000)); advHit(n(f.damage)||0.25,f.name||'基础拳法',n(f.range)||2.2); };
  window.v85AdvUse=async function(slot){ const eq=typeof v91EquipList==='function'?v91EquipList():(me.equipped||[]); const e=eq[slot]; if(!e)return toast('空格'); const item=getItem(e.type,e.id); if(!item)return toast('蛊物不存在'); if(!isAbsorbed(e.type,e.id,me))return toast('未吸收不能使用'); const cdKey=`v85_adv_cd_${accountId}_${slot}`; const left=n(localStorage.getItem(cdKey))-Date.now(); if(left>0)return toast(`冷却中：${Math.ceil(left/1000)}秒`); const cost=itemUseCost(e.type,item); if(n(me.essence)<cost)return toast('真元不足'); await saveMe({essence:n(me.essence)-cost}); const attrs=effectAttrs(e.type,item,me,true); const dmg=Math.max(0.25,Number((n(attrs.attack)+n(attrs.spirit)*0.22+n(attrs.speed)*0.18).toFixed(2))); localStorage.setItem(cdKey,String(Date.now()+Math.max(1,(typeof secondsFrom==='function'?secondsFrom(cooldownText(item)):n(item.cooldown))||3)*1000)); advHit(dmg,item.name||e.id,n(item.range)||4); };
  window.v85AdvSettle=async function(){ const b=V85.adv;if(!b||!b.won)return; const a=b.area; const rate=typeof adventureRewardRate==='function'?adventureRewardRate(a):1; const dmg=typeof areaDamage==='function'?areaDamage(a):rnum(a.rank)*5; const stones=Math.floor((a.stones[0]+Math.random()*(a.stones[1]-a.stones[0]+1))*rate); const mat=a.materials[Math.floor(Math.random()*a.materials.length)]||'诡域残材'; const matCount=1+Math.floor(Math.random()*3); const inv=myInv(); inv.materials ||= {}; inv.materials[mat] ||= {count:0}; inv.materials[mat].count+=matCount; const patch={hp:Math.max(1,Math.floor(b.player.hp)), stones:n(me.stones)+stones, inventory:inv, cultivation:n(me.cultivation)+Math.ceil(stones/3), adventureCount:n(me.adventureCount)+1, areaCooldowns:{...(me.areaCooldowns||{}),[a.id]:Date.now()+(typeof V83!=='undefined'?V83.areaCooldown:60000)}}; await saveMe(patch); toast(`结算完成：元石+${stones}，${mat}×${matCount}`); closeModal(); V85.adv=null; render(); };
  function v85StartAdvLoop(){ if(V85.advTimer)clearInterval(V85.advTimer); V85.advTimer=setInterval(()=>{ if(V85.adv && $('modal')?.open){v85BeastAi(); renderAdvModal();} },1600); }

  // 斗蛊台：大地图视觉、移动与距离限制。位置存入房间，强制挑战也可用。
  function duelPos(r,id){ const p=r.positions?.[id]; if(p)return {...p}; const i=(r.players||[]).indexOf(id); return i===0?{x:6,y:24}:{x:44,y:24}; }
  async function setDuelPos(roomId,who,pos){ const r=typeof v91DuelRoom==='function'?v91DuelRoom(roomId):null; const positions={...(r?.positions||{})}; positions[who]=pos; await setDoc(ref('duelRooms',roomId),{positions,updatedAt:serverTimestamp()},{merge:true}); }
  window.v85DuelMove=async function(roomId,dx,dy){ const r=typeof v91DuelRoom==='function'?v91DuelRoom(roomId):null; if(!r||r.status!=='active')return; if(!(r.players||[]).includes(accountId))return; const pos=duelPos(r,accountId); const step=playerSpeed(); const nx=CLAMPS(pos.x+dx*step,1,49), ny=CLAMPS(pos.y+dy*step,1,49); await setDuelPos(roomId,accountId,{x:Number(nx.toFixed(2)),y:Number(ny.toFixed(2))}); };
  const oldDuelUse=window.duelUse;
  window.duelUse=async function(roomId,type,id,slot){ const r=typeof v91DuelRoom==='function'?v91DuelRoom(roomId):null; if(r&&r.status==='active'&&(r.players||[]).includes(accountId)){ const enemy=(r.players||[]).find(x=>x!==accountId); const d=dist(duelPos(r,accountId),duelPos(r,enemy)); let range=2.2; if(type!=='basic'&&type!=='fist'){ const item=getItem(type,id); range=n(item?.range)||4; } if(d>range)return toast(`距离过远：${d.toFixed(1)} / 需要 ${range} 内`); } return oldDuelUse?oldDuelUse(roomId,type,id,slot):null; };
  v91RenderRoom = function(r){
    const enemy=(r.players||[]).find(x=>x!==accountId); const myHp=n(r.hp?.[accountId]), enemyHp=n(r.hp?.[enemy]); const myMax=n(r.maxHp?.[accountId]||1), enemyMax=n(r.maxHp?.[enemy]||1); const p1=duelPos(r,accountId), p2=duelPos(r,enemy); const d=dist(p1,p2).toFixed(1);
    const eq=typeof v91EquipList==='function'?v91EquipList():[]; while(eq.length<10)eq.push(null);
    const skills=eq.map((e,i)=>{ if(!e)return `<button class="v85-skill empty"><b>${i}</b><span>空</span></button>`; const item=getItem(e.type,e.id); const left=typeof v91SkillLeft==='function'?v91SkillLeft(r.id,i):0; return `<button class="v85-skill" onclick="window.duelUse('${r.id}','${e.type}','${e.id}',${i})"><b>${i}</b>${img(item?.image)}<span>${safe(itemName(e.type,e.id)).slice(0,4)}</span><em>${left>0?left+'秒':''}</em></button>`; }).join('');
    const start=(typeof v92CountdownBanner==='function')?v92CountdownBanner(r):''; const victory=(typeof v92VictoryBanner==='function')?v92VictoryBanner(r):'';
    return `<div class="duel-page v85-duel">${start}${victory}<div class="duel-top"><button onclick="window.leaveDuelRoom()">返回斗蛊台</button><span class="pill">${r.status==='active'?'斗蛊中':'已结束'}</span><span class="pill">距离 ${d}</span></div><div class="v85-stage duel-map theme-abyss"><div class="v85-fog"></div><i class="v85-ob o-rift" style="left:42%;top:8%;width:10%;height:80%"></i><i class="v85-ob o-mist" style="left:10%;top:40%;width:20%;height:8%"></i><div class="v85-token hero" style="left:${p1.x/50*100}%;top:${p1.y/50*100}%">我</div><div class="v85-token beast enemy-token" style="left:${p2.x/50*100}%;top:${p2.y/50*100}%">敌</div></div><div class="duel-vs v85-vs"><div class="fighter enemy"><h3>${safe(v91PlayerName(enemy))}</h3><div class="bar hpbar"><i style="width:${Math.max(0,Math.min(100,enemyHp/enemyMax*100))}%"></i></div><p>${enemyHp}/${enemyMax}</p></div><div class="fighter self"><h3>${safe(v91PlayerName(accountId))}</h3><div class="bar hpbar"><i style="width:${Math.max(0,Math.min(100,myHp/myMax*100))}%"></i></div><p>${myHp}/${myMax}</p></div></div><div class="toolbar"><button onclick="window.duelBasicAttack('${r.id}')">普攻</button></div><div class="v85-pad"><button onclick="window.v85DuelMove('${r.id}',0,-1)">↑</button><button onclick="window.v85DuelMove('${r.id}',-1,0)">←</button><button onclick="window.v85DuelMove('${r.id}',1,0)">→</button><button onclick="window.v85DuelMove('${r.id}',0,1)">↓</button></div><h3>装备蛊物</h3><div class="v85-skills">${skills}</div><h3>战斗记录</h3><div class="battle-log duel-log">${(r.logs||[]).map(x=>`<p>${safe(x)}</p>`).join('')}</div></div>`;
  };

  // 手机端生命面板：默认收纳快捷栏，避免挡屏。
  const oldRenderVitals=renderVitals;
  renderVitals=function(){ oldRenderVitals(); const box=$('vitalsDock'); if(!box||!me)return; if(!box.querySelector('.v85-collapse-btn')){ const btn=document.createElement('button'); btn.className='v85-collapse-btn'; btn.textContent='战斗栏'; btn.onclick=()=>box.classList.toggle('v85-open'); const mini=box.querySelector('.equip-mini'); box.insertBefore(btn,mini||null); if(mini)mini.classList.add('v85-mini-hide'); } };
  document.addEventListener('keydown',e=>{ const tag=(document.activeElement?.tagName||'').toLowerCase(); if(['input','textarea','select'].includes(tag))return; const k=e.key.toLowerCase(); if(!['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k))return; if(Date.now()-V85.lastKeyAt<90)return; V85.lastKeyAt=Date.now(); const dir={w:[0,-1],s:[0,1],a:[-1,0],d:[1,0],arrowup:[0,-1],arrowdown:[0,1],arrowleft:[-1,0],arrowright:[1,0]}[k]; if(V85.adv){e.preventDefault();window.v85AdvMove(dir[0],dir[1]);return;} const r=typeof v91DuelRoom==='function'?v91DuelRoom(window.v91CurrentRoom):null; if(r&&current==='arena'){e.preventDefault();window.v85DuelMove(r.id,dir[0],dir[1]);} });
  const oldRenderRules=renderRules;
  renderRules=function(){ oldRenderRules(); $('content').innerHTML += `<div class="scroll-panel"><h2>V8.5 诡域历练与斗蛊战场</h2><p>历练谷五大地图：血狼林、枯骨坟场、黑风峡谷、幽魂沼泽、万蛊深渊，全部改为大地图副本。</p><p>WASD/方向键移动，手机方向盘移动；速度属性会影响移动速度。妖兽有图案、形状、技能、掉落与追击AI。</p><p>斗蛊台加入战场地图与距离限制，双方需要移动接近后才能普攻或释放蛊物。</p><p>手机底部状态栏默认收纳快捷栏，点击“战斗栏”展开。</p></div>`; };
  try{ initNav(); render(); }catch(e){ console.warn('V8.5 init failed',e); }
})();
