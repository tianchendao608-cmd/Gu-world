import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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
let channel = "world";
let admin = localStorage.getItem("guAdmin") === "1";
let accountName = localStorage.getItem("guAccountName") || "";
let accountPass = localStorage.getItem("guAccountPass") || "";
let meAccount = null;

const PATHS = ["气道","血道","力道","雪道","玉道","叶道","木道","金道","土道","雷道","变化道","风道","火道","沙道","魂道","炼道","运道","杀道","水道","云道","天道","奴道","算道","星道","光道","石道","月道","念道"];
const ATTAIN = ["无","准大师","大师","准宗师","宗师","准大宗师","大宗师","准无上大宗师","无上大宗师"];
const REALMS = ["一转初期","一转中期","一转后期","一转巅峰","二转初期","二转中期","二转后期","二转巅峰","三转初期","三转中期","三转后期","三转巅峰","四转初期","四转中期","四转后期","四转巅峰","五转初期","五转中期","五转后期","五转巅峰","六转蛊仙","七转蛊仙","八转蛊仙","九转仙尊"];
const GURANKS = ["一转","二转","三转","四转","五转"];
const APTITUDE = ["十绝体","甲","乙","丙","丁"];
const REVIEW_TYPES = ["guworms","killmoves","guhouses","recipes","materials"];
const SHOP_TYPES = ["guworms","killmoves","guhouses","recipes","materials"];
const TYPE_NAME = { players:"人物", guworms:"蛊虫", killmoves:"杀招", guhouses:"凡蛊屋", recipes:"蛊方", materials:"蛊材", sects:"势力" };
const BAG_TYPE_NAME = { guworms:"蛊虫", killmoves:"杀招", guhouses:"凡蛊屋", recipes:"蛊方", materials:"蛊材" };
const ABSORB_MIN = {"一转":10,"二转":15,"三转":40,"四转":80,"五转":180};
const ABSORB_MAX = {"一转":30,"二转":50,"三转":100,"四转":300,"五转":1000};
const PRIMEVAL_MAX = {
  "一转初期":30,"一转中期":40,"一转后期":50,"一转巅峰":60,
  "二转初期":80,"二转中期":100,"二转后期":120,"二转巅峰":140,
  "三转初期":180,"三转中期":220,"三转后期":260,"三转巅峰":300,
  "四转初期":380,"四转中期":460,"四转后期":540,"四转巅峰":620,
  "五转初期":800,"五转中期":1000,"五转后期":1200,"五转巅峰":1500
};

const state = {
  accounts: [], players: [], sects: [], guworms: [], killmoves: [], guhouses: [], recipes: [], materials: [], trades: [], messages: []
};

const navs = [
  ["home","天机殿","世界总览、公告、最新动态"],
  ["players","人物阁","人物资料、背包、资产、本命蛊"],
  ["guworms","蛊虫阁","购买蛊虫，玩家自创需审核"],
  ["killmoves","杀招阁","购买杀招，玩家自创需审核"],
  ["guhouses","凡蛊屋阁","购买凡蛊屋，玩家自创需审核"],
  ["recipes","蛊方阁","购买蛊方与炼制记录"],
  ["materials","蛊材阁","购买蛊材，用于炼蛊与交易"],
  ["trades","交易坊","双方摆放背包物品，确认后交换"],
  ["review","审核阁","管理员审核玩家自创内容"],
  ["chat","传音阁","世界频道、势力频道、群聊雏形"],
  ["sects","势力殿","宗门、家族、势力排名"],
  ["rankings","天机榜","战力、财富、境界、胜场排行"],
  ["rules","世界规则","境界、寿蛊、劫难、仙元与道痕"]
];
const icons = {home:"✦",players:"人",guworms:"蛊",killmoves:"杀",guhouses:"屋",recipes:"方",materials:"材",trades:"市",review:"审",chat:"音",sects:"宗",rankings:"榜",rules:"卷"};

