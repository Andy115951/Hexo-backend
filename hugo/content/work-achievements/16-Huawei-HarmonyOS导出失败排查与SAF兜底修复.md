---
title: 案例 A16：Huawei / HarmonyOS 导出失败排查与 SAF 兜底修复
date: 2026-08-06T16:00:00+08:00
draft: true
categories:
  - 稳定性治理
  - 故障排查
  - 移动端兼容性
tags:
  - Chatbox
  - Android
  - Huawei
  - Honor
  - HarmonyOS
  - Scoped Storage
  - SAF
  - Capacitor
  - Debugging
---

## 一句话成就

把部分 Huawei / Honor 设备上“导出 write failed、权限不足、Missing parent directory”的模糊报障，收敛为公共 Documents 目录直写在特定 ROM / 存储实现上不可靠的问题；在保留正常 Android 设备原有自动导出体验的前提下，建立 `Documents 直写 -> App Cache 暂存 -> Android 系统另存为（SAF）` 的可诊断、可取消、可清理的兜底链路，并完成真机日志与导出文件验证。

---

## 成就卡片

- 成就编号：A16
- 时间范围：2026-07
- 业务域：移动端稳定性治理 / 文件导出 / Android 存储兼容性
- 我的角色：真机问题复现、ADB 取证、跨端代码链路追踪、原生桥接方案设计、修复迭代、日志验证、PR 交付
- 影响对象：部分 Huawei / Honor / HarmonyOS 用户、Android 聊天导出、日志导出、图片下载与大文件备份导出链路
- 产出类型：根因分析、Android 原生 Capacitor 插件、渲染层 fallback、诊断日志、单元测试、真机验证证据、PR 说明
- 最终合入提交：`851fc190b fix(android): add Huawei export fallback via SAF picker`

---

## 背景与问题定义

### 1. 用户可见现象不是一个固定错误

最初反馈是：Android 手机上的聊天 / 日志 / 图片导出失败，提示 `write failed`、权限不足。随后为了验证目录创建行为，手动删除原本创建过的目标目录后，错误稳定收敛为：

```text
Missing parent directory
```

日志中对应的 Capacitor 文件系统错误为：

```text
code: OS-PLUG-FILE-0011
message: Missing parent directory - possibly recursive=false or parent directory creation failed
```

问题并非所有 Android 设备都会出现：绝大部分机型可以继续直接导出，只有部分 Huawei / Honor 设备稳定失败。因此不能粗暴把所有 Android 导出都改为“每次弹系统另存为”，否则会牺牲原来正常设备的一键导出体验。

### 2. 目标设备的系统身份需要拆开理解

用户界面显示的是 HarmonyOS 3，但 ADB 和 Android App 运行时看到的是 Android 兼容层：

```text
设备型号：HLK-AL00
Harmony / EMUI 构建：HarmonyOS 3 / EmotionUI 13
Android compatibility release：10
SDK：29
```

这里的结论不是“这台手机不是 HarmonyOS”，而是：对 Capacitor Filesystem、Android 权限、`Documents` 目录与 SAF 来说，实际要面对的是 Android 10 / API 29 的兼容层和 Huawei ROM 的存储实现。这个区分直接决定排查方法和修复 API 的选择。

### 3. 原有导出设计

Android 原有导出目标是：

```text
Directory.Documents/chatbox_ai_exports/<filename>
```

即用户无需额外选择位置，文件直接出现在公共 Documents 下的 `chatbox_ai_exports` 子目录。普通文本、图片、URL 下载、分块 JSON 导出和 ZIP 备份虽然入口不同，最终都依赖 Capacitor 的 Android 文件系统能力向该目录写入。

原设计在多数设备上是合理的：路径稳定、可自动命名、操作少。但它隐含了一个跨 ROM 假设：应用有权创建并写入 `Documents/chatbox_ai_exports`，并且 Capacitor 的 `recursive: true` / `mkdir` 在该 ROM 上有效。故障设备证明这个假设不成立。

---

## 目标与验收标准

### 目标

