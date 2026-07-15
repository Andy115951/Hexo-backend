---
title: 案例 A13：沙箱 base64 解码在 macOS Ventura 失效的根因定位与修复
date: 2026-07-06T21:30:00+08:00
draft: true
categories:
  - 稳定性治理
  - 故障排查
  - AI 工程化
tags:
  - Chatbox
  - Sandbox
  - Agent
  - macOS
  - seatbelt
  - Debugging
---

## 一句话成就

把一个"agent 模式上传文件后 AI 说读不到"的用户报障，一路收敛到 macOS Ventura 原厂 `base64` 与沙箱 seatbelt 的冲突根因，并给出在真实故障设备上验证过、对全体用户无回归的一行级修复。

---

## 成就卡片

- 成就编号：A13
- 时间范围：2026-07
- 业务域：稳定性治理 / 故障排查 / 桌面端沙箱工程
- 我的角色：问题定位 + 逐层剥离复现 + 根因收敛 + 修复方案设计与验证
- 影响对象：Chatbox agent 模式沙箱工具链（read_file / list_files / search_files / code_execution / write_file）、受影响 macOS 用户
- 产出类型：根因分析、真机取证、修复代码（分支）、排查文档归档

---

## 结果速览（以后回看先看这里）

- 用户现象"上传文件读不到 + 命令报 not permitted"，最初被 AI 自己误判成"文件没上传成功"。
- 证明文件其实**上传成功、就在沙箱目录里、磁盘直读能读出全部内容**——不是上传问题。
- 定位到真根因：**macOS 13.x 原厂 `/usr/bin/base64` 是个把输出写到 `/dev/stdout` 的 shell 脚本**，被沙箱 seatbelt 拒绝，导致所有沙箱工具的命令解码出空。
- 澄清了两个误导性次要现象：`/dev/stdout: Operation not permitted` 是**所有设备的正常行为**（红鲱鱼）；"alpha.15 才坏"其实是**用法第一次踩到这条路**，bug 自 agent 模式诞生即潜伏。
- 在故障设备上**实测验证了修复方案**（openssl 解码 + 写文件执行两条路都跑通），再落成代码。

一句话判断：这次不是"改一行 base64"，而是把一个跨"上传 / 沙箱 / 系统二进制 / seatbelt 策略"多层、且被 AI 自身误判掩盖的问题，收敛成可解释、可验证、可安全修复的工程问题。

---

## 背景与问题定义

Chatbox agent 模式下，用户拖拽上传文件后让 AI 读取，AI 调用 `read_file` 返回内容为空：

```json
{ "file_path": "xxx.md", "content": "", "startLine": 1, "endLine": null, "totalLines": null }
```

于是 AI **误判为"文件没上传成功"**，让用户重传或改用粘贴。同时 `code_execution` 报：

```text
bash: /dev/stdout: Operation not permitted
```

这个问题有几个迷惑点：

1. 只在**某一台特定设备**上出现，开发机与另一台设备完全正常。
2. AI 自己给出的结论（"文件没上传"）是错的，反而误导排查方向。
3. `/dev/stdout: Operation not permitted` 很扎眼，容易被当成主因。
4. 用户主观感觉"以前能用、升级后才坏"，指向"某次版本回归"。

如果只信表面，很容易得出错误结论：文件上传失败、某次升级引入回归、或那台设备坏了。这些都不是根因。

---

## 我在这件事里实际做了什么

1. **先证伪"文件没上传"**：用绕过沙箱的主进程 fs 直读（`fs:list` / `fs:read`）确认文件都在、内容能读。
2. **逐层剥离沙箱执行**：用一组探针命令，把"能跑的"和"读到空的"对比，定位输出在哪一层丢失。
3. **锁定 base64 解码层**：发现 `read_file` 命令内核（`wc/sed`）裸跑正常，但真实工具经过 `base64 -d` 包装后就空——差别只在 base64。
4. **查清系统二进制真面目**：确认那台设备的 `/usr/bin/base64` 是 Apple 原厂 shell 脚本，末行 `> /dev/stdout` 被 seatbelt 拒。
5. **在真机预验证修复**：证明"openssl 解码"和"写文件→执行文件"两条不经过 base64 的路径都能正常读文件、跑 node。
6. **澄清两个红鲱鱼**：`/dev/stdout` not permitted 是所有设备的正常行为；"alpha.15 才坏"是用法触发时机，非回归。
7. **落成代码修复并归档**：单点修复三处解码，附排查文档。

