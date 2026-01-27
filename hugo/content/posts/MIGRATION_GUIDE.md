# 📖 从桌面端到手机端自动化迁移指南

## 目录
- [1. 迁移概述](#1-迁移概述)
- [2. 桌面端架构](#2-桌面端架构)
- [3. 手机端实现方案](#3-手机端实现方案)
- [4. 关键差异对比](#4-关键差异对比)
- [5. API 映射表](#5-api-映射表)
- [6. 完整迁移步骤](#6-完整迁移步骤)

---

## 1. 迁移概述

### 1.1 背景信息

**Chatbox 应用架构**:
- **桌面端**: Electron 应用（Mac .app）
- **手机端**: Capacitor + WebView (Android APK)
- **核心代码**: 两端使用同一套前端代码（React + Mantine UI）

**迁移目标**: 将 Playwright Electron 自动化测试迁移到 Android 平台

### 1.2 迁移挑战

| 挑战 | 桌面端方案 | 手机端解决方案 |
|------|-----------|---------------|
| 应用启动 | `electron.launch()` | ADB 命令启动 |
| 元素访问 | Playwright DOM API | Chrome DevTools Protocol |
| 选择器 | CSS 选择器 | JavaScript + DOM API |
| 权限问题 | 无 | Realme 手机限制 WRITE_SECURE_SETTINGS |

---

## 2. 桌面端架构

### 2.1 核心文件结构

```
playwrighttest/
├── framework/
│   ├── chatbox-actions.ts      # 主要操作类 (581 行)
│   ├── chatbox-settings.ts     # 设置相关操作
│   ├── base.ts                 # 基础类
│   └── types.ts                # 类型定义
└── tests/
    └── test-chatbox.spec.ts    # 测试用例
```

### 2.2 核心类设计

```typescript
// 桌面端核心类
export class ChatboxActions extends ChatboxApp implements IChatboxActions {
    public electronApp?: ElectronApplication;  // Electron 应用实例
    public window: Page;                       // Playwright Page 对象

    // 启动应用
    async launch(executablePath: string): Promise<void> {
        this.electronApp = await electron.launch({ executablePath });
        this.window = await this.electronApp.firstWindow();
        await this.window.waitForLoadState('domcontentloaded');
    }

    // 发送消息
    async sendMessage(message: string): Promise<{ isTimeout: boolean }> {
        await this.window.locator('#message-input').fill(message);
        await this.window.locator('button:has(svg.tabler-icon-arrow-up)').click();
        // ... 等待逻辑
    }

    // 其他操作方法...
}
```

### 2.3 关键选择器

桌面端使用的选择器（直接对应手机端）:

| 功能 | 桌面端选择器 | 手机端对应 |
|------|-------------|-----------|
| 消息输入框 | `#message-input` | `document.getElementById('message-input')` |
| 发送按钮 | `button:has(svg.tabler-icon-arrow-up)` | `querySelector('svg.tabler-icon-arrow-up').closest('button')` |
| 新对话按钮 | `button:has(svg.tabler-icon-circle-plus)` | `querySelector('svg.tabler-icon-circle-plus').closest('button')` |
| 模型选择器 | `svg.tabler-icon-selector` | `querySelector('svg.tabler-icon-selector')` |
| 停止按钮 | `button:has(svg.tabler-icon-player-stop-filled)` | `querySelector('svg.tabler-icon-player-stop-filled').closest('button')` |
| 联网按钮 | `button[data-variant="subtle"]:has(svg.tabler-icon-world)` | `querySelector('svg.tabler-icon-world').closest('button')` |
| 模型选项 | `div[data-combobox-option="true"]` | `querySelectorAll('div[data-combobox-option="true"]')` |

---

## 3. 手机端实现方案

### 3.1 技术栈

**ADB + Chrome DevTools Protocol**

```
┌─────────────────────────────────────────────────────────────┐
│  Node.js 测试脚本                                           │
│  ├── 启动应用 (ADB)                                         │
│  ├── 查找 WebView (ADB)                                     │
│  ├── 转发端口 (ADB)                                         │
│  └── 执行 JavaScript (WebSocket → Chrome DevTools)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Android 设备 (Realme RMX1901)                              │
│  └── Chatbox App                                            │
│      └── Capacitor WebView                                  │
│          └── 与桌面端相同的 DOM 结构                        │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 核心文件

```
playwrighttest/tests/mobile/
├── adb-webview-test.js          # 主测试脚本 (Node.js)
├── webview_helper.py            # WebView 辅助脚本 (Python)
├── simple-connect.js            # 简化连接测试
└── webview-test.js              # WebView 测试
```

### 3.3 手机端操作流程

```javascript
// 1. 启动应用
adb shell am start -n xyz.chatboxapp.chatbox/.MainActivity

// 2. 查找 WebView DevTools
adb shell cat /proc/net/unix | grep webview_devtools_remote
// 输出: webview_devtools_remote_32239

// 3. 转发端口
adb forward tcp:9222 localabstract:webview_devtools_remote_32239

// 4. 获取页面信息
curl http://localhost:9222/json/list
// 返回: [{ id: "326B3D383ABAD4C486A709ACFCADECC0", ... }]

// 5. 通过 WebSocket 执行 JavaScript
ws://localhost:9222/devtools/page/326B3D383ABAD4C486A709ACFCADECC0
→ Runtime.evaluate({ expression: "document.getElementById('message-input').value = 'Hello'" })
```

### 3.4 核心实现代码

```javascript
// adb-webview-test.js
const { execSync } = require('child_process');

async function runTest() {
    const DEVICE_ID = '3e39a8be';
    const PACKAGE = 'xyz.chatboxapp.chatbox';

    // 1. 启动应用
    execSync(`adb -s ${DEVICE_ID} shell am start -n ${PACKAGE}/.MainActivity`);

    // 2. 查找 WebView
    const sockets = execSync(`adb -s ${DEVICE_ID} shell cat /proc/net/unix`);
    const match = sockets.match(/webview_devtools_remote_(\d+)/);
    const pid = match[1];

    // 3. 转发端口
    execSync(`adb -s ${DEVICE_ID} forward tcp:9222 localabstract:webview_devtools_remote_${pid}`);

    // 4. 获取页面信息
    const pageInfo = execSync('curl -s http://localhost:9222/json/list');
    const pages = JSON.parse(pageInfo);
    const pageId = pages[0].id.split('/').pop();

    // 5. 调用 Python 脚本执行测试
    execSync(`python3 webview_helper.py ${pageId}`);
}
```

```python
# webview_helper.py
import asyncio
import websockets
import json

async def test_input():
    uri = f"ws://localhost:9222/devtools/page/{PAGE_ID}"

    async with websockets.connect(uri) as ws:
        # 启用 Runtime
        await ws.send(json.dumps({"id": 1, "method": "Runtime.enable", "params": {}}))
        for _ in range(5):
            await ws.recv()

        # 查找元素
        await ws.send(json.dumps({
            "id": 2,
            "method": "Runtime.evaluate",
            "params": {
                "expression": "document.getElementById('message-input') !== null",
                "returnByValue": True
            }
        }))

        # 获取响应
        resp = await ws.recv()
        msg = json.loads(resp)
        # 处理结果...
```

---

## 4. 关键差异对比

### 4.1 启动方式

| 操作 | 桌面端 | 手机端 |
|------|--------|--------|
| **代码** | `await electron.launch({ executablePath })` | `adb shell am start -n package/activity` |
| **语言** | TypeScript/JavaScript | Node.js + Shell |
| **返回** | ElectronApplication | 进程 ID |

### 4.2 元素定位

| 操作 | 桌面端 | 手机端 |
|------|--------|--------|
| **代码** | `await page.locator('#message-input')` | `document.getElementById('message-input')` |
| **返回** | Playwright Locator | DOM Element |
| **等待** | `await locator.waitFor()` | 手动轮询检查 |

### 4.3 文本输入

| 操作 | 桌面端 | 手机端 |
|------|--------|--------|
| **代码** | `await locator.fill('text')` | `element.value = 'text'; element.dispatchEvent(new Event('input'))` |
| **触发事件** | 自动触发 | 需手动触发 |
| **等待** | 自动等待 | 需手动等待 |

### 4.4 元素点击

| 操作 | 桌面端 | 手机端 |
|------|--------|--------|
| **代码** | `await locator.click()` | `element.click()` |
| **可滚动** | 自动滚动 | 需手动滚动 |
| **等待** | 自动等待元素可见 | 需手动检查 |

### 4.5 等待条件

| 操作 | 桌面端 | 手机端 |
|------|--------|--------|
| **元素可见** | `await locator.waitFor({ state: 'visible' })` | 轮询 `element.offsetParent !== null` |
| **元素消失** | `await locator.waitFor({ state: 'detached' })` | 轮询 `!document.querySelector(...)` |
| **网络请求** | `await page.waitForResponse()` | 需手动实现监听 |

---

## 5. API 映射表

### 5.1 基础操作

| 桌面端 API | 手机端实现 | 说明 |
|-----------|-----------|------|
| `await electron.launch(path)` | `adb shell am start -n pkg/act` | 启动应用 |
| `await page.locator(sel)` | `document.querySelector(sel)` | 定位元素 |
| `await element.fill(text)` | `element.value = text; dispatchEvent` | 填写文本 |
| `await element.click()` | `element.click()` | 点击元素 |
| `await element.textContent()` | `element.textContent` | 获取文本 |
| `await element.getAttribute(attr)` | `element.getAttribute(attr)` | 获取属性 |
| `await element.isVisible()` | `element.offsetParent !== null` | 检查可见性 |

### 5.2 等待操作

| 桌面端 API | 手机端实现 | 说明 |
|-----------|-----------|------|
| `await page.waitForSelector(sel)` | 轮询 `document.querySelector(sel)` | 等待元素出现 |
| `await locator.waitFor({ state: 'detached' })` | 轮询 `!document.querySelector(sel)` | 等待元素消失 |
| `await page.waitForTimeout(ms)` | `await new Promise(r => setTimeout(r, ms))` | 延迟等待 |
| `await page.waitForLoadState()` | `document.readyState === 'complete'` | 等待页面加载 |

### 5.3 ChatboxActions 方法映射

| 桌面端方法 | 手机端实现 | 难度 |
|-----------|-----------|------|
| `launch(path)` | ADB 启动命令 | ✅ 简单 |
| `sendMessage(msg)` | 填值 + 点击 + 轮询停止按钮 | ✅ 简单 |
| `openModelSelector()` | 点击选择器图标 | ✅ 简单 |
| `getCurrentModel()` | 查找高亮选项文本 | ⚠️ 中等 |
| `getAllModels()` | 滚动 + 收集文本 | ⚠️ 中等 |
| `selectModel(name)` | 查找并点击 | ⚠️ 中等 |
| `isNetworkEnabled()` | 检查样式属性 | ⚠️ 中等 |
| `enableNetwork()` | 查找并点击 | ✅ 简单 |
| `clickNewChat()` | 查找并点击新对话按钮 | ✅ 简单 |
| `isErrorMessage(div)` | 检查子元素类名 | ✅ 简单 |

---

## 6. 完整迁移步骤

### 6.1 环境准备

```bash
# 1. 安装 Android SDK Platform Tools
# 下载: https://developer.android.com/tools/releases/platform-tools

# 2. 安装 Python 依赖
pip3 install websockets

# 3. 启用 USB 调试
# 手机设置 → 关于手机 → 连续点击版本号
# 开发者选项 → USB 调试

# 4. 连接设备并验证
adb devices
```

### 6.2 核心迁移步骤

#### 步骤 1: 创建手机端操作类

```javascript
// mobile-chatbox-actions.js
class MobileChatboxActions {
    constructor(deviceId, package) {
        this.deviceId = deviceId;
        this.package = package;
        this.pageId = null;
    }

    // 启动应用
    async launch() {
        execSync(`adb -s ${this.deviceId} shell am start -n ${this.package}/.MainActivity`);
        await this._connectToWebView();
    }

    // 连接到 WebView
    async _connectToWebView() {
        // 查找 WebView
        const sockets = execSync(`adb -s ${this.deviceId} shell cat /proc/net/unix`);
        const match = sockets.match(/webview_devtools_remote_(\d+)/);
        this.pid = match[1];

        // 转发端口
        execSync(`adb -s ${this.deviceId} forward tcp:9222 localabstract:webview_devtools_remote_${this.pid}`);

        // 获取页面 ID
        const pageInfo = JSON.parse(execSync('curl -s http://localhost:9222/json/list'));
        this.pageId = pageInfo[0].id.split('/').pop();
    }

    // 执行 JavaScript
    async executeJS(expression) {
        // 使用 websockets 连接并执行
        // ...
    }
}
```

#### 步骤 2: 实现核心方法

```javascript
// 发送消息
async sendMessage(message) {
    // 1. 填写消息
    await this.executeJS(`
        const input = document.getElementById('message-input');
        input.value = '${message}';
        input.dispatchEvent(new Event('input', { bubbles: true }));
    `);

    // 2. 点击发送
    await this.executeJS(`
        document.querySelector('svg.tabler-icon-arrow-up').closest('button').click();
    `);

    // 3. 等待完成
    while (true) {
        const isGenerating = await this.executeJS(`
            return document.querySelector('svg.tabler-icon-player-stop-filled') !== null;
        `);
        if (!isGenerating) break;
        await new Promise(r => setTimeout(r, 1000));
    }
}
```

#### 步骤 3: 实现模型操作

```javascript
// 打开模型选择器
async openModelSelector() {
    await this.executeJS(`
        document.querySelector('svg.tabler-icon-selector').click();
    `);
    await new Promise(r => setTimeout(r, 2000));
}

// 获取当前模型
async getCurrentModel() {
    return await this.executeJS(`
        const options = document.querySelectorAll('div[data-combobox-option="true"]');
        for (const opt of options) {
            if (opt.classList.contains('bg-blue-50') ||
                opt.classList.contains('dark:bg-[var(--mantine-color-dark-5)]')) {
                return opt.querySelector('span.mantine-Text-root').textContent.trim();
            }
        }
        return null;
    `);
}

// 获取所有模型
async getAllModels() {
    return await this.executeJS(`
        const options = document.querySelectorAll('div[data-combobox-option="true"]');
        const models = [];
        for (const opt of options) {
            opt.scrollIntoViewIfNeeded();
            const name = opt.querySelector('span.mantine-Text-root').textContent.trim();
            models.push(name);
        }
        return models;
    `);
}
```

### 6.3 测试用例迁移

#### 桌面端测试用例

```typescript
test('发送消息', async () => {
  await chatbox.sendMessage('你好，Chatbox！');
  await new Promise(resolve => setTimeout(resolve, 10000));
});
```

#### 手机端测试用例

```javascript
test('发送消息', async () => {
  const mobile = new MobileChatboxActions('3e39a8be', 'xyz.chatboxapp.chatbox');
  await mobile.launch();
  await mobile.sendMessage('你好，Chatbox！');
  await new Promise(resolve => setTimeout(resolve, 10000));
});
```

### 6.4 关键迁移点总结

1. **应用启动**: `electron.launch()` → ADB 命令
2. **元素定位**: Playwright Locator → DOM API
3. **事件触发**: 自动 → 手动触发
4. **等待机制**: Playwright 等待 → 手动轮询
5. **选择器**: CSS 选择器保持一致
6. **代码结构**: 保持类似的类和方法设计

---

## 附录

### A. 快速参考

```bash
# 运行桌面端测试
npx playwright test --project=electron

# 运行手机端测试
node playwrighttest/tests/mobile/adb-webview-test.js
```

### B. 相关文档

- [Playwright Electron 文档](https://playwright.dev/docs/api/class-electron)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Capacitor 文档](https://capacitorjs.com/)
- [ADB 命令参考](https://developer.android.com/studio/command-line/adb)

---

**文档版本**: 1.0
**最后更新**: 2026-01-14
**作者**: Claude Code
**状态**: ✅ 已验证
