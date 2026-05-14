"use client";

import { useTheme } from "@/components/providers/theme-provider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <label className="theme-switch" id="theme-toggle" title="Toggle dark mode">
      <input
        id="theme-input"
        type="checkbox"
        checked={isDark}
        onChange={toggleTheme}
        className="sr-only"
      />
      <div className="theme-slider">
        <div className="theme-sun-moon">
          {/* Moon dots */}
          <svg id="moon-dot-1" className="theme-moon-dot" viewBox="0 0 100 100" style={{ left: 10, top: 3, position: "absolute", width: 6, height: 6, zIndex: 4 }}>
            <circle cx="50" cy="50" r="50" />
          </svg>
          <svg id="moon-dot-2" className="theme-moon-dot" viewBox="0 0 100 100" style={{ left: 2, top: 10, position: "absolute", width: 10, height: 10, zIndex: 4 }}>
            <circle cx="50" cy="50" r="50" />
          </svg>
          <svg id="moon-dot-3" className="theme-moon-dot" viewBox="0 0 100 100" style={{ left: 16, top: 18, position: "absolute", width: 3, height: 3, zIndex: 4 }}>
            <circle cx="50" cy="50" r="50" />
          </svg>
          {/* Light rays */}
          <svg className="theme-light-ray" viewBox="0 0 100 100" style={{ left: -8, top: -8, position: "absolute", width: 43, height: 43, zIndex: -1, fill: "white", opacity: 0.10 }}>
            <circle cx="50" cy="50" r="50" />
          </svg>
          <svg className="theme-light-ray" viewBox="0 0 100 100" style={{ left: "-50%", top: "-50%", position: "absolute", width: 55, height: 55, zIndex: -1, fill: "white", opacity: 0.10 }}>
            <circle cx="50" cy="50" r="50" />
          </svg>
          <svg className="theme-light-ray" viewBox="0 0 100 100" style={{ left: -18, top: -18, position: "absolute", width: 60, height: 60, zIndex: -1, fill: "white", opacity: 0.10 }}>
            <circle cx="50" cy="50" r="50" />
          </svg>
          {/* Dark clouds */}
          <svg id="cloud-1" className="cloud-dark" viewBox="0 0 100 100" style={{ left: 30, top: 15, width: 40 }}><circle cx="50" cy="50" r="50" /></svg>
          <svg id="cloud-2" className="cloud-dark" viewBox="0 0 100 100" style={{ left: 44, top: 10, width: 20 }}><circle cx="50" cy="50" r="50" /></svg>
          <svg id="cloud-3" className="cloud-dark" viewBox="0 0 100 100" style={{ left: 18, top: 24, width: 30 }}><circle cx="50" cy="50" r="50" /></svg>
          {/* Light clouds */}
          <svg id="cloud-4" className="cloud-light" viewBox="0 0 100 100" style={{ left: 36, top: 18, width: 40 }}><circle cx="50" cy="50" r="50" /></svg>
          <svg id="cloud-5" className="cloud-light" viewBox="0 0 100 100" style={{ left: 48, top: 14, width: 20 }}><circle cx="50" cy="50" r="50" /></svg>
          <svg id="cloud-6" className="cloud-light" viewBox="0 0 100 100" style={{ left: 22, top: 26, width: 30 }}><circle cx="50" cy="50" r="50" /></svg>
        </div>
        {/* Stars */}
        <div className="theme-stars">
          <svg className="theme-star" viewBox="0 0 20 20" style={{ width: 20, top: 2, left: 3, animationDelay: "0.3s" }}>
            <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
          </svg>
          <svg className="theme-star" viewBox="0 0 20 20" style={{ width: 6, top: 16, left: 3 }}>
            <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
          </svg>
          <svg className="theme-star" viewBox="0 0 20 20" style={{ width: 12, top: 20, left: 10, animationDelay: "0.6s" }}>
            <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
          </svg>
          <svg className="theme-star" viewBox="0 0 20 20" style={{ width: 18, top: 0, left: 18, animationDelay: "1.3s" }}>
            <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
          </svg>
        </div>
      </div>
    </label>
  );
}