1. 定位“权限不足”究竟是用户未授权、目录不存在、Capacitor 行为差异，还是 Huawei / HarmonyOS 的公共目录限制。
2. 不改变正常 Android 设备的原始自动导出位置和交互。
3. 让故障设备在 Documents 直写失败后，仍可导出 JSON、文本、图片、URL 下载结果和流式大文件。
4. 不把用户主动取消系统保存面板误报成红色错误。
5. fallback 产生的 App Cache 临时文件在保存成功、保存失败或用户取消后都能清理。
6. 让后续现场排查能从日志区分：直写失败、cache 暂存失败、系统面板取消、复制失败或最终保存成功。

### 验收标准

| 验收项 | 验证方式 | 通过标准 |
|---|---|---|
| 正常设备行为不变 | 普通 Android 设备导出 | 仍直接写入 `Documents/chatbox_ai_exports/...`，不弹系统 picker |
| Huawei 故障场景可恢复 | 删除目标父目录后导出 | 捕捉 `OS-PLUG-FILE-0011`，继续进入系统另存为面板 |
| 最终文件正确 | 打开保存后的 JSON | 文件存在、大小符合日志、内容可解析 |
| 大文件内存边界 | 观察流式实现与单测 | 保留分块写入，不将大文件整份收集进 JS 内存 |
| 取消不是失败 | 在系统另存为面板点取消 | 无错误 Toast，日志为 cancel 信息 |
| 临时文件卫生 | 正常保存和取消各验证一次 | `Directory.Cache/chatbox_temp_exports/...` 都在 finally 清理 |
| 日志可读 | 人为触发错误 | Error 的 `message` / `code` 不再序列化为 `{}` |

---

## 排查过程：从“权限问题”到“公共目录直写不可靠”

### 阶段 1：先排除“只是没有申请权限”

最初看起来像 Android 存储权限问题，因此先检查了导出前的权限请求和设备包权限状态。结果是：应用的公共存储权限检查可以返回 `granted`，但写入 `Directory.Documents/chatbox_ai_exports/...` 仍失败。

这说明“权限显示已授予”不等于“应用在该设备上可以稳定拥有公共 Documents 子目录的写入能力”。在 Android scoped storage 与厂商 ROM 叠加的环境下，权限状态只能说明某个传统权限的授予状态，不能证明目录创建、文件句柄获取和公共目录写入这条完整链路一定可用。

关键经验：**不要用权限状态替代真实写入结果。** 对文件导出而言，唯一可靠的成功信号是实际写入 / 下载 API resolve，并能取得目标 URI。

### 阶段 2：用“删除手动创建目录”复现出决定性错误

此前目标目录曾被手动创建，导致问题表现不稳定。删除该目录后再次导出，错误变成稳定的 `Missing parent directory`。这一步非常关键，因为它把“可能是权限”缩小为“应用自己无法创建或使用父目录”。

原始路径可以抽象为：

```text
Documents/
  chatbox_ai_exports/
    chatbox-exported-data-<timestamp>.json
```

故障发生在应用尝试创建或写入 `chatbox_ai_exports` 时，而不是 JSON 组装、内容编码或文件名生成阶段。

### 阶段 3：确认原有 `recursive` 与显式 mkdir 都无法挽救该设备

原有调用已携带 `recursive: true`；修复早期也加入了“首次写入失败后显式 `mkdir`，再重试写入”的保护。日志表明在该 Huawei 设备上会稳定出现：

```text
writeToDocuments:firstAttempt
  -> OS-PLUG-FILE-0011 / Missing parent directory
writeToDocuments:retryAfterMkdir
  -> 再次失败
```

这排除了“少传了 recursive 参数”这种简单问题。更准确的结论是：**这台设备上，应用经 Capacitor 直接拥有 Documents 下私有子目录的路径不可依赖。**

### 阶段 4：保留默认路径，而不是按品牌硬编码分支

不能简单写成“Huawei / Honor 一律走系统选择器”，原因有三点：

1. 并非所有 Huawei / Honor 都失败，品牌不是可靠判据。
2. 也可能有其他 ROM 出现相同公共目录限制。
3. 正常设备直接导出的体验更顺畅，没必要把所有用户都改成两步保存。

最终使用的是**能力失败驱动**的策略：先按原路径写；只有写入实际抛错时才 fallback。对于明确的 `OS-PLUG-FILE-0011 + Missing parent directory`，流式 JSON 会直接短路至 cache + 系统保存，避免再次对 Documents 做没有意义的重试。

