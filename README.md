# Glenn's轻首页

一个零依赖、配置驱动的个人导航首页。支持百度、Bing、Google 搜索，网址直达，浅色/深色主题和移动端布局。

直接打开 `index.html` 即可使用。

## 文件结构

- `index.html`：页面结构
- `config.js`：标题、搜索引擎和全部导航入口
- `app.js`：配置渲染、搜索和主题逻辑
- `style.css`：页面样式与响应式布局
- `favicon.svg`：浏览器标签页图标

## 修改导航

编辑 `config.js`：

- `commonApps`：搜索框下方的常用软件
- `categories`：分类导航
- `searchEngines`：搜索引擎

每个链接支持以下字段：

```js
{
  name: "名称",
  icon: "图标文字",
  url: "https://example.com/",
  description: "鼠标悬停提示和副说明"
}
```

调整数组中条目的顺序即可改变页面上的显示顺序。分类本身也可在 `categories` 中新增、删除或重命名。

## 本地预览

直接双击 `index.html` 通常即可打开。若浏览器限制本地文件脚本，可在当前目录启动一个静态服务器：

```bash
python -m http.server 8000
```

然后访问 `http://localhost:8000/`。

## GitHub Pages

本项目发布在 `glennlee1/glenn-s` 仓库，通过 `main` 分支根目录部署 GitHub Pages：

```text
https://glennlee1.github.io/glenn-s/
```
