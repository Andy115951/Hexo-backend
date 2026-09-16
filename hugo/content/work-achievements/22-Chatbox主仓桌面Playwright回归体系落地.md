---
title: 案例 A22：Chatbox 主仓桌面 Playwright 回归体系落地
date: 2026-09-07T16:30:00+08:00
draft: true
categories:
  - 测试工程
  - 质量保障
  - 桌面端自动化
tags:
  - Chatbox
  - Playwright
  - Electron
  - Mock
  - 回归测试
  - 自动化测试
---

## 一句话成就

把原本只能在独立自动化仓维护的桌面 UI 回归能力，落到 Chatbox Pro 主仓：建立可隔离启动的 Playwright + Electron 测试 harness、可控的本地 HTTP mock Provider，以及“快速跑绿 / 完整 mock / 手动 live”三层运行方式；完整 mock 已验证 86 条通过。

## 成就卡片

- 成就编号：A22
- 时间范围：2026-09
- 业务域：桌面端自动化 / 回归质量 / 测试基础设施
- 我的角色：方案设计 + 主仓测试落地 + 回归分层 + 用例覆盖设计 + 评审材料整理
- 影响对象：Chatbox Pro 的功能开发、发版前桌面回归、后续接手维护自动化的研发与测试同学
- 产出类型：主仓 Playwright harness、mock Provider、UI 契约、回归脚本、覆盖清单、Draft PR

## 结果速览

