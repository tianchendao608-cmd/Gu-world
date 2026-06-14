import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, getDoc, getDocs, where } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBn_b3C0EEt5ETRMQXVCjaxFf9SRgOiBKg",
  authDomain: "gu-world.firebaseapp.com",
  projectId: "gu-world",
  storageBucket: "gu-world.firebasestorage.app",
  messagingSenderId: "520066392434",
  appId: "1:520066392434:web:8b6203c35f57dd143bfdeb",
  measurementId: "G-RG829DQ72Z"
};

const ADMIN_PASS = "yunchenguo";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let uid = null;
let current = "home";
let accountId = localStorage.getItem("guAccountId") || "";
let admin = localStorage.getItem("guAdmin") === "1";
let me = null;
let unsubbed = false;

const state = { users: [], players: [], guworms: [], killmoves: [], guhouses: [], recipes: [], materials: [], trades: [], messages: [], sects: [] };
const paths = ["气道","血道","力道","雪道","玉道","叶道","木道","金道","土道","雷道","变化道","风道","火道","沙道","魂道","炼道","运道","杀道","水道","云道","天道","奴道","算道","星道","光道","石道","月道","念道"];
const attainments = ["无","准大师","大师","准宗师","宗师","大宗师","无上大宗师"];
const ranks = ["一转","二转","三转","四转","五转","六转","七转","八转","九转"];
const minorRealms = ["初期","中期","后期","巅峰"];
const aptPct = {"十绝体":1, "甲":0.85, "乙":0.75, "丙":0.60, "丁":0.45};
const aptitudePool = [{n:"十绝体",w:1},{n:"甲",w:10},{n:"乙",w:20},{n:"丙",w:30},{n:"丁",w:39}];
const baseEssence = {"一转":60,"二转":140,"三转":300,"四转":620,"五转":1500,"六转":3000,"七转":8000,"八转":20000,"九转":50000};
const essenceName = {"一转":"青铜真元","二转":"赤铁真元","三转":"白银真元","四转":"黄金真元","五转":"紫金真元","六转":"青提仙元","七转":"红荔仙元","八转":"白梨仙元","九转":"黄杏仙元"};
const essenceClass = {"一转":"essence-green","二转":"essence-red","三转":"essence-silver","四转":"essence-gold","五转":"essence-purple","六转":"essence-green","七转":"essence-red","八转":"essence-silver","九转":"essence-gold"};
const attrKeys = ["attack","defense","life","speed","spirit"];
const attrCN = {attack:"攻击",defense:"防御",life:"生命",speed:"速度",spirit:"精神"};
const collectionByType = {guworms:"guworms", killmoves:"killmoves", guhouses:"guhouses", recipes:"recipes", materials:"materials"};
const typeCN = {guworms:"蛊虫", killmoves:"杀招", guhouses:"凡蛊屋", recipes:"蛊方", materials:"蛊材"};
const navs = [
  ["home","天机殿","世界总览、状态、快速入口"],["players","人物阁","玩家档案、境界、属性、成就"],["guworms","蛊虫阁","蛊虫图鉴、购买、炼化、使用"],["killmoves","杀招阁","杀招创作、审核、吸收、使用"],["guhouses","凡蛊屋阁","凡蛊屋创作、审核、吸收、使用"],["materials","蛊材阁","蛊材库存与交易材料"],["recipes","蛊方阁","蛊方储存、购买与审核"],["bag","乾坤袋","个人背包、资产、已吸收蛊物"],["trades","交易坊","线上交易，元石与背包物品交换"],["chat","传音阁","世界、私聊、群聊"],["sects","势力殿","宗门势力排名"],["rankings","天机榜","战力、财富、胜场排行"],["review","审核阁","管理员审核玩家创作"],["rules","世界规则","境界、真元、吸收与规则"]
];
const icons = {home:"✦",players:"人",guworms:"蛊",killmoves:"杀",guhouses:"屋",materials:"材",recipes:"方",bag:"袋",trades:"市",chat:"音",sects:"宗",rankings:"榜",review:"审",rules:"卷"};

function $(id){return document.getElementById(id)}
function safe(v){return (v ?? "").toString().replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
function n(v){return Number(v||0)}
function col(name){return collection(db,name)}
function ref(name,id){return doc(db,name,id)}
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;$('toast').appendChild(d);setTimeout(()=>d.remove(),2400)}
function fx(t){const d=document.createElement('div');d.className='battle-float';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2000)}
function closeModal(){const m=$('modal'); if(m?.open) m.close()}
function modalHead(t){return `<div class="modal-head"><h2>${safe(t)}</h2><button class="close" data-close>关闭</button></div>`}
function openModal(html){$('modalContent').innerHTML=html;$('modal').showModal(); document.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal)}
function rankNum(rank){return Math.max(1, ranks.indexOf(rank)+1 || 1)}
function realmRank(realm){return ranks.find(r=>(realm||"").includes(r))||"一转"}
function minorIndex(realm){const i=minorRealms.findIndex(x=>(realm||"").includes(x)); return i<0?0:i}
function maxEssence(p=me){const rank=realmRank(p?.realm||"一转初期"); return Math.floor((baseEssence[rank]||60)*(aptPct[p?.aptitude]||0.45));}
function maxLife(p=me){return 5 + computedAttrs(p).life;}
function slots(p=me){const r=rankNum(realmRank(p?.realm)); const m=minorIndex(p?.realm); return ((r-1)*4 + m + 1)*2;}
function isAdmin(){return admin || me?.role === "admin"}
function myInv(){return me?.inventory || {guworms:{},killmoves:{},guhouses:{},recipes:{},materials:{}}}
function itemArr(type){return state[type]||[]}
function getItem(type,id){return itemArr(type).find(x=>x.id===id)}
function approved(arr){return arr.filter(x=>x.status==="approved" || !x.status || isAdmin() || x.creator===accountId)}
function samePath(item,p=me){return item?.path && (item.path===p?.mainPath || item.path===p?.subPath)}
function itemName(type,id){return getItem(type,id)?.name || id}
function itemRank(item){return item?.rank || "一转"}
function itemAbsorbCost(type,item,p=me){
  if(!item) return 0;
  if(type==='guworms'){
    let cost = n(item.absorbCost || item.refineCost || 10);
    if(item.path && !samePath(item,p)) cost = Math.ceil(cost*1.5);
    return cost;
  }
  if(type==='killmoves' || type==='guhouses'){
    const ids = item.guIds || item.requiredIds || [];
    let sum = ids.reduce((a,id)=>a + itemAbsorbCost('guworms', getItem('guworms', id), p), 0);
    return sum || n(item.absorbCost || 0);
  }
  return 0;
}
function itemUseCost(type,item){
  if(!item) return 0;
  if(type==='guworms') return n(item.useCost || 1);
  if(type==='killmoves' || type==='guhouses'){
    const ids = item.guIds || item.requiredIds || [];
    let sum = ids.reduce((a,id)=>a + itemUseCost('guworms', getItem('guworms', id)), 0);
    return n(item.useCost || sum || 1);
  }
  return 0;
}
function effectAttrs(type,item,p=me){
  const out = {attack:0, defense:0, life:0, speed:0, spirit:0};
  if(!item) return out;
  if(type==='guworms'){
    attrKeys.forEach(k=>out[k]=n(item[k]));
    if(item.path && !samePath(item,p)) attrKeys.forEach(k=>out[k]=Math.floor(out[k]/2));
    return out;
  }
  if(type==='killmoves'){
    const selected = item.effectAttr || 'attack';
    const ids = item.guIds || item.requiredIds || [];
    out[selected] = ids.reduce((a,id)=>a+n(getItem('guworms',id)?.[selected]),0) || n(item[selected]);
    return out;
  }
  if(type==='guhouses'){
    const ids = item.guIds || item.requiredIds || [];
    attrKeys.forEach(k=>out[k]=ids.reduce((a,id)=>a+n(getItem('guworms',id)?.[k]),0) || n(item[k]));
    return out;
  }
  return out;
}
function computedAttrs(p=me){
  const base = {attack:5, defense:5, life:5, speed:5, spirit:5};
  const absorbed = p?.absorbed || {guworms:{}, killmoves:{}, guhouses:{}};
  ['guworms','killmoves','guhouses'].forEach(type=>{
    Object.keys(absorbed[type]||{}).forEach(id=>{
      const attrs = effectAttrs(type, getItem(type,id), p);
      attrKeys.forEach(k=>base[k]+=attrs[k]);
    })
  });
  return base;
}
function invCount(type,id){return n(myInv()[type]?.[id]?.count)}
function hasInv(type,id){return invCount(type,id)>0}
function canEditItem(item){return isAdmin() || item.creator === accountId}
function canCreateKillOrHouse(type){
  if(isAdmin()) return true;
  const p = me || {};
  const mainOK = (p.mainAttain==='大师'||p.mainAttain==='准宗师'||p.mainAttain==='宗师'||p.mainAttain==='大宗师'||p.mainAttain==='无上大宗师');
  const houseOK = (p.mainAttain==='宗师'||p.mainAttain==='大宗师'||p.mainAttain==='无上大宗师');
  return type==='killmoves' ? mainOK : houseOK;
}
function setLocalAccount(id){accountId=id; localStorage.setItem('guAccountId',id)}
async function saveMe(patch){
  if(!accountId) return;
  // 重要：这里不能用 {merge:true}。Firestore 对嵌套对象会递归合并，
  // 删除 inventory/absorbed 里的某个蛊物时，旧键会被保留下来，导致刷新后又出现。
  // 所以保存玩家状态时使用整份玩家文档覆盖，才能真正删除嵌套键。
  const next = {...(me||{}), ...patch, updatedAt:serverTimestamp()};
  await setDoc(ref('users',accountId), next);
  me = {...next, id: accountId};
}
function pickAptitude(){let r=Math.random()*100, acc=0; for(const a of aptitudePool){acc+=a.w; if(r<=acc) return a.n} return '丁'}

async function boot(){
  initNav(); signInAnonymously(auth).catch(e=>toast('匿名连接失败：'+e.message));
  onAuthStateChanged(auth,u=>{uid=u?.uid; subscribeAll(); renderUser(); render();});
  $('adminBtn').onclick=()=>{if(admin){admin=false;localStorage.removeItem('guAdmin');toast('已退出管理员');}else{const p=prompt('输入管理员口令'); if(p===ADMIN_PASS){admin=true;localStorage.setItem('guAdmin','1');toast('管理员已开启');}else toast('口令不对');} renderUser(); render();};
  $('openProfileBtn').onclick=()=> accountId ? profileModal() : loginModal();
  $('globalSearch').oninput=render;
}
function initNav(){ $('nav').innerHTML=navs.map(([id,t])=>`<button class="nav-btn ${id===current?'active':''}" data-nav="${id}"><b>${icons[id]}</b>${t}</button>`).join(''); document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>go(b.dataset.nav)); }
function go(id){current=id; const meta=navs.find(x=>x[0]===id); $('pageTitle').textContent=meta?.[1]||''; $('pageDesc').textContent=meta?.[2]||''; initNav(); render();}
function subscribeAll(){ if(unsubbed) return; unsubbed=true; ['users','players','guworms','killmoves','guhouses','recipes','materials','trades','sects'].forEach(name=>onSnapshot(col(name),snap=>{state[name]=snap.docs.map(d=>({id:d.id,...d.data()})); if(name==='users') me = state.users.find(u=>u.id===accountId)||null; renderUser(); render();})); onSnapshot(query(col('messages'),orderBy('createdAt','asc')),snap=>{state.messages=snap.docs.map(d=>({id:d.id,...d.data()})); if(current==='chat') render();}); }
function renderUser(){ const name = me?.name || accountId || '未入世'; $('currentUserName').textContent = `${name} · ${isAdmin()?'管理员':me?'玩家':'游客'}`; renderVitals(); }
function renderVitals(){
  let box=$('vitalsDock'); if(!box){box=document.createElement('div'); box.id='vitalsDock'; document.body.appendChild(box)}
  if(!me){box.innerHTML=`<button onclick="window.loginModal()">入世登录</button>`;return}
  const attrs=computedAttrs(me), hpMax=attrs.life, hp=n(me.hp||hpMax), esMax=maxEssence(me), es=n(me.essence||esMax), rank=realmRank(me.realm);
  box.innerHTML=`<div class="vital-title">${safe(me.name||accountId)}</div><div class="bar-wrap"><span>生命 ${hp}/${hpMax}</span><div class="bar"><i style="width:${Math.min(100,hp/hpMax*100)}%"></i></div></div><div class="bar-wrap"><span>${essenceName[rank]} ${es}/${esMax}</span><div class="bar essence ${essenceClass[rank]}"><i style="width:${Math.min(100,es/esMax*100)}%"></i></div></div><div class="stone-line">元石 ${n(me.stones)} <button onclick="window.restoreEssence()">恢复真元</button></div><button onclick="window.goBag()">打开乾坤袋</button>`;
}
window.loginModal=loginModal; window.goBag=()=>go('bag');
function loginModal(){openModal(`${modalHead('五域两天入世令')}<div class="form"><label>玩家ID<input id="loginId" value="${safe(accountId)}" placeholder="例如：yunchen"></label><label>口令<input id="loginPass" type="password" placeholder="自己记住"></label><div class="toolbar"><button id="loginBtn">进入世界</button><button id="createAccountBtn">创建身份</button></div><p class="muted">内部简易口令系统，用来防止换浏览器后身份丢失。不要用重要密码。</p></div>`);
 $('loginBtn').onclick=async()=>{const id=$('loginId').value.trim(); const pass=$('loginPass').value; if(!id||!pass)return toast('填写ID与口令'); const d=await getDoc(ref('users',id)); if(!d.exists())return toast('没有这个玩家ID'); if(d.data().password!==pass)return toast('口令错误'); setLocalAccount(id); me={id,...d.data()}; closeModal(); toast('入世成功'); renderUser(); render();};
 $('createAccountBtn').onclick=async()=>{const id=$('loginId').value.trim(); const pass=$('loginPass').value; if(!id||!pass)return toast('填写ID与口令'); const d=await getDoc(ref('users',id)); if(d.exists())return toast('这个ID已存在'); const apt=pickAptitude(); const data={name:id,password:pass,role:'player',aptitude:apt,realm:'一转初期',mainPath:'气道',subPath:'无',mainAttain:'无',subAttain:'无',stones:200,essence:Math.floor(baseEssence['一转']*(aptPct[apt]||0.45)),hp:5,inventory:{guworms:{},killmoves:{},guhouses:{},recipes:{},materials:{}},absorbed:{guworms:{},killmoves:{},guhouses:{}},bornGu:'',createdAt:serverTimestamp(),uid}; await setDoc(ref('users',id),data); setLocalAccount(id); me={id,...data}; closeModal(); toast('身份已创建'); render();};
}
function requireLogin(){ if(!me){loginModal(); return false} return true; }

function render(){ const q=($('globalSearch')?.value||'').trim(); if(current==='home')renderHome(); else if(current==='players')renderPlayers(q); else if(['guworms','killmoves','guhouses','recipes','materials'].includes(current))renderCatalog(current,q); else if(current==='bag')renderBag(); else if(current==='trades')renderTrades(); else if(current==='chat')renderChat(); else if(current==='sects')renderSects(); else if(current==='rankings')renderRankings(); else if(current==='review')renderReview(); else if(current==='rules')renderRules(); renderVitals(); }
function filter(arr,q){return !q?arr:arr.filter(x=>JSON.stringify(x).includes(q))}
function renderHome(){ $('content').innerHTML=`<div class="hero"><div class="scroll-panel"><h2>天机殿</h2><p>V7核心规则版：玩家ID、背包、购买、吸收、真元、跨流派、审核与线上交易。</p><div class="stat"><div><b>${state.users.length}</b><br>玩家</div><div><b>${approved(state.guworms).length}</b><br>蛊虫</div><div><b>${approved(state.killmoves).length}</b><br>杀招</div><div><b>${approved(state.guhouses).length}</b><br>凡蛊屋</div><div><b>${state.trades.length}</b><br>交易</div></div></div><div class="scroll-panel"><h2>快速入口</h2><div class="toolbar"><button onclick="window.loginModal()">登录/创建ID</button><button onclick="window.goBag()">乾坤袋</button><button onclick="window.restoreEssence()">元石恢复真元</button></div><p class="muted">初始五维皆为5；基础拳击伤害0.25，一秒一拳。</p></div></div><h2 class="section-title">最新蛊虫</h2><div class="grid">${approved(state.guworms).slice(-6).reverse().map(x=>card('guworms',x)).join('')||empty()}</div>`; bindCards(); }
function empty(){return `<div class="card muted">暂无记录。</div>`}
function renderPlayers(q){ const arr=filter(state.users,q); $('content').innerHTML=`<div class="grid">${arr.map(p=>{const a=computedAttrs(p);return `<div class="card" data-user="${safe(p.id)}"><h3>${safe(p.name||p.id)}</h3><span class="pill">${safe(p.realm)}</span><span class="pill">${safe(p.aptitude)}</span><p>${safe(p.mainPath)} · ${safe(p.mainAttain||'无')}</p><p class="muted">生命${a.life} 攻击${a.attack} 防御${a.defense} 速度${a.speed} 精神${a.spirit}</p><p>元石 ${n(p.stones)}｜吸收位 ${Object.keys(p.absorbed?.guworms||{}).length+Object.keys(p.absorbed?.killmoves||{}).length+Object.keys(p.absorbed?.guhouses||{}).length}/${slots(p)}</p></div>`}).join('')||empty()}</div>`; document.querySelectorAll('[data-user]').forEach(b=>b.onclick=()=>userDetail(b.dataset.user)); }
function renderCatalog(type,q){ const arr=filter(approved(state[type]),q); $('content').innerHTML=`<div class="toolbar"><button onclick="window.editItem('${type}')">创作${typeCN[type]}</button></div><div class="grid">${arr.map(x=>card(type,x)).join('')||empty()}</div>`; bindCards(); }
function img(path){return path?`<img class="detail-img" src="${safe(path)}" onerror="this.style.display='none'">`:''}
function card(type,x){const inv=invCount(type,x.id); const status=x.status&&x.status!=='approved'?`<span class="pill wait">${safe(x.status)}</span>`:'';return `<div class="card" data-open="${type}:${x.id}">${img(x.image)}<h3>${safe(x.name||x.id)}</h3><span class="pill">${safe(x.rank||'一转')}</span>${x.path?`<span class="pill">${safe(x.path)}</span>`:''}${status}<p>${safe(x.effect||x.note||'无描述')}</p><p class="muted">价格 ${n(x.price)} 元石｜背包 ×${inv}</p></div>`}
function bindCards(){document.querySelectorAll('[data-open]').forEach(el=>el.onclick=()=>detail(...el.dataset.open.split(':')))}
function detail(type,id){ const item=getItem(type,id); if(!item) return; const cost=itemAbsorbCost(type,item), use=itemUseCost(type,item), attrs=effectAttrs(type,item); let rows = [['名称',item.name||id],['等级',item.rank||'-'],['流派',item.path||'-'],['价格',n(item.price)+' 元石'],['吸收真元',cost],['使用真元',use],['攻击',attrs.attack],['防御',attrs.defense],['生命',attrs.life],['速度',attrs.speed],['精神',attrs.spirit],['效果',item.effect||item.note||'-'],['创作者',item.creator||'-'],['状态',item.status||'approved']]; if(type==='killmoves') rows.splice(4,0,['杀招属性',attrCN[item.effectAttr]||'-']); if(type==='killmoves'||type==='guhouses') rows.splice(4,0,['所需蛊虫',(item.guIds||[]).map(x=>itemName('guworms',x)).join('、')||'-']);
  if(type==='recipes') rows.splice(4,0,['所需蛊虫',(item.guIds||[]).map(x=>itemName('guworms',x)).join('、')||'-'],['所需蛊材',(item.materialIds||[]).map(x=>itemName('materials',x)).join('、')||'-']);
 openModal(`${modalHead(typeCN[type]+'卷宗')}<div class="detail-box">${img(item.image)}<table class="detail-table">${rows.map(r=>`<tr><th>${safe(r[0])}</th><td>${safe(r[1])}</td></tr>`).join('')}</table><div class="toolbar"><button onclick="window.buyItem('${type}','${id}')">购买</button>${type!=='recipes'&&type!=='materials'?`<button onclick="window.absorbItem('${type}','${id}')">吸收/炼化</button><button onclick="window.useThing('${type}','${id}')">使用</button>`:''}${canEditItem(item)?`<button onclick="window.editItem('${type}','${id}')">编辑</button>`:''}</div></div>`); }
