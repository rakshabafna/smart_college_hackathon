"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/hackathons", label: "Hackathons" },
  { href: "/student/verification", label: "Verification" },
  { href: "/student/pass", label: "My QR Pass" },
  { href: "/judge", label: "Judging" },
  { href: "/admin", label: "Admin" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 transition-transform"
          style={{
            transform: scrolled ? "scale(0.95)" : "scale(1)",
          }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-lg font-semibold text-white shadow-sm">
            HS
          </div>
          <div className="flex flex-col">
            <span className="text-[1.05rem] font-semibold tracking-tight text-black">
              HackSphere
            </span>
            <span className="text-[0.7rem] font-medium text-slate-500">
              Smart hackathon OS
            </span>
          </div>
        </Link>

        {/* Desktop pill navbar */}
        <div
          className={`hidden max-w-full items-center justify-between rounded-full border border-slate-200 bg-white/90 px-4 text-[0.95rem] text-slate-600 shadow-sm transition-all md:flex ${
            scrolled ? "py-1" : "py-2"
          }`}
          style={{
            transform: scrolled ? "scale(0.97)" : "scale(1)",
          }}
        >
          <nav className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    active
                      ? "bg-blue-600 text-white"
                      : "hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-3 flex items-center gap-2 pl-3 border-l border-slate-200">
            {user ? (
              <>
                <span className="hidden text-xs text-slate-500 md:inline">
                  Hi, <span className="font-semibold text-slate-800">{user.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="rounded-full px-3 py-1 text-[0.8rem] font-medium hover:bg-slate-100"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="rounded-full px-3 py-1 text-[0.8rem] font-medium hover:bg-slate-100"
                >
                  Sign in
                </Link>
                <Link
                  href="/hackathons/create"
                  className="rounded-full bg-blue-600 px-3 py-1 text-[0.8rem] font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Create
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 shadow-sm md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          <span className="mr-1 text-xs">{open ? "Close" : "Menu"}</span>
          <span className="flex flex-col gap-[3px]">
            <span
              className={`h-[2px] w-4 rounded bg-slate-800 transition-transform ${
                open ? "translate-y-[3px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-[2px] w-4 rounded bg-slate-800 transition-opacity ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`h-[2px] w-4 rounded bg-slate-800 transition-transform ${
                open ? "-translate-y-[3px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {/* Mobile dropdown panel */}
      {open && (
        <div className="mx-auto mt-1 w-full max-w-6xl px-5 pb-3 md:hidden">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm shadow-md">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`rounded-xl px-3 py-2 ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-2 flex gap-2">
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Sign out
                </button>
              ) : (
                <>
                  <Link
                    href="/signin"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/hackathons/create"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Create
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

