---
title: 案例 A21：Chatbox 桌面自动化 QA 不抢焦点与按光标换屏
date: 2026-09-02T18:00:00+08:00
draft: true
categories:
  - 测试工程
  - 质量保障
  - 桌面端自动化
tags:
  - Chatbox
  - Playwright
  - Electron
  - QA runtime
  - 双屏
  - 不抢焦点
---

## 一句话成就

把「跑桌面 Playwright 时 Chatbox 会抢当前显示器、打断正在写的东西」收敛成 QA 专用路径：macOS 上不激活成前台应用，再按光标把窗口停到另一块屏；日常产品的 `show()` / 托盘 / 二次实例不受影响。

---

## 成就卡片

- 成就编号：A21
- 时间范围：2026-09
- 业务域：桌面端自动化运行时 / 双屏工作流 / QA 隔离
- 我的角色：问题拆解 + QA 运行时设计 + fixture 换屏落地 + 双屏真机验证
- 影响对象：Chatbox Pro 开发构建桌面回归（`chatbox-pro-automation`）、双屏本机长时间跑 mock 的人
- 产出类型：QA 启动策略、fixture 换屏逻辑、README / AGENTS 口径、本机验证记录

---

## 结果速览（以后回看先看这里）

- 正式回归命令是 `pnpm test:automation:desktop:mock`（CLI）。`mock:ui` 只是同一套 fixture 再开 Playwright UI，方便盯步骤 / console，不是另一套启动方式。
- 起来的是 **dev 构建**：`_electron.launch('out/main/main.js')` + 临时 `--user-data-dir`。不是 Applications 里的安装包；安装包回归在 autotest2py。
- 不抢焦点分两层，缺一层都不成立：
  1. **应用级**：`CHATBOX_QA=1` → macOS `app.setActivationPolicy('accessory')`（必须在 `app.ready` 之前）+ 窗口 `showInactive()`。
  2. **窗口级**：每个测试拿到 `firstWindow()` 后，读光标所在屏，把 1280×800 窗口居中停到**另一块**屏的 `workArea`。
- 第一轮只做 `showInactive()`：窗口没拿键盘焦点，但双屏上仍会感到「出现在眼前」——根因是 **macOS 把整个 Electron 进程激活成前台应用**，不是某一个 BrowserWindow 变成 key window。
- 双屏真机确认：光标所在屏不再被抢断；Chatbox 出现在另一块屏。单屏则退回当前屏居中，不会飞出显示器。
- Playwright UI 自己的壳**不会**被这段代码挪走；随后每个测例拉起的 Chatbox 窗口仍按当时光标换屏。
- 产品路径不动：托盘 / 第二次实例 / Deep Link 仍走 `show()` + `focus()`。禁止把 QA 行为写进日常 `BrowserWindow.show()`。

一句话判断：这件事不是「把窗口 hide / headless」，而是把「可见、可被 Playwright 操作」和「不打断正在用的那块屏」拆开。

---

## 背景与问题定义

### 1) 业务场景

Chatbox Pro 桌面自动化在 `dev/automation-desktop` worktree（目录 `chatbox-pro-automation`）里跑开发构建。正式回归是 CLI mock，一次会连续拉起很多 Electron 进程，每个测例自己的临时 profile。

双屏本机上，人在一块屏写代码 / 看文档，另一块屏本来可以给测试窗口。默认 Electron 启动会：

- 抢 Dock 和菜单栏
- 把当前输入焦点抢走
- 窗口画在「当前主屏 / 上次 bounds」，正好盖住正在用的那块屏

`START_MINIMIZED` / hide / headless 对这套 suite 不适用：Playwright 需要窗口可见、可点。

### 2) 原始痛点

1. 跑 mock 时当前显示器被盖住，无法同时干活。
2. 只藏窗口或最小化，测例会因为找不到可见控件而失败。
3. 误改产品 `show()` 会让真实用户启动行为变掉，QA 和日常路径必须切开。
4. Playwright `--ui` 是给人盯着用的壳，不能指望它替 Chatbox 做换屏。

### 3) 影响评估

- 时间成本：双屏本机没法「挂着回归接着写」，回归变成独占会话。
- 质量风险：为了少打断去 hide / 最小化，会引入假绿或假红。
- 协作风险：如果把 QA 行为写进产品 `show()`，review 过不了，也不该过。

---

## 目标与验收标准

### 1) 目标

