"use client";

import { useEffect } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import type { Locale } from "@/lib/i18n";

const textPairs = [
  ["Open Next.js Dev Tools", "打开 Next.js 开发工具"],
  ["Close Next.js Dev Tools", "关闭 Next.js 开发工具"],
  ["Console", "控制台"],
  ["Issues", "问题"],
  ["Route", "路由"],
  ["Route Info", "路由信息"],
  ["Preferences", "偏好设置"],
  ["Learn More", "了解更多"],
  ["Reload", "重新加载"],
  ["Start", "开始"],
  ["Loading...", "加载中..."],
  ["Bundler", "打包器"],
  ["Cache Components", "缓存组件"],
  ["Enabled", "已启用"],
  ["Instant Navs", "瞬时导航"],
  ["Static", "静态"],
  ["Dynamic", "动态"],
  ["Static Route", "静态路由"],
  ["Dynamic Route", "动态路由"],
  ["Page load", "页面加载"],
  ["Client navigation", "客户端导航"],
  ["Copied!", "已复制"],
  ["Share", "分享"],
];

function translateValue(locale: Locale, value: string) {
  for (const [english, chinese] of textPairs) {
    if (value === english || value === chinese) {
      return locale === "en" ? english : chinese;
    }
  }

  const issueMatch =
    value.match(/^(\d+)\s+(issue|issues) found\. Click to view details in the dev overlay\.$/) ||
    value.match(/^发现 (\d+) 个问题。点击在开发覆盖层中查看详情。$/);

  if (issueMatch) {
    return locale === "en"
      ? `${issueMatch[1]} ${issueMatch[1] === "1" ? "issue" : "issues"} found. Click to view details in the dev overlay.`
      : `发现 ${issueMatch[1]} 个问题。点击在开发覆盖层中查看详情。`;
  }

  const routeMatch =
    value.match(/^Current route is (.+)\.$/) || value.match(/^当前路由是 (.+)。$/);

  if (routeMatch) {
    return locale === "en"
      ? `Current route is ${routeMatch[1]}.`
      : `当前路由是 ${routeMatch[1]}。`;
  }

  return value;
}

function replaceTextNode(locale: Locale, node: ChildNode) {
  if (node.nodeType !== Node.TEXT_NODE) {
    return;
  }

  const parentTag = node.parentElement?.tagName;

  if (parentTag === "STYLE" || parentTag === "SCRIPT") {
    return;
  }

  const rawValue = node.textContent ?? "";
  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    return;
  }

  const translated = translateValue(locale, trimmedValue);

  if (translated === trimmedValue) {
    return;
  }

  const leadingWhitespace = rawValue.match(/^\s*/)?.[0] ?? "";
  const trailingWhitespace = rawValue.match(/\s*$/)?.[0] ?? "";
  node.textContent = `${leadingWhitespace}${translated}${trailingWhitespace}`;
}

function syncShadowRoot(locale: Locale, shadowRoot: ShadowRoot) {
  shadowRoot.querySelectorAll<HTMLElement>("*").forEach((element) => {
    for (const attribute of ["aria-label", "title"]) {
      const currentValue = element.getAttribute(attribute);

      if (!currentValue) {
        continue;
      }

      const translated = translateValue(locale, currentValue);

      if (translated !== currentValue) {
        element.setAttribute(attribute, translated);
      }
    }

    element.childNodes.forEach((childNode) => replaceTextNode(locale, childNode));
  });
}

export function NextDevtoolsLocaleSync() {
  const { locale } = useI18n();

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    let observedShadowRoot: ShadowRoot | null = null;
    let shadowObserver: MutationObserver | null = null;

    const connectShadowRoot = () => {
      const portal = document.querySelector("nextjs-portal");
      const shadowRoot = portal?.shadowRoot;

      if (!shadowRoot) {
        return;
      }

      if (observedShadowRoot !== shadowRoot) {
        shadowObserver?.disconnect();
        observedShadowRoot = shadowRoot;
        shadowObserver = new MutationObserver(() => syncShadowRoot(locale, shadowRoot));
        shadowObserver.observe(shadowRoot, {
          subtree: true,
          childList: true,
          characterData: true,
          attributes: true,
          attributeFilter: ["aria-label", "title"],
        });
      }

      syncShadowRoot(locale, shadowRoot);
    };

    const portalObserver = new MutationObserver(connectShadowRoot);
    const rootNode = document.body ?? document.documentElement;
    portalObserver.observe(rootNode, {
      subtree: true,
      childList: true,
    });

    connectShadowRoot();

    return () => {
      portalObserver.disconnect();
      shadowObserver?.disconnect();
    };
  }, [locale]);

  return null;
}
