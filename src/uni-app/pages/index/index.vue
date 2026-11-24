<template>
 <view class="home">
  <view class="eyebrow">游戏规划助手</view>
  <view class="title">选择你的游戏</view>
  <view class="subtitle">活动筹算、材料规划与奖励兑换</view>
  <view v-for="game in games" :key="game.id" class="game-card" @click="openGame(game)">
   <image class="game-icon" src="/static/zszs-entry.png" mode="aspectFit"/><view class="game-info"><view class="game-name">{{game.name}}</view><view class="description">{{game.description}}</view></view><text class="arrow">›</text>
  </view>
  <view class="coming">更多游戏，敬请期待</view>
 </view>
</template>
<script setup>
const games=[{id:'zszs',name:'宗师之上',description:'修行有数，资源有方',route:'/pages/game/index'}];
function openGame(game){uni.navigateTo({url:game.route})}
</script>
<style scoped>
.home{padding:32px 20px;color:#214c3e}.eyebrow{font-size:12px;color:#819487;letter-spacing:2px}.title{font-size:28px;font-weight:600;margin-top:12px}.subtitle{font-size:13px;color:#819487;margin-top:12px}.game-card{display:flex;align-items:center;gap:14px;margin-top:30px;padding:22px 18px;background:#fff;border:1px solid #dce7de;border-radius:16px}.game-icon{display:flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:14px;background:#e7efdf;color:#527047;font-size:28px;font-weight:600}.game-info{flex:1}.game-name{font-size:20px;font-weight:600}.description{font-size:12px;color:#819487;margin-top:8px}.arrow{font-size:28px;color:#819487}.coming{text-align:center;color:#9ba99f;font-size:12px;margin-top:28px}
</style>
