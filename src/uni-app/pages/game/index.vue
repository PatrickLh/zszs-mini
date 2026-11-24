<template>
 <view class="game-page"><view class="title">宗师之上</view><view class="subtitle">选择规划工具，安排本期修行</view>
 <view class="tool" @click="openPlanner"><view class="tool-title">周活动规划<text>›</text></view><view class="description">山海灵宝 · 破木悟法 · 鉴石大会</view><view class="note">材料需求、礼包组合与宝库兑换一站筹算</view><button @click.stop="openPlanner">进入规划</button></view></view>
</template>
<script setup>
function openPlanner(){uni.navigateTo({url:'/pages/planner/index'})}
</script>
<style scoped>
.game-page{padding:28px 18px;color:#214c3e}.title{font-size:28px;font-weight:600}.subtitle{margin-top:12px;font-size:13px;color:#819487}.tool{margin-top:28px;padding:22px 18px;border:1px solid #dce7de;border-radius:16px;background:#fff}.tool-title{display:flex;justify-content:space-between;font-size:21px;font-weight:600}.tool-title text{color:#819487}.description{font-size:13px;color:#64816d;margin-top:18px}.note{font-size:12px;color:#8b9b8e;margin-top:10px;line-height:1.8}button{margin-top:22px;background:#edf4ee;color:#315740;font-size:14px;border-radius:9px}
</style>
