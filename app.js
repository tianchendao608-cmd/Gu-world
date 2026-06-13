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

const state = { users: [], players: [], guworms: [], killmoves: [], guhouses: [], recipes: [], materials: [], trades: [], messages: [] };
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
async function saveMe(patch){ if(!accountId) return; await setDoc(ref('users',accountId), {...me,...patch, updatedAt:serverTimestamp()}, {merge:true}); }
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
function subscribeAll(){ if(unsubbed) return; unsubbed=true; ['users','players','guworms','killmoves','guhouses','recipes','materials','trades'].forEach(name=>onSnapshot(col(name),snap=>{state[name]=snap.docs.map(d=>({id:d.id,...d.data()})); if(name==='users') me = state.users.find(u=>u.id===accountId)||null; renderUser(); render();})); onSnapshot(query(col('messages'),orderBy('createdAt','asc')),snap=>{state.messages=snap.docs.map(d=>({id:d.id,...d.data()})); if(current==='chat') render();}); }
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
 $('editForm').onsubmit=async e=>{e.preventDefault(); const fd=new FormData(e.target); const data=Object.fromEntries(fd.entries()); if(type==='killmoves'||type==='guhouses') data.guIds=[...e.target.guIds.selectedOptions].map(o=>o.value); ['price','attack','defense','life','speed','spirit','absorbCost','useCost'].forEach(k=>{if(k in data)data[k]=Number(data[k]||0)}); data.creator= item.creator || accountId; if(!id) data.status=isAdmin()?'approved':'pending'; else if(!isAdmin() && item.status==='rejected') data.status='pending'; await setDoc(id?ref(type,id):doc(col(type)),{...item,...data,updatedAt:serverTimestamp()},{merge:true}); closeModal(); toast('已保存');};
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
boot();


/* ===================== V7.2 快捷战斗/装备/交易/传音/势力补丁 ===================== */
const V72 = { maxEquip:10 };
function v72DurationText(item){return item?.duration || item?.hold || item?.lasting || item?.time || '-'}
function v72CooldownText(item){return item?.cooldown || item?.cd || '-'}
function v72RangeText(item){return item?.range || item?.distance || '-'}
function v72Seconds(v){
  if(v===undefined||v===null||v==='') return 0;
  const s=String(v); const m=s.match(/\d+(\.\d+)?/); return m?Math.max(0,Math.ceil(Number(m[0]))):0;
}
function v72TopAttr(type,item,p=me){
  const attrs=effectAttrs(type,item,p); let best='attack', val=-Infinity;
  attrKeys.forEach(k=>{if(n(attrs[k])>val){best=k;val=n(attrs[k]);}});
  return `${attrCN[best]}+${Math.max(0,val)}`;
}
function v72EquipArray(){
  const eq = Array.isArray(me?.equipped) ? me.equipped.slice(0,10) : [];
  while(eq.length<10) eq.push(null);
  return eq;
}
function v72CooldownKey(slot){return `gu_cd_${accountId}_${slot}`}
function v72CooldownLeft(slot){
  const end=n(localStorage.getItem(v72CooldownKey(slot))); return Math.max(0,Math.ceil((end-Date.now())/1000));
}
function v72SetCooldown(slot,sec){ if(sec>0)localStorage.setItem(v72CooldownKey(slot), String(Date.now()+sec*1000)); }
function v72EquipName(e){return e? itemName(e.type,e.id) : '空';}
function v72CanEquip(type){return ['guworms','killmoves','guhouses'].includes(type)}
window.equipThing = async function(type,id){
  if(!requireLogin())return; if(!v72CanEquip(type))return toast('该物不能装备');
  const absorbed = me.absorbed || {}; const inAbsorbed = !!absorbed[type]?.[id];
  if(!inAbsorbed && !hasInv(type,id)) return toast('背包没有该蛊物');
  const slot = Number(prompt('装备到哪个格子？请输入0-9', '0'));
  if(!Number.isInteger(slot)||slot<0||slot>9) return toast('格子必须是0-9');
  const eq=v72EquipArray(); eq[slot]={type,id};
  await saveMe({equipped:eq}); toast(`已装备到${slot}号位`); render();
}
window.unequipThing = async function(slot){if(!requireLogin())return; const eq=v72EquipArray(); eq[slot]=null; await saveMe({equipped:eq}); render();}
window.useEquipped = async function(slot){
  if(!requireLogin())return; const eq=v72EquipArray(); const e=eq[slot]; if(!e)return toast('此格为空');
  const left=v72CooldownLeft(slot); if(left>0)return toast(`冷却中：${left}秒`);
  const item=getItem(e.type,e.id); if(!item)return toast('蛊物不存在');
  const cost=itemUseCost(e.type,item); if(n(me.essence)<cost)return toast('真元不足');
  await saveMe({essence:n(me.essence)-cost});
  const attrs=effectAttrs(e.type,item,me); const txt=attrKeys.filter(k=>attrs[k]).map(k=>`${attrCN[k]}+${attrs[k]}`).join('，')||'无属性加成';
  fx(`${item.name||e.id}：${txt}`);
  v72SetCooldown(slot,v72Seconds(v72CooldownText(item)));
  renderVitals();
}
window.setRestoreAmount=function(){
  if(!isAdmin())return toast('只有管理员可设置');
  const old=localStorage.getItem('restoreStoneAmount')||'1';
  const val=prompt('每次恢复使用多少元石？',old); if(!val)return;
  localStorage.setItem('restoreStoneAmount', String(Math.max(1,n(val)||1))); renderVitals();
}
window.restoreEssence = async function(amount=null){
  if(!requireLogin())return;
  const use = Math.max(1,n(amount ?? localStorage.getItem('restoreStoneAmount') ?? 1));
  if(n(me.stones)<use)return toast('元石不足');
  const mx=maxEssence(me); const es=Math.min(mx,n(me.essence)+use*10);
  await saveMe({stones:n(me.stones)-use, essence:es});
  toast(`使用${use}元石，恢复${Math.min(use*10, mx-n(me.essence))}真元`);
}