window.buyItem=async(type,id)=>{if(!requireLogin())return; const item=getItem(type,id); const price=n(item.price); if(n(me.stones)<price)return toast('元石不足'); const inv=myInv(); inv[type] ||= {}; inv[type][id] ||= {count:0}; inv[type][id].count += 1; await saveMe({stones:n(me.stones)-price, inventory:inv}); toast('已购入乾坤袋');}
window.absorbItem=async(type,id)=>{if(!requireLogin())return; if(!['guworms','killmoves','guhouses'].includes(type))return; const item=getItem(type,id); if(!item)return; if(rankNum(itemRank(item))>rankNum(realmRank(me.realm)))return toast('境界不足，不能跨阶吸收'); const inv=myInv(); if(n(inv[type]?.[id]?.count)<=0)return toast('背包没有该蛊物'); const absorbed=me.absorbed||{guworms:{},killmoves:{},guhouses:{}}; absorbed[type] ||= {}; const usedSlots=Object.keys(absorbed.guworms||{}).length+Object.keys(absorbed.killmoves||{}).length+Object.keys(absorbed.guhouses||{}).length; if(usedSlots>=slots(me))return toast('吸收位不足'); if(type==='guworms' && rankNum(realmRank(me.realm))<6 && absorbed.guworms?.[id])return toast('六转前同种蛊虫只能吸收一次'); const cost=itemAbsorbCost(type,item,me); if(n(me.essence)<cost)return toast('真元不足，炼化失败'); inv[type][id].count-=1; if(inv[type][id].count<=0)delete inv[type][id]; absorbed[type][id]={at:Date.now()}; await saveMe({inventory:inv,absorbed,essence:n(me.essence)-cost}); toast('炼化成功'); render();}
window.useThing=async(type,id)=>{if(!requireLogin())return; const item=getItem(type,id); if(!item)return; const cost=itemUseCost(type,item); if(n(me.essence)<cost)return toast('真元不足'); await saveMe({essence:n(me.essence)-cost}); const attrs=effectAttrs(type,item,me); const txt=attrKeys.filter(k=>attrs[k]).map(k=>`${attrCN[k]}+${attrs[k]}`).join('，')||'无属性加成'; fx(txt);}
window.restoreEssence=()=>{if(!requireLogin())return; openModal(`${modalHead('元石恢复真元')}<div class="form"><p>1元石 = 10真元</p><label>使用元石数量<input id="stoneUse" type="number" value="10"></label><button id="doRestore">恢复</button></div>`); $('doRestore').onclick=async()=>{const use=n($('stoneUse').value); if(use<=0)return; if(n(me.stones)<use)return toast('元石不足'); const mx=maxEssence(me); const es=Math.min(mx,n(me.essence)+use*10); await saveMe({stones:n(me.stones)-use, essence:es}); closeModal(); toast('真元已恢复');};}
window.editItem=(type,id=null)=>editItem(type,id);
function field(k,l,t='text',v=''){return `<label>${l}<input name="${k}" type="${t}" value="${safe(v)}"></label>`}
function area(k,l,v=''){return `<label class="wide">${l}<textarea name="${k}" rows="3">${safe(v)}</textarea></label>`}
function select(k,l,opts,v=''){return `<label>${l}<select name="${k}">${opts.map(o=>`<option ${o==v?'selected':''}>${safe(o)}</option>`).join('')}</select></label>`}
function guMulti(selected=[], ownOnly=false){const ids=ownOnly&&!isAdmin()?Object.keys(myInv().guworms||{}):approved(state.guworms).map(x=>x.id); return `<label class="wide">所需蛊虫（可多选）<select name="guIds" multiple size="8">${ids.map(id=>`<option value="${safe(id)}" ${selected.includes(id)?'selected':''}>${safe(itemName('guworms',id))}${ownOnly?` ×${invCount('guworms',id)}`:''}</option>`).join('')}</select></label>`}
async function editItem(type,id=null){ if(!requireLogin())return; const item=id?getItem(type,id):{}; if(id && !canEditItem(item))return toast('只能编辑自己创作的，管理员可编辑全部'); if((type==='killmoves'||type==='guhouses') && !id && !canCreateKillOrHouse(type))return toast(type==='killmoves'?'创建杀招需主流派大师成就':'创建凡蛊屋需主流派宗师成就'); let html=modalHead((id?'编辑':'创作')+typeCN[type]); let inner='';
 if(type==='guworms') inner=field('name','名称','text',item.name)+select('rank','等级',ranks,item.rank)+select('path','流派',paths,item.path)+field('image','图标路径','text',item.image)+field('price','价格','number',item.price)+field('absorbCost','吸收所需真元','number',item.absorbCost)+field('useCost','使用一次真元','number',item.useCost)+field('attack','攻击','number',item.attack)+field('defense','防御','number',item.defense)+field('life','生命','number',item.life)+field('speed','速度','number',item.speed)+field('spirit','精神','number',item.spirit)+area('effect','效果',item.effect);
 if(type==='killmoves') inner=field('name','名称','text',item.name)+select('rank','等级',ranks,item.rank)+select('path','流派',paths,item.path)+select('effectAttr','杀招单独属性',["attack","defense","life","speed","spirit"],item.effectAttr||'attack')+field('image','图标路径','text',item.image)+field('price','价格','number',item.price)+guMulti(item.guIds||[],true)+area('effect','效果描述',item.effect);
 if(type==='guhouses') inner=field('name','名称','text',item.name)+select('rank','等级',ranks,item.rank)+select('path','流派',paths,item.path)+field('image','图标路径','text',item.image)+field('price','价格','number',item.price)+guMulti(item.guIds||[],true)+area('effect','效果描述',item.effect);
 if(type==='recipes') inner=field('name','蛊方名','text',item.name)+field('target','炼制目标','text',item.target)+field('price','价格','number',item.price)+area('materials','材料',item.materials)+area('note','备注',item.note);
 if(type==='materials') inner=field('name','蛊材名','text',item.name)+field('rank','品级','text',item.rank)+field('image','图片路径','text',item.image)+field('price','价格','number',item.price)+area('effect','说明',item.effect);
 html+=`<form id="editForm" class="form"><div class="row">${inner}</div><div class="toolbar"><button>保存</button>${id&&canEditItem(item)?`<button type="button" class="danger" id="delBtn">删除</button>`:''}</div><p class="muted">普通玩家创作默认进入待审核，管理员审核通过后公开。</p></form>`; openModal(html);
 $('editForm').onsubmit=async e=>{e.preventDefault(); const fd=new FormData(e.target); const data=Object.fromEntries(fd.entries()); if(type==='killmoves'||type==='guhouses'||type==='recipes') data.guIds=[...e.target.querySelectorAll('input[name="guIds"]:checked')].map(o=>o.value); if(type==='recipes') data.materialIds=[...e.target.querySelectorAll('input[name="materialIds"]:checked')].map(o=>o.value); ['price','attack','defense','life','speed','spirit','absorbCost','useCost'].forEach(k=>{if(k in data)data[k]=Number(data[k]||0)}); data.creator= item.creator || accountId; if(!id) data.status=isAdmin()?'approved':'pending'; else if(!isAdmin() && item.status==='rejected') data.status='pending'; await setDoc(id?ref(type,id):doc(col(type)),{...item,...data,updatedAt:serverTimestamp()},{merge:true}); closeModal(); toast('已保存');};
 if($('delBtn')) $('delBtn').onclick=async()=>{if(confirm('确定删除？')){await deleteDoc(ref(type,id)); closeModal();}};
}
function profileModal(){ if(!requireLogin())return; const p=me; const adminOnly=isAdmin(); openModal(`${modalHead('我的卷宗')}<form id="profileForm" class="form"><div class="row">${field('name','姓名','text',p.name)}${select('realm','境界',ranks.flatMap(r=>minorRealms.map(m=>`${r}${m}`)),p.realm)}${select('aptitude','资质',['十绝体','甲','乙','丙','丁'],p.aptitude)}${select('mainPath','主流派',paths,p.mainPath)}${select('subPath','副流派',['无',...paths],p.subPath)}${adminOnly?select('mainAttain','主流派成就',attainments,p.mainAttain):`<label>主流派成就<input value="${safe(p.mainAttain||'无')}" disabled></label>`}${adminOnly?select('subAttain','副流派成就',attainments,p.subAttain):`<label>副流派成就<input value="${safe(p.subAttain||'无')}" disabled></label>`}${field('note','备注','text',p.note)}</div><button>保存</button></form>`); $('profileForm').onsubmit=async e=>{e.preventDefault(); const data=Object.fromEntries(new FormData(e.target).entries()); if(!isAdmin()){delete data.mainAttain; delete data.subAttain; delete data.aptitude;} await saveMe(data); closeModal();}; }
function renderBag(){ if(!requireLogin())return; const inv=myInv(), attrs=computedAttrs(me); const section=(type)=>`<h3>${typeCN[type]}</h3><div class="bag-grid">${Object.entries(inv[type]||{}).map(([id,v])=>`<div class="bag-item" onclick="window.detailFromBag('${type}','${id}')">${img(getItem(type,id)?.image)}<b>${safe(itemName(type,id))}</b><span>×${n(v.count)}</span></div>`).join('')||'<p class="muted">空</p>'}</div>`; $('content').innerHTML=`<div class="scroll-panel"><h2>个人总览</h2><p>元石：${n(me.stones)}｜真元：${n(me.essence)}/${maxEssence(me)}｜吸收位：${Object.keys(me.absorbed?.guworms||{}).length+Object.keys(me.absorbed?.killmoves||{}).length+Object.keys(me.absorbed?.guhouses||{}).length}/${slots(me)}</p><p>五维：生命${attrs.life} 攻击${attrs.attack} 防御${attrs.defense} 速度${attrs.speed} 精神${attrs.spirit}</p><p>本命蛊：${safe(me.bornGu?itemName('guworms',me.bornGu):'未定')}</p><div class="toolbar"><button onclick="window.restoreEssence()">元石恢复真元</button></div></div>${section('guworms')}${section('killmoves')}${section('guhouses')}${section('recipes')}${section('materials')}<h3>已吸收</h3><div class="bag-grid">${['guworms','killmoves','guhouses'].flatMap(t=>Object.keys(me.absorbed?.[t]||{}).map(id=>`<div class="bag-item" onclick="window.detailFromBag('${t}','${id}')">${img(getItem(t,id)?.image)}<b>${safe(itemName(t,id))}</b><span>已吸收</span>${t==='guworms'?`<button onclick="event.stopPropagation();window.setBornGu('${id}')">设本命</button>`:''}</div>`)).join('')||'<p class="muted">暂无</p>'}</div>`; }
window.detailFromBag=(t,id)=>detail(t,id); window.setBornGu=async(id)=>{await saveMe({bornGu:id});toast('本命蛊已更改')};
function userDetail(id){const p=state.users.find(x=>x.id===id); if(!p)return; const a=computedAttrs(p); const absorbedGu=Object.keys(p.absorbed?.guworms||{}).map(gid=>itemName('guworms',gid)).join('、')||'暂无'; openModal(`${modalHead(p.name||id)}<table class="detail-table"><tr><th>玩家ID</th><td>${safe(p.id)}</td></tr><tr><th>境界</th><td>${safe(p.realm)}</td></tr><tr><th>资质</th><td>${safe(p.aptitude)}</td></tr><tr><th>主流派</th><td>${safe(p.mainPath)} · ${safe(p.mainAttain||'无')}</td></tr><tr><th>副流派</th><td>${safe(p.subPath)} · ${safe(p.subAttain||'无')}</td></tr><tr><th>五维</th><td>生命${a.life} 攻击${a.attack} 防御${a.defense} 速度${a.speed} 精神${a.spirit}</td></tr><tr><th>元石</th><td>${n(p.stones)}</td></tr><tr><th>真元</th><td>${n(p.essence)}/${maxEssence(p)}</td></tr><tr><th>胜场</th><td>${n(p.wins)}</td></tr><tr><th>本命蛊</th><td>${safe(p.bornGu?itemName('guworms',p.bornGu):'未定')}</td></tr><tr><th>已吸收蛊虫</th><td>${safe(absorbedGu)}</td></tr></table>${isAdmin()?`<div class="toolbar"><button onclick="window.adminEditUser('${safe(id)}')">管理员编辑</button></div>`:''}`)}
window.adminEditUser=(id)=>{if(!isAdmin())return toast('只有管理员可编辑'); const p=state.users.find(x=>x.id===id); if(!p)return; const realmOptions=ranks.flatMap(r=>minorRealms.map(m=>`${r}${m}`)); const absorbedGuIds=Object.keys(p.absorbed?.guworms||{}); const bornOptions=['',...absorbedGuIds,...state.guworms.map(g=>g.id)].filter((v,i,a)=>a.indexOf(v)===i); openModal(`${modalHead('天机阁 · 编辑玩家')}<form id="adminUserForm" class="form"><div class="row">${field('name','姓名','text',p.name||id)}${select('role','身份权限',['player','admin'],p.role||'player')}${select('realm','境界',realmOptions,p.realm||'一转初期')}${select('aptitude','资质',['十绝体','甲','乙','丙','丁'],p.aptitude||'丁')}${select('mainPath','主流派',paths,p.mainPath||'气道')}${select('subPath','副流派',['无',...paths],p.subPath||'无')}${select('mainAttain','主流派成就',attainments,p.mainAttain||'无')}${select('subAttain','副流派成就',attainments,p.subAttain||'无')}${field('stones','元石数量','number',p.stones)}${field('essence','当前真元','number',p.essence)}${field('hp','当前生命','number',p.hp)}${field('wins','胜场','number',p.wins)}${select('bornGu','本命蛊',bornOptions,p.bornGu||'')}${field('note','备注','text',p.note||'')}</div><div class="toolbar"><button>保存修改</button><button type="button" id="fillEssenceBtn">真元回满</button><button type="button" id="giveStoneBtn">元石+1000</button></div><p class="muted">管理员可修改任何玩家资料、元石、真元、生命、资质、流派、成就、本命蛊等。</p></form>`); $('adminUserForm').onsubmit=async e=>{e.preventDefault(); const data=Object.fromEntries(new FormData(e.target).entries()); ['stones','essence','hp','wins'].forEach(k=>data[k]=Number(data[k]||0)); await setDoc(ref('users',id),{...p,...data,updatedAt:serverTimestamp()},{merge:true}); closeModal(); toast('玩家资料已修改');}; $('fillEssenceBtn').onclick=()=>{$('adminUserForm').essence.value=maxEssence({...p, aptitude:$('adminUserForm').aptitude.value, realm:$('adminUserForm').realm.value});}; $('giveStoneBtn').onclick=()=>{$('adminUserForm').stones.value=n($('adminUserForm').stones.value)+1000;};}

function renderTrades(){ if(!requireLogin())return; const mine=state.trades.filter(t=>t.from===accountId||t.to===accountId||isAdmin()); $('content').innerHTML=`<div class="toolbar"><button onclick="window.newTrade()">发起线上交易</button></div><div class="grid">${mine.map(t=>`<div class="card"><h3>${safe(t.from)} ↔ ${safe(t.to)}</h3><p>状态：${safe(t.status||'进行中')}</p><p>我方元石：${n(t.offer?.[accountId]?.stones)}</p><div class="toolbar"><button onclick="window.tradeDetail('${t.id}')">进入交易台</button></div></div>`).join('')||empty()}</div>`; }
window.newTrade=()=>{openModal(`${modalHead('发起交易')}<div class="form"><label>对方玩家ID<input id="tradeTo"></label><button id="createTrade">创建</button></div>`); $('createTrade').onclick=async()=>{const to=$('tradeTo').value.trim(); if(!to||to===accountId)return; await addDoc(col('trades'),{from:accountId,to,status:'active',offer:{[accountId]:{stones:0,items:[]},[to]:{stones:0,items:[]}},confirm:{[accountId]:false,[to]:false},createdAt:serverTimestamp()}); closeModal(); toast('交易已创建')};}
window.tradeDetail=(id)=>{const t=state.trades.find(x=>x.id===id); if(!t)return; const mine=t.offer?.[accountId]||{stones:0,items:[]}; openModal(`${modalHead('线上交易台')}<p>交易进行时请勿离开，取消或成功后释放交易台。</p><label>摆上元石<input id="offerStones" type="number" value="${n(mine.stones)}"></label><div class="toolbar"><button id="saveOffer">更新出价</button><button id="confirmTrade">确认交易</button><button id="cancelTrade" class="danger">取消交易</button></div><pre>${safe(JSON.stringify(t.offer,null,2))}</pre>`); $('saveOffer').onclick=async()=>{const offer=t.offer||{}; offer[accountId]={...(offer[accountId]||{}),stones:n($('offerStones').value),items:[]}; await setDoc(ref('trades',id),{offer,confirm:{...t.confirm,[accountId]:false}},{merge:true}); closeModal();}; $('confirmTrade').onclick=async()=>{const confirm={...t.confirm,[accountId]:true}; await setDoc(ref('trades',id),{confirm},{merge:true}); toast('已确认，等待对方');}; $('cancelTrade').onclick=async()=>{await setDoc(ref('trades',id),{status:'cancelled'},{merge:true}); closeModal();};}
function renderChat(){ $('content').innerHTML=`<div class="toolbar"><button onclick="window.chatChannel='world';render()">世界</button><button onclick="window.chatChannel='group';render()">群聊</button><button onclick="window.chatChannel='private';render()">私聊</button></div><div class="chat-box">${state.messages.filter(m=>(m.channel||'world')===(window.chatChannel||'world')).map(m=>`<div class="msg"><b>${safe(m.name)}</b>：${safe(m.text)}</div>`).join('')}</div><form class="chat-input" id="chatForm"><input name="text" placeholder="传音入密……"><button>发送</button></form>`; $('chatForm').onsubmit=async e=>{e.preventDefault(); const text=e.target.text.value.trim(); if(!text)return; await addDoc(col('messages'),{name:me?.name||accountId||'无名',text,channel:window.chatChannel||'world',createdAt:serverTimestamp()}); e.target.reset();}; }
function renderSects(){ $('content').innerHTML=`<div class="scroll-panel"><h2>势力排行</h2><p>下一版可加入势力仓库、宗主权限、宗门频道。</p></div>`; }
function renderRankings(){const arr=[...state.users]; const row=(p,i,score)=>`<tr><td>${i+1}</td><td>${safe(p.name||p.id)}</td><td>${score}</td><td>${safe(p.realm)}</td></tr>`; $('content').innerHTML=`<h2>战力榜</h2><table class="table"><tr><th>名次</th><th>姓名</th><th>战力</th><th>境界</th></tr>${arr.sort((a,b)=>Object.values(computedAttrs(b)).reduce((x,y)=>x+y,0)-Object.values(computedAttrs(a)).reduce((x,y)=>x+y,0)).map((p,i)=>row(p,i,Object.values(computedAttrs(p)).reduce((x,y)=>x+y,0))).join('')}</table><h2>财富榜</h2><table class="table"><tr><th>名次</th><th>姓名</th><th>元石</th><th>境界</th></tr>${arr.sort((a,b)=>n(b.stones)-n(a.stones)).map((p,i)=>row(p,i,n(p.stones))).join('')}</table>`;}
function renderReview(){ if(!isAdmin()){$('content').innerHTML='<div class="card">只有管理员可进入审核阁。</div>'; return} const all=['guworms','killmoves','guhouses','recipes','materials'].flatMap(t=>state[t].filter(x=>x.status==='pending').map(x=>({type:t,...x}))); $('content').innerHTML=`<div class="grid">${all.map(x=>`<div class="card"><h3>${safe(x.name)}</h3><span class="pill">${typeCN[x.type]}</span><p>${safe(x.effect||x.note||'')}</p><div class="toolbar"><button onclick="window.review('${x.type}','${x.id}','approved')">通过</button><button class="danger" onclick="window.review('${x.type}','${x.id}','rejected')">驳回</button></div></div>`).join('')||empty()}</div>`;}
window.review=async(t,id,status)=>{await setDoc(ref(t,id),{status},{merge:true});toast(status==='approved'?'已通过':'已驳回')};
function renderRules(){ $('content').innerHTML=`<div class="scroll-panel"><h2>V7核心规则</h2><p>同阶只能吸收同阶或低阶蛊虫、杀招、凡蛊屋，不能跨阶吸收。</p><p>跨流派吸收真元×150%，跨流派使用时所有属性效果÷2。</p><p>初始五维皆为5；基础拳击伤害0.25，一秒一拳。</p><p>资质：十绝体100%，甲85%，乙75%，丙60%，丁45%。</p><p>一转青铜真元青翠色，二转赤铁真元赤红色，三转白银真元银色，四转黄金真元金色，五转紫金真元紫金色。</p><p>杀招只能选择一个属性作为招式属性；创建杀招需大师成就，创建凡蛊屋需宗师成就。</p></div>`; }


/* ===================== V7.4 一次性稳定整合补丁：手机装备栏/交易/聊天/势力/规则修复 ===================== */
const V74 = { maxEquip: 10 };
function attainLevel(a){ return attainments.indexOf(a || '无'); }
function hasAnyAttainAtLeast(minName){ const need = attainLevel(minName); return isAdmin() || attainLevel(me?.mainAttain) >= need || attainLevel(me?.subAttain) >= need; }
function isRankAtLeast(rankName,p=me){ return rankNum(realmRank(p?.realm)) >= rankNum(rankName); }
function itemEquipped(type,id,p=me){ return (Array.isArray(p?.equipped)?p.equipped:[]).some(e=>e && e.type===type && e.id===id); }
function isAbsorbed(type,id,p=me){ return !!p?.absorbed?.[type]?.[id]; }
function secondsFrom(v){ if(v===undefined||v===null||v==='') return 0; const m=String(v).match(/\d+(\.\d+)?/); return m ? Math.max(0, Math.ceil(Number(m[0]))) : 0; }
function durationText(item){ return item?.duration || item?.hold || item?.lasting || item?.time || '-'; }
function cooldownText(item){ return item?.cooldown || item?.cd || '-'; }
function rangeText(item){ return item?.range || item?.distance || '-'; }
function topAttrText(type,item,p=me,forUse=false){ const attrs = effectAttrs(type,item,p,forUse); let best='attack', val=-Infinity; attrKeys.forEach(k=>{ if(n(attrs[k]) > val){best=k; val=n(attrs[k]);} }); return `${attrCN[best]}+${Math.max(0,val)}`; }
function equipArray(){ const eq = Array.isArray(me?.equipped) ? me.equipped.slice(0,10) : []; while(eq.length<10) eq.push(null); return eq; }
function equipCooldownKey(slot){ return `gu_v74_cd_${accountId}_${slot}`; }
function equipCooldownLeft(slot){ return Math.max(0, Math.ceil((n(localStorage.getItem(equipCooldownKey(slot))) - Date.now())/1000)); }
function setEquipCooldown(slot,sec){ if(sec>0) localStorage.setItem(equipCooldownKey(slot), String(Date.now()+sec*1000)); }
function restoreAmount(){ return Math.max(1,n(localStorage.getItem('guRestoreStoneAmount') || 1)); }
function canMakeWorldThing(type){ if(isAdmin()) return true; if(type==='guworms' || type==='recipes') return isRankAtLeast('三转'); return true; }

// 属性修复：详情、吸收、人物五维显示完整属性；只有“使用/释放”跨流派时效果减半，且+1不会变0。
effectAttrs = function(type,item,p=me,forUse=false){
  const out = {attack:0, defense:0, life:0, speed:0, spirit:0};
  if(!item) return out;
  if(type==='guworms'){
    attrKeys.forEach(k=>out[k]=n(item[k]));
    if(forUse && item.path && !samePath(item,p)) attrKeys.forEach(k=>{ out[k] = out[k] > 0 ? Math.max(1, Math.ceil(out[k]/2)) : 0; });
    return out;
  }
  if(type==='killmoves'){
    const selected = item.effectAttr || 'attack';
    const ids = item.guIds || item.requiredIds || [];
    out[selected] = ids.reduce((a,id)=>a+n(getItem('guworms',id)?.[selected]),0) || n(item[selected]);
    if(forUse && item.path && !samePath(item,p)) out[selected] = out[selected] > 0 ? Math.max(1, Math.ceil(out[selected]/2)) : 0;
    return out;
  }
  if(type==='guhouses'){
    const ids = item.guIds || item.requiredIds || [];
    attrKeys.forEach(k=>out[k]=ids.reduce((a,id)=>a+n(getItem('guworms',id)?.[k]),0) || n(item[k]));
    if(forUse && item.path && !samePath(item,p)) attrKeys.forEach(k=>{ out[k] = out[k] > 0 ? Math.max(1, Math.ceil(out[k]/2)) : 0; });
    return out;
  }
  return out;
};

// 成就权限：任意主/副流派达到大师可创杀招，达到宗师可创凡蛊屋。
canCreateKillOrHouse = function(type){ if(isAdmin()) return true; return type==='killmoves' ? hasAnyAttainAtLeast('大师') : hasAnyAttainAtLeast('宗师'); };

// 勾选式材料选择：不再用 Shift/Ctrl，多选直接勾框。玩家只显示背包已有，管理员显示全库。
function pickGrid(type, fieldName, title, selected=[], ownOnly=false){
  let ids = [];
  if(ownOnly && !isAdmin()) ids = Object.entries(myInv()[type]||{}).filter(([id,v])=>n(v.count)>0).map(([id])=>id);
  else ids = approved(state[type]).map(x=>x.id);
  const cards = ids.map(id=>{
    const it=getItem(type,id)||{}; const c=invCount(type,id); const checked=selected.includes(id)?'checked':'';
    return `<label class="pick-card"><input type="checkbox" name="${fieldName}" value="${safe(id)}" ${checked}><span class="pick-name">${safe(it.name||id)}</span><small>${safe(it.rank||it.path||'')} ${ownOnly&&!isAdmin()?`×${c}`:''}</small></label>`;
  }).join('') || '<p class="muted">暂无可选项目。</p>';
  return `<div class="wide"><div class="pick-title">${title}</div><div class="pick-grid">${cards}</div><small class="muted">直接勾选小框即可多选；普通玩家只能选择自己背包已有项目，管理员可选择全库。</small></div>`;
}
guMulti = function(selected=[], ownOnly=false){ return pickGrid('guworms','guIds','所需蛊虫（勾选多选）',selected,ownOnly); };
function materialMulti(selected=[], ownOnly=false){ return pickGrid('materials','materialIds','所需蛊材（勾选多选）',selected,ownOnly); }

// 详情页增加距离、冷却、持续/定身时间；按钮增加装备。
detail = function(type,id){
  const item=getItem(type,id); if(!item) return;
  const cost=itemAbsorbCost(type,item), use=itemUseCost(type,item), attrs=effectAttrs(type,item,me,false);
  let rows = [['名称',item.name||id],['等级',item.rank||'-'],['流派',item.path||'-'],['价格',n(item.price)+' 元石'],['吸收真元',cost],['使用真元',use],['距离',rangeText(item)],['冷却时间',cooldownText(item)],['持续/定身时间',durationText(item)],['攻击',attrs.attack],['防御',attrs.defense],['生命',attrs.life],['速度',attrs.speed],['精神',attrs.spirit],['效果',item.effect||item.note||'-'],['创作者',item.creator||'-'],['状态',item.status||'approved']];
  if(type==='killmoves') rows.splice(4,0,['杀招属性',attrCN[item.effectAttr]||'-']);
  if(type==='killmoves'||type==='guhouses') rows.splice(4,0,['所需蛊虫',(item.guIds||[]).map(x=>itemName('guworms',x)).join('、')||'-']);
  if(type==='recipes') rows.splice(4,0,['所需蛊虫',(item.guIds||[]).map(x=>itemName('guworms',x)).join('、')||'-'],['所需蛊材',(item.materialIds||[]).map(x=>itemName('materials',x)).join('、')||'-']);
  openModal(`${modalHead(typeCN[type]+'卷宗')}<div class="detail-box">${img(item.image)}<table class="detail-table">${rows.map(r=>`<tr><th>${safe(r[0])}</th><td>${safe(r[1])}</td></tr>`).join('')}</table><div class="toolbar"><button onclick="window.buyItem('${type}','${id}')">购买</button>${type!=='recipes'&&type!=='materials'?`<button onclick="window.absorbItem('${type}','${id}')">吸收/炼化</button><button onclick="window.useThing('${type}','${id}')">使用</button><button onclick="window.equipThing('${type}','${id}')">装备</button>`:''}${canEditItem(item)?`<button onclick="window.editItem('${type}','${id}')">编辑</button>`:''}</div></div>`);
};
window.detail = detail;

