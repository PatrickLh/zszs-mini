import {test} from 'node:test';
import assert from 'node:assert/strict';
import {activityConfigs,getActivityConfig} from '../config/activities/index.js';
import {createPlanner} from './weekly-planner.js';
import {createPreviewState,activityPreview,resetPreview} from './activity-preview.js';
const config=getActivityConfig('pomu-wufa'),planner=createPlanner(config);
test('weekly defaults fund the treasury even before any stage is reachable',()=>{
 const state=createPreviewState(config);state.stock=0;
 const view=activityPreview(planner,state);
 assert.equal(view.earned,0);assert.equal(view.wallet,42);
 state.weeklyCurrency=70;assert.equal(activityPreview(planner,state).wallet,70);
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
 for(const c of activityConfigs){const state=createPreviewState(c);state.stock=0;assert.equal(state.weeklyCurrency,42);assert.equal(activityPreview(createPlanner(c),state).wallet,42)}
});
