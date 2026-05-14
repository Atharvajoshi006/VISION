import Image from "next/image";
import Link from "next/link";
import { RevealSection } from "@/components/reveal-section";

interface FeatureSectionProps {
  tag: string;
  title: string;
  body: string;
  imgSrc: string;
  imgAlt: string;
  reversed?: boolean;
  id?: string;
}

function FeatureSection({ tag, title, body, imgSrc, imgAlt, reversed, id }: FeatureSectionProps) {
  return (
    <section
      id={id}
      className="feature-section relative overflow-hidden border-t border-black/5 dark:border-white/5"
      style={{
        padding: "7rem 4rem",
        background: "var(--card)",
      }}
    >
      {/* Ambient blob */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          background: reversed
            ? "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)",
          ...(reversed ? { bottom: -100, left: -100 } : { top: -100, right: -100 }),
        }}
      />

      <div
        className={`relative z-[1] max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center ${reversed ? "direction-rtl" : ""}`}
        style={{ direction: reversed ? "rtl" : "ltr" }}
      >
        {/* Text */}
        <RevealSection className="flex flex-col gap-5" style={{ direction: "ltr" } as React.CSSProperties}>
          <span
            className="inline-block text-[0.78rem] font-semibold tracking-[0.08em] uppercase text-indigo-500 border rounded-full px-[0.85rem] py-[0.3rem] w-fit"
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 980,
            }}
          >
            {tag}
          </span>
          <h2
            className="font-extrabold tracking-[-0.03em] leading-[1.1] text-[var(--foreground)]"
            style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}
          >
            {title}
          </h2>
          <p className="text-[1.05rem] text-[var(--muted-foreground)] leading-[1.7] max-w-[480px]">{body}</p>
          <Link
            href="#"
            className="inline-flex items-center gap-1 text-[0.95rem] font-semibold text-[var(--foreground)] border-b-[1.5px] border-black/20 pb-0.5 w-fit transition-all hover:text-indigo-500 hover:border-indigo-500 hover:gap-2 dark:border-white/20 dark:hover:border-[#a78bfa] dark:hover:text-[#a78bfa]"
          >
            Learn more →
          </Link>
        </RevealSection>

        {/* Visual */}
        <RevealSection delay={0.3} style={{ direction: "ltr" } as React.CSSProperties}>
          <div
            className="rounded-2xl overflow-hidden border border-black/8 dark:border-white/8 transition-transform duration-[400ms] ease-out hover:-translate-y-2 hover:scale-[1.01]"
            style={{
              background: "#18181b",
              boxShadow: "0 40px 96px rgba(0,0,0,0.16)",
            }}
          >
            {/* Frame header */}
            <div
              className="flex items-center gap-1.5 px-4 py-3 border-b"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.05)" }}
            >
              <span className="w-3 h-3 rounded-full bg-[#ff5f57] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#28c840] inline-block" />
            </div>
            <Image
              src={imgSrc}
              alt={imgAlt}
              width={800}
              height={500}
              className="w-full h-auto block"
              loading="lazy"
            />
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

export default function FeaturesSection() {
  return (
    <main id="features">
      <FeatureSection
        id="for-students"
        tag="Adaptive Learning"
        title="Built for how your brain actually learns."
        body="Vision AI's neural engine continuously maps your cognitive profile — identifying knowledge gaps, pacing adjustments, and optimal study windows unique to you."
        imgSrc="/img_learning.png"
        imgAlt="Adaptive Learning Dashboard"
      />
      <FeatureSection
        tag="AI Tutor"
        title="An always-on cognitive mentor, just for you."
        body="Get instant, contextual explanations tailored to your comprehension level. Ask anything, anytime — Vision AI understands context and responds like a world-class tutor."
        imgSrc="/img_chat.png"
        imgAlt="AI Tutor Chat Interface"
        reversed
      />
      <FeatureSection
        tag="Cognitive Analytics"
        title="Deep insights into your performance."
        body="Track retention rates, comprehension scores, and cognitive load over time. Vision AI surfaces the insights that matter so you can optimize every study session."
        imgSrc="/img_analytics.png"
        imgAlt="Cognitive Analytics Dashboard"
      />
      <FeatureSection
        id="for-tutors"
        tag="Collaboration"
        title="Learn together. Grow faster."
        body="Connect with peers in AI-matched study groups based on your cognitive profiles. Real-time collaborative sessions powered by shared neural learning graphs."
        imgSrc="/img_collab.png"
        imgAlt="Collaborative Learning Network"
        reversed
      />
    </main>
  );
}
