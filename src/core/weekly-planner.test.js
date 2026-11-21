import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {activityConfigs,getActivityConfig} from '../config/activities/index.js';
import {createPlanner,validateActivity} from './weekly-planner.js';
const shanhai=getActivityConfig('shanhai-lingbao');

test('all three defaults have complete source-backed stages and packaged configurable images',()=>{
  assert.equal(activityConfigs.length,3);
  for(const c of activityConfigs){
    validateActivity(c);assert.equal(c.rounds.length,7);assert.equal(c.shop.goods.length,15);
    assert.equal(c.version.shopWorldDay,181);
    for(const x of [c.material,c.currency,...c.shop.goods,...(c.secondaryMaterial?[c.secondaryMaterial]:[])])
      assert.ok(existsSync(fileURLToPath(new URL('../uni-app'+x.image,import.meta.url))),x.name);
  }
});
test('draw planners require materials before granting stage and completion rewards',()=>{
  for(const id of ['shanhai-lingbao','jianshi-dahui']){
    const p=createPlanner(getActivityConfig(id)),r=p.simulate().rows;
    assert.equal(r[0].required,4);assert.equal(r[0].gap,4);
    assert.equal(r[5].progress,60);assert.equal(r[5].required,55);
    assert.equal(r[5].currency,320);assert.equal(r[5].refund,6);
    assert.equal(r.at(-1).progress,1370);
    assert.equal(p.simulate({stock:55}).rows[5].gap,0);
  }
});
test('ordinary and limited tickets combine; other activities cannot gain phantom limited stock',()=>{
  const p=createPlanner(shanhai);
  assert.equal(p.simulate({stock:30,secondaryStock:25}).rows[5].gap,0);
  assert.deepEqual(p.simulate({stock:30,secondaryStock:25}),p.simulate({stock:55}));
  assert.equal(createPlanner(getActivityConfig('jianshi-dahui')).simulate({secondaryStock:999}).rows[0].gap,4);
});
test('completed tasks and their completion rewards cannot be claimed twice',()=>{
  const p=createPlanner(shanhai),r=p.simulate({progress:60}).rows;
  assert.equal(r[0].progress,72);assert.equal(r[0].required,12);
  assert.equal(r[0].refund,1);assert.equal(r[0].currency,50);
  assert.deepEqual(p.simulate({progress:p.maximum}).rows,[]);
});
test('changing rotating product name, image and amount preserves material economics',()=>{
  const changed=structuredClone(shanhai);Object.assign(changed.shop.goods[0],{name:'下一期宝物',image:'/static/custom/new.png',amount:999});
  const input={stock:30,currency:100,selected:{'0-0':2}};
  assert.deepEqual(createPlanner(shanhai).simulate(input).rows,createPlanner(changed).simulate(input).rows);
  assert.equal(createPlanner(changed).simulate(input).shopping[0].name,'下一期宝物');
});
test('exchange requires cumulative spend and cannot borrow future stage currency',()=>{
  const p=createPlanner(shanhai);
  const locked=p.simulate({selected:{'1-0':1}});
  assert.equal(locked.shopping.length,0);assert.equal(locked.pending[0].count,1);
  assert.equal(locked.rows[0].required,4);
  const exchanged=p.simulate({currency:150,selected:{'0-0':2,'1-0':1}});
  assert.equal(exchanged.initial.spent,100);assert.equal(exchanged.initial.refund,2);
  assert.equal(exchanged.initial.currency,50);assert.equal(exchanged.rows[0].required,2);
  assert.equal(exchanged.rows[0].spent,160);assert.equal(exchanged.rows[0].purchases,3);
});
test('required material is independent of surplus starting inventory',()=>{
  const p=createPlanner(shanhai);
  assert.equal(p.simulate({stock:999}).rows[5].required,p.simulate().rows[5].required);
  assert.equal(p.simulate({stock:999}).rows[5].gap,0);
});
test('completed activities can still plan exchanges using existing currency',()=>{
  const p=createPlanner(shanhai),r=p.simulate({progress:p.maximum,currency:150,selected:{'0-0':2}});
  assert.equal(r.initial.currency,50);assert.equal(r.initial.spent,100);assert.equal(r.shopping.length,2);
});
test('invalid rotation configurations fail with an actionable error',()=>{
  const c=structuredClone(shanhai);c.shop.goods[1].id=c.shop.goods[0].id;
  assert.throws(()=>createPlanner(c),/商品 ID 重复/);
  const d=structuredClone(shanhai);d.rounds[0].stages[1].progress=1;
  assert.throws(()=>createPlanner(d),/任务累计进度必须递增/);
});
