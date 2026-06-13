
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, setDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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
let myName = localStorage.getItem("guName") || "";
let admin = localStorage.getItem("guAdmin") === "1";
let current = "home";
let channel = "world";

const PATHS = ["气道","血道","力道","雪道","玉道","叶道","木道","金道","土道","雷道","变化道","风道","火道","沙道","魂道","炼道","运道","杀道","水道","云道","天道","奴道","算道","星道","光道","石道","月道","念道"];
const ATTAIN = ["无","准大师","大师","准宗师","宗师","准大宗师","大宗师","准无上大宗师","无上大宗师"];
const REALMS = ["一转初期","一转中期","一转后期","一转巅峰","二转初期","二转中期","二转后期","二转巅峰","三转初期","三转中期","三转后期","三转巅峰","四转初期","四转中期","四转后期","四转巅峰","五转初期","五转中期","五转后期","五转巅峰","六转蛊仙","七转蛊仙","八转蛊仙","九转仙尊"];
const GURANKS = ["一转","二转","三转","四转","五转"];
const APTITUDE = ["十绝体","甲","乙","丙","丁"];
const ABSORB_COST = {"一转":"3-30元石","二转":"15-50元石","三转":"40-100元石","四转":"80-300元石","五转":"180-1000元石"};
const REVIEW_TYPES = ["guworms","killmoves","guhouses","recipes","materials"];
const state = { players: [], sects: [], guworms: [], killmoves: [], guhouses: [], recipes: [], materials: [], trades: [], messages: [] };

const navs = [
  ["home","天机殿","世界总览、公告、最新动态"],
  ["players","人物阁","人员资料、背包、资产、本命蛊"],
  ["guworms","蛊虫阁","库内蛊虫，玩家自创需审核"],
  ["killmoves","杀招阁","杀招创作，玩家提交需审核"],
  ["guhouses","凡蛊屋阁","凡蛊屋创作，玩家提交需审核"],
  ["recipes","蛊方阁","蛊方、材料、成功率储存"],
  ["materials","蛊材阁","蛊材库与蛊材背包交易"],
  ["trades","交易坊","交易只能来自背包蛊材或未吸收蛊虫"],
  ["review","审核阁","管理员审核自创蛊虫、杀招、蛊方、凡蛊屋"],
  ["chat","传音阁","世界频道、势力频道、群聊雏形"],
  ["sects","势力殿","宗门、家族、势力排名"],
  ["rankings","天机榜","战力、财富、境界、胜场排行"],
  ["rules","世界规则","境界、寿蛊、劫难、仙元与道痕"]
];
const icons = {home:"✦",players:"人",guworms:"蛊",killmoves:"杀",guhouses:"屋",recipes:"方",materials:"材",trades:"市",review:"审",chat:"音",sects:"宗",rankings:"榜",rules:"卷"};

function $(id){return document.getElementById(id)}
function toast(t){const box=$('toast'); if(!box) return alert(t); const d=document.createElement('div'); d.className='toast'; d.textContent=t; box.appendChild(d); setTimeout(()=>d.remove(),2600)}
function safe(v){return (v ?? "").toString().replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
function n(v){return Number(v||0)}
function col(name){return collection(db,name)}
function canEditItem(item){return admin || item.ownerUid===uid}
function canSee(item){return admin || item.status !== "待审核" || item.ownerUid === uid}
function currentPlayer(){return state.players.find(p=>p.ownerUid===uid || p.name===myName)}
function pathLabel(item){return item.path || item.mainPath || "未定"}
function listText(v){return (v||"").split(/[,，\n]/).map(x=>x.trim()).filter(Boolean)}
function rankIndex(r){return GURANKS.indexOf(r) + 1 || 1}
function realmIndex(r){return REALMS.indexOf(r) + 1 || 1}

function initNav(){
  $('nav').innerHTML = navs.map(([id,t])=>`<button class="nav-btn ${id===current?'active':''}" data-nav="${id}"><b>${icons[id]}</b>${t}</button>`).join('');
  document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>go(b.dataset.nav));
}
function go(id){current=id; const meta=navs.find(x=>x[0]===id); $('pageTitle').textContent=meta[1]; $('pageDesc').textContent=meta[2]; initNav(); render();}
function openModal(html){$('modalContent').innerHTML=html; $('modal').showModal(); document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$('modal').close());}
function closeModal(){$('modal').close()}
function modalHead(title){return `<div class="modal-head"><h2>${title}</h2><button class="close" data-close>关闭</button></div>`}
function filtered(type){const q=($('globalSearch')?.value||'').trim(); return state[type].filter(canSee).filter(x=>!q || JSON.stringify(x).includes(q));}

