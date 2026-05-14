"use client";

import { useEffect, useRef } from "react";

export default function PageLoader() {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;
    document.body.classList.add("is-loading");

    const timer = setTimeout(() => {
      document.body.classList.remove("is-loading");
      loader.classList.add("fade-out");
      setTimeout(() => {
        loader.style.display = "none";
      }, 950);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div ref={loaderRef} id="page-loader" aria-hidden="true">
      <div className="loader-wrapper">
        <span className="loader-letter">V</span>
        <span className="loader-letter">I</span>
        <span className="loader-letter">S</span>
        <span className="loader-letter">I</span>
        <span className="loader-letter">O</span>
        <span className="loader-letter">N</span>
        <div className="loader" />
      </div>
      <div className="loader-bar-track">
        <div className="loader-bar-fill" />
      </div>
    </div>
  );
}
