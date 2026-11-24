// Shared material flow; activity costs, rewards and goods come from editable configuration.
const integer = (value, max = 1e9) => Math.min(max, Math.max(0, Math.trunc(Number(value) || 0)));
export function validateActivity(config) {
  const check = (ok, message) => { if (!ok) throw new Error(`${config.id}: ${message}`); };
  const nonnegative = n => Number.isSafeInteger(n) && n >= 0;
  check(config.id && config.name && config.material?.image && config.currency?.image, '活动与材料信息不完整');
  check(['combat', 'draw'].includes(config.cost?.kind), '未知消耗模型');
  if (config.cost.kind === 'combat') {
    const c = config.cost;
    check([c.hp, c.damage, c.criticalDamage, c.perAttack].every(n => Number.isSafeInteger(n) && n > 0), '攻击参数必须为正整数');
    check(c.criticalProbability >= 0 && c.criticalProbability <= 1, '暴击概率超出范围');
  } else check(Number.isSafeInteger(config.cost.perAction) && config.cost.perAction > 0, '单次消耗必须为正整数');
  let last = 0;
  const rounds = new Set();
  check(config.rounds?.length > 0, '缺少阶段配置');
  for (const round of config.rounds) {
    check(!rounds.has(round.round), '轮次重复'); rounds.add(round.round);
    check(round.stages?.length > 0, '轮次没有任务');
    for (const stage of round.stages) {
      check(nonnegative(stage.progress) && stage.progress > last, '任务累计进度必须递增'); last = stage.progress;
      check(nonnegative(stage.materialReward) && nonnegative(stage.currencyReward), '任务奖励无效');
    }
    check(nonnegative(round.completion.materialReward) && nonnegative(round.completion.currencyReward), '轮完成奖励无效');
  }
  const layers = new Set();
  for (const layer of config.shop.layers) {
    check(!layers.has(layer.id) && nonnegative(layer.unlock), '宝库层数或门槛无效'); layers.add(layer.id);
  }
  const ids = new Set();
  const packIds = new Set();
  for (const pack of config.paidPacks || []) {
    check(typeof pack.id === 'string' && pack.id.length > 0 && !packIds.has(pack.id), '礼包 ID 为空或重复'); packIds.add(pack.id);
    check(pack.name && Number.isSafeInteger(pack.price) && pack.price > 0, '礼包名称或价格无效');
    check(nonnegative(pack.material) && nonnegative(pack.currency) && nonnegative(pack.limit), '礼包材料、代币或限购无效');
  }
  for (const g of config.shop.goods) {
    check(!ids.has(g.id) && layers.has(g.layer), '商品 ID 重复或所属层不存在'); ids.add(g.id);
    check(g.name && typeof g.image === 'string' && g.image.length > 0, '商品名称或图片为空');
    check(Number.isSafeInteger(g.amount) && g.amount > 0 && Number.isSafeInteger(g.price) && g.price > 0, '商品数量或价格无效');
    check(nonnegative(g.limit) && nonnegative(g.refund), '限购或返还无效');
  }
  return config;
}

export function expectedAttacks(health, cost) {
  const values = [0], p = cost.criticalProbability;
  for (let hp = 1; hp <= health; hp++) {
    values[hp] = 1 + (1 - p) * values[Math.max(0, hp - cost.damage)] + p * values[Math.max(0, hp - cost.criticalDamage)];
  }
  return values[health];
}
export function createPlanner(config) {
  validateActivity(config);
  const milestones = config.rounds.flatMap(round => round.stages.map((s, i) => {
    const end = i === round.stages.length - 1;
    return { ...s, round: round.round, end,
      materialReward: s.materialReward + (end ? round.completion.materialReward : 0),
      currencyReward: s.currencyReward + (end ? round.completion.currencyReward : 0) };
  }));
  const maximum = milestones.at(-1).progress;
  const goods = config.shop.goods.map(g => ({ ...g, unlock: config.shop.layers.find(l => l.id === g.layer).unlock }))
    .sort((a, b) => a.layer - b.layer); // Within a layer, retain configuration order.
  const attackCost = (mode, health = config.cost.hp) => {
    const c = config.cost;
    if (c.kind === 'draw') return c.perAction;
    const attacksPerEnemy = mode === 'safe' ? c.safeAttacksPerEnemy : c.expectedAttacksPerEnemy;
    if (health === c.hp && attacksPerEnemy !== undefined) return attacksPerEnemy * c.perAttack;
    return (mode === 'safe' ? Math.ceil(health / Math.min(c.damage, c.criticalDamage)) : expectedAttacks(health, c)) * c.perAttack;
  };
  function simulate({ stock = 0, secondaryStock = 0, currency = 0, progress = 0, selected = {}, mode = 'expected', health } = {}) {
    stock = integer(stock) + (config.secondaryMaterial ? integer(secondaryStock) : 0);
    currency = integer(currency); progress = integer(progress, maximum);
    let balance = stock, spent = 0, cost = 0, refund = 0, required = 0;
    const rows = [], shopping = [];
    const left = goods.map(g => integer(selected[g.id], g.limit));
    function shop() {
      for (let i = 0; i < goods.length; i++) {
        const g = goods[i];
        while (left[i] > 0 && spent >= g.unlock && currency >= g.price) {
          left[i]--; currency -= g.price; spent += g.price; balance += g.refund; refund += g.refund; shopping.push(g);
        }
      }
    }
    shop(); const initial = { currency, spent, refund, remaining: balance }; let previous = progress;
    for (const stage of milestones) {
      if (stage.progress <= progress) continue;
      let need = (stage.progress - previous) * attackCost(mode);
      if (previous === progress && config.cost.kind === 'combat' && health !== undefined) {
        const remainingHealth = Math.min(config.cost.hp, Math.max(1, integer(health)));
        need += attackCost(mode, remainingHealth) - attackCost(mode);
      }
      cost += need; balance -= need;
      required = Math.max(required, cost - refund); // Reach the stage before spending its rewards.
      balance += stage.materialReward; refund += stage.materialReward; currency += stage.currencyReward;
      shop();
      rows.push({ ...stage, cost: Math.max(0, Math.ceil(cost - 1e-9)), refund, currency, spent,
        required: Math.max(0, Math.ceil(required - 1e-9)), gap: Math.max(0, Math.ceil(required - stock - 1e-9)),
        remaining: Math.floor(balance + 1e-9), purchases: shopping.length });
      previous = stage.progress;
    }
    return { rows, shopping, initial, pending: goods.map((g, i) => ({ ...g, count: left[i] })).filter(g => g.count > 0) };
  }
  return { config, goods, milestones, maximum, attackCost, simulate };
}