---

## 方案决策：为什么不是“再申请一次权限”或“换一个公共目录”

### 备选方案对比

| 方案 | 可行性 | 问题 | 最终结论 |
|---|---|---|---|
| 继续申请 / 强制要求传统存储权限 | 不可靠 | 权限已显示 granted 仍失败；新 Android 存储模型和 ROM 行为不保证可写公共 Documents 子目录 | 不采用 |
| 引导用户手动创建 `chatbox_ai_exports` | 可临时绕过 | 把系统兼容问题转嫁给用户；目录被删后仍会复发 | 不采用 |
| 直接改写 Download 目录 | 不可靠 | 仍是应用尝试直接写公共目录，不能从根本解决目录 / ROM 限制 | 不采用 |
| 所有 Android 均使用分享或另存为 | 可行但体验退化 | 正常设备失去原有一键导出；用户每次都要选择位置 | 不采用 |
| 使用 Android Storage Access Framework（SAF） | 可行 | 需要原生桥接和临时文件；用户需在 fallback 时选择最终位置 | 采用 |

### 为什么 `ACTION_CREATE_DOCUMENT` 的权限足够

SAF 的关键不是让应用获得整个 Documents 目录的永久写权限，而是让用户在系统文件选择器中明确选择一个目标文件。系统随后把该目标 `content://` URI 的写入授权交给本次操作。

因此 final path 不再由 App 直接拼出并写入公共目录，而是：

```text
用户在系统面板选位置
  -> Android 返回目标 content URI
  -> 应用仅向这个用户已授权的 URI 写入
```

这正好避开了“应用无法自行管理 Documents/chatbox_ai_exports 父目录”的问题，同时让用户可以选 Documents、Downloads、U 盘或厂商文件管理器支持的位置。

---

## 最终架构：Documents 优先，SAF 兜底

### 总体流程

```text
发起导出
  -> 尝试原始路径 Directory.Documents/chatbox_ai_exports/<filename>
     -> 成功：显示已保存，流程结束
     -> 失败：记录失败阶段、错误 code、错误 message
       -> 在 Directory.Cache/chatbox_temp_exports/<unique>-<filename> 写入完整导出数据
       -> 调起 ACTION_CREATE_DOCUMENT
       -> 用户选择最终保存位置
          -> 确认：原生层把 cache 文件复制到系统授权的 content URI
          -> 取消：作为取消处理，不显示“导出失败”
       -> finally 删除 cache 临时文件
```

### 设计原则

1. **正常路径优先**：不以品牌、系统名或 SDK 版本预判，先保留原来的 Documents 自动导出。
2. **文件内容先落 App 可控位置**：cache 是应用自身可写目录，不依赖公共目录父路径创建。
3. **最终公共写入交给系统**：用 SAF 的用户选择和 URI 授权完成最后一跳。
4. **临时文件的创建者负责清理**：fallback 方法自己在 `finally` 中清理，不能指望上层调用方记得处理。
5. **取消是独立业务状态**：取消与失败不能共用 error Toast 或 ERROR 日志。
6. **大文件维持流式**：fallback 不能为了“能保存”而退化成先把完整 JSON / ZIP 收集到内存。

---

## 分场景导出链路

### 1. 普通文本、JSON、小型 Blob 与图片

入口包括聊天记录 JSON、日志 TXT、图片 base64 等。正常情况下直接通过 `Filesystem.writeFile` 写入：

```text
Directory.Documents/chatbox_ai_exports/<filename>
```

失败时：

```text
Filesystem.writeFile(Documents) 失败
  -> writeTextToCache / writeBinaryToCache
  -> Directory.Cache/chatbox_temp_exports/<unique>-<filename>
  -> AndroidDocumentSaver.saveFile(...)
  -> ACTION_CREATE_DOCUMENT
  -> 将 cache 内容复制到用户选择的 content URI
  -> cleanupCacheTempFile(...)
```

### 2. URL 图片 / 文件下载

`exportByUrl` 主要服务于远程图片下载，例如生成图片图库、图片预览、聊天消息图片等。

正常路径是 `Filesystem.downloadFile` 直接下载到 Documents。fallback 有一个容易被忽略的细节：不能假设 `downloadFile(... recursive: true)` 一定能创建 cache 下的嵌套目录。

