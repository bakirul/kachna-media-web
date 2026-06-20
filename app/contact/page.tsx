"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ContactPage() {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");

    const formData = new FormData(e.currentTarget);

    try {
      // Formspree Endpoint URL
      const response = await fetch("https://formspree.io/f/mgoqaqbl", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        setStatus("success");
        (e.target as HTMLFormElement).reset(); // ফর্ম ক্লিয়ার করা
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      <header className="relative w-full max-w-4xl mx-auto px-6 pt-32 pb-16 flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none"></div>

        {/* Pulse Animation Added Here */}
        <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-6 animate-pulse">
          Initiate Protocol
        </span>
        <h1 className="text-4xl md:text-6xl font-display leading-[1.1] mb-6 text-white">
          Start a{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-primary to-[#fff]">
            Project.
          </span>
        </h1>
        <p className="text-sm text-text-gray font-light max-w-2xl leading-relaxed">
          Submit your project briefing below. Our operations team reviews all
          inquiries within 24 hours to determine alignment and schedule a
          technical consultation.
        </p>
      </header>

      <section className="w-full max-w-3xl mx-auto px-6 pb-32 flex-grow">
        <div className="bg-bg-panel border border-white/5 p-8 md:p-12 relative overflow-hidden group">
          {/* Subtle hover gradient for the form container */}
          <div className="absolute inset-0 bg-gold-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

          {/* Success Message */}
          {status === "success" ? (
            <div className="text-center py-16 relative z-10">
              <div className="w-16 h-16 border border-gold-primary rounded-full flex items-center justify-center mx-auto mb-6 bg-gold-primary/10 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                <span className="text-gold-primary text-2xl">✓</span>
              </div>
              <h3 className="text-2xl font-display text-white mb-3">
                Transmission Successful
              </h3>
              <p className="text-sm text-text-gray font-light max-w-md mx-auto">
                Your briefing has been securely delivered to Rendorax
                Operations. We will be in touch shortly.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-10 text-[10px] uppercase tracking-widest text-gold-primary border-b border-gold-primary/30 hover:border-gold-primary pb-1 transition-colors"
              >
                Submit Another Brief
              </button>
            </div>
          ) : (
            /* Contact Form */
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-3 font-mono">
                    Client / Brand Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full bg-black/50 border border-white/10 p-4 text-white text-sm focus:border-gold-primary focus:bg-black focus:shadow-[0_0_15px_rgba(212,175,55,0.1)] focus:outline-none transition-all"
                    placeholder="e.g. Nayantara Communications"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-3 font-mono">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full bg-black/50 border border-white/10 p-4 text-white text-sm focus:border-gold-primary focus:bg-black focus:shadow-[0_0_15px_rgba(212,175,55,0.1)] focus:outline-none transition-all"
                    placeholder="hello@brand.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-3 font-mono">
                  Project Format
                </label>
                <div className="relative">
                  <select
                    name="format"
                    className="w-full bg-black/50 border border-white/10 p-4 text-white text-sm focus:border-gold-primary focus:bg-black focus:shadow-[0_0_15px_rgba(212,175,55,0.1)] focus:outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="Broadcast Series">Broadcast Series</option>
                    <option value="Documentary">Cinematic Documentary</option>
                    <option value="Commercial">TV Commercial / TVC</option>
                    <option value="Podcast">Cinematic Podcast</option>
                    <option value="Other">Other / Custom</option>
                  </select>
                  {/* Custom Dropdown Arrow */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gold-primary/50">
                    ▼
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-3 font-mono">
                  Project Brief & Details *
                </label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  className="w-full bg-black/50 border border-white/10 p-4 text-white text-sm focus:border-gold-primary focus:bg-black focus:shadow-[0_0_15px_rgba(212,175,55,0.1)] focus:outline-none transition-all resize-none"
                  placeholder="Provide timeline expectations, current phase, and technical requirements..."
                ></textarea>
              </div>

              {/* Error Message */}
              {status === "error" && (
                <div className="p-4 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono">
                  Transmission failed. Please check your connection or email us
                  directly at Formspree support.
                </div>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full bg-transparent border border-gold-primary text-gold-primary font-bold uppercase tracking-widest py-4 text-xs hover:bg-gold-primary hover:text-black transition-all duration-400 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-[0_0_10px_rgba(212,175,55,0.05)] hover:shadow-[0_0_25px_rgba(212,175,55,0.3)]"
              >
                {status === "submitting" ? (
                  <>
                    Processing <span className="animate-pulse">...</span>
                  </>
                ) : (
                  "Submit Briefing"
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
