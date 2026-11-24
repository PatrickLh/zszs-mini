import {test} from 'node:test';
import assert from 'node:assert/strict';
import {activityConfigs,getActivityConfig} from '../config/activities/index.js';
import {createPlanner} from './weekly-planner.js';
import {createPreviewState,activityPreview,resetPreview} from './activity-preview.js';
const config=getActivityConfig('pomu-wufa'),planner=createPlanner(config);
test('remaining days scale attached currency and the checkbox excludes it',()=>{
 const state=createPreviewState(config);state.stock=0;state.remainingDays=3;
 const view=activityPreview(planner,state);
 assert.equal(view.base,18);
 state.weeklyCurrency=70;assert.equal(activityPreview(planner,state).base,30);
 state.weekly=false;assert.equal(activityPreview(planner,state).wallet,0);
});
test('wallet automatically combines round rewards and weekly currency, then deducts exchange once',()=>{
 const state=createPreviewState(config);state.preview=15;state.purchases={'0-0':2};
 const view=activityPreview(planner,state);assert.equal(view.wallet,262);assert.equal(view.spent,100);
 state.weeklyCurrency=70;assert.equal(activityPreview(planner,state).wallet,290);
});
test('treasury exchanges do not alter the established round requirement cards',()=>{
 const state=createPreviewState(config),before=activityPreview(planner,state);
 state.purchases={'0-0':3,'0-1':2};
 const after=activityPreview(planner,state);assert.deepEqual(after.rows,before.rows);assert.deepEqual(after.safeRows,before.safeRows);
 assert.equal(after.refund,5);
});
test('selecting a round includes weekly currency and resetting restores inventory linkage',()=>{
 const state=createPreviewState(config);state.preview=15;
 assert.equal(activityPreview(planner,state).wallet,320+42);
 state.purchases={'0-0':1};resetPreview(state);
 assert.equal(state.preview,null);assert.deepEqual(state.purchases,{});
 assert.equal(state.stock,config.defaultStock);
});

test('activities follow the weekly rotation and all start with 42 extra weekly currency',()=>{
 assert.deepEqual(activityConfigs.map(c=>c.id),['shanhai-lingbao','pomu-wufa','jianshi-dahui']);
 for(const c of activityConfigs){const state=createPreviewState(c);assert.equal(state.weeklyCurrency,42);assert.equal(activityPreview(createPlanner(c),state).base,42)}
});

test('mid-cycle planning excludes claimed rewards and combines future free material',()=>{
 for(const config of activityConfigs){
 const planner=createPlanner(config),state=createPreviewState(config);
 assert.equal(state.stock,0);
 assert.equal(activityPreview(planner,state).futureFree,7);
 state.progress=planner.milestones[0].progress;state.currentCurrency=100;state.remainingDays=3;state.weeklyCurrency=0;
 const view=activityPreview(planner,state);
 assert.equal(view.futureFree,3);assert.equal(view.totalStock,21);
 assert(view.rows.every(r=>r.progress>state.progress));
 assert.deepEqual(view.rows,planner.simulate({stock:21,progress:state.progress}).rows);
 assert.equal(view.budget,100+view.earned);
 state.progress=planner.maximum;
 const done=activityPreview(planner,state);assert.equal(done.earned,0);assert.equal(done.wallet,100);
 }
});

test('55 shanhai tickets finish round one and its refunds reduce round two shortfall',()=>{
 const c=getActivityConfig('shanhai-lingbao'),s=createPreviewState(c);s.stock=55;s.remainingDays=0;
 const v=activityPreview(createPlanner(c),s),ends=v.rows.filter(r=>r.end);
 assert.equal(ends[0].required,55);assert.equal(ends[0].gap,0);
 assert.equal(ends[0].refund,6);assert.equal(ends[0].remaining,1);
 assert.equal(ends[1].required,124);assert.equal(ends[1].gap,69);
 s.progress=60;s.stock=1;
 const next=activityPreview(createPlanner(c),s).rows.find(r=>r.end);
 assert.equal(next.gap,69);
});

test('three shanhai days include free and planned spirit jade tickets',()=>{
 const config=getActivityConfig('shanhai-lingbao'),planner=createPlanner(config),state=createPreviewState(config);
 state.remainingDays=3;
 const planned=activityPreview(planner,state);
 assert.equal(planned.futureFree,3);
 assert.equal(planned.futurePurchased,18);
 assert.equal(planned.base,18);
 assert.equal(planned.rows.find(row=>row.end).gap,34);
 state.weekly=false;
 state.remainingDays=7;
 const excluded=activityPreview(planner,state);
 assert.equal(excluded.totalStock,0);
 assert.equal(excluded.wallet,0);
 assert.equal(excluded.rows.find(row=>row.end).gap,55);
});
