# 宗师之上 · 周活动规划

本仓库包含三个周活动的规划工具。目前实现破木悟法，另外两个活动等待名称、材料和规则。

## 目录

- `data/`：活动资料、截图及 `pomu-wufa.json` 规则参考。
- `src/uni-app/`：Vue 3 uni-app 小程序源代码。
- `src/uni-app/pages/index/`：周活动首页。
- `src/uni-app/pages/pomu/`：破木悟法规划页。
- `src/core/activities.js`：三个活动的注册信息、材料及计算器接口。
- `src/core/planner.js`：破木计算引擎，H5 原型与小程序共用。
- `src/index.html`、`src/app.js`、`src/style.css`：独立 H5 原型，与小程序页面尚有交互差异。

## 开发与构建

```sh
cd src
npm ci
npm test
npm run dev:mp-weixin
npm run build:mp-weixin
```

开发产物位于 `src/dist/dev/mp-weixin/`，生产产物位于 `src/dist/build/mp-weixin/`。使用微信开发者工具导入产物目录；请先在 `src/uni-app/manifest.json` 的 `mp-weixin.appid` 填入自己的微信小程序 AppID。根级 `appid` 是 uni-app 应用标识，不是微信 AppID。目前未完成真机验证。

独立 H5 原型：在 `src/` 下运行 `npm run dev`，访问 http://127.0.0.1:5173 。小程序以 uni-app 页面为准。

## 活动扩展

采用“活动首页 → 活动规划页 → 独立计算引擎”的结构。活动注册项包含稳定 ID、名称、状态、路由、材料名称及计算模块。两个待补充活动不启用、不调用破木算法。收到规则后分别增加计算模块及测试、规划页面、`pages.json` 路由，再更新注册项。材料流转和奖励兑换流程可以复用，但只有规则确认一致时才提取公共逻辑，避免假设三个活动消耗相同。

当前资料 JSON 是规则参考，计算引擎尚未直接读取它；调整破木规则时须同步核对两者。

## 计算边界

已完成任务按奖励已领取处理；宝库从零兑换进度开始规划。补充获取按全部到账计算，不进行逐日排程；木人直接掉落排除。预计用量使用击败木人所需攻击次数的数学期望，不代表达成概率；保守模式每次按 10 伤害计算。缺口以领取奖励前的最大短缺计算。商店锁定层内容仍需实机复核，图标暂用字形占位。