最终处理为：

```text
getCachePath()
  -> prepareCacheDownloadPath(): writeFile('', recursive: true)
  -> downloadFile() 写入已准备好的 cache 文件
  -> SAF 保存
  -> finally 删除临时文件
```

也就是说，fallback 自己不会因为 `chatbox_temp_exports` 父目录不存在而再次出现 `Missing parent directory`。对应单测明确断言：cache 空文件准备发生在第二次 `downloadFile` 之前。

### 3. 大型 JSON 导出

历史上分块导出的目的，是控制内存和降低大文件一次性写入失败风险。修复没有把它改成“先把全部内容拼成字符串，再保存”。

正常设备仍然是：

```text
first chunk -> Documents/writeFile
subsequent chunks -> Documents/appendFile
last chunk -> getUri / 完成提示
```

故障设备首次 Documents 分块写入失败后，fallback 重新通过可重复的 `dataCallback()` 取得新的生成器，按约 `1 MiB` 缓冲区写到 cache：

```text
first buffered chunk -> Cache/writeFile(recursive: true)
later chunks -> Cache/appendFile
cache 完整文件 -> SAF copy
```

因此两条路径都保持有界内存：不会因为 Huawei fallback 而把整份大型 JSON 放到一个 JS string 中。

对于精确命中 `OS-PLUG-FILE-0011 + Missing parent directory` 的情况，会从原始流式写入失败后直接进入 cache 流式 fallback，不再重新调用普通文本导出并对白名单已知无效的 Documents 做第二轮尝试。

### 4. 大型二进制备份 / ZIP

二进制流使用 `Uint8Array` 分块编码并写入。正常路径仍写 Documents；失败时同样按块写入 cache，再交给 native plugin 从源 URI 流式复制到最终的系统 URI。

原生复制使用 `8 KiB` 缓冲区，而不是在 Java 层把文件整份读入内存：

```java
byte[] buffer = new byte[8192];
while ((length = inputStream.read(buffer)) != -1) {
    outputStream.write(buffer, 0, length);
}
```

这保证“分块导出”的性能和内存目标在 fallback 后仍成立。

---

## 原生桥接实现：DocumentSaverPlugin

### 为什么需要 Java 插件

Capacitor Filesystem 擅长读写应用可访问的文件路径，但“让用户选择一个外部位置，再拿到可写 `content://` URI”是 Android Activity 结果流程，需要原生侧处理。

新增 `DocumentSaverPlugin`，由 `MainActivity` 在 `super.onCreate()` 前注册。它的职责非常窄：

1. 接收 cache 文件 URI、建议文件名、MIME type。
2. 使用 `Intent.ACTION_CREATE_DOCUMENT` 打开系统另存为。
3. 接收用户选择的目标 URI。
4. 从 cache 以 stream 读取，向目标 URI 以 stream 写入。
5. 返回保存成功的 URI，或用结构化 code 返回取消 / 异常。

### 关键实现片段

```java
Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
intent.addCategory(Intent.CATEGORY_OPENABLE);
intent.setType(resolveMimeType(suggestedName, mimeType));
intent.putExtra(Intent.EXTRA_TITLE, suggestedName);
startActivityForResult(call, intent, "saveFileResult");
```

保存成功后：

```java
copyUriToTarget(sourceUriValue, targetUri);

JSObject ret = new JSObject();
ret.put("uri", targetUri.toString());
call.resolve(ret);
```

### 取消与不完整目标处理

系统面板取消时，插件明确返回：

```java
call.reject("Save canceled", "SAVE_CANCELED");
```

渲染层据 code 识别取消，而不是依赖易变的中文 / 英文错误文案。

如果用户已选择目标，但复制过程中发生 I/O 错误，插件会尝试删除刚刚创建的不完整 target URI，避免文件管理器里留下一个看似成功、实际内容残缺的文件：

```java
getContext().getContentResolver().delete(targetUri, null, null);
```

---

## 修复迭代：不是一次性写完，而是逐步打磨失败边界

### 迭代 1：先补齐基础 fallback

最初修复建立了“Documents 失败 -> cache -> 系统 picker”的主链路。它解决了根本的路径权限边界，但后续真机日志和 review 发现，主流程正确不代表所有结束状态都正确。