const oldRenderVitals = renderVitals;
renderVitals = function(){
  let box=$('vitalsDock'); if(!box){box=document.createElement('div'); box.id='vitalsDock'; document.body.appendChild(box)}
  if(!me){box.innerHTML=`<button onclick="window.loginModal()">入世登录</button>`;return}
  const attrs=computedAttrs(me), hpMax=attrs.life, hp=n(me.hp||hpMax), esMax=maxEssence(me), es=n(me.essence||esMax), rank=realmRank(me.realm);
  const restoreAmt=Math.max(1,n(localStorage.getItem('restoreStoneAmount')||1));
  const eq=v72EquipArray();
  const eqHtml=eq.map((e,i)=>{const left=v72CooldownLeft(i); const item=e?getItem(e.type,e.id):null; return `<div class="equip-slot ${e?'filled':''}" title="${safe(e?itemName(e.type,e.id):'空')}"><b>${i}</b>${e?img(item?.image):''}<span>${safe(e?itemName(e.type,e.id).slice(0,4):'空')}</span>${e?`<em>${safe(v72TopAttr(e.type,item))}</em><button onclick="window.useEquipped(${i})">${left>0?left+'秒':'使用'}</button>`:''}</div>`}).join('');
  box.innerHTML=`<div class="vital-title">${safe(me.name||accountId)}</div><div class="bar-wrap"><span>生命 ${hp}/${hpMax}</span><div class="bar"><i style="width:${Math.min(100,hp/hpMax*100)}%"></i></div></div><div class="bar-wrap"><span>${essenceName[rank]} ${es}/${esMax}</span><div class="bar essence ${essenceClass[rank]}"><i style="width:${Math.min(100,es/esMax*100)}%"></i></div></div><div class="stone-line">元石 ${n(me.stones)} <button onclick="window.restoreEssence()">恢复×${restoreAmt}</button></div>${isAdmin()?`<button onclick="window.setRestoreAmount()">设置恢复数量</button>`:''}<button onclick="window.goBag()">打开乾坤袋</button><div class="equip-bar">${eqHtml}</div>`;
}