async function boot(){
  initNav();
  signInAnonymously(auth).catch(e=>toast('登录失败：'+e.message));
  onAuthStateChanged(auth,u=>{uid=u?.uid; subscribeAll(); renderUser(); render();});
  $('adminBtn').onclick=()=>{ if(admin){admin=false; localStorage.removeItem('guAdmin'); toast('已退出管理员');} else {const p=prompt('输入管理员口令'); if(p===ADMIN_PASS){admin=true;localStorage.setItem('guAdmin','1');toast('管理员已开启')} else toast('口令不对');} renderUser(); render();};
  $('openProfileBtn').onclick=()=>editForm('players', currentPlayer()||null);
  $('globalSearch').oninput=render;
}
function renderUser(){ $('currentUserName').textContent = `${myName||'未命名玩家'} · ${admin?'管理员':'玩家'}`; }
function subscribeAll(){
  if(window.subbed) return; window.subbed=true;
  ["players","sects","guworms","killmoves","guhouses","recipes","materials","trades"].forEach(name=>onSnapshot(col(name),snap=>{state[name]=snap.docs.map(d=>({id:d.id,...d.data()})); render();}));
  onSnapshot(query(col('messages'),orderBy('createdAt','asc')),snap=>{state.messages=snap.docs.map(d=>({id:d.id,...d.data()})); if(current==='chat') render();});
}

function render(){
  if(!$('content')) return;
  const q=($('globalSearch')?.value||'').trim();
  if(current==='home') return renderHome();
  if(["players","guworms","killmoves","guhouses","recipes","materials"].includes(current)) return renderList(current,q);
  if(current==='trades') return renderTrades(q);
  if(current==='review') return renderReview();
  if(current==='chat') return renderChat();
  if(current==='sects') return renderSects(q);
  if(current==='rankings') return renderRankings();
  if(current==='rules') return renderRules();
}

function renderHome(){
  $('content').innerHTML=`<div class="hero"><div class="scroll-panel"><h2>天机殿公告</h2><p>玩家可自创蛊虫、杀招、蛊方、凡蛊屋，但必须等待管理员审核。人物属性以基础属性 + 已吸收蛊虫叠加计算。交易只允许背包蛊材与未吸收蛊虫。</p><div class="stat"><div><b>${state.players.length}</b><br>蛊师</div><div><b>${state.guworms.filter(x=>x.status!=='待审核').length}</b><br>蛊虫</div><div><b>${state.killmoves.filter(x=>x.status!=='待审核').length}</b><br>杀招</div><div><b>${state.materials.length}</b><br>蛊材</div><div><b>${pendingCount()}</b><br>待审核</div></div></div><div class="scroll-panel"><h2>快速创建</h2><div class="toolbar"><button onclick="window.quick('players')">人物</button><button onclick="window.quick('guworms')">蛊虫</button><button onclick="window.quick('killmoves')">杀招</button><button onclick="window.quick('materials')">蛊材</button></div><p class="muted">玩家提交内容默认待审核；管理员通过后进入公开库。</p></div></div>
  <h2 class="section-title">最新通过蛊虫</h2><div class="grid">${state.guworms.filter(x=>x.status!=='待审核').slice(-4).reverse().map(cardGu).join('')||empty()}</div>`;
  bindCards();
}
function pendingCount(){return REVIEW_TYPES.reduce((s,t)=>s+state[t].filter(x=>x.status==='待审核').length,0)}
function empty(){return `<div class="card muted">暂无记录。</div>`}

