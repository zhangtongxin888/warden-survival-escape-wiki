// adsterra-artifact-runtime
import { adsterraConfig } from "./config.js";

const ADSTERRA_RUNTIME_MARKER = "adsterra-artifact-runtime";
void Object.values(adsterraConfig);

const ELIGIBLE_PATHS = new Set(adsterraConfig.adsterraEligiblePaths || []);
const EXCLUDED_PATHS = new Set(adsterraConfig.adsterraExcludedPaths || []);

function normalizedRoute(url = window.location.href) {
  const parsed = new URL(url, window.location.href);
  let pathname = parsed.pathname;
  try {
    pathname = decodeURI(pathname);
  } catch {
    // Keep the browser-normalized pathname when percent encoding is malformed.
  }
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, "");
  return pathname || "/";
}

function cleanRoute(url = window.location.href) {
  const pathname = normalizedRoute(url);
  return EXCLUDED_PATHS.has(pathname) || (ELIGIBLE_PATHS.size > 0 && !ELIGIBLE_PATHS.has(pathname));
}

function installArtifactRouteLifecycle() {
  const marker = "__adsterraArtifactRouteLifecycleV1";
  if (window[marker]) return;
  window[marker] = true;

  document.addEventListener("click", (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!anchor || anchor.hasAttribute("download")) return;
    const target = (anchor.getAttribute("target") || "").toLowerCase();
    if (target && target !== "_self") return;
    const destination = new URL(anchor.href, window.location.href);
    if (destination.origin !== window.location.origin || !cleanRoute(destination.href)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign(destination.href);
  }, true);

  const unloadCleanDocument = () => {
    if (cleanRoute()) window.location.reload();
  };
  for (const method of ["pushState", "replaceState"]) {
    const original = window.history[method].bind(window.history);
    window.history[method] = (...args) => {
      const result = original(...args);
      unloadCleanDocument();
      return result;
    };
  }
  window.addEventListener("popstate", unloadCleanDocument);
}


function normalizeUrl(url) {
  if (!url) return undefined;
  return url.startsWith("//") ? `https:${url}` : url;
}

function addScript(id, url, parent = document.body) {
  const source = normalizeUrl(url);
  if (!source || document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.dataset.cfasync = "false";
  script.src = source;
  parent.appendChild(script);
}

function bannerConfig(size) {
  const suffix = size.replace("x", "x");
  const names = {
    "300x250": ["adsterraBanner300x250Key", "adsterraBanner300x250ScriptUrl", 300, 250],
    "320x50": ["adsterraBanner320x50Key", "adsterraBanner320x50ScriptUrl", 320, 50],
    "728x90": ["adsterraBanner728x90Key", "adsterraBanner728x90ScriptUrl", 728, 90],
    "468x60": ["adsterraBanner468x60Key", "adsterraBanner468x60ScriptUrl", 468, 60],
    "160x300": ["adsterraBanner160x300Key", "adsterraBanner160x300ScriptUrl", 160, 300],
    "160x600": ["adsterraBanner160x600Key", "adsterraBanner160x600ScriptUrl", 160, 600],
  };
  const [keyName, scriptName, width, height] = names[suffix];
  const key = adsterraConfig[keyName];
  const scriptUrl = normalizeUrl(adsterraConfig[scriptName]) ||
    (key ? `https://www.highperformanceformat.com/${key}/invoke.js` : undefined);
  return { key, scriptUrl, width, height };
}

function mountBanner(size, className) {
  const config = bannerConfig(size);
  if (!config.key || !config.scriptUrl || document.querySelector(`.${className}`)) return;
  const shell = document.createElement("aside");
  shell.className = className;
  shell.setAttribute("aria-label", "Advertisement");
  const host = document.createElement("div");
  host.style.minHeight = `${config.height}px`;
  host.style.maxWidth = `${config.width}px`;
  shell.appendChild(host);
  document.body.appendChild(shell);
  window.atOptions = { key: config.key, format: "iframe", height: config.height, width: config.width, params: {} };
  addScript(`adsterra-banner-${size}`, config.scriptUrl, host);
}

export function mountAdsterraNative(container) {
  if (!container || !adsterraConfig.adsterraNative1Id || !adsterraConfig.adsterraNative1ScriptUrl) return;
  const target = document.createElement("div");
  target.id = adsterraConfig.adsterraNative1Id.replace(/^#/, "");
  container.appendChild(target);
  addScript("adsterra-native-1", adsterraConfig.adsterraNative1ScriptUrl, container);
}

function mountAdsterraRuntime() {
  if (cleanRoute()) return;
  document.documentElement.dataset.adsterraRuntime = ADSTERRA_RUNTIME_MARKER;
  const loader = document.querySelector("script[data-adsterra-runtime]");
  if (adsterraConfig.adsterraNeedsGlobalFallback === 1) {
    mountBanner(window.matchMedia("(min-width: 768px)").matches ? "728x90" : "320x50", "adsterra-global-fallback");
  }
  if (adsterraConfig.adsterraEnableStickyRail) mountBanner("160x600", "adsterra-sticky-rail");
  if (adsterraConfig.adsterraEnableSocialBar) {
    addScript("adsterra-social-bar", adsterraConfig.adsterraSocialBarScriptUrl);
  }
  if (adsterraConfig.adsterraEnablePopunder && adsterraConfig.adsterraPopunderScriptUrl) {
    const viewsKey = "roblox-site-adsterra-pageviews";
    const nextViews = Number(sessionStorage.getItem(viewsKey) || "0") + 1;
    sessionStorage.setItem(viewsKey, String(nextViews));
    if (nextViews >= adsterraConfig.adsterraPopunderMinPageViews) {
      window.setTimeout(
        () => addScript("adsterra-popunder", adsterraConfig.adsterraPopunderScriptUrl),
        adsterraConfig.adsterraPopunderDelayMs,
      );
    }
  }
}

installArtifactRouteLifecycle();
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountAdsterraRuntime, { once: true });
} else {
  mountAdsterraRuntime();
}