const oldDetail = detail;
detail = function(type,id){
  const item=getItem(type,id); if(!item) return;
  const cost=itemAbsorbCost(type,item), use=itemUseCost(type,item), attrs=effectAttrs(type,item);
  let rows = [['名称',item.name||id],['等级',item.rank||'-'],['流派',item.path||'-'],['价格',n(item.price)+' 元石'],['吸收真元',cost],['使用真元',use],['距离',v72RangeText(item)],['冷却时间',v72CooldownText(item)],['持续/定身时间',v72DurationText(item)],['攻击',attrs.attack],['防御',attrs.defense],['生命',attrs.life],['速度',attrs.speed],['精神',attrs.spirit],['效果',item.effect||item.note||'-'],['创作者',item.creator||'-'],['状态',item.status||'approved']];
  if(type==='killmoves') rows.splice(4,0,['杀招属性',attrCN[item.effectAttr]||'-']);
  if(type==='killmoves'||type==='guhouses') rows.splice(4,0,['所需蛊虫',(item.guIds||[]).map(x=>itemName('guworms',x)).join('、')||'-']);
  openModal(`${modalHead(typeCN[type]+'卷宗')}<div class="detail-box">${img(item.image)}<table class="detail-table">${rows.map(r=>`<tr><th>${safe(r[0])}</th><td>${safe(r[1])}</td></tr>`).join('')}</table><div class="toolbar"><button onclick="window.buyItem('${type}','${id}')">购买</button>${type!=='recipes'&&type!=='materials'?`<button onclick="window.absorbItem('${type}','${id}')">吸收/炼化</button><button onclick="window.useThing('${type}','${id}')">使用</button><button onclick="window.equipThing('${type}','${id}')">装备</button>`:''}${canEditItem(item)?`<button onclick="window.editItem('${type}','${id}')">编辑</button>`:''}</div></div>`);
}
window.detail = detail;

const oldEditItem = editItem;
editItem = async function(type,id=null){
  if(!requireLogin())return; const item=id?getItem(type,id):{}; if(id && !canEditItem(item))return toast('只能编辑自己创作的，管理员可编辑全部');
  if((type==='killmoves'||type==='guhouses') && !id && !canCreateKillOrHouse(type))return toast(type==='killmoves'?'创建杀招需主流派大师成就':'创建凡蛊屋需主流派宗师成就');
  let html=modalHead((id?'编辑':'创作')+typeCN[type]); let inner='';
  if(type==='guworms') inner=field('name','名称','text',item.name)+select('rank','等级',ranks,item.rank)+select('path','流派',paths,item.path)+field('image','图标路径','text',item.image)+field('price','价格','number',item.price)+field('absorbCost','吸收所需真元','number',item.absorbCost)+field('useCost','使用一次真元','number',item.useCost)+field('range','距离','text',item.range)+field('cooldown','冷却时间(秒)','text',item.cooldown)+field('duration','持续/定身时间','text',item.duration)+field('attack','攻击','number',item.attack)+field('defense','防御','number',item.defense)+field('life','生命','number',item.life)+field('speed','速度','number',item.speed)+field('spirit','精神','number',item.spirit)+area('effect','效果',item.effect);
  else if(type==='killmoves') inner=field('name','名称','text',item.name)+select('rank','等级',ranks,item.rank)+select('path','流派',paths,item.path)+select('effectAttr','杀招单独属性',["attack","defense","life","speed","spirit"],item.effectAttr||'attack')+field('image','图标路径','text',item.image)+field('price','价格','number',item.price)+field('range','距离','text',item.range)+field('cooldown','冷却时间(秒)','text',item.cooldown)+field('duration','持续时间','text',item.duration)+guMulti(item.guIds||[],true)+area('effect','效果描述',item.effect);
  else if(type==='guhouses') inner=field('name','名称','text',item.name)+select('rank','等级',ranks,item.rank)+select('path','流派',paths,item.path)+field('image','图标路径','text',item.image)+field('price','价格','number',item.price)+field('range','距离','text',item.range)+field('cooldown','冷却时间(秒)','text',item.cooldown)+field('duration','持续时间','text',item.duration)+guMulti(item.guIds||[],true)+area('effect','效果描述',item.effect);
  else return oldEditItem(type,id);
  html+=`<form id="editForm" class="form"><div class="row">${inner}</div><div class="toolbar"><button>保存</button>${id&&canEditItem(item)?`<button type="button" class="danger" id="delBtn">删除</button>`:''}</div><p class="muted">普通玩家创作默认进入待审核，管理员审核通过后公开。</p></form>`; openModal(html);
  $('editForm').onsubmit=async e=>{e.preventDefault(); const fd=new FormData(e.target); const data=Object.fromEntries(fd.entries()); if(type==='killmoves'||type==='guhouses') data.guIds=[...e.target.guIds.selectedOptions].map(o=>o.value); ['price','attack','defense','life','speed','spirit','absorbCost','useCost'].forEach(k=>{if(k in data)data[k]=Number(data[k]||0)}); data.creator= item.creator || accountId; if(!id) data.status=isAdmin()?'approved':'pending'; else if(!isAdmin() && item.status==='rejected') data.status='pending'; await setDoc(id?ref(type,id):doc(col(type)),{...item,...data,updatedAt:serverTimestamp()},{merge:true}); closeModal(); toast('已保存');};
  if($('delBtn')) $('delBtn').onclick=async()=>{if(confirm('确定删除？')){await deleteDoc(ref(type,id)); closeModal();}};
}
window.editItem=editItem;

