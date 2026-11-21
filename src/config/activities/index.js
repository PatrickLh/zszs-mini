import pomu from './pomu.json' with { type: 'json' };
import shanhai from './shanhai.json' with { type: 'json' };
import jianshi from './jianshi.json' with { type: 'json' };

export const activityConfigs = [shanhai, pomu, jianshi];
export function getActivityConfig(id) {
  const config = activityConfigs.find(activity => activity.id === id);
  if (!config) throw new Error(`未知活动：${id}`);
  return config;
}
