# Glenn's轻首页

一个零依赖的个人搜索与网址导航首页，已适配桌面、平板和手机。页面支持 15 个搜索入口、网址直达、浅色/深色模式，并通过 GitHub Pages 自动发布。

线上地址：<https://glennlee1.github.io/glenn-s/>

## 修改站名和常用软件

只需编辑 `config.js`。修改 `title` 可以更换网页名；修改 `commonApps` 可以增删、改名或排序“常用软件”。

```js
window.siteConfig = {
  title: "Glenn's轻首页",
  commonApps: [
    { name: "ChatGPT", url: "https://chatgpt.com/" },
    { name: "GitHub", url: "https://github.com/" },
  ],
};
```

每项只需要 `name` 和以 `http://` 或 `https://` 开头的 `url`。无效网址会被自动忽略。

## 文件结构

- `index.html`：页面结构
- `style.css`：界面和响应式布局
- `config.js`：站名与可编辑的常用软件
- `catalog.js`：固定的搜索引擎与分类导航
- `app.js`：渲染、搜索、搜索引擎切换和主题逻辑
- `favicon.svg`：站点图标

## 本地预览

这是纯静态网站，直接打开 `index.html` 即可预览。也可以用任意静态服务器启动当前目录。

## 发布

仓库 `glennlee1/glenn-s` 已配置为从 `main` 分支根目录发布。推送到 `main` 后，GitHub Pages 会自动更新线上网站。
