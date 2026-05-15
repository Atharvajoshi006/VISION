import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="border-t border-border bg-background relative overflow-hidden"
      style={{ padding: "8rem 4rem 4rem" }}
    >
      {/* Decorative glow */}
      <div className="absolute bottom-0 right-0 w-[40%] h-[60%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between gap-16 pb-20 relative z-10">
        {/* Brand */}
        <div className="max-w-sm">
          <div className="text-2xl font-black tracking-tight text-foreground mb-4 uppercase" style={{ fontFamily: 'var(--font-vision)' }}>VISION</div>
          <p className="text-base text-muted-foreground leading-relaxed">
            Hyper-Personalized Cognitive Learning ecosystem. Built with neural metrics to empower the minds of tomorrow.
          </p>
        </div>

        {/* Links */}
        <div className="flex gap-20 flex-wrap">
          {[
            {
              title: "Platform",
              links: [
                { href: "/auth", label: "Neural Access" },
                { href: "/#features",   label: "Core Modules" },
                { href: "/#research",   label: "Research" },
              ],
            },
            {
              title: "Company",
              links: [
                { href: "#", label: "About Us" },
                { href: "#", label: "Research" },
                { href: "#", label: "Careers" },
                { href: "#", label: "Blog" },
              ],
            },
            {
              title: "Legal",
              links: [
                { href: "#", label: "Privacy Policy" },
                { href: "#", label: "Terms of Service" },
                { href: "#", label: "Security" },
              ],
            },
          ].map((col) => (
            <div key={col.title} className="flex flex-col gap-2.5">
              <h4 className="text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[var(--foreground)] mb-1">
                {col.title}
              </h4>
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[0.875rem] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="max-w-[1200px] mx-auto pt-8 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-[0.825rem] text-[var(--muted-foreground)]">© 2026 VISION. All rights reserved.</p>
        <div className="flex gap-6">
          {["Twitter", "LinkedIn", "GitHub"].map((s) => (
            <Link
              key={s}
              href="#"
              className="text-[0.825rem] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              {s}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