function renderList(type,q){
  const title={players:'人物',guworms:'蛊虫',killmoves:'杀招',guhouses:'凡蛊屋',recipes:'蛊方',materials:'蛊材'}[type];
  const arr=(type==='players'?state[type]:filtered(type)).filter(x=>!q || JSON.stringify(x).includes(q));
  $('content').innerHTML=`<div class="toolbar"><button onclick="window.quick('${type}')">新增${title}</button>${type==='players'?`<button onclick="window.rollForMe()">资质转盘</button>`:''}</div><div class="grid">${arr.map(itemCard(type)).join('')||empty()}</div>`;
  bindCards();
}
function itemCard(type){return item=> type==='players'?cardPlayer(item):type==='guworms'?cardGu(item):type==='killmoves'?cardKill(item):type==='guhouses'?cardHouse(item):type==='recipes'?cardRecipe(item):cardMat(item)}
function img(path,cls='detail-img'){return path?`<img class="${cls}" src="${safe(path)}" onerror="this.style.display='none'">`:''}
function statusPill(x){return x.status==='待审核'?`<span class="pill warn">待审核</span>`:`<span class="pill ok">已入库</span>`}
function computedStats(p){
  const absorbed=listText(p.absorbedGu);
  const gus=state.guworms.filter(g=>absorbed.includes(g.name));
  const add=gus.reduce((a,g)=>{a.life+=n(g.life);a.power+=n(g.attack);a.speed+=n(g.speed);a.defense+=n(g.defense);a.spirit+=n(g.spirit);return a},{life:0,power:0,speed:0,defense:0,spirit:0});
  return {life:n(p.life)+add.life,power:n(p.power)+add.power,speed:n(p.speed)+add.speed,defense:n(p.defense)+add.defense,spirit:n(p.spirit)+add.spirit,add};
}
function powerScore(p){const s=computedStats(p); return s.life+s.power+s.speed+s.defense+s.spirit+n(p.wins)*2+n(p.stones)/100}
function cardPlayer(p){const s=computedStats(p);return `<div class="card" data-open="players:${p.id}">${img(p.image)}<h3>${safe(p.name||p.id)}</h3><span class="pill">${safe(p.realm||'未定境界')}</span><span class="pill">${safe(p.aptitude||'资质未抽')}</span><p>${safe(p.faction||'散修')} · 主修${safe(p.mainPath||'未定')}</p><p class="muted">战力 ${Math.round(powerScore(p))}｜生命${s.life} 力${s.power} 速${s.speed} 防${s.defense} 精${s.spirit}</p></div>`}
function cardGu(g){return `<div class="card" data-open="guworms:${g.id}">${img(g.image)}<h3>${safe(g.name||g.id)}</h3>${statusPill(g)}<span class="pill">${safe(g.rank||'一转')}</span><span class="pill">${safe(g.path||'未知流派')}</span><p>${safe(g.effect||'无效果描述')}</p><p class="muted">攻${n(g.attack)} 防${n(g.defense)} 距${safe(g.range||'-')} 冷却${safe(g.cooldown||'-')}｜吸收${safe(g.absorbCost||ABSORB_COST[g.rank]||'-')}</p></div>`}
function cardKill(k){return `<div class="card" data-open="killmoves:${k.id}">${img(k.image)}<h3>${safe(k.name||k.id)}</h3>${statusPill(k)}<span class="pill">${safe(k.path||'复合流派')}</span><span class="pill">威力 ${n(k.power)}</span><p>${safe(k.effect||'无效果描述')}</p><p class="muted">所需：${safe(k.requiredGu||'未填')}</p></div>`}
function cardHouse(h){return `<div class="card" data-open="guhouses:${h.id}">${img(h.image)}<h3>${safe(h.name||h.id)}</h3>${statusPill(h)}<span class="pill">${safe(h.rank||'一转')}</span><p>${safe(h.effect||'无效果描述')}</p></div>`}
function cardRecipe(r){return `<div class="card" data-open="recipes:${r.id}"><h3>${safe(r.name||r.id)}</h3>${statusPill(r)}<span class="pill">炼制：${safe(r.target||'未定')}</span><span class="pill">成功率：${safe(r.rate||'-')}</span><p>${safe(r.materials||'材料未填')}</p></div>`}
function cardMat(m){return `<div class="card" data-open="materials:${m.id}">${img(m.image)}<h3>${safe(m.name||m.id)}</h3>${statusPill(m)}<span class="pill">${safe(m.rank||'普通')}</span><span class="pill">${safe(m.path||'通用')}</span><p>${safe(m.effect||'无描述')}</p><p class="muted">价格 ${n(m.price)} 元石</p></div>`}
function bindCards(){document.querySelectorAll('[data-open]').forEach(el=>el.onclick=()=>detail(...el.dataset.open.split(':')))}
window.quick=(type)=>editForm(type,null);

