"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ShoppingBag, Package, Users, Tag,
  RotateCcw, Shield, BarChart2, Image, Settings,
  ChevronDown, UserCog, Layers, XCircle, RefreshCcw,
  FileText, CreditCard, Bell, MessageSquare, Inbox,
} from "lucide-react";
import { useState } from "react";

const navGroups = [
  {
    label: null,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Order Management",
    items: [
      { href: "/orders", label: "Current Orders", icon: ShoppingBag },
      { href: "/orders/past", label: "Past Orders", icon: FileText },
      { href: "/returns", label: "Returns", icon: RotateCcw },
      { href: "/returns/refunds", label: "Refunds", icon: RefreshCcw },
      { href: "/warranties", label: "Warranty Claims", icon: Shield },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/products", label: "Products", icon: Package },
      { href: "/categories", label: "Categories", icon: Layers },
      { href: "/categories/sub", label: "Sub Categories", icon: Layers },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/customers", label: "Customers", icon: Users },
      { href: "/reviews", label: "Reviews", icon: MessageSquare },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/enquiries", label: "Leads", icon: Inbox },
      { href: "/promocodes", label: "Promo Codes", icon: Tag },
      { href: "/banners", label: "Home Banners", icon: Image },
      { href: "/blogs", label: "Blogs", icon: FileText },
    ],
  },
  {
    label: "Reports & Config",
    items: [
      { href: "/reports",                  label: "Reports",           icon: BarChart2  },
      { href: "/users",                    label: "Admin Users",       icon: UserCog    },
      { href: "/settings",                 label: "Settings",          icon: Settings   },
      // Tax Rules — out of scope (hidden from nav; page/API kept for later).
      // { href: "/settings/taxes",           label: "Tax Rules",         icon: Layers     },
      { href: "/settings/payments",        label: "Payment Providers", icon: CreditCard },
      { href: "/settings/notifications",   label: "Notifications",     icon: Bell       },
      { href: "/products/tags",            label: "Product Tags",      icon: Tag        },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col bg-surface border-r border-gray-200 transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200 shrink-0">
        {!collapsed && (
          <span className="font-semibold text-gray-900 text-lg truncate">CRM Admin</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded-lg hover:bg-gray-100 text-gray-400"
        >
          <ChevronDown
            size={16}
            className={cn("transition-transform", collapsed ? "-rotate-90" : "rotate-90")}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {navGroups.map((group, gi) => (
          <div key={gi} className="mb-2">
            {group.label && !collapsed && (
              <p className="px-2 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors",
                    active
                      ? "bg-brand-50 text-brand-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
