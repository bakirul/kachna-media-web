"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import Footer from "@/components/Footer";

export default function Home() {
  const [loopKey, setLoopKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoopKey((prev) => prev + 1);
    }, 14000);
    return () => clearInterval(interval);
  }, []);

  const heroText =
    "Upload broadcast files, manage timelines, get frame-precise feedback, and organize assets — all in one secure vault built for post-production teams and clients.";
  const words = heroText.split(" ");

  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes colorShift {
            0%, 100% { 
              color: #9ca3af; 
              text-shadow: 0 0 0px rgba(255,255,255,0);
            }
            50% { 
              color: #ffffff; 
              text-shadow: 0 0 15px rgba(255,255,255,0.1);
            }
          }
          .color-shift-text {
            animation: colorShift 5s ease-in-out infinite;
          }
          @keyframes wordCutIn {
            0% { opacity: 0; transform: translateY(5px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .word-cut {
            opacity: 0;
            animation: wordCutIn 0.2s forwards ease-out; 
          }
          @media (min-width: 1024px) {
            .hero-dashboard-mockup {
              transform: rotateY(-15deg) rotateX(5deg);
              box-shadow: -20px 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(212,175,55,0.1) !important;
            }
          }
        `,
        }}
      />

      <Navbar />

      <header className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-20 lg:pt-48 lg:pb-32 flex flex-col lg:flex-row items-center gap-12 lg:gap-8 overflow-visible">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none"></div>

        <div className="w-full lg:w-1/2 flex flex-col items-start text-left z-10">
          <h1 className="text-[clamp(3rem,6vw,5rem)] font-display leading-[1.05] mb-6 bg-gradient-to-b from-white to-[#aaa] bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(255,255,255,0.05)]">
            One platform for your entire post-production.
          </h1>

          <div className="min-h-[80px] flex items-start justify-start mb-10">
            <p
              key={loopKey}
              className="text-lg md:text-xl text-gray-300 font-light leading-relaxed max-w-lg"
            >
              {words.map((word, i) => (
                <span
                  key={i}
                  className="inline-block word-cut"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {word}&nbsp;
                </span>
              ))}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 items-center w-full sm:w-auto">
            <Link
              href="/contact"
              className="w-full sm:w-auto text-center bg-transparent text-gold-primary px-10 py-4 text-[0.8rem] uppercase tracking-[0.15em] border border-gold-primary transition-all duration-400 hover:bg-gold-primary hover:text-black hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            >
              Book a Strategy Call
            </Link>
            <Link
              href="#workflow"
              className="w-full sm:w-auto text-center text-text-white text-[0.85rem] uppercase tracking-[0.1em] border-b border-transparent hover:text-gold-primary hover:border-gold-primary transition-all duration-400"
            >
              Explore Our Workflow
            </Link>
          </div>
        </div>

        <div className="w-full lg:w-1/2 relative mt-12 lg:mt-0 z-10 lg:perspective-[1200px]">
          <div className="absolute inset-0 bg-gold-primary/20 blur-[100px] rounded-full scale-75"></div>
          <div className="relative w-full rounded-xl border border-white/10 shadow-2xl bg-[#0e0e12] overflow-hidden transform transition-transform duration-700 hover:rotate-y-0 hover:rotate-x-0 hero-dashboard-mockup">
            <img
              src="/dashboard-mockup.png"
              alt="Rendorax Dashboard"
              className="w-full h-auto object-cover opacity-90"
              onError={(e) => {
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?auto=format&fit=crop&w=1200&q=80";
              }}
            />
            <div className="absolute top-0 left-0 w-full h-8 bg-[#13131a] border-b border-white/5 flex items-center px-4 gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full py-8 border-y border-gold-primary/15 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex justify-center gap-6 md:gap-16 flex-wrap text-[10px] sm:text-xs uppercase tracking-[0.2em] text-gold-primary/80 font-main font-bold text-center">
          <span className="relative after:content-['+'] after:absolute after:-right-4 md:after:-right-9 after:text-gold-primary/15 hidden sm:block">
            Led by 16+ Yrs Veteran Exp
          </span>
          <span className="sm:hidden block">16+ YRS LEADERSHIP</span>
          <span className="relative after:content-['+'] after:absolute after:-right-4 md:after:-right-9 after:text-gold-primary/15 hidden sm:block">
            Min 5 Yrs Broadcast Exp / Artist
          </span>
          <span className="sm:hidden block">5+ YRS EXP / ARTIST</span>
          <span className="relative after:content-['+'] after:absolute after:-right-4 md:after:-right-9 after:text-gold-primary/15 hidden sm:block">
            5-10 Experts Per Sector
          </span>
          <span className="sm:hidden block">DEDICATED TEAMS</span>
          <span>Zero QC Failures</span>
        </div>
      </div>

      <section id="workflow" className="w-full max-w-7xl mx-auto px-6 py-32 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-end mb-24 border-l-2 border-gold-primary pl-6">
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] text-gold-primary block mb-4">
              Core Capabilities
            </span>
            <h2 className="text-4xl md:text-5xl font-display text-white leading-none">
              How We Solve It.
            </h2>
          </div>
        </div>

        <div className="flex flex-col gap-32">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="lg:w-1/2 order-2 lg:order-1">
              <span className="text-[10px] uppercase tracking-widest text-gold-primary/60 border border-gold-primary/20 px-3 py-1 rounded-full mb-6 inline-block">
                Client Vault Integration
              </span>
              <h3 className="text-3xl font-display text-white mb-6">Seamless Project Management</h3>
              <p className="text-base text-text-gray leading-relaxed mb-6">
                Producers shouldn&apos;t have to chase editors for updates. Through our dedicated Client Access portal, you can track project status, access centralized assets, and monitor deliverables without endless email threads.
              </p>
              <ul className="space-y-3 text-sm text-white/70">
                <li className="flex gap-3"><span className="text-gold-primary">✓</span> Real-time status updates</li>
                <li className="flex gap-3"><span className="text-gold-primary">✓</span> Centralized asset organization</li>
              </ul>
            </div>
            <div className="lg:w-1/2 order-1 lg:order-2 w-full aspect-video bg-[#0a0a0a] border border-white/10 rounded-lg relative overflow-hidden group">
              <img src="/project-management.gif" alt="Project Management Dashboard Demo" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="lg:w-1/2 w-full aspect-video bg-[#0a0a0a] border border-white/10 rounded-lg relative overflow-hidden group">
              <img src="/broadcast-delivery.gif" alt="Broadcast Delivery Timeline Demo" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="lg:w-1/2">
              <span className="text-[10px] uppercase tracking-widest text-gold-primary/60 border border-gold-primary/20 px-3 py-1 rounded-full mb-6 inline-block">Zero QC Failures</span>
              <h3 className="text-3xl font-display text-white mb-6">Broadcast-Ready Delivery</h3>
              <p className="text-base text-text-gray leading-relaxed mb-6">
                Whether it&apos;s network television or high-end OTT streaming, our specialized teams guarantee technical perfection with strict picture lock protocols and flawless master generation.
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="lg:w-1/2 order-2 lg:order-1">
              <span className="text-[10px] uppercase tracking-widest text-gold-primary/60 border border-gold-primary/20 px-3 py-1 rounded-full mb-6 inline-block">All-In-One Studio</span>
              <h3 className="text-3xl font-display text-white mb-6">Centralized Post-Production</h3>
              <p className="text-base text-text-gray leading-relaxed mb-6">
                Stop juggling multiple freelancers. Your entire post-pipeline is managed under one roof with dedicated departments for editing, sound, color, and motion graphics.
              </p>
            </div>
            <div className="lg:w-1/2 order-1 lg:order-2 w-full aspect-video bg-[#0a0a0a] border border-white/10 rounded-lg relative overflow-hidden group">
              <img src="/centralized-post.gif" alt="Multi-department workflow demo" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="lg:w-1/2 w-full aspect-video bg-[#0a0a0a] border border-white/10 rounded-lg relative overflow-hidden group">
              <img src="/automation-ai.gif" alt="AI Automation nodes demo" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="lg:w-1/2">
              <span className="text-[10px] uppercase tracking-widest text-gold-primary/60 border border-gold-primary/20 px-3 py-1 rounded-full mb-6 inline-block">Next-Gen Efficiency</span>
              <h3 className="text-3xl font-display text-white mb-6">AI & Automation Powered</h3>
              <p className="text-base text-text-gray leading-relaxed mb-6">
                We build custom ComfyUI, n8n, and Docker workflows to accelerate production pipelines without losing broadcast quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-32 bg-[#050505] border-y border-gold-primary/15 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] uppercase tracking-[0.2em] text-gold-primary block mb-4">Engagement Models</span>
            <h2 className="text-3xl md:text-5xl font-display text-white">Choose Your Production Scale.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-bg-panel border border-white/10 p-8 hover:border-gold-primary/40 transition-all flex flex-col">
              <h3 className="text-xl font-display text-white mb-2">Project-Based</h3>
              <p className="text-xs text-text-gray mb-8">For single documentaries, short films, or targeted campaigns.</p>
              <Link href="/contact" className="w-full text-center py-3 text-xs uppercase tracking-widest border border-white/20 hover:border-gold-primary hover:text-gold-primary transition-all mt-auto">Select Model</Link>
            </div>
            <div className="bg-gradient-to-b from-bg-panel to-[#1a1710] border border-gold-primary p-8 transform md:-translate-y-4 shadow-[0_0_30px_rgba(212,175,55,0.1)] flex flex-col">
              <h3 className="text-xl font-display text-white mb-2">Long-form Retainer</h3>
              <p className="text-xs text-text-gray mb-8">Monthly partnerships for OTT series and major YouTube channels.</p>
              <Link href="/contact" className="w-full text-center py-3 text-xs uppercase tracking-widest bg-gold-primary text-black hover:bg-white transition-all mt-auto">Partner With Us</Link>
            </div>
            <div className="bg-bg-panel border border-white/10 p-8 hover:border-gold-primary/40 transition-all flex flex-col">
              <h3 className="text-xl font-display text-white mb-2">Agency Backend</h3>
              <p className="text-xs text-text-gray mb-8">Exclusive post-production backend for established production houses.</p>
              <Link href="/contact" className="w-full text-center py-3 text-xs uppercase tracking-widest border border-white/20 hover:border-gold-primary hover:text-gold-primary transition-all mt-auto">Let&apos;s Discuss</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-32 md:py-40 text-center border-b border-gold-primary/15" style={{ background: "radial-gradient(circle, #0f0f0f 0%, #050505 100%)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <p className="font-display text-[clamp(1.8rem,3vw,2.5rem)] italic leading-snug text-white">
            &quot;Guided by 16+ years of leadership, our teams of specialized broadcast veterans bring <span className="text-gold-primary">judgment</span>, <span className="text-gold-primary">discipline</span>, and respect for standards to every frame.&quot;
          </p>
        </div>
      </section>

      <section className="w-full py-32 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl md:text-6xl font-display text-white mb-6">
            Ready to Scale Your Production?
          </h2>
          <p className="text-text-gray text-lg mb-12">
            If your project demands a dedicated team of broadcast experts and a secure workflow, let&apos;s talk strategy.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-transparent text-gold-primary px-10 py-4 text-[0.8rem] uppercase tracking-[0.15em] border border-gold-primary transition-all duration-400 hover:bg-gold-primary hover:text-black"
          >
            Book a Strategy Call
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