---

## 稳定复现路径

### 触发条件

- macOS 13.x（Ventura，`/usr/bin/base64` 为脚本）+ agent 模式读沙箱文件 / 跑 code_execution。
- 在故障设备 DevTools 控制台经 `sandbox:exec` 即可复现：

```js
// 触发过一次工具调用让沙箱初始化后：
await api.invoke('sandbox:exec', { command: 'echo aGVsbG8= | base64 -d', sessionId })
// → stderr: /usr/bin/base64: line 136: /dev/stdout: Operation not permitted
```

### 逐层剥离的关键对照（真机实测）

| 探针 | 结果 | 含义 |
|---|---|---|
| `fs:list` / `fs:read`（绕过沙箱直读） | ✅ 文件在、内容全 | 不是上传问题 |
| `echo HELLO`、`ls`、`... \| cat` | ✅ 正常 | 沙箱 stdout 管道没坏 |
| `F=文件; wc -l < "$F"; sed -n 1,3p "$F"`（read_file 内核裸跑） | ✅ 正常读出 | 命令本身没问题 |
| **`echo aGVsbG8= \| base64 -d`** | ❌ `Operation not permitted` | **差别只在 base64 解码这一层** |
| `echo aGVsbG8= \| openssl base64 -d -A` | ✅ `hello` | 修复方案可行 |

---

## 关键排查结论

### 1) 不是文件没上传

文件落地走的是主进程 `fsWriteFile` 直写，**不经过沙箱**；沙箱坏不坏都能把文件拷进目录。`fs:list` / `fs:read` 证明文件在、能读。AI 的"没上传"结论是被坏掉的工具输出误导。

### 2) 真根因：macOS 13.x 的 base64 是写 `/dev/stdout` 的脚本

所有沙箱工具的命令都先 base64 编码、再在沙箱里 `base64 -d` 解码执行。macOS 13.x 原厂 `/usr/bin/base64` 是个包 openssl 的 shell 脚本（`root:wheel`、Apple 版权、SIP 保护路径），末行：

```sh
... | eval $cmd > "$outfile"      # base64 -d 时 $outfile = /dev/stdout
```

它**按文件名打开 `/dev/stdout`** 来写。而沙箱子进程的 stdout 是匿名管道，`/dev/stdout` 是符号链接 → `/dev/fd/1` → 匿名管道 vnode（无路径），匹配不上 seatbelt 的 `(allow file-write* (subpath "/dev/stdout"))` → 落到 `deny default` → `Operation not permitted`。

坏链路：

```text
沙箱命令 base64 编码
  -> 沙箱内 base64 -d 解码
     -> macOS 13.x 脚本 base64 按名打开 /dev/stdout
        -> seatbelt 拒绝
           -> 解码出 0 字节
              -> read_file / list_files / code_execution / write_file 全部返回空
                 -> AI 误判"文件没上传"
```

### 3) 两个红鲱鱼（否则会带偏）

- **`/dev/stdout: Operation not permitted` 是所有设备的正常行为**：正常设备上手动 `echo x > /dev/stdout` 也被拒。它只在"命令显式写 /dev/stdout"时出现，不影响正常读文件。
- **"alpha.15 才坏"不是回归**：沙箱 + base64 链路自 agent 模式首发（v1.22.0-alpha.2）就存在、到 alpha.15 未改。真机实测更早版本在该设备上同样失败。用户感知的"以前能用"是因为早期没走到 agent 模式读沙箱文件这条路。

---

## 为什么修复不会被同样拦截（关键设计）

沙箱 seatbelt 管的是**"有没有按名字 `open()` 某个路径"**，不管往已打开的 fd 写什么。

| | 写 stdout 的方式 | 沙箱 |
|---|---|---|
| Apple base64 脚本 | `> /dev/stdout` **按名打开设备文件** | ❌ 拒 |
| `openssl base64 -d -A` | 直接写**继承的 fd1**（那个管道），从不 open `/dev/*` | ✅ 放行 |