function field(k,label,type='text',v='',extra=''){return `<label>${label}<input name="${k}" type="${type}" value="${safe(v)}" ${extra}></label>`}
function area(k,label,v='',extra=''){return `<label class="wide">${label}<textarea name="${k}" rows="3" ${extra}>${safe(v)}</textarea></label>`}
function select(k,label,opts,v='',extra=''){return `<label>${label}<select name="${k}" ${extra}>${opts.map(o=>`<option ${o==v?'selected':''}>${o}</option>`).join('')}</select></label>`}
function formWrap(title,inner,item,type){return `${modalHead(title)}<form id="editForm" class="form"><div class="row">${inner}</div><div class="toolbar"><button type="submit">保存</button>${item&&canEditItem(item)?`<button type="button" class="danger" id="deleteBtn">删除</button>`:''}</div></form>`}
function disabledIf(cond){return cond?'disabled':''}

function editForm(type,item){
  const i=item||{}; let html=''; const own=i.ownerUid===uid; const lockPlayer=item&&type==='players'&&!admin&&own;
  if(type==='players') html=formWrap('人物卷宗',
    field('name','姓名','text',i.name)+field('age','年龄','number',i.age)+
    select('aptitude','资质',APTITUDE,i.aptitude, disabledIf(lockPlayer && i.aptitude))+select('realm','境界',REALMS,i.realm,disabledIf(!admin))+
    field('faction','势力','text',i.faction)+select('mainPath','主流派',PATHS,i.mainPath)+
    select('mainAttain','主流派成就',ATTAIN,i.mainAttain,disabledIf(!admin))+select('subPath','副流派',PATHS,i.subPath)+
    select('subAttain','副流派成就',ATTAIN,i.subAttain,disabledIf(!admin))+field('life','基础生命','number',i.life,disabledIf(!admin))+field('power','基础力量','number',i.power,disabledIf(!admin))+field('speed','基础速度','number',i.speed,disabledIf(!admin))+field('defense','基础防御','number',i.defense,disabledIf(!admin))+field('spirit','基础精神','number',i.spirit,disabledIf(!admin))+field('stones','元石','number',i.stones,disabledIf(!admin))+field('wins','胜场','number',i.wins,disabledIf(!admin))+field('image','头像路径','text',i.image)+field('vitalGu','本命蛊','text',i.vitalGu)+area('bagMaterials','个人背包：蛊材',i.bagMaterials)+area('unabsorbedGu','个人背包：未吸收蛊虫',i.unabsorbedGu)+area('absorbedGu','已吸收蛊虫（管理员或购买批准后记录）',i.absorbedGu,disabledIf(!admin))+area('kills','拥有杀招',i.kills,disabledIf(!admin))+area('note','备注',i.note),item,type);
  if(type==='guworms') html=formWrap('蛊虫卷宗', field('name','名称','text',i.name)+select('rank','等级',GURANKS,i.rank)+select('path','流派',PATHS,i.path)+field('image','图标路径','text',i.image)+field('attack','攻击','number',i.attack)+field('defense','防御','number',i.defense)+field('life','生命/回血','number',i.life)+field('speed','速度','number',i.speed)+field('spirit','精神','number',i.spirit)+field('range','距离','text',i.range)+field('cooldown','冷却','text',i.cooldown)+field('duration','持续/定身','text',i.duration)+field('price','价格','number',i.price)+field('absorbCost','吸收消耗','text',i.absorbCost||ABSORB_COST[i.rank||'一转'])+field('owner','持有者','text',i.owner)+area('effect','效果',i.effect),item,type);
  if(type==='killmoves') html=formWrap('杀招创作', field('name','杀招名','text',i.name)+select('path','流派',PATHS,i.path)+field('image','图片路径','text',i.image)+field('requiredGu','所需蛊虫','text',i.requiredGu)+field('power','威力','number',i.power)+field('range','距离','text',i.range)+field('cooldown','冷却','text',i.cooldown)+field('cost','消耗','text',i.cost)+field('creator','创作者','text',i.creator||myName)+area('effect','效果',i.effect),item,type);
  if(type==='guhouses') html=formWrap('凡蛊屋创作', field('name','名称','text',i.name)+select('rank','等级',GURANKS,i.rank)+field('image','图片路径','text',i.image)+field('coreGu','核心蛊','text',i.coreGu)+field('components','组成蛊虫','text',i.components)+field('attack','攻击','number',i.attack)+field('defense','防御','number',i.defense)+field('move','移动','number',i.move)+field('owner','所属者/势力','text',i.owner)+area('effect','效果',i.effect),item,type);
  if(type==='recipes') html=formWrap('蛊方储存', field('name','蛊方名','text',i.name)+field('target','炼制目标','text',i.target)+field('rate','成功率','text',i.rate)+field('owner','持有者','text',i.owner)+area('materials','蛊材与材料',i.materials)+area('replace','替代材料',i.replace)+area('note','备注',i.note),item,type);
  if(type==='materials') html=formWrap('蛊材卷宗', field('name','蛊材名','text',i.name)+select('rank','等级',['普通','珍稀','一转','二转','三转','四转','五转'],i.rank)+select('path','对应流派',PATHS,i.path)+field('image','图片路径','text',i.image)+field('price','价格','number',i.price)+field('source','来源','text',i.source)+area('effect','用途/效果',i.effect),item,type);
  if(type==='sects') html=formWrap('势力卷宗', field('name','势力名','text',i.name)+field('master','宗主/族长','text',i.master)+field('level','等级','text',i.level)+field('image','徽记路径','text',i.image)+field('territory','领地','text',i.territory)+field('stones','势力元石','number',i.stones)+area('note','备注',i.note),item,type);
  openModal(html);
  const form=$('editForm');
  form.onsubmit=async e=>{
    e.preventDefault();
    if(item && !canEditItem(item) && type!=='players') return toast('你只能编辑自己创建的条目，或等待管理员处理。');
    if(type==='players' && item && item.ownerUid!==uid && !admin) return toast('你只能编辑自己的资料。');
    const data=Object.fromEntries(new FormData(form).entries());
    Object.keys(data).forEach(k=>{if(['age','life','power','speed','defense','spirit','stones','wins','attack','price','move'].includes(k)) data[k]=Number(data[k]||0)});
    if(type==='players') { data.ownerUid = item?.ownerUid || uid; myName=data.name||myName; localStorage.setItem('guName',myName); }
    else { data.ownerUid = item?.ownerUid || uid; data.creator = data.creator || myName || '无名'; if(!admin && !item) data.status='待审核'; if(admin && !data.status) data.status='已通过'; }
    if(item) await setDoc(doc(db,type,item.id),{...item,...data},{merge:true}); else await addDoc(col(type),{...data,createdAt:serverTimestamp()});
    closeModal(); renderUser(); toast(type==='players'?'已保存':'已提交，若为玩家创建需管理员审核');
  };
  if(item && $('deleteBtn')) $('deleteBtn').onclick=async()=>{ if(!canEditItem(item)) return toast('无权删除'); if(confirm('确定删除？')){await deleteDoc(doc(db,type,item.id)); closeModal();}};
}

