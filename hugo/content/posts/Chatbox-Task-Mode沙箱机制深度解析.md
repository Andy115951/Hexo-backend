---
title: Chatbox Task Mode 沙箱机制深度解析
date: 2026-01-29T18:00:00+08:00
draft: true
categories:
  - 架构设计
  - 自动化
tags:
  - Chatbox
  - 沙箱
  - Task Mode
  - 安全
---

## 前言

Chatbox 的 Task Mode 是一个让 AI 能够安全执行文件操作和命令的特殊模式。本文深入分析其沙箱机制的实现原理，帮助开发者理解如何在保持安全性的同时赋予 AI 强大的文件系统能力。

## 目录

1. [Task Mode 概述](#task-mode-概述)
2. [沙箱架构](#沙箱架构)
3. [核心实现](#核心实现)
4. [安全机制](#安全机制)
5. [调用流程](#调用流程)
6. [最佳实践](#最佳实践)

---

## Task Mode 概述

### 什么是 Task Mode？

Task Mode 是 Chatbox 中一种特殊的对话模式，与普通 Chat Mode 相比，它具有以下特点：

| 特性 | Chat Mode | Task Mode |
|------|-----------|-----------|
| 消息存储 | SessionStore | TaskSessionStore |
| 文件访问 | ❌ 无 | ✅ 受控访问 |
| 命令执行 | ❌ 无 | ✅ 沙箱执行 |
| 工作目录 | ❌ 无 | ✅ 可配置 |
| 上下文压缩 | 标准 | TaskCompaction |

### 核心价值

```
┌─────────────────────────────────────────────────────────┐
│  用户输入: "帮我把 src/utils.ts 的 formatDate 函数       │
│           改成支持中文日期格式"                          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  AI 理解任务，需要:                                      │
│  1. 读取 src/utils.ts 文件                              │
│  2. 定位 formatDate 函数                                │
│  3. 修改代码                                            │
│  4. 写回文件                                            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  沙箱执行:                                               │
│  ✅ 允许读取 src/utils.ts                               │
│  ✅ 允许写入 src/utils.ts                               │
│  ❌ 拒绝读取 ~/.ssh                                     │
│  ❌ 拒绝写入 .env                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 沙箱架构

### 技术栈

```mermaid
graph TB
    A[Task Mode UI] --> B[taskSessionActions]
    B --> C[Sandbox Manager]
    C --> D[@anthropic-ai/sandbox-runtime]
    D --> E[系统命令执行]
    
    F[taskSystemPrompt] --> B
    G[taskCompaction] --> B
    H[TaskSessionStore] --> B
```

### 核心模块

```
src/
├── main/sandbox/
│   └── manager.ts           # 沙箱管理器（主进程）
├── renderer/stores/
│   ├── taskSessionStore.ts  # Task 会话存储
│   ├── taskSessionActions.ts # Task 操作逻辑
│   ├── taskSystemPrompt.ts  # 系统提示词
│   └── taskCompaction.ts    # 上下文压缩
└── shared/
    └── task-sandbox.ts      # 沙箱配置常量
```

---

## 核心实现

### 1. 沙箱配置 (task-sandbox.ts)

```typescript
// 沙箱安全配置
export const TASK_SANDBOX_DENY_READ_PATHS = [
  '~/.ssh',      // SSH 密钥
  '~/.gnupg',    // GPG 密钥
  '~/.aws',      // AWS 凭证
  '~/.config/gh' // GitHub Token
]

export const TASK_SANDBOX_DENY_WRITE_PATHS = [
  '.env',              // 环境变量
  '.env.local',        // 本地环境变量
  '.env.production'    // 生产环境变量
]

export const TASK_SANDBOX_EXTRA_WRITE_PATHS = [
  '/tmp'  // 临时文件目录
]
```

**设计理念**：
- **黑名单策略**：明确禁止访问敏感路径
- **白名单扩展**：允许额外的可写路径（如 /tmp）
- **最小权限原则**：只给予完成任务所需的最低权限

### 2. 沙箱管理器 (manager.ts)

#### 初始化流程

```typescript
export async function initSandbox(workDir: string): Promise<{ success: boolean; error?: string }> {
  // 1. 检查状态
  if (state === 'initialized') {
    await resetSandbox()
  }

  // 2. 动态导入沙箱运行时
  const { SandboxManager } = await import(getSandboxRuntimeImportTarget())
  
  // 3. 构建配置
  const config = buildConfig(workDir)
  
  // 4. 初始化沙箱
  await SandboxManager.initialize(config)
  
  // 5. 更新状态
  state = 'initialized'
  workingDirectory = workDir
  
  return { success: true }
}
```

#### 配置构建

```typescript
function buildConfig(workDir: string): SandboxRuntimeConfig {
  const isWindows = process.platform === 'win32'
  const resolvedDir = isWindows ? toWSLPath(workDir) : workDir
  const allowWrite = [resolvedDir, ...TASK_SANDBOX_EXTRA_WRITE_PATHS]

  return {
    network: {
      deniedDomains: [],  // 不限制域名
    },
    filesystem: {
      denyRead: [...TASK_SANDBOX_DENY_READ_PATHS],
      allowWrite,         // 白名单策略
      denyWrite: [...TASK_SANDBOX_DENY_WRITE_PATHS],
    },
  }
}
```

**关键点**：
- **Windows 支持**：自动转换路径为 WSL 格式
- **网络策略**：`deniedDomains: []` 表示允许所有网络访问
- **文件系统**：混合使用白名单（写入）和黑名单（读取）

#### 命令执行

```typescript
export async function execCommand(command: string, options?: ExecOptions): Promise<ExecResult> {
  // 1. 验证沙箱状态
  if (state !== 'initialized' || !sandboxManagerRef) {
    throw new Error('Sandbox not initialized')
  }

  // 2. 用沙箱包装命令
  const wrappedCommand = await sandboxManagerRef.wrapWithSandbox(command)

  // 3. 执行命令
  return new Promise((resolve, reject) => {
    const child = spawn(wrappedCommand, {
      shell: true,
      cwd: options?.cwd ?? workingDirectory,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    })

    // 4. 超时控制
    const timer = setTimeout(() => {
      killTree()  // 超时后强制杀死进程树
    }, options?.timeout ?? 30_000)

    // 5. 收集输出
    child.stdout.on('data', (chunk) => stdoutChunks.push(chunk))
    child.stderr.on('data', (chunk) => stderrChunks.push(chunk))

    // 6. 处理结果
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ stdout, stderr, exitCode: code ?? 1 })
    })
  })
}
```

**安全特性**：
- **超时控制**：默认 30 秒超时，防止无限等待
- **进程树清理**：`detached: true` + 负 PID 杀死整个进程树
- **输出截断**：防止内存溢出

### 3. 文件操作 API

#### 读取文件

```typescript
export async function readFile(filePath: string): Promise<{ success: boolean; content?: string; error?: string }> {
  const result = await execCommand(`cat ${shellEscape(filePath)}`)
  
  if (result.exitCode !== 0) {
    return { success: false, error: result.stderr }
  }
  
  return { success: true, content: headTruncate(result.stdout) }
}
```

#### 写入文件

```typescript
export async function writeFile(filePath: string, content: string): Promise<{ success: boolean; error?: string }> {
  // 使用 printf 而不是 echo，更好地处理特殊字符
  const escaped = content.replace(/'/g, "'\\''")
  const result = await execCommand(`printf '%s' '${escaped}' > ${shellEscape(filePath)}`)
  
  if (result.exitCode !== 0) {
    return { success: false, error: result.stderr }
  }
  
  return { success: true }
}
```

#### 编辑文件

```typescript
export async function editFile(filePath: string, search: string, replace: string): Promise<{ success: boolean; error?: string }> {
  // 转义 sed 特殊字符
  const escapeSedBRE = (s: string) => s
    .replace(/[\\.*[\]^$&/]/g, '\\$&')
    .replace(/\n/g, '\\n')
  
  const escapedSearch = escapeSedBRE(search)
  const escapedReplace = escapeSedBRE(replace)
  
  const result = await execCommand(`sed -i'' "s/${escapedSearch}/${escapedReplace}/g" ${shellEscape(filePath)}`)
  
  if (result.exitCode !== 0) {
    return { success: false, error: result.stderr }
  }
  
  return { success: true }
}
```

**设计亮点**：
- **Shell 转义**：防止命令注入
- **跨平台**：macOS/Linux 使用 `-i''`，空后缀避免备份文件
- **正则转义**：正确处理 BRE（Basic Regular Expression）语法

---

## 安全机制

### 多层防护

```
┌──────────────────────────────────────────────────────────┐
│  第一层: 系统提示词约束                                   │
│  - 告知 AI 沙箱限制                                       │
│  - 引导 AI 在允许范围内操作                               │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│  第二层: 沙箱运行时                                      │
│  - @anthropic-ai/sandbox-runtime 包装                    │
│  - 文件系统访问控制                                       │
│  - 网络隔离（可选）                                       │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│  第三层: 配置黑/白名单                                    │
│  - DENY_READ_PATHS: 敏感路径黑名单                        │
│  - DENY_WRITE_PATHS: 保护文件黑名单                       │
│  - EXTRA_WRITE_PATHS: 临时路径白名单                      │
└──────────────────────────────────────────────────────────┘
```

### 系统提示词 (taskSystemPrompt.ts)

```typescript
export function buildTaskSystemPrompt(workingDirectory: string): string {
  const writablePaths = [workingDirectory, ...TASK_SANDBOX_EXTRA_WRITE_PATHS].join(', ')

  return [
    'You are operating in a sandbox with explicit filesystem permissions.',
    `Working directory: ${workingDirectory}`,
    `Writable paths: ${writablePaths}`,
    `Blocked read paths: ${TASK_SANDBOX_DENY_READ_PATHS.join(', ')}`,
    `Blocked write paths: ${TASK_SANDBOX_DENY_WRITE_PATHS.join(', ')}`,
    'Prefer to complete work within the writable paths above.',
    `Use temporary paths like ${TASK_SANDBOX_EXTRA_WRITE_PATHS.join(', ')} for artifacts.`,
    'If a requested action requires global or system-level changes, do not execute it directly.',
    'Ask the user to run the required commands.',
    'All relative paths are resolved from the working directory.',
  ].join('\n')
}
```

**提示词策略**：
1. **明确边界**：清楚告知 AI 什么是允许/禁止的
2. **引导行为**：建议使用临时路径处理中间文件
3. **降级处理**：遇到无法执行的操作时请求用户协助

### 工作目录隔离

```typescript
// 在 taskSessionActions.ts 中
const session = queryClient.getQueryData<TaskSession>(queryKey)
const workingDir = session?.workingDirectory || '.'

// 沙箱初始化
if (session?.workingDirectory && platform.sandboxInit) {
  const initResult = await platform.sandboxInit({ 
    workingDirectory: session.workingDirectory 
  })
  
  if (!initResult.success) {
    throw new Error(`Sandbox initialization failed: ${initResult.error}`)
  }
}
```

**隔离机制**：
- 每个 Task Session 有独立的 `workingDirectory`
- 沙箱只能访问该目录及明确允许的路径
- 相对路径从工作目录解析

---

## 调用流程

### 完整调用链

```
用户发送消息
    ↓
submitTaskMessage(taskId, content)
    ↓
┌─────────────────────────────────────────┐
│  1. 运行压缩检查                         │
│     runTaskCompaction(taskId)           │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  2. 添加用户消息                         │
│     messages: [..., userMessage]        │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  3. 创建助手消息（生成中）               │
│     assistantMessage.generating = true  │
└─────────────────────────────────────────┘
    ↓
generateTaskResponse(taskId, assistantMessage, contextMessages)
    ↓
┌─────────────────────────────────────────┐
│  4. 获取模型设置                         │
│     getDefaultModelSettings(session)    │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  5. 初始化沙箱                           │
│     platform.sandboxInit({               │
│       workingDirectory: session.workDir  │
│     })                                  │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  6. 构建系统提示词                       │
│     buildTaskSystemPrompt(workingDir)    │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  7. 构建工具集                           │
│     buildToolsForSession(model, {        │
│       webBrowsing: true,                 │
│       sandboxEnabled: true,              │
│       enabledSkillNames                  │
│     })                                   │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  8. 流式生成响应                         │
│     for await (const chunk of stream)    │
│       processStreamChunk(chunk)          │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  9. 更新消息状态                         │
│     generating: false                   │
│     finishReason, usage                 │
└─────────────────────────────────────────┘
```

### 工具调用示例

当 AI 需要读取文件时：

```typescript
// AI 决定调用工具
{
  "type": "tool_use",
  "name": "read_file",
  "input": { "path": "src/utils.ts" }
}

// 工具执行（在沙箱中）
await sandboxManager.readFile('src/utils.ts')

// 实际执行的命令
// cat 'src/utils.ts' (经过 wrapWithSandbox 包装)

// 返回结果
{
  "type": "tool_result",
  "content": "export function formatDate() { ... }"
}
```

### 工具构建 (tools-builder.ts)

```typescript
export async function buildToolsForSession(model, options) {
  const tools = {}
  
  if (options.sandboxEnabled) {
    // 文件操作工具
    tools.read_file = {
      description: 'Read a file from the filesystem',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to read' }
        }
      },
      handler: async (args) => {
        return await platform.readFile(args.path)
      }
    }
    
    tools.write_file = { ... }
    tools.edit_file = { ... }
    tools.list_directory = { ... }
  }
  
  if (options.webBrowsing) {
    // 网页浏览工具
    tools.web_search = { ... }
    tools.web_fetch = { ... }
  }
  
  return { tools, instructions }
}
```

---

## 最佳实践

### 1. 工作目录设置

```typescript
// ✅ 好的做法：使用项目根目录
const taskSession = await createTaskSession({
  title: '修改 utils.ts',
  workingDirectory: '/Users/apple/Documents/code/my-project'
})

// ❌ 不好的做法：使用用户主目录
const taskSession = await createTaskSession({
  title: '修改配置',
  workingDirectory: '~'  // 范围太大
})
```

### 2. 错误处理

```typescript
// 在 generateTaskResponse 中
try {
  const initResult = await platform.sandboxInit({ 
    workingDirectory: session.workingDirectory 
  })
  
  if (!initResult.success) {
    // 不要静默失败，明确告知用户
    throw new Error(`沙箱初始化失败: ${initResult.error}`)
  }
} catch (error) {
  // 给用户有用的错误信息
  assistantMessage.error = error.message
  assistantMessage.generating = false
}
```

### 3. 资源清理

```typescript
// 取消任务时
export async function cancelTaskGeneration(taskId?: string): Promise<void> {
  // 1. 中止请求
  if (currentAbortController) {
    currentAbortController.abort()
    currentAbortController = null
  }
  
  // 2. 杀死沙箱进程
  try {
    await platform.sandboxKill?.()
  } catch (err) {
    log.debug('sandbox kill during cancellation:', err)
  }
  
  // 3. 清理消息状态
  if (taskId) {
    await clearTaskGeneratingState(taskId)
  }
}
```

### 4. 上下文压缩

Task Mode 使用专门的压缩策略：

```typescript
// taskCompaction.ts
export async function runTaskCompaction(taskId: string): Promise<void> {
  const session = await getTaskSession(taskId)
  
  // 检查是否需要压缩
  if (needsCompaction(session)) {
    // 生成摘要
    const summary = await generateSummary(session.messages)
    
    // 创建压缩点
    const compactionPoint = {
      startMessageId: session.messages[0].id,
      summaryMessageId: summary.id
    }
    
    // 更新会话
    await updateTaskSession(taskId, {
      compactionPoints: [...session.compactionPoints, compactionPoint]
    })
  }
}
```

---

## 平台兼容性

### macOS / Linux

```typescript
// 直接使用 BSD/GNU 工具链
const config = {
  ripgrep: { command: 'sh' },  // macOS 特殊处理
  filesystem: { /* ... */ }
}
```

### Windows (WSL2)

```typescript
// 路径转换
function toWSLPath(winPath: string): string {
  // C:\Users\apple\project → /mnt/c/Users/apple/project
  const normalized = winPath.replace(/\\/g, '/')
  const match = normalized.match(/^([A-Za-z]):\/(.*)$/)
  if (match) {
    return `/mnt/${match[1].toLowerCase()}/${match[2]}`
  }
  return normalized
}

// 可用性检查
export async function checkAvailability(): Promise<{ available: boolean; reason?: string }> {
  if (process.platform === 'win32') {
    // 检查 WSL2 是否安装
    const result = await spawn('wsl', ['--status'], { ... })
    if (result.exitCode === 0) {
      return { available: true }
    }
    return { available: false, reason: 'wsl2_required' }
  }
  return { available: true }
}
```

---

## 总结

### 核心要点

1. **多层安全防护**
   - 系统提示词约束
   - 沙箱运行时隔离
   - 黑/白名单访问控制

2. **灵活的文件操作**
   - 读取、写入、编辑文件
   - 列出目录、搜索文件
   - 所有操作都在沙箱内执行

3. **跨平台支持**
   - macOS/Linux 原生支持
   - Windows 通过 WSL2
   - 自动路径转换

4. **资源管理**
   - 超时控制（30秒）
   - 进程树清理
   - 取消机制

### 架构优势

```
传统方式 vs 沙箱方式

❌ 传统方式                     ✅ 沙箱方式
┌─────────────┐               ┌─────────────┐
│  AI 直接执行 │               │  沙箱包装   │
│  系统命令    │               │  系统命令   │
└─────────────┘               └─────────────┘
     ↓                              ↓
┌─────────────┐               ┌─────────────┐
│ ❌ 可能访问  │               │ ✅ 受控访问 │
│  任何文件    │               │  白名单文件  │
└─────────────┘               └─────────────┘
     ↓                              ↓
┌─────────────┐               ┌─────────────┐
│ ❌ 安全风险  │               │ ✅ 安全隔离  │
└─────────────┘               └─────────────┘
```

### 设计哲学

> "给予 AI 完成任务所需的自由，同时将其限制在安全的边界内。"

- **自由**：AI 可以读写文件、执行命令、调用工具
- **安全**：敏感路径受保护、所有操作可审计、资源可控

---

## 参考资料

- [@anthropic-ai/sandbox-runtime](https://github.com/anthropics/sandbox-runtime)
- [Chatbox 源码](https://github.com/Bin-Huang/chatbox)
- [Electron 安全最佳实践](https://www.electronjs.org/docs/tutorial/security)
- [WSL2 文档](https://docs.microsoft.com/en-us/windows/wsl/)
