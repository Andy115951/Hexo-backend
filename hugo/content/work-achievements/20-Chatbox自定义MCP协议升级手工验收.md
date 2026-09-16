---
title: 案例 A20：Chatbox 自定义 MCP 协议升级手工验收
date: 2026-08-26T21:00:00+08:00
draft: true
categories:
  - 质量保障
  - 发布验证
  - MCP
tags:
  - Chatbox
  - MCP
  - 协议协商
  - 2026-07-28
  - 手工验收
  - 发布回归
---

## 一句话成就

把 1.23「自定义 MCP 支持 2026-07-28 / Auto / Legacy」从 PR 描述和单测，落成可重复的本机 fixture 与新旧客户端对照验收：证明新版 Auto 真正走新协议，遇旧服务能降级，旧版行为不被带跑，并确认 Sequential Thinking 内置已移除。

---

## 成就卡片

- 成就编号：A20
- 时间范围：2026-08
- 业务域：MCP 协议升级 / 发布验收 / 本地工具链
- 我的角色：验收场景设计 + 本地 fixture 搭建 + 新旧客户端对照执行 + 结论收敛
- 影响对象：Chatbox 1.23 MCP 协议发布验收、后续同类协议回归、自定义 MCP 兼容口径
- 产出类型：stdio/HTTP fixture、一键导入 JSON、手工验收报告、产品条目结论

---

## 背景与目标

Chatbox 1.23 自定义 MCP 增加 Auto / Legacy：

- Auto 优先协商 2026-07-28（`server/discover`、现代 HTTP / stdio）
- 遇旧服务保留 `initialize` 与 HTTP 404/405 → 旧 SSE 回退
- 新建、推荐安装、JSON 导入默认 Auto
- 去掉 Sequential Thinking 内置

只看设置页有协议开关，无法证明客户端真的换了协议。需要能区分：

1. 新版 Auto 是否真的走到 Modern。
2. 新版 Auto 遇到只会旧协议的服务，会不会自动降 Legacy。
3. 旧版 Chatbox 是否仍走 Legacy，作为对照。
4. HTTP 端点 404 后，会不会回退到旧 SSE。

---

## 验收设计

用本机 fixture 打真实 Chatbox，不用云端内置 MCP。新旧客户端打同一组服务。

判定只认工具返回里的 `negotiated protocol`，以及新协议才有的 `_meta` / `ttlMs` / `cacheScope`。提示词要求只调用指定 probe 工具，禁止按描述猜测。

```text
旧版 Chatbox（无协议选项，默认 Legacy）
新版 Chatbox（自定义 MCP 选 Auto / Legacy）
  -> 本机 stdio fixture
      modern / dual-protocol / legacy-fallback / exit-on-discover
  -> 本机 HTTP fixture 127.0.0.1:8789
      /modern
      /legacy-sse   （POST 固定 404，GET 才建 SSE）
```

fixture 与导入 JSON：

- `autotest2py/scripts/mcp-protocol-fixture.mjs`
- `autotest2py/scripts/mcp-protocol-fixtures.json`
- `autotest2py/scripts/mcp-http-protocol-fixture.mjs`
- `autotest2py/scripts/mcp-http-protocol-fixtures.json`

---

## 实际验证

### 1. 同一服务，新旧对照

`dual-protocol` 同时讲新旧协议。

| 客户端 | 配置 | 实际协议 |
|---|---|---|
| 新版 | Auto | `fixture mode: dual-protocol; negotiated protocol: modern`，带 `_meta` |
| 旧版 | 默认 | `fixture mode: dual-protocol; negotiated protocol: legacy` |

同一 MCP、同一提示词，新旧客户端协议不同，说明 1.23 Auto 升级生效，旧版未被带跑。

### 2. 新版 Auto 连纯新协议

| 传输 | 工具 | 结果 |
|---|---|---|
| stdio modern | `protocol_probe_modern` | `negotiated protocol: modern` |
| HTTP `/modern` | `mcp__protocol_probe_http_modern` | `fixture mode: modern-http; negotiated protocol: modern`，带 `_meta` / `ttlMs` / `cacheScope` |

旧版对照：HTTP modern 的工具不会出现。旧版只会发 `initialize`，该服务不认，连不上。

### 3. 新版 Auto 遇旧服务自动降级

| 传输 | 做法 | 结果 |
|---|---|---|
| stdio `legacy-fallback` | Auto | `negotiated protocol: legacy` |
| HTTP `/legacy-sse` | Auto；POST 故意 404 | `fixture mode: legacy-sse; negotiated protocol: legacy` |

旧版打同一 HTTP SSE 地址，同样返回 `legacy`。新版这条证明的是 Auto 在 404 后回退旧 SSE，不是旧客户端本来就会 SSE。

### 4. 探测即退出，手动改 Legacy

`exit-on-discover` 收到 `server/discover` 就退出。

| 步骤 | 结果 |
|---|---|
| 新版 Auto，只点 Test | 失败 |
| 改成 Legacy，再 Test 并调用工具 | `fixture mode: exit-on-discover; negotiated protocol: legacy` |

覆盖「旧 stdio 扛不住新探测时，用户可手动切 Legacy 恢复」。

### 5. Sequential Thinking 内置

新版 MCP 设置推荐列表已无 Sequential Thinking。目视确认。

---

## 原理与边界

```text
自定义 MCP 连接
  -> protocolMode = auto？
      是：先发 2026-07-28 server/discover
        -> 成功：Modern（工具结果可带 _meta）
        -> stdio Method not found / 探测超时：同进程改发 initialize → Legacy
        -> HTTP 仅 404 / 405：改连旧 SSE → Legacy
        -> HTTP 401 / 500：失败，不降级
      否 / 无该字段：Legacy initialize
内置 MCP（Fetch / Context7 / arXiv / EdgeOne Pages）
  -> 写死 Legacy，无 Auto 开关
```

本轮明确不挡产品条目的边角：

- HTTP 401 / 500 不误降级：单测已有，未再造 401 服务。
- 内置 MCP 固定 Legacy：代码写死，未用 fixture 再打云端服务。

---

## 结果

- 1.23 产品条目「自定义 MCP 支持 2026-07-28，Auto / Legacy 可选；去掉 Sequential Thinking 内置（#1153）」手工验收通过。
- 留下可复用的 stdio / HTTP fixture 和 JSON 导入，后续协议回归不用依赖真实第三方 MCP。
- 验收口径收敛为：工具返回的 `negotiated protocol` + 新旧客户端对照，而不是只看设置页能否保存 Auto。

报告：`autotest2py/test-case-docs/release-tracking/chatbox-v1.23-mcp-protocol-manual-report.md`
