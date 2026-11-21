import * as pomu from './planner.js';

// Each activity owns its materials and calculator; unknown rules stay unavailable.
export const activities = [
  { id: 'pomu-wufa', name: '破木悟法', status: 'ready', route: '/pages/pomu/index', materials: { stock: '行功散', currency: '残页' }, calculator: pomu },
  { id: 'weekly-2', name: '周活动二（待补充）', status: 'pending', route: null, materials: null, calculator: null },
  { id: 'weekly-3', name: '周活动三（待补充）', status: 'pending', route: null, materials: null, calculator: null },
];