function v72InventoryOptions(type){return Object.entries(myInv()[type]||{}).filter(([id,v])=>n(v.count)>0).map(([id,v])=>`<option value="${safe(type+':'+id)}">${safe(typeCN[type]+'：'+itemName(type,id)+' ×'+n(v.count))}</option>`).join('')}
window.tradeDetail=function(id){const t=state.trades.find(x=>x.id===id); if(!t)return; const mine=t.offer?.[accountId]||{stones:0,items:[]}; const opts=['guworms','killmoves','guhouses','recipes','materials'].map(v72InventoryOptions).join(''); openModal(`${modalHead('线上交易台')}<p>交易进行时请勿离开，取消或成功后释放交易台。</p><label>摆上元石<input id="offerStones" type="number" value="${n(mine.stones)}"></label><label>选择背包物品<select id="offerItems" multiple size="10">${opts}</select></label><div class="toolbar"><button id="saveOffer">更新出价</button><button id="confirmTrade">确认交易</button><button id="cancelTrade" class="danger">取消交易</button></div><pre>${safe(JSON.stringify(t.offer,null,2))}</pre>`); $('saveOffer').onclick=async()=>{const items=[...$('offerItems').selectedOptions].map(o=>{const [type,itemId]=o.value.split(':');return {type,itemId,count:1,name:itemName(type,itemId)}}); const offer=t.offer||{}; offer[accountId]={stones:n($('offerStones').value),items}; await setDoc(ref('trades',id),{offer,confirm:{...t.confirm,[accountId]:false}},{merge:true}); closeModal();toast('交易出价已更新');}; $('confirmTrade').onclick=async()=>{const confirm={...t.confirm,[accountId]:true}; await setDoc(ref('trades',id),{confirm},{merge:true}); toast('已确认，等待对方');}; $('cancelTrade').onclick=async()=>{await setDoc(ref('trades',id),{status:'cancelled'},{merge:true}); closeModal();};}

window.createSect=function(){if(!requireLogin())return; if(rankNum(realmRank(me.realm))<3 && !isAdmin())return toast('三转以上才可创建势力'); openModal(`${modalHead('创建势力')}<form id="sectForm" class="form"><label>势力名<input name="name"></label><label>势力宣言<textarea name="note"></textarea></label><button>创建</button></form>`); $('sectForm').onsubmit=async e=>{e.preventDefault(); const data=Object.fromEntries(new FormData(e.target).entries()); await setDoc(ref('sects',data.name),{...data,master:accountId,createdAt:serverTimestamp()},{merge:true}); closeModal();toast('势力已创建');};}
function renderSects(){ $('content').innerHTML=`<div class="toolbar"><button onclick="window.createSect()">创建势力（三转以上）</button></div><div class="grid">${(state.sects||[]).map(s=>`<div class="card"><h3>${safe(s.name||s.id)}</h3><p>宗主：${safe(s.master||'未定')}</p><p>${safe(s.note||'')}</p></div>`).join('')||empty()}</div>`; }

function v72RoomId(kind,target='world'){return kind==='world'?'world':kind+':'+[accountId,target].sort().join('|')}
window.createGroup=function(){if(!requireLogin())return; const name=prompt('群聊名称'); if(!name)return; window.chatChannel='group:'+name; render();}
window.privateChat=function(){if(!requireLogin())return; const to=prompt('输入对方玩家ID'); if(!to)return; window.chatChannel=v72RoomId('private',to); render();}
function renderChat(){ const ch=window.chatChannel||'world'; $('content').innerHTML=`<div class="toolbar"><button onclick="window.chatChannel='world';render()">公共聊天</button><button onclick="window.createGroup()">创建/进入群聊</button><button onclick="window.privateChat()">好友私信</button></div><p class="muted">当前频道：${safe(ch)}</p><div class="chat-box">${state.messages.filter(m=>(m.channel||'world')===ch).map(m=>`<div class="msg"><b>${safe(m.name)}</b>：${safe(m.text)}</div>`).join('')}</div><form class="chat-input" id="chatForm"><input name="text" placeholder="传音入密……"><button>发送</button></form>`; $('chatForm').onsubmit=async e=>{e.preventDefault(); const text=e.target.text.value.trim(); if(!text)return; await addDoc(col('messages'),{name:me?.name||accountId||'无名',text,channel:ch,createdAt:serverTimestamp()}); e.target.reset();}; }

