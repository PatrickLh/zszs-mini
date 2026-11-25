// The simple UI plans materials first and simulates treasury spending separately.
export function createPreviewState(config) {
  return { stock: 0, progress: 0, currentCurrency: 0, remainingDays: 7, weekly: true, weeklyCurrency: config.weeklyBonusCurrency,
    preview: null, purchases: {}, paidPacks: {} };
}
export function paidPackTotals(config, counts = {}) {
  const result = { money: 0, material: 0, currency: 0, count: 0, counts: {} };
  for (const pack of config.paidPacks || []) {
    const count = Math.max(0, Math.min(pack.limit, Math.trunc(Number(counts[pack.id]) || 0)));
    result.counts[pack.id] = count;
    result.money += pack.price * count;
    result.material += pack.material * count;
    result.currency += pack.currency * count;
    result.count += count;
  }
  return result;
}
export function setPaidPack(config, state, id, count) {
  if (!(config.paidPacks || []).some(pack => pack.id === id)) return;
  state.paidPacks = paidPackTotals(config, { ...state.paidPacks, [id]: count }).counts;
  resetPreview(state);
}
export function resetPreview(state) {
  state.preview = null; state.purchases = {};
}
export function activityPreview(planner, state) {
  const stock = Math.max(0, Math.min(1e9, Math.trunc(Number(state.stock) || 0)));
  const paid = paidPackTotals(planner.config, state.paidPacks);
  const progress = Math.max(0, Math.min(planner.maximum, Math.trunc(Number(state.progress) || 0)));
  const remainingDays = state.weekly ? Math.max(0, Math.min(7, Math.trunc(Number(state.remainingDays) || 0))) : 0;
  const futureFree = remainingDays * (planner.config.dailyFreeMaterial ?? 1);
  const futurePurchased = remainingDays * (planner.config.dailyPurchaseMaterial ?? 0);
  const futureMaterial = futureFree + futurePurchased;
  const currentCurrency = Math.max(0, Math.trunc(Number(state.currentCurrency) || 0));
  const totalStock = stock + paid.material + futureMaterial;
  const result = planner.simulate({stock: totalStock, progress});
  const safe = planner.config.cost.kind === 'combat' ? planner.simulate({stock: totalStock, progress, mode:'safe'}) : result;
  const reachable = result.rows.filter(r => r.gap === 0).at(-1);
  const completedProgress = reachable?.progress ?? progress;
  const nextStage = result.rows.find(stage => stage.progress > completedProgress);
  const remainingMaterial = reachable?.remaining ?? totalStock;
  const reachableProgress = nextStage
    ? Math.min(nextStage.progress - 1, completedProgress + Math.floor(remainingMaterial / planner.attackCost('expected')))
    : completedProgress;
  const row = state.preview === null ? reachable : result.rows.find(r => r.progress === state.preview);
  const base = Math.max(0, Math.trunc((Number(state.weeklyCurrency) || 0) * remainingDays / 7));
  const earned = row?.currency || 0;
  const budget = currentCurrency + earned + base + paid.currency;
  const beforePaid = paid.material ? planner.simulate({stock: stock + futureMaterial, progress}).rows.filter(r => r.gap === 0).at(-1) : reachable;
  const paidTaskCurrency = (reachable?.currency || 0) - (beforePaid?.currency || 0);
  const spent = planner.goods.reduce((sum, g) => sum + (state.purchases[g.id] || 0) * g.price, 0);
  const refund = planner.goods.reduce((sum, g) => sum + (state.purchases[g.id] || 0) * g.refund, 0);
  return {reachableProgress, nextStage, futureFree, futurePurchased, currentCurrency, progress, rows: result.rows, safeRows: safe.rows, base, earned, spent, refund, budget,
    paid, totalStock, paidTaskCurrency, reachableCurrency: reachable?.currency || 0,
    previewGap: row?.gap || 0, wallet: Math.max(0, budget - spent)};
}


export function selectRoundTarget(state, view, progress) {
  const target = view.rows.find(row => row.end && row.progress === progress);
  if (!target) return;
  const extraMaterial = view.futureFree + view.futurePurchased + view.paid.material;
  state.stock = Math.max(0, target.required - extraMaterial);
  state.preview = progress;
  state.purchases = {};
}
