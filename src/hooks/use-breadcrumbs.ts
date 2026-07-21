import { useLocation } from "react-router-dom";
import { dataMenu, type MenuItem } from "@/consts/menu";

export interface BreadcrumbItemData {
  title: string;
  url: string;
  isCurrent: boolean;
}

/**
 * Format raw URL segment into a clean Title Case string or ID representation.
 */
function formatSegmentTitle(segment: string): string {
  // If it's a numeric ID or UUID-like string
  if (/^\d+$/.test(segment) || /^[0-9a-fA-F-]{36}$/.test(segment)) {
    return `#${segment}`;
  }

  // Convert kebab-case / snake_case to Title Case
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Recursively search for a matching menu item title by URL in the menu tree.
 */
function searchMenuTitle(menus: MenuItem[], url: string): string | null {
  for (const menu of menus) {
    if (menu.url === url) {
      return menu.title;
    }
    if (menu.items && menu.items.length > 0) {
      const foundInSub = searchMenuTitle(menu.items, url);
      if (foundInSub) {
        return foundInSub;
      }
    }
  }
  return null;
}

/**
 * Custom hook to dynamically generate breadcrumb items based on react-router location.
 */
export function useBreadcrumbs(): BreadcrumbItemData[] {
  const location = useLocation();
  const pathname = location.pathname;

  const segments = pathname.split("/").filter(Boolean);

  // Handle Root Path "/"
  if (segments.length === 0) {
    const homeMenu = dataMenu.find((m) => m.url === "/") || {
      title: "Dashboard",
      url: "/",
    };
    return [
      {
        title: homeMenu.title,
        url: homeMenu.url,
        isCurrent: true,
      },
    ];
  }

  const items: BreadcrumbItemData[] = [];
  let currentPath = "";

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isCurrent = index === segments.length - 1;

    const menuTitle = searchMenuTitle(dataMenu, currentPath);
    const title = menuTitle || formatSegmentTitle(segment);

    items.push({
      title,
      url: currentPath,
      isCurrent,
    });
  });

  return items;
}