真机边界验证：`echo x > /dev/stdout`、`> /dev/fd/1`、`tee /dev/stdout` **全部被拒**；`echo x`（写继承 fd1）正常；`openssl base64 -d -A` 输出 `hello`。所以修复选"写继承 fd1"这条，绕开了拦截点，并刻意不引入任何按名 `/dev/*` 引用。

---

## 修复方案

把沙箱内解码 base64 的命令从 `base64 -d` 换成 openssl 优先、base64 兜底的管道：

```
BASE64_DECODE = 'openssl base64 -d -A || base64 -d'
```

- openssl 在 macOS 必带（LibreSSL），写继承 fd1、不碰 `/dev/*`；
- `|| base64 -d` 仅为极小概率无 openssl 的 Linux 沙箱兜底（GNU base64 本就正常）；
- **openssl 必须在前**：若 base64 在前，13.x 上它会先读走 stdin 再失败，兜底的 openssl 拿到空输入仍解码为空。

改动落在三处解码点（分支 `fix/sandbox-base64-openssl-decode`）：

1. `local-provider.ts` → `buildBashExecutionCommand`（bash 解码）
2. `local-provider.ts` → `buildNodeExecutionCommand`（node 解码）
3. `filesystem.ts` → `writeSandboxFile`（写文件时的解码）

配套加了单测，锁定两个 builder 都用 openssl 解码 + base64 回退。

> 备选更彻底方案（B）：`provider.exec()` 改为"主进程写代码文件 → 直接执行文件"，完全不用任何解码器，平台/解码器无关。已在真机对 bash + node 双验证可行；因改动面大，作为后续加固选项。

---

## 影响面与兼容性

| 平台 | 之前 | 之后 | 结果 |
|---|---|---|---|
| macOS 15.x（base64 本就正常） | base64 | openssl（必带） | 等价替换，无回归 |
| macOS 13.x（脚本 base64） | base64（炸） | openssl | **修好** |
| Linux 沙箱 | GNU base64 | openssl 优先，缺失回退 base64 | 正常 |
| Windows | 原生执行路径，不用 base64 | 不受影响 | 无变化 |

结论：全体走 openssl 优先，对本来正常的用户是等价替换，无人变得更糟。受影响的是停留在 macOS 13.x（可能含 14.x）的用户；15.x 已换回二进制。

---

## 结果与影响

### 1) 短期结果

- 把一个被 AI 自身误判掩盖的报障，收敛成可解释、可复现、可安全修复的问题。
- 证明"文件在、能读，坏的是解码层"，纠正了"文件没上传"的错误结论方向。
- 在真实故障设备上验证修复有效后才落码，降低"改完还是坏"的风险。

### 2) 中期价值

- 沉淀了"绕过沙箱直读 + 逐层剥离"的排查手法，后续同类沙箱问题可复用。
- 明确了 seatbelt 的一条关键边界：按名打开 `/dev/*` 会被拒，只允许写继承 fd。

### 3) 长期复用价值

- 沉淀了一个典型经验：AI 工具返回空 / 报错，不等于底层数据不存在，要用旁路通道交叉验证。
- 沉淀了"系统原厂二进制随版本变化会踩沙箱策略"的风险认知。

### 4) 关键经验

- AI 自己给的诊断结论（"文件没上传"）也可能是错的，要用独立通道证伪。
- 最扎眼的报错（`/dev/stdout not permitted`）未必是主因，可能是红鲱鱼。
- "升级后才坏"不一定是回归，可能是用法第一次踩到早已潜伏的缺陷。
- 修复要针对"机制差异"（按名 open vs 写继承 fd），而不是换个"看起来更高级"的工具。

---

## 为什么这件事值得写成成就

难点不在于最后那行 `openssl base64 -d -A`，而在于：

- 顶住了 AI 自身给出的错误结论，坚持用旁路通道证伪"文件没上传"；
- 在一堆红鲱鱼（`/dev/stdout` 报错、"alpha.15 回归"感知）中找到真正的单点根因；
- 把根因精确到"系统原厂二进制的一行重定向 + seatbelt 的按名 open 策略"这一层；
- 并且在真实故障设备上先验证、再落码，给出对全体用户无回归的最小修复。

这类排查会直接提升团队处理跨系统 / 沙箱 / AI 工具链复杂问题的判断准确率。
