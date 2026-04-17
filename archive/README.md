# Legacy Hexo Archive

## 状态

- 当前生产与日常写作流程：`hugo/`
- 历史 Hexo 内容已归档到：
  - `archive/hexo-legacy`
  - `archive/hexo-backup-20260127`

## 归档目的

1. 降低主工作区噪音，避免误在旧框架继续编辑。
2. 保留历史资料，支持回溯与迁移对照。
3. 不破坏现有 Hugo 发布链路（`deploy.sh` 仍指向 `hugo/`）。

## 恢复方式

如需临时恢复 Hexo 工作区，可将对应目录移回项目根目录，例如：

```bash
mv archive/hexo-legacy ./hexo
```

## 建议

- 新内容统一在 `hugo/content/` 下维护。
- 若确认 Hexo 永久不用，可后续再做二次清理（删除归档目录并单独提交）。
