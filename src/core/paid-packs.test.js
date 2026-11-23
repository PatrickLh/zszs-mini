import {test} from 'node:test';
import assert from 'node:assert/strict';
import {activityConfigs,getActivityConfig} from '../config/activities/index.js';
import {createPlanner,validateActivity} from './weekly-planner.js';
import {createPreviewState,activityPreview,paidPackTotals,setPaidPack,resetPreview} from './activity-preview.js';

const prices=[6,30,68,128,198,328,648],currencies=[10,30,50,100,120,160,300],limits=[3,2,2,5,5,10,12];
test('matching APK activities share direct currency but retain their own materials and event limits',()=>{
 for(const config of activityConfigs){
  assert.deepEqual(config.paidPacks.map(p=>p.price),prices);
  assert.deepEqual(config.paidPacks.map(p=>p.currency),currencies);
  assert.deepEqual(config.paidPacks.map(p=>p.limit),limits);
  assert.deepEqual(config.paidPacks.map(p=>p.material),config.cost.kind==='combat'?[10,20,40,50,60,80,100]:[5,10,20,25,30,40,50]);
 }
});
test('a selected pack grants direct coins once and its materials earn task coins at reachable stages',()=>{
 for(const config of activityConfigs){
  const planner=createPlanner(config),state=createPreviewState(config);state.stock=0;
  setPaidPack(config,state,config.paidPacks[0].id,1);
  const view=activityPreview(planner,state);
  assert.equal(view.paid.money,6);assert.equal(view.paid.currency,10);
  assert.equal(view.earned,40);assert.equal(view.paidTaskCurrency,40);assert.equal(view.wallet,92);
  assert.equal(state.stock,0);assert.equal(view.totalStock,config.paidPacks[0].material);
 }
});
test('combined price tiers move material thresholds without converting leftover materials at a fixed rate',()=>{
 const config=getActivityConfig('shanhai-lingbao'),planner=createPlanner(config),state=createPreviewState(config);state.stock=0;
 setPaidPack(config,state,config.paidPacks[0].id,1);setPaidPack(config,state,config.paidPacks[1].id,1);
 const view=activityPreview(planner,state);
 assert.equal(view.paid.money,36);assert.equal(view.totalStock,15);assert.equal(view.paid.currency,40);
 assert.equal(view.earned,80);assert.equal(view.paidTaskCurrency,80);assert.equal(view.wallet,162);
 const plain=planner.simulate({stock:0}).rows;
 assert.deepEqual(view.rows.map(r=>r.required),plain.map(r=>r.required));
});
test('paid input is capped to the configured limits and ignores unknown pack IDs',()=>{
 const config=getActivityConfig('pomu-wufa'),id=config.paidPacks.at(-1).id;
 const totals=paidPackTotals(config,{[id]:999,unknown:100});
 assert.equal(totals.count,12);assert.equal(totals.money,7776);assert.equal(totals.material,1200);assert.equal(totals.currency,3600);
 assert.equal(paidPackTotals(config,{[id]:-2}).money,0);
 assert.equal(paidPackTotals(config,{[id]:'invalid'}).money,0);
 assert.equal(paidPackTotals(config,{[id]:1.9}).count,1);
});
test('changing a combination clears hypothetical rounds and stale exchanges while keeping existing stock',()=>{
 const config=getActivityConfig('pomu-wufa'),state=createPreviewState(config);
 state.preview=15;state.purchases={'0-0':3};setPaidPack(config,state,config.paidPacks[0].id,1);
 assert.equal(state.preview,null);assert.deepEqual(state.purchases,{});assert.equal(state.stock,330);
 resetPreview(state);assert.equal(state.paidPacks[config.paidPacks[0].id],1);
});
test('hypothetical round preview adds direct pack coins and flags the remaining shortfall',()=>{
 const config=getActivityConfig('shanhai-lingbao'),planner=createPlanner(config),state=createPreviewState(config);state.stock=0;
 setPaidPack(config,state,config.paidPacks[0].id,1);state.preview=60;state.purchases={'0-0':1};
 const view=activityPreview(planner,state);
 assert.equal(view.budget,372);assert.equal(view.spent,50);assert.equal(view.wallet,322);
 assert.equal(view.previewGap,50);assert.equal(view.paidTaskCurrency,40);
});
test('no combinations preserves the zero-spend result and clearing restores material-linked currency',()=>{
 for(const config of activityConfigs){
  const planner=createPlanner(config),state=createPreviewState(config),before=activityPreview(planner,state);
  assert.equal(before.paid.money,0);assert.equal(before.paidTaskCurrency,0);
  setPaidPack(config,state,config.paidPacks[0].id,2);
  state.paidPacks={};resetPreview(state);
  assert.deepEqual(activityPreview(planner,state),before);
 }
});
test('paid packs remain optional and configurable, with invalid amounts rejected early',()=>{
 const config=structuredClone(getActivityConfig('jianshi-dahui'));delete config.paidPacks;
 assert.doesNotThrow(()=>validateActivity(config));assert.equal(paidPackTotals(config).count,0);
 const custom=structuredClone(getActivityConfig('jianshi-dahui'));custom.paidPacks[0].material=100;custom.paidPacks[0].currency=200;
 const state=createPreviewState(custom);state.stock=0;setPaidPack(custom,state,custom.paidPacks[0].id,1);
 const view=activityPreview(createPlanner(custom),state);assert.equal(view.paid.material,100);assert.equal(view.paid.currency,200);assert.ok(view.earned>=320);
 custom.paidPacks[0].material=-1;assert.throws(()=>validateActivity(custom),/礼包材料/);
});
