"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Settings,
  Sparkles,
  LogOut,
  User,
  FileText,
  MessageSquare,
  CalendarDays,
  Upload,
  BarChart2,
  Menu,
  X,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

// ─── Nav structure ─────────────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Command Center",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/jobs", label: "Opportunities", icon: Briefcase },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Workflows",
    items: [
      { href: "/proposal", label: "Proposals", icon: FileText },
      { href: "/outreach", label: "Outreach", icon: MessageSquare },
      { href: "/uploads", label: "Documents", icon: Upload },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/reporting", label: "Reporting", icon: BarChart2 },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

// ─── Shared nav link component ─────────────────────────────────────────────────

function NavLink({ item, pathname, onClick }: { item: NavItem; pathname: string; onClick?: () => void }) {
  const Icon = item.icon;
  const active =
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname?.startsWith(item.href));
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4 shrink-0" />
        {item.label}
      </span>
      {item.badge && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// ─── Sidebar nav content (shared between desktop + mobile) ────────────────────

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-5 px-3 py-4 overflow-y-auto">
      {navGroups.map((group) => (
        <div key={group.label}>
          <div className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
            {group.label}
          </div>
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onClick={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

// ─── Brand logo strip ─────────────────────────────────────────────────────────

function BrandStrip() {
  return (
    <div className="flex h-16 items-center gap-2 border-b border-border px-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric text-white shadow-sm">
        <Sparkles className="h-4 w-4" />
      </div>
      <span className="font-display text-base font-semibold tracking-tight text-foreground">Anubis</span>
    </div>
  );
}

// ─── Bottom info strip ────────────────────────────────────────────────────────

function SidebarFooter() {
  return (
    <div className="border-t border-border p-4">
      <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
        <div className="mb-1 font-semibold text-foreground">Anubis</div>
        <div className="text-muted-foreground">
          Configure your pipeline in{" "}
          <Link href="/settings" className="text-primary hover:underline">
            settings
          </Link>
          .
        </div>
      </div>
    </div>
  );
}

// ─── Mobile drawer ────────────────────────────────────────────────────────────

function MobileDrawer({ open, onClose, pathname }: { open: boolean; onClose: () => void; pathname: string }) {
  // Close on route change is handled by passing onClose as onNavigate
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer panel */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-white shadow-xl md:hidden">
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-display text-base font-semibold tracking-tight text-foreground">Anubis</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent pathname={pathname} onNavigate={onClose} />
        <SidebarFooter />
      </aside>
    </>
  );
}

// ─── Top bar ──────────────────────────────────────────────────────────────────

function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const email = user?.email ?? "";
  const initials = email ? email.slice(0, 2).toUpperCase() : "?";

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-white/80 px-4 backdrop-blur md:px-6">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Spacer on desktop so avatar stays right */}
      <div className="hidden md:flex flex-1" />

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full bg-electric text-xs font-bold text-white ring-1 ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Account menu"
            >
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5">
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex items-center gap-2 text-destructive focus:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// ─── App shell ────────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-white md:flex">
        <BrandStrip />
        <SidebarContent pathname={pathname} />
        <SidebarFooter />
      </aside>

      {/* Mobile drawer */}
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        pathname={pathname}
      />

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
