(function () {
  "use strict";

  var STORAGE_KEYS = {
    theme: "glenn-home-theme",
    engine: "glenn-home-search-engine",
    apps: "glenn-home-common-apps",
    identity: "glenn-home-identity",
    navigation: "glenn-home-navigation",
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
    brandMark: document.getElementById("brandMark"),
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
    siteSettingsToggle: document.getElementById("siteSettingsToggle"),
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
    moduleSelect: document.getElementById("moduleSelect"),
    moduleNameInput: document.getElementById("moduleNameInput"),
    moduleNameSave: document.getElementById("moduleNameSave"),
    appEditorListTitle: document.getElementById("appEditorListTitle"),
    siteIdentityForm: document.getElementById("siteIdentityForm"),
    siteNameInput: document.getElementById("siteNameInput"),
    siteAvatarInput: document.getElementById("siteAvatarInput"),
    siteAvatarPreview: document.getElementById("siteAvatarPreview"),
    siteAvatarReset: document.getElementById("siteAvatarReset"),
    siteIdentityReset: document.getElementById("siteIdentityReset"),
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

  function safeAvatarUrl(value) {
    if (typeof value !== "string" || !value.trim()) {
      return null;
    }

    if (/^data:image\/(?:png|jpeg|webp);base64,/i.test(value.trim())) {
      return value.trim();
    }

    return safeAssetUrl(value);
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
  var defaultNavigationGroups = [
    { id: "common", name: "常用软件", links: defaultCommonApps },
  ];
  asArray(catalog.categories).forEach(function (category, index) {
    if (!category || typeof category !== "object") {
      return;
    }

    defaultNavigationGroups.push({
      id: "category-" + index,
      name: asText(category.name, "未命名分类"),
      links: asArray(category.links).map(validLink).filter(Boolean),
    });
  });

  var navigationGroups = [];
  var editingGroupIndex = 0;
  var editingAppIndex = -1;
  var editorReturnFocus = null;

  function cloneNavigationGroups(groups) {
    return groups.map(function (group, index) {
      group = group && typeof group === "object" ? group : {};
      return {
        id: asText(group.id, "group-" + index),
        name: asText(group.name, "未命名分类"),
        links: asArray(group.links).map(validLink).filter(Boolean),
      };
    });
  }

  function readNavigationGroups() {
    var saved = readStorage(STORAGE_KEYS.navigation);
    if (saved === null) {
      var legacyApps = readStorage(STORAGE_KEYS.apps);
      if (legacyApps !== null) {
        try {
          var parsedLegacyApps = JSON.parse(legacyApps);
          if (Array.isArray(parsedLegacyApps)) {
            var migratedGroups = cloneNavigationGroups(defaultNavigationGroups);
            migratedGroups[0].links = parsedLegacyApps.map(validLink).filter(Boolean);
            return migratedGroups;
          }
        } catch (error) {
          // Fall back to the configured defaults below.
        }
      }
      return cloneNavigationGroups(defaultNavigationGroups);
    }

    try {
      var parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? cloneNavigationGroups(parsed) : cloneNavigationGroups(defaultNavigationGroups);
    } catch (error) {
      return cloneNavigationGroups(defaultNavigationGroups);
    }
  }

  function persistNavigationGroups() {
    writeStorage(STORAGE_KEYS.navigation, JSON.stringify(navigationGroups));
  }

  navigationGroups = readNavigationGroups();

  var defaultIdentity = {
    title: asText(config.title, DEFAULT_TITLE),
    avatar: "./assets/brand/glenn-cat.png",
  };
  var siteIdentity = null;
  var pendingAvatar = defaultIdentity.avatar;

  function readIdentity() {
    var saved = readStorage(STORAGE_KEYS.identity);
    if (saved === null) {
      return { title: defaultIdentity.title, avatar: defaultIdentity.avatar };
    }

    try {
      var parsed = JSON.parse(saved);
      var avatar = safeAvatarUrl(parsed && parsed.avatar);
      return {
        title: asText(parsed && parsed.title, defaultIdentity.title),
        avatar: avatar || defaultIdentity.avatar,
      };
    } catch (error) {
      return { title: defaultIdentity.title, avatar: defaultIdentity.avatar };
    }
  }

  function persistIdentity() {
    writeStorage(STORAGE_KEYS.identity, JSON.stringify(siteIdentity));
  }

  siteIdentity = readIdentity();
  pendingAvatar = siteIdentity.avatar;

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
    var title = siteIdentity.title;
    document.title = title;
    elements.siteDescription.content = title + " - 搜索与常用网站，一页直达";
    elements.brandLink.setAttribute("aria-label", "返回 " + title);
    elements.brandMark.src = siteIdentity.avatar;
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

  function createNavigationGroup(name, items, editable, groupIndex) {
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
      editButton.title = "编辑" + asText(name, "导航模块");
      editButton.setAttribute("aria-label", "编辑" + asText(name, "导航模块"));
      editButton.dataset.groupIndex = String(groupIndex);
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

    navigationGroups.forEach(function (group, index) {
      fragment.appendChild(
        createNavigationGroup(group.name, group.links, true, index)
      );
    });

    elements.navigationGrid.replaceChildren(fragment);
  }

  function renderIdentityEditor() {
    elements.siteNameInput.value = siteIdentity.title;
    elements.siteAvatarPreview.src = siteIdentity.avatar;
    elements.siteAvatarInput.value = "";
    pendingAvatar = siteIdentity.avatar;
  }

  function currentNavigationGroup() {
    return navigationGroups[editingGroupIndex] || null;
  }

  function renderModuleSelector() {
    var currentValue = String(editingGroupIndex);
    var fragment = document.createDocumentFragment();

    navigationGroups.forEach(function (group, index) {
      var option = document.createElement("option");
      option.value = String(index);
      option.textContent = group.name;
      fragment.appendChild(option);
    });

    elements.moduleSelect.replaceChildren(fragment);
    elements.moduleSelect.value = currentValue;
  }

  function renderModuleEditor() {
    var group = currentNavigationGroup();
    if (!group) {
      return;
    }

    renderModuleSelector();
    elements.moduleNameInput.value = group.name;
    elements.appEditorListTitle.textContent = "当前模块：" + group.name;
    renderAppEditorList();
  }

  function prepareAvatar(file, onComplete) {
    var reader = new FileReader();
    reader.addEventListener("load", function () {
      var image = new Image();
      image.addEventListener("load", function () {
        var side = Math.min(image.naturalWidth, image.naturalHeight);
        var sourceX = (image.naturalWidth - side) / 2;
        var sourceY = (image.naturalHeight - side) / 2;
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");

        canvas.width = 256;
        canvas.height = 256;
        context.drawImage(image, sourceX, sourceY, side, side, 0, 0, 256, 256);
        onComplete(canvas.toDataURL("image/png"));
      });
      image.addEventListener("error", function () {
        setEditorStatus("头像读取失败，请换一张图片", true);
      });
      image.src = reader.result;
    });
    reader.addEventListener("error", function () {
      setEditorStatus("头像读取失败，请换一张图片", true);
    });
    reader.readAsDataURL(file);
  }

  function handleAvatarChange(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    if (!/^image\/(?:png|jpeg|webp)$/i.test(file.type)) {
      setEditorStatus("请选择 PNG、JPG 或 WebP 图片", true);
      event.target.value = "";
      return;
    }

    prepareAvatar(file, function (avatar) {
      pendingAvatar = avatar;
      elements.siteAvatarPreview.src = avatar;
      setEditorStatus("头像已载入，保存站点设置后生效");
    });
  }

  function handleIdentitySubmit(event) {
    event.preventDefault();

    var title = elements.siteNameInput.value.trim();
    if (!title) {
      setEditorStatus("请填写站点名称", true);
      elements.siteNameInput.focus();
      return;
    }

    siteIdentity = { title: title, avatar: pendingAvatar || defaultIdentity.avatar };
    persistIdentity();
    renderIdentity();
    renderIdentityEditor();
    setEditorStatus("已保存站点设置");
  }

  function resetIdentityEditor() {
    elements.siteNameInput.value = defaultIdentity.title;
    pendingAvatar = defaultIdentity.avatar;
    elements.siteAvatarPreview.src = defaultIdentity.avatar;
    elements.siteAvatarInput.value = "";
    setEditorStatus("已填入默认站点设置，保存后生效");
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
    var group = currentNavigationGroup();
    var links = group ? group.links : [];

    if (!links.length) {
      var empty = document.createElement("li");
      empty.className = "app-editor-empty";
      empty.textContent = "还没有添加网址";
      fragment.appendChild(empty);
    }

    links.forEach(function (app, index) {
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

  function openAppEditor(event) {
    var trigger = event && event.currentTarget;
    var groupIndex = trigger && trigger.dataset.groupIndex;

    if (groupIndex !== undefined && navigationGroups[Number(groupIndex)]) {
      editingGroupIndex = Number(groupIndex);
    }

    editorReturnFocus = document.activeElement;
    resetAppEditorForm();
    renderIdentityEditor();
    renderModuleEditor();
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
    var group = currentNavigationGroup();
    var app = group && group.links[index];
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
    var group = currentNavigationGroup();
    var app = group && group.links[index];
    if (!app || !window.confirm("确定删除“" + app.name + "”吗？")) {
      return;
    }

    group.links.splice(index, 1);
    persistNavigationGroups();
    renderNavigation();
    renderModuleEditor();
    resetAppEditorForm();
    setEditorStatus("已删除");
  }

  function restoreDefaultGroup() {
    var group = currentNavigationGroup();
    var defaultGroup = defaultNavigationGroups[editingGroupIndex];
    if (!group || !defaultGroup) {
      return;
    }

    if (!window.confirm("恢复“" + group.name + "”的默认推荐会覆盖当前内容，确定继续吗？")) {
      return;
    }

    group.name = defaultGroup.name;
    group.links = defaultGroup.links.map(validLink).filter(Boolean);
    persistNavigationGroups();
    renderNavigation();
    renderModuleEditor();
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

    var group = currentNavigationGroup();
    if (!group) {
      setEditorStatus("当前模块不可用，请重新打开编辑器", true);
      return;
    }

    var app = { name: name, url: url };
    var statusMessage = "";
    if (editingAppIndex >= 0 && group.links[editingAppIndex]) {
      group.links[editingAppIndex] = app;
      statusMessage = "已保存修改";
    } else {
      group.links.push(app);
      statusMessage = "已添加到导航";
    }

    persistNavigationGroups();
    renderNavigation();
    renderModuleEditor();
    resetAppEditorForm();
    setEditorStatus(statusMessage);
  }

  function selectNavigationGroup(index) {
    if (!navigationGroups[index]) {
      return;
    }

    editingGroupIndex = index;
    resetAppEditorForm();
    renderModuleEditor();
  }

  function saveModuleName() {
    var group = currentNavigationGroup();
    var name = elements.moduleNameInput.value.trim();

    if (!group) {
      return;
    }

    if (!name) {
      setEditorStatus("请填写模块名称", true);
      elements.moduleNameInput.focus();
      return;
    }

    group.name = name;
    persistNavigationGroups();
    renderNavigation();
    renderModuleEditor();
    setEditorStatus("已保存模块名称");
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

    elements.siteSettingsToggle.addEventListener("click", openAppEditor);
    elements.siteIdentityForm.addEventListener("submit", handleIdentitySubmit);
    elements.siteAvatarInput.addEventListener("change", handleAvatarChange);
    elements.siteAvatarReset.addEventListener("click", function () {
      pendingAvatar = defaultIdentity.avatar;
      elements.siteAvatarPreview.src = defaultIdentity.avatar;
      elements.siteAvatarInput.value = "";
      setEditorStatus("已恢复默认头像，保存后生效");
    });
    elements.siteIdentityReset.addEventListener("click", resetIdentityEditor);
    elements.appEditorForm.addEventListener("submit", handleAppEditorSubmit);
    elements.appEditorList.addEventListener("click", handleAppEditorListClick);
    elements.moduleSelect.addEventListener("change", function () {
      selectNavigationGroup(Number(elements.moduleSelect.value));
    });
    elements.moduleNameSave.addEventListener("click", saveModuleName);
    elements.appEditorClose.addEventListener("click", closeAppEditor);
    elements.appEditorCancel.addEventListener("click", resetAppEditorForm);
    elements.appEditorReset.addEventListener("click", restoreDefaultGroup);
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
