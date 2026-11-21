<template>
 <view class="page">
  <view class="page-heading"><view class="title">{{config.name}}</view><text class="help" @click="showHelp=!showHelp">计算说明</text></view>
  <view class="card planning-card">
   <view class="inventory-line"><view class="resource-label"><image class="material-icon" :src="config.material.image" mode="aspectFit"/><text>当前拥有{{config.material.name}}</text></view><view class="stock-box"><input type="number" :value="state.stock" @input="setStock"/><text>个</text></view></view>
   <view class="weekly-option"><checkbox-group @change="setWeekly"><label><checkbox value="weekly" :checked="state.weekly" color="#315740"/><text>计入本周附带{{config.currency.name}} +</text></label></checkbox-group><input class="weekly-input" type="number" :value="state.weeklyCurrency" @input="setWeeklyCurrency"/></view>
   <view class="hint">默认按7天每天免费领取1次、灵玉购买2次计算，数量可修改。材料库存填写计划可用总量{{config.secondaryMaterial?'（含限时券）':''}}，不再重复增加。</view>
   <scroll-view scroll-x class="round-scroll"><view class="round-list"><view v-for="r in endpoints" :key="r.progress" :class="['round-card',{'selected-round':state.preview===r.progress}]" @click="selectRound(r.progress)"><view class="round-title">第 {{r.round}} 轮<text v-if="!r.gap">预计可达</text></view><view class="metric"><text>{{isCombat?'预计需':'累计需'}}</text><text class="number">{{r.required}}</text></view><view v-if="isCombat" class="metric"><text>保守需</text><text class="number">{{safeFor(r).required}}</text></view><view class="metric currency-metric"><text>累计{{config.currency.name}}</text><text>{{r.currency+view.base}}</text></view><view :class="['gap',r.gap?'short':'enough']">{{r.gap?'预计还差 '+r.gap:'当前库存预计足够'}}</view></view></view></scroll-view>
   <view class="hint">左右滑动查看轮次 · 点击预览该轮兑换币</view>
  </view>
  <view v-if="showHelp" class="card"><view class="heading">计算说明</view><view class="hint">{{costNote}} 先达到节点再领取奖励，不计随机直接掉落。宝库独立模拟，兑换返还在底部展示，未抵扣上方阶段需求。可用代币由上方材料库存、所选轮次和每周附带数量自动计算。</view></view>
  <view class="page-heading"><view class="heading">活动宝库</view><text class="help" @click="state.purchases={}">重置兑换</text></view>
  <view class="wallet"><view class="resource-label"><image class="material-icon" :src="config.currency.image" mode="aspectFit"/><text>可用{{config.currency.name}}</text></view><text class="wallet-value">{{view.wallet}}</text><text>已消耗 {{view.spent}}</text></view>
  <view class="hint">任务 {{view.earned}} + 基础 {{view.base}} − 已兑换 {{view.spent}}</view>
  <view v-for="l in config.shop.layers" :key="l.id" class="card shop-layer"><view class="layer-heading">第{{l.id}}层<text>兑换返还{{config.material.name}}</text></view><view v-for="g in goodsFor(l.id)" :key="g.id" class="goods"><image class="icon" :src="g.image" mode="aspectFit"/><view class="info"><view>{{g.name}} ×{{g.amount}}</view><view class="hint">{{g.price}} {{config.currency.name}} · 限购{{g.limit}}<view>每次返还{{g.refund}}{{config.material.name}}</view></view></view><view class="stepper"><button :disabled="!state.purchases[g.id]" @click="change(g,-1)">−</button><text>{{state.purchases[g.id]||0}}</text><button :disabled="view.spent<g.unlock||view.wallet<g.price||(state.purchases[g.id]||0)>=g.limit" @click="change(g,1)">+</button></view></view><view v-if="view.spent<l.unlock" class="hint">再消耗 {{l.unlock-view.spent}} {{config.currency.name}}解锁本层</view></view>
  <view class="hint footer">兑换返还{{config.material.name}}：{{view.refund}} 个</view>
 </view>
