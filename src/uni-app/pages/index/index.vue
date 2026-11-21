<template>
  <view class="page">
    <view class="title">宗师之上 · 周活动</view>
    <view class="hint">选择活动，规划材料与阶段奖励</view>
    <view v-for="activity in activities" :key="activity.id" class="card">
      <view class="name">{{ activity.name }}</view>
      <view class="hint">{{ activity.status === 'ready' ? '材料规划与宝库兑换' : '等待活动材料与计算规则' }}</view>
      <button :disabled="activity.status !== 'ready'" @click="open(activity)">{{ activity.status === 'ready' ? '进入规划' : '待开放' }}</button>
    </view>
  </view>
</template>
<script setup>
import { activities } from '../../../core/activities.js';
function open(activity) {
  if (activity.status === 'ready' && activity.route) uni.navigateTo({ url: activity.route });
}
</script>
<style scoped>
.page{padding:24px 16px}.title{font-size:25px;font-weight:600;color:#214c3e}.hint{font-size:13px;color:#71887a;margin:12px 0;line-height:1.8}.card{padding:20px;background:#fff;border:1px solid #e1e9e3;border-radius:16px;margin-top:20px}.name{font-size:19px;font-weight:600}button{background:#edf4ee;color:#315740;font-size:14px}
</style>
