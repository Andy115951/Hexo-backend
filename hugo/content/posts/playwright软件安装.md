---
title: playwright软件安装方法
date: 2025-11-06T00:00:00+08:00
categories:
  - articles
  - QA
---


### 安装软件+验证

安装软件之后打开应用获取当前版本号并断言是否安装成功

### 安装软件逻辑

```tsx
async installDmg(dmgPath: string, appName: string): Promise<void> {
        if (process.platform !== 'darwin') {
            throw new Error('installDmg 仅在 macOS 上可用');
        }

        const volumesBefore = await fs.readdir('/Volumes');
        try {
            // 1. 先退出正在运行的应用
            const appNameWithoutExt = appName.replace('.app', '');
            await exec(`osascript -e 'tell application "${appNameWithoutExt}" to quit'`).catch(() => {});
            // 等待应用完全退出
            await new Promise(r => setTimeout(r, 2000));

            // 2. 挂载 dmg
            await exec(`hdiutil attach -nobrowse -quiet "${dmgPath}"`);
            await new Promise(resolve => setTimeout(resolve, 1000));

            const volumesAfter = await fs.readdir('/Volumes');
            const newVolume = volumesAfter.find(v => !volumesBefore.includes(v));
            if (!newVolume) {
                throw new Error('未找到挂载的卷，请检查 dmg 是否正确或是否已被挂载');
            }

            const src = `/Volumes/${newVolume}/${appName}`;
            const dest = `/Applications/${appName}`;

            // 3. 删除已存在的应用
            if (await fs.access(dest).then(() => true).catch(() => false)) {
                console.log('删除已存在的应用...');
                await exec(`rm -rf "${dest}"`).catch(async (e) => {
                    // 如果普通删除失败，尝试使用 sudo
                    console.log('普通删除失败，尝试使用管理员权限删除...');
                    await exec(`osascript -e 'do shell script "rm -rf ${dest}" with administrator privileges'`);
                });
            }

            // 4. 复制新应用
            try {
                // 先尝试普通复制
                await exec(`ditto "${src}" "${dest}"`);
            } catch (e) {
                // 如果普通复制失败，使用管理员权限复制
                console.log('普通复制失败，尝试使用管理员权限复制...');
                await exec(`osascript -e 'do shell script "ditto \\"${src}\\" \\"${dest}\\"" with administrator privileges'`);
            }

            // 5. 移除隔离属性
            await exec(`xattr -rc "${dest}"`).catch(() => {});

        } finally {
            // 卸载 dmg
            const volumesNow = await fs.readdir('/Volumes');
            const mounted = volumesNow.filter(v => !volumesBefore.includes(v));
            for (const vol of mounted) {
                try {
                    await exec(`hdiutil detach "/Volumes/${vol}" -force -quiet`);
                } catch (e) {
                    // 忽略卸载失败
                }
            }
        }
    }
```

思路

1.检查macos系统

- `'darwin'`: macOS 系统
- `'win32'`: Windows 系统
- `'linux'`: Linux 系统

```tsx
// 确保是 macOS 系统
if (process.platform !== 'darwin') {
    throw new Error('installDmg 仅在 macOS 上可用');
}
// 记录当前已挂载的卷，用于后续对比找出新挂载的 DMG
const volumesBefore = await fs.readdir('/Volumes');`
```

2.退出应用

```tsx
// 移除 .app 后缀获取应用名
const appNameWithoutExt = appName.replace('.app', ''); // 例如："Chatbox.app" -> "Chatbox"
// 使用 AppleScript 退出应用
await exec(`osascript -e 'tell application "${appNameWithoutExt}" to quit'`);
// 等待 2 秒确保应用完全退出
await new Promise(r => setTimeout(r, 2000));
```

3.删除旧版本

```tsx
if (await fs.access(dest).then(() => true).catch(() => false)) {
    console.log('删除已存在的应用...');
    try {
        // 先尝试普通权限删除
        await exec(`rm -rf "${dest}"`);
    } catch (e) {
        // 如果普通删除失败，使用管理员权限删除
        await exec(`osascript -e 'do shell script "rm -rf ${dest}" with administrator privileges'`);
    }
}
```

4.挂载dmg

```tsx
// 记录当前已挂载的卷
volumesBefore = await fs.readdir('/Volumes');
// 静默挂载 DMG
await exec(`hdiutil attach -nobrowse -quiet "${dmgPath}"`);
// 等待挂载完成
await new Promise(resolve => setTimeout(resolve, 1000));
```

5.定位新挂载卷

```tsx
// 获取挂载后的卷列表
const volumesAfter = await fs.readdir('/Volumes');
// 找出新增的卷
const newVolume = volumesAfter.find(v => !volumesBefore.includes(v));
if (!newVolume) {
    throw new Error('未找到挂载的卷');
}
```

6.复制新应用

```tsx
const src = `/Volumes/${newVolume}/${appName}`;
try {
    // 先尝试普通权限复制
    await exec(`ditto "${src}" "${dest}"`);
} catch (e) {
    // 如果失败，使用管理员权限复制
    await exec(`osascript -e 'do shell script "ditto \\"${src}\\" \\"${dest}\\"" with administrator privileges'`);
}
```

7.移除安全限制

```tsx
// 移除应用的隔离属性，避免首次打开时的安全提示
await exec(`xattr -rc "${dest}"`);
```