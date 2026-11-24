<template>
 <view>
  <view class="activity-tabs"><view class="tab-indicator" :style="{transform:`translateX(${activeIndex * 100}%)`}"/><button v-for="activity in activities" :key="activity.id" :class="['activity-tab',{active:activeId===activity.id}]" @click="switchActivity(activity.id)">{{activity.name}}</button></view>
  <view v-for="activity in activities" v-show="activeId===activity.id" :key="activity.id" class="activity-panel"><ActivityPlanner :activity-id="activity.id"/></view>
 </view>
</template>
<script setup>
import {ref,computed} from 'vue';
import {activities} from '../../core/activities.js';
import ActivityPlanner from './ActivityPlanner.vue';
const props=defineProps({initialActivity:{type:String,default:'shanhai-lingbao'}});
const activeId=ref(activities.some(a=>a.id===props.initialActivity)?props.initialActivity:activities[0].id);
const activeIndex=computed(()=>activities.findIndex(a=>a.id===activeId.value));
function switchActivity(id){if(activeId.value!==id)activeId.value=id}
</script>
<style scoped>
.activity-tabs{position:relative;display:flex;gap:0;margin:16px 12px 0;padding:5px;border:1px solid #dce7de;border-radius:12px;background:#eaf1eb}.activity-tab{position:relative;z-index:1;transition:color .22s ease;flex:1;min-width:0;margin:0;padding:10px 3px;border-radius:8px;background:transparent;color:#718475;font-size:14px;line-height:22px}.activity-tab.active{background:transparent;color:#315740;font-weight:600}

.tab-indicator{position:absolute;top:5px;bottom:5px;left:5px;width:calc((100% - 10px) / 3);border-radius:8px;background:#fff;box-shadow:0 2px 6px #25473512;transition:transform .24s cubic-bezier(.22,.61,.36,1);pointer-events:none}
.activity-panel{animation:activity-enter .24s ease-out both}
@keyframes activity-enter{from{opacity:.35;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
@media(prefers-reduced-motion:reduce){.tab-indicator,.activity-tab{transition:none}.activity-panel{animation:none}}
</style>
