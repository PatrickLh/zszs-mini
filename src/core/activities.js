import { activityConfigs } from '../config/activities/index.js';
import { createPlanner } from './weekly-planner.js';
const routes = { 'pomu-wufa': '/pages/pomu/index', 'shanhai-lingbao': '/pages/shanhai/index', 'jianshi-dahui': '/pages/jianshi/index' };
export const activities = activityConfigs.map(config => ({
  id: config.id, name: config.name, status: 'ready', route: routes[config.id],
  materials: { stock: config.material.name, currency: config.currency.name }, calculator: createPlanner(config), config,
}));