### 迭代 2：临时 cache 文件清理

发现问题：每次 fallback 都会在：

```text
Directory.Cache/chatbox_temp_exports/<unique>-<filename>
```

留下临时导出文件。虽然 cache 最终可能被系统回收，但导出内容可能包含聊天、日志、图片或备份数据；尤其用户取消另存为时，不能让临时文件一直残留。

修复：将清理逻辑放入每条 fallback 的 `finally`：

```ts
try {
  // cache 写入 / SAF 保存
} finally {
  await this.cleanupCacheTempFile(tempPath, filename)
}
```

真机日志确认两类路径都清理：

```text
正常保存 -> cleanupCacheTempFile:success
用户取消 -> cleanupCacheTempFile:success
```

### 迭代 3：外层错误日志从 `{}` 变为可诊断信息

发现问题：JavaScript `Error` 被直接 JSON 序列化后会变成空对象，日志曾出现：

```text
[ERROR] exportTextFile failed {"filename":"...txt","error":{}}
```

这意味着真正需要排查时，最外层反而看不到 `message` 与 `code`。

修复：统一使用 `serializeErrorForLog(error)`，保留：

```text
name
message
stack
code
cause
```

修复后可以看到决定性证据：

```text
code: OS-PLUG-FILE-0011
message: Missing parent directory ...
```

日志因此从“知道失败了”提升为“知道失败发生在哪一层、为什么失败”。

### 迭代 4：把用户取消从错误状态中分离

发现问题：用户在系统另存为页面点取消时，原生层会 reject，TypeScript 将它当成普通错误，导致红色 Toast 和 ERROR 日志。对用户而言这是主动取消，不是导出失败。

修复：使用原生 `SAVE_CANCELED` code，并让渲染层通过 `isSaveCanceledError` 处理：

```text
Save canceled
  -> info 日志
  -> 结束本次导出
  -> 不显示失败 Toast
```

同时确保只有 `MobileExporter` 顶层负责吞掉已识别的取消；底层继续向上抛，避免某一层静默吞错而让另一层错误弹窗。

### 迭代 5：避免大 JSON 对 Documents 白试第二遍

发现问题：大 JSON 流式写入首次失败后，旧 fallback 会先收集内容并调用普通文本导出；普通文本导出又会重新尝试 Documents。对于已被精确识别为 `Missing parent directory` 的设备，这是一整套注定失败的重复写入。

修复：在流式路径识别到：

```text
OS-PLUG-FILE-0011 + Missing parent directory
```

后直接进入 cache 流式写入 + picker，不再重复 Documents 尝试。这个优化是保守的：只有精确错误签名才短路；若未来底层错误形状变化，仍会退回通用 fallback，而不会丢失导出能力。

真机新日志验证到：

```text
Documents streaming write failed
  -> fallbackCacheStream:start
  -> pickerSaved
  -> cleanupCacheTempFile:success
```

并确认中间没有第二次 `exportTextFile:documentsAttempt`。

### 迭代 6：URL 下载 fallback 先准备 cache 父路径

发现问题：`exportByUrl` 的 fallback 直接调用 `Filesystem.downloadFile` 写入嵌套 cache 路径，依赖 `downloadFile(... recursive: true)` 自动建目录。部分实现中这条假设也可能失效，导致“公共 Documents 失败后，fallback 又因 cache 父目录不存在失败”。

修复：先用 `Filesystem.writeFile('', recursive: true)` 创建目标 cache 文件及父目录，再让 `downloadFile` 写入该已存在位置。单测覆盖了“先 prepare，再 download，再 SAF 保存，最后 cleanup”的顺序。

### 迭代 7：避免重复报错和敏感 URL 落日志

`HandledExportError` 区分“底层已经展示给用户的真实失败”和“需要顶层继续抛出的未处理错误”，避免 fire-and-forget 调用方造成重复 Toast。

同时，`exportByUrl` 记录 URL 时只保留 origin，例如：

```text
https://user:password@example.com/private/image.png?token=secret#fragment
  -> https://example.com
```

不把路径、查询参数、fragment 或认证信息写进导出日志。

---

## 真机验证证据

### 设备侧验证结论