1. QA 启动可见、可被 Playwright 操作，但不抢当前输入焦点。
2. 双屏时窗口出现在「没有光标」的那块屏，不盖住正在用的屏。
3. 单屏仍能跑，窗口留在当前屏。
4. 产品托盘 / 二次实例 / Deep Link 的 `show()` + `focus()` 零改动。

### 2) 验收标准

- 双屏、光标在工作屏：新拉起的 Chatbox 不出现在这块屏，菜单栏 / Dock 不被测试进程抢走。
- 光标换到另一块屏后再开下一例：下一例跟过去，停到新的「非光标屏」。
- 只有一块屏：窗口仍在当前屏居中，测例能跑。
- `pnpm test:automation:desktop:green`（harness + send）能过；后续 mock 批次窗口行为与 green 同一套 fixture。
- 非 QA 启动（不带 `CHATBOX_QA=1`）仍是原来的 `show()`。

---

## 约束与边界

- 只改 QA 路径：`CHATBOX_QA=1` + `CHATBOX_QA_TASK_ID`。日常产品窗口策略不碰。
- 命令必须在 `chatbox-pro-automation`（`dev/automation-desktop`）跑。旁边的 `chatbox-pro` 若在 `release-1.23`，`package.json` 里没有 `test:automation:desktop:*`。
- 起来的是 `out/main/main.js`，要先 `pnpm build` / `electron-vite build --mode development`。
- Playwright UI 壳不走 fixture，不换屏。
- 安装包测试不走这条路径。
- 本次不做：把窗口移到所有显示器之外、改产品默认 `show()`、给 Playwright UI 本身做停屏。

---

## 核心原理（为什么这样设计）

1. **可见 ≠ 前台**：Playwright 要的是窗口 mapped、控件可点；用户要的是键盘和当前屏不被抢。这两件事可以分开。
2. **窗口焦点 ≠ 应用激活**：macOS 上 `showInactive()` 只避免 key window，挡不住进程变成 frontmost app。要在 `app.ready` 前设 `accessory`。
3. **「正在用哪块屏」用光标，不用 primaryDisplay**：主屏、全屏空间、上次 bounds 都不可靠；光标是操作者当下所在位置。
4. **换屏放 fixture，不放产品启动**：每个测例启动时重算一次；产品没有「测试光标」这个概念，不该写进 `showMainWindow`。

### 原理流转图

```text
pnpm test:automation:desktop:mock
  -> fixture _electron.launch
       args: out/main/main.js + --user-data-dir(临时) + --remote-debugging-port
       env:  CHATBOX_QA=1, CHATBOX_QA_TASK_ID=临时目录名
  -> 主进程（仅 QA）
       darwin && isQa
         -> app.setActivationPolicy('accessory')   // ready 之前
       第一次露出主窗口
         -> showInactive()                         // 不抢 key focus
         -> 非 QA 仍是 show() / maximize / fullscreen
  -> fixture 拿到 firstWindow()
       screen.getCursorScreenPoint()
         -> getDisplayNearestPoint(cursor)         // 光标屏 = 正在用的屏
         -> 找 id 不同的另一块屏
         -> 有：用另一块的 workArea
         -> 无：退回当前屏 workArea
       居中 1280×800，setMinimumSize(1024, 700)，setBounds
  -> 测例开始点控件
```

---

## 我到底做了什么

- 比较对象：QA 启动 vs 日常启动；窗口 key-focus vs 进程激活；光标屏 vs primaryDisplay。
- 工程补齐：fixture 注入 `CHATBOX_QA`；主进程 QA 分支 `accessory` + `showInactive()`；fixture 里按光标 `setBounds`。
- 验证设计：先 跑绿（2 条）确认能点；再双屏真机看「工作屏会不会被盖」；确认 accessory 之后「没光标的那块屏才出现窗口」。
- 收敛：换屏留在 fixture；产品 `show()` 不动；Playwright UI 明确不在范围内。

---

## 我的关键动作（按阶段写）

### 1) 方案设计

先排除三条错路：

| 备选 | 为什么不用 |
|---|---|
| `START_MINIMIZED` / hide / headless | Playwright 要点可见控件 |
| 改产品默认 `show()` | 托盘、二次实例、Deep Link 必须还能抢焦点 |
| 把窗口移到所有屏之外 | 人看不到，排障也难，这套 suite 不需要 |

留下 QA 专用运行时：已有 `CHATBOX_QA=1` 契约（关托盘 / 全局快捷键 / 单实例 / 更新，且强制 `--user-data-dir` 和 `--remote-debugging-port`），在这条契约上加「怎么露出窗口」和「窗口放哪」。

### 2) 落地执行

