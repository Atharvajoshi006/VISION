import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="border-t border-black/8 dark:border-white/6"
      style={{ background: "#fafafa", padding: "4rem 4rem 2rem" }}
    >
      <style>{`body.dark footer { background: #0a0a10 !important; }`}</style>
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between gap-16 pb-12">
        {/* Brand */}
        <div>
          <div className="text-[1.1rem] font-bold tracking-[-0.02em] text-[var(--foreground)] mb-3 uppercase" style={{ fontFamily: 'var(--font-vision)' }}>VISION</div>
          <p className="text-[0.875rem] text-[var(--muted-foreground)] leading-[1.7]">
            Hyper-Personalized Cognitive Learning.<br />Built for the minds of tomorrow.
          </p>
        </div>

        {/* Links */}
        <div className="flex gap-16 flex-wrap">
          {[
            {
              title: "Platform",
              links: [
                { href: "/auth/student", label: "For Students" },
                { href: "/auth/tutor",   label: "For Tutors" },
                { href: "#",             label: "Analytics" },
                { href: "#",             label: "AI Tutor" },
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