在目标 Huawei / HarmonyOS 设备上，原始 Documents 路径持续出现 `Missing parent directory`，说明根因没有被“修好”为可直写；修复的价值是可靠地识别这一失败并安全切换保存机制。

最终成功日志形成完整闭环：

```text
Documents write failed
  -> fallbackDirectPicker:start / fallbackCacheStream:start
  -> pickerSaved
  -> cleanupCacheTempFile:success
  -> export completed via Android fallback path
```

实际导出的 JSON 文件被保存并可读取，日志记录的大小为 `89,854` bytes。该验证同时证明：

1. 直写失败已被捕获，而不是静默吞掉。
2. 用户选定位置后的 SAF 写入权限有效。
3. cache 到目标 URI 的复制完成。
4. 成功后 cache 临时文件被删除。
5. 大 JSON fallback 未再重复尝试 Documents。

### 单元测试覆盖

`src/renderer/platform/filter_writer.test.ts` 增加 / 覆盖的关键行为包括：

| 场景 | 验证点 |
|---|---|
| URL fallback | cache 嵌套路径先被创建，再执行第二次下载 |
| 文本流式 fallback | 约 1 MiB 分块写 cache，后续内容走 `appendFile` |
| 二进制流式 fallback | 二进制数据分块写入，不聚合完整文件 |
| cache 清理 | picker 保存后删除临时文件 |
| 取消识别 | `SAVE_CANCELED` 被识别，其他异常不被误认为取消 |
| URL 日志脱敏 | 用户名、密码、path、query、fragment 不出现在日志 |
| 已处理错误 | 已提示用户的错误不再被顶层重复报错 |

---

## 关键代码位置

| 文件 | 职责 |
|---|---|
| `src/renderer/platform/filter_writer.ts` | Android Documents 直写、cache fallback、错误分类、临时文件清理、URL 日志脱敏 |
| `src/renderer/platform/mobile_exporter.ts` | 各类导出入口的顶层日志、取消处理、流式 JSON / ZIP fallback 调度 |
| `src/renderer/platform/android_document_saver.ts` | TypeScript 到 Capacitor 原生插件的桥接定义 |
| `android/app/src/main/java/xyz/chatboxapp/chatbox/DocumentSaverPlugin.java` | `ACTION_CREATE_DOCUMENT`、系统 URI 回调、stream copy、不完整目标清理 |
| `android/app/src/main/java/app/chatboxai/m/MainActivity.java` | 注册 `DocumentSaverPlugin` |
| `src/renderer/platform/filter_writer.test.ts` | 关键 fallback、清理、取消、URL 脱敏和流式行为测试 |

本次没有新增 npm 包、Gradle 依赖或 Android 运行时权限；新增的是现有 Capacitor 容器中的 Java 插件与渲染层逻辑。系统另存为所需的写入授权来自用户在 `ACTION_CREATE_DOCUMENT` 中选择的目标 URI，而不是额外的广泛存储权限。

---

## 影响范围与兼容性边界

### 受影响的平台

| 平台 | 行为 |
|---|---|
| Android | 增加 Documents 失败后的 SAF fallback；正常设备保持原路径 |
| Huawei / Honor / HarmonyOS Android compatibility | 目标问题场景得到恢复；不按品牌强制分流 |
| iOS | 不走 AndroidDocumentSaver，不改变原有分享 / 文件逻辑 |
| Desktop | 不走 MobileExporter，不受影响 |
| Web | 不走 Capacitor Android Filesystem，不受影响 |

### 用户体验变化

- 正常 Android：无变化，仍自动导出到 `Documents/chatbox_ai_exports`。
- 故障机型：首次 Documents 失败后会出现一次系统“另存为”面板，用户选择最终保存位置。
- 用户取消系统面板：不显示失败提示，不残留临时文件。
- 最终文件名：以应用建议名称传入系统面板；用户仍可在系统文件管理器中修改。

### 已知限制

