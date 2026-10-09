import { LayoutDashboard, ShieldCheck, UploadCloud, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/content/new", label: "Upload video", shortLabel: "Upload", icon: UploadCloud },
  { href: "/verify", label: "Verification", shortLabel: "Verify", icon: ShieldCheck },
];

export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || (pathname.startsWith("/content/") && pathname !== "/content/new");
  return pathname === href || pathname.startsWith(`${href}/`);
}
