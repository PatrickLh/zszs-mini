import {activities} from './core/activities.js';
import {createPreviewState,activityPreview,resetPreview,setPaidPack,selectRoundTarget} from './core/activity-preview.js';
const $=id=>document.getElementById(id);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const image=path=>escape(path.startsWith('/static/')?'uni-app'+path:path);
const num=v=>Math.max(0,Math.min(1e9,Math.trunc(Number(v)||0)));
const states=Object.fromEntries(activities.map(a=>[a.id,createPreviewState(a.config)]));
let activity=activities.find(a=>a.id===new URLSearchParams(location.search).get('activity'))||activities[0];
let state=states[activity.id],view;
function setForm(){ $('stock').value=state.stock;$('weekly').checked=state.weekly; }
function render(){
 const config=activity.config,planner=activity.calculator,goods=planner.goods;
 view=activityPreview(planner,state);
 const nextStage = view.nextStage;
 $('reachable-stage').innerHTML = nextStage
  ? `预计可达 ${escape(config.progressLabel)} <strong>${view.reachableProgress}</strong>${escape(config.progressUnit)} · 下一阶段（第 <strong>${nextStage.progress}</strong>${escape(config.progressUnit)}）还差 <strong>${nextStage.gap}</strong> 个${escape(config.material.name)}`
  : '全部阶段已完成或预计可达';
 const futureMaterial = view.futureFree + view.futurePurchased;
 $('activity-material-total').textContent = state.stock + futureMaterial;
 $('activity-material-breakdown').textContent = `当前拥有 ${state.stock} + 剩余天数可获得 ${futureMaterial}`;
 $('start-currency-label').textContent = `当前${config.currency.name}`;
 $('start-progress').innerHTML='<option value="0">尚未完成阶段</option>'+planner.milestones.map(r=>`<option value="${r.progress}">第${r.round}轮 · 累计${r.progress}${config.progressUnit}</option>`).join('');
 $('start-progress').value=state.progress;
 for(const [id,key] of [['start-currency','currentCurrency'],['start-days','remainingDays']])if(document.activeElement!==$(id))$(id).value=state[key];
 $('activities').innerHTML=activities.map(a=>`<button data-activity="${a.id}" aria-pressed="${a.id===activity.id}">${escape(a.name)}</button>`).join('');
 $('activity-title').textContent=config.name;
 $('stock-label').innerHTML=`<img class="material-icon" src="${image(config.material.image)}" alt="">当前拥有${escape(config.material.name)}`;
 $('weekly-note').textContent=`剩余天数包含今天尚未领取的次数。勾选后计入每日免费 1 个道具、两次灵玉购买的 6 个道具，以及附带的兑换币。${config.material.name}库存填写当前持有量${config.secondaryMaterial?'（含限时券）':''}，已完成阶段奖励按已领取处理。`;
 const note=config.cost.kind==='combat'?`破木预计每个敌人消耗 ${planner.attackCost('expected')} 个${config.material.name}。保守按每个敌人 ${planner.attackCost('safe') / config.cost.perAttack} 次攻击计算，每次消耗 ${config.cost.perAttack} 个${config.material.name}。预计值用于规划，实际消耗随暴击变化。`:`每次消耗${config.cost.perAction}${config.material.name}，不计随机直接掉落。`;
 $('calculation-note').textContent=note;
 $('clear-paid').hidden=!view.paid.count;
 $('paid-caption').textContent=view.paid.count?`¥${view.paid.money} · ${view.paid.count}份`:'未选择 · 可选';
 const paidScrollLeft=$('paid-packs').scrollLeft;
 $('paid-packs').innerHTML=(config.paidPacks||[]).map(pack=>{
  const count=view.paid.counts[pack.id]||0;
  return `<div class="paid-pack ${count?'is-selected':''}"><div class="pack-title">¥${pack.price}<small>限购 ${pack.limit} 份</small></div><div class="pack-rewards"><span>${escape(config.material.name)} <strong>×${pack.material}</strong></span><span>${escape(config.currency.name)} <strong>×${pack.currency}</strong></span></div><div class="pack-stepper"><button type="button" data-pack="${pack.id}" data-delta="-1" aria-label="减少${pack.price}元礼包" ${!count?'disabled':''}>−</button><input type="number" inputmode="numeric" min="0" max="${pack.limit}" value="${count}" data-pack-count="${pack.id}" aria-label="${pack.price}元礼包份数"><button type="button" data-pack="${pack.id}" data-delta="1" aria-label="增加${pack.price}元礼包" ${count>=pack.limit?'disabled':''}>+</button></div></div>`;
 }).join('');
 $('paid-packs').scrollLeft=paidScrollLeft;
 $('paid-result').innerHTML=`<div class="paid-totals"><div><span>计划花费</span><strong>¥${view.paid.money}</strong></div><div><span>${escape(config.material.name)}</span><strong>+${view.paid.material}</strong></div><div><span>直接${escape(config.currency.name)}</span><strong>+${view.paid.currency}</strong></div></div><p class="paid-conversion">材料推进任务预计另得 <strong>${view.paidTaskCurrency}</strong> ${escape(config.currency.name)}</p>`;
 $('material-total').hidden=!view.paid.count;
 $('material-total').textContent=`原有库存 ${state.stock} + 后续免费 ${view.futureFree} + 灵玉购买 ${view.futurePurchased} + 礼包 ${view.paid.material} = 可用${config.material.name} ${view.totalStock}`;
 const scrollLeft=$('stages').scrollLeft;
 $('stage-cards').innerHTML=view.rows.filter(r=>r.end).map(r=>{
  const safe=view.safeRows.find(s=>s.progress===r.progress);
   return `<button class="round-card ${state.preview===r.progress?'selected-round':''}" data-preview="${r.progress}" aria-pressed="${state.preview===r.progress}"><div class="round-title">第 ${r.round} 轮<span>${r.gap===0?'预计可达':''}</span></div><div class="round-metric"><span>${config.cost.kind==='combat'?'所需（预计）':'所需'}</span><strong>${r.cost}<small> ${escape(config.material.name)}</small></strong></div>${config.cost.kind==='combat'?`<div class="round-metric"><span>保守总耗</span><strong>${safe.cost}<small> ${escape(config.material.name)}</small></strong></div>`:''}<div class="round-pages"><span>累计${escape(config.currency.name)}</span><strong>${r.currency+view.base+view.paid.currency}</strong></div><div class="refund-note">达成后累计返还 ${r.refund} ${escape(config.material.name)}</div>${!r.gap?`<div class="refund-note">达成后预计剩余 ${r.remaining} ${escape(config.material.name)}</div>`:''}<div class="round-gap ${r.gap?'gap':'enough'}">${r.gap?'当前道具不足以完成本轮':'当前材料预计足够'}</div></button>`;
 }).join('');
 $('stages').scrollLeft=scrollLeft;
 $('details').innerHTML=view.rows.map(r=>`<tr><td>第${r.round}轮 · ${r.progress}${escape(config.progressUnit)}</td><td>${r.cost}</td><td>+${r.refund}</td><td>${r.currency+view.base+view.paid.currency}</td></tr>`).join('');
 $('table-currency').textContent=config.currency.name+'累计';
 $('wallet-label').innerHTML=`<img class="material-icon" src="${image(config.currency.image)}" alt="">`;
 $('wallet').value=view.wallet;
 $('spent').textContent=`已消耗 ${view.spent} ${config.currency.name}`;
 $('wallet-note').textContent=`${state.preview===null?'预计完成任务后获得':'达成所选轮次后获得'} ${view.earned} + 当前余额 ${view.currentCurrency} + 后续附带 ${view.base} + 礼包直接 ${view.paid.currency} − 已兑换 ${view.spent}。${state.preview!==null&&view.previewGap?`所选目标仍差 ${view.previewGap} ${config.material.name}。`:''}`;
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
document.addEventListener('click',e=>{
 const pack=e.target.closest('[data-pack]');
 if(pack&&!pack.disabled){const id=pack.dataset.pack;setPaidPack(activity.config,state,id,(view.paid.counts[id]||0)+Number(pack.dataset.delta));render();document.querySelector(`[data-pack="${id}"][data-delta="${pack.dataset.delta}"]`)?.focus({preventScroll:true});return}
 const switcher=e.target.closest('[data-activity]');
 if(switcher){activity=activities.find(a=>a.id===switcher.dataset.activity);state=states[activity.id];setForm();render();const url=new URL(location.href);url.searchParams.set('activity',activity.id);history.replaceState(null,'',url);return}
 const pick=e.target.closest('[data-preview]');if(pick){selectRoundTarget(state,view,Number(pick.dataset.preview));$('stock').value=state.stock;render();return}
 const buy=e.target.closest('[data-buy]');
 if(buy&&!buy.disabled){const g=activity.calculator.goods.find(g=>g.id===buy.dataset.buy);if(view.wallet>=g.price&&view.spent>=g.unlock&&(state.purchases[g.id]||0)<g.limit){state.purchases[g.id]=(state.purchases[g.id]||0)+1;render()}}
});
document.addEventListener('change',e=>{const id=e.target.dataset.packCount;if(id){setPaidPack(activity.config,state,id,e.target.value);render()}});
$('paid-toggle').onclick=()=>{
 const open=$('paid-content').hidden;
 $('paid-content').hidden=!open;
 $('paid-toggle').setAttribute('aria-expanded',String(open));
 $('paid-toggle-label').textContent=open?'收起':'展开';
};
$('clear-paid').onclick=()=>{state.paidPacks={};resetPreview(state);render()};
$('clear').onclick=()=>{state.purchases={};render()};
function drawer(open){$('drawer').hidden=!open;document.body.style.overflow=open?'hidden':''}
$('help').onclick=()=>drawer(true);$('close').onclick=()=>drawer(false);$('drawer').onclick=e=>{if(e.target===$('drawer'))drawer(false)};
document.addEventListener('keydown',e=>{if(e.key==='Escape')drawer(false)});
setForm();render();

for(const [id,key] of [['start-progress','progress'],['start-currency','currentCurrency'],['start-days','remainingDays']])$(id).addEventListener(key==='remainingDays'?'input':'change',e=>{state[key]=key==='remainingDays'?Math.min(7,num(e.target.value)):num(e.target.value);resetPreview(state);render()});

$('start-days').addEventListener('blur',e=>{e.target.value=state.remainingDays});