1. 该机制绕过了特定设备的公共目录直写限制，而不是让 `Documents/chatbox_ai_exports` 在故障 ROM 上重新可写。因此故障设备可能每次导出都需要用户确认一次保存位置。
2. 真机因果验证覆盖的是已接入的 Huawei / Honor / HarmonyOS 样本，不能把它外推为所有华为设备都有同一问题，也不能保证其他品牌 ROM 的所有 Documents 错误都相同。
3. `Missing parent directory` 的短路仅针对精确 code + message；其余存储错误保留通用 fallback，以避免因为过度匹配而掩盖未知问题。
4. SAF 成功意味着已写入用户选择的 URI；目标文件是否被第三方文件管理器移动、云盘同步或后续删除，超出应用保存链路的控制范围。
5. cache 清理为最佳努力：失败会记录日志但不覆盖原始导出结果；系统 cache 也可能在操作中被回收，因此极端存储不足仍会触发可见失败。

---

## 为什么这件事难、且值得沉淀

表面上这是“加一个另存为”功能，实际横跨了五层边界：

```text
用户现象
  -> Android / HarmonyOS 兼容层与 ROM 存储行为
  -> Capacitor Filesystem 的目录创建和错误形状
  -> renderer 的文本、图片、URL、JSON、ZIP 多条导出路径
  -> native Activity 回调与 SAF content URI 授权
  -> 日志、错误展示、取消语义、临时文件生命周期
```

难点不在于某一次文件能否保存，而在于把这些状态收敛成不互相矛盾的链路：

- 不能因为修 Huawei 而破坏正常 Android 的自动保存。
- 不能因为 fallback 而把大文件退化为整份内存拼接。
- 不能因为用户点取消而误报“导出失败”。
- 不能因为错误对象序列化成 `{}` 而让后续排查失去根因。
- 不能因为临时文件留在 cache 而引入聊天数据残留风险。
- 不能因为 URL 诊断日志而泄露下载链接中的 token 或认证信息。

最终沉淀的不是单一机型补丁，而是一套适用于混合栈移动端文件输出问题的方法：**先用真实写入结果而不是权限状态判断能力；保留最佳默认体验；将无法控制的公共存储写入交给系统授权流程；把成功、失败、取消和清理都作为独立状态验证。**

---

## 完整排查与修复时间线

| 阶段 | 当时问题 / 假设 | 实际动作 | 证据与结论 |
|---|---|---|---|
| 初始报障 | `write failed` / 权限不足 | 检查 Android 导出路径和权限状态 | 权限 granted 不能证明 Documents 可写 |
| 复现收敛 | 手动创建目录时行为不稳定 | 删除 `chatbox_ai_exports` 后重新导出 | 稳定得到 `OS-PLUG-FILE-0011 / Missing parent directory` |
| 系统识别 | 用户称设备为 HarmonyOS 3 | ADB 读取 model、release、SDK、EMUI 信息 | 面向 Android 10 / API 29 兼容层排查，不混淆品牌与 API 行为 |
| 路径确认 | 是否只影响某种导出 | 追踪 text、blob、image、URL、streaming JSON / ZIP 入口 | 多入口共用 Documents 写入边界，需统一 Android writer 层兜底 |
| 初版修复 | 怎样让文件离开 App 私有目录 | 新增 `DocumentSaverPlugin` + `ACTION_CREATE_DOCUMENT` | Documents 失败后可由用户选定目标 URI |
| 日志加固 | 失败原因看不到 | 为阶段和错误对象加结构化日志 | `{}` 变为含 message / code 的可诊断信息 |
| 临时文件治理 | 保存或取消后 cache 残留 | fallback 方法内 `try/finally` 清理 | 正常保存与取消均实测清理成功 |
| 取消语义 | 用户取消被报红 | 原生返回 `SAVE_CANCELED`，上层按取消处理 | 取消变为 info，不再显示失败 Toast |
| 流式优化 | 已知 Documents 不可用还重复尝试 | 精确错误签名直接流式写 cache | 实测无第二次 Documents 尝试 |
| URL 加固 | fallback 下载也可能缺父目录 | 先 prepare cache path，再 download | 单测覆盖 fallback 自身的目录可靠性 |
| 安全加固 | URL 日志可能含 token | 日志只记录 URL origin | 不泄露账号、路径或查询参数 |
| 最终验证 | 修复是否只是代码看起来正确 | 比对新真机日志和实际 JSON | Documents 失败被捕获，SAF 保存、文件可读、cache 清理均完成 |

---

## 后续复用清单

### Android 文件输出问题的最小诊断顺序

