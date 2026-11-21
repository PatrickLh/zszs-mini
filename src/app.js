import {activities} from './core/activities.js';
import {createPreviewState,activityPreview,resetPreview} from './core/activity-preview.js';
const $=id=>document.getElementById(id);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const image=path=>escape(path.startsWith('/static/')?'uni-app'+path:path);
const num=v=>Math.max(0,Math.min(1e9,Math.trunc(Number(v)||0)));
const states=Object.fromEntries(activities.map(a=>[a.id,createPreviewState(a.config)]));
let activity=activities.find(a=>a.id===new URLSearchParams(location.search).get('activity'))||activities[0];
let state=states[activity.id],view;
function setForm(){ $('stock').value=state.stock;$('weekly').checked=state.weekly;$('weekly-currency').value=state.weeklyCurrency; }
function render(){
 const config=activity.config,planner=activity.calculator,goods=planner.goods;
 view=activityPreview(planner,state);
 $('activities').innerHTML=activities.map(a=>`<button data-activity="${a.id}" aria-pressed="${a.id===activity.id}">${escape(a.name)}</button>`).join('');
 $('activity-title').textContent=config.name;
 $('stock-label').innerHTML=`<img class="material-icon" src="${image(config.material.image)}" alt="">当前拥有${escape(config.material.name)}`;
 $('weekly-label').textContent=`计入本周领取与购买附带${config.currency.name} +`;
 $('weekly-note').textContent=`默认按7天每天免费领取1次、灵玉购买2次计算，数量可自行修改；不勾选则基础代币为0。${config.material.name}库存填写计划可用总量${config.secondaryMaterial?'（含限时券）':''}，不再重复增加。`;
 const note=config.cost.kind==='combat'?`每个敌人预计消耗约${planner.attackCost('expected').toFixed(3)}${config.material.name}，保守按${planner.attackCost('safe')}个计算；预计值不保证达成。`:`每次消耗${config.cost.perAction}${config.material.name}，不计随机直接掉落。`;
 $('calculation-note').textContent=note;
 const scrollLeft=$('stages').scrollLeft;
 $('stages').innerHTML=view.rows.filter(r=>r.end).map(r=>{
  const safe=view.safeRows.find(s=>s.progress===r.progress);
  return `<button class="round-card ${state.preview===r.progress?'selected-round':''}" data-preview="${r.progress}" aria-pressed="${state.preview===r.progress}"><div class="round-title">第 ${r.round} 轮<span>${r.gap===0?'预计可达':''}</span></div><div class="round-metric"><span>${config.cost.kind==='combat'?'预计需':'累计需'}</span><strong>${r.required}<small> ${escape(config.material.name)}</small></strong></div>${config.cost.kind==='combat'?`<div class="round-metric"><span>保守需</span><strong>${safe.required}<small> ${escape(config.material.name)}</small></strong></div>`:''}<div class="round-pages"><span>累计${escape(config.currency.name)}</span><strong>${r.currency+view.base}</strong></div><div class="round-gap ${r.gap?'gap':'enough'}">${r.gap?'预计还差 '+r.gap:'当前库存预计足够'}</div></button>`;
 }).join('');
 $('stages').scrollLeft=scrollLeft;
 $('details').innerHTML=view.rows.map(r=>`<tr><td>第${r.round}轮 · ${r.progress}${escape(config.progressUnit)}</td><td>${r.cost}</td><td>+${r.refund}</td><td>${r.currency+view.base}</td></tr>`).join('');
 $('table-currency').textContent=config.currency.name+'累计';
 $('wallet-label').innerHTML=`<img class="material-icon" src="${image(config.currency.image)}" alt="">可用${escape(config.currency.name)}`;
 $('wallet').value=view.wallet;
 $('spent').textContent=`已消耗 ${view.spent} ${config.currency.name}`;
 $('wallet-note').textContent=`${state.preview===null?'库存预计可得':'所选轮次'} ${view.earned} + 基础 ${view.base} − 已兑换 ${view.spent}。`;
 $('shop').innerHTML=config.shop.layers.map(layer=>{
  const items=goods.filter(g=>g.layer===layer.id),locked=view.spent<layer.unlock;
  const refunds=[...new Set(items.map(g=>g.refund))];
  return `<section class="shop-layer ${locked?'locked':''}"><div class="layer-head"><strong>第${layer.id}层</strong><span>每次兑换额外获得${escape(config.material.name)}${refunds.length===1?' ×'+refunds[0]:''}</span></div><div class="goods-grid">${items.map(g=>{
   const left=g.limit-(state.purchases[g.id]||0);
   return `<button class="store-item" data-buy="${g.id}" ${locked||!left||view.wallet<g.price?'disabled':''}><div class="item-name">${escape(g.name)}</div><div class="item-icon"><img src="${image(g.image)}" alt="" loading="lazy"><small>×${g.amount}</small></div><p>剩余 ${left}/${g.limit}</p><div class="price">${g.price} ${escape(config.currency.name)}</div></button>`;
  }).join('')}</div>${locked?`<div class="lock-message">再消耗 ${layer.unlock-view.spent} ${escape(config.currency.name)}解锁本层</div>`:''}</section>`;
 }).join('')+`<div class="shop-footer">兑换返还${escape(config.material.name)}：${view.refund} 个</div>`;
}
$('stock').addEventListener('input',()=>{state.stock=num($('stock').value);resetPreview(state);render()});
$('weekly').addEventListener('change',()=>{state.weekly=$('weekly').checked;resetPreview(state);render()});
$('weekly-currency').addEventListener('input',()=>{state.weeklyCurrency=num($('weekly-currency').value);resetPreview(state);render()});
document.addEventListener('click',e=>{
 const switcher=e.target.closest('[data-activity]');
 if(switcher){activity=activities.find(a=>a.id===switcher.dataset.activity);state=states[activity.id];setForm();render();const url=new URL(location.href);url.searchParams.set('activity',activity.id);history.replaceState(null,'',url);return}
 const pick=e.target.closest('[data-preview]');if(pick){state.purchases={};state.preview=Number(pick.dataset.preview);render();return}
 const buy=e.target.closest('[data-buy]');
 if(buy&&!buy.disabled){const g=activity.calculator.goods.find(g=>g.id===buy.dataset.buy);if(view.wallet>=g.price&&view.spent>=g.unlock&&(state.purchases[g.id]||0)<g.limit){state.purchases[g.id]=(state.purchases[g.id]||0)+1;render()}}
});
$('clear').onclick=()=>{state.purchases={};render()};
function drawer(open){$('drawer').hidden=!open;document.body.style.overflow=open?'hidden':''}
$('help').onclick=()=>drawer(true);$('close').onclick=()=>drawer(false);$('drawer').onclick=e=>{if(e.target===$('drawer'))drawer(false)};
document.addEventListener('keydown',e=>{if(e.key==='Escape')drawer(false)});
setForm();render();
