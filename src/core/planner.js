// Compatibility API for existing callers; defaults now come from the same editable activity profile.
import { getActivityConfig } from '../config/activities/index.js';
import { createPlanner } from './weekly-planner.js';
const planner = createPlanner(getActivityConfig('pomu-wufa'));
export const goods = planner.goods;
export const rounds = planner.config.rounds.map(r => r.stages.map(s => s.progress));
export const milestones = planner.milestones.map(s => ({ ...s, kills: s.progress, pills: s.materialReward, pages: s.currencyReward }));
export const packs = [[6,10,10,3],[30,20,30,2],[68,40,50,2],[128,50,100,5],[198,60,120,5],[328,80,160,10],[648,100,300,12]];
export function expectedHits(units = 6) {
  const e = [0];
  for (let i = 1; i <= units; i++) e[i] = 1 + .8 * e[Math.max(0, i - 1)] + .2 * e[Math.max(0, i - 2)];
  return e[units];
}
export function simulate({ stock=0, pages=0, kills=0, health=60, mode='expected', selected={}, dailyFree=0, dailyPaid=0, packCounts=[] } = {}) {
  let extraPills = dailyFree + dailyPaid * 3, extraPages = (dailyFree + dailyPaid) * 2, money = 0;
  packs.forEach(([price,p,q,limit], i) => {
    const n = Math.min(limit, Math.max(0, Math.trunc(packCounts[i] || 0)));
    extraPills += p*n; extraPages += q*n; money += price*n;
  });
  const result = planner.simulate({stock:stock+extraPills,currency:pages+extraPages,progress:kills,health,mode,selected});
  return {...result, rows:result.rows.map(r=>({...r,kills:r.progress,pills:r.materialReward,pages:r.currency,required:Math.max(0,r.required-extraPills)})), money,extraPills,extraPages};
}
