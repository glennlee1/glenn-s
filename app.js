(function () {
  "use strict";

  var STORAGE_KEYS = {
    theme: "glenn-home-theme",
    engine: "glenn-home-search-engine",
    apps: "glenn-home-common-apps",
  };
  var DEFAULT_TITLE = "Glenn导航";
  var config = window.siteConfig && typeof window.siteConfig === "object"
    ? window.siteConfig
    : {};
  var catalog = window.siteCatalog && typeof window.siteCatalog === "object"
    ? window.siteCatalog
    : {};

  var elements = {
    siteDescription: document.getElementById("siteDescription"),
    brandLink: document.getElementById("brandLink"),
    siteTitle: document.getElementById("siteTitle"),
    footerSiteTitle: document.getElementById("footerSiteTitle"),
    searchForm: document.getElementById("searchForm"),
    searchInput: document.getElementById("searchInput"),
    searchButton: document.getElementById("searchButton"),
    searchClear: document.getElementById("searchClear"),
    searchStatus: document.getElementById("searchStatus"),
    engineToggle: document.getElementById("engineToggle"),
    engineBadge: document.getElementById("engineBadge"),
    enginePanel: document.getElementById("enginePanel"),
    engineList: document.getElementById("engineList"),
    searchWrap: document.querySelector(".search-wrap"),
    navigationGrid: document.getElementById("navigationGrid"),
    themeToggle: document.getElementById("themeToggle"),
    themeColor: document.getElementById("themeColor"),
    currentYear: document.getElementById("currentYear"),
    appEditor: document.getElementById("appEditor"),
    appEditorForm: document.getElementById("appEditorForm"),
    appNameInput: document.getElementById("appNameInput"),
    appUrlInput: document.getElementById("appUrlInput"),
    appEditorSubmit: document.getElementById("appEditorSubmit"),
    appEditorCancel: document.getElementById("appEditorCancel"),
    appEditorClose: document.getElementById("appEditorClose"),
    appEditorReset: document.getElementById("appEditorReset"),
    appEditorList: document.getElementById("appEditorList"),
    appEditorStatus: document.getElementById("appEditorStatus"),
  };

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function asText(value, fallback) {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  function readStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      // Storage is optional; the page remains usable when it is unavailable.
    }
  }

  function safeHttpUrl(value) {
    if (typeof value !== "string" || !value.trim()) {
      return null;
    }

    try {
      var url = new URL(value.trim());
      return url.protocol === "http:" || url.protocol === "https:"
        ? url.href
        : null;
    } catch (error) {
      return null;
    }
  }

  function safeAssetUrl(value) {
    if (typeof value !== "string" || !value.trim()) {
      return null;
    }

    try {
      var url = new URL(value.trim(), document.baseURI);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.href;
      }

      if (url.protocol === "file:" && window.location.protocol === "file:") {
        return url.href;
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  function validLink(item) {
    if (!item || typeof item !== "object") {
      return null;
    }

    var url = safeHttpUrl(item.url);
    if (!url) {
      return null;
    }

    return {
      name: asText(item.name, "未命名"),
      url: url,
    };
  }

  var defaultCommonApps = asArray(config.commonApps)
    .map(validLink)
    .filter(Boolean);
  var commonApps = [];
  var editingAppIndex = -1;
  var editorReturnFocus = null;

  function readCommonApps() {
    var saved = readStorage(STORAGE_KEYS.apps);
    if (saved === null) {
      return defaultCommonApps.slice();
    }

    try {
      var parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.map(validLink).filter(Boolean)
        : defaultCommonApps.slice();
    } catch (error) {
      return defaultCommonApps.slice();
    }
  }

  function persistCommonApps() {
    writeStorage(STORAGE_KEYS.apps, JSON.stringify(commonApps));
  }

  commonApps = readCommonApps();

  function validEngine(engine, index) {
    if (!engine || typeof engine !== "object") {
      return null;
    }

    var template = asText(engine.searchUrl, "");
    var homeUrl = safeHttpUrl(engine.homeUrl);
    if (
      !homeUrl ||
      !template.includes("{query}") ||
      !safeHttpUrl(template.replace("{query}", "test"))
    ) {
      return null;
    }

    return {
      id: asText(engine.id, "engine-" + index),
      name: asText(engine.name, "搜索"),
      icon: safeAssetUrl(engine.icon),
      badge: asText(engine.badge, "搜"),
      badgeColor: asText(engine.badgeColor, "#ffffff"),
      badgeBackground: asText(engine.badgeBackground, "#459df5"),
      homeUrl: homeUrl,
      searchUrl: template,
    };
  }

  var searchEngines = asArray(catalog.searchEngines)
    .map(validEngine)
    .filter(Boolean);
  var selectedEngine = searchEngines[0] || null;

  function renderIdentity() {
    var title = asText(config.title, DEFAULT_TITLE);
    document.title = title;
    elements.siteDescription.content = title + " - 搜索与常用网站，一页直达";
    elements.brandLink.setAttribute("aria-label", "返回 " + title);
    elements.siteTitle.textContent = title;
    elements.footerSiteTitle.textContent = title;
    elements.currentYear.textContent = String(new Date().getFullYear());
  }

  function createNavigationLink(item) {
    var linkData = validLink(item);
    if (!linkData) {
      return null;
    }

    var link = document.createElement("a");
    link.href = linkData.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.title = linkData.name;
    link.textContent = linkData.name;
    return link;
  }

  function createNavigationGroup(name, items, editable) {
    var section = document.createElement("section");
    var heading = document.createElement("h2");
    var list = document.createElement("ul");
    var validCount = 0;

    section.className = "navigation-group";
    heading.className = "navigation-title";
    heading.textContent = asText(name, "未命名分类");
    list.className = "navigation-list";

    if (editable) {
      var headingRow = document.createElement("div");
      var editButton = document.createElement("button");

      headingRow.className = "navigation-title-row";
      editButton.type = "button";
      editButton.className = "navigation-edit";
      editButton.title = "编辑常用软件";
      editButton.setAttribute("aria-label", "编辑常用软件");
      editButton.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"></path></svg>';
      editButton.addEventListener("click", openAppEditor);
      headingRow.appendChild(heading);
      headingRow.appendChild(editButton);
      section.appendChild(headingRow);
    } else {
      section.appendChild(heading);
    }

    asArray(items).forEach(function (item) {
      var link = createNavigationLink(item);
      if (!link) {
        return;
      }

      var listItem = document.createElement("li");
      listItem.appendChild(link);
      list.appendChild(listItem);
      validCount += 1;
    });

    if (validCount) {
      section.appendChild(list);
    } else {
      var empty = document.createElement("p");
      empty.className = "navigation-empty";
      empty.textContent = "暂未配置";
      section.appendChild(empty);
    }

    return section;
  }

  function renderNavigation() {
    var fragment = document.createDocumentFragment();

    fragment.appendChild(
      createNavigationGroup("常用软件", commonApps, true)
    );

    asArray(catalog.categories).forEach(function (category) {
      if (!category || typeof category !== "object") {
        return;
      }

      fragment.appendChild(
        createNavigationGroup(category.name, category.links)
      );
    });

    elements.navigationGrid.replaceChildren(fragment);
  }

  function setEditorStatus(message, isError) {
    elements.appEditorStatus.textContent = message || "";
    elements.appEditorStatus.classList.toggle("is-error", Boolean(isError));
  }

  function resetAppEditorForm() {
    editingAppIndex = -1;
    elements.appEditorForm.reset();
    elements.appEditorCancel.hidden = true;
    elements.appEditorSubmit.textContent = "添加到导航";
    setEditorStatus("");
  }

  function createEditorAction(label, title, icon) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "icon-button app-list-action";
    button.dataset.appAction = label;
    button.title = title;
    button.setAttribute("aria-label", title);
    button.innerHTML = icon;
    return button;
  }

  function renderAppEditorList() {
    var fragment = document.createDocumentFragment();

    if (!commonApps.length) {
      var empty = document.createElement("li");
      empty.className = "app-editor-empty";
      empty.textContent = "还没有添加软件";
      fragment.appendChild(empty);
    }

    commonApps.forEach(function (app, index) {
      var item = document.createElement("li");
      var details = document.createElement("div");
      var name = document.createElement("strong");
      var link = document.createElement("a");
      var actions = document.createElement("div");

      item.className = "app-editor-item";
      details.className = "app-editor-item-details";
      name.className = "app-editor-item-name";
      name.textContent = app.name;
      link.className = "app-editor-item-url";
      link.href = app.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.title = app.url;
      link.textContent = app.url;
      actions.className = "app-editor-item-actions";

      var editButton = createEditorAction(
        "edit",
        "编辑" + app.name,
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"></path></svg>'
      );
      var deleteButton = createEditorAction(
        "delete",
        "删除" + app.name,
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5M14 11v5"></path></svg>'
      );
      editButton.dataset.appIndex = String(index);
      deleteButton.dataset.appIndex = String(index);

      details.appendChild(name);
      details.appendChild(link);
      actions.appendChild(editButton);
      actions.appendChild(deleteButton);
      item.appendChild(details);
      item.appendChild(actions);
      fragment.appendChild(item);
    });

    elements.appEditorList.replaceChildren(fragment);
  }

  function openAppEditor() {
    editorReturnFocus = document.activeElement;
    resetAppEditorForm();
    renderAppEditorList();
    elements.appEditor.hidden = false;
    document.body.classList.add("modal-open");
    elements.appNameInput.focus();
  }

  function closeAppEditor() {
    elements.appEditor.hidden = true;
    document.body.classList.remove("modal-open");
    resetAppEditorForm();

    var focusTarget = editorReturnFocus;
    if (!focusTarget || !document.contains(focusTarget)) {
      focusTarget = document.querySelector(".navigation-edit");
    }
    if (focusTarget && typeof focusTarget.focus === "function") {
      focusTarget.focus();
    }
    editorReturnFocus = null;
  }

  function startEditingApp(index) {
    var app = commonApps[index];
    if (!app) {
      return;
    }

    editingAppIndex = index;
    elements.appNameInput.value = app.name;
    elements.appUrlInput.value = app.url;
    elements.appEditorCancel.hidden = false;
    elements.appEditorSubmit.textContent = "保存修改";
    setEditorStatus("");
    elements.appNameInput.focus();
  }

  function deleteApp(index) {
    var app = commonApps[index];
    if (!app || !window.confirm("确定删除“" + app.name + "”吗？")) {
      return;
    }

    commonApps.splice(index, 1);
    persistCommonApps();
    renderNavigation();
    renderAppEditorList();
    resetAppEditorForm();
    setEditorStatus("已删除");
  }

  function restoreDefaultApps() {
    if (!window.confirm("恢复默认推荐会覆盖当前常用软件，确定继续吗？")) {
      return;
    }

    commonApps = defaultCommonApps.slice();
    persistCommonApps();
    renderNavigation();
    renderAppEditorList();
    resetAppEditorForm();
    setEditorStatus("已恢复默认推荐");
  }

  function handleAppEditorSubmit(event) {
    event.preventDefault();

    var name = elements.appNameInput.value.trim();
    var url = safeHttpUrl(elements.appUrlInput.value);
    if (!name) {
      setEditorStatus("请填写名称", true);
      elements.appNameInput.focus();
      return;
    }

    if (!url) {
      setEditorStatus("请输入有效的 http:// 或 https:// 网址", true);
      elements.appUrlInput.focus();
      return;
    }

    var app = { name: name, url: url };
    var statusMessage = "";
    if (editingAppIndex >= 0 && commonApps[editingAppIndex]) {
      commonApps[editingAppIndex] = app;
      statusMessage = "已保存修改";
    } else {
      commonApps.push(app);
      statusMessage = "已添加到导航";
    }

    persistCommonApps();
    renderNavigation();
    renderAppEditorList();
    resetAppEditorForm();
    setEditorStatus(statusMessage);
  }

  function handleAppEditorListClick(event) {
    var button = event.target.closest("button[data-app-action]");
    if (!button || !elements.appEditorList.contains(button)) {
      return;
    }

    var index = Number(button.dataset.appIndex);
    if (button.dataset.appAction === "edit") {
      startEditingApp(index);
    } else if (button.dataset.appAction === "delete") {
      deleteApp(index);
    }
  }

  function applyBadgeStyle(node, engine) {
    node.dataset.engineId = engine.id;
    node.classList.remove("has-icon");
    node.replaceChildren(document.createTextNode(engine.badge));
    node.style.color = engine.badgeColor;
    node.style.backgroundColor = engine.badgeBackground;

    if (!engine.icon) {
      return;
    }

    var icon = new Image(25, 25);
    icon.className = "engine-icon";
    icon.alt = "";
    icon.setAttribute("aria-hidden", "true");
    icon.decoding = "async";
    icon.draggable = false;
    icon.addEventListener(
      "load",
      function () {
        if (node.dataset.engineId !== engine.id) {
          return;
        }

        node.classList.add("has-icon");
        node.style.color = "";
        node.style.backgroundColor = "";
        node.replaceChildren(icon);
      },
      { once: true }
    );
    icon.src = engine.icon;
  }

  function engineButtons() {
    return Array.from(elements.engineList.querySelectorAll("button"));
  }

  function updateSelectedEngine() {
    if (!selectedEngine) {
      elements.engineToggle.disabled = true;
      elements.searchInput.disabled = true;
      elements.searchButton.disabled = true;
      elements.searchInput.placeholder = "搜索引擎暂不可用";
      return;
    }

    applyBadgeStyle(elements.engineBadge, selectedEngine);
    elements.engineToggle.title = "切换搜索引擎，当前：" + selectedEngine.name;
    elements.engineToggle.setAttribute(
      "aria-label",
      "切换搜索引擎，当前：" + selectedEngine.name
    );

    engineButtons().forEach(function (button) {
      var isCurrent = button.dataset.engineId === selectedEngine.id;
      button.classList.toggle("is-active", isCurrent);
      button.setAttribute("aria-pressed", isCurrent ? "true" : "false");
    });
  }

  function closeEnginePanel(options) {
    var shouldFocusToggle = options && options.focusToggle;
    elements.enginePanel.hidden = true;
    elements.engineToggle.setAttribute("aria-expanded", "false");

    if (shouldFocusToggle) {
      elements.engineToggle.focus();
    }
  }

  function openEnginePanel(options) {
    if (!searchEngines.length) {
      return;
    }

    elements.enginePanel.hidden = false;
    elements.engineToggle.setAttribute("aria-expanded", "true");

    if (options && options.focusSelected) {
      var selectedButton = elements.engineList.querySelector(".is-active");
      (selectedButton || engineButtons()[0]).focus();
    }
  }

  function selectEngine(engine) {
    selectedEngine = engine;
    writeStorage(STORAGE_KEYS.engine, engine.id);
    updateSelectedEngine();
    closeEnginePanel();
    elements.searchInput.focus();
  }

  function renderSearchEngines() {
    var fragment = document.createDocumentFragment();
    var savedEngineId = readStorage(STORAGE_KEYS.engine);

    searchEngines.forEach(function (engine) {
      if (engine.id === savedEngineId) {
        selectedEngine = engine;
      }

      var listItem = document.createElement("li");
      var button = document.createElement("button");
      var badge = document.createElement("span");
      var label = document.createElement("span");

      button.type = "button";
      button.className = "engine-option";
      button.dataset.engineId = engine.id;
      button.title = "使用" + engine.name + "搜索";
      badge.className = "engine-option-badge";
      badge.setAttribute("aria-hidden", "true");
      applyBadgeStyle(badge, engine);
      label.className = "engine-option-name";
      label.textContent = engine.name;

      button.appendChild(badge);
      button.appendChild(label);
      button.addEventListener("click", function () {
        selectEngine(engine);
      });
      listItem.appendChild(button);
      fragment.appendChild(listItem);
    });

    elements.engineList.replaceChildren(fragment);
    updateSelectedEngine();
  }

  function resolveDestination(query) {
    var value = query.trim();

    if (/^https?:\/\//i.test(value)) {
      return safeHttpUrl(value);
    }

    if (/^www\./i.test(value)) {
      return safeHttpUrl("https://" + value);
    }

    if (/^localhost(?::\d+)?(?:[\/?#].*)?$/i.test(value)) {
      return safeHttpUrl("http://" + value);
    }

    if (
      !/\s/.test(value) &&
      (/^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:[\/?#].*)?$/.test(value) ||
        /^[a-z0-9-]+(?::\d+)(?:[\/?#].*)?$/i.test(value) ||
        /^[a-z0-9-]+\.local(?::\d+)?(?:[\/?#].*)?$/i.test(value))
    ) {
      return safeHttpUrl("http://" + value);
    }

    if (
      !/\s/.test(value) &&
      /^[^/:?#]+(?:\.[^/:?#]+)+(?::\d+)?(?:[\/?#].*)?$/.test(value)
    ) {
      return safeHttpUrl("https://" + value);
    }

    if (!selectedEngine) {
      return null;
    }

    return safeHttpUrl(
      selectedEngine.searchUrl.replace("{query}", encodeURIComponent(value))
    );
  }

  function openDestination(destination) {
    var link = document.createElement("a");
    link.href = destination;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function handleSearch(event) {
    event.preventDefault();

    var query = elements.searchInput.value.trim();
    elements.searchInput.setCustomValidity("");
    elements.searchForm.classList.remove("is-invalid");
    elements.searchInput.removeAttribute("aria-invalid");

    var destination = query
      ? resolveDestination(query)
      : selectedEngine && selectedEngine.homeUrl;
    if (!destination) {
      elements.searchStatus.textContent = "无法识别当前网址或搜索引擎";
      elements.searchInput.focus();
      return;
    }

    elements.searchStatus.textContent = query
      ? "正在打开搜索结果"
      : "正在打开" + selectedEngine.name;
    openDestination(destination);
  }

  function updateClearButton() {
    var hasValue = Boolean(elements.searchInput.value);
    elements.searchClear.hidden = !hasValue;
    elements.searchForm.classList.remove("is-invalid");
    elements.searchInput.removeAttribute("aria-invalid");
    elements.searchInput.setCustomValidity("");
    elements.searchStatus.textContent = "";
  }

  function currentTheme() {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }

  function updateThemeControl() {
    var isDark = currentTheme() === "dark";
    var nextTheme = isDark ? "浅色" : "深色";
    var label = "切换到" + nextTheme + "模式";

    elements.themeToggle.setAttribute("aria-label", label);
    elements.themeToggle.title = label;
    elements.themeColor.content = isDark ? "#27282f" : "#f2f2f2";
  }

  function toggleTheme() {
    var nextTheme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    writeStorage(STORAGE_KEYS.theme, nextTheme);
    updateThemeControl();
  }

  function moveEngineFocus(event) {
    var buttons = engineButtons();
    var currentIndex = buttons.indexOf(document.activeElement);
    var nextIndex = currentIndex;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1 + buttons.length) % buttons.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = buttons.length - 1;
    } else if (event.key === "Escape") {
      closeEnginePanel({ focusToggle: true });
      event.preventDefault();
      return;
    } else {
      return;
    }

    event.preventDefault();
    buttons[nextIndex].focus();
  }

  function bindEvents() {
    elements.searchForm.addEventListener("submit", handleSearch);
    elements.searchInput.addEventListener("input", updateClearButton);
    elements.searchClear.addEventListener("click", function () {
      elements.searchInput.value = "";
      updateClearButton();
      elements.searchInput.focus();
    });

    elements.engineToggle.addEventListener("click", function () {
      if (elements.enginePanel.hidden) {
        openEnginePanel();
      } else {
        closeEnginePanel();
      }
    });
    elements.engineToggle.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openEnginePanel({ focusSelected: true });
      } else if (event.key === "Escape") {
        closeEnginePanel();
      }
    });
    elements.engineList.addEventListener("keydown", moveEngineFocus);
    elements.searchWrap.addEventListener("focusout", function (event) {
      if (
        !elements.enginePanel.hidden &&
        (!event.relatedTarget || !elements.searchWrap.contains(event.relatedTarget))
      ) {
        closeEnginePanel();
      }
    });

    document.addEventListener("pointerdown", function (event) {
      if (
        !elements.enginePanel.hidden &&
        !event.target.closest(".search-wrap")
      ) {
        closeEnginePanel();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (!elements.appEditor.hidden && event.key === "Escape") {
        event.preventDefault();
        closeAppEditor();
        return;
      }

      if (event.key === "Escape" && !elements.enginePanel.hidden) {
        event.preventDefault();
        closeEnginePanel({ focusToggle: true });
        return;
      }

      if (
        event.key === "/" &&
        document.activeElement !== elements.searchInput &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        elements.searchInput.focus();
      }

      if (event.key === "Escape" && document.activeElement === elements.searchInput) {
        elements.searchInput.blur();
      }
    });

    elements.themeToggle.addEventListener("click", toggleTheme);

    elements.appEditorForm.addEventListener("submit", handleAppEditorSubmit);
    elements.appEditorList.addEventListener("click", handleAppEditorListClick);
    elements.appEditorClose.addEventListener("click", closeAppEditor);
    elements.appEditorCancel.addEventListener("click", resetAppEditorForm);
    elements.appEditorReset.addEventListener("click", restoreDefaultApps);
    elements.appEditor.addEventListener("click", function (event) {
      if (event.target.closest("[data-editor-close]")) {
        closeAppEditor();
      }
    });
  }

  renderIdentity();
  renderNavigation();
  renderSearchEngines();
  updateThemeControl();
  updateClearButton();
  bindEvents();
})();