function $(id){return document.getElementById(id)}
function safe(v){return (v ?? "").toString().replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
function n(v){return Number(v||0)}
function col(name){return collection(db,name)}
function toast(t){const box=$("toast"); if(!box) return alert(t); const d=document.createElement("div"); d.className="toast"; d.textContent=t; box.appendChild(d); setTimeout(()=>d.remove(),2800)}
function openModal(html){$("modalContent").innerHTML=html; $("modal").showModal(); document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$("modal").close())}
function closeModal(){try{$("modal").close()}catch(e){}}
function modalHead(title){return `<div class="modal-head"><h2>${safe(title)}</h2><button class="close" data-close>关闭</button></div>`}
function listText(v){return (v||"").split(/[,，\n]/).map(x=>x.trim()).filter(Boolean)}
function q(){return ($("globalSearch")?.value||"").trim()}
function image(path,cls="detail-img"){return path?`<img class="${cls}" src="${safe(path)}" onerror="this.style.display='none'">`:""}
function newBagId(){return "bag_"+Date.now()+"_"+Math.random().toString(36).slice(2,8)}
function sanitizeAccountName(s){return (s||"").trim().replace(/[\\/#?\[\]]/g,"_")}
function currentPlayer(){return state.players.find(p=>p.accountName===accountName) || null}
function myBag(){return Array.isArray(currentPlayer()?.bag)?currentPlayer().bag:[]}
function essenceMax(p=currentPlayer()){return PRIMEVAL_MAX[p?.realm] || (p?.realm?.includes("六转")?3000:1500)}
function essenceNow(p=currentPlayer()){return Math.min(n(p?.essence), essenceMax(p))}
function isLogged(){return !!accountName && !!meAccount}
function isAdmin(){return admin || meAccount?.role === "admin"}
function canSee(x){return isAdmin() || x.status !== "待审核" || x.ownerName===accountName}
function canEditItem(x){return isAdmin() || x.ownerName===accountName}
function approved(arr){return arr.filter(x=>x.status!=="待审核")}
function byId(type,id){return state[type].find(x=>x.id===id)}
function statusPill(x){return x.status==="待审核"?`<span class="pill warn">待审核</span>`:`<span class="pill ok">已入库</span>`}

function initChrome(){
  if(!$("backpackPanel")){
    document.body.insertAdjacentHTML("beforeend", `<aside id="backpackPanel" class="backpack-panel"></aside>`);
  }
}
function initNav(){
  $("nav").innerHTML = navs.map(([id,t])=>`<button class="nav-btn ${id===current?'active':''}" data-nav="${id}"><b>${icons[id]}</b>${t}</button>`).join("");
  document.querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>go(b.dataset.nav));
}
function go(id){current=id; const meta=navs.find(x=>x[0]===id); $("pageTitle").textContent=meta[1]; $("pageDesc").textContent=meta[2]; initNav(); render()}
function renderUser(){
  const p=currentPlayer();
  $("currentUserName").textContent = isLogged()?`${accountName} · ${isAdmin()?"管理员":"玩家"}`:"未登录";
  const btn=$("openProfileBtn"); if(btn) btn.textContent = isLogged()?"我的人物资料":"登录/创建ID";
  renderBackpack();
}

async function boot(){
  initChrome(); initNav();
  signInAnonymously(auth).catch(e=>toast("Firebase匿名入口失败："+e.message));
  onAuthStateChanged(auth,u=>{uid=u?.uid; subscribeAll(); tryAutoLogin(); renderUser(); render();});
  $("adminBtn").onclick=()=>{
    if(admin){admin=false; localStorage.removeItem("guAdmin"); toast("已退出管理员"); renderUser(); render(); return;}
    const p=prompt("输入管理员口令");
    if(p===ADMIN_PASS){admin=true; localStorage.setItem("guAdmin","1"); if(meAccount) setDoc(doc(db,"accounts",accountName),{role:"admin"},{merge:true}); toast("管理员已开启");}
    else toast("口令不对");
    renderUser(); render();
  };
  $("openProfileBtn").onclick=()=> isLogged()?editForm("players", currentPlayer()):loginModal();
  $("globalSearch").oninput=render;
}
function subscribeAll(){
  if(window.subbed) return; window.subbed=true;
  ["accounts","players","sects","guworms","killmoves","guhouses","recipes","materials","trades"].forEach(name=>onSnapshot(col(name),snap=>{state[name]=snap.docs.map(d=>({id:d.id,...d.data()})); if(name==="accounts") refreshMeAccount(); renderUser(); render();}));
  onSnapshot(query(col("messages"),orderBy("createdAt","asc")),snap=>{state.messages=snap.docs.map(d=>({id:d.id,...d.data()})); if(current==="chat") render();});
}
async function tryAutoLogin(){
  if(!accountName || !accountPass || meAccount) return;
  const ref=doc(db,"accounts",accountName);
  const s=await getDoc(ref);
  if(s.exists() && s.data().password===accountPass){meAccount={id:accountName,...s.data()}; renderUser(); render();}
}
function refreshMeAccount(){meAccount=state.accounts.find(a=>a.id===accountName) || meAccount}

function loginModal(){
  openModal(`${modalHead("入世令 · 玩家ID登录")}<div class="login-box"><p class="muted">用“玩家ID + 口令”登录。换手机、换浏览器后，只要记住这两个，就能找回身份。</p><form id="loginForm" class="form"><label>玩家ID<input name="name" placeholder="例如：陈卡卡" required></label><label>口令<input name="pass" type="password" placeholder="自己记住，不要告诉别人" required></label><div class="toolbar"><button name="act" value="login">进入世界</button><button name="act" value="create" type="submit">创建身份</button></div></form><p class="danger-text">提醒：这是你们内部玩的简易口令，不要使用真实常用密码。</p></div>`);
  $("loginForm").onsubmit=async e=>{
    e.preventDefault();
    const fd=new FormData(e.submitter.form);
    const name=sanitizeAccountName(fd.get("name")); const pass=(fd.get("pass")||"").trim(); const act=e.submitter.value;
    if(!name || !pass) return toast("玩家ID和口令都要填");
    const ref=doc(db,"accounts",name); const snap=await getDoc(ref);
    if(act==="create"){
      if(snap.exists()) return toast("这个玩家ID已经存在");
      await setDoc(ref,{name,password:pass,role:admin?"admin":"player",createdAt:serverTimestamp()});
      await addDoc(col("players"),{accountName:name,name,age:0,aptitude:"",realm:"一转初期",faction:"散修",mainPath:"气道",subPath:"",mainAttain:"无",subAttain:"无",life:0,power:0,speed:0,defense:0,spirit:0,stones:100,wins:0,bag:[],essence:30,createdAt:serverTimestamp()});
      accountName=name; accountPass=pass; meAccount={id:name,name,password:pass,role:admin?"admin":"player"}; localStorage.setItem("guAccountName",name); localStorage.setItem("guAccountPass",pass); closeModal(); toast("身份已创建"); renderUser(); render();
    } else {
      if(!snap.exists()) return toast("没有这个玩家ID");
      if(snap.data().password!==pass) return toast("口令不对");
      accountName=name; accountPass=pass; meAccount={id:name,...snap.data()}; localStorage.setItem("guAccountName",name); localStorage.setItem("guAccountPass",pass); closeModal(); toast("已进入世界"); renderUser(); render();
    }
  };
}
function logout(){accountName=""; accountPass=""; meAccount=null; localStorage.removeItem("guAccountName"); localStorage.removeItem("guAccountPass"); renderUser(); render(); loginModal();}
window.logout=logout;

function render(){
  if(!$("content")) return;
  if(!isLogged()){
    $("content").innerHTML=`<div class="scroll-panel"><h2>尚未入世</h2><p>请先创建或登录玩家ID。这样下次换设备也能找回身份。</p><button onclick="window.loginModal()">登录/创建ID</button></div>`;
    renderBackpack(); return;
  }
  if(current==="home") return renderHome();
  if(["players","guworms","killmoves","guhouses","recipes","materials"].includes(current)) return renderList(current);
  if(current==="trades") return renderTrades();
  if(current==="review") return renderReview();
  if(current==="chat") return renderChat();
  if(current==="sects") return renderSects();
  if(current==="rankings") return renderRankings();
  if(current==="rules") return renderRules();
}
window.loginModal=loginModal;

function renderHome(){
  const p=currentPlayer();
  $("content").innerHTML=`<div class="hero"><div class="scroll-panel"><h2>天机殿公告</h2><p>蛊虫、蛊方、蛊材、杀招、凡蛊屋均可用元石购买。购买后进入右侧背包。交易时双方从背包摆放物品，双方确认后交换。</p><div class="stat"><div><b>${state.players.length}</b><br>蛊师</div><div><b>${approved(state.guworms).length}</b><br>蛊虫</div><div><b>${approved(state.killmoves).length}</b><br>杀招</div><div><b>${approved(state.materials).length}</b><br>蛊材</div><div><b>${pendingCount()}</b><br>待审核</div></div></div><div class="scroll-panel"><h2>当前身份</h2><p>${safe(accountName)} · ${isAdmin()?"管理员":"玩家"}</p><p>元石：${n(p?.stones)}</p><div class="toolbar"><button onclick="window.quick('guworms')">自创蛊虫</button><button onclick="window.quick('materials')">自创蛊材</button><button onclick="window.loginModal()">切换身份</button></div></div></div><h2 class="section-title">最新入库蛊虫</h2><div class="grid">${approved(state.guworms).slice(-4).reverse().map(cardGu).join("")||empty()}</div>`;
  bindCards(); renderBackpack();
}
function pendingCount(){return REVIEW_TYPES.reduce((s,t)=>s+state[t].filter(x=>x.status==="待审核").length,0)}
function empty(){return `<div class="card muted">暂无记录。</div>`}
function filtered(type){const query=q(); return state[type].filter(x=>type==="players"||canSee(x)).filter(x=>!query || JSON.stringify(x).includes(query))}
function renderList(type){
  const title=TYPE_NAME[type]||type;
  const arr=filtered(type);
  const shopHint = SHOP_TYPES.includes(type)?`<p class="muted">点击条目可查看详情，并用元石购买。玩家新建内容会进入审核阁，管理员通过后公开。</p>`:"";
  $("content").innerHTML=`<div class="toolbar"><button onclick="window.quick('${type}')">新增${title}</button>${type==="players"?`<button onclick="window.rollForMe()">资质转盘</button>`:""}</div>${shopHint}<div class="grid">${arr.map(itemCard(type)).join("")||empty()}</div>`;
  bindCards(); renderBackpack();
}
function itemCard(type){return item=> type==="players"?cardPlayer(item):type==="guworms"?cardGu(item):type==="killmoves"?cardKill(item):type==="guhouses"?cardHouse(item):type==="recipes"?cardRecipe(item):type==="materials"?cardMat(item):cardSect(item)}
function computedStats(p){
  const bag=Array.isArray(p?.bag)?p.bag:[];
  const gus=bag.filter(x=>x.type==="guworms");
  const add=gus.reduce((a,g)=>{a.life+=n(g.life);a.power+=n(g.attack);a.speed+=n(g.speed);a.defense+=n(g.defense);a.spirit+=n(g.spirit);return a},{life:0,power:0,speed:0,defense:0,spirit:0});
  return {life:n(p?.life)+add.life,power:n(p?.power)+add.power,speed:n(p?.speed)+add.speed,defense:n(p?.defense)+add.defense,spirit:n(p?.spirit)+add.spirit,add};
}
function powerScore(p){const s=computedStats(p); return s.life+s.power+s.speed+s.defense+s.spirit+n(p?.wins)*2+n(p?.stones)/100}
function cardPlayer(p){const s=computedStats(p);return `<div class="card" data-open="players:${p.id}">${image(p.image)}<h3>${safe(p.name||p.id)}</h3><span class="pill">${safe(p.realm||"未定")}</span><span class="pill">${safe(p.aptitude||"资质未抽")}</span><p>${safe(p.faction||"散修")} · 主修${safe(p.mainPath||"未定")}</p><p class="muted">战力 ${Math.round(powerScore(p))}｜生命${s.life} 力${s.power} 速${s.speed} 防${s.defense} 精${s.spirit}</p></div>`}
function cardGu(g){return `<div class="card" data-open="guworms:${g.id}">${image(g.image)}<h3>${safe(g.name||g.id)}</h3>${statusPill(g)}<span class="pill">${safe(g.rank||"一转")}</span><span class="pill">${safe(g.path||"未知流派")}</span><p>${safe(g.effect||"无效果描述")}</p><p class="muted">价格 ${n(g.price)} 元石｜攻${n(g.attack)} 防${n(g.defense)} 距${safe(g.range||"-")}</p></div>`}
function cardKill(k){return `<div class="card" data-open="killmoves:${k.id}">${image(k.image)}<h3>${safe(k.name||k.id)}</h3>${statusPill(k)}<span class="pill">${safe(k.path||"复合流派")}</span><span class="pill">威力 ${n(k.power)}</span><p>${safe(k.effect||"无效果描述")}</p><p class="muted">价格 ${n(k.price)} 元石</p></div>`}
function cardHouse(h){return `<div class="card" data-open="guhouses:${h.id}">${image(h.image)}<h3>${safe(h.name||h.id)}</h3>${statusPill(h)}<span class="pill">${safe(h.rank||"一转")}</span><p>${safe(h.effect||"无效果描述")}</p><p class="muted">价格 ${n(h.price)} 元石</p></div>`}
function cardRecipe(r){return `<div class="card" data-open="recipes:${r.id}">${image(r.image)}<h3>${safe(r.name||r.id)}</h3>${statusPill(r)}<span class="pill">炼制：${safe(r.target||"未定")}</span><p>${safe(r.materials||"材料未填")}</p><p class="muted">价格 ${n(r.price)} 元石</p></div>`}
function cardMat(m){return `<div class="card" data-open="materials:${m.id}">${image(m.image)}<h3>${safe(m.name||m.id)}</h3>${statusPill(m)}<span class="pill">${safe(m.rank||"普通")}</span><span class="pill">${safe(m.path||"无流派")}</span><p>${safe(m.effect||"无用途描述")}</p><p class="muted">价格 ${n(m.price)} 元石</p></div>`}
function cardSect(s){return `<div class="card" data-open="sects:${s.id}">${image(s.image)}<h3>${safe(s.name||s.id)}</h3><span class="pill">${safe(s.level||"未定")}</span><p>宗主：${safe(s.master||"未定")}</p></div>`}
function bindCards(){document.querySelectorAll("[data-open]").forEach(el=>el.onclick=()=>{const [t,id]=el.dataset.open.split(":"); detail(t,id)})}

function renderBackpack(){
  const panel=$("backpackPanel"); if(!panel) return;
  if(!isLogged()){panel.innerHTML=`<h3>背包</h3><p class="muted">登录后显示。</p>`; return;}
  const p=currentPlayer(); const bag=Array.isArray(p?.bag)?p.bag:[];
  const grouped=SHOP_TYPES.map(t=>[t,bag.filter(x=>x.type===t)]);
  const stats=computedStats(p);
  panel.innerHTML=`<div class="backpack-head"><h3>乾坤袋</h3><button onclick="window.openBagPage()">展开</button></div>
  <div class="vital-box"><div><b>生命</b><span>${stats.life}</span></div><div><b>真元</b><span>${essenceNow(p)}/${essenceMax(p)}</span></div><div><b>元石</b><span>${n(p?.stones)}</span></div></div>
  <p class="muted">${safe(accountName)}｜${safe(p?.realm||'未定境界')}</p>
  <div class="toolbar tiny"><button onclick="window.restoreEssence()">元石恢复真元</button><button onclick="window.loginModal()">换ID</button></div>
  ${grouped.map(([t,items])=>`<div class="bag-group"><h4>${BAG_TYPE_NAME[t]} ${items.length}</h4>${items.slice(0,8).map(bagCard).join("")||`<p class="muted small">无</p>`}${items.length>8?`<p class="muted small">更多请点“展开”</p>`:''}</div>`).join("")}`;
}
function bagCard(item){return `<div class="bag-item" data-bag="${safe(item.bagId)}">${image(item.image,"bag-img")}<div><b>${safe(item.name)}</b><br><span>${safe(BAG_TYPE_NAME[item.type])}${item.absorbed?" · 已吸收":""}</span></div></div>`}
function bindBagClicks(){document.querySelectorAll("[data-bag]").forEach(el=>el.onclick=()=>showBagItem(el.dataset.bag))}
function showBagItem(bagId){
  const p=currentPlayer(); const item=(p?.bag||[]).find(x=>x.bagId===bagId); if(!item) return toast("背包里找不到此物");
  const rows=Object.entries(displayBagItem(item)).map(([a,b])=>`<tr><th>${safe(a)}</th><td>${safe(b)}</td></tr>`).join("");
  const absorbBtn=item.type==="guworms" && !item.absorbed?`<button id="absorbBtn">吸收蛊虫</button>`:"";
  const vitalBtn=item.type==="guworms" && item.absorbed?`<button id="vitalBtn">设为本命蛊</button>`:"";
  openModal(`${modalHead(item.name)}<div class="detail-layout"><div>${image(item.image,"big-img")}</div><table class="detail-table">${rows}</table></div><div class="toolbar">${absorbBtn}${vitalBtn}</div>`);
  if($("absorbBtn")) $("absorbBtn").onclick=()=>absorbGu(item.bagId);
  if($("vitalBtn")) $("vitalBtn").onclick=()=>setVitalGu(item.bagId);
}
function displayBagItem(x){return {名称:x.name,类别:BAG_TYPE_NAME[x.type],等级:x.rank||"",流派:x.path||"",状态:x.absorbed?"已吸收":"未吸收/可交易",攻击:x.attack||0,防御:x.defense||0,生命:x.life||0,速度:x.speed||0,精神:x.spirit||0,效果:x.effect||""}}
window.showBagItem=showBagItem;

window.restoreEssence=async()=>{
  const p=currentPlayer(); if(!p) return toast('先登录');
  const max=essenceMax(p), now=essenceNow(p), lack=max-now;
  if(lack<=0) return toast('真元已满');
  const need=Math.ceil(lack/10);
  const use=Number(prompt(`当前真元 ${now}/${max}。1元石恢复10真元，需要最多${need}元石。输入使用元石数量：`, String(Math.min(need,n(p.stones)))))||0;
  if(use<=0) return;
  if(n(p.stones)<use) return toast('元石不足');
  await setDoc(doc(db,'players',p.id),{stones:n(p.stones)-use,essence:Math.min(max,now+use*10)},{merge:true});
  toast('真元已恢复');
}
window.openBagPage=()=>{
  const p=currentPlayer(); if(!p) return toast('先登录');
  const bag=Array.isArray(p.bag)?p.bag:[];
  const stats=computedStats(p);
  const groups=SHOP_TYPES.map(t=>[t,bag.filter(x=>x.type===t)]);
  openModal(`${modalHead('个人洞天 · 资料与乾坤袋')}<div class="profile-grid"><div class="scroll-panel"><h3>${safe(p.name||accountName)}</h3><p>境界：${safe(p.realm||'未定')}｜资质：${safe(p.aptitude||'未抽')}</p><p>生命 ${stats.life}｜力量 ${stats.power}｜速度 ${stats.speed}｜防御 ${stats.defense}｜精神 ${stats.spirit}</p><p>真元 ${essenceNow(p)}/${essenceMax(p)}｜元石 ${n(p.stones)}｜胜场 ${n(p.wins)}</p><p>主流派：${safe(p.mainPath||'')}（${safe(p.mainAttain||'无')}）</p><p>副流派：${safe(p.subPath||'')}（${safe(p.subAttain||'无')}）</p><p>本命蛊：${safe(p.vitalGuName||'未定')}</p></div><div class="scroll-panel"><h3>背包分类</h3>${groups.map(([t,items])=>`<h4>${BAG_TYPE_NAME[t]}（${items.length}）</h4><div class="bag-page-grid">${items.map(x=>`<div class="bag-page-item" onclick="window.showBagItem('${safe(x.bagId)}')">${image(x.image,'bag-img')}<span>${safe(x.name)}</span><small>${x.absorbed?'已吸收':'未吸收'}</small></div>`).join('')||'<p class="muted">暂无</p>'}</div>`).join('')}</div></div>`);
}

setInterval(bindBagClicks,700);

async function updateMyPlayer(data){const p=currentPlayer(); if(!p) return toast("先创建人物资料"); await setDoc(doc(db,"players",p.id),data,{merge:true});}
function absorbCost(rank){const min=ABSORB_MIN[rank]||10; const max=ABSORB_MAX[rank]||30; return Number(prompt(`炼化${rank||"一转"}蛊虫需要真元：${min}-${max}。请输入本次投入真元：`, String(min)))||min}
async function absorbGu(bagId){
  const p=currentPlayer(); const bag=[...(p.bag||[])]; const idx=bag.findIndex(x=>x.bagId===bagId); if(idx<0) return;
  if(bag[idx].absorbed) return toast("已经吸收");
  const cost=absorbCost(bag[idx].rank);
  const min=ABSORB_MIN[bag[idx].rank]||10, max=ABSORB_MAX[bag[idx].rank]||30;
  if(cost<min || cost>max) return toast(`投入真元必须在 ${min}-${max} 之间`);
  if(essenceNow(p)<cost) return toast("真元不足，炼化失败。可用元石恢复：1元石=10真元");
  bag[idx].absorbed=true; bag[idx].absorbedAt=Date.now();
  await setDoc(doc(db,"players",p.id),{bag,essence:essenceNow(p)-cost},{merge:true}); closeModal(); toast("炼化成功，属性已计入人物");
}
async function setVitalGu(bagId){const p=currentPlayer(); const item=(p.bag||[]).find(x=>x.bagId===bagId); if(!item) return; await setDoc(doc(db,"players",p.id),{vitalGuId:bagId,vitalGuName:item.name},{merge:true}); closeModal(); toast("本命蛊已设置");}

function itemToBagItem(type,x){return {bagId:newBagId(), type, sourceId:x.id, name:x.name||x.id, image:x.image||"", rank:x.rank||"", path:x.path||"", price:n(x.price), attack:n(x.attack), defense:n(x.defense), life:n(x.life), speed:n(x.speed), spirit:n(x.spirit), effect:x.effect||x.materials||x.note||"", absorbed:false, obtainedAt:Date.now()}}
async function buyItem(type,id){
  const p=currentPlayer(); if(!p) return toast("先创建人物资料");
  const item=byId(type,id); if(!item) return;
  if(item.status==="待审核") return toast("此物尚未通过审核，不能购买");
  const price=n(item.price);
  if(n(p.stones)<price) return toast("元石不足");
  const bag=[...(p.bag||[]), itemToBagItem(type,item)];
  await setDoc(doc(db,"players",p.id),{stones:n(p.stones)-price,bag},{merge:true}); toast(`购买成功：${item.name} 已入背包`); renderBackpack();
}
window.buyItem=buyItem;

function detail(type,id){
  const item=byId(type,id); if(!item) return;
  const rows=detailRows(type,item).map(([a,b])=>`<tr><th>${safe(a)}</th><td>${safe(b)}</td></tr>`).join("");
  const canEdit=(type==="players" && (isAdmin() || item.accountName===accountName)) || (type!=="players" && canEditItem(item));
  const buyBtn=SHOP_TYPES.includes(type) && item.status!=="待审核"?`<button onclick="window.buyItem('${type}','${id}')">购买 · ${n(item.price)}元石</button>`:"";
  const reviewBtns=isAdmin() && REVIEW_TYPES.includes(type) && item.status==="待审核"?`<button id="approveBtn">通过审核</button><button class="danger" id="rejectBtn">驳回删除</button>`:"";
  openModal(`${modalHead(item.name||id)}<div class="detail-layout"><div>${image(item.image,"big-img")}</div><table class="detail-table">${rows}</table></div><div class="toolbar">${buyBtn}${canEdit?`<button id="editThis">编辑</button>`:""}${reviewBtns}</div>`);
  if($("editThis")) $("editThis").onclick=()=>editForm(type,item);
  if($("approveBtn")) $("approveBtn").onclick=async()=>{await setDoc(doc(db,type,id),{status:"已通过",approvedAt:serverTimestamp()},{merge:true}); closeModal(); toast("已通过审核")};
  if($("rejectBtn")) $("rejectBtn").onclick=async()=>{if(confirm("确定驳回并删除？")){await deleteDoc(doc(db,type,id)); closeModal();}};
}
function detailRows(type,x){
  if(type==="players"){const s=computedStats(x); const bag=Array.isArray(x.bag)?x.bag:[]; return [["玩家ID",x.accountName],["姓名",x.name],["年龄",x.age],["资质",x.aptitude],["境界",x.realm],["势力",x.faction],["主流派",x.mainPath],["主流派成就",x.mainAttain],["副流派",x.subPath],["副流派成就",x.subAttain],["生命/力量/速度/防御/精神",`${s.life} / ${s.power} / ${s.speed} / ${s.defense} / ${s.spirit}`],["元石",x.stones],["胜场",x.wins],["本命蛊",x.vitalGuName],["背包数量",bag.length],["备注",x.note]]}
  if(type==="guworms") return [["状态",x.status||"已通过"],["名称",x.name],["等级",x.rank],["流派",x.path],["攻击",x.attack],["防御",x.defense],["生命/回血",x.life],["速度",x.speed],["精神",x.spirit],["距离",x.range],["冷却",x.cooldown],["持续/定身",x.duration],["价格",x.price],["效果",x.effect]];
  if(type==="killmoves") return [["状态",x.status||"已通过"],["名称",x.name],["流派",x.path],["所需蛊虫",x.requiredGu],["威力",x.power],["距离",x.range],["冷却",x.cooldown],["消耗",x.cost],["价格",x.price],["效果",x.effect]];
  if(type==="guhouses") return [["状态",x.status||"已通过"],["名称",x.name],["等级",x.rank],["核心蛊",x.coreGu],["组成蛊虫",x.components],["攻击",x.attack],["防御",x.defense],["移动",x.move],["价格",x.price],["效果",x.effect]];
  if(type==="recipes") return [["状态",x.status||"已通过"],["蛊方名",x.name],["炼制目标",x.target],["成功率",x.rate],["蛊材与材料",x.materials],["替代材料",x.replace],["价格",x.price],["备注",x.note]];
  if(type==="materials") return [["状态",x.status||"已通过"],["蛊材名",x.name],["等级",x.rank],["对应流派",x.path],["价格",x.price],["来源",x.source],["用途/效果",x.effect]];
  if(type==="sects") return [["势力名",x.name],["宗主/族长",x.master],["等级",x.level],["领地",x.territory],["势力元石",x.stones],["备注",x.note]];
  return Object.entries(x);
}

window.quick=(type)=>editForm(type,null);
function field(k,label,type="text",v=""){return `<label>${label}<input name="${k}" type="${type}" value="${safe(v)}"></label>`}
function area(k,label,v=""){return `<label class="wide">${label}<textarea name="${k}" rows="3">${safe(v)}</textarea></label>`}
function select(k,label,opts,v=""){return `<label>${label}<select name="${k}">${opts.map(o=>`<option ${o==v?"selected":""}>${safe(o)}</option>`).join("")}</select></label>`}
function formWrap(title,inner,item,type){return `${modalHead(title)}<form id="editForm" class="form"><div class="row">${inner}</div><div class="toolbar"><button type="submit">保存</button>${item&&canEditItem(item)&&type!=="players"?`<button type="button" class="danger" id="deleteBtn">删除</button>`:""}</div></form>`}
function editForm(type,item){
  const i=item||{}; let html="";
  if(type==="players") html=formWrap("人物卷宗", field("name","姓名","text",i.name||accountName)+field("age","年龄","number",i.age)+select("realm","境界",REALMS,i.realm)+field("faction","势力","text",i.faction)+select("mainPath","主流派",PATHS,i.mainPath)+select("subPath","副流派",["",...PATHS],i.subPath)+field("image","头像路径","text",i.image)+area("note","备注",i.note)+`<p class="wide muted">五大属性由已炼化蛊虫自动叠加；普通玩家不能改流派成就、元石、胜场、真元。</p>`+(isAdmin()?select("mainAttain","主流派成就",ATTAIN,i.mainAttain)+select("subAttain","副流派成就",ATTAIN,i.subAttain)+field("aptitude","资质","text",i.aptitude)+field("stones","元石","number",i.stones)+field("wins","胜场","number",i.wins)+field("essence","当前真元","number",i.essence):""),item,type);
  if(type==="guworms") html=formWrap("蛊虫卷宗", field("name","名称","text",i.name)+select("rank","等级",GURANKS,i.rank)+select("path","流派",PATHS,i.path)+field("image","图标路径","text",i.image)+field("attack","攻击","number",i.attack)+field("defense","防御","number",i.defense)+field("life","生命/回血","number",i.life)+field("speed","速度","number",i.speed)+field("spirit","精神","number",i.spirit)+field("range","距离","text",i.range)+field("cooldown","冷却","text",i.cooldown)+field("duration","持续/定身","text",i.duration)+field("price","价格","number",i.price)+area("effect","效果",i.effect),item,type);
  if(type==="killmoves") html=formWrap("杀招卷宗", field("name","杀招名","text",i.name)+select("path","流派",PATHS,i.path)+field("image","图片路径","text",i.image)+field("requiredGu","所需蛊虫","text",i.requiredGu)+field("power","威力","number",i.power)+field("range","距离","text",i.range)+field("cooldown","冷却","text",i.cooldown)+field("cost","消耗","text",i.cost)+field("price","价格","number",i.price)+area("effect","效果",i.effect),item,type);
  if(type==="guhouses") html=formWrap("凡蛊屋卷宗", field("name","名称","text",i.name)+select("rank","等级",GURANKS,i.rank)+field("image","图片路径","text",i.image)+field("coreGu","核心蛊","text",i.coreGu)+field("components","组成蛊虫","text",i.components)+field("attack","攻击","number",i.attack)+field("defense","防御","number",i.defense)+field("move","移动","number",i.move)+field("price","价格","number",i.price)+area("effect","效果",i.effect),item,type);
  if(type==="recipes") html=formWrap("蛊方卷宗", field("name","蛊方名","text",i.name)+field("target","炼制目标","text",i.target)+field("image","图片路径","text",i.image)+field("rate","成功率","text",i.rate)+field("price","价格","number",i.price)+area("materials","蛊材与材料",i.materials)+area("replace","替代材料",i.replace)+area("note","备注",i.note),item,type);
  if(type==="materials") html=formWrap("蛊材卷宗", field("name","蛊材名","text",i.name)+select("rank","等级",["普通","珍稀","一转","二转","三转","四转","五转"],i.rank)+select("path","对应流派",PATHS,i.path)+field("image","图片路径","text",i.image)+field("price","价格","number",i.price)+field("source","来源","text",i.source)+area("effect","用途/效果",i.effect),item,type);
  if(type==="sects") html=formWrap("势力卷宗", field("name","势力名","text",i.name)+field("master","宗主/族长","text",i.master)+field("level","等级","text",i.level)+field("image","徽记路径","text",i.image)+field("territory","领地","text",i.territory)+field("stones","势力元石","number",i.stones)+area("note","备注",i.note),item,type);
  openModal(html);
  $("editForm").onsubmit=async e=>{
    e.preventDefault();
    if(type!=="players" && item && !canEditItem(item)) return toast("你只能编辑自己创建的条目，或等待管理员处理");
    if(type==="players" && item && item.accountName!==accountName && !isAdmin()) return toast("你只能编辑自己的资料");
    const data=Object.fromEntries(new FormData(e.target).entries());
    Object.keys(data).forEach(k=>{if(["age","life","power","speed","defense","spirit","stones","wins","attack","price","move"].includes(k)) data[k]=Number(data[k]||0)});
    if(type==="players"){data.accountName=item?.accountName||accountName; data.bag=item?.bag||[];}
    else {data.ownerName=item?.ownerName||accountName; data.creator=data.creator||accountName; if(!isAdmin() && !item) data.status="待审核"; if(isAdmin() && !data.status) data.status="已通过";}
    if(item) await setDoc(doc(db,type,item.id),{...item,...data},{merge:true}); else await addDoc(col(type),{...data,createdAt:serverTimestamp()});
    closeModal(); toast(type==="players"?"资料已保存":"已保存；玩家自创内容需审核");
  };
  if(item && $("deleteBtn")) $("deleteBtn").onclick=async()=>{if(!canEditItem(item)) return toast("无权删除"); if(confirm("确定删除？")){await deleteDoc(doc(db,type,item.id)); closeModal();}};
}

window.rollForMe=async()=>{
  const p=currentPlayer(); if(!p) return toast("先创建人物资料");
  if(p.aptitude && !isAdmin()) return toast("资质已经确定，不能重复抽取");
  const r=Math.random()*100; let apt="丁"; if(r<1) apt="十绝体"; else if(r<11) apt="甲"; else if(r<31) apt="乙"; else if(r<61) apt="丙";
  await setDoc(doc(db,"players",p.id),{aptitude:apt},{merge:true}); toast(`天意已定：${apt}`);
};

function renderReview(){
  if(!isAdmin()) {$("content").innerHTML=`<div class="card">此处只有管理员可见。</div>`; return renderBackpack();}
  const items=[]; REVIEW_TYPES.forEach(t=>state[t].filter(x=>x.status==="待审核").forEach(x=>items.push({type:t,...x})));
  $("content").innerHTML=`<h2>待审核：${items.length}</h2><div class="grid">${items.map(x=>`<div class="card" data-open="${x.type}:${x.id}">${image(x.image)}<h3>${safe(x.name)}</h3><span class="pill warn">待审核</span><p>${safe(TYPE_NAME[x.type])} · ${safe(x.path||x.target||"")}</p><p class="muted">创建者：${safe(x.creator||x.ownerName)}</p></div>`).join("")||empty()}</div>`; bindCards(); renderBackpack();
}

function activeTrade(){return state.trades.find(t=>t.status==="交易中" && (t.from===accountName || t.to===accountName))}
window.onbeforeunload=()=> activeTrade()?"你有正在进行的交易，取消或完成后再退出。":undefined;
function renderTrades(){
  const at=activeTrade();
  const trades=state.trades.filter(t=>isAdmin() || t.from===accountName || t.to===accountName);
  $("content").innerHTML=`${at?'<div class="online-lock">你有交易进行中，完成或取消前不要退出。</div>':''}<div class="toolbar"><button onclick="window.createTrade()">发起交易</button></div><p class="muted">线上交易：同一时间只能进行一场交易。双方从背包摆物品，双方确认后自动交换；取消或成功后才释放交易台。</p><div class="grid">${trades.map(tradeCard).join("")||empty()}</div>`; renderBackpack(); bindTradeCards();
}
function tradeCard(t){return `<div class="card" data-trade-open="${t.id}"><h3>${safe(t.from)} ⇄ ${safe(t.to)}</h3><span class="pill">${safe(t.status||"交易中")}</span><p><b>${safe(t.from)}摆放：</b>${safe((t.fromOffer||[]).map(x=>x.name).join("、")||"无")}</p><p><b>${safe(t.to)}摆放：</b>${safe((t.toOffer||[]).map(x=>x.name).join("、")||"无")}</p><p class="muted">确认：${t.fromReady?"发起方已确认":"发起方未确认"} / ${t.toReady?"对方已确认":"对方未确认"}</p></div>`}
function bindTradeCards(){document.querySelectorAll("[data-trade-open]").forEach(el=>el.onclick=()=>tradeModal(el.dataset.tradeOpen))}
window.createTrade=()=>{
  const p=currentPlayer(); if(!p) return toast("先创建人物资料");
  if(activeTrade()) return toast("你已有交易进行中，请先完成或取消");
  openModal(`${modalHead("发起交易")}<form id="newTrade" class="form"><label>交易对象玩家ID<input name="to" placeholder="例如：陈卡卡" required></label><button>创建交易</button></form>`);
  $("newTrade").onsubmit=async e=>{e.preventDefault(); const to=sanitizeAccountName(new FormData(e.target).get("to")); if(!to || to===accountName) return toast("交易对象不对"); if(!state.players.some(p=>p.accountName===to)) return toast("找不到这个玩家ID"); await addDoc(col("trades"),{from:accountName,to,status:"交易中",fromOffer:[],toOffer:[],fromReady:false,toReady:false,createdAt:serverTimestamp()}); closeModal(); toast("交易已创建")};
};
function tradeModal(id){
  const t=state.trades.find(x=>x.id===id); if(!t) return;
  if(!(isAdmin() || t.from===accountName || t.to===accountName)) return toast("不是你的交易");
  const side=t.from===accountName?"from":"to"; const myOffer=side==="from"?(t.fromOffer||[]):(t.toOffer||[]); const otherOffer=side==="from"?(t.toOffer||[]):(t.fromOffer||[]);
  const ready=side==="from"?t.fromReady:t.toReady;
  openModal(`${modalHead("交易平台")}<div class="trade-layout"><div class="trade-box"><h3>${safe(accountName)} 的摆放</h3>${myOffer.map(offerItem).join("")||`<p class="muted">未摆放</p>`}</div><div class="trade-box"><h3>对方摆放</h3>${otherOffer.map(offerItem).join("")||`<p class="muted">未摆放</p>`}</div></div><div class="toolbar"><button id="addOfferBtn">从背包选择物品</button><button id="readyBtn">${ready?"取消确认":"确认交易"}</button><button class="danger" id="cancelTradeBtn">取消交易</button></div><p class="muted">双方都确认后，系统会自动交换物品。</p>`);
  $("addOfferBtn").onclick=()=>chooseTradeItems(t);
  $("readyBtn").onclick=async()=>{await setDoc(doc(db,"trades",id),{[side+"Ready"]:!ready},{merge:true}); closeModal(); setTimeout(()=>maybeFinishTrade(id),500)};
  $("cancelTradeBtn").onclick=async()=>{if(confirm("确定取消交易？")){await setDoc(doc(db,"trades",id),{status:"已取消"},{merge:true}); closeModal();}};
}
function offerItem(x){return `<div class="bag-item">${image(x.image,"bag-img")}<div><b>${safe(x.name)}</b><br><span>${safe(BAG_TYPE_NAME[x.type])}</span></div></div>`}
function canTradeItem(x){return x.type!=="guworms" || !x.absorbed}
function chooseTradeItems(t){
  const p=currentPlayer(); const bag=(p?.bag||[]).filter(canTradeItem); const side=t.from===accountName?"from":"to"; const currentOffer=side==="from"?(t.fromOffer||[]):(t.toOffer||[]); const selected=new Set(currentOffer.map(x=>x.bagId));
  openModal(`${modalHead("从背包摆上交易台")}<form id="offerForm" class="form"><div class="bag-choose">${bag.map(x=>`<label class="choose-card"><input type="checkbox" name="item" value="${safe(x.bagId)}" ${selected.has(x.bagId)?"checked":""}>${image(x.image,"bag-img")}<span>${safe(x.name)} · ${safe(BAG_TYPE_NAME[x.type])}</span></label>`).join("")||`<p>没有可交易物品。</p>`}</div><button>保存摆放</button></form>`);
  $("offerForm").onsubmit=async e=>{e.preventDefault(); const ids=new FormData(e.target).getAll("item"); const offer=bag.filter(x=>ids.includes(x.bagId)); await setDoc(doc(db,"trades",t.id),{[side+"Offer"]:offer,[side+"Ready"]:false},{merge:true}); closeModal(); toast("已更新交易摆放")};
}
async function maybeFinishTrade(id){
  const snap=await getDoc(doc(db,"trades",id)); if(!snap.exists()) return; const t={id,...snap.data()};
  if(t.status!=="交易中" || !t.fromReady || !t.toReady) return;
  const fromP=state.players.find(p=>p.accountName===t.from); const toP=state.players.find(p=>p.accountName===t.to); if(!fromP||!toP) return toast("交易双方人物不存在");
  const fromIds=new Set((t.fromOffer||[]).map(x=>x.bagId)); const toIds=new Set((t.toOffer||[]).map(x=>x.bagId));
  let fromBag=(fromP.bag||[]), toBag=(toP.bag||[]);
  const fromItems=fromBag.filter(x=>fromIds.has(x.bagId)); const toItems=toBag.filter(x=>toIds.has(x.bagId));
  fromBag=fromBag.filter(x=>!fromIds.has(x.bagId)).concat(toItems.map(x=>({...x,bagId:newBagId(),tradedAt:Date.now()})));
  toBag=toBag.filter(x=>!toIds.has(x.bagId)).concat(fromItems.map(x=>({...x,bagId:newBagId(),tradedAt:Date.now()})));
  await setDoc(doc(db,"players",fromP.id),{bag:fromBag},{merge:true}); await setDoc(doc(db,"players",toP.id),{bag:toBag},{merge:true}); await setDoc(doc(db,"trades",id),{status:"已完成",finishedAt:serverTimestamp()},{merge:true}); toast("交易完成，背包已更新");
}

function renderChat(){
  const p=currentPlayer();
  const friends=Array.isArray(p?.friends)?p.friends:[];
  const groups=Array.isArray(p?.groups)?p.groups:[];
  const visible=state.messages.filter(m=>{
    const ch=m.channel||'world';
    if(channel==='world') return ch==='world';
    if(channel==='sect') return ch==='sect' && (m.faction||'')===(p?.faction||'');
    if(channel.startsWith('private:')) return ch===channel;
    if(channel.startsWith('group:')) return ch===channel;
    return false;
  });
  $('content').innerHTML=`<div class="toolbar"><button onclick="window.setChannel('world')">世界频道</button><button onclick="window.setChannel('sect')">势力频道</button><button onclick="window.addFriend()">添加好友</button><button onclick="window.createGroup()">创建群聊</button></div>
  <div class="chat-tools"><div class="friend-list"><h3>好友私聊</h3>${friends.map(f=>`<button onclick="window.openPrivate('${safe(f)}')">${safe(f)}</button>`).join('')||'<p class="muted">暂无好友</p>'}</div><div class="group-list"><h3>群聊</h3>${groups.map(g=>`<button onclick="window.openGroup('${safe(g.name)}')">${safe(g.name)}</button>`).join('')||'<p class="muted">暂无群聊</p>'}</div></div>
  <div class="chat-box" id="chatBox">${visible.map(m=>`<div class="msg"><b>${safe(m.name||'无名')}</b>：${safe(m.text)}</div>`).join('')}</div><form class="chat-input" id="chatForm"><input name="text" placeholder="传音入密……"><button>发送</button></form>`;
  $('chatForm').onsubmit=async e=>{e.preventDefault(); const text=e.target.text.value.trim(); if(!text) return; await addDoc(col('messages'),{name:accountName,text,channel,faction:p?.faction||'',createdAt:serverTimestamp(),uid}); e.target.reset();};
  setTimeout(()=>{const b=$('chatBox'); if(b) b.scrollTop=b.scrollHeight},50); renderBackpack();
}
window.setChannel=c=>{channel=c; renderChat()}
function privateChannel(a,b){return 'private:'+[a,b].sort().join('__')}
window.addFriend=async()=>{
  const p=currentPlayer(); if(!p) return;
  const name=sanitizeAccountName(prompt('输入好友玩家ID')||'');
  if(!name || name===accountName) return;
  if(!state.players.some(x=>x.accountName===name)) return toast('找不到这个玩家ID');
  const friends=Array.from(new Set([...(p.friends||[]),name]));
  await setDoc(doc(db,'players',p.id),{friends},{merge:true}); toast('好友已添加');
}
window.openPrivate=(name)=>{channel=privateChannel(accountName,name); renderChat()}
window.createGroup=async()=>{
  const p=currentPlayer(); if(!p) return;
  const name=(prompt('群聊名称')||'').trim(); if(!name) return;
  const members=(prompt('群成员ID，用逗号分隔（会自动包含你）')||'').split(/[,，\s]+/).map(sanitizeAccountName).filter(Boolean);
  const group={name,members:Array.from(new Set([accountName,...members]))};
  await Promise.all(group.members.map(async m=>{const pp=state.players.find(x=>x.accountName===m); if(pp){const groups=[...(pp.groups||[]).filter(g=>g.name!==name),group]; await setDoc(doc(db,'players',pp.id),{groups},{merge:true});}}));
  toast('群聊已创建');
}
window.openGroup=(name)=>{channel='group:'+name; renderChat()}
function renderSects(){const arr=state.sects.filter(x=>!q()||JSON.stringify(x).includes(q())).map(s=>({...s,members:state.players.filter(p=>p.faction===s.name).length,totalPower:state.players.filter(p=>p.faction===s.name).reduce((a,p)=>a+powerScore(p),0)})).sort((a,b)=>b.totalPower-a.totalPower); $("content").innerHTML=`<div class="toolbar"><button onclick="window.quick('sects')">新增势力</button></div><div class="grid">${arr.map(cardSect).join("")||empty()}</div>`; bindCards(); renderBackpack();}
function renderRankings(){const p=[...state.players]; const rows=(arr,fn)=>arr.slice(0,20).map((x,i)=>`<tr><td>${i+1}</td><td>${safe(x.name)}</td><td>${fn(x)}</td><td>${safe(x.faction||"散修")}</td></tr>`).join(""); $("content").innerHTML=`<h2>战力榜</h2><table class="table"><tr><th>名次</th><th>姓名</th><th>战力</th><th>势力</th></tr>${rows(p.sort((a,b)=>powerScore(b)-powerScore(a)),x=>Math.round(powerScore(x)))}</table><h2>财富榜</h2><table class="table"><tr><th>名次</th><th>姓名</th><th>元石</th><th>势力</th></tr>${rows(p.sort((a,b)=>n(b.stones)-n(a.stones)),x=>n(x.stones))}</table><h2>胜场榜</h2><table class="table"><tr><th>名次</th><th>姓名</th><th>胜场</th><th>势力</th></tr>${rows(p.sort((a,b)=>n(b.wins)-n(a.wins)),x=>n(x.wins))}</table>`; renderBackpack();}
function renderRules(){$("content").innerHTML=`<div class="scroll-panel"><h2>玩家ID</h2><p>每人用玩家ID和口令进入，身份不会因为换设备丢失。</p><h2>购买与背包</h2><p>蛊虫、蛊方、蛊材、杀招、凡蛊屋均可用元石购买。购买后进入右侧乾坤袋。蛊虫未吸收前可交易，吸收后变成自身战力，不再作为普通交易物。</p><h2>真元与炼化</h2><p>真元相当于蓝条。一转初期30，至五转巅峰1500。炼化蛊虫消耗真元：一转10-30，二转15-50，三转40-100，四转80-300，五转180-1000。真元不足则炼化失败。1元石可恢复10真元。</p><h2>五大属性</h2><p>生命、力量、速度、防御、精神由玩家拥有的蛊虫属性自动叠加，普通玩家不能手动乱填。</p><h2>交易</h2><p>交易双方从背包里选择物品摆上平台，可以随时取消。双方都确认后，系统交换物品。</p><h2>资质转盘</h2><p>十绝体1%，甲10%，乙20%，丙30%，丁39%。</p></div>`; renderBackpack();}

boot();