function detail(type,id){
  const item=state[type].find(x=>x.id===id); if(!item) return;
  const title=item.name||id;
  const rows=detailRows(type,item).map(([a,b])=>`<tr><th>${a}</th><td>${safe(b)}</td></tr>`).join('');
  const can=canEditItem(item) || type==='players' && (item.ownerUid===uid || item.name===myName);
  const reviewBtns = admin && REVIEW_TYPES.includes(type) && item.status==='待审核' ? `<button id="approveBtn">通过审核</button><button class="danger" id="rejectBtn">驳回/删除</button>` : '';
  openModal(`${modalHead(title)}<div class="detail-layout"><div>${img(item.image,'big-img')}</div><table class="detail-table">${rows}</table></div><div class="toolbar">${can?`<button id="editThis">编辑</button>`:''}${reviewBtns}</div>`);
  if($('editThis')) $('editThis').onclick=()=>editForm(type,item);
  if($('approveBtn')) $('approveBtn').onclick=async()=>{await setDoc(doc(db,type,id),{status:'已通过',approvedAt:serverTimestamp()},{merge:true}); closeModal(); toast('已通过审核');};
  if($('rejectBtn')) $('rejectBtn').onclick=async()=>{if(confirm('确定驳回并删除？')){await deleteDoc(doc(db,type,id)); closeModal();}};
}
function detailRows(type,x){
  if(type==='players'){const s=computedStats(x); return [['姓名',x.name],['年龄',x.age],['资质',x.aptitude],['境界',x.realm],['势力',x.faction],['主流派',x.mainPath],['主流派成就',x.mainAttain],['副流派',x.subPath],['副流派成就',x.subAttain],['生命/力量/速度/防御/精神',`${s.life} / ${s.power} / ${s.speed} / ${s.defense} / ${s.spirit}`],['元石',x.stones],['胜场',x.wins],['本命蛊',x.vitalGu],['蛊材背包',x.bagMaterials],['未吸收蛊虫',x.unabsorbedGu],['已吸收蛊虫',x.absorbedGu],['拥有杀招',x.kills],['备注',x.note]]}
  if(type==='guworms') return [['状态',x.status||'已通过'],['名称',x.name],['等级',x.rank],['流派',x.path],['攻击',x.attack],['防御',x.defense],['生命/回血',x.life],['速度',x.speed],['精神',x.spirit],['距离',x.range],['冷却',x.cooldown],['持续/定身',x.duration],['价格',x.price],['吸收消耗',x.absorbCost||ABSORB_COST[x.rank]],['持有者',x.owner],['效果',x.effect]];
  if(type==='killmoves') return [['状态',x.status||'已通过'],['名称',x.name],['流派',x.path],['所需蛊虫',x.requiredGu],['威力',x.power],['距离',x.range],['冷却',x.cooldown],['消耗',x.cost],['创作者',x.creator],['效果',x.effect]];
  if(type==='guhouses') return [['状态',x.status||'已通过'],['名称',x.name],['等级',x.rank],['核心蛊',x.coreGu],['组成蛊虫',x.components],['攻击',x.attack],['防御',x.defense],['移动',x.move],['所属者/势力',x.owner],['效果',x.effect]];
  if(type==='recipes') return [['状态',x.status||'已通过'],['蛊方名',x.name],['炼制目标',x.target],['成功率',x.rate],['持有者',x.owner],['蛊材与材料',x.materials],['替代材料',x.replace],['备注',x.note]];
  if(type==='materials') return [['状态',x.status||'已通过'],['蛊材名',x.name],['等级',x.rank],['对应流派',x.path],['价格',x.price],['来源',x.source],['用途/效果',x.effect]];
  return Object.entries(x);
}

