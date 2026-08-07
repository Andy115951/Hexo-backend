---
title: AI 测试用例与自动化落地分享稿（面向 QA 团队）
date: 2026-05-19T15:20:00+08:00
draft: true
categories:
  - 测试
  - 工程实践
  - AI测试
tags:
  - 测试用例
  - 自动化测试
  - Skill
  - CDP
  - 团队落地
---

## 1. 分享目标（给 QA 团队同事）

这次分享不是讲“AI 很强”，而是讲三件可落地的事：

1. QA 同事如何用统一 skill 快速产出可评审的测试用例文档。  
2. QA 同事如何把文档稳定转成自动化测试代码。  
3. 团队如何统一口径，避免“每个人都在用 AI，但产出风格和质量都不一样”。

---

## 2. 分享结构（两部分）

1. AI 写测试用例文档（测试设计）
2. AI 写自动化用例（Skill + CDP 元素定位）

这两部分对应我们的实际链路：先设计，再实现；先对齐口径，再追求效率。

---

## 3. 第一部分：AI 写测试用例文档（测试设计）

## 3.1 团队统一方法

我们不让 AI 直接“编 case”，而是强制走两阶段：

1. `step1`：测试建模（不写具体用例）
2. `step2`：把建模结果转成 Given/When/Then 用例表

这套流程对应 08 文档的最新沉淀，不是临时试验口径。

## 3.2 step1 新版口径（必须强调）

`step1` 已升级为“先判定文档类型”：

1. 默认只选一种文档类型：`功能 E2E` 或 `内部机制/升级回归`。  
2. 不默认混写。  
3. 只有明确要求“两套都要”，才拆成两份文档。  
4. 文档头必须显式声明类型。

这条规则的价值：减少评审歧义，减少后续自动化转换的返工。

## 3.3 这套方法已经有真实产出

当前已经有可复用实物，不是概念：

1. 项目内已有 `4` 份 step1/step2 样例文档。  
2. `chatbox-session-meta-storage-internal-step2.md` 已产出 `36` 条结构化用例。  
3. 说明这套 skill 在复杂升级/回归场景也能落地，不只适合简单页面测试。

## 3.4 QA 同事上手流程（文档侧）

演示一个需求时，按这条链路走：

1. 输入需求文本、边界条件、已知风险。  
2. 先跑 `step1`，确认文档类型声明是否正确。  
3. 跑 `step2` 产出表格化用例。  
4. 按 P0/P1/P2 评审并排期。  
5. 文档落盘到统一目录，作为自动化输入。

---

## 4. 第二部分：AI 写自动化用例（Skill + CDP）

## 4.1 目标

让 AI 生成的自动化代码不是“能跑一次”，而是“可维护、可复用、可扩展”。

## 4.2 09 文档里的关键更新（必须对齐）

自动化 skill 现在有两条硬口径：

1. `chatbox-pro` 开发态默认走 `pnpm start:cdp` + `9333`。  
2. dev 场景不允许静默回退到 `9222` 或安装版。

再加上已有约束：

1. 必须走 `ChatboxActionsV2` 入口。  
2. Electron 场景必须处理 `ELECTRON_RUN_AS_NODE`。  
3. 默认 serial 运行，避免进程冲突与结果漂移。

## 4.3 Skill + CDP 的职责分工

Skill 负责“规范生成”，CDP 负责“现场验证”：

1. Skill：约束框架入口、目录结构、调用方式。  
2. CDP：确认元素、验证选择器、快速定位失败原因。  
3. 失败经验回写 skill，形成团队共享资产。

## 4.4 QA 同事落地闭环（代码侧）

1. 从 `step2` 文档选 1 条 P0/P1 用例作为自动化目标。  
2. 用自动化 skill 生成首版脚本。  
3. 用 CDP 校验关键元素与等待条件。  
4. 修正后提交脚本，并把通用规则回写 skill。  
5. 下一位同事在同类场景里直接复用。

---

## 5. 团队同事如何直接使用（可复制）

## 5.1 技能文件位置

以我们当前环境为例：

1. Codex 源：`~/.codex/skills/`  
2. Claude Code 全局：`~/.claude/skills/`

两个测试设计 skill：

1. `test-case-step1-markdown/SKILL.md`  
2. `test-case-step2-table/SKILL.md`

## 5.2 同步命令（团队可直接复制）

```bash
mkdir -p ~/.claude/skills/test-case-step1-markdown ~/.claude/skills/test-case-step2-table

cp ~/.codex/skills/test-case-step1-markdown/SKILL.md \
   ~/.claude/skills/test-case-step1-markdown/SKILL.md

cp ~/.codex/skills/test-case-step2-table/SKILL.md \
   ~/.claude/skills/test-case-step2-table/SKILL.md
```

## 5.3 同步后校验

```bash
cmp -s ~/.codex/skills/test-case-step1-markdown/SKILL.md ~/.claude/skills/test-case-step1-markdown/SKILL.md; echo "step1_same=$?"
cmp -s ~/.codex/skills/test-case-step2-table/SKILL.md ~/.claude/skills/test-case-step2-table/SKILL.md; echo "step2_same=$?"
```

返回 `0` 表示一致。

## 5.4 新同事开箱流程

1. 同步 skill 到 `~/.claude/skills`。  
2. 先跑 `step1` 产出建模文档。  
3. 再跑 `step2` 产出用例表。  
4. 从 P0/P1 选 1 条转自动化。  
5. CDP 验证后提交并复盘。

---

## 6. QA 团队执行规范建议

## 6.1 版本管理

skill 变更要有版本和变更记录：

1. 什么时候改了规则
2. 改动了什么口径
3. 需要哪些项目同步更新

## 6.2 目录规范

建议统一输出目录：

1. `tests/test-case-docs/` 放测试设计文档
2. `tests/xxx.spec.ts` 放自动化实现

## 6.3 评审门禁

建议设三条门禁：

1. 没有 `step1` 文档，不进 `step2`
2. 没有 `step2` 表格，不直接写自动化
3. 自动化 PR 必须标注来源用例文档路径

## 6.4 复盘机制

每次线上问题补测固定问三件事：

1. `step1` 哪个风险维度漏了
2. `step2` 哪条用例定义不清
3. Skill 是否需要补规则

---

## 7. 常见误区（结合 08/09）

1. 跳过 `step1`，直接让 AI 写 case。  
2. 把 E2E 和内部机制混在一份文档里。  
3. dev 场景口径混乱，`9333/9222/安装版` 来回切。  
4. 只改个人本地 skill，不同步团队入口。  
5. 只看“能跑”，不看“后续谁来维护”。

---

## 8. 分享后可立即执行的最小清单

给 QA 同事的落地包建议是：

1. `step1` Skill
2. `step2` Skill
3. 一份输入模板（需求、边界、约束）
4. 一份输出样例（真实 step1 + step2）
5. 一份自动化样例（从 step2 到 spec）

目标不是“听懂”，而是“当天就能在项目里跑出第一份产物”。

---

## 9. 给团队的结尾口径

AI 在 QA 团队里的价值，不是“替代测试设计”，而是把测试设计与自动化实现流程标准化，让不同同事都能稳定产出同质量结果。