**应用级（`src/main/main.ts`）**

- `darwin && MAIN_RUNTIME_POLICY.isQa`：`app.ready` 前 `setActivationPolicy('accessory')`。
- `showMainWindow`：QA 走 `showInactive()`，跳过 maximize / fullscreen；非 QA 原样 `show()`。

**窗口级（`test/automation/desktop/fixtures.ts`）**

- launch env 带 `CHATBOX_QA=1`、`CHATBOX_QA_TASK_ID=path.basename(tempDir)`。
- `window` fixture：`getCursorScreenPoint` → 光标屏 → 另一块屏 → `workArea` 居中 → `setBounds`。

### 3) 验证与收敛

- 只做 `showInactive()` 的 跑绿能过，但双屏上仍觉得窗口「到眼前了」→ 补 accessory。
- accessory 后用户确认：没光标的显示器不会被抢断。
- 再加光标换屏后用户确认：窗口确实出现在另一块屏。
- README / AGENTS 写清：`mock` 是正式回归；`mock:ui` 只是看着跑；不要改非 QA 的 `show()`。

---

## 按光标换屏怎么做（回看这段就够）

每个测试的 `window` fixture，在 `electronApp.firstWindow()` 之后立刻算一次，**以当时鼠标位置为准**：

```ts
const bounds = await electronApp.evaluate(({ screen }) => {
  const cursor = screen.getCursorScreenPoint()
  const focused = screen.getDisplayNearestPoint(cursor)
  const other = screen.getAllDisplays().find((display) => display.id !== focused.id)
  const area = (other ?? focused).workArea
  const width = Math.min(1280, area.width)
  const height = Math.min(800, area.height)
  return {
    x: area.x + Math.max(0, Math.floor((area.width - width) / 2)),
    y: area.y + Math.max(0, Math.floor((area.height - height) / 2)),
    width,
    height,
  }
})
await browserWindow.evaluate((win, nextBounds) => {
  win.setMinimumSize(1024, 700)
  win.setBounds(nextBounds)
}, bounds)
```

对应关系：

| 步骤 | 做什么 |
|---|---|
| `getCursorScreenPoint()` | 当前鼠标坐标 |
| `getDisplayNearestPoint(cursor)` | 光标所在屏 = 正在用的屏 |
| `getAllDisplays().find(id !== 光标屏)` | 找另一块屏 |
| 用那块屏的 `workArea` 居中 1280×800 | 避开菜单栏 / Dock |
| 只有一块屏 | `other` 为空，退回当前屏，同样居中 |

注意：

- 用 `workArea` 而不是 `bounds`，避免窗口顶进菜单栏。
- 每个测例启动都重读光标，中途把鼠标换到另一块屏，下一例会跟过去。
- 这是 Playwright 侧挪已经创建好的窗口，不是 Electron 创建时指定 display。

---

## 难点、风险与应对

### 1) 关键难点

- **macOS 激活策略**：`showInactive()` 解决的是窗口，不是进程。不设 `accessory`，Dock / 菜单栏仍会切到 Chatbox。
- **时机**：`setActivationPolicy('accessory')` 必须在 `app.ready` 之前，放晚了无效。
- **「哪块是工作屏」**：`screen.getPrimaryDisplay()` 在多屏 + 全屏空间下经常不是你正在看的那块。

### 2) 风险与预案

- 改到产品 `show()` → 明确只进 `MAIN_RUNTIME_POLICY.isQa` 分支。
- 单屏把窗口算飞 → `other ?? focused`，始终落在某块屏的 workArea 内。
- `mock:ui` 仍挡住视线 → 接受 Playwright UI 不换屏；不盯着看就用 CLI `mock`。
- 跑错仓库 → `chatbox-pro`（`release-1.23`）没有这条脚本，必须进 `chatbox-pro-automation`。

### 3) 关键突破

- 把「不抢焦点」从窗口 API 提升到应用激活策略。
- 把「不要盖住我」定义成「不要出现在光标那块屏」，而不是「不要出现在主屏」。

---

## 结果与影响

### 1) 短期结果

- QA 启动不再抢当前屏的输入和菜单栏。
- 双屏上回归窗口停在另一块屏，工作屏可以继续写。
- 跑绿（harness + send）在 accessory + 换屏之后仍然通过。

### 2) 中期价值

- 桌面 mock 可以从「独占会话」变成「挂在旁边跑」。
- QA 窗口策略和产品启动策略有明确边界，后续加并行 / 多任务不容易把日常 `show()` 带跑。

### 3) 长期复用价值

