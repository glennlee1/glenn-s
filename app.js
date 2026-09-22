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

  var elements = {
    siteTitle: document.getElementById("siteTitle"),
    siteSubtitle: document.getElementById("siteSubtitle"),
    searchForm: document.getElementById("searchForm"),
    searchEngine: document.getElementById("searchEngine"),
    searchInput: document.getElementById("searchInput"),
    searchButton: document.getElementById("searchButton"),
    searchStatus: document.getElementById("searchStatus"),
    commonApps: document.getElementById("commonApps"),
    commonCount: document.getElementById("commonCount"),
    commonEmpty: document.getElementById("commonEmpty"),
    categoryGrid: document.getElementById("categoryGrid"),
    categoryCount: document.getElementById("categoryCount"),
    categoriesEmpty: document.getElementById("categoriesEmpty"),
    themeToggle: document.getElementById("themeToggle"),
    themeIcon: document.getElementById("themeIcon"),
    themeState: document.getElementById("themeState"),
    themeColor: document.getElementById("themeColor"),
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
      // The page remains fully usable when browser storage is unavailable.
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

  function takeGraphemes(value, count) {
    var text = asText(value, "·");

    if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
      var segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      return Array.from(segmenter.segment(text), function (part) {
        return part.segment;
      }).slice(0, count).join("");
    }

    return Array.from(text).slice(0, count).join("");
  }

  function createIcon(label, tone) {
    var icon = document.createElement("span");
    icon.className = "link-icon tone-" + (tone % 6);
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = takeGraphemes(label, 3);
    return icon;
  }

  function createLink(item, className, tone) {
    if (!item || typeof item !== "object") {
      return null;
    }

    var url = safeHttpUrl(item.url);
    var name = asText(item.name, "未命名");

    if (!url) {
      return null;
    }

    var link = document.createElement("a");
    var copy = document.createElement("span");
    var nameElement = document.createElement("span");
    var description = document.createElement("span");
    var descriptionText = asText(item.description, "打开 " + name);

    link.className = className;
    link.href = url;
    link.title = name + " · " + descriptionText;
    link.appendChild(createIcon(item.icon || takeGraphemes(name, 1), tone));

    copy.className = "link-copy";
    nameElement.className = "link-name";
    nameElement.textContent = name;
    description.className = "link-description";
    description.textContent = descriptionText;

    copy.appendChild(nameElement);
    copy.appendChild(description);
    link.appendChild(copy);

    return link;
  }

  function appendListItem(list, link) {
    var item = document.createElement("li");
    item.appendChild(link);
    list.appendChild(item);
  }

  function renderIdentity() {
    var title = asText(config.title, DEFAULT_TITLE);
    var subtitle = asText(config.subtitle, "");

    document.title = title;
    elements.siteTitle.textContent = title;
    elements.siteSubtitle.textContent = subtitle;
    elements.siteSubtitle.hidden = !subtitle;
  }

  function getValidEngines() {
    return asArray(config.searchEngines).reduce(function (engines, engine) {
      if (!engine || typeof engine !== "object") {
        return engines;
      }

      var url = safeHttpUrl(engine.url);
      if (url) {
        engines.push({
          name: asText(engine.name, "搜索"),
          url: url,
        });
      }
      return engines;
    }, []);
  }

  var searchEngines = getValidEngines();

  function renderSearchEngines() {
    var savedEngine = readStorage(STORAGE_KEYS.engine);
    var selectedIndex = 0;

    elements.searchEngine.replaceChildren();

    if (!searchEngines.length) {
      var emptyOption = document.createElement("option");
      emptyOption.textContent = "未配置";
      elements.searchEngine.appendChild(emptyOption);
      elements.searchEngine.disabled = true;
      elements.searchInput.disabled = true;
      elements.searchButton.disabled = true;
      elements.searchInput.placeholder = "请先在 config.js 中添加搜索引擎";
      elements.searchStatus.textContent = "搜索引擎尚未配置";
      return;
    }

    searchEngines.forEach(function (engine, index) {
      var option = document.createElement("option");
      option.value = String(index);
      option.textContent = engine.name;
      elements.searchEngine.appendChild(option);

      if (engine.name === savedEngine) {
        selectedIndex = index;
      }
    });

    elements.searchEngine.value = String(selectedIndex);
  }

  function renderCommonApps() {
    var validCount = 0;

    elements.commonApps.replaceChildren();

    asArray(config.commonApps).forEach(function (item, index) {
      var link = createLink(item, "app-link", index);
      if (link) {
        appendListItem(elements.commonApps, link);
        validCount += 1;
      }
    });

    elements.commonCount.textContent = validCount ? String(validCount).padStart(2, "0") : "";
    elements.commonEmpty.hidden = validCount > 0;
    elements.commonApps.hidden = validCount === 0;
  }

  function renderCategories() {
    var validCategoryCount = 0;

    elements.categoryGrid.replaceChildren();

    asArray(config.categories).forEach(function (category, categoryIndex) {
      if (!category || typeof category !== "object") {
        return;
      }

      var links = asArray(category.links).reduce(function (nodes, item, itemIndex) {
        var link = createLink(
          item,
          "category-link",
          categoryIndex + itemIndex
        );
        if (link) {
          nodes.push(link);
        }
        return nodes;
      }, []);

      if (!links.length) {
        return;
      }

      var section = document.createElement("section");
      var heading = document.createElement("h3");
      var list = document.createElement("ul");

      section.className = "category-group";
      heading.textContent = asText(category.name, "未命名分类");
      list.className = "category-links";
      links.forEach(function (link) {
        appendListItem(list, link);
      });

      section.appendChild(heading);
      section.appendChild(list);
      elements.categoryGrid.appendChild(section);
      validCategoryCount += 1;
    });

    elements.categoryCount.textContent = validCategoryCount
      ? String(validCategoryCount).padStart(2, "0")
      : "";
    elements.categoriesEmpty.hidden = validCategoryCount > 0;
    elements.categoryGrid.hidden = validCategoryCount === 0;
  }

  function resolveDestination(query, engine) {
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
      /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?:[\/:?#].*)?$/i.test(
        value
      )
    ) {
      return safeHttpUrl("https://" + value);
    }

    return engine.url + encodeURIComponent(value);
  }

  function handleSearch(event) {
    event.preventDefault();

    var query = elements.searchInput.value.trim();
    var engine = searchEngines[Number(elements.searchEngine.value)];

    if (!query) {
      elements.searchStatus.textContent = "请输入关键词或网址";
      elements.searchInput.focus();
      return;
    }

    if (!engine) {
      elements.searchStatus.textContent = "当前没有可用的搜索引擎";
      return;
    }

    var destination = resolveDestination(query, engine);
    if (!destination) {
      elements.searchStatus.textContent = "网址格式无效，请检查后重试";
      elements.searchInput.focus();
      return;
    }

    elements.searchStatus.textContent = "正在前往 " + destination;
    window.location.assign(destination);
  }

  function currentTheme() {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }

  function updateThemeControl() {
    var isDark = currentTheme() === "dark";
    var nextThemeLabel = isDark ? "浅色" : "深色";
    var accessibleLabel = "切换到" + nextThemeLabel + "主题";

    elements.themeIcon.textContent = isDark ? "☀" : "☾";
    elements.themeState.textContent = isDark ? "深色主题" : "浅色主题";
    elements.themeToggle.setAttribute("aria-label", accessibleLabel);
    elements.themeToggle.title = accessibleLabel;
    elements.themeToggle.querySelector(".sr-only").textContent = accessibleLabel;
    elements.themeColor.content = isDark ? "#111418" : "#f4f6f8";
  }

  function toggleTheme() {
    var nextTheme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    writeStorage(STORAGE_KEYS.theme, nextTheme);
    updateThemeControl();
  }

  function bindEvents() {
    elements.searchForm.addEventListener("submit", handleSearch);
    elements.searchEngine.addEventListener("change", function () {
      var engine = searchEngines[Number(elements.searchEngine.value)];
      if (engine) {
        writeStorage(STORAGE_KEYS.engine, engine.name);
      }
    });
    elements.searchInput.addEventListener("input", function () {
      elements.searchStatus.textContent = "";
    });
    elements.themeToggle.addEventListener("click", toggleTheme);

    document.addEventListener("keydown", function (event) {
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
  }

  function focusSearchOnDesktop() {
    if (
      !elements.searchInput.disabled &&
      window.matchMedia("(pointer: fine) and (min-width: 720px)").matches
    ) {
      elements.searchInput.focus({ preventScroll: true });
    }
  }

  renderIdentity();
  renderSearchEngines();
  renderCommonApps();
  renderCategories();
  updateThemeControl();
  bindEvents();
  focusSearchOnDesktop();
})();
