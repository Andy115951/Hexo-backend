---
title: 案例 A19：Chatbox 本地 SearXNG 联网搜索搭建与验证
date: 2026-08-26T17:20:00+08:00
draft: true
categories:
  - 工程效率
  - 质量保障
  - 联网搜索
tags:
  - Chatbox
  - SearXNG
  - Docker
  - Web Search
  - 本地部署
  - 端到端验证
---

## 一句话成就

把「新增 SearXNG 搜索提供方」从代码与配置层的静态结论，落成一套可复用的本机 Docker 部署、Chatbox 配置和真实搜索闭环验证：不依赖第三方 API Key，并明确了本地代理与上游搜索引擎之间的隐私边界。

---

## 成就卡片

- 成就编号：A19
- 时间范围：2026-08
- 业务域：联网搜索 / 本地工具链 / 发布验证
- 我的角色：环境搭建 + 请求链路验证 + 风险边界说明 + 知识沉淀
- 影响对象：Chatbox 联网搜索功能验收、开发与测试本机调试、注重可控搜索源的用户

---

## 背景与目标

Chatbox 1.23 新增 SearXNG 搜索提供方。它不是 Chatbox 内置的免费搜索 API，而是允许用户提供一台 SearXNG 实例；客户端对该实例请求 JSON 搜索结果，再交给模型使用。

本次目标不是只确认设置页能填写地址，而是验证完整链路：

1. 本机实例能稳定启动，且不会开放到局域网。
2. 实例开启 Chatbox 所需的 JSON 输出格式。
3. Chatbox 的「检查」和真实联网搜索均命中本机实例。
4. 能说明请求最终仍会发往哪些上游搜索引擎，避免把“本地部署”误解成“搜索不出网”。

---

## 实际搭建方案

使用官方 Docker 镜像 `searxng/searxng:latest`，容器名为 `chatbox-searxng`：

```text
Docker Desktop
  -> chatbox-searxng
      -> 127.0.0.1:8080（仅本机）
      -> chatbox-searxng-config（配置持久卷）
      -> chatbox-searxng-data（缓存持久卷）
```

核心启动参数：

```bash
docker run -d \
  --name chatbox-searxng \
  --restart unless-stopped \
  -p 127.0.0.1:8080:8080 \
  -e SEARXNG_BASE_URL=http://127.0.0.1:8080/ \
  -v chatbox-searxng-config:/etc/searxng \
  -v chatbox-searxng-data:/var/cache/searxng \
  searxng/searxng:latest
```

SearXNG 官方容器默认只开放 HTML 结果。Chatbox 请求的是 JSON，因此在持久化 `settings.yml` 中启用：

```yaml
search:
  formats:
    - html
    - json
```

Docker 卷保存配置与缓存，重启或更新容器不会丢失 JSON 配置；`--restart unless-stopped` 让 Docker Desktop 启动后自动恢复服务。

---

## Chatbox 接入与实际验证

客户端配置：

```text
设置 -> 联网搜索
搜索提供方：SearXNG
SearXNG Instance URL：http://127.0.0.1:8080
```

Chatbox 只需要实例根地址，不填写 `/search`，也不需要 API Key。其实际请求契约是：

```text
GET http://127.0.0.1:8080/search?q=<关键词>&format=json
Accept: application/json
```

本机直接验证返回：

```text
HTTP 200
Content-Type: application/json
查询 Chatbox：20 条结果，首条为 Chatbox AI 官网
```

随后在 Chatbox 中开启联网搜索并发送「搜搜看 Chatbox」。开发者工具记录证明请求实际命中：

```text
Request URL: http://127.0.0.1:8080/search?...&format=json
Status Code: 200 OK
Server: granian
```

页面成功展示 10 条归一化搜索结果，说明「Chatbox -> 本机 SearXNG -> 搜索结果卡片 -> 模型回答」完整闭环成立。

---

## 原理与边界

```text
用户发起需要联网的问题
  -> 模型调用 web_search
    -> Chatbox 请求本机 SearXNG /search?format=json
      -> SearXNG 并行请求上游引擎
        -> 聚合、去重、标准化 JSON
          -> Chatbox 展示结果并注入模型上下文
```

真实响应的 `server-timing` 显示这次查询并行使用了 Google CSE、Brave、Wikipedia、DuckDuckGo；总耗时约 1.18 秒。

关键边界：

- `127.0.0.1` 只允许当前电脑访问，局域网设备无法调用该实例。
- 本地部署不等于搜索词不出网：SearXNG 仍需把查询转发给已启用的上游搜索引擎。
- 它的价值是把搜索入口、上游引擎选择和部署位置交给用户控制，而不是让 Chatbox 固定依赖某一家搜索 API。
- Docker Desktop 未运行时，本机实例也不会运行；可用 `docker start chatbox-searxng` 恢复。

---

## 可复用验收清单

1. 设置页选择 SearXNG 后，填写实例根地址并点击「检查」，显示连接成功。
2. 用浏览器或 curl 访问 `/search?q=Chatbox&format=json`，确认 `200 application/json` 且 `results` 为数组。
3. 在 Chatbox 开启联网搜索，发送一个实时检索问题，确认请求 Host 为配置的实例地址而非默认搜索提供方。
4. 确认结果卡片能展示标题、链接、摘要，模型回答能引用搜索结果。
5. 停止容器后重试，确认客户端给出可理解的失败反馈；重新启动后恢复。

---

## 结果

- 完成可复用的本机 SearXNG 环境与配置方法。
- 以 HTTP、JSON 结果数和 Chatbox DevTools 请求三层证据验证真实链路，而非仅验证配置页。
- 沉淀了“本地搜索代理”与“上游搜索仍出网”的准确产品口径，便于后续支持、测试和隐私沟通。
