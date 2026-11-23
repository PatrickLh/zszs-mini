# 宗师之上 · 周活动规划

支持破木悟法、山海灵宝、鉴石大会的库存规划、阶段奖励及分层宝库兑换，默认使用当前 APK 中最新的仙君轮换配置。

## 开发与构建

```sh
cd src
npm ci
npm test
npm run dev
npm run build:web
npm run preview:web
npm run dev:mp-weixin
npm run build:mp-weixin
```

`npm run dev` 启动 H5 预览：[本地预览](http://127.0.0.1:5173)。H5 可直接切换三个活动，小程序从周活动首页进入；顺序为山海灵宝、破木悟法、鉴石大会。两端共用配置和计算引擎，沿用“材料库存 → 七轮需求 → 宝库兑换”的简洁交互。无需输入击败数或抽取次数。

小程序开发产物为 `src/dist/dev/mp-weixin/`，生产产物为 `src/dist/build/mp-weixin/`。在 `src/uni-app/manifest.json` 的 `mp-weixin.appid` 填入微信 AppID 后，用微信开发者工具导入产物。根级 `appid` 为 uni-app 应用标识。当前未完成真机验证。

## Web 部署

在 `src/` 下执行 `npm run build:web`，生成 `src/dist/build/web/`，其中包含 `index.html`、打包后的 JS/CSS 和活动图片。将该目录的全部内容上传到 Nginx、静态托管服务或 CDN 即可，无需 Node.js 后端。资源使用相对路径，支持域名根目录或子目录部署。

执行 `npm run preview:web` 可在本地预览生产包（默认地址 `http://127.0.0.1:4173`）。通过 HTTP/HTTPS 访问；不支持直接双击 HTML 文件运行。这个命令打包现有 Web 页面，沿用当前 UI，与小程序构建相互独立。修改活动配置或图片后，重新构建并上传整个产物目录。

## 目录

- `src/config/activities/`：三个活动的可编辑 JSON；商品名称、图片、数量、价格、限购及返还都在这里配置。
- `src/core/weekly-planner.js`：共用材料流转与两类消耗模型。
- `src/core/activities.js`：活动注册与页面入口。
- `src/core/planner.js`：破木原有接口的兼容导出，读取同一份默认配置。
- `src/uni-app/components/ActivityPlanner.vue`：小程序共用规划页面。
- `src/uni-app/pages/`：活动首页和三个独立路由。
- `src/uni-app/static/weekly/`：三类活动的原始资源图片，`sources.json` 记录来源。
- `src/index.html`、`src/app.js`、`src/style.css`：H5 预览。
- `data/`：截图、APK 和提取资料，不参与日常运行或构建。

## 物品轮换与活动配置

修改对应配置的 `shop.goods[].name`、`image`、`amount` 即可替换兑换商品，无需调整页面代码。图片放进 `src/uni-app/static/weekly/`；改完后重新构建小程序。

详细字段、JSON 示例与默认版本选取见 [配置说明](src/config/activities/README.md)。图片通过显式路径配置，修改商品名称不会破坏图片映射。三类活动的任务和商店版本分别记录，不混用初始活动与轮换活动的奖励。

## 计算边界

付费礼包默认收起，可按需展开；收起保留已选组合和计算结果，标题显示金额摘要。材料不足时可在横向滚动的“付费礼包”卡片中，选择 6、30、68、128、198、328、648 元礼包的购买份数。默认全部为 0；按活动限购约束，自动汇总花费、材料和直接赠送的代币。礼包材料与原有库存合并后，按该活动的阶段奖励重新计算代币，最后扣除宝库兑换。不要把同一批礼包材料同时填入库存和礼包组合。修改组合会清空兑换并恢复材料自动联动；仍可点击轮次查看目标余额，未达目标的材料缺口会单独提示。

礼包价格、材料、代币与限购也可在活动 JSON 的 `paidPacks` 中修改。当前七档奖励已按 APK 的仙君活动 ID 核对；未计入其他赠品折现、累计充值奖励、随机掉落或购买返利。

先消耗材料达到任务节点，再领取任务和轮完成奖励。七轮卡片按材料库存计算需求；宝库独立模拟兑换，返还材料在底部展示，不抵扣上方阶段需求。库存只影响缺口，不改变累计材料需求。可用代币只读，由材料库存、所选轮次及上方每周附带数量自动计算。

破木采用击败敌人所需攻击次数的数学期望，预计值不代表达成概率；保守模式按最低伤害计算。山海与鉴石按实际任务计数计算单次材料消耗；灵宝券库存可填写普通券与限时券的合计。所有活动均不计随机直接掉落，不进行逐日排程，限时券须在本期有效期内使用。

三个活动的本周附带代币默认均为 42（7 天 × 每天 1 次免费领取和 2 次灵玉购买 × 每次 2 代币），已由 APK 的 `shop_list_info` 核对。数量可自行修改或取消勾选；材料库存填写计划可用总量，不重复增加。本期已有兑换记录暂未支持。

## APK 分析

参见 [技能、道具与伤害分析](docs/apk-analysis.md)、[三个周活动的数据说明](docs/weekly-activities.md)、[限时券与末层兑换依据](docs/weekly-configuration-evidence.md)。分析产物位于 `data/apk-extracted/`，不直接打包到小程序。程序只打包选定配置与 37 张去重后的活动图片。