- 在 chatbox-pro 的 dev/automation-desktop 分支新增桌面端自动化目录 test/automation/desktop/，并创建 Draft PR [#1273](https://github.com/chatboxai/chatbox-pro/pull/1273)。
- 建立三个明确入口：
  - pnpm test:automation:desktop:green：开发构建与一次 mock 发送，2 条最小回归。
  - pnpm test:automation:desktop:mock：完整确定性 mock 回归，86 条。
  - pnpm test:automation:desktop:live：真实模型验证，必须显式提供本地 license。
- 在最新主仓基线 rebase 后重新构建 development build，实测 green 2/2 通过；完整 mock 86/86 通过，耗时 7 分 36 秒。
- 新增完整 mock 覆盖清单 test/automation/desktop/MOCK_REGRESSION_COVERAGE.md，将“有哪些用例”从代码目录变成可 review、可维护的台账。
- PR 当前仍为 Draft：该成果记录的是回归能力已落地和已验证，不等同于已合并或已成为 CI 合并门禁。

## 背景与问题定义

### 1) 原始问题

桌面端自动化长期主要在独立测试仓维护。它适合安装包、历史版本、真实模型矩阵等黑盒验证，但产品开发改动发生在 chatbox-pro 时，测试用例难以与组件、状态和 UI 契约同步演进。

结果是两类工作容易脱节：

1. 开发完成 UI 改动后，回归用例不能在同一 PR 内同步维护。
2. 真实模型回归速度慢、依赖 license 和外部服务，不适合作为日常开发的默认验证。
3. 桌面 Electron 测试若直接复用用户 profile，会污染本地数据、受账户状态影响，也容易抢占工作屏和输入焦点。

### 2) 本次目标

1. 在主仓提供可以随产品代码一起维护的桌面 Playwright 基础能力。
2. 默认回归不依赖真实模型、真实账号或公网服务。
3. 把启动、快速验证、完整 mock、真实模型验证分层，避免“一条命令跑所有东西”。
4. 给 reviewer 和后续维护者留下明确的覆盖范围、运行方式和边界说明。

## 我做了什么

### 1) 建立真实应用 + 可控模型边界的测试结构

测试启动的不是静态页面或假 UI，而是当前分支编译得到的 Electron 开发构建：

    Playwright fixture
      -> 创建临时 user-data-dir
      -> 启动本机 127.0.0.1 HTTP mock Provider（系统分配空闲端口）
      -> 写入临时 config.json，把 E2E Mock 设为默认 OpenAI 兼容 Provider
      -> _electron.launch(out/main/main.js)
      -> 真实 Chatbox 主进程、preload、renderer、Store 和 UI 执行用例
      -> 模型响应由本地 mock 返回

这使得 UI、状态机、请求转换、SSE 消费、工具审批等仍走真实产品代码；只有模型服务边界被替换为可控响应。

mock server 覆盖普通 SSE 回复、慢流、401、429、中途断流、重新生成，以及 write_file tool call。这样流式取消、错误提示、重试和 Agent 审批可以稳定复现，不需要赌真实模型的响应时序。

### 2) 建立稳定的 UI 自动化契约

自动化不依赖文案、CSS 层级或偶然的 DOM 结构，而使用产品内的 TestId 与会话/模型身份属性。

启动 harness 会读取页面根节点的 data-automation-contract-version，并与当前源码中的版本常量比较。这一步曾实际发现：源码已升级到 1.7.2，但本地 out/ 仍是旧构建的 1.7.1。因此将“先 build 当前 development build”纳入了执行口径，而不是让用例在旧产物上产生假结果。

### 3) 建立三层回归分工

| 层级 | 命令 | 目的 | 是否默认使用真实模型 |
| --- | --- | --- | --- |
| 快速跑绿 | test:automation:desktop:green | 确认开发构建可启动、契约与最基本发送链路可用 | 否 |
| 完整 mock | test:automation:desktop:mock | 覆盖稳定、可重复的桌面产品行为 | 否 |
| live 专项 | test:automation:desktop:live | 验证真实 Chatbox AI 的关键链路 | 是，且需本地 license |

这个分层的核心不是把所有测试都塞进“回归”，而是根据反馈速度和外部依赖决定运行时机：发版前可先跑完整 mock；涉及真实模型、Provider 或模型矩阵时，再显式运行 live 或独立测试仓专项。

### 4) 完整 mock 的覆盖范围

完整 mock 共 86 条，覆盖：

- 启动和 UI 契约版本一致性；
- 消息发送、停止生成、重试、重新生成与分叉；
- 复制、引用、编辑、删除、附件和网页搜索；
- Chat / Work 模式差异、队列、插队、队列上限和 Agent 文件写入审批；
- 会话搜索、侧栏 Pin / Archive / Rename、空会话和草稿边界；
- New Thread、回滚、归档线程继续和移入新会话；
- 聊天/会话/通用设置、快捷键、默认模型和 Provider 字段；
- 401、429、SSE 中断等错误路径。

精确的 spec、条数、场景和“是否进入快速跑绿”已记录在主仓 test/automation/desktop/MOCK_REGRESSION_COVERAGE.md，避免只有“86 条通过”而无法回答“具体测了什么”。

## 难点与关键取舍

### 1) 主仓测试不等于把所有黑盒测试搬进来

主仓保留的是开发时最需要一起维护的桌面 UI / 状态 / 契约回归。安装包兼容、历史版本、全模型和第三方 Provider 矩阵仍属于独立测试仓或手动专项；否则日常开发反馈会被外部依赖拖慢。

### 2) mock 必须模拟协议边界，而不是伪造产品状态

如果直接往 Store 塞消息或 mock renderer，测试只能证明测试代码本身。这里选择模拟 OpenAI 兼容 HTTP / SSE 边界，让真实 Chatbox 处理请求、流、错误和工具调用；这比纯组件 mock 更接近日常产品回归，同时仍保持确定性。

### 3) QA 运行时必须与用户运行时隔离

每条用例使用临时 profile，测试结束后删除；QA 专用环境变量只影响测试启动路径。macOS 上的 accessory + showInactive() 与按光标换屏细节已另行沉淀在 A21，正常产品 show()、托盘和二次实例路径不被改变。

## 验证证据

    # 使用当前分支源码生成测试用的 Electron 开发构建
    pnpm exec electron-vite build --mode development

    # 最小回归
    pnpm test:automation:desktop:green
    # 结果：2 passed

    # 完整确定性回归
    pnpm test:automation:desktop:mock
    # 结果：86 passed，7 分 36 秒

同时，PR 的 lint、类型检查、单测和 React Native Shared Runtime 检查均已通过。桌面完整 mock 暂未接入 GitHub Actions；真实模型验证也不作为默认合并门禁。

## 结果与影响

### 短期结果

1. 主仓首次拥有可一键运行的桌面 mock 回归，而不是只有散落在独立仓的测试资产。
2. UI 改动可以在同一个产品分支上补 TestID 和 Playwright 断言，降低两边同步遗漏。
3. 86 条确定性用例已在 rebase 后的当前开发构建上实际跑通。

### 中期价值

1. 开发可先用 2 条跑绿确认基本链路，再在发版前执行完整 mock，而不把所有模型验证混进日常命令。
2. 自动化边界更清晰：产品 UI 回归在主仓，真实模型/安装包/跨版本专项仍由独立测试仓承接。
3. UI 契约版本把“源码变了但测试仍运行旧构建”的隐性问题显式化。

### 长期复用价值

1. 新功能可以沿用临时 profile、本地 Provider、TestID 和 fixture 生命周期，不必每次重新搭建 Electron 测试环境。
2. 覆盖清单把用例从代码实现提升为可 review 的质量资产，也为后续快速回归分层提供依据。
3. mock / live 的边界可以扩展到更多 Provider、Agent 和移动端，但不会强迫它们进入默认回归。

## 后续边界

- 完成 Draft PR 的代码 review，并确认 Cloudflare Pages 外部构建失败原因；未确认前不宣称已 merge。
- 基于覆盖清单进一步定义发版前“快速回归”的稳定集合，而不是简单只按文件夹命名。
- 真实模型、第三方 Provider、全模型矩阵继续按独立专项治理，不加入默认 mock。
- 移动端暂不移植；后续复用 UI 契约和 mock 语义，再替换宿主与驱动层。