// 创作/编辑：蛊虫、杀招、凡蛊屋增加距离/冷却/持续；三转以下不能普通创建蛊虫/蛊方；杀招/凡蛊屋权限走任意流派成就。
editItem = async function(type,id=null){
  if(!requireLogin())return; const item=id?getItem(type,id):{};
  if(id && !canEditItem(item)) return toast('只能编辑自己创作的，管理员可编辑全部');
  if(!id && !canMakeWorldThing(type)) return toast('三转以上才可创建蛊虫或蛊方');
  if((type==='killmoves'||type==='guhouses') && !id && !canCreateKillOrHouse(type)) return toast(type==='killmoves'?'创建杀招需任意流派大师成就':'创建凡蛊屋需任意流派宗师成就');
  let html=modalHead((id?'编辑':'创作')+typeCN[type]); let inner='';
  if(type==='guworms') inner=field('name','名称','text',item.name)+select('rank','等级',ranks,item.rank)+select('path','流派',paths,item.path)+field('image','图标路径','text',item.image)+field('price','价格','number',item.price)+field('absorbCost','吸收所需真元','number',item.absorbCost)+field('useCost','使用一次真元','number',item.useCost)+field('range','距离','text',item.range)+field('cooldown','冷却时间/秒','text',item.cooldown)+field('duration','持续/定身时间','text',item.duration)+field('attack','攻击','number',item.attack)+field('defense','防御','number',item.defense)+field('life','生命','number',item.life)+field('speed','速度','number',item.speed)+field('spirit','精神','number',item.spirit)+area('effect','效果',item.effect);
  else if(type==='killmoves') inner=field('name','名称','text',item.name)+select('rank','等级',ranks,item.rank)+select('path','流派',paths,item.path)+select('effectAttr','杀招单独属性',Object.keys(attrCN),item.effectAttr||'attack')+field('image','图标路径','text',item.image)+field('price','价格','number',item.price)+field('range','距离','text',item.range)+field('cooldown','冷却时间/秒','text',item.cooldown)+field('duration','持续时间','text',item.duration)+guMulti(item.guIds||[],true)+area('effect','效果描述',item.effect);
  else if(type==='guhouses') inner=field('name','名称','text',item.name)+select('rank','等级',ranks,item.rank)+select('path','流派',paths,item.path)+field('image','图标路径','text',item.image)+field('price','价格','number',item.price)+field('range','距离','text',item.range)+field('cooldown','冷却时间/秒','text',item.cooldown)+field('duration','持续时间','text',item.duration)+guMulti(item.guIds||[],true)+area('effect','效果描述',item.effect);
  else if(type==='recipes') inner=field('name','蛊方名','text',item.name)+field('target','炼制目标','text',item.target)+field('price','价格','number',item.price)+guMulti(item.guIds||[],true)+materialMulti(item.materialIds||[],true)+area('materials','额外材料/炼制步骤文字',item.materials)+area('note','备注',item.note);
  else if(type==='materials') inner=field('name','蛊材名','text',item.name)+field('rank','品级','text',item.rank)+field('image','图片路径','text',item.image)+field('price','价格','number',item.price)+area('effect','说明',item.effect);
  html+=`<form id="editForm" class="form"><div class="row">${inner}</div><div class="toolbar"><button>保存</button>${id&&canEditItem(item)?`<button type="button" class="danger" id="delBtn">删除</button>`:''}</div><p class="muted">普通玩家创作默认进入待审核，管理员审核通过后公开。</p></form>`; openModal(html);
  $('editForm').onsubmit=async e=>{e.preventDefault(); const fd=new FormData(e.target); const data=Object.fromEntries(fd.entries()); if(type==='killmoves'||type==='guhouses'||type==='recipes') data.guIds=[...e.target.querySelectorAll('input[name="guIds"]:checked')].map(o=>o.value); if(type==='recipes') data.materialIds=[...e.target.querySelectorAll('input[name="materialIds"]:checked')].map(o=>o.value); ['price','attack','defense','life','speed','spirit','absorbCost','useCost'].forEach(k=>{if(k in data)data[k]=Number(data[k]||0)}); data.creator= item.creator || accountId; if(!id) data.status=isAdmin()?'approved':'pending'; else if(!isAdmin() && item.status==='rejected') data.status='pending'; await setDoc(id?ref(type,id):doc(col(type)),{...item,...data,updatedAt:serverTimestamp()},{merge:true}); closeModal(); toast('已保存');};
  if($('delBtn')) $('delBtn').onclick=async()=>{if(confirm('确定删除？')){await deleteDoc(ref(type,id)); closeModal();}};
};
window.editItem = editItem;

// 一键恢复真元：默认点一次用1颗元石，管理员可设置本机一次恢复数量。
window.setRestoreAmount=function(){ if(!isAdmin())return toast('只有管理员可设置'); const val=prompt('每次点击恢复使用多少颗元石？', String(restoreAmount())); if(!val)return; localStorage.setItem('guRestoreStoneAmount', String(Math.max(1,n(val)||1))); renderVitals(); };
window.restoreEssence=async function(){
  if(!requireLogin())return; const use=restoreAmount();
  if(n(me.stones)<use) return toast('元石不足');
  const mx=maxEssence(me); const before=n(me.essence); const add=Math.min(use*10, Math.max(0,mx-before));
  if(add<=0) return toast('真元已满');
  await saveMe({stones:n(me.stones)-use, essence:before+add}); toast(`使用${use}元石，恢复${add}真元`);
};

// 装备栏：只允许装备已吸收蛊物；同一蛊物不可重复装备；手机默认5格，弹窗看全部10格。
window.equipThing=async function(type,id){
  if(!requireLogin())return; if(!['guworms','killmoves','guhouses'].includes(type)) return toast('该物不能装备');
  if(!isAbsorbed(type,id,me)) return toast('未吸收蛊物不能装备');
  const eq=equipArray(); if(eq.some(e=>e && e.type===type && e.id===id)) return toast('同一蛊物不能重复装备');
  const emptyIndex=eq.findIndex(e=>!e); const slot=Number(prompt('装备到哪个格子？0-9。留空默认第一个空位。', emptyIndex>=0?String(emptyIndex):'0'));
  if(!Number.isInteger(slot)||slot<0||slot>9)return toast('格子必须是0-9'); if(eq[slot]) return toast('该格已有蛊物，请先卸下');
  eq[slot]={type,id}; await saveMe({equipped:eq}); toast(`已装备到${slot}号位`); render();
};
window.unequipThing=async function(slot){ if(!requireLogin())return; const eq=equipArray(); eq[slot]=null; await saveMe({equipped:eq}); render(); };
window.useEquipped=async function(slot){
  if(!requireLogin())return; const eq=equipArray(); const e=eq[slot]; if(!e)return toast('此格为空');
  const left=equipCooldownLeft(slot); if(left>0)return toast(`冷却中：${left}秒`);
  const item=getItem(e.type,e.id); if(!item)return toast('蛊物不存在');
  const cost=itemUseCost(e.type,item); if(n(me.essence)<cost)return toast('真元不足');
  await saveMe({essence:n(me.essence)-cost});
  const attrs=effectAttrs(e.type,item,me,true); const txt=attrKeys.filter(k=>attrs[k]).map(k=>`${attrCN[k]}+${attrs[k]}`).join('，')||'无属性加成';
  fx(`${item.name||e.id}：${txt}`); setEquipCooldown(slot,secondsFrom(cooldownText(item))); renderVitals();
};
window.openEquipPanel=function(){
  if(!requireLogin())return; const eq=equipArray();
  openModal(`${modalHead('十窍装备栏')}<div class="equip-modal-grid">${eq.map((e,i)=>{const item=e?getItem(e.type,e.id):null; const left=equipCooldownLeft(i); return `<div class="equip-slot full ${e?'filled':''}"><b>${i}</b>${e?img(item?.image):''}<strong>${safe(e?itemName(e.type,e.id):'空')}</strong>${e?`<em>${safe(topAttrText(e.type,item))}</em><button onclick="window.useEquipped(${i})">${left>0?left+'秒':'使用'}</button><button onclick="window.unequipThing(${i})">卸下</button>`:''}</div>`}).join('')}</div>`);
};

// 右下角生命真元+小装备栏。
renderVitals=function(){
  let box=$('vitalsDock'); if(!box){box=document.createElement('div'); box.id='vitalsDock'; document.body.appendChild(box)}
  if(!me){box.innerHTML=`<button onclick="window.loginModal()">入世登录</button>`;return}
  const attrs=computedAttrs(me), hpMax=attrs.life, hp=n(me.hp||hpMax), esMax=maxEssence(me), es=n(me.essence||esMax), rank=realmRank(me.realm), eq=equipArray();
  const small=eq.slice(0,5).map((e,i)=>{const item=e?getItem(e.type,e.id):null; const left=equipCooldownLeft(i); return `<div class="equip-slot tiny ${e?'filled':''}" title="${safe(e?itemName(e.type,e.id):'空')}"><b>${i}</b>${e?img(item?.image):''}<span>${safe(e?itemName(e.type,e.id).slice(0,3):'空')}</span>${e?`<button onclick="window.useEquipped(${i})">${left>0?left:'用'}</button>`:''}</div>`}).join('');
  box.innerHTML=`<div class="vital-title">${safe(me.name||accountId)}</div><div class="bar-wrap"><span>生命 ${hp}/${hpMax}</span><div class="bar"><i style="width:${Math.min(100,hp/hpMax*100)}%"></i></div></div><div class="bar-wrap"><span>${essenceName[rank]} ${es}/${esMax}</span><div class="bar essence ${essenceClass[rank]}"><i style="width:${Math.min(100,es/esMax*100)}%"></i></div></div><div class="stone-line">元石 ${n(me.stones)} <button onclick="window.restoreEssence()">恢复×${restoreAmount()}</button></div>${isAdmin()?`<button onclick="window.setRestoreAmount()">设置恢复数量</button>`:''}<button onclick="window.goBag()">乾坤袋</button><button onclick="window.openEquipPanel()">装备栏0-9</button><div class="equip-mini">${small}</div>`;
};

// 背包：已吸收蛊物显示是否被装备。
renderBag=function(){
  if(!requireLogin())return; const inv=myInv(), attrs=computedAttrs(me);
  const section=(type)=>`<h3>${typeCN[type]}</h3><div class="bag-grid">${Object.entries(inv[type]||{}).filter(([id,v])=>n(v.count)>0).map(([id,v])=>`<div class="bag-item" onclick="window.detailFromBag('${type}','${id}')">${img(getItem(type,id)?.image)}<b>${safe(itemName(type,id))}</b><span>×${n(v.count)}</span></div>`).join('')||'<p class="muted">空</p>'}</div>`;
  const absorbedHtml=['guworms','killmoves','guhouses'].flatMap(t=>Object.keys(me.absorbed?.[t]||{}).map(id=>`<div class="bag-item" onclick="window.detailFromBag('${t}','${id}')">${img(getItem(t,id)?.image)}<b>${safe(itemName(t,id))}</b><span>${itemEquipped(t,id)?'被装备':'已吸收'}</span><div class="toolbar small-tools"><button onclick="event.stopPropagation();window.equipThing('${t}','${id}')">装备</button>${t==='guworms'?`<button onclick="event.stopPropagation();window.setBornGu('${id}')">设本命</button>`:''}</div></div>`)).join('')||'<p class="muted">暂无</p>';
  $('content').innerHTML=`<div class="scroll-panel"><h2>个人总览</h2><p>元石：${n(me.stones)}｜真元：${n(me.essence)}/${maxEssence(me)}｜吸收位：${Object.keys(me.absorbed?.guworms||{}).length+Object.keys(me.absorbed?.killmoves||{}).length+Object.keys(me.absorbed?.guhouses||{}).length}/${slots(me)}</p><p>五维：生命${attrs.life} 攻击${attrs.attack} 防御${attrs.defense} 速度${attrs.speed} 精神${attrs.spirit}</p><p>本命蛊：${safe(me.bornGu?itemName('guworms',me.bornGu):'未定')}</p><div class="toolbar"><button onclick="window.restoreEssence()">一键恢复真元</button><button onclick="window.openEquipPanel()">装备栏</button></div></div>${section('guworms')}${section('killmoves')}${section('guhouses')}${section('recipes')}${section('materials')}<h3>已吸收</h3><div class="bag-grid">${absorbedHtml}</div>`;
};
window.detailFromBag=(t,id)=>detail(t,id);

// 交易：简洁选择元石+背包蛊物，双方确认后自动交换。
function invOptions(){ return ['guworms','killmoves','guhouses','recipes','materials'].map(type=>Object.entries(myInv()[type]||{}).filter(([id,v])=>n(v.count)>0).map(([id,v])=>`<option value="${safe(type+':'+id)}">${safe(typeCN[type]+'｜'+itemName(type,id)+' ×'+n(v.count))}</option>`).join('')).join(''); }
function offerSummary(o){ if(!o)return '空'; const items=(o.items||[]).map(x=>`${typeCN[x.type]||x.type}:${itemName(x.type,x.id||x.itemId)}×${n(x.count||1)}`).join('，'); return `元石${n(o.stones)}${items?'｜'+items:''}`; }
async function settleTrade(t){
  const ids=[t.from,t.to]; const docs=await Promise.all(ids.map(id=>getDoc(ref('users',id)))); if(docs.some(d=>!d.exists())) return toast('交易玩家不存在');
  const us=docs.map((d,i)=>({id:ids[i],...d.data()})); const offers=t.offer||{};
  for(const u of us){ const o=offers[u.id]||{stones:0,items:[]}; if(n(u.stones)<n(o.stones)) return toast(`${u.id} 元石不足`); for(const it of (o.items||[])){ if(n(u.inventory?.[it.type]?.[it.id||it.itemId]?.count)<n(it.count||1)) return toast(`${u.id} 背包物品不足`); } }
  for(let i=0;i<2;i++){
    const meU=us[i], other=us[1-i], myO=offers[meU.id]||{stones:0,items:[]}, otherO=offers[other.id]||{stones:0,items:[]};
    const inv=meU.inventory||{guworms:{},killmoves:{},guhouses:{},recipes:{},materials:{}}; let stones=n(meU.stones)-n(myO.stones)+n(otherO.stones);
    for(const it of (myO.items||[])){ const type=it.type, id=it.id||it.itemId, c=n(it.count||1); inv[type] ||= {}; inv[type][id] ||= {count:0}; inv[type][id].count-=c; if(inv[type][id].count<=0) delete inv[type][id]; }
    for(const it of (otherO.items||[])){ const type=it.type, id=it.id||it.itemId, c=n(it.count||1); inv[type] ||= {}; inv[type][id] ||= {count:0}; inv[type][id].count+=c; }
    await setDoc(ref('users',meU.id),{...meU,stones,inventory:inv,updatedAt:serverTimestamp()},{merge:true});
  }
  await setDoc(ref('trades',t.id),{status:'success',settledAt:serverTimestamp()},{merge:true}); toast('交易成功'); closeModal();
}
renderTrades=function(){ if(!requireLogin())return; const mine=state.trades.filter(t=>t.from===accountId||t.to===accountId||isAdmin()); $('content').innerHTML=`<div class="toolbar"><button onclick="window.newTrade()">发起线上交易</button></div><div class="grid">${mine.map(t=>`<div class="card"><h3>${safe(t.from)} ↔ ${safe(t.to)}</h3><p>状态：${safe(t.status||'active')}</p><p>我方：${safe(offerSummary(t.offer?.[accountId]))}</p><div class="toolbar"><button onclick="window.tradeDetail('${t.id}')">进入交易台</button></div></div>`).join('')||empty()}</div>`; };
window.tradeDetail=function(id){ const t=state.trades.find(x=>x.id===id); if(!t)return; const mine=t.offer?.[accountId]||{stones:0,items:[]}; openModal(`${modalHead('线上交易台')}<p class="muted">只能线上交易；交易成功或取消后释放交易台。</p><div class="trade-grid"><div><h3>我的摆放</h3><label>元石<input id="offerStones" type="number" value="${n(mine.stones)}"></label><label>背包蛊物<select id="offerItems" multiple size="8" class="nice-select">${invOptions()}</select></label></div><div><h3>当前交易</h3><p>我方：${safe(offerSummary(t.offer?.[accountId]))}</p><p>对方：${safe(offerSummary(t.offer?.[t.from===accountId?t.to:t.from]))}</p><p>确认：${t.confirm?.[accountId]?'我已确认':'我未确认'} / ${t.confirm?.[t.from===accountId?t.to:t.from]?'对方已确认':'对方未确认'}</p></div></div><div class="toolbar"><button id="saveOffer">更新摆放</button><button id="confirmTrade">确认交易</button><button id="cancelTrade" class="danger">取消交易</button></div>`); $('saveOffer').onclick=async()=>{const items=[...$('offerItems').selectedOptions].map(o=>{const [type,id]=o.value.split(':');return {type,id,count:1};}); const offer=t.offer||{}; offer[accountId]={stones:n($('offerStones').value),items}; await setDoc(ref('trades',id),{offer,confirm:{...t.confirm,[accountId]:false}},{merge:true}); closeModal(); toast('已更新摆放');}; $('confirmTrade').onclick=async()=>{const confirm={...t.confirm,[accountId]:true}; await setDoc(ref('trades',id),{confirm},{merge:true}); const other=t.from===accountId?t.to:t.from; if(confirm[other]) await settleTrade({...t,confirm}); else toast('已确认，等待对方');}; $('cancelTrade').onclick=async()=>{await setDoc(ref('trades',id),{status:'cancelled'},{merge:true}); closeModal();}; };

// 势力：三转以上可创建。
window.createSect=function(){ if(!requireLogin())return; if(!isAdmin() && !isRankAtLeast('三转')) return toast('三转以上才可创建势力'); openModal(`${modalHead('创建势力')}<form id="sectForm" class="form"><label>势力名<input name="name"></label><label>势力宣言<textarea name="note"></textarea></label><button>创建</button></form>`); $('sectForm').onsubmit=async e=>{e.preventDefault(); const data=Object.fromEntries(new FormData(e.target).entries()); if(!data.name)return; await setDoc(ref('sects',data.name),{...data,id:data.name,master:accountId,createdAt:serverTimestamp()},{merge:true}); closeModal();toast('势力已创建');}; };
renderSects=function(){ $('content').innerHTML=`<div class="toolbar"><button onclick="window.createSect()">创建势力（三转以上）</button></div><div class="grid">${(state.sects||[]).map(s=>`<div class="card"><h3>${safe(s.name||s.id)}</h3><p>宗主：${safe(s.master||'未定')}</p><p>${safe(s.note||'')}</p></div>`).join('')||empty()}</div>`; };

// 传音阁：公共、群聊、私信、好友入口。
window.createGroup=function(){ if(!requireLogin())return; const name=prompt('群聊名称'); if(!name)return; window.chatChannel='group:'+name; render(); };
window.privateChat=function(){ if(!requireLogin())return; const to=prompt('输入对方玩家ID'); if(!to)return; window.chatChannel='private:'+[accountId,to].sort().join('|'); render(); };
window.addFriend=function(){ if(!requireLogin())return; const to=prompt('输入好友玩家ID'); if(!to)return; const friends=Array.from(new Set([...(me.friends||[]),to])); saveMe({friends}).then(()=>toast('已加入好友列表')); };
renderChat=function(){ const ch=window.chatChannel||'world'; const friends=(me?.friends||[]).map(f=>`<button onclick="window.chatChannel='private:${[accountId,f].sort().join('|')}';render()">${safe(f)}</button>`).join(''); $('content').innerHTML=`<div class="toolbar"><button onclick="window.chatChannel='world';render()">公共聊天</button><button onclick="window.createGroup()">创建/进入群聊</button><button onclick="window.privateChat()">私信</button><button onclick="window.addFriend()">加好友</button>${friends}</div><p class="muted">当前频道：${safe(ch)}</p><div class="chat-box">${state.messages.filter(m=>(m.channel||'world')===ch).map(m=>`<div class="msg"><b>${safe(m.name)}</b>：${safe(m.text)}</div>`).join('')}</div><form class="chat-input" id="chatForm"><input name="text" placeholder="传音入密……"><button>发送</button></form>`; $('chatForm').onsubmit=async e=>{e.preventDefault(); const text=e.target.text.value.trim(); if(!text)return; await addDoc(col('messages'),{name:me?.name||accountId||'无名',text,channel:ch,createdAt:serverTimestamp()}); e.target.reset();}; };

// 规则页补充。
renderRules=function(){ $('content').innerHTML=`<div class="scroll-panel"><h2>V7.4核心规则</h2><p>属性显示不再被跨流派直接除二；只有使用跨流派蛊物时效果减半，且+1不会变0。</p><p>未吸收蛊物不能装备；同一蛊物不能同时占多个快捷格。装备栏默认显示5格，可打开0-9十格弹窗。</p><p>三转以上可创建蛊虫、蛊方、势力；任意流派大师可创杀招，任意流派宗师可创凡蛊屋。</p><p>交易坊支持元石与背包物品交换；传音阁支持公共、群聊、私信、好友。</p></div>`; };