```bash
# 1. 确认设备的 Android compatibility 层，而不仅是厂商系统名
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release
adb shell getprop ro.build.version.sdk

# 2. 检查应用与存储权限状态
adb shell dumpsys package xyz.chatboxapp.chatbox

# 3. 观察导出时的文件系统错误、code 与阶段日志
adb logcat
```

### 遇到公共目录直写不可靠时的决策模板

```text
是否必须自动保存到固定公共目录？
  -> 是：先验证 URI / MediaStore / 厂商行为，不能仅凭权限判断
  -> 否：可使用 SAF 让用户选择最终 URI

是否有可控的 App 私有 / cache 暂存位置？
  -> 有：先写临时文件，再 stream copy 到用户授权 URI
  -> 没有：先解决临时持久化边界，避免内存整包缓冲

是否支持取消？
  -> 支持：将 cancel 作为独立状态，并在 finally 清理临时文件
```

### 后续测试矩阵建议

| 维度 | 建议覆盖 |
|---|---|
| ROM | AOSP / Pixel、Samsung、Xiaomi、Huawei / Honor、OPPO / vivo |
| Android API | API 29、30、33、35 及目标市场最低版本 |
| 文件类型 | TXT、JSON、PNG、远程 URL 图片、ZIP |
| 文件大小 | 小文件、约 1 MiB 边界、数十 MiB 流式文件 |
| Documents 状态 | 父目录不存在、目录存在、同名文件、存储空间不足 |
| SAF 结果 | 保存成功、用户取消、目标 URI 不可写、复制中断 |
| 数据卫生 | 成功 / 失败 / 取消后 cache 临时文件是否清理 |
| 日志安全 | error 是否含 code/message，URL 是否不含 query / credential |

---

## 结果与影响

### 本次交付

- 将未知的“部分华为机型导不出”收敛为真实可观察的公共 Documents 父目录创建 / 写入失败。
- 保持多数正常 Android 设备的原有自动导出路径，不用按品牌做静态分支。
- 为故障设备提供标准 Android SAF 兜底，用户可自主选择最终保存位置。
- 覆盖文本、图片、URL 下载、流式 JSON 与 ZIP 等主要导出形态。
- 补齐取消、临时文件清理、错误日志序列化、URL 脱敏和不完整目标清理。

### 可复用价值

- 形成 App 私有 cache + SAF 的通用公共存储兼容模式。
- 形成“失败驱动而非品牌驱动”的设备兼容策略。
- 将移动端文件导出拆为可测试状态机：直写成功、直写失败、cache 成功、picker 成功、picker 取消、复制失败、cleanup。
- 为后续 Android 导出类问题留下结构化日志和明确的代码入口，减少“只看 `{}` 错误对象”的排查成本。

### 关键数字

- `1` 条明确的设备错误签名：`OS-PLUG-FILE-0011 + Missing parent directory`。
- `2` 层写入策略：公共 Documents 优先，App Cache + SAF 兜底。
- `3` 类最终结束状态：保存成功、用户取消、真实失败。
- `4` 类关键治理补充：临时文件清理、可读错误日志、取消语义、URL 脱敏。
- `8 KiB`：原生复制阶段的固定缓冲区，避免整文件读入内存。
- `约 1 MiB`：文本流式 fallback 的缓冲阈值，保留大文件有界内存行为。
- `89,854 bytes`：最终真机验证的导出 JSON 文件大小。

---

## 关联证据与提交

- 合并提交：`851fc190b fix(android): add Huawei export fallback via SAF picker`。
- 演进提交：`bd973adaf`、`f52b74487`、`c0c0e26e6`、`42f3b5abe`、`bb9e13a6b`、`4bdc77ff3`。
- 真机日志证据：`chatbox-logs-2026-7-9_19-18.txt`，包含 Documents 失败、picker 保存和 cache 清理链路。
- 真机导出物：`chatbox-exported-data-2026-7-9-t2.json`，可打开并与日志大小对应。
- 单元测试：`src/renderer/platform/filter_writer.test.ts`。

这份案例的核心不是“给一个机型加特判”，而是在不确定的 Android ROM 存储环境中，把导出从固定公共路径依赖改造成可降级、可解释、可验证的保存能力。
