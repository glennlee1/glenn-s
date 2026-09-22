(function () {
  "use strict";

  var STORAGE_KEYS = {
    theme: "glenn-home-theme",
    engine: "glenn-home-search-engine",
  };
  var DEFAULT_TITLE = "Glenn's轻首页";
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

  function validEngine(engine, index) {
    if (!engine || typeof engine !== "object") {
      return null;
    }

    var template = asText(engine.searchUrl, "");
    if (!template.includes("{query}") || !safeHttpUrl(template.replace("{query}", "test"))) {
      return null;
    }

    return {
      id: asText(engine.id, "engine-" + index),
      name: asText(engine.name, "搜索"),
      badge: asText(engine.badge, "搜"),
      badgeColor: asText(engine.badgeColor, "#ffffff"),
      badgeBackground: asText(engine.badgeBackground, "#459df5"),
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

  function createNavigationGroup(name, items) {
    var section = document.createElement("section");
    var heading = document.createElement("h2");
    var list = document.createElement("ul");
    var validCount = 0;

    section.className = "navigation-group";
    heading.className = "navigation-title";
    heading.textContent = asText(name, "未命名分类");
    list.className = "navigation-list";

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

    section.appendChild(heading);
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
      createNavigationGroup("常用软件", asArray(config.commonApps))
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

  function applyBadgeStyle(node, engine) {
    node.textContent = engine.badge;
    node.style.color = engine.badgeColor;
    node.style.backgroundColor = engine.badgeBackground;
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
    if (!query) {
      elements.searchForm.classList.add("is-invalid");
      elements.searchInput.setAttribute("aria-invalid", "true");
      elements.searchInput.setCustomValidity("请输入关键词或网址");
      elements.searchStatus.textContent = "请输入关键词或网址";
      elements.searchInput.focus();
      elements.searchInput.reportValidity();
      return;
    }

    elements.searchInput.setCustomValidity("");

    var destination = resolveDestination(query);
    if (!destination) {
      elements.searchStatus.textContent = "无法识别当前网址或搜索引擎";
      elements.searchInput.focus();
      return;
    }

    elements.searchStatus.textContent = "正在打开搜索结果";
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

    elements.themeToggle.textContent = "# " + nextTheme + "模式 #";
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
  }

  renderIdentity();
  renderNavigation();
  renderSearchEngines();
  updateThemeControl();
  updateClearButton();
  bindEvents();
})();