/* ===================== V8 历练谷 / 闭关洞 / 拍卖行：成长循环核心版 ===================== */
if(!navs.some(x=>x[0]==='adventure')){
  const idx = navs.findIndex(x=>x[0]==='rankings');
  navs.splice(idx,0,["adventure","历练谷","地图历练，获得元石、蛊材与蛊虫"],["cultivate","闭关洞","消耗资源修炼并突破小境界"],["auction","拍卖行","离线挂售背包蛊物，自动成交"]);
  icons.adventure="历"; icons.cultivate="修"; icons.auction="拍";
}
state.auctions = state.auctions || [];
const adventureAreas = [
  {id:'bamboo',name:'青竹林',rank:'一转',cost:5,time:10,stones:[10,30],materials:['青竹叶','竹露','青竹根'],guChance:18,desc:'适合一转蛊师历练，产出基础木道、风道蛊材。'},
  {id:'wolf',name:'野狼山',rank:'二转',cost:15,time:20,stones:[30,80],materials:['狼牙','狼血','风狼皮'],guChance:15,desc:'山势险峻，常有狼群游荡。'},
  {id:'bone',name:'白骨洞',rank:'三转',cost:35,time:30,stones:[80,180],materials:['白骨粉','阴骨枝','骨纹石'],guChance:12,desc:'白骨堆积之地，魂道与骨道资源较多。'},
  {id:'blood',name:'血河谷',rank:'四转',cost:80,time:45,stones:[180,420],materials:['血河砂','赤血石','血纹花'],guChance:9,desc:'血气浓重，风险更高，收益也更高。'},
  {id:'beast',name:'万兽山',rank:'五转',cost:180,time:60,stones:[420,1000],materials:['兽王骨','万兽精血','荒兽鳞'],guChance:6,desc:'五转蛊师才适合深入，掉落高阶资源。'}
];
function randInt(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function canEnterRank(rank){return isAdmin() || rankNum(realmRank(me?.realm))>=rankNum(rank)}
function addInv(inv,type,id,count=1){inv[type] ||= {}; inv[type][id] ||= {count:0}; inv[type][id].count += count; return inv;}
function nextRealmName(realm){
  const r=realmRank(realm), m=minorIndex(realm), ri=ranks.indexOf(r);
  if(m<3) return r + minorRealms[m+1];
  if(ri>=0 && ri<ranks.length-1) return ranks[ri+1] + '初期';
  return realm;
}
function cultivationNeed(p=me){const r=rankNum(realmRank(p?.realm)); const m=minorIndex(p?.realm)+1; return r*300 + m*150;}
function breakthroughCost(p=me){const r=rankNum(realmRank(p?.realm)); return {stones:r*120, essence:Math.ceil(maxEssence(p)*0.35)};}
function staticMaterialObj(name){return {id:name,name,rank:'凡品',price:10,effect:'历练所得蛊材'};}
const oldSubscribeAllV8 = subscribeAll;
subscribeAll = function(){
  if(unsubbed) return; unsubbed=true;
  ['users','players','guworms','killmoves','guhouses','recipes','materials','trades','sects','auctions'].forEach(name=>onSnapshot(col(name),snap=>{state[name]=snap.docs.map(d=>({id:d.id,...d.data()})); if(name==='users') me = state.users.find(u=>u.id===accountId)||null; renderUser(); render();}));
  onSnapshot(query(col('messages'),orderBy('createdAt','asc')),snap=>{state.messages=snap.docs.map(d=>({id:d.id,...d.data()})); if(current==='chat') render();});
};
const oldRenderV8 = render;
render = function(){
  const q=($('globalSearch')?.value||'').trim();
  if(current==='adventure') renderAdventure();
  else if(current==='cultivate') renderCultivate();
  else if(current==='auction') renderAuction(q);
  else oldRenderV8();
  renderVitals();
};
function renderAdventure(){
  if(!requireLogin())return;
  $('content').innerHTML=`<div class="scroll-panel"><h2>历练谷</h2><p>历练消耗真元，获得元石、蛊材，并有概率获得同阶蛊虫。适合让玩家每天有事可做。</p></div><div class="grid adventure-grid">${adventureAreas.map((a,i)=>`<div class="card adventure-card"><h3>${safe(a.name)}</h3><span class="pill">推荐 ${safe(a.rank)}</span><span class="pill">消耗 ${n(a.cost)} 真元</span><p>${safe(a.desc)}</p><p class="muted">奖励：元石 ${a.stones[0]}~${a.stones[1]}｜蛊材×1~3｜蛊虫概率 ${a.guChance}%</p><button ${canEnterRank(a.rank)?'':'disabled'} onclick="window.startAdventure(${i})">开始历练</button></div>`).join('')}</div>`;
}
window.startAdventure=async function(i){
  if(!requireLogin())return; const a=adventureAreas[i]; if(!a)return;
  if(!canEnterRank(a.rank))return toast('境界不足，无法进入');
  if(n(me.essence)<a.cost)return toast('真元不足');
  const inv=myInv(); const stones=randInt(a.stones[0],a.stones[1]); const mat=a.materials[randInt(0,a.materials.length-1)]; const matCount=randInt(1,3); addInv(inv,'materials',mat,matCount);
  let guText='';
  const pool=approved(state.guworms).filter(g=>itemRank(g)===a.rank);
  if(pool.length && randInt(1,100)<=a.guChance){const g=pool[randInt(0,pool.length-1)]; addInv(inv,'guworms',g.id,1); guText=`，获得蛊虫：${g.name||g.id}×1`;}
  await saveMe({essence:n(me.essence)-a.cost, stones:n(me.stones)+stones, inventory:inv, adventureCount:n(me.adventureCount)+1, cultivation:n(me.cultivation)+Math.ceil(stones/3)});
  fx(`历练完成：元石+${stones}，${mat}×${matCount}${guText}`);
};
function renderCultivate(){
  if(!requireLogin())return; const cur=n(me.cultivation), need=cultivationNeed(me), cost=breakthroughCost(me), next=nextRealmName(me.realm);
  $('content').innerHTML=`<div class="scroll-panel"><h2>闭关洞</h2><p>当前境界：<b>${safe(me.realm)}</b> → 下一境界：<b>${safe(next)}</b></p><p>修为：${cur}/${need}</p><div class="progress"><i style="width:${Math.min(100,cur/need*100)}%"></i></div><p class="muted">闭关可消耗元石获得修为；历练也会少量增加修为。</p><div class="toolbar"><button onclick="window.cultivateOnce(50)">闭关一次：50元石 → 修为+80</button><button onclick="window.cultivateOnce(200)">闭关四时辰：200元石 → 修为+360</button><button onclick="window.breakthrough()">尝试突破</button></div><p>突破消耗：元石 ${cost.stones}，真元 ${cost.essence}</p></div>`;
}
window.cultivateOnce=async function(stones){
  if(!requireLogin())return; if(n(me.stones)<stones)return toast('元石不足'); const gain=stones===50?80:360; await saveMe({stones:n(me.stones)-stones,cultivation:n(me.cultivation)+gain}); toast(`闭关完成，修为+${gain}`);
};
window.breakthrough=async function(){
  if(!requireLogin())return; const need=cultivationNeed(me), cost=breakthroughCost(me), next=nextRealmName(me.realm);
  if(next===me.realm)return toast('已至当前最高境界');
  if(n(me.cultivation)<need)return toast('修为不足');
  if(n(me.stones)<cost.stones)return toast('元石不足');
  if(n(me.essence)<cost.essence)return toast('真元不足');
  const newMax=Math.floor((baseEssence[realmRank(next)]||60)*(aptPct[me.aptitude]||0.45));
  await saveMe({realm:next,cultivation:n(me.cultivation)-need,stones:n(me.stones)-cost.stones,essence:Math.min(newMax,n(me.essence)-cost.essence+Math.ceil(newMax*0.4))});
  fx(`突破成功：${next}`);
};
function renderAuction(q=''){
  if(!requireLogin())return; const arr=filter((state.auctions||[]).filter(a=>a.status!=='sold'&&a.status!=='cancelled'),q);
  $('content').innerHTML=`<div class="toolbar"><button onclick="window.createAuction()">挂售背包蛊物</button></div><div class="grid">${arr.map(a=>`<div class="card"><h3>${safe(a.name||itemName(a.type,a.itemId))}</h3><span class="pill">${safe(typeCN[a.type]||a.type)}</span><span class="pill">价格 ${n(a.price)} 元石</span><p>卖家：${safe(a.seller)}</p><p class="muted">数量：${n(a.count||1)}</p><div class="toolbar">${a.seller===accountId?`<button onclick="window.cancelAuction('${a.id}')">下架</button>`:`<button onclick="window.buyAuction('${a.id}')">购买</button>`}</div></div>`).join('')||empty()}</div>`;
}
window.createAuction=function(){
  if(!requireLogin())return; const opts=['guworms','killmoves','guhouses','recipes','materials'].map(type=>Object.entries(myInv()[type]||{}).filter(([id,v])=>n(v.count)>0).map(([id,v])=>`<option value="${safe(type+':'+id)}">${safe(typeCN[type]+'｜'+itemName(type,id)+' ×'+n(v.count))}</option>`).join('')).join('');
  openModal(`${modalHead('拍卖行挂售')}<div class="form"><label>选择物品<select id="auctionItem">${opts}</select></label><label>数量<input id="auctionCount" type="number" value="1"></label><label>价格<input id="auctionPrice" type="number" value="100"></label><button id="auctionSubmit">挂售</button></div>`);
  $('auctionSubmit').onclick=async()=>{const val=$('auctionItem').value; if(!val)return toast('没有可挂售物品'); const [type,id]=val.split(':'); const count=Math.max(1,n($('auctionCount').value)); const price=Math.max(1,n($('auctionPrice').value)); const inv=myInv(); if(n(inv[type]?.[id]?.count)<count)return toast('数量不足'); inv[type][id].count-=count; if(inv[type][id].count<=0)delete inv[type][id]; await saveMe({inventory:inv}); await addDoc(col('auctions'),{seller:accountId,type,itemId:id,count,price,name:itemName(type,id),status:'active',createdAt:serverTimestamp()}); closeModal(); toast('已挂售');};
};
window.cancelAuction=async function(id){
  if(!requireLogin())return; const a=state.auctions.find(x=>x.id===id); if(!a||a.seller!==accountId)return; const inv=myInv(); addInv(inv,a.type,a.itemId,n(a.count||1)); await saveMe({inventory:inv}); await setDoc(ref('auctions',id),{status:'cancelled'},{merge:true}); toast('已下架并退回背包');
};
window.buyAuction=async function(id){
  if(!requireLogin())return; const a=state.auctions.find(x=>x.id===id); if(!a||a.status!=='active')return toast('拍卖不存在'); if(a.seller===accountId)return toast('不能购买自己的物品'); if(n(me.stones)<n(a.price))return toast('元石不足');
  const sellerDoc=await getDoc(ref('users',a.seller)); if(!sellerDoc.exists())return toast('卖家不存在'); const seller={id:a.seller,...sellerDoc.data()};
  const inv=myInv(); addInv(inv,a.type,a.itemId,n(a.count||1)); await saveMe({stones:n(me.stones)-n(a.price),inventory:inv}); await setDoc(ref('users',a.seller),{...seller,stones:n(seller.stones)+n(a.price),updatedAt:serverTimestamp()},{merge:true}); await setDoc(ref('auctions',id),{status:'sold',buyer:accountId,soldAt:serverTimestamp()},{merge:true}); toast('购买成功，物品已入乾坤袋');
};
renderRules=function(){ $('content').innerHTML=`<div class="scroll-panel"><h2>V8 成长循环版</h2><p>新增历练谷：消耗真元，获得元石、蛊材，并有概率获得同阶蛊虫。</p><p>新增闭关洞：消耗元石获得修为，修为足够后可自动突破小境界。</p><p>新增拍卖行：玩家可离线挂售背包蛊物，买家支付元石后自动转入背包。</p><p>原有规则：同阶及低阶可吸收；未吸收不可装备；跨流派使用效果减半；三转以上可创建蛊虫、蛊方、势力。</p></div>`; };



/* ===================== V8.2 稳定修复：历练冷却/死亡/闭关倒计时/突破倒计时/自动恢复 ===================== */
const V82 = { adventureCooldown: 5*60*1000, deathMs: 30*1000 };
const trialDamageByRank = {"一转":3,"二转":8,"三转":15,"四转":20,"五转":30};
const essenceRegenByRank = {"一转":1,"二转":2,"三转":4,"四转":8,"五转":16,"六转":32,"七转":64,"八转":128,"九转":256};
function rankBaseEssence(p=me){ return baseEssence[realmRank(p?.realm)] || 60; }
function hpRegenRate(p=me){ return essenceRegenByRank[realmRank(p?.realm)] || 1; }
function isDead(p=me){ return !!p && (n(p.hp) <= 0 || n(p.deadUntil) > Date.now()); }
function deathLeft(p=me){ return Math.max(0, Math.ceil((n(p?.deadUntil)-Date.now())/1000)); }
function actionLocked(){ if(!requireLogin()) return true; if(isDead(me)){ renderDeathScreen(); return true; } return false; }
function nowMs(){ return Date.now(); }
function adventureLeft(){ return Math.max(0, Math.ceil((n(me?.lastAdventureAt)+V82.adventureCooldown-Date.now())/1000)); }
function adventureRewardRate(area){
  const pr=rankNum(realmRank(me?.realm)); const ar=rankNum(area.rank);
  if(pr < ar) return 0;          // 低转强刷高转：只扣血，不给收益
  if(pr > ar) return 0.25;       // 高转刷低转：收益25%
  return 1;
}
function areaDamage(area){
  const pr=rankNum(realmRank(me?.realm)); const ar=rankNum(area.rank);
  const base=trialDamageByRank[area.rank] || 15;
  return pr < ar ? Math.max(15, base) : base;
}
function redDeathHtml(left){return `<div id="deathOverlay"><div><h1>你已死亡</h1><p>${left>0?`魂魄重聚中：${left}秒`:'可尝试重生'}</p><p>重生消耗：100元石</p>${left<=0?'<button onclick="window.respawnMe()">重生</button>':''}</div></div>`}
function renderDeathScreen(){
  let o=document.getElementById('deathOverlay'); const left=deathLeft(me);
  if(isDead(me) || n(me?.hp)<=0){
    if(!o){ o=document.createElement('div'); o.id='deathOverlay'; document.body.appendChild(o); }
    o.innerHTML=redDeathHtml(left).replace('<div id="deathOverlay">','').replace(/<\/div>$/,'');
  }else if(o) o.remove();
}
window.respawnMe=async function(){
  if(!requireLogin())return; if(deathLeft(me)>0)return toast('死亡惩罚还未结束');
  if(n(me.stones)<100)return toast('元石不足，重生失败，请联系管理员');
  await saveMe({stones:n(me.stones)-100,hp:computedAttrs(me).life,deadUntil:0});
  const o=document.getElementById('deathOverlay'); if(o)o.remove(); toast('重生成功，扣除100元石');
};
window.adminKillUser=async function(id){
  if(!isAdmin())return toast('只有管理员可执行');
  if(!confirm('确定让该玩家死亡30秒？'))return;
  await setDoc(ref('users',id),{hp:0,deadUntil:Date.now()+V82.deathMs,updatedAt:serverTimestamp()},{merge:true});
  toast('已设置死亡30秒');
};

// 管理员详情加“死亡30秒”按钮
const oldUserDetailV82 = userDetail;
userDetail=function(id){ oldUserDetailV82(id); setTimeout(()=>{ if(isAdmin() && $('modalContent')){ const box=document.createElement('div'); box.className='toolbar'; box.innerHTML=`<button class="danger" onclick="window.adminKillUser('${safe(id)}')">设为死亡30秒</button>`; $('modalContent').appendChild(box); } },30); };

// 一键恢复真元：允许为了突破临时超上限，最高到突破所需真元
window.restoreEssence=async function(){
  if(!requireLogin())return; if(isDead(me))return renderDeathScreen();
  const use=restoreAmount ? restoreAmount() : 1;
  if(n(me.stones)<use)return toast('元石不足');
  const cap=Math.max(maxEssence(me), breakthroughCost(me).essence);
  const before=n(me.essence); const add=Math.min(use*10, Math.max(0,cap-before));
  if(add<=0)return toast('真元已达当前可储备上限');
  await saveMe({stones:n(me.stones)-use, essence:before+add});
  toast(`使用${use}元石，恢复${add}真元`);
};

// 技能释放：未吸收不可使用；冷却倒计时会每秒刷新
const oldUseEquippedV82 = window.useEquipped;
window.useEquipped=async function(slot){
  if(actionLocked())return; const eq=equipArray(); const e=eq[slot]; if(!e)return toast('此格为空');
  if(!isAbsorbed(e.type,e.id,me))return toast('未吸收蛊物不可使用');
  const left=equipCooldownLeft(slot); if(left>0)return toast(`冷却中：${left}秒`);
  await oldUseEquippedV82(slot);
};

// 历练谷：五分钟冷却、扣血、越阶无收益、高阶刷低阶25%收益
renderAdventure=function(){
  if(!requireLogin())return; renderDeathScreen();
  const cd=adventureLeft();
  $('content').innerHTML=`<div class="scroll-panel"><h2>历练谷</h2><p>每次历练后需等待5分钟。高转刷低转只获得25%收益；低转强刷高转会扣血且无收益。</p><p class="muted">当前冷却：${cd>0?cd+'秒':'可历练'}｜死亡后30秒可重生，重生扣100元石。</p></div><div class="grid adventure-grid">${adventureAreas.map((a,i)=>{const dmg=areaDamage(a), rate=adventureRewardRate(a); return `<div class="card adventure-card"><h3>${safe(a.name)}</h3><span class="pill">推荐 ${safe(a.rank)}</span><span class="pill">扣血 ${dmg}</span><span class="pill">收益 ${Math.round(rate*100)}%</span><p>${safe(a.desc)}</p><p class="muted">奖励：元石 ${a.stones[0]}~${a.stones[1]}｜蛊材×1~3｜蛊虫概率 ${a.guChance}%</p><button ${cd>0||isDead(me)?'disabled':''} onclick="window.startAdventure(${i})">开始历练</button></div>`}).join('')}</div>`;
};
window.startAdventure=async function(i){
  if(actionLocked())return; const a=adventureAreas[i]; if(!a)return;
  const cd=adventureLeft(); if(cd>0)return toast(`历练冷却中：${cd}秒`);
  const dmg=areaDamage(a); const hpAfter=n(me.hp || computedAttrs(me).life)-dmg;
  const patch={hp:hpAfter,lastAdventureAt:Date.now(),updatedAt:serverTimestamp()};
  if(hpAfter<=0){ patch.deadUntil=Date.now()+V82.deathMs; await saveMe(patch); fx('历练失败：身死道消'); renderDeathScreen(); return; }
  const rate=adventureRewardRate(a);
  if(rate<=0){ await saveMe(patch); fx(`强行历练受创：生命-${dmg}，无收益`); return; }
  const inv=myInv(); const stones=Math.floor(randInt(a.stones[0],a.stones[1])*rate); const mat=a.materials[randInt(0,a.materials.length-1)]; const matCount=Math.max(1,Math.floor(randInt(1,3)*rate)); addInv(inv,'materials',mat,matCount);
  let guText=''; const pool=approved(state.guworms).filter(g=>itemRank(g)===a.rank);
  if(pool.length && randInt(1,100)<=Math.max(1,Math.floor(a.guChance*rate))){const g=pool[randInt(0,pool.length-1)]; addInv(inv,'guworms',g.id,1); guText=`，获得蛊虫：${g.name||g.id}×1`;}
  await saveMe({...patch,stones:n(me.stones)+stones,inventory:inv,adventureCount:n(me.adventureCount)+1,cultivation:n(me.cultivation)+Math.ceil(stones/3)});
  fx(`历练完成：生命-${dmg}，元石+${stones}，${mat}×${matCount}${guText}`);
};

// 闭关洞：小闭关1分钟，大闭关5分钟，突破20秒倒计时且有失败概率
function cultivateJobDone(){ return me?.cultivateJob && n(me.cultivateJob.until)<=Date.now(); }
function breakthroughJobDone(){ return me?.breakthroughJob && n(me.breakthroughJob.until)<=Date.now(); }
function breakthroughChance(p=me){ const apt=p?.aptitude; return apt==='十绝体'?92:apt==='甲'?85:apt==='乙'?78:apt==='丙'?68:55; }
breakthroughCost=function(p=me){ return {stones:rankNum(realmRank(p?.realm))*120, essence:Math.ceil(rankBaseEssence(p)*1.5)}; };
renderCultivate=function(){
  if(!requireLogin())return; renderDeathScreen(); const cur=n(me.cultivation), need=cultivationNeed(me), cost=breakthroughCost(me), next=nextRealmName(me.realm);
  let jobHtml='';
  if(me.cultivateJob){ const left=Math.max(0,Math.ceil((n(me.cultivateJob.until)-Date.now())/1000)); jobHtml = left>0 ? `<p class="countdown">闭关中：${left}秒</p>` : `<button onclick="window.claimCultivation()">领取闭关成果 +${n(me.cultivateJob.gain)}修为</button>`; }
  if(me.breakthroughJob){ const left=Math.max(0,Math.ceil((n(me.breakthroughJob.until)-Date.now())/1000)); jobHtml += left>0 ? `<p class="countdown danger-text">突破中：${left}秒，真元持续燃烧……</p>` : `<button onclick="window.finishBreakthrough()">结算突破</button>`; }
  $('content').innerHTML=`<div class="scroll-panel"><h2>闭关洞</h2><p>当前境界：<b>${safe(me.realm)}</b> → 下一境界：<b>${safe(next)}</b></p><p>修为：${cur}/${need}</p><div class="progress"><i style="width:${Math.min(100,cur/need*100)}%"></i></div><p>当前真元：${n(me.essence)}/${maxEssence(me)}（突破需 ${cost.essence} 真元，可用元石临时补足）</p>${jobHtml}<div class="toolbar"><button ${me.cultivateJob||me.breakthroughJob||isDead(me)?'disabled':''} onclick="window.startCultivation('small')">闭关一次：1分钟，50元石 → 修为+80</button><button ${me.cultivateJob||me.breakthroughJob||isDead(me)?'disabled':''} onclick="window.startCultivation('big')">大闭关：5分钟，200元石 → 修为+360</button><button ${me.cultivateJob||me.breakthroughJob||isDead(me)?'disabled':''} onclick="window.breakthrough()">尝试突破</button></div><p class="muted">突破耗时20秒，需150%基础真元，并有失败概率。真元不足则突破失败。</p><p>突破消耗：元石 ${cost.stones}，真元 ${cost.essence}｜成功率约 ${breakthroughChance(me)}%</p></div>`;
};
window.startCultivation=async function(kind){
  if(actionLocked())return; if(me.cultivateJob||me.breakthroughJob)return toast('已有闭关/突破进行中');
  const isBig=kind==='big'; const stones=isBig?200:50, gain=isBig?360:80, dur=isBig?5*60*1000:60*1000;
  if(n(me.stones)<stones)return toast('元石不足');
  await saveMe({stones:n(me.stones)-stones,cultivateJob:{until:Date.now()+dur,gain,kind}}); toast(isBig?'大闭关开始':'闭关开始'); render();
};
window.claimCultivation=async function(){
  if(!requireLogin())return; if(!cultivateJobDone())return toast('闭关尚未完成');
  const gain=n(me.cultivateJob.gain); await saveMe({cultivation:n(me.cultivation)+gain,cultivateJob:null}); toast(`闭关完成，修为+${gain}`); render();
};
window.cultivateOnce=async function(stones){ return window.startCultivation(stones>=200?'big':'small'); };
window.breakthrough=async function(){
  if(actionLocked())return; if(me.cultivateJob||me.breakthroughJob)return toast('已有闭关/突破进行中');
  const need=cultivationNeed(me), cost=breakthroughCost(me), next=nextRealmName(me.realm);
  if(next===me.realm)return toast('已至当前最高境界');
  if(n(me.cultivation)<need)return toast('修为不足');
  if(n(me.stones)<cost.stones)return toast('元石不足');
  if(n(me.essence)<cost.essence)return toast('真元不足，需要150%基础真元');
  await saveMe({stones:n(me.stones)-cost.stones,breakthroughJob:{until:Date.now()+20*1000,next,costEssence:cost.essence,need,chance:breakthroughChance(me)}}); toast('开始突破，20秒后结算'); render();
};
window.finishBreakthrough=async function(){
  if(!requireLogin())return; if(!breakthroughJobDone())return toast('突破尚未完成');
  const j=me.breakthroughJob, cost=n(j.costEssence), need=n(j.need); if(n(me.essence)<cost){ await saveMe({breakthroughJob:null}); fx('突破失败：真元不足'); return; }
  const ok=randInt(1,100)<=n(j.chance||70); const next=j.next;
  if(!ok){ await saveMe({essence:Math.max(0,n(me.essence)-cost),breakthroughJob:null}); fx('突破失败：道基震荡'); return; }
  const newMax=Math.floor((baseEssence[realmRank(next)]||60)*(aptPct[me.aptitude]||0.45));
  await saveMe({realm:next,cultivation:Math.max(0,n(me.cultivation)-need),essence:Math.min(newMax,Math.max(0,n(me.essence)-cost)+Math.ceil(newMax*0.4)),breakthroughJob:null}); fx(`突破成功：${next}`); render();
};

// 自动恢复：真元每秒恢复，生命每10秒恢复。每10秒写一次数据库，避免狂写。
let regenLocal={t:Date.now(),save:0};
function runtimeTick(){
  if(!me) return; renderDeathScreen();
  const now=Date.now();
  // 刷新倒计时UI
  if(current==='cultivate'||current==='adventure') render(); else renderVitals();
  if(isDead(me)) return;
  const elapsed=Math.floor((now-regenLocal.t)/1000); if(elapsed<=0)return; regenLocal.t=now;
  let es=n(me.essence), hp=n(me.hp||computedAttrs(me).life); const esMax=maxEssence(me), hpMax=computedAttrs(me).life;
  const er=essenceRegenByRank[realmRank(me.realm)]||1; es=Math.min(esMax, es + er*elapsed);
  // 每10秒恢复一次生命
  const hpTicks=Math.floor(now/10000)-Math.floor((now-elapsed*1000)/10000); if(hpTicks>0) hp=Math.min(hpMax, hp + hpRegenRate(me)*hpTicks);
  if((es!==n(me.essence)||hp!==n(me.hp||hpMax)) && now-regenLocal.save>9000){ regenLocal.save=now; saveMe({essence:es,hp}).catch(()=>{}); }
}
setInterval(runtimeTick,1000);

renderRules=function(){ $('content').innerHTML=`<div class="scroll-panel"><h2>V8.2 历练/闭关修复版</h2><p>历练谷：每5分钟一次；高转刷低转收益25%；低转强刷高转只扣血无收益。</p><p>历练扣血：一转3，二转8，三转15，四转20，五转30。死亡后红字30秒，重生扣100元石。</p><p>闭关洞：小闭关1分钟，大闭关5分钟；突破耗时20秒，需150%基础真元，并存在失败概率。</p><p>恢复：一转每秒回1真元，二转2，三转4，四转8，五转16；生命每10秒按同倍率恢复。</p></div>`; };

boot();

/* ===================== V8.3 历练冷却细化 / 丹田突破动画 / 实时扣真元 ===================== */
const V83 = { areaCooldown: 60*1000, breakthroughMs: 20*1000 };

// 增加一转、二转历练地，避免低阶玩家无事可刷
try{
  const moreAreas = [
    {id:'grass_slope',name:'青芒草坡',rank:'一转',cost:3,time:10,stones:[8,24],materials:['青芒草','露珠叶','草木灰'],guChance:14,desc:'最安全的一转历练地，适合新入世蛊师熟悉战斗。'},
    {id:'small_wind_valley',name:'小风谷',rank:'一转',cost:4,time:10,stones:[10,28],materials:['风砂','轻羽草','谷风石'],guChance:16,desc:'风声不绝，常产风道基础蛊材。'},
    {id:'blood_mosquito_wood',name:'血蚊林',rank:'一转',cost:5,time:10,stones:[12,32],materials:['血蚊翅','赤纹叶','血滴草'],guChance:18,desc:'血蚊成群，收益略高，但会损耗气血。'},
    {id:'stone_tooth_shore',name:'石牙滩',rank:'一转',cost:4,time:10,stones:[9,26],materials:['石牙','细砂晶','碎岩粉'],guChance:13,desc:'浅滩遍布石牙，适合力道、石道基础采集。'},
    {id:'red_fox_hill',name:'赤狐丘',rank:'二转',cost:14,time:20,stones:[28,76],materials:['赤狐尾','狐火毛','兽血珠'],guChance:14,desc:'赤狐出没，火道与变化道蛊材较多。'},
    {id:'thunder_cliff',name:'雷雨崖',rank:'二转',cost:16,time:20,stones:[32,84],materials:['雷击木','电纹石','雷雨露'],guChance:15,desc:'雷雨常年不散，适合雷道蛊师冒险。'},
    {id:'mist_creek',name:'云雾涧',rank:'二转',cost:13,time:20,stones:[26,72],materials:['云雾晶','白云石','浮云叶'],guChance:15,desc:'云雾深藏，云道、气道资源丰富。'},
    {id:'sand_scorpion_dune',name:'沙蝎丘',rank:'二转',cost:15,time:20,stones:[30,80],materials:['沙蝎壳','黄沙晶','毒尾针'],guChance:14,desc:'沙蝎盘踞，适合沙道与毒性蛊材收集。'}
  ];
  moreAreas.forEach(a=>{ if(!adventureAreas.some(x=>x.id===a.id)) adventureAreas.splice(Math.max(1, adventureAreas.length-3),0,a); });
}catch(e){ console.warn('V8.3 添加历练地失败', e); }

function areaCooldownLeft(area){
  const map = me?.lastAdventureByArea || {};
  return Math.max(0, Math.ceil((n(map[area.id]) + V83.areaCooldown - Date.now())/1000));
}
function essenceColorClassByRank(rank){ return essenceClass[rank] || 'essence-green'; }
function essenceColorHexByRank(rank){
  return {"一转":"#47d88a","二转":"#d63b3b","三转":"#dfe7f0","四转":"#f0c847","五转":"#a56cff","六转":"#47d88a","七转":"#d63b3b","八转":"#dfe7f0","九转":"#f0c847"}[rank] || '#47d88a';
}
function breakthroughProgress(job){
  if(!job) return 0;
  const started = n(job.startedAt) || (n(job.until)-V83.breakthroughMs);
  return Math.max(0, Math.min(1, (Date.now()-started)/V83.breakthroughMs));
}
function dantianHtml(job){
  if(!job) return '';
  const curRank = realmRank(me?.realm);
  const nextRank = realmRank(job.next || me?.realm);
  const p = breakthroughProgress(job);
  const from = essenceColorHexByRank(curRank), to = essenceColorHexByRank(nextRank);
  const burnNeed = n(job.costEssence), burned = n(job.consumedEssence);
  const left = Math.max(0, Math.ceil((n(job.until)-Date.now())/1000));
  return `<div class="breakthrough-stage">
    <h3>真元冲关</h3>
    <div class="dantian" style="--from:${from};--to:${to};--p:${Math.round(p*100)}%">
      <div class="dantian-fill"></div>
      <div class="dantian-core">${Math.round(p*100)}%</div>
    </div>
    <p><b>${safe(curRank)}</b> 元池正在冲击 <b>${safe(nextRank)}</b> 元池</p>
    <p class="countdown danger-text">剩余 ${left} 秒｜已燃烧真元 ${Math.floor(burned)}/${burnNeed}</p>
    <p>当前真元：<b>${n(me.essence)}</b> / ${Math.max(maxEssence(me), burnNeed)}</p>
    <div class="toolbar"><button onclick="window.restoreEssence()">立刻用元石恢复真元</button></div>
  </div>`;
}

// 每个历练地单独1分钟冷却，低阶可强刷高阶但只扣血无收益，高阶刷低阶25%收益
renderAdventure=function(){
  if(!requireLogin())return; renderDeathScreen();
  $('content').innerHTML=`<div class="scroll-panel"><h2>历练谷</h2><p>每个试炼地独立冷却1分钟。一转也可强闯高阶试炼地，但只会扣血，无收益；高转刷低转收益25%。</p><p class="muted">死亡后红屏30秒，重生扣100元石；元石不足需管理员处理。</p></div><div class="grid adventure-grid">${adventureAreas.map((a,i)=>{const dmg=areaDamage(a), rate=adventureRewardRate(a), cd=areaCooldownLeft(a); return `<div class="card adventure-card"><h3>${safe(a.name)}</h3><span class="pill">推荐 ${safe(a.rank)}</span><span class="pill">扣血 ${dmg}</span><span class="pill">收益 ${Math.round(rate*100)}%</span><span class="pill">${cd>0?'冷却 '+cd+'秒':'可历练'}</span><p>${safe(a.desc)}</p><p class="muted">奖励：元石 ${a.stones[0]}~${a.stones[1]}｜蛊材×1~3｜蛊虫概率 ${a.guChance}%</p><button ${cd>0||isDead(me)?'disabled':''} onclick="window.startAdventure(${i})">开始历练</button></div>`}).join('')}</div>`;
};
window.startAdventure=async function(i){
  if(actionLocked())return; const a=adventureAreas[i]; if(!a)return;
  const cd=areaCooldownLeft(a); if(cd>0)return toast(`${a.name} 冷却中：${cd}秒`);
  const dmg=areaDamage(a); const hpAfter=n(me.hp || computedAttrs(me).life)-dmg;
  const byArea={...(me.lastAdventureByArea||{})}; byArea[a.id]=Date.now();
  const patch={hp:hpAfter,lastAdventureByArea:byArea,updatedAt:serverTimestamp()};
  if(hpAfter<=0){ patch.deadUntil=Date.now()+V82.deathMs; await saveMe(patch); fx('历练失败：身死道消'); renderDeathScreen(); return; }
  const rate=adventureRewardRate(a);
  if(rate<=0){ await saveMe(patch); fx(`强闯${a.name}受创：生命-${dmg}，无收益`); return; }
  const inv=myInv(); const stones=Math.floor(randInt(a.stones[0],a.stones[1])*rate); const mat=a.materials[randInt(0,a.materials.length-1)]; const matCount=Math.max(1,Math.floor(randInt(1,3)*rate)); addInv(inv,'materials',mat,matCount);
  let guText=''; const pool=approved(state.guworms).filter(g=>itemRank(g)===a.rank);
  if(pool.length && randInt(1,100)<=Math.max(1,Math.floor(a.guChance*rate))){const g=pool[randInt(0,pool.length-1)]; addInv(inv,'guworms',g.id,1); guText=`，获得蛊虫：${g.name||g.id}×1`;}
  await saveMe({...patch,stones:n(me.stones)+stones,inventory:inv,adventureCount:n(me.adventureCount)+1,cultivation:n(me.cultivation)+Math.ceil(stones/3)});
  fx(`历练完成：生命-${dmg}，元石+${stones}，${mat}×${matCount}${guText}`);
};

// 闭关洞显示丹田突破动画；突破期间每秒刷新真元/血量，可用元石补真元
renderCultivate=function(){
  if(!requireLogin())return; renderDeathScreen(); const cur=n(me.cultivation), need=cultivationNeed(me), cost=breakthroughCost(me), next=nextRealmName(me.realm);
  let jobHtml='';
  if(me.cultivateJob){ const left=Math.max(0,Math.ceil((n(me.cultivateJob.until)-Date.now())/1000)); jobHtml = left>0 ? `<p class="countdown">闭关中：${left}秒</p>` : `<button onclick="window.claimCultivation()">领取闭关成果 +${n(me.cultivateJob.gain)}修为</button>`; }
  if(me.breakthroughJob){ jobHtml += dantianHtml(me.breakthroughJob); }
  $('content').innerHTML=`<div class="scroll-panel"><h2>闭关洞</h2><p>当前境界：<b>${safe(me.realm)}</b> → 下一境界：<b>${safe(next)}</b></p><p>修为：${cur}/${need}</p><div class="progress"><i style="width:${Math.min(100,cur/need*100)}%"></i></div><p>当前真元：<b>${n(me.essence)}</b>/${Math.max(maxEssence(me),cost.essence)}（突破总需 ${cost.essence} 真元，20秒内持续扣除）</p>${jobHtml}<div class="toolbar"><button ${me.cultivateJob||me.breakthroughJob||isDead(me)?'disabled':''} onclick="window.startCultivation('small')">闭关一次：1分钟，50元石 → 修为+80</button><button ${me.cultivateJob||me.breakthroughJob||isDead(me)?'disabled':''} onclick="window.startCultivation('big')">大闭关：5分钟，200元石 → 修为+360</button><button ${me.cultivateJob||me.breakthroughJob||isDead(me)?'disabled':''} onclick="window.breakthrough()">尝试突破</button></div><p class="muted">突破耗时20秒，真元会逐秒燃烧；不足则元池停止变色并突破失败。突破过程中仍可点击右下角或本页按钮用元石恢复。</p><p>突破消耗：元石 ${cost.stones}，真元 ${cost.essence}｜成功率约 ${breakthroughChance(me)}%</p></div>`;
};
window.breakthrough=async function(){
  if(actionLocked())return; if(me.cultivateJob||me.breakthroughJob)return toast('已有闭关/突破进行中');
  const need=cultivationNeed(me), cost=breakthroughCost(me), next=nextRealmName(me.realm);
  if(next===me.realm)return toast('已至当前最高境界');
  if(n(me.cultivation)<need)return toast('修为不足');
  if(n(me.stones)<cost.stones)return toast('元石不足');
  if(n(me.essence)<=0)return toast('真元枯竭，无法开始冲关');
  const startedAt=Date.now();
  await saveMe({stones:n(me.stones)-cost.stones,breakthroughJob:{startedAt,until:startedAt+V83.breakthroughMs,next,costEssence:cost.essence,need,chance:breakthroughChance(me),consumedEssence:0,lastBurnAt:startedAt,failed:false}});
  toast('真元冲关开始，20秒内保持真元不断'); render();
};
window.finishBreakthrough=async function(){
  if(!requireLogin())return; const j=me.breakthroughJob; if(!j)return;
  if(n(j.until)>Date.now())return toast('突破尚未完成');
  if(j.failed){ await saveMe({breakthroughJob:null}); fx('突破失败：真元中断'); return; }
  const ok=randInt(1,100)<=n(j.chance||70); const next=j.next, need=n(j.need);
  if(!ok){ await saveMe({breakthroughJob:null}); fx('突破失败：道基震荡'); return; }
  const newMax=Math.floor((baseEssence[realmRank(next)]||60)*(aptPct[me.aptitude]||0.45));
  await saveMe({realm:next,cultivation:Math.max(0,n(me.cultivation)-need),essence:Math.min(newMax,n(me.essence)+Math.ceil(newMax*0.4)),breakthroughJob:null});
  fx(`突破成功：${next}`); render();
};

// 覆盖恢复：突破时允许恢复到突破总需真元上限；普通时恢复到当前真元池上限
window.restoreEssence=async function(){
  if(!requireLogin())return; if(isDead(me))return renderDeathScreen();
  const use=restoreAmount ? restoreAmount() : 1;
  if(n(me.stones)<use)return toast('元石不足');
  const cap=me.breakthroughJob?Math.max(maxEssence(me), n(me.breakthroughJob.costEssence)):maxEssence(me);
  const before=n(me.essence); const add=Math.min(use*10, Math.max(0,cap-before));
  if(add<=0)return toast('真元已达当前可储备上限');
  await saveMe({stones:n(me.stones)-use, essence:before+add});
  toast(`使用${use}元石，恢复${add}真元`);
};

// 突破燃烧：每秒扣除总需求/20，真元不够立即失败；每秒写入，保证玩家看到实时数值。
let v83Burning=false;
async function v83BreakthroughTick(){
  if(v83Burning || !me || !me.breakthroughJob) return;
  const j=me.breakthroughJob; const now=Date.now();
  if(j.failed) return;
  if(now >= n(j.until)){ window.finishBreakthrough(); return; }
  const last=n(j.lastBurnAt)||n(j.startedAt)||now; const elapsed=Math.floor((now-last)/1000);
  if(elapsed<=0) return;
  const perSec=n(j.costEssence)/20; const needBurn=Math.ceil(perSec*elapsed);
  if(n(me.essence) < needBurn){
    v83Burning=true;
    await saveMe({breakthroughJob:{...j,failed:true,failReason:'真元不足',lastBurnAt:now}, essence:n(me.essence)}).catch(()=>{});
    v83Burning=false; fx('突破失败：真元中断'); render(); return;
  }
  v83Burning=true;
  await saveMe({essence:n(me.essence)-needBurn, breakthroughJob:{...j,lastBurnAt:now,consumedEssence:n(j.consumedEssence)+needBurn}}).catch(()=>{});
  v83Burning=false;
}
setInterval(v83BreakthroughTick,1000);

renderRules=function(){ $('content').innerHTML=`<div class="scroll-panel"><h2>V8.3 历练与突破强化版</h2><p>历练谷：每个试炼地独立1分钟冷却；高转刷低转收益25%；低转强刷高转只扣血无收益。</p><p>历练扣血：一转3，二转8，三转15，四转20，五转30。死亡后红字30秒，重生扣100元石。</p><p>闭关洞：小闭关1分钟，大闭关5分钟；突破显示元池丹田动画，20秒内逐秒燃烧真元。</p><p>突破过程中玩家仍可用元石恢复真元；真元不足会停止变色并失败。</p><p>恢复：一转每秒回1真元，二转2，三转4，四转8，五转16；生命每10秒按同倍率恢复。</p></div>`; };

/* ===================== V8.4 聚元阵 + 拳法普攻系统 ===================== */
const V84_FORMATIONS = [
  {id:'none', name:'无聚元阵', tier:'无', level:'无', price:0, mult:1},
  {id:'mortal_low', name:'凡俗初阶聚元阵', tier:'凡俗', level:'初阶', price:500, mult:1.2},
  {id:'mortal_mid', name:'凡俗中阶聚元阵', tier:'凡俗', level:'中阶', price:1500, mult:1.5},
  {id:'mortal_high', name:'凡俗高阶聚元阵', tier:'凡俗', level:'高阶', price:5000, mult:2},
  {id:'mortal_fine', name:'凡俗精良聚元阵', tier:'凡俗', level:'精良', price:15000, mult:3},
  {id:'immortal_low', name:'仙阵初阶聚元阵', tier:'仙阵', level:'初阶', price:80000, mult:6},
  {id:'immortal_mid', name:'仙阵中阶聚元阵', tier:'仙阵', level:'中阶', price:200000, mult:11},
  {id:'immortal_high', name:'仙阵高阶聚元阵', tier:'仙阵', level:'高阶', price:600000, mult:21},
  {id:'immortal_fine', name:'仙阵精良聚元阵', tier:'仙阵', level:'精良', price:2000000, mult:51}
];
const V84_BASE_FISTS = [
  {id:'base', name:'基础拳法', damage:0.25, cooldown:1, duration:0, essence:0, desc:'人人都会的基础拳击。'},
  {id:'juntiquan', name:'军体拳', damage:0.5, cooldown:1, duration:0, essence:0, desc:'朴实凶狠，适合低阶蛊师。'},
  {id:'bengquan', name:'崩拳', damage:1, cooldown:2, duration:0, essence:0, desc:'短促爆发，贴身发力。'},
  {id:'paoquan', name:'炮拳', damage:2, cooldown:3, duration:0, essence:0, desc:'如炮崩发，攻势沉猛。'},
  {id:'bajiquan', name:'八极拳', damage:3, cooldown:4, duration:0, essence:0, desc:'贴山靠劲，近身杀伤。'},
  {id:'xingyiquan', name:'形意拳', damage:5, cooldown:5, duration:0, essence:0, desc:'拳意合一，重在精神与爆发。'}
];
function v84Formation(){return V84_FORMATIONS.find(f=>f.id===(me?.formationId||'none')) || V84_FORMATIONS[0];}
function v84CanUseFormation(f){ const r=rankNum(realmRank(me?.realm)); return isAdmin() || f.id==='none' || f.tier==='凡俗' || r>=6; }
function v84OwnedFists(){
  const list=[...V84_BASE_FISTS.map(x=>({kind:'base',...x}))];
  const absorbed=me?.absorbed?.guworms||{};
  Object.keys(absorbed).forEach(id=>{
    const g=getItem('guworms',id);
    if(g && (g.basicAttack==='是' || g.hasBasicAttack==='是' || n(g.basicDamage)>0 || n(g.punchDamage)>0)){
      list.push({kind:'gu', id, name:g.basicName||g.name||id, damage:n(g.basicDamage||g.punchDamage||1), cooldown:n(g.basicCooldown||g.punchCooldown||1), duration:n(g.basicDuration||g.punchDuration||0), essence:n(g.basicEssence||g.punchEssence||0), image:g.image||'', desc:g.basicDesc||g.effect||''});
    }
  });
  return list;
}
function v84CurrentFist(){
  const fid=me?.fistId||'base';
  return v84OwnedFists().find(f=>(f.kind==='gu'?`gu:${f.id}`:f.id)===fid) || V84_BASE_FISTS[0];
}
function v84FistKey(){return `gu_v84_fist_cd_${accountId}`;}
function v84FistLeft(){return Math.max(0,Math.ceil((n(localStorage.getItem(v84FistKey()))-Date.now())/1000));}
function v84SetFistCd(sec){if(sec>0)localStorage.setItem(v84FistKey(),String(Date.now()+sec*1000));}
window.useFistAttack=async function(){
  if(!requireLogin())return; if(isDead && isDead(me))return toast('死亡状态不可攻击');
  const left=v84FistLeft(); if(left>0)return toast(`普攻冷却中：${left}秒`);
  const fist=v84CurrentFist(); const cost=n(fist.essence);
  if(n(me.essence)<cost)return toast('真元不足');
  await saveMe({essence:n(me.essence)-cost});
  v84SetFistCd(n(fist.cooldown)||1);
  fx(`${fist.name}：伤害 ${n(fist.damage)}`);
  renderVitals();
};
window.equipFist=async function(fid){
  if(!requireLogin())return; const ok=v84OwnedFists().some(f=>(f.kind==='gu'?`gu:${f.id}`:f.id)===fid);
  if(!ok)return toast('你尚未拥有此拳法');
  await saveMe({fistId:fid}); toast('拳法已装备'); render();
};
window.openFistLibrary=function(){
  if(!requireLogin())return; const cur=me?.fistId||'base';
  openModal(`${modalHead('拳法库')}<div class="fist-grid">${v84OwnedFists().map(f=>{const fid=f.kind==='gu'?`gu:${f.id}`:f.id; return `<div class="fist-card ${fid===cur?'active':''}">${f.image?img(f.image):''}<h3>${safe(f.name)}</h3><p>伤害 ${n(f.damage)}｜冷却 ${n(f.cooldown)}秒｜真元 ${n(f.essence)}</p><p class="muted">${safe(f.desc||'')}</p><button onclick="window.equipFist('${safe(fid)}')">${fid===cur?'已装备':'装备'}</button></div>`}).join('')}</div>`);
};

const v84OldRenderVitals = renderVitals;
renderVitals=function(){
  v84OldRenderVitals();
  const box=$('vitalsDock'); if(!box || !me)return;
  const fist=v84CurrentFist(); const left=v84FistLeft();
  const add=`<div class="fist-dock"><div><b>普攻</b>：${safe(fist.name)} <span>${n(fist.damage)}伤害</span></div><button onclick="window.useFistAttack()">${left>0?left+'秒':'普攻'}</button><button onclick="window.openFistLibrary()">拳法库</button></div>`;
  if(!box.querySelector('.fist-dock')) box.insertAdjacentHTML('beforeend',add);
};

// 聚元阵加成闭关洞：小闭关/大闭关收益乘以聚元阵倍率。
const v84OldRenderCultivate = renderCultivate;
renderCultivate=function(){
  if(!requireLogin())return;
  v84OldRenderCultivate();
  const panel=document.createElement('div'); panel.className='scroll-panel formation-panel';
  const f=v84Formation();
  panel.innerHTML=`<h2>聚元阵</h2><p>当前阵法：<b>${safe(f.name)}</b>｜闭关收益 ×${f.mult}</p><div class="formation-grid">${V84_FORMATIONS.filter(x=>x.id!=='none').map(x=>`<div class="formation-card ${x.id===f.id?'active':''}"><h3>${safe(x.name)}</h3><span class="pill">${safe(x.tier)}·${safe(x.level)}</span><p>闭关收益 ×${x.mult}</p><p>价格：${n(x.price)}元石</p><button onclick="window.buyFormation('${x.id}')">${x.id===f.id?'已启用':'购买/启用'}</button>${!v84CanUseFormation(x)?'<p class="muted">六转以上方可使用仙阵</p>':''}</div>`).join('')}</div>`;
  $('content').appendChild(panel);
};
window.buyFormation=async function(id){
  if(!requireLogin())return; const f=V84_FORMATIONS.find(x=>x.id===id); if(!f)return;
  if(!v84CanUseFormation(f))return toast('境界不足，仙阵需六转以上');
  const owned=me.formations||{}; if(!owned[id]){ if(n(me.stones)<f.price)return toast('元石不足'); owned[id]=true; await saveMe({stones:n(me.stones)-f.price, formations:owned, formationId:id}); toast('聚元阵已购买并启用'); }
  else { await saveMe({formationId:id}); toast('聚元阵已启用'); }
  render();
};
const v84OldStartCultivation = window.startCultivation;
window.startCultivation=async function(type){
  if(!requireLogin())return;
  const f=v84Formation();
  if(!v84CanUseFormation(f))return toast('当前聚元阵不可用');
  if(actionLocked && actionLocked())return;
  if(me.cultivateJob||me.breakthroughJob)return toast('已有闭关/突破进行中');
  const isBig=type==='big'; const stones=isBig?200:50; const baseGain=isBig?360:80; const ms=isBig?5*60*1000:60*1000;
  if(n(me.stones)<stones)return toast('元石不足');
  const gain=Math.ceil(baseGain*f.mult);
  await saveMe({stones:n(me.stones)-stones,cultivateJob:{until:Date.now()+ms,gain,type,formation:f.name}});
  toast(`开始闭关：${f.name}，预计修为+${gain}`); render();
};

// 蛊虫编辑增加“普攻蛊”字段。
const v84OldEditItem = editItem;
editItem=async function(type,id=null){
  if(type!=='guworms') return v84OldEditItem(type,id);
  if(!requireLogin())return; const item=id?getItem(type,id):{};
  if(id && !canEditItem(item)) return toast('只能编辑自己创作的，管理员可编辑全部');
  if(!id && !canMakeWorldThing(type)) return toast('三转以上才可创建蛊虫或蛊方');
  let html=modalHead((id?'编辑':'创作')+typeCN[type]);
  let inner=field('name','名称','text',item.name)+select('rank','等级',ranks,item.rank)+select('path','流派',paths,item.path)+field('image','图标路径','text',item.image)+field('price','价格','number',item.price)+field('absorbCost','吸收所需真元','number',item.absorbCost)+field('useCost','使用一次真元','number',item.useCost)+field('range','距离','text',item.range)+field('cooldown','冷却时间/秒','text',item.cooldown)+field('duration','持续/定身时间','text',item.duration)+field('attack','攻击','number',item.attack)+field('defense','防御','number',item.defense)+field('life','生命','number',item.life)+field('speed','速度','number',item.speed)+field('spirit','精神','number',item.spirit)+select('basicAttack','是否拥有普攻',['否','是'],item.basicAttack||item.hasBasicAttack||'否')+field('basicName','普攻名称','text',item.basicName||item.name||'')+field('basicDamage','普攻伤害','number',item.basicDamage||item.punchDamage||0)+field('basicCooldown','普攻冷却/秒','number',item.basicCooldown||item.punchCooldown||1)+field('basicDuration','普攻持续/秒','number',item.basicDuration||item.punchDuration||0)+field('basicEssence','普攻消耗真元','number',item.basicEssence||item.punchEssence||0)+area('basicDesc','普攻描述',item.basicDesc||'')+area('effect','效果',item.effect);
  html+=`<form id="editForm" class="form"><div class="row">${inner}</div><div class="toolbar"><button>保存</button>${id&&canEditItem(item)?`<button type="button" class="danger" id="delBtn">删除</button>`:''}</div><p class="muted">只有少量蛊虫需要设为普攻蛊；被吸收后可在拳法库装备。</p></form>`; openModal(html);
  $('editForm').onsubmit=async e=>{e.preventDefault(); const fd=new FormData(e.target); const data=Object.fromEntries(fd.entries()); ['price','attack','defense','life','speed','spirit','absorbCost','useCost','basicDamage','basicCooldown','basicDuration','basicEssence'].forEach(k=>{if(k in data)data[k]=Number(data[k]||0)}); data.creator=item.creator||accountId; if(!id)data.status=isAdmin()?'approved':'pending'; await setDoc(id?ref(type,id):doc(col(type)),{...item,...data,updatedAt:serverTimestamp()},{merge:true}); closeModal(); toast('已保存');};
  if($('delBtn')) $('delBtn').onclick=async()=>{if(confirm('确定删除？')){await deleteDoc(ref(type,id)); closeModal();}};
};
window.editItem=editItem;

// 乾坤袋加入拳法库入口与已装备拳法提示。
const v84OldRenderBag = renderBag;
renderBag=function(){
  v84OldRenderBag();
  if(!me)return;
  const cur=v84CurrentFist();
  const html=`<h3>拳法库</h3><div class="scroll-panel fist-summary"><p>当前拳法：<b>${safe(cur.name)}</b>｜伤害 ${n(cur.damage)}｜冷却 ${n(cur.cooldown)}秒｜真元 ${n(cur.essence)}</p><button onclick="window.openFistLibrary()">打开拳法库</button></div>`;
  $('content').insertAdjacentHTML('beforeend',html);
};

// 详情页显示普攻参数。
const v84OldDetail = detail;
detail=function(type,id){
  v84OldDetail(type,id);
  if(type==='guworms'){
    const item=getItem(type,id); if(!item)return;
    const mc=$('modalContent'); if(!mc)return;
    const html=`<div class="scroll-panel mini-basic"><h3>普攻信息</h3><p>是否拥有普攻：${safe(item.basicAttack||item.hasBasicAttack||'否')}</p><p>${safe(item.basicName||item.name||'')}｜伤害 ${n(item.basicDamage||item.punchDamage)}｜冷却 ${n(item.basicCooldown||item.punchCooldown)}秒｜持续 ${n(item.basicDuration||item.punchDuration)}秒｜真元 ${n(item.basicEssence||item.punchEssence)}</p></div>`;
    mc.insertAdjacentHTML('beforeend',html);
  }
};
window.detail=detail;

renderRules=function(){ $('content').innerHTML=`<div class="scroll-panel"><h2>V8.4 聚元阵与拳法普攻版</h2><p>闭关洞新增聚元阵：凡俗初阶/中阶/高阶/精良，仙阵初阶/中阶/高阶/精良。聚元阵只影响闭关修为收益。</p><p>右下角新增普攻按钮，默认基础拳法：0.25伤害，1秒一次。</p><p>乾坤袋新增拳法库；少量蛊虫可设置为普攻蛊，被吸收后可作为拳法装备。</p><p>蛊虫编辑新增普攻伤害、普攻冷却、普攻持续、普攻真元消耗。</p></div>`; };
render();

/* ===================== V8.5 炼蛊台 / 蛊仙时代 / 突破修复 ===================== */
try{
  essenceName['六转']='青玉仙元'; essenceName['七转']='红霞仙元'; essenceName['八转']='银晶仙元'; essenceName['九转']='金杏仙元';
  essenceClass['六转']='essence-jade-immortal'; essenceClass['七转']='essence-rosy-immortal'; essenceClass['八转']='essence-crystal-immortal'; essenceClass['九转']='essence-apricot-immortal';
}catch(e){}

if(!navs.find(x=>x[0]==='alchemy')){
  const idx = navs.findIndex(x=>x[0]==='cultivate');
  navs.splice(idx>=0?idx+1:navs.length,0,['alchemy','炼蛊台','以蛊方入炉，消耗蛊材与真元炼制蛊虫']);
  icons.alchemy='炉';
  initNav && initNav();
}

function v85RankBaseGain(p=me){ const r=rankNum(realmRank(p?.realm)); return r===1?10:r===2?15:r===3?20:r===4?25:r===5?30:50; }
function v85HalfHpPatch(){ const attrs=computedAttrs(me); const maxHp=attrs.life||5; return Math.max(1,Math.floor(n(me.hp||maxHp)/2)); }
function v85AttainRank(a){ return attainments.indexOf(a||'无'); }
function v85RequiredAttainForGuRank(rank){
  const r=rankNum(rank); return ['无','无','准大师','大师','准宗师','宗师','准大宗师','大宗师','准无上大宗师','无上大宗师'][r]||'无上大宗师';
}
function v85AttainForPath(path){ if(path===me?.mainPath) return me?.mainAttain||'无'; if(path===me?.subPath) return me?.subAttain||'无'; if(me?.mainPath==='炼道') return me?.mainAttain||'无'; if(me?.subPath==='炼道') return me?.subAttain||'无'; return '无'; }
function v85HasRefinePermission(gu){ if(isAdmin())return true; const need=v85RequiredAttainForGuRank(gu.rank||'一转'); const a=v85AttainForPath(gu.path); return v85AttainRank(a)>=v85AttainRank(need); }
function v85RefineChance(gu){
  const r=rankNum(gu.rank||'一转'); let chance = r>=6 ? 1 : 50;
  const need=v85RequiredAttainForGuRank(gu.rank||'一转'); const a=v85AttainForPath(gu.path);
  const extra=Math.max(0,v85AttainRank(a)-v85AttainRank(need)); chance += extra*10;
  const isRefine = me?.mainPath==='炼道' || me?.subPath==='炼道'; if(isRefine) chance += 10;
  const same = samePath(gu,me) || isRefine; if(!same) chance = Math.floor(chance/2);
  return Math.max(1,Math.min(95,chance));
}
function v85RecipeTarget(recipe){
  if(!recipe)return null;
  const tid=recipe.targetId || recipe.guId || recipe.targetGuId;
  if(tid && getItem('guworms',tid)) return getItem('guworms',tid);
  const target=(recipe.target||recipe.name||'').replace(/蛊方$/,'').trim();
  return state.guworms.find(g=>g.name===target || (target && g.name && target.includes(g.name))) || null;
}
function v85Have(type,id,count=1){ return n(myInv()[type]?.[id]?.count)>=count; }
function v85Consume(inv,type,id,count=1){ inv[type] ||= {}; inv[type][id] ||= {count:0}; inv[type][id].count = n(inv[type][id].count)-count; if(inv[type][id].count<=0) delete inv[type][id]; }
function v85Add(inv,type,id,count=1){ inv[type] ||= {}; inv[type][id] ||= {count:0}; inv[type][id].count = n(inv[type][id].count)+count; }
function v85RecipeNeedHtml(recipe){
  const guIds=recipe?.guIds||[]; const matIds=recipe?.materialIds||[];
  const gu=guIds.map(id=>`<span class="pill ${v85Have('guworms',id)?'':'wait'}">${safe(itemName('guworms',id))} ×1</span>`).join('')||'<span class="muted">无蛊虫材料</span>';
  const mat=matIds.map(id=>`<span class="pill ${v85Have('materials',id)?'':'wait'}">${safe(itemName('materials',id))} ×1</span>`).join('')||'<span class="muted">无蛊材要求</span>';
  return `<p><b>蛊虫材料：</b>${gu}</p><p><b>蛊材：</b>${mat}</p>`;
}
function v85ExplosionFx(){
  const d=document.createElement('div'); d.className='forge-explosion'; d.innerHTML='<b>轰！</b><span>炼蛊炸炉，经脉震荡！</span>'; document.body.appendChild(d); setTimeout(()=>d.remove(),1800);
}
function v85DeathFx(){ const d=document.createElement('div'); d.className='tribulation-screen'; d.innerHTML='<b>天劫降临</b><span>⚡ ⚡ ⚡ ⚡ ⚡ ⚡ ⚡ ⚡ ⚡ ⚡</span>'; document.body.appendChild(d); setTimeout(()=>d.remove(),2200); }

// 闭关收益重做：小闭关按转数给修为；大闭关五倍；聚元阵继续加成。
window.startCultivation=async function(type){
  if(!requireLogin())return; const f=(typeof v84Formation==='function')?v84Formation():{mult:1,name:'无聚元阵'};
  if(typeof actionLocked==='function' && actionLocked())return; if(me.cultivateJob||me.breakthroughJob||me.refineJob)return toast('已有闭关/突破/炼蛊进行中');
  const isBig=type==='big'; const stones=isBig?200:50; const ms=isBig?5*60*1000:60*1000;
  if(n(me.stones)<stones)return toast('元石不足');
  const base=v85RankBaseGain(me)*(isBig?5:1); const gain=Math.ceil(base*(f.mult||1));
  await saveMe({stones:n(me.stones)-stones,cultivateJob:{until:Date.now()+ms,gain,type,formation:f.name||'无聚元阵'}});
  toast(`开始闭关：预计修为+${gain}`); render();
};

// 突破失败修复：不再卡死，失败扣半血、真元归零、退出突破界面。
window.finishBreakthrough=async function(){
  if(!requireLogin())return; const j=me.breakthroughJob; if(!j)return;
  if(n(j.until)>Date.now())return toast('突破尚未完成');
  const fail=async(msg)=>{ await saveMe({hp:v85HalfHpPatch(),essence:0,breakthroughJob:null,weakUntil:Date.now()+10000}); fx(msg||'突破失败：经脉受损'); render(); };
  if(j.failed) return fail('突破失败：真元中断，生命减半');
  const ok=randInt(1,100)<=n(j.chance||70); if(!ok) return fail('突破失败：道基震荡，生命减半');
  const next=j.next, need=n(j.need); const newMax=Math.floor((baseEssence[realmRank(next)]||60)*(aptPct[me.aptitude]||0.45));
  let patch={realm:next,cultivation:Math.max(0,n(me.cultivation)-need),essence:Math.min(newMax,n(me.essence)+Math.ceil(newMax*0.4)),breakthroughJob:null};
  if(realmRank(next)==='六转'){
    v85DeathFx();
    const attrs=computedAttrs(me), maxHp=attrs.life||5, hp=n(me.hp||maxHp)-1000; patch.hp=Math.max(0,hp);
    if(hp<=0){ patch.deadUntil=Date.now()+30000; }
  }
  await saveMe(patch); fx(realmRank(next)==='六转'?`突破六转，天劫落下！`:`突破成功：${next}`); render();
};

// 真元不足时也退出突破，不再卡住。
let v85Burning=false;
async function v85BreakthroughFailWatch(){
  if(v85Burning||!me||!me.breakthroughJob)return; const j=me.breakthroughJob;
  if(j.failed){ v85Burning=true; await saveMe({hp:v85HalfHpPatch(),essence:0,breakthroughJob:null,weakUntil:Date.now()+10000}).catch(()=>{}); v85Burning=false; fx('突破失败：真元中断，生命减半'); render(); }
}
setInterval(v85BreakthroughFailWatch,1200);

function renderAlchemy(){
  if(!requireLogin())return;
  const active=me.refineJob; let activeHtml='';
  if(active){
    const left=Math.max(0,Math.ceil((n(active.until)-Date.now())/1000)); const gu=getItem('guworms',active.targetId)||{};
    activeHtml=`<div class="forge-active"><h2>炼蛊炉燃烧中</h2><div class="forge-fire">🔥</div><p>目标：<b>${safe(gu.name||active.targetName)}</b></p><p>剩余：${left}秒｜已燃真元 ${n(active.burned)}/${n(active.costEssence)}</p><div class="progress"><i style="width:${Math.min(100,(60-left)/60*100)}%"></i></div><button onclick="window.restoreEssence()">使用元石恢复真元</button><button onclick="window.finishRefine()" ${left>0?'disabled':''}>开炉取蛊</button></div>`;
  }
  const recipes=approved(state.recipes).filter(r=>v85RecipeTarget(r));
  $('content').innerHTML=`<div class="scroll-panel"><h2>炼蛊台</h2><p>选择蛊方，投入背包材料，炼制一分钟。炼制真元=目标蛊虫吸收真元×5；失败会消耗蛊材并生命减半。</p>${activeHtml}</div><div class="grid forge-grid">${recipes.map(r=>{const gu=v85RecipeTarget(r); const chance=gu?v85RefineChance(gu):0; const cost=gu?itemAbsorbCost('guworms',gu,me)*5:0; return `<div class="card forge-recipe"><h3>${safe(r.name||r.id)}</h3><span class="pill">目标 ${safe(gu?.name||'未知')}</span><span class="pill">${safe(gu?.rank||'')}</span><p>炼制真元：${cost}｜成功率：${chance}%</p>${v85RecipeNeedHtml(r)}<button ${active?'disabled':''} onclick="window.startRefine('${r.id}')">投入炼炉</button></div>`}).join('')||empty()}</div>`;
}
window.startRefine=async function(recipeId){
  if(!requireLogin())return; if(me.refineJob)return toast('炼炉已经燃起'); if(me.cultivateJob||me.breakthroughJob)return toast('闭关/突破中不能炼蛊');
  const recipe=getItem('recipes',recipeId); const gu=v85RecipeTarget(recipe); if(!recipe||!gu)return toast('蛊方目标不存在');
  if(!v85HasRefinePermission(gu))return toast('炼制此转数蛊虫所需成就不足');
  const guIds=recipe.guIds||[], matIds=recipe.materialIds||[];
  for(const id of guIds){ if(!v85Have('guworms',id))return toast(`缺少蛊虫材料：${itemName('guworms',id)}`); }
  for(const id of matIds){ if(!v85Have('materials',id))return toast(`缺少蛊材：${itemName('materials',id)}`); }
  const inv=myInv(); guIds.forEach(id=>v85Consume(inv,'guworms',id,1)); matIds.forEach(id=>v85Consume(inv,'materials',id,1));
  const cost=itemAbsorbCost('guworms',gu,me)*5; const willExplode=Math.random()<0.10; const explodeAt=willExplode?Date.now()+randInt(8,45)*1000:0;
  await saveMe({inventory:inv,refineJob:{recipeId,targetId:gu.id,targetName:gu.name,startedAt:Date.now(),until:Date.now()+60000,costEssence:cost,burned:0,lastBurnAt:Date.now(),chance:v85RefineChance(gu),explodeAt}});
  toast('炼蛊开始，火候已起'); render();
};
window.finishRefine=async function(){
  if(!requireLogin())return; const j=me.refineJob; if(!j)return; if(Date.now()<n(j.until))return toast('火候未足');
  const gu=getItem('guworms',j.targetId); if(!gu)return toast('目标蛊虫不存在');
  const ok=Math.random()*100<n(j.chance||50); const inv=myInv();
  if(ok){ v85Add(inv,'guworms',j.targetId,1); await saveMe({inventory:inv,refineJob:null}); fx(`炼蛊成功：${gu.name}`); }
  else { v85ExplosionFx(); await saveMe({hp:v85HalfHpPatch(),refineJob:null}); fx('炼蛊失败：炸炉受创'); }
  render();
};
let v85RefineBurning=false;
async function v85RefineTick(){
  if(v85RefineBurning||!me||!me.refineJob)return; const j=me.refineJob, now=Date.now();
  if(n(j.explodeAt)&&now>=n(j.explodeAt)){ v85RefineBurning=true; v85ExplosionFx(); await saveMe({hp:v85HalfHpPatch(),refineJob:null}).catch(()=>{}); v85RefineBurning=false; fx('炼制途中炸炉！'); render(); return; }
  const last=n(j.lastBurnAt)||n(j.startedAt)||now; const elapsed=Math.floor((now-last)/1000); if(elapsed<=0)return;
  const per=Math.max(1,Math.ceil(n(j.costEssence)/60)); const burn=per*elapsed;
  if(n(me.essence)<burn){ v85RefineBurning=true; v85ExplosionFx(); await saveMe({hp:v85HalfHpPatch(),essence:0,refineJob:null}).catch(()=>{}); v85RefineBurning=false; fx('真元不足，炉火反噬！'); render(); return; }
  v85RefineBurning=true; await saveMe({essence:n(me.essence)-burn,refineJob:{...j,burned:n(j.burned)+burn,lastBurnAt:now}}).catch(()=>{}); v85RefineBurning=false;
}
setInterval(v85RefineTick,1000);

window.destroyItem=async function(type,id){
  if(!requireLogin())return;
  if(!confirm(`确定销毁 ${itemName(type,id)} ×1？此操作不可恢复。`))return;
  const inv=JSON.parse(JSON.stringify(myInv()));
  if(!v85Have(type,id))return toast('背包没有该物品');
  v85Consume(inv,type,id,1);
  await saveMe({inventory:inv});
  toast('已销毁');
  render();
};

// 背包增加销毁按钮。
const v85OldRenderBag=renderBag;
renderBag=function(){
  v85OldRenderBag();
  document.querySelectorAll('.bag-item').forEach(card=>{
    const onclick=card.getAttribute('onclick')||''; const m=onclick.match(/detailFromBag\('([^']+)'\s*,\s*'([^']+)'\)/); if(!m)return;
    if(card.querySelector('.destroy-btn'))return;
    const btn=document.createElement('button'); btn.className='danger destroy-btn'; btn.textContent='销毁'; btn.onclick=(ev)=>{ev.stopPropagation(); window.destroyItem(m[1],m[2]);}; card.appendChild(btn);
  });
};

const v85OldRender=render;
render=function(){ const q=($('globalSearch')?.value||'').trim(); if(current==='alchemy') { renderAlchemy(); renderVitals(); return; } return v85OldRender(); };

renderRules=function(){ $('content').innerHTML=`<div class="scroll-panel"><h2>V8.5 蛊仙时代与炼蛊台</h2><p>六转青玉仙元，七转红霞仙元，八转银晶仙元，九转金杏仙元；六转以上真元条增加发光效果。</p><p>突破失败不再卡死：失败后生命减半、真元清空、退出突破界面。五转巅峰突破六转会触发十道天雷，总计1000伤害。</p><p>闭关收益重做：一转10，二转15，三转20，四转25，五转30，六转50；大闭关五倍，并受聚元阵倍率加成。</p><p>炼蛊台：有蛊方即可投入材料炼制一分钟；炼制真元=目标蛊虫吸收真元×5。凡蛊基础成功率50%，仙蛊1%。跨流派减半，炼道额外+10%。失败或炸炉会消耗材料并生命减半。</p><p>乾坤袋新增销毁物品按钮。</p></div>`; };

render();

/* ===================== V8.6 炼蛊/销毁/天劫/历练地图修复 ===================== */
// 1）五维只由已吸收蛊虫叠加；杀招与凡蛊屋不再给人物永久五维。
computedAttrs = function(p=me){
  const base = {attack:5, defense:5, life:5, speed:5, spirit:5};
  const absorbed = p?.absorbed || {guworms:{}, killmoves:{}, guhouses:{}};
  Object.keys(absorbed.guworms||{}).forEach(id=>{
    const attrs = effectAttrs('guworms', getItem('guworms',id), p, false);
    attrKeys.forEach(k=>base[k]+=n(attrs[k]));
  });
  return base;
};

// 2）凡蛊屋只取攻击、防御、速度；杀招仍是单属性。
const v86OldEffectAttrs = effectAttrs;
effectAttrs = function(type,item,p=me,forUse=false){
  const out = {attack:0, defense:0, life:0, speed:0, spirit:0};
  if(!item) return out;
  if(type==='guhouses'){
    const ids=item.guIds||item.requiredIds||[];
    ['attack','defense','speed'].forEach(k=>out[k]=ids.reduce((a,id)=>a+n(getItem('guworms',id)?.[k]),0) || n(item[k]));
    if(forUse && item.path && !samePath(item,p)) ['attack','defense','speed'].forEach(k=>{out[k]=out[k]>0?Math.max(1,Math.ceil(out[k]/2)):0;});
    return out;
  }
  return v86OldEffectAttrs(type,item,p,forUse);
};

// 3）创建杀招：普通玩家只能选择自己背包内、主/副流派的蛊虫；管理员可全库综合流派。
function v86GuPickForKill(selected=[]){
  let ids=[];
  if(isAdmin()) ids=approved(state.guworms).map(x=>x.id);
  else ids=Object.entries(myInv().guworms||{}).filter(([id,v])=>{
    const g=getItem('guworms',id); return n(v.count)>0 && g && (g.path===me?.mainPath || g.path===me?.subPath);
  }).map(([id])=>id);
  const cards=ids.map(id=>{const g=getItem('guworms',id)||{}; return `<label class="pick-card"><input type="checkbox" name="guIds" value="${safe(id)}" ${selected.includes(id)?'checked':''}><span class="pick-name">${safe(g.name||id)}</span><small>${safe(g.rank||'')} · ${safe(g.path||'')} ${!isAdmin()?`×${invCount('guworms',id)}`:''}</small></label>`}).join('') || '<p class="muted">暂无可选蛊虫。玩家只能用背包内主/副流派蛊虫创作杀招。</p>';
  return `<div class="wide"><div class="pick-title">所需蛊虫（勾选多选）</div><div class="pick-grid">${cards}</div></div>`;
}
function v86GuPickAllOwn(selected=[]){ return guMulti(selected,true); }

// 4）重写编辑页，让杀招/凡蛊屋/蛊方更符合规则。
editItem = async function(type,id=null){
  if(!requireLogin())return; const item=id?getItem(type,id):{};
  if(id && !canEditItem(item)) return toast('只能编辑自己创作的，管理员可编辑全部');
  if(!id && !canMakeWorldThing(type)) return toast('三转以上才可创建蛊虫或蛊方');
  if((type==='killmoves'||type==='guhouses') && !id && !canCreateKillOrHouse(type)) return toast(type==='killmoves'?'创建杀招需任意流派大师成就':'创建凡蛊屋需任意流派宗师成就');
  let html=modalHead((id?'编辑':'创作')+typeCN[type]); let inner='';
  if(type==='guworms') inner=field('name','名称','text',item.name)+select('rank','等级',ranks,item.rank)+select('path','流派',paths,item.path)+field('image','图标路径','text',item.image)+field('price','价格','number',item.price)+field('absorbCost','吸收所需真元','number',item.absorbCost)+field('useCost','使用一次真元','number',item.useCost)+field('range','距离','text',item.range)+field('cooldown','冷却时间/秒','text',item.cooldown)+field('duration','持续/定身时间','text',item.duration)+field('attack','攻击','number',item.attack)+field('defense','防御','number',item.defense)+field('life','生命','number',item.life)+field('speed','速度','number',item.speed)+field('spirit','精神','number',item.spirit)+field('basicName','普攻名','text',item.basicName)+field('basicDamage','普攻伤害','number',item.basicDamage)+field('basicCooldown','普攻冷却/秒','number',item.basicCooldown)+field('basicDuration','普攻持续/秒','number',item.basicDuration)+field('basicEssence','普攻真元','number',item.basicEssence)+area('effect','效果',item.effect);
  else if(type==='killmoves') inner=field('name','名称','text',item.name)+select('rank','等级',ranks,item.rank)+select('path','流派',paths,item.path)+select('effectAttr','杀招单独属性',Object.keys(attrCN),item.effectAttr||'attack')+field('image','图标路径','text',item.image)+field('price','价格','number',item.price)+field('range','距离','text',item.range)+field('cooldown','冷却时间/秒','text',item.cooldown)+field('duration','持续时间','text',item.duration)+v86GuPickForKill(item.guIds||[])+area('effect','效果描述',item.effect);
  else if(type==='guhouses') inner=field('name','名称','text',item.name)+select('rank','等级',ranks,item.rank)+select('path','流派',paths,item.path)+field('image','图标路径','text',item.image)+field('price','价格','number',item.price)+field('range','距离','text',item.range)+field('cooldown','冷却时间/秒','text',item.cooldown)+field('duration','持续时间','text',item.duration)+v86GuPickAllOwn(item.guIds||[])+area('effect','效果描述',item.effect);
  else if(type==='recipes') inner=field('name','蛊方名','text',item.name)+field('target','炼制目标','text',item.target)+field('targetId','目标蛊虫ID（可空，系统会按名称匹配）','text',item.targetId)+field('price','价格','number',item.price)+guMulti(item.guIds||[],true)+materialMulti(item.materialIds||[],true)+area('materials','额外材料/炼制步骤文字',item.materials)+area('note','备注',item.note);
  else if(type==='materials') inner=field('name','蛊材名','text',item.name)+field('rank','品级','text',item.rank)+field('image','图片路径','text',item.image)+field('price','价格','number',item.price)+area('effect','说明',item.effect);
  html+=`<form id="editForm" class="form"><div class="row">${inner}</div><div class="toolbar"><button>保存</button>${id&&canEditItem(item)?`<button type="button" class="danger" id="delBtn">删除</button>`:''}</div><p class="muted">普通玩家创作默认进入待审核，管理员审核通过后公开。</p></form>`; openModal(html);
  $('editForm').onsubmit=async e=>{e.preventDefault(); const fd=new FormData(e.target); const data=Object.fromEntries(fd.entries()); if(type==='killmoves'||type==='guhouses'||type==='recipes') data.guIds=[...e.target.querySelectorAll('input[name="guIds"]:checked')].map(o=>o.value); if(type==='recipes') data.materialIds=[...e.target.querySelectorAll('input[name="materialIds"]:checked')].map(o=>o.value); ['price','attack','defense','life','speed','spirit','absorbCost','useCost','basicDamage','basicCooldown','basicDuration','basicEssence'].forEach(k=>{if(k in data)data[k]=Number(data[k]||0)}); data.creator=item.creator||accountId; if(!id)data.status=isAdmin()?'approved':'pending'; else if(!isAdmin()&&item.status==='rejected')data.status='pending'; await setDoc(id?ref(type,id):doc(col(type)),{...item,...data,updatedAt:serverTimestamp()},{merge:true}); closeModal(); toast('已保存');};
  if($('delBtn')) $('delBtn').onclick=async()=>{if(confirm('确定删除？')){await deleteDoc(ref(type,id)); closeModal();}};
};
window.editItem=editItem;

// 5）销毁已吸收蛊虫/杀招/凡蛊屋。销毁蛊虫会自动移除五维加成、装备、本命蛊。
window.destroyAbsorbed=async function(type,id){
  if(!requireLogin())return;
  if(!isAbsorbed(type,id,me))return toast('该蛊物未被吸收');
  if(!confirm(`确定彻底销毁已吸收的 ${itemName(type,id)}？相关效果会消失。`))return;
  const absorbed=JSON.parse(JSON.stringify(me.absorbed||{guworms:{},killmoves:{},guhouses:{}}));
  absorbed[type] ||= {};
  delete absorbed[type][id];
  const equipped=(Array.isArray(me.equipped)?me.equipped:[]).map(e=>e&&e.type===type&&e.id===id?null:e);
  const patch={absorbed,equipped};
  if(type==='guworms'&&me.bornGu===id) patch.bornGu='';
  if(me.fist?.type===type&&me.fist?.id===id) patch.fist=null;
  await saveMe(patch);
  toast('已销毁已吸收蛊物');
  render();
};
const v86OldRenderBag=renderBag;
renderBag=function(){
  v86OldRenderBag();
  document.querySelectorAll('.destroy-btn').forEach(b=>b.remove());
  document.querySelectorAll('.bag-item').forEach(card=>{
    const onclick=card.getAttribute('onclick')||''; const m=onclick.match(/detailFromBag\('([^']+)'\s*,\s*'([^']+)'\)/); if(!m)return;
    const [_,type,id]=m; const btn=document.createElement('button'); btn.className='danger destroy-btn';
    if(isAbsorbed(type,id,me)){ btn.textContent='销毁已吸收'; btn.onclick=(ev)=>{ev.stopPropagation(); window.destroyAbsorbed(type,id);}; }
    else { btn.textContent='销毁'; btn.onclick=(ev)=>{ev.stopPropagation(); window.destroyItem(type,id);}; }
    card.appendChild(btn);
  });
};

// 6）炼蛊：成功弹大字；可无蛊方手动炼制。材料若不符合任何蛊方，炼到一半炸炉。
function v86SelectedList(form,name){return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(x=>x.value);}
function v86RecipeMatchesTarget(recipe,targetId,guIds,matIds){
  const gu=v85RecipeTarget(recipe); if(!gu||gu.id!==targetId)return false;
  const a=[...(recipe.guIds||[])].sort().join('|'), b=[...guIds].sort().join('|');
  const c=[...(recipe.materialIds||[])].sort().join('|'), d=[...matIds].sort().join('|');
  return a===b && c===d;
}
function v86SuccessFx(text){ const d=document.createElement('div'); d.className='refine-success-screen'; d.innerHTML=`<b>炼制成功</b><span>${safe(text||'蛊成！')}</span>`; document.body.appendChild(d); setTimeout(()=>d.remove(),2600); }
function v86ManualMaterialPicker(){
  const guPart=pickGrid('guworms','manualGuIds','投入蛊虫材料（可空）',[],true);
  const matPart=pickGrid('materials','manualMaterialIds','投入蛊材（可空）',[],true);
  return `<form id="manualRefineForm" class="form manual-refine"><div class="row"><label class="wide">目标蛊虫<select name="targetId">${approved(state.guworms).map(g=>`<option value="${safe(g.id)}">${safe(g.name)} · ${safe(g.rank)} · ${safe(g.path||'')}</option>`).join('')}</select></label>${guPart}${matPart}</div><button>无方炼制/自配材料</button><p class="muted">若投入材料不符合该目标蛊虫的任何蛊方，炼制到一半必定炸炉。</p></form>`;
}
const v86OldRenderAlchemy=renderAlchemy;
renderAlchemy=function(){
  if(!requireLogin())return;
  v86OldRenderAlchemy();
  const panel=document.createElement('div'); panel.className='scroll-panel'; panel.innerHTML=`<h2>无方炼制</h2><p>没有蛊方也能开炉，但材料必须暗合某份蛊方，否则半途炸炉。</p>${v86ManualMaterialPicker()}`;
  $('content').prepend(panel);
  const f=$('manualRefineForm'); if(f) f.onsubmit=async(e)=>{e.preventDefault(); const targetId=f.targetId.value; const guIds=v86SelectedList(f,'manualGuIds'); const matIds=v86SelectedList(f,'manualMaterialIds'); await window.startManualRefine(targetId,guIds,matIds);};
};
window.startManualRefine=async function(targetId,guIds=[],matIds=[]){
  if(!requireLogin())return; if(me.refineJob)return toast('炼炉已经燃起'); if(me.cultivateJob||me.breakthroughJob)return toast('闭关/突破中不能炼蛊');
  const gu=getItem('guworms',targetId); if(!gu)return toast('目标蛊虫不存在'); if(!v85HasRefinePermission(gu))return toast('炼制此转数蛊虫所需成就不足');
  for(const id of guIds){ if(!v85Have('guworms',id))return toast(`缺少蛊虫材料：${itemName('guworms',id)}`); }
  for(const id of matIds){ if(!v85Have('materials',id))return toast(`缺少蛊材：${itemName('materials',id)}`); }
  const matched=state.recipes.some(r=>v86RecipeMatchesTarget(r,targetId,guIds,matIds));
  const inv=myInv(); guIds.forEach(id=>v85Consume(inv,'guworms',id,1)); matIds.forEach(id=>v85Consume(inv,'materials',id,1));
  const cost=itemAbsorbCost('guworms',gu,me)*5; const now=Date.now();
  await saveMe({inventory:inv,refineJob:{recipeId:matched?'manualMatched':'manualMismatch',manual:true,targetId:gu.id,targetName:gu.name,startedAt:now,until:now+60000,costEssence:cost,burned:0,lastBurnAt:now,chance:v85RefineChance(gu),explodeAt:matched?0:now+30000}});
  toast(matched?'无方炼制开始：材料暗合蛊方':'无方炼制开始：材料不合，炉火隐隐不稳'); render();
};
const v86OldFinishRefine=window.finishRefine;
window.finishRefine=async function(){
  if(!requireLogin())return; const j=me.refineJob; if(!j)return; if(Date.now()<n(j.until))return toast('火候未足');
  const gu=getItem('guworms',j.targetId); if(!gu)return toast('目标蛊虫不存在');
  const ok=Math.random()*100<n(j.chance||50); const inv=myInv();
  if(ok){ v85Add(inv,'guworms',j.targetId,1); await saveMe({inventory:inv,refineJob:null}); v86SuccessFx(gu.name); fx(`炼蛊成功：${gu.name}`); }
  else { v85ExplosionFx(); await saveMe({hp:v85HalfHpPatch(),refineJob:null}); fx('炼蛊失败：炸炉受创'); }
  render();
};

// 7）管理员可创建历练地图，地图存入 Firestore: adventureMaps。
state.adventureMaps = state.adventureMaps || [];
try{ onSnapshot(col('adventureMaps'),snap=>{state.adventureMaps=snap.docs.map(d=>({id:d.id,...d.data()})); if(current==='adventure') render();}); }catch(e){ console.warn('adventureMaps listen failed',e); }
function v86AllAreas(){ return [...adventureAreas, ...(state.adventureMaps||[])]; }
window.editAdventureMap=function(id=null){
  if(!isAdmin())return toast('只有管理员可编辑历练地');
  const a=id?(state.adventureMaps||[]).find(x=>x.id===id):{};
  openModal(`${modalHead(id?'编辑历练地':'创建历练地')}<form id="advForm" class="form"><div class="row">${field('name','名称','text',a?.name||'')}${select('rank','推荐转数',['一转','二转','三转','四转','五转'],a?.rank||'一转')}${field('stonesMin','元石最小','number',a?.stones?.[0]||10)}${field('stonesMax','元石最大','number',a?.stones?.[1]||30)}${field('guChance','蛊虫概率%','number',a?.guChance||10)}${field('materialsText','产出蛊材（逗号分隔）','text',(a?.materials||[]).join(','))}${area('desc','描述',a?.desc||'')}</div><button>保存地图</button></form>`);
  $('advForm').onsubmit=async e=>{e.preventDefault(); const data=Object.fromEntries(new FormData(e.target).entries()); const patch={name:data.name,rank:data.rank,stones:[n(data.stonesMin),n(data.stonesMax)],guChance:n(data.guChance),materials:String(data.materialsText||'').split(/[,，]/).map(x=>x.trim()).filter(Boolean),desc:data.desc||'',cost:0,time:10,creator:accountId,updatedAt:serverTimestamp()}; if(id) await setDoc(ref('adventureMaps',id),patch,{merge:true}); else await addDoc(col('adventureMaps'),{...patch,createdAt:serverTimestamp()}); closeModal(); toast('历练地已保存');};
};
renderAdventure=function(){
  if(!requireLogin())return; renderDeathScreen(); const areas=v86AllAreas();
  $('content').innerHTML=`<div class="scroll-panel"><h2>历练谷</h2><p>每个试炼地独立冷却1分钟。高转刷低转收益25%；低转强闯高转扣血无收益。</p>${isAdmin()?`<div class="toolbar"><button onclick="window.editAdventureMap()">管理员创建历练地</button></div>`:''}</div><div class="grid adventure-grid">${areas.map((a,i)=>{const dmg=areaDamage(a), rate=adventureRewardRate(a), cd=areaCooldownLeft(a); const custom=!!(state.adventureMaps||[]).find(x=>x.id===a.id); return `<div class="card adventure-card"><h3>${safe(a.name)}</h3><span class="pill">推荐 ${safe(a.rank)}</span><span class="pill">扣血 ${dmg}</span><span class="pill">收益 ${Math.round(rate*100)}%</span><span class="pill">${cd>0?'冷却 '+cd+'秒':'可历练'}</span><p>${safe(a.desc)}</p><p class="muted">奖励：元石 ${a.stones[0]}~${a.stones[1]}｜蛊材×1~3｜蛊虫概率 ${a.guChance}%</p><div class="toolbar"><button ${cd>0||isDead(me)?'disabled':''} onclick="window.startAdventure(${i})">开始历练</button>${isAdmin()&&custom?`<button onclick="window.editAdventureMap('${safe(a.id)}')">编辑</button>`:''}</div></div>`}).join('')}</div>`;
};
window.startAdventure=async function(i){
  if(!requireLogin())return; if(actionLocked())return; const area=v86AllAreas()[i]; if(!area)return;
  const cd=areaCooldownLeft(area); if(cd>0)return toast(`该试炼地冷却中：${cd}秒`);
  const dmg=areaDamage(area), attrs=computedAttrs(me), maxHp=attrs.life||5, hpAfter=n(me.hp||maxHp)-dmg; const rate=adventureRewardRate(area); const patch={hp:Math.max(0,hpAfter),areaCooldowns:{...(me.areaCooldowns||{}),[area.id]:Date.now()+V83.areaCooldown}};
  if(hpAfter<=0){ patch.deadUntil=Date.now()+V82.deathMs; await saveMe(patch); fx('历练失败：身死道消'); renderDeathScreen(); return; }
  if(rate<=0){ await saveMe(patch); fx(`强闯受创：生命-${dmg}，无收益`); return; }
  const stones=Math.floor(randInt(area.stones[0],area.stones[1])*rate), mat=(area.materials||['无名蛊材'])[randInt(0,(area.materials||['x']).length-1)], matCount=Math.max(1,Math.floor(randInt(1,3)*rate)); const inv=myInv(); let mid=state.materials.find(m=>m.name===mat)?.id;
  if(!mid){ const d=await addDoc(col('materials'),staticMaterialObj(mat)); mid=d.id; }
  v85Add(inv,'materials',mid,matCount); let guText=''; if(Math.random()*100<(n(area.guChance)*rate)){ const pool=approved(state.guworms).filter(g=>rankNum(g.rank)<=rankNum(area.rank)); if(pool.length){const g=pool[randInt(0,pool.length-1)]; v85Add(inv,'guworms',g.id,1); guText=`，获得${g.name}×1`;}}
  await saveMe({...patch,stones:n(me.stones)+stones,inventory:inv,cultivation:n(me.cultivation)+Math.ceil(rankNum(area.rank)*5*rate)}); fx(`历练完成：生命-${dmg}，元石+${stones}，${mat}×${matCount}${guText}`);
};

// 8）天劫：使用图片雷电，每2秒一道，十道，每道100伤害。
const tribImgs=['images/effects/tribulation1.png','images/effects/tribulation2.png','images/effects/tribulation3.png'];
function showTribulationStrike(i){ const d=document.createElement('div'); d.className='tribulation-strike'; d.innerHTML=`<img src="${tribImgs[i%tribImgs.length]}"><b>天雷 ${i+1}/10</b>`; document.body.appendChild(d); setTimeout(()=>d.remove(),1200); }
function startTribulationJob(){ return {hits:0,nextAt:Date.now()+2000,total:10,damage:100}; }
window.finishBreakthrough=async function(){
  if(!requireLogin())return; const j=me.breakthroughJob; if(!j)return; if(n(j.until)>Date.now())return toast('突破尚未完成');
  const fail=async(msg)=>{ await saveMe({hp:v85HalfHpPatch(),essence:0,breakthroughJob:null,weakUntil:Date.now()+10000}); fx(msg||'突破失败：经脉受损'); render(); };
  if(j.failed) return fail('突破失败：真元中断，生命减半');
  const ok=randInt(1,100)<=n(j.chance||70); if(!ok) return fail('突破失败：道基震荡，生命减半');
  const next=j.next, need=n(j.need); const newMax=Math.floor((baseEssence[realmRank(next)]||60)*(aptPct[me.aptitude]||0.45));
  const patch={realm:next,cultivation:Math.max(0,n(me.cultivation)-need),essence:Math.min(newMax,n(me.essence)+Math.ceil(newMax*0.4)),breakthroughJob:null};
  if(realmRank(next)==='六转'){ patch.tribulationJob=startTribulationJob(); fx('突破六转，天劫将至！'); }
  else fx(`突破成功：${next}`);
  await saveMe(patch); render();
};
let v86TribRunning=false;
async function tribulationTick(){
  if(v86TribRunning||!me||!me.tribulationJob)return; const t=me.tribulationJob; if(Date.now()<n(t.nextAt))return;
  v86TribRunning=true; const attrs=computedAttrs(me), maxHp=attrs.life||5; const hp=n(me.hp||maxHp)-n(t.damage||100); const hits=n(t.hits)+1; showTribulationStrike(hits-1);
  const patch={hp:Math.max(0,hp)};
  if(hp<=0){patch.deadUntil=Date.now()+30000; patch.tribulationJob=null; fx('渡劫失败：天雷灭身');}
  else if(hits>=n(t.total||10)){patch.tribulationJob=null; fx('十道天雷已过，渡劫完成！');}
  else patch.tribulationJob={...t,hits,nextAt:Date.now()+2000};
  await saveMe(patch).catch(()=>{}); v86TribRunning=false; renderVitals();
}
setInterval(tribulationTick,500);

renderRules=function(){ $('content').innerHTML=`<div class="scroll-panel"><h2>V8.6 炼蛊与渡劫修复版</h2><p>已吸收蛊虫、杀招、凡蛊屋可以销毁；销毁已吸收蛊虫会移除对应五维加成。</p><p>人物五维只由已吸收蛊虫叠加，杀招与凡蛊屋不提供永久五维。</p><p>炼蛊台支持无方炼制；若投入材料不符合任何蛊方，半途必定炸炉。炼制成功会显示“炼制成功”。</p><p>管理员可创建和编辑历练谷地图。</p><p>六转天劫改为每2秒一道雷，共10道，每道100伤害，并使用雷电图片特效。</p></div>`; };
render();

/* ===================== V9.0 福地 / 竞技场 / 恢复属性补丁 ===================== */
// 目标：六转开启福地；增加自动战报竞技场；蛊虫新增“恢复”属性，使用时恢复生命但不超过上限。

// 1) 导航与状态
if(!navs.some(x=>x[0]==='lands')){
  const idx = navs.findIndex(x=>x[0]==='auction');
  navs.splice(idx>=0?idx:navs.length-2,0,["lands","福地阁","六转后开辟福地，经营资源与产出"],["arena","竞技场","自动战斗、挑战玩家、生成战报"]);
  icons.lands="福"; icons.arena="斗";
}
state.lands = state.lands || [];
state.arenaLogs = state.arenaLogs || [];
try{ onSnapshot(col('lands'),snap=>{state.lands=snap.docs.map(d=>({id:d.id,...d.data()})); if(current==='lands') render();}); }catch(e){console.warn('lands listen failed',e)}
try{ onSnapshot(query(col('arenaLogs'),orderBy('createdAt','desc')),snap=>{state.arenaLogs=snap.docs.map(d=>({id:d.id,...d.data()})); if(current==='arena') render();}); }catch(e){console.warn('arenaLogs listen failed',e)}

// 2) 恢复属性：只有蛊虫拥有；使用一次后恢复生命，满血不恢复。
function guRecovery(item){ return Math.max(0,n(item?.recovery ?? item?.heal ?? item?.recover ?? 0)); }
function hpMaxOf(p=me){ return computedAttrs(p).life || 5; }
function hpNowOf(p=me){ return n(p?.hp || hpMaxOf(p)); }
function recoveredHpValue(item,p=me){ const rec=guRecovery(item); if(rec<=0)return 0; return Math.max(0, Math.min(hpMaxOf(p), hpNowOf(p)+rec)-hpNowOf(p)); }
async function v90UseThingCore(type,id,slot=null){
  if(!requireLogin())return; const item=getItem(type,id); if(!item)return toast('蛊物不存在');
  if(['guworms','killmoves','guhouses'].includes(type) && !isAbsorbed(type,id,me)) return toast('未吸收蛊物不能使用');
  const cost=itemUseCost(type,item); if(n(me.essence)<cost)return toast('真元不足');
  const attrs=effectAttrs(type,item,me,true); const rec=(type==='guworms')?recoveredHpValue(item,me):0;
  const patch={essence:n(me.essence)-cost}; if(rec>0) patch.hp=hpNowOf(me)+rec;
  await saveMe(patch);
  const txt=attrKeys.filter(k=>attrs[k]).map(k=>`${attrCN[k]}+${attrs[k]}`).join('，') || '无属性加成';
  fx(`${item.name||id}：${txt}${rec>0?'，生命+'+rec:''}`);
  if(slot!==null) setEquipCooldown(slot,secondsFrom(cooldownText(item)));
  renderVitals();
}
window.useThing=function(type,id){ return v90UseThingCore(type,id,null); };
window.useEquipped=function(slot){
  if(!requireLogin())return; const eq=equipArray(); const e=eq[slot]; if(!e)return toast('此格为空');
  const left=equipCooldownLeft(slot); if(left>0)return toast(`冷却中：${left}秒`);
  return v90UseThingCore(e.type,e.id,slot);
};

// 3) 详情页与编辑页增加恢复字段，避免直接覆盖旧数据结构。
const v90OldDetail = detail;
detail = function(type,id){
  const item=getItem(type,id); if(!item)return;
  const cost=itemAbsorbCost(type,item), use=itemUseCost(type,item), attrs=effectAttrs(type,item,me,false);
  let rows = [['名称',item.name||id],['等级',item.rank||'-'],['流派',item.path||'-'],['价格',n(item.price)+' 元石'],['吸收真元',cost],['使用真元',use]];
  if(type==='guworms') rows.push(['恢复生命',guRecovery(item)]);
  rows.push(['距离',rangeText(item)],['冷却时间',cooldownText(item)],['持续/定身时间',durationText(item)],['攻击',attrs.attack],['防御',attrs.defense],['生命',attrs.life],['速度',attrs.speed],['精神',attrs.spirit],['效果',item.effect||item.note||'-'],['创作者',item.creator||'-'],['状态',item.status||'approved']);
  if(type==='killmoves') rows.splice(4,0,['杀招属性',attrCN[item.effectAttr]||'-']);
  if(type==='killmoves'||type==='guhouses') rows.splice(4,0,['所需蛊虫',(item.guIds||[]).map(x=>itemName('guworms',x)).join('、')||'-']);
  if(type==='recipes') rows.splice(4,0,['所需蛊虫',(item.guIds||[]).map(x=>itemName('guworms',x)).join('、')||'-'],['所需蛊材',(item.materialIds||[]).map(x=>itemName('materials',x)).join('、')||'-']);
  openModal(`${modalHead(typeCN[type]+'卷宗')}<div class="detail-box">${img(item.image)}<table class="detail-table">${rows.map(r=>`<tr><th>${safe(r[0])}</th><td>${safe(r[1])}</td></tr>`).join('')}</table><div class="toolbar"><button onclick="window.buyItem('${type}','${id}')">购买</button>${type!=='recipes'&&type!=='materials'?`<button onclick="window.absorbItem('${type}','${id}')">吸收/炼化</button><button onclick="window.useThing('${type}','${id}')">使用</button><button onclick="window.equipThing('${type}','${id}')">装备</button>`:''}${canEditItem(item)?`<button onclick="window.editItem('${type}','${id}')">编辑</button>`:''}</div></div>`);
};
window.detail=detail;

const v90OldEditItem = editItem;
editItem = async function(type,id=null){
  if(type!=='guworms') return v90OldEditItem(type,id);
  if(!requireLogin())return; const item=id?getItem(type,id):{};
  if(id && !canEditItem(item)) return toast('只能编辑自己创作的，管理员可编辑全部');
  if(!id && !canMakeWorldThing(type)) return toast('三转以上才可创建蛊虫');
  const inner=field('name','名称','text',item.name)+select('rank','等级',ranks,item.rank)+select('path','流派',paths,item.path)+field('image','图标路径','text',item.image)+field('price','价格','number',item.price)+field('absorbCost','吸收所需真元','number',item.absorbCost)+field('useCost','使用一次真元','number',item.useCost)+field('recovery','恢复生命','number',guRecovery(item))+field('range','距离','text',item.range)+field('cooldown','冷却时间/秒','text',item.cooldown)+field('duration','持续/定身时间','text',item.duration)+field('attack','攻击','number',item.attack)+field('defense','防御','number',item.defense)+field('life','生命','number',item.life)+field('speed','速度','number',item.speed)+field('spirit','精神','number',item.spirit)+field('basicName','普攻名','text',item.basicName)+field('basicDamage','普攻伤害','number',item.basicDamage)+field('basicCooldown','普攻冷却/秒','number',item.basicCooldown)+field('basicDuration','普攻持续/秒','number',item.basicDuration)+field('basicEssence','普攻真元','number',item.basicEssence)+area('effect','效果',item.effect);
  openModal(`${modalHead((id?'编辑':'创作')+typeCN[type])}<form id="editForm" class="form"><div class="row">${inner}</div><div class="toolbar"><button>保存</button>${id&&canEditItem(item)?`<button type="button" class="danger" id="delBtn">删除</button>`:''}</div><p class="muted">恢复生命为蛊虫专属属性：每次使用蛊虫时触发，满血不会溢出。</p></form>`);
  $('editForm').onsubmit=async e=>{e.preventDefault(); const data=Object.fromEntries(new FormData(e.target).entries()); ['price','attack','defense','life','speed','spirit','absorbCost','useCost','recovery','basicDamage','basicCooldown','basicDuration','basicEssence'].forEach(k=>{if(k in data)data[k]=Number(data[k]||0)}); data.creator=item.creator||accountId; if(!id)data.status=isAdmin()?'approved':'pending'; await setDoc(id?ref(type,id):doc(col(type)),{...item,...data,updatedAt:serverTimestamp()},{merge:true}); closeModal(); toast('已保存');};
  if($('delBtn')) $('delBtn').onclick=async()=>{if(confirm('确定删除？')){await deleteDoc(ref(type,id)); closeModal(); toast('已删除');}};
};
window.editItem=editItem;

// 4) 福地系统：六转后开辟，定时产出元石/蛊材/修为。
function canOpenLand(){ return isAdmin() || rankNum(realmRank(me?.realm))>=6; }
function ownedLand(){ return (state.lands||[]).find(x=>x.owner===accountId); }
function landRankBonus(p=me){ const r=rankNum(realmRank(p?.realm)); return Math.max(1,r-5); }
function landProduce(l){ const b=landRankBonus(me); return {stones:200*b*n(l.level||1), cultivation:30*b*n(l.level||1), materialCount:Math.max(1,b)}; }
window.createLand=async function(){
  if(!requireLogin())return; if(!canOpenLand())return toast('六转后才可开辟福地'); if(ownedLand())return toast('你已经拥有福地');
  const name=prompt('福地名称','青玉福地'); if(!name)return;
  await addDoc(col('lands'),{name,owner:accountId,path:me.mainPath||'气道',level:1,createdAt:serverTimestamp(),nextClaimAt:Date.now(),note:'初开福地，灵机初生。'});
  toast('福地开辟成功');
};
window.claimLand=async function(id){
  if(!requireLogin())return; const l=(state.lands||[]).find(x=>x.id===id); if(!l||l.owner!==accountId&&!isAdmin())return toast('不可领取');
  if(Date.now()<n(l.nextClaimAt))return toast('福地还在孕育资源');
  const prod=landProduce(l); const inv=myInv(); let matId=state.materials.find(m=>m.name==='福地灵壤')?.id;
  if(!matId){ const d=await addDoc(col('materials'),{name:'福地灵壤',rank:'六转',price:200,effect:'福地产出的基础仙材',status:'approved',creator:'system'}); matId=d.id; }
  v85Add(inv,'materials',matId,prod.materialCount);
  await saveMe({stones:n(me.stones)+prod.stones,cultivation:n(me.cultivation)+prod.cultivation,inventory:inv});
  await setDoc(ref('lands',id),{nextClaimAt:Date.now()+8*60*60*1000,lastClaimAt:Date.now()},{merge:true});
  fx(`福地产出：元石+${prod.stones}，修为+${prod.cultivation}，福地灵壤×${prod.materialCount}`);
};
window.upgradeLand=async function(id){
  if(!requireLogin())return; const l=(state.lands||[]).find(x=>x.id===id); if(!l||l.owner!==accountId&&!isAdmin())return;
  const cost=1000*n(l.level||1); if(n(me.stones)<cost)return toast('元石不足');
  await saveMe({stones:n(me.stones)-cost}); await setDoc(ref('lands',id),{level:n(l.level||1)+1,updatedAt:serverTimestamp()},{merge:true}); toast('福地升级成功');
};
function landCard(l){ const own=l.owner===accountId; const left=Math.max(0,Math.ceil((n(l.nextClaimAt)-Date.now())/1000)); const prod=landProduce(l); return `<div class="card land-card"><h3>${safe(l.name||l.id)}</h3><span class="pill">${safe(l.path||'无流派')}</span><span class="pill">等级 ${n(l.level||1)}</span><p>主人：${safe(l.owner||'未知')}</p><p class="muted">每次产出：元石+${prod.stones}｜修为+${prod.cultivation}｜福地灵壤×${prod.materialCount}</p><p>${left>0?'下次产出：'+left+'秒':'资源可领取'}</p>${own||isAdmin()?`<div class="toolbar"><button ${left>0?'disabled':''} onclick="window.claimLand('${l.id}')">领取产出</button><button onclick="window.upgradeLand('${l.id}')">升级福地</button></div>`:''}</div>`; }
function renderLands(){
  if(!requireLogin())return; const mine=ownedLand();
  $('content').innerHTML=`<div class="scroll-panel"><h2>福地阁</h2><p>六转蛊仙可开辟福地。福地定时产出元石、修为和仙材，是蛊仙阶段的长期产业。</p><div class="toolbar"><button onclick="window.createLand()">开辟福地</button></div>${!canOpenLand()?'<p class="muted">未到六转，只能参观福地。</p>':''}</div><h2 class="section-title">我的福地</h2><div class="grid">${mine?landCard(mine):'<div class="card muted">尚未开辟福地。</div>'}</div><h2 class="section-title">天下福地</h2><div class="grid">${(state.lands||[]).map(landCard).join('')||empty()}</div>`;
}

// 5) 竞技场：自动计算战报，方便玩家开始竞争。
function battlePowerOf(p){ const a=computedAttrs(p); return a.attack*2+a.defense*1.5+a.life+a.speed+a.spirit; }
function simulateBattle(a,b){
  let A={id:a.id,name:a.name||a.id, hp:hpMaxOf(a), attrs:computedAttrs(a)}; let B={id:b.id,name:b.name||b.id, hp:hpMaxOf(b), attrs:computedAttrs(b)}; const logs=[];
  for(let round=1; round<=30 && A.hp>0 && B.hp>0; round++){
    const first=A.attrs.speed>=B.attrs.speed?A:B, second=first===A?B:A;
    const hit=(x,y)=>{ const dmg=Math.max(0.25, +(x.attrs.attack - y.attrs.defense*0.35).toFixed(2)); y.hp=+(y.hp-dmg).toFixed(2); logs.push(`第${round}息：${x.name} 攻击 ${y.name}，造成 ${dmg} 伤害，${y.name}余血 ${Math.max(0,y.hp)}`); };
    hit(first,second); if(second.hp<=0)break; hit(second,first);
  }
  const winner=A.hp===B.hp?(battlePowerOf(a)>=battlePowerOf(b)?a:b):(A.hp>B.hp?a:b); return {winner:winner.id,logs,A,B};
}
window.challengeUser=async function(id){
  if(!requireLogin())return; if(id===accountId)return toast('不能挑战自己'); const target=state.users.find(u=>u.id===id); if(!target)return toast('没有这个玩家');
  const result=simulateBattle(me,target); const win=result.winner===accountId; const reward=win?50:10;
  const myPatch={stones:n(me.stones)+reward}; if(win) myPatch.wins=n(me.wins)+1; await saveMe(myPatch);
  if(win) await setDoc(ref('users',id),{...target,losses:n(target.losses)+1,updatedAt:serverTimestamp()},{merge:true});
  await addDoc(col('arenaLogs'),{from:accountId,to:id,winner:result.winner,logs:result.logs,createdAt:serverTimestamp()});
  openModal(`${modalHead('竞技战报')}<p>${win?'胜利，元石+50':'落败，安慰元石+10'}</p><div class="battle-log">${result.logs.map(x=>`<p>${safe(x)}</p>`).join('')}</div>`);
};
function renderArena(q=''){
  if(!requireLogin())return; const players=filter(state.users.filter(u=>u.id!==accountId),q);
  $('content').innerHTML=`<div class="scroll-panel"><h2>竞技场</h2><p>自动战斗根据生命、攻击、防御、速度、精神生成战报。胜利获得胜场与元石。</p></div><div class="grid">${players.map(p=>`<div class="card"><h3>${safe(p.name||p.id)}</h3><span class="pill">${safe(p.realm||'一转初期')}</span><p>战力：${Math.round(battlePowerOf(p))}</p><button onclick="window.challengeUser('${safe(p.id)}')">挑战</button></div>`).join('')||empty()}</div><h2 class="section-title">最近战报</h2><div class="grid">${(state.arenaLogs||[]).slice(0,8).map(l=>`<div class="card"><h3>${safe(l.from)} VS ${safe(l.to)}</h3><p>胜者：${safe(l.winner)}</p><button onclick='openModal(${JSON.stringify(modalHead('战报')+`<div class="battle-log">${(l.logs||[]).map(x=>`<p>${safe(x)}</p>`).join('')}</div>`)})'>查看</button></div>`).join('')||empty()}</div>`;
}

// 6) 渲染入口与规则
const v90OldRender = render;
render=function(){ const q=($('globalSearch')?.value||'').trim(); if(current==='lands') renderLands(); else if(current==='arena') renderArena(q); else v90OldRender(); renderVitals(); };
renderRules=function(){ $('content').innerHTML=`<div class="scroll-panel"><h2>V9 福地与竞技场</h2><p>六转后可开辟福地，福地定时产出元石、修为与仙材。</p><p>新增竞技场，玩家可挑战其他玩家，系统自动生成战报。</p><p>蛊虫新增恢复属性：使用蛊虫时恢复生命，满血不会溢出。</p><p>拍卖行、炼蛊台、历练谷、闭关洞继续保留。</p></div>`; };
try{ initNav(); render(); }catch(e){ console.warn('V9 render refresh failed',e); }

/* ===================== V9.1 斗蛊台重制版：同意挑战 / 木人 / 野兽 / 玩家实时房间 ===================== */
try{
  const arenaNav = navs.find(x=>x[0]==='arena');
  if(arenaNav){ arenaNav[1]='斗蛊台'; arenaNav[2]='木人试招、野兽挑战、玩家同意挑战'; }
  icons.arena='斗';
}catch(e){console.warn('v91 nav patch failed',e)}

state.arenaChallenges = state.arenaChallenges || [];
state.duelRooms = state.duelRooms || [];
try{ onSnapshot(query(col('arenaChallenges'),orderBy('createdAt','desc')),snap=>{state.arenaChallenges=snap.docs.map(d=>({id:d.id,...d.data()})); if(current==='arena') render();}); }catch(e){console.warn('arenaChallenges listen failed',e)}
try{ onSnapshot(query(col('duelRooms'),orderBy('createdAt','desc')),snap=>{state.duelRooms=snap.docs.map(d=>({id:d.id,...d.data()})); if(current==='arena') render();}); }catch(e){console.warn('duelRooms listen failed',e)}

function v91PairKey(a,b){return [a,b].sort().join('__');}
function v91PlayerName(id){const p=state.users.find(x=>x.id===id); return p?.name || id;}
function v91MaxHp(p){return hpMaxOf ? hpMaxOf(p) : (computedAttrs(p).life || 5);}
function v91DuelRoom(id){return (state.duelRooms||[]).find(x=>x.id===id);}
function v91Challenge(id){return (state.arenaChallenges||[]).find(x=>x.id===id);}
function v91CooldownKey(pair){return `duel_cd_${pair}`;}
async function v91GetPairCooldown(pair){
  try{ const d=await getDoc(ref('duelCooldowns',pair)); return d.exists()?n(d.data().until):n(localStorage.getItem(v91CooldownKey(pair))); }catch(e){return n(localStorage.getItem(v91CooldownKey(pair)));}
}
async function v91SetPairCooldown(pair){
  const until=Date.now()+60*1000;
  localStorage.setItem(v91CooldownKey(pair),String(until));
  try{ await setDoc(ref('duelCooldowns',pair),{pair,until,updatedAt:serverTimestamp()},{merge:true}); }catch(e){}
}
function v91EquipList(){
  const eq=Array.isArray(me?.equipped)?me.equipped.slice(0,10):[]; while(eq.length<10)eq.push(null); return eq;
}
function v91SkillCooldownKey(roomId,slot){return `duel_skill_cd_${accountId}_${roomId}_${slot}`;}
function v91SkillLeft(roomId,slot){return Math.max(0,Math.ceil((n(localStorage.getItem(v91SkillCooldownKey(roomId,slot)))-Date.now())/1000));}
function v91SetSkillCd(roomId,slot,item){const sec=secondsFrom ? secondsFrom(cooldownText(item)) : n(item?.cooldown); if(sec>0)localStorage.setItem(v91SkillCooldownKey(roomId,slot),String(Date.now()+sec*1000));}
function v91DamageFrom(type,item,attacker,defender){
  if(type==='basic') return 0.25;
  const attrs=effectAttrs(type,item,attacker,true);
  const dAttrs=computedAttrs(defender);
  const raw=n(attrs.attack)+n(attrs.spirit)*0.25+n(attrs.speed)*0.1;
  const cut=n(dAttrs.defense)*0.25;
  return Math.max(0.25, Number((raw-cut).toFixed(2)));
}
function v91HealFrom(type,item,attacker){
  if(!item || type==='basic')return 0;
  return Math.max(0,n(item.restore || item.heal || item.recover));
}
function v91RoomCard(r){
  const active=r.status==='active'; const finished=r.status==='finished'; const mine=(r.players||[]).includes(accountId);
  return `<div class="card duel-card"><h3>${safe(v91PlayerName(r.players?.[0]))} VS ${safe(v91PlayerName(r.players?.[1]))}</h3><span class="pill">${active?'进行中':finished?'已结束':'等待'}</span><p>胜者：${safe(r.winner||'未定')}</p>${mine?`<button onclick="window.enterDuelRoom('${r.id}')">进入斗蛊台</button>`:''}</div>`;
}
function v91RequestCard(c){
  const from=c.from, to=c.to; const mineTarget=to===accountId && c.status==='pending'; const mineFrom=from===accountId;
  return `<div class="card"><h3>${safe(v91PlayerName(from))} 挑战 ${safe(v91PlayerName(to))}</h3><span class="pill">${safe(c.status||'pending')}</span><p class="muted">双方同意后才会开启。结束后一分钟内不能再次挑战同一人。</p><div class="toolbar">${mineTarget?`<button onclick="window.acceptDuel('${c.id}')">接受</button><button class="danger" onclick="window.rejectDuel('${c.id}')">拒绝</button>`:''}${mineFrom&&c.status==='pending'?`<button class="danger" onclick="window.cancelDuel('${c.id}')">取消</button>`:''}${c.roomId?`<button onclick="window.enterDuelRoom('${c.roomId}')">进入房间</button>`:''}</div></div>`;
}
window.requestDuel = async function(targetId){
  if(!requireLogin())return; if(targetId===accountId)return toast('不能挑战自己');
  const target=state.users.find(u=>u.id===targetId); if(!target)return toast('没有这个玩家');
  const pair=v91PairKey(accountId,targetId); const until=await v91GetPairCooldown(pair);
  if(Date.now()<until)return toast(`挑战冷却中：${Math.ceil((until-Date.now())/1000)}秒`);
  const existing=(state.arenaChallenges||[]).find(c=>c.pair===pair && ['pending','accepted'].includes(c.status));
  if(existing)return toast('你们之间已有挑战请求或房间');
  await addDoc(col('arenaChallenges'),{from:accountId,to:targetId,pair,status:'pending',createdAt:serverTimestamp(),createdAtMs:Date.now()});
  toast('挑战已发送，等待对方同意');
};
window.cancelDuel=async function(id){const c=v91Challenge(id); if(!c||c.from!==accountId&&!isAdmin())return; await setDoc(ref('arenaChallenges',id),{status:'cancelled',updatedAt:serverTimestamp()},{merge:true}); toast('已取消挑战');};
window.rejectDuel=async function(id){const c=v91Challenge(id); if(!c||c.to!==accountId&&!isAdmin())return; await setDoc(ref('arenaChallenges',id),{status:'rejected',updatedAt:serverTimestamp()},{merge:true}); toast('已拒绝挑战');};
window.acceptDuel=async function(id){
  if(!requireLogin())return; const c=v91Challenge(id); if(!c||c.to!==accountId&&!isAdmin())return toast('你不能接受这个挑战');
  const pair=c.pair||v91PairKey(c.from,c.to); const until=await v91GetPairCooldown(pair);
  if(Date.now()<until)return toast(`挑战冷却中：${Math.ceil((until-Date.now())/1000)}秒`);
  const a=state.users.find(u=>u.id===c.from), b=state.users.find(u=>u.id===c.to); if(!a||!b)return toast('玩家不存在');
  const hp={}; hp[c.from]=v91MaxHp(a); hp[c.to]=v91MaxHp(b);
  const maxHp={}; maxHp[c.from]=hp[c.from]; maxHp[c.to]=hp[c.to];
  await setDoc(ref('duelRooms',id),{players:[c.from,c.to],pair,status:'active',hp,maxHp,logs:[`斗蛊开启：${v91PlayerName(c.from)} 对阵 ${v91PlayerName(c.to)}`],createdAt:serverTimestamp(),updatedAt:serverTimestamp()},{merge:true});
  await setDoc(ref('arenaChallenges',id),{status:'accepted',roomId:id,updatedAt:serverTimestamp()},{merge:true});
  toast('斗蛊已开启');
  window.enterDuelRoom(id);
};
window.enterDuelRoom=function(id){ window.v91CurrentRoom=id; current='arena'; renderArena(); };
window.leaveDuelRoom=function(){ window.v91CurrentRoom=''; renderArena(); };
window.duelBasicAttack=async function(roomId){ await window.duelUse(roomId,'basic','basic',-1); };
window.duelUse=async function(roomId,type,id,slot){
  if(!requireLogin())return; const r=v91DuelRoom(roomId); if(!r||r.status!=='active')return toast('斗蛊房间不可用');
  if(!(r.players||[]).includes(accountId))return toast('你不在此斗蛊中');
  if(n(r.hp?.[accountId])<=0)return toast('你已倒下');
  const enemy=(r.players||[]).find(x=>x!==accountId); const attacker=state.users.find(u=>u.id===accountId)||me; const defender=state.users.find(u=>u.id===enemy);
  let item=null, cost=0, name='基础拳法', cd=1;
  if(type!=='basic'){
    if(slot>=0 && v91SkillLeft(roomId,slot)>0)return toast(`冷却中：${v91SkillLeft(roomId,slot)}秒`);
    item=getItem(type,id); if(!item)return toast('蛊物不存在');
    if(!isAbsorbed(type,id,me))return toast('未吸收蛊物不能在斗蛊中使用');
    cost=itemUseCost(type,item); if(n(me.essence)<cost)return toast('真元不足');
    name=item.name||id;
  }else{
    const left=n(localStorage.getItem(`duel_basic_cd_${accountId}_${roomId}`))-Date.now(); if(left>0)return toast(`普攻冷却：${Math.ceil(left/1000)}秒`);
    localStorage.setItem(`duel_basic_cd_${accountId}_${roomId}`,String(Date.now()+1000));
  }
  if(cost>0) await saveMe({essence:n(me.essence)-cost});
  const dmg=v91DamageFrom(type,item,attacker,defender); const heal=v91HealFrom(type,item,attacker);
  const hp={...(r.hp||{})}; hp[enemy]=Math.max(0, Number((n(hp[enemy])-dmg).toFixed(2)));
  if(heal>0) hp[accountId]=Math.min(n(r.maxHp?.[accountId]||v91MaxHp(attacker)), n(hp[accountId]||r.maxHp?.[accountId])+heal);
  const logs=[...(r.logs||[])]; logs.unshift(`${v91PlayerName(accountId)} 使用【${name}】，造成 ${dmg} 伤害${heal>0?`，恢复 ${heal} 生命`:''}`);
  const patch={hp,logs:logs.slice(0,80),updatedAt:serverTimestamp()};
  if(hp[enemy]<=0){ patch.status='finished'; patch.winner=accountId; patch.finishedAt=serverTimestamp(); await v91SetPairCooldown(r.pair||v91PairKey(accountId,enemy)); await saveMe({wins:n(me.wins)+1,stones:n(me.stones)+50}); }
  await setDoc(ref('duelRooms',roomId),patch,{merge:true});
  if(type!=='basic' && slot>=0) v91SetSkillCd(roomId,slot,item);
  fx(`${name}：-${dmg}${heal>0?`，+${heal}`:''}`);
};
function v91RenderRoom(r){
  const enemy=(r.players||[]).find(x=>x!==accountId); const myHp=n(r.hp?.[accountId]), enemyHp=n(r.hp?.[enemy]); const myMax=n(r.maxHp?.[accountId]||1), enemyMax=n(r.maxHp?.[enemy]||1);
  const eq=v91EquipList();
  const skills=eq.map((e,i)=>{ if(!e)return `<div class="duel-skill empty"><b>${i}</b><span>空</span></div>`; const item=getItem(e.type,e.id); const left=v91SkillLeft(r.id,i); return `<div class="duel-skill"><b>${i}</b>${img(item?.image)}<span>${safe(itemName(e.type,e.id)).slice(0,5)}</span><em>${safe(topAttrText?topAttrText(e.type,item,me,true):'')}</em><button onclick="window.duelUse('${r.id}','${e.type}','${e.id}',${i})">${left>0?left+'秒':'使用'}</button></div>`; }).join('');
  return `<div class="duel-page"><div class="duel-top"><button onclick="window.leaveDuelRoom()">返回斗蛊台</button><span class="pill">${r.status==='active'?'斗蛊中':'已结束'}</span></div><div class="duel-vs"><div class="fighter"><h3>${safe(v91PlayerName(enemy))}</h3><div class="bar"><i style="width:${Math.max(0,Math.min(100,enemyHp/enemyMax*100))}%"></i></div><p>生命 ${enemyHp}/${enemyMax}</p></div><div class="vs-mark">VS</div><div class="fighter self"><h3>${safe(v91PlayerName(accountId))}</h3><div class="bar"><i style="width:${Math.max(0,Math.min(100,myHp/myMax*100))}%"></i></div><p>生命 ${myHp}/${myMax}</p><button onclick="window.duelBasicAttack('${r.id}')">普攻 0.25</button></div></div><h3>装备蛊物</h3><div class="duel-skills">${skills}</div><h3>战斗记录</h3><div class="battle-log duel-log">${(r.logs||[]).map(x=>`<p>${safe(x)}</p>`).join('')}</div></div>`;
}
function v91BeastList(){return [
  {id:'wooden',name:'练功木人',rank:'一转',hp:50,attack:0,defense:0,reward:0,note:'不会还手，用来试招。'},
  {id:'wolf1',name:'青竹野狼',rank:'一转',hp:40,attack:1,defense:0,reward:15,note:'每3秒反击。'},
  {id:'bear2',name:'赤背山熊',rank:'二转',hp:120,attack:4,defense:2,reward:50,note:'适合二转试炼。'},
  {id:'spirit3',name:'幽魂残影',rank:'三转',hp:240,attack:8,defense:3,reward:120,note:'精神类野怪。'}
];}
window.startBeastFight=function(beastId){
  if(!requireLogin())return; const b=v91BeastList().find(x=>x.id===beastId); if(!b)return;
  window.v91Beast={...b,hp:b.hp,maxHp:b.hp,logs:[`遭遇 ${b.name}`],lastHit:Date.now()}; renderArena();
};
window.beastBasic=async function(){ await v91UseOnBeast('basic','basic',-1); };
window.beastUse=async function(type,id,slot){ await v91UseOnBeast(type,id,slot); };
async function v91UseOnBeast(type,id,slot){
  const b=window.v91Beast; if(!b||b.hp<=0)return toast('没有可攻击目标');
  let item=null,cost=0,name='基础拳法';
  if(type!=='basic'){
    if(slot>=0 && v91SkillLeft('beast',slot)>0)return toast(`冷却中：${v91SkillLeft('beast',slot)}秒`);
    item=getItem(type,id); if(!item)return; if(!isAbsorbed(type,id,me))return toast('未吸收蛊物不能使用'); cost=itemUseCost(type,item); if(n(me.essence)<cost)return toast('真元不足'); name=item.name||id;
  }
  if(cost>0) await saveMe({essence:n(me.essence)-cost});
  const attrs=type==='basic'?{attack:0.25}:effectAttrs(type,item,me,true); const dmg= type==='basic'?0.25:Math.max(0.25,n(attrs.attack)+n(attrs.spirit)*0.2+n(attrs.speed)*0.1-b.defense*0.25);
  b.hp=Math.max(0,Number((b.hp-dmg).toFixed(2))); b.logs.unshift(`${me.name||accountId} 使用【${name}】，造成 ${dmg.toFixed(2)} 伤害`);
  if(type!=='basic'&&slot>=0)v91SetSkillCd('beast',slot,item);
  if(b.hp<=0){ b.logs.unshift(`胜利！获得元石 ${b.reward}`); await saveMe({stones:n(me.stones)+n(b.reward),wins:n(me.wins)+1}); }
  fx(`-${dmg.toFixed(2)}`); renderArena();
}
function v91RenderBeast(){
  const b=window.v91Beast; if(!b) return '';
  const eq=v91EquipList(); const skills=eq.map((e,i)=>{ if(!e)return `<div class="duel-skill empty"><b>${i}</b><span>空</span></div>`; const item=getItem(e.type,e.id); const left=v91SkillLeft('beast',i); return `<div class="duel-skill"><b>${i}</b>${img(item?.image)}<span>${safe(itemName(e.type,e.id)).slice(0,5)}</span><button onclick="window.beastUse('${e.type}','${e.id}',${i})">${left>0?left+'秒':'使用'}</button></div>`; }).join('');
  return `<div class="duel-page"><div class="duel-top"><button onclick="window.v91Beast=null;renderArena()">退出野战</button></div><div class="fighter"><h3>${safe(b.name)}</h3><div class="bar"><i style="width:${Math.max(0,Math.min(100,b.hp/b.maxHp*100))}%"></i></div><p>生命 ${b.hp}/${b.maxHp}</p></div><button onclick="window.beastBasic()">普攻 0.25</button><div class="duel-skills">${skills}</div><div class="battle-log duel-log">${(b.logs||[]).map(x=>`<p>${safe(x)}</p>`).join('')}</div></div>`;
}
renderArena=function(q=''){
  if(!requireLogin())return;
  if(window.v91CurrentRoom){ const r=v91DuelRoom(window.v91CurrentRoom); if(r){$('content').innerHTML=v91RenderRoom(r); return;} window.v91CurrentRoom=''; }
  if(window.v91Beast){$('content').innerHTML=v91RenderBeast(); return;}
  const players=filter(state.users.filter(u=>u.id!==accountId),q||($('globalSearch')?.value||''));
  const requests=(state.arenaChallenges||[]).filter(c=>c.from===accountId||c.to===accountId||isAdmin()).slice(0,12);
  const rooms=(state.duelRooms||[]).filter(r=>(r.players||[]).includes(accountId)||isAdmin()).slice(0,8);
  $('content').innerHTML=`<div class="scroll-panel"><h2>斗蛊台</h2><p>挑战玩家必须双方同意。挑战结束后，双方一分钟内不能再次挑战同一人。</p><div class="toolbar"><button onclick="window.startBeastFight('wooden')">木人试招</button></div></div><h2 class="section-title">野兽挑战</h2><div class="grid">${v91BeastList().map(b=>`<div class="card"><h3>${safe(b.name)}</h3><span class="pill">${safe(b.rank)}</span><p>生命 ${b.hp}｜攻击 ${b.attack}｜防御 ${b.defense}</p><p class="muted">${safe(b.note)}</p><button onclick="window.startBeastFight('${b.id}')">挑战</button></div>`).join('')}</div><h2 class="section-title">玩家挑战</h2><div class="grid">${players.map(p=>`<div class="card"><h3>${safe(p.name||p.id)}</h3><span class="pill">${safe(p.realm||'一转初期')}</span><p>战力：${Math.round(battlePowerOf(p))}</p><button onclick="window.requestDuel('${safe(p.id)}')">发起挑战</button></div>`).join('')||empty()}</div><h2 class="section-title">挑战请求</h2><div class="grid">${requests.map(v91RequestCard).join('')||empty()}</div><h2 class="section-title">斗蛊房间</h2><div class="grid">${rooms.map(v91RoomCard).join('')||empty()}</div>`;
};

const v91OldRender = render;
render=function(){ const q=($('globalSearch')?.value||'').trim(); if(current==='arena') renderArena(q); else v91OldRender(); renderVitals(); };
renderRules=function(){ $('content').innerHTML=`<div class="scroll-panel"><h2>V9.1 斗蛊台</h2><p>竞技场改为斗蛊台：木人试招、野兽挑战、玩家挑战。</p><p>玩家挑战必须双方同意，结束后同一双方一分钟内不能再次挑战。</p><p>斗蛊中可使用装备栏蛊物、杀招、凡蛊屋，也可使用基础普攻0.25伤害。</p></div>`; };
try{ initNav(); render(); }catch(e){ console.warn('V9.1 refresh failed',e); }

