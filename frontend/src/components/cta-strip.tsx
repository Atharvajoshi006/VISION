import Link from "next/link";
import { RevealSection } from "@/components/reveal-section";

export default function CtaStrip() {
  return (
    <section
      id="research"
      className="border-t text-center"
      style={{
        padding: "8rem 4rem",
        background: "linear-gradient(135deg, #eef2ff 0%, #ede9fe 100%)",
        borderColor: "rgba(99,102,241,0.12)",
      }}
    >
      <style>{`body.dark section#research { background: linear-gradient(135deg, #1e1b4b 0%, #14103a 100%) !important; border-color: rgba(139,92,246,0.2) !important; }`}</style>
      <RevealSection className="max-w-[640px] mx-auto flex flex-col items-center gap-6">
        <h2
          className="font-extrabold tracking-[-0.03em] text-[var(--foreground)]"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
        >
          Start learning smarter today.
        </h2>
        <p className="text-[1.1rem] text-[var(--muted-foreground)] leading-[1.6]">
          Join thousands of students and tutors building a better future with Vision AI.
        </p>
        <div className="flex gap-4 flex-wrap justify-center mt-2">
          <Link
            href="/auth/student"
            className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#1a1a1a] text-white text-[0.9rem] font-semibold rounded-full transition-all hover:bg-[#333] hover:-translate-y-px dark:bg-[#f0f0f8] dark:text-[#111118]"
          >
            Get Started Free ↗
          </Link>
          <Link
            href="/auth/tutor"
            className="inline-flex items-center gap-1.5 px-6 py-3 bg-transparent text-[#1a1a1a] text-[0.9rem] font-semibold rounded-full border-[1.5px] border-black/20 transition-all hover:border-black hover:bg-black/4 hover:-translate-y-px dark:text-[#f0f0f8] dark:border-white/20 dark:hover:border-white/60"
          >
            For Tutors →
          </Link>
        </div>
      </RevealSection>
    </section>
  );
}
