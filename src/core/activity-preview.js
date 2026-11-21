// The simple UI plans materials first and simulates treasury spending separately.
export function createPreviewState(config) {
  return { stock: config.defaultStock, weekly: true, weeklyCurrency: config.weeklyBonusCurrency,
    preview: null, purchases: {} };
}
export function resetPreview(state) {
  state.preview = null; state.purchases = {};
}
export function activityPreview(planner, state) {
  const stock = Math.max(0, Math.min(1e9, Math.trunc(Number(state.stock) || 0)));
  const result = planner.simulate({stock});
  const safe = planner.config.cost.kind === 'combat' ? planner.simulate({stock, mode:'safe'}) : result;
  const row = state.preview === null ? result.rows.filter(r => r.gap === 0).at(-1) : result.rows.find(r => r.progress === state.preview);
  const base = state.weekly ? Math.max(0, Math.trunc(Number(state.weeklyCurrency) || 0)) : 0;
  const earned = row?.currency || 0;
  const budget = earned + base;
  const spent = planner.goods.reduce((sum, g) => sum + (state.purchases[g.id] || 0) * g.price, 0);
  const refund = planner.goods.reduce((sum, g) => sum + (state.purchases[g.id] || 0) * g.refund, 0);
  return {rows: result.rows, safeRows: safe.rows, base, earned, spent, refund, budget, wallet: Math.max(0, budget - spent)};
}
