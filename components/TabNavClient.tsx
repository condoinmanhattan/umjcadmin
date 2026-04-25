"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const tabs = [
  { label: "고객등록", href: "/register", icon: "📋" },
  { label: "고객관리", href: "/manage", icon: "👥" },
  { label: "DB", href: "/db", icon: "📁" },
];

export default function TabNavClient() {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme");
    if (saved === "light") {
      setTheme("light");
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  return (
    <nav className="tab-nav">
      <div className="tab-nav-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="url(#grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <span>ADMIN</span>
      </div>
      <div className="tab-nav-items">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`tab-item ${pathname === tab.href ? "active" : ""}`}
          >
            <span style={{ marginRight: 6 }}>{tab.icon}</span>
            {tab.label}
          </Link>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      {mounted && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "16px" }}>
          <span style={{ fontSize: "14px", color: theme === "light" ? "var(--accent-blue)" : "var(--text-muted)", transition: "0.3s" }}>☀️</span>
          <label style={{
            position: "relative",
            display: "inline-block",
            width: "44px",
            height: "24px",
            cursor: "pointer"
          }}>
            <input 
              type="checkbox" 
              checked={theme === "dark"} 
              onChange={toggleTheme} 
              style={{ opacity: 0, width: 0, height: 0, margin: 0 }} 
            />
            <span style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: theme === "dark" ? "var(--bg-input)" : "#e2e8f0",
              borderRadius: "24px",
              border: "1px solid var(--border-color)",
              transition: "0.3s"
            }}>
              <span style={{
                position: "absolute",
                display: "block",
                height: "18px",
                width: "18px",
                left: theme === "dark" ? "22px" : "2px",
                bottom: "2px",
                backgroundColor: theme === "dark" ? "var(--accent-blue)" : "#fff",
                borderRadius: "50%",
                transition: "0.3s",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
              }} />
            </span>
          </label>
          <span style={{ fontSize: "14px", color: theme === "dark" ? "var(--accent-blue)" : "var(--text-muted)", transition: "0.3s" }}>🌙</span>
        </div>
      )}
      <button
        onClick={async () => {
          await fetch('/api/auth', { method: 'DELETE' });
          router.push('/login');
        }}
        style={{
          background: 'transparent',
          border: '1px solid var(--border-color)',
          color: 'var(--text-muted)',
          padding: '4px 12px',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          fontSize: '12px',
          marginRight: '8px',
          transition: 'all 0.2s',
          fontFamily: 'inherit',
        }}
        onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-red)'; e.currentTarget.style.color = 'var(--accent-red)'; }}
        onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        로그아웃
      </button>
    </nav>
  );
}
