<template>
 <view class="page">
  <view class="eyebrow">宗师之上 / 周活动规划</view><view class="title">材料先算好，修行心中有数。</view><view class="desc">破木悟法 · 七轮挑战与五层宝库</view>
  <view class="card"><view class="heading">我的行囊</view><view class="label">现有行功散</view><input class="stock" type="number" v-model="stock"/>
   <view class="modes"><button :class="{active:mode==='expected'}" @click="mode='expected'">预计用量</button><button :class="{active:mode==='safe'}" @click="mode='safe'">保守用量</button></view>
   <view class="hint">{{mode==='safe'?'按全程不暴击计算':'每个木人平均5.139次攻击，预计结果不保证达成'}}</view>
   <view class="fields"><view><text>累计击败数</text><input type="number" v-model="kills"/></view><view><text>现有残页</text><input type="number" v-model="pages"/></view></view>
   <view class="hint">已击败档位按奖励全部领取处理；宝库按本期尚未兑换规划。</view>
  </view>
  <view class="summary"><view><text>预计可达完整轮次</text><view class="big">{{ reachable }} 轮</view></view><view><text>下一轮还需准备</text><view class="big">{{ next ? next.gap : 0 }} <text>散</text></view></view></view>
  <view class="card"><view class="heading">阶段材料规划</view><view class="toggle" @click="all=!all">{{all?'只看每轮终点':'展开全部任务档位'}}</view>
   <view v-for="r in rows" :key="r.kills" class="stage"><view class="stage-head"><text>第 {{r.round}} 轮{{r.end?'完成':''}} · {{r.kills}} 敌人</text><text :class="r.gap?'short':'enough'">{{r.gap?'缺 '+r.gap+' 散':'已足够'}}</text></view><view class="hint">累计消耗 {{r.cost}} · 途中返还 {{r.refund}} · 残页结余 {{r.pages}}</view></view>
   <view class="hint">缺口已计入任务及兑换返还；木人直接掉落不计入。</view>
  </view>
  <view class="card"><view class="heading">宝库怎么换，你来决定</view><view class="hint">解锁且残页足够时，按层数和展示顺序立即兑换，不自动购买前置商品。</view>
   <view class="tabs"><text v-for="l in 5" :key="l" :class="{chosen:layer===l}" @click="layer=l">第{{l}}层</text></view>
   <view class="hint">累计消耗 {{[0,100,300,600,1000][layer-1]}} 残页解锁 · 每次返还 {{layer}} 散</view>
   <view v-for="g in layerGoods" :key="g.id" class="goods"><view class="icon">{{g.name[0]}}</view><view class="info"><view>{{g.name}} ×{{g.amount}}</view><view class="hint">{{g.price}} 残页 · 限购{{g.limit}}</view></view><view class="stepper"><button @click="change(g,-1)">−</button><text>{{selected[g.id]||0}}</text><button @click="change(g,1)">+</button></view></view>
   <view class="hint">已选 {{selectedCount}} 次兑换 · 总花费 {{selectedCost}} 残页</view><view class="hint" v-if="result.pending.length">部分兑换无法执行，请检查解锁门槛和残页余额。</view><button class="clear" @click="selected={}">清空兑换选择</button>
  </view><view class="desc footer">当前截图版本 · 玩家规划工具 · 图标暂用占位</view>
 </view>
</template>
<script setup>
import {ref,computed} from 'vue';
import {simulate,goods} from '../../../core/planner.js';
const stock=ref(330),kills=ref(0),pages=ref(0),mode=ref('expected'),selected=ref({}),layer=ref(1),all=ref(false);
const num=(v,max)=>Math.max(0,Math.min(max,Math.trunc(Number(v)||0)));
const result=computed(()=>simulate({stock:num(stock.value,1000000),kills:num(kills.value,500),pages:num(pages.value,1000000),mode:mode.value,selected:selected.value}));
const rows=computed(()=>result.value.rows.filter(r=>all.value||r.end));
const reachable=computed(()=>result.value.rows.filter(r=>r.end&&r.gap===0).at(-1)?.round||0);
const next=computed(()=>result.value.rows.find(r=>r.end&&r.gap>0));
const layerGoods=computed(()=>goods.filter(g=>g.layer===layer.value));
const selectedCount=computed(()=>Object.values(selected.value).reduce((a,b)=>a+b,0));
const selectedCost=computed(()=>goods.reduce((a,g)=>a+(selected.value[g.id]||0)*g.price,0));
function change(g,delta){selected.value={...selected.value,[g.id]:num((selected.value[g.id]||0)+delta,g.limit)}}
</script>
<style scoped>
.page{padding:24px 16px}.eyebrow{font-size:13px;color:#789182;letter-spacing:2px}.title{font-size:32px;line-height:1.45;font-weight:600;margin:16px 0;color:#214c3e}.desc{font-size:13px;color:#81958a;margin-bottom:24px}.card{padding:20px;background:#fff;border:1px solid #e1e9e3;border-radius:16px;margin-bottom:20px}.heading{font-size:19px;font-weight:600;margin-bottom:18px}.label{font-size:14px;color:#71887a}.stock{height:68px;background:#f3f8f4;border:1px solid #bad0c0;border-radius:10px;padding:10px 16px;font-size:36px;color:#28553f;margin-top:12px}.modes{display:flex;background:#eff4f0;padding:4px;border-radius:8px;margin-top:20px}.modes button{flex:1;background:transparent;font-size:14px;color:#839488;line-height:38px}.modes .active{background:#fff;color:#2e654b}.hint{font-size:12px;color:#86978b;line-height:1.9;margin:8px 0}.fields{display:flex;gap:16px;margin-top:15px}.fields>view{flex:1;min-width:0}.fields text{font-size:13px;color:#718475}.fields input{height:40px;border:1px solid #dce7de;border-radius:6px;margin-top:8px;padding:8px}.summary{display:flex;gap:12px;margin-bottom:20px}.summary>view{flex:1;background:#214c3e;border-radius:12px;padding:18px;color:#fff}.summary>view+view{background:#fff;color:#315740;border:1px solid #e0e9e1}.summary text{font-size:12px;opacity:.8}.big{font-size:28px;margin-top:9px}.toggle{font-size:13px;color:#5c8469;margin-bottom:16px}.stage{padding:15px 0;border-bottom:1px solid #ecf1ed}.stage-head{display:flex;justify-content:space-between;font-size:14px;gap:8px}.short{color:#ad7640}.enough{color:#4d8b66}.tabs{display:flex;justify-content:space-between;border-bottom:1px solid #e2eae3;padding:12px 0}.tabs text{font-size:14px;color:#8d9a90}.tabs .chosen{color:#2e654b;font-weight:600}.goods{display:flex;align-items:center;gap:8px;border:1px solid #e4ece5;border-radius:9px;padding:12px 8px;margin:10px 0}.icon{width:35px;height:40px;background:#edf1e5;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#92a17e}.info{flex:1;min-width:0;font-size:13px}.stepper{display:flex;align-items:center;gap:8px}.stepper button{padding:0;width:27px;height:30px;line-height:28px;font-size:18px;background:#f0f5ef;color:#56785d}.stepper text{font-size:14px}.clear{background:#edf4ee;color:#54745b;font-size:14px;margin-top:14px}.footer{text-align:center;line-height:2}
</style>
