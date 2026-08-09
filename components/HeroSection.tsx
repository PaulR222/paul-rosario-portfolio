"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type IllustrationType = "strategy" | "analysis" | "reporting" | "communication" | "account" | "ai" | "automation";

type Capability = {
  id: IllustrationType;
  label: string;
};

const capabilities: Capability[] = [
  { id: "strategy", label: "Full Funnel Strategy" },
  { id: "analysis", label: "In-Depth Analysis" },
  { id: "reporting", label: "Actionable Reporting" },
  { id: "communication", label: "Client Communication" },
  { id: "account", label: "Campaign Management" },
  { id: "ai", label: "Effective AI Utilization" },
  { id: "automation", label: "Process Automation" },
];

// Replace these three values when real managed-spend figures are available.
export const spendConfig = {
  historicalManagedSpend: 26000000,
  currentMonthlyManagedSpend: 2000000,
  calculationStartDate: "2026-07-20T00:00:00",
};

const spendRatePerSecond = spendConfig.currentMonthlyManagedSpend / 30.4375 / 24 / 60 / 60;
const calculateManagedSpend = () =>
  spendConfig.historicalManagedSpend +
  Math.max(0, (Date.now() - new Date(spendConfig.calculationStartDate).getTime()) / 1000) * spendRatePerSecond;

function SpendCounter() {
  const reduceMotion = useReducedMotion();
  const [spend, setSpend] = useState(spendConfig.historicalManagedSpend);
  const formatter = useMemo(() => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }), []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setSpend(calculateManagedSpend()));
    if (reduceMotion) return () => window.cancelAnimationFrame(frame);
    const timer = window.setInterval(() => setSpend(calculateManagedSpend()), 250);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, [reduceMotion]);

  return (
    <motion.div className="spend-counter" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.78, duration: 0.55 }}>
      <span className="spend-value" aria-live="off">{formatter.format(spend)}</span>
      <span className="spend-label"><i aria-hidden="true" /> AD SPEND ACTIVELY MANAGED</span>
    </motion.div>
  );
}

function AtmosphericBackground() {
  return <div className="atmosphere" aria-hidden="true" />;
}

export function HeroSection() {
  return (
    <main className="hero">
      <AtmosphericBackground />
      <header className="hero-heading">
        <div className="heading-line">
          <a className="email-link" href="mailto:PaulJRosario22@gmail.com">
            <span>PaulJRosario22@gmail.com</span>
          </a>
          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}>Paul Rosario</motion.h1>
          <a className="resume-link" href="/paul-rosario-resume.pdf" target="_blank" rel="noreferrer">
            <span>Résumé <i aria-hidden="true">↗</i></span>
            <small>Updated August 2026</small>
          </a>
        </div>
        <motion.p className="role" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12, duration: 0.7 }}>Expert Performance Marketer</motion.p>
      </header>

      <section className="intro-grid" aria-label="About Paul Rosario">
        <div className="intro-copy">
          <div className="intro-statement">
            <p>Hey! I&apos;m Paul. I love marketing.</p>
            <p>
              I have over 6 years of marketing experience with 3 of those years
              being in paid media.
            </p>
            <p>
              I am deeply experienced in analytics, reporting, client
              communication, campaign &amp; project management, strategy,
              automation, and AI systems. I use all of those for our partners
              everyday.
            </p>
            <p>
              I&apos;m very much a growth oriented individual who is hungry for
              meaningful responsibilities.
            </p>
          </div>
        </div>
        <div className="intro-portrait">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/paul-headshot.jpg" alt="Paul Rosario" />
        </div>
      </section>

      <SpendCounter />
      <section className="professional-grid" aria-label="Performance marketing capabilities">
        <div className="capabilities-panel">
          <div className="capability-copy">
            <p className="panel-kicker">Core capabilities</p>
            <ul className="professional-list">
              {capabilities.map((capability, index) => (
                <motion.li key={capability.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + index * 0.08, duration: 0.6 }}>
                  {capability.label}
                </motion.li>
              ))}
            </ul>
          </div>
          <div className="illustration-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/paul-illustration.png" alt="Illustration of Paul Rosario" className="professional-illustration" />
          </div>
        </div>
      </section>
    </main>
  );
}
