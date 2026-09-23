# Glenn导航

一个零依赖的个人搜索与网址导航首页，已适配桌面、平板和手机。页面支持 15 个搜索入口、网址直达、浅色/深色模式，以及在页面内维护全部导航模块。默认推荐同时覆盖中国本地和海外的游戏行业数据、增长分析与产品研究工具。

线上地址：<https://glennlee1.github.io/glenn-s/>

## 修改站名和导航模块

编辑 `config.js` 可以更换站名和“常用软件”恢复默认时使用的推荐清单。发布后，点击页头头像旁的编辑按钮，可以选择模块、修改模块名称，并新增、编辑、删除或恢复该模块的默认网址。默认分类中包含“数据 · 分析”模块，每个模块最多保留 15 个网址。

```js
window.siteConfig = {
  title: "Glenn导航",
  commonApps: [
    { name: "ChatGPT", url: "https://chatgpt.com/" },
    { name: "GitHub", url: "https://github.com/" },
  ],
};
```

每项只需要 `name` 和以 `http://` 或 `https://` 开头的 `url`。无效网址会被自动忽略。页面内的编辑保存在当前浏览器的 localStorage 中，不会自动同步到其他设备。搜索框下方还提供 CrazyGames 和 Poki 的小游戏入口。

## 文件结构

- `index.html`：页面结构
- `style.css`：界面和响应式布局
- `config.js`：站名与可编辑的常用软件
- `catalog.js`：固定的搜索引擎与分类导航
- `app.js`：渲染、搜索、搜索引擎切换、主题和导航模块编辑器逻辑
- `assets/brand/glenn-cat.png`：页头品牌图标
- `assets/search-icons/`：搜索服务的本地图标
- `favicon.png`：浏览器标签页图标

## 本地预览

这是纯静态网站，直接打开 `index.html` 即可预览。也可以用任意静态服务器启动当前目录。

## 发布

仓库 `glennlee1/glenn-s` 已配置为从 `main` 分支根目录发布。推送到 `main` 后，GitHub Pages 会自动更新线上网站。

搜索服务名称、图标和商标归各自权利人所有，仅用于标识对应的搜索入口。