window.rollForMe=async()=>{
  const p=currentPlayer(); if(!p) return toast('先创建人物资料');
  if(p.aptitude && !admin) return toast('资质已经确定，不能重复抽取');
  const r=Math.random()*100; let apt='丁'; if(r<1) apt='十绝体'; else if(r<11) apt='甲'; else if(r<31) apt='乙'; else if(r<61) apt='丙';
  await setDoc(doc(db,'players',p.id),{aptitude:apt},{merge:true}); toast(`天意已定：${apt}`);
};

function renderReview(){
  if(!admin) return $('content').innerHTML=`<div class="card">此处只有管理员可见。</div>`;
  const items=[]; REVIEW_TYPES.forEach(t=>state[t].filter(x=>x.status==='待审核').forEach(x=>items.push({type:t,...x})));
  $('content').innerHTML=`<h2>待审核：${items.length}</h2><div class="grid">${items.map(x=>`<div class="card" data-open="${x.type}:${x.id}">${img(x.image)}<h3>${safe(x.name)}</h3><span class="pill warn">待审核</span><p>${safe(x.type)} · ${safe(x.path||x.target||'')}</p><p class="muted">创建者：${safe(x.creator||x.ownerUid)}</p></div>`).join('')||empty()}</div>`; bindCards();
}
function renderTrades(q){
  const arr=state.trades.filter(x=>!q||JSON.stringify(x).includes(q));
  $('content').innerHTML=`<div class="toolbar"><button onclick="window.tradeForm()">新增交易申请</button></div><p class="muted">交易范围：个人背包蛊材、未吸收蛊虫。完成交易需双方确认或管理员处理。</p><table class="table"><tr><th>类型</th><th>物品类别</th><th>发起者</th><th>对象</th><th>内容</th><th>状态</th><th>操作</th></tr>${arr.map(t=>`<tr><td>${safe(t.type)}</td><td>${safe(t.goodsType)}</td><td>${safe(t.from)}</td><td>${safe(t.to)}</td><td>${safe(t.content)}</td><td>${safe(t.status||'待确认')}</td><td>${(admin||t.ownerUid===uid)?`<button data-trade="${t.id}">确认完成</button>`:''}</td></tr>`).join('')}</table>`;
  document.querySelectorAll('[data-trade]').forEach(b=>b.onclick=()=>setDoc(doc(db,'trades',b.dataset.trade),{status:'已完成',finishedAt:serverTimestamp()},{merge:true}));
}
window.tradeForm=()=>{openModal(`${modalHead('交易申请')}<form id="tradeForm" class="form"><div class="row">${select('type','类型',['赠与','交换','出售','求购'],'出售')}${select('goodsType','物品类别',['背包蛊材','未吸收蛊虫'],'背包蛊材')}${field('from','发起者','text',myName)}${field('to','对象','text','')}${area('content','交易内容：只能填写自己背包里的蛊材或未吸收蛊虫','')}</div><button>提交交易</button></form>`); $('tradeForm').onsubmit=async e=>{e.preventDefault(); await addDoc(col('trades'),{...Object.fromEntries(new FormData(e.target).entries()),ownerUid:uid,status:'待确认',createdAt:serverTimestamp()}); closeModal(); toast('已提交交易申请');}}