</template>
<script setup>
import {reactive,computed,ref} from 'vue';
import {getActivityConfig} from '../../config/activities/index.js';
import {createPlanner} from '../../core/weekly-planner.js';
import {createPreviewState,activityPreview,resetPreview} from '../../core/activity-preview.js';
const props=defineProps({activityId:{type:String,required:true}});
const config=getActivityConfig(props.activityId),planner=createPlanner(config),isCombat=config.cost.kind==='combat';
const state=reactive(createPreviewState(config)),showHelp=ref(false);
const num=v=>Math.max(0,Math.min(1e9,Math.trunc(Number(v)||0)));
const view=computed(()=>activityPreview(planner,state));
const endpoints=computed(()=>view.value.rows.filter(r=>r.end));
const safeFor=r=>view.value.safeRows.find(s=>s.progress===r.progress);
const goodsFor=layer=>planner.goods.filter(g=>g.layer===layer);
const costNote=isCombat?`每个敌人预计消耗约${planner.attackCost('expected').toFixed(3)}${config.material.name}，保守${planner.attackCost('safe')}个，预计值不保证达成。`:`每次消耗${config.cost.perAction}${config.material.name}。`;
function setStock(e){state.stock=num(e.detail.value);resetPreview(state)}
function setWeekly(e){state.weekly=e.detail.value.includes('weekly');resetPreview(state)}
function setWeeklyCurrency(e){state.weeklyCurrency=num(e.detail.value);resetPreview(state)}
function selectRound(progress){state.preview=progress;state.purchases={}}
function change(g,delta){const current=state.purchases[g.id]||0;if(delta>0&&(view.value.spent<g.unlock||view.value.wallet<g.price||current>=g.limit))return;state.purchases={...state.purchases,[g.id]:Math.max(0,current+delta)}}
</script>
<style scoped>
.page{padding:20px 12px;color:#214c3e}.page-heading{display:flex;align-items:center;justify-content:space-between;margin:6px 0 16px}.title{font-size:26px;font-weight:600}.heading{font-size:20px;font-weight:600}.help{font-size:12px;color:#64816d}.card{background:#fff;border:1px solid #e1e9e3;border-radius:14px;padding:16px;margin-bottom:20px}.inventory-line{display:flex;align-items:center;justify-content:space-between;gap:8px}.resource-label{display:flex;align-items:center;font-size:13px;gap:4px}.material-icon{width:24px;height:24px;flex-shrink:0}.stock-box{display:flex;align-items:center;background:#f3f8f4;border:1px solid #bad0c0;border-radius:9px;padding:4px 8px;max-width:115px}.stock-box input{width:80px;height:36px;font-size:27px;color:#28553f}.stock-box text{font-size:13px}.weekly-option{display:flex;align-items:center;flex-wrap:wrap;font-size:11px;gap:3px;margin-top:14px;color:#64816d}.weekly-option label{display:flex;align-items:center}.weekly-option checkbox{transform:scale(.7);margin-left:-6px}.weekly-input{width:42px;font-size:13px;color:#315740;border-bottom:1px solid #c4d5c7;height:26px}.hint{font-size:11px;color:#86978b;line-height:1.8;margin:9px 0}.round-scroll{white-space:nowrap;margin-top:14px}.round-list{display:flex;gap:8px;padding:2px}.round-card{flex-shrink:0;width:151px;border:1px solid #dce7de;border-radius:9px;padding:12px 10px;background:#f5f8f5;white-space:normal}.selected-round{border:2px solid #54745b;padding:11px 9px}.round-title{display:flex;align-items:center;justify-content:space-between;font-size:14px;font-weight:600;margin-bottom:14px}.round-title text{font-size:9px;color:#64816d;font-weight:400}.metric{display:flex;align-items:center;justify-content:space-between;font-size:10px;color:#718475;margin:8px 0}.number{font-size:22px;font-weight:600;color:#315740}.currency-metric{border-top:1px solid #dce7de;padding-top:10px}.currency-metric text+text{color:#a07b43;font-size:17px;font-weight:600}.gap{font-size:10px;line-height:1.6}.short{color:#ad7640}.enough{color:#4d8b66}.wallet{display:flex;align-items:center;gap:8px;background:#e5eee5;border:1px solid #bfcfbe;border-radius:9px;padding:9px;font-size:10px}.wallet .wallet-value{flex:1;min-width:30px;font-size:24px;color:#28553f}.wallet>text{color:#7a8a7d}.shop-layer{padding:12px}.layer-heading{display:flex;align-items:center;justify-content:space-between;font-size:17px;font-weight:600;margin-bottom:10px}.layer-heading text{font-size:10px;color:#8a9b7d;font-weight:400}.goods{display:flex;align-items:center;gap:7px;padding:10px 0;border-top:1px solid #ecf1ed}.icon{width:46px;height:46px;flex-shrink:0}.info{flex:1;min-width:0;font-size:12px}.stepper{display:flex;align-items:center;gap:7px}.stepper button{padding:0;width:25px;height:28px;line-height:26px;font-size:17px;background:#edf4ee;color:#54745b}.stepper text{font-size:13px}.stepper button[disabled]{opacity:.4}.footer{text-align:center}
.stock-box:focus-within,.wallet:focus-within{border-color:#7c9f88;background:#eff6f0}.stock-box input,.wallet input,.weekly-input{outline:none}
</style>
