// Curated from APK configuration; see static/pomu/sources.json.
const files = {
  "法象真言": "item-93103.png",
  "强化粉尘·蓝": "item-30301.png",
  "灵韵仙蛋": "item-1914.png",
  "飞剑残魄": "item-80001.png",
  "仙界心法碎片自选": "item-6031.png",
  "神兵陨铁": "item-7102.png",
  "仙君悟法被动心法碎片": "item-8016.png",
  "神铸石": "item-7001.png",
  "仙君悟法主动心法碎片": "item-8017.png",
  "圣宝灵髓": "item-7500.png",
  "金仙红色法则碎片箱": "item-2126.png",
  "道痕结晶": "item-93106.png",
  "金仙大道法则碎片箱": "item-2127.png",
  "行功散": "item-1603.png",
  "领悟点": "currency-102.png",
  "悟心残页": "currency-402.png"
};

export function pomuIcon(name, base = '/static/pomu/') {
  return files[name] ? base + files[name] : '';
}
