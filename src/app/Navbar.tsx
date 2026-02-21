"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { Store } from "./lib/store";

type NavItem = { href: string; label: string };

type AppRole = "student" | "organiser";

const NAV_BY_ROLE: Record<AppRole | "guest", NavItem[]> = {
  student: [
    { href: "/", label: "Home" },
    { href: "/hackathons", label: "Hackathons" },
    { href: "/student/dashboard", label: "Dashboard" },
    { href: "/student/team", label: "My Team" },
    { href: "/student/pass", label: "QR Passes" },
    { href: "/leaderboard", label: "Leaderboard" },
  ],
  organiser: [
    { href: "/", label: "Home" },
    { href: "/hackathons", label: "Hackathons" },
    { href: "/admin", label: "Admin" },
    { href: "/judge", label: "Judge" },
    { href: "/scanner/gate", label: "Gate" },
    { href: "/scanner/food", label: "Food" },
    { href: "/leaderboard", label: "Leaderboard" },
  ],
  guest: [
    { href: "/", label: "Home" },
    { href: "/hackathons", label: "Hackathons" },
  ],
};

const ROLE_LABELS: Record<AppRole, string> = {
  student: "Student",
  organiser: "Organiser",
};

const ROLE_COLORS: Record<AppRole, string> = {
  student: "bg-blue-50 text-blue-700",
  organiser: "bg-emerald-50 text-emerald-700",
};

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [inviteCount, setInviteCount] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Normalize role for backward compat (admin/organizer → organiser)
  const rawRole = (user?.role ?? "guest") as string;
  const effectiveRole: AppRole | "guest" = !user
    ? "guest"
    : (rawRole === "admin" || rawRole === "organizer" || rawRole === "organiser")
      ? "organiser"
      : "student";
  const navItems = NAV_BY_ROLE[effectiveRole];

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {navItems.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const showDot = item.label === "My Results" && isShortlisted;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={`relative rounded-full px-3 py-1 text-[0.85rem] transition-colors ${active ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
          >
            {item.label}
            {item.label === "Invites" && inviteCount > 0 && (
              <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {inviteCount}
              </span>
            )}
            {showDot && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
            )}
          </Link>
        );
      })}
    </>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 md:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-transform"
          style={{ transform: scrolled ? "scale(0.95)" : "scale(1)" }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-lg font-bold text-white shadow-sm">
            HS
          </div>
          <div className="flex flex-col">
            <span className="text-[1rem] font-semibold tracking-tight text-black">HackSphere</span>
            <span className="text-[0.65rem] font-medium text-slate-500">Smart hackathon OS</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 shadow-sm md:flex">
          <nav className="flex items-center gap-1">
            <NavLinks />
          </nav>
          <div className="ml-3 flex items-center gap-2 border-l border-slate-200 pl-3">
            {user ? (
              <>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${ROLE_COLORS[user.role as AppRole] ?? "bg-slate-100 text-slate-700"}`}>
                  {ROLE_LABELS[user.role as AppRole] ?? "User"}
                </span>
                <span className="hidden text-xs text-slate-700 md:inline">
                  Hi, <span className="font-semibold text-slate-900">{user.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="rounded-full px-3 py-1 text-[0.78rem] font-medium text-slate-600 hover:bg-slate-100"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/signin" className="rounded-full px-3 py-1 text-[0.78rem] font-medium text-slate-700 hover:bg-slate-100">Sign in</Link>
                <Link href="/signup" className="rounded-full bg-blue-600 px-3 py-1 text-[0.78rem] font-semibold text-white shadow-sm hover:bg-blue-700">Sign up</Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 shadow-sm md:hidden"
          onClick={() => setOpen((p) => !p)}
          aria-label="Toggle navigation"
        >
          <span className="mr-1 text-xs">{open ? "Close" : "Menu"}</span>
          <span className="flex flex-col gap-[3px]">
            {[
              open ? "translate-y-[3px] rotate-45" : "",
              open ? "opacity-0" : "opacity-100",
              open ? "-translate-y-[3px] -rotate-45" : "",
            ].map((cls, i) => (
              <span key={i} className={`h-[2px] w-4 rounded bg-slate-800 transition-transform ${cls}`} />
            ))}
          </span>
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="mx-auto w-full max-w-6xl px-5 pb-3 md:hidden">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-md">
            <nav className="flex flex-col gap-1 text-sm">
              <NavLinks onClick={() => setOpen(false)} />
            </nav>
            <div className="mt-2 flex gap-2">
              {user ? (
                <button
                  type="button"
                  onClick={() => { signOut(); setOpen(false); }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Sign out
                </button>
              ) : (
                <>
                  <Link href="/signin" onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-50">Sign in</Link>
                  <Link href="/signup" onClick={() => setOpen(false)} className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-blue-700">Sign up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
