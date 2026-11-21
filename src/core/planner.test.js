import {test} from 'node:test';import assert from 'node:assert/strict';import {simulate,expectedHits} from './planner.js';
test('exact expected attacks accounts for overkill',()=>assert.equal(expectedHits(),5.13888));
test('must reach milestone before using its refund',()=>{const r=simulate({mode:'safe'}).rows;assert.equal(r[0].gap,6);assert.equal(r[1].gap,17);assert.equal(r[5].gap,85)});
test('stock reduces starting shortfall',()=>assert.equal(simulate({stock:85,mode:'safe'}).rows[5].gap,0));
test('shopping requires cumulative spend and currency',()=>{const s=simulate({pages:300,selected:{'0-0':2,'1-0':1,'2-1':1},mode:'safe'});assert.equal(s.rows[0].purchases,3);assert.equal(s.rows[0].spent,175)});
test('completed milestones not rewarded again',()=>{const s=simulate({kills:15,mode:'safe'});assert.equal(s.rows[0].kills,17);assert.equal(s.rows[0].gap,12)});