function renderChat(){ $('content').innerHTML=`<div class="toolbar"><button onclick="window.setChannel('world')">世界频道</button><button onclick="window.setChannel('sect')">势力频道</button><button onclick="window.setChannel('group')">群聊</button></div><div class="chat-box" id="chatBox">${state.messages.filter(m=>(m.channel||'world')===channel).map(m=>`<div class="msg"><b>${safe(m.name||'无名')}</b>：${safe(m.text)}</div>`).join('')}</div><form class="chat-input" id="chatForm"><input name="text" placeholder="传音入密……"><button>发送</button></form>`; $('chatForm').onsubmit=async e=>{e.preventDefault(); const text=e.target.text.value.trim(); if(!text) return; await addDoc(col('messages'),{name:myName||'无名蛊师',text,channel,createdAt:serverTimestamp(),uid}); e.target.reset();}; setTimeout(()=>{const b=$('chatBox'); if(b) b.scrollTop=b.scrollHeight},50); }
window.setChannel=c=>{channel=c; renderChat();}
function renderSects(q){ const arr=state.sects.filter(x=>!q||JSON.stringify(x).includes(q)).map(s=>({...s,members:state.players.filter(p=>p.faction===s.name).length,totalPower:state.players.filter(p=>p.faction===s.name).reduce((a,p)=>a+powerScore(p),0)})).sort((a,b)=>b.totalPower-a.totalPower); $('content').innerHTML=`<div class="toolbar"><button onclick="window.quick('sects')">新增势力</button></div><div class="grid">${arr.map(s=>`<div class="card" data-open="sects:${s.id}">${img(s.image)}<h3>${safe(s.name)}</h3><span class="pill">${safe(s.level||'未定')}</span><span class="pill">成员 ${s.members}</span><p>宗主：${safe(s.master||'未定')}</p><p class="muted">总战力 ${Math.round(s.totalPower)}｜元石 ${n(s.stones)}</p></div>`).join('')||empty()}</div>`; bindCards();}
function renderRankings(){ const p=[...state.players]; const rows=(arr,fn)=>arr.slice(0,20).map((x,i)=>`<tr><td>${i+1}</td><td>${safe(x.name)}</td><td>${fn(x)}</td><td>${safe(x.faction||'散修')}</td></tr>`).join(''); $('content').innerHTML=`<h2>战力榜</h2><table class="table"><tr><th>名次</th><th>姓名</th><th>战力</th><th>势力</th></tr>${rows(p.sort((a,b)=>powerScore(b)-powerScore(a)),x=>Math.round(powerScore(x)))}</table><h2>财富榜</h2><table class="table"><tr><th>名次</th><th>姓名</th><th>元石</th><th>势力</th></tr>${rows(p.sort((a,b)=>n(b.stones)-n(a.stones)),x=>n(x.stones))}</table><h2>胜场榜</h2><table class="table"><tr><th>名次</th><th>姓名</th><th>胜场</th><th>势力</th></tr>${rows(p.sort((a,b)=>n(b.wins)-n(a.wins)),x=>n(x.wins))}</table>`;}
function renderRules(){ $('content').innerHTML=`<div class="scroll-panel"><h2>凡人境界</h2><p>一转至五转，每转分初期、中期、后期、巅峰；每十场胜利提升一个小境界。元石与胜场由战斗胜利获得，普通玩家不能随意填写。</p><h2>资质转盘</h2><p>十绝体1%，甲10%，乙20%，丙30%，丁39%。</p><h2>流派选项</h2><p>${PATHS.join('、')}</p><h2>吸收蛊虫消耗</h2><p>一转：3-30元石；二转：15-50；三转：40-100；四转：80-300；五转：180-1000。吸收后进入个人“已吸收蛊虫”，属性自动叠加。</p><h2>创造与审核</h2><p>玩家可以自创蛊虫、杀招、蛊方、凡蛊屋、蛊材，但默认待审核。管理员通过后才进入公开库。</p><h2>交易限制</h2><p>交易只能来自个人背包的蛊材，或未吸收蛊虫。</p><h2>蛊仙与劫难</h2><p>六转青提仙元；一年地劫，十年天劫。七转红荔仙元；百年亿劫。八转白梨仙元；千年浩劫。九转黄杏仙元。</p></div>`;}

boot();
