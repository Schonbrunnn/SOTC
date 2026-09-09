# 厂区打地鼠 Demo

一个支持 Mac 鼠标、键盘以及 iPhone/iPad 触屏的响应式网页游戏。

GitHub Pages 公开地址：<https://schonbrunnn.github.io/SOTC/>

## 玩法

- 每局 30 秒，击中头像得分。
- 连续命中会提高单次得分；打空或目标逃走会断连。
- 连续命中 5 次会触发小马笑声彩蛋。
- 最高分保存在当前浏览器中。

## 本地运行

需要 Node.js 22+ 和 pnpm：

```bash
pnpm install
pnpm dev
```

打开终端显示的本地地址即可。iPhone/iPad 可以直接使用已发布链接在 Safari 中游玩，并通过“添加到主屏幕”获得接近 App 的启动体验。

## GitHub Pages 发布

仓库内置自动发布流程。GitHub 仓库的 **Settings → Pages → Source** 选择 **GitHub Actions** 后，每次推送到 `main` 都会自动构建并发布。