- 「可见但不前台」可以复用到其他 Electron + Playwright 本机套件。
- 「按光标找非工作屏」可以复用到任何双屏停窗需求，不依赖 primaryDisplay。

### 4) 为什么这件事难

不是调一个 `setBounds`。真正难的是三件叠在一起：

- Playwright 必须看见窗口。
- macOS 把「露出窗口」和「激活应用」绑在一起。
- 双屏上「主屏」不等于「我正在用的屏」。

只做其中一层，都会出现「测例能过，但人还是被打断」。

---

## 关键代码与命令

### 1) QA 不激活（主进程）

```ts
if (process.platform === 'darwin' && MAIN_RUNTIME_POLICY.isQa) {
  // Must run before ready. Accessory keeps a new Electron process from
  // becoming the frontmost app; showInactive() alone is not enough on macOS.
  app.setActivationPolicy('accessory')
}

// showMainWindow 内：
} else if (MAIN_RUNTIME_POLICY.isQa) {
  mainWindow.showInactive()
} else {
  mainWindow.show()
}
```

### 2) fixture 注入 QA 并换屏

见上文「按光标换屏怎么做」。launch 侧：

```ts
env: {
  ...process.env,
  NODE_ENV: 'test',
  CHATBOX_QA: '1',
  CHATBOX_QA_TASK_ID: qaTaskId,
}
```

### 3) 运行命令（必须在 automation worktree）

```bash
# 在 chatbox-pro 的 automation worktree（分支 dev/automation-desktop）里跑

pnpm exec electron-vite build --mode development   # 没有 out/main/main.js 时先编
pnpm test:automation:desktop:green                 # 跑绿：harness + send
pnpm test:automation:desktop:mock                  # CLI 正式回归，不抢焦点 + 换屏
pnpm test:automation:desktop:mock:ui               # 同上，另开 Playwright UI 壳
```

| 命令 | 启动的是什么 | 换屏吗 |
|---|---|---|
| `mock` | dev：`out/main/main.js` + 临时 profile | Chatbox 窗口会 |
| `mock:ui` | 同上 + Playwright UI Chromium | Chatbox 会，UI 壳不会 |
| autotest2py 安装包回归 | 打好的 `.app` | 不走这条 fixture |

---

## 产出物（证据清单）

- 机制：`chatbox-pro-automation/src/main/main.ts`（accessory + QA `showInactive`）
- fixture：`test/automation/desktop/fixtures.ts`（`CHATBOX_QA` + 光标换屏 `setBounds`）
- 口径：`test/automation/desktop/README.md`、`AGENTS.md`
- 验证：双屏真机（不抢工作屏、窗口在另一块屏）+ 跑绿 2 passed
- 边界：非 QA `BrowserWindow.show()` 未改；安装包测试未接入

---

## 可复用经验

1. Electron 自动化「不打扰」要同时处理 **应用激活** 和 **窗口位置**，只调 `showInactive()` 在 macOS 上不够。
2. 多屏不要信 `primaryDisplay`，信光标。
3. QA 行为用环境开关切，不要改产品默认 `show()`。
4. Playwright UI 是观察器，不是被测应用；停屏只对 `_electron.launch` 出来的窗口生效。
5. 脚本在哪个 worktree，比命令名字更重要：`release-1.23` 的 `chatbox-pro` 根本没有 `test:automation:desktop:mock:ui`。

---

## 可直接复用的话术

### 30 秒版本

“桌面 Playwright 一跑就会抢当前屏。我没把窗口藏起来，而是做了 QA 专用路径：macOS 上 accessory + `showInactive()` 不激活成前台应用，再按光标把窗口停到另一块屏。产品日常 `show()` 没动。”

### 2 分钟版本

“问题不是测例起不来，是双屏上回归会打断正在用的那块屏。最小化 / headless 会让 Playwright 点不到控件，改产品 `show()` 又会把托盘和二次实例带跑。

我拆成两层：一层是应用激活，`CHATBOX_QA=1` 时在 `ready` 前设 accessory，窗口用 `showInactive()`——这是因为 macOS 上只避免 key window 挡不住整个进程抢 Dock。另一层是窗口位置，每个测例启动时读光标所在屏，把 1280×800 居中放到另一块屏的 workArea；单屏就退回当前屏。

`mock` 和 `mock:ui` 都走这套 fixture，起来的是开发构建 `out/main/main.js`，不是安装包。Playwright UI 自己的壳不换屏。双屏上确认：工作屏不再被抢，窗口出现在另一块屏。”
