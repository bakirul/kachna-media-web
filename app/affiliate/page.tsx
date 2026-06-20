"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";

export default function AffiliatePage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    linkedinUrl: "",
    networkSummary: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic for sending application to HQ/Supabase/Email API
    setFormSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-black text-text-white selection:bg-gold-primary selection:text-black flex flex-col justify-between relative overflow-hidden">
      {/* Background Cinematic Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gold-primary blur-[200px] opacity-5 -z-10 pointer-events-none"></div>

      {/* Top Bar / Navigation Pointer */}
      <div className="w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center relative z-10">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-text-gray group-hover:text-gold-primary transition-colors text-xs uppercase tracking-widest">
            ← Back to HQ
          </span>
        </Link>
        <span className="text-[10px] uppercase tracking-widest text-gold-primary border border-gold-primary/20 px-3 py-1 font-mono">
          Strictly B2B Network
        </span>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-5xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start relative z-10">
        {/* Left Side: Policy & Commission Structure */}
        <div className="space-y-8">
          <div>
            <span className="text-gold-primary text-xs font-bold uppercase tracking-[0.3em] mb-3 block">
              Exclusive Partner Network
            </span>
            <h1 className="text-4xl md:text-5xl font-display leading-tight text-white">
              Apply for Access.
              <br />
              Earn Premium Rev-Share.
            </h1>
            <p className="text-text-gray text-sm mt-4 leading-relaxed">
              The Rendorax Partner Network is an invite-only program
              reserved for top-tier agency owners, independent producers, and
              elite B2B connectors. We hold our broadcast standards high, and
              our vetting process for partners reflects that exact commitment.
            </p>
          </div>

          {/* Program Pillars & Criteria */}
          <div className="space-y-4 border-t border-white/5 pt-6">
            <div className="flex gap-4">
              <div className="text-gold-primary font-mono text-sm shrink-0">
                01 /
              </div>
              <div>
                <h4 className="text-white text-sm uppercase tracking-wider font-semibold">
                  Authority Approval Required
                </h4>
                <p className="text-text-gray text-xs mt-1 leading-relaxed">
                  Access is not guaranteed. Every application is manually
                  reviewed by our HQ. You must demonstrate a proven track record
                  and an established network within the media, corporate, or
                  broadcast sectors.
                </p>
              </div>
            </div>

            <div className="flex gap-4 border-t border-white/5 pt-4">
              <div className="text-gold-primary font-mono text-sm shrink-0">
                02 /
              </div>
              <div>
                <h4 className="text-white text-sm uppercase tracking-wider font-semibold">
                  10% - 15% High-Ticket Commissions
                </h4>
                <p className="text-text-gray text-xs mt-1 leading-relaxed">
                  Once authorized, you earn a flat 10-15% commission on closed
                  deals. With our high-ticket cinematic and broadcast
                  post-production services, a single conversion yields
                  substantial returns.
                </p>
              </div>
            </div>

            <div className="flex gap-4 border-t border-white/5 pt-4">
              <div className="text-gold-primary font-mono text-sm shrink-0">
                03 /
              </div>
              <div>
                <h4 className="text-white text-sm uppercase tracking-wider font-semibold">
                  Zero Delivery Liability
                </h4>
                <p className="text-text-gray text-xs mt-1 leading-relaxed">
                  Your sole focus is bridging the connection. Our specialized
                  post-production roster handles all technical execution,
                  quality control, and final broadcast delivery.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Application Form */}
        <div className="bg-bg-panel border border-white/5 p-8 relative">
          <h3 className="text-base uppercase tracking-widest text-gold-primary mb-6 border-b border-white/10 pb-3">
            Request Authorization
          </h3>

          {formSubmitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 bg-gold-primary/10 text-gold-primary border border-gold-primary/30 rounded-full flex items-center justify-center mx-auto text-xl shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                ✓
              </div>
              <h4 className="text-white text-lg font-display uppercase tracking-widest mt-4">
                Application Under Review
              </h4>
              <p className="text-text-gray text-xs max-w-sm mx-auto leading-relaxed mt-2">
                Your credentials have been securely transmitted to our vetting
                team. If your profile aligns with our operational standards, you
                will receive your authorization access via email within 48-72
                hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
                  Legal Full Name
                </label>
                <input
                  required
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="John Doe"
                  className="w-full bg-black border border-white/10 p-3 text-white focus:border-gold-primary outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
                  Business Email Address
                </label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="john@agency.com"
                  className="w-full bg-black border border-white/10 p-3 text-white focus:border-gold-primary outline-none transition-colors"
                />
              </div>
              <div className="border-t border-white/10 my-4 pt-4">
                <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
                  LinkedIn Profile / Agency URL (For Vetting)
                </label>
                <input
                  required
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, linkedinUrl: e.target.value })
                  }
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full bg-black border border-white/10 p-3 text-white focus:border-gold-primary outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
                  Network Summary & Acquisition Strategy
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.networkSummary}
                  onChange={(e) =>
                    setFormData({ ...formData, networkSummary: e.target.value })
                  }
                  placeholder="Briefly describe your current client base and how you plan to refer high-ticket post-production leads..."
                  className="w-full bg-black border border-white/10 p-3 text-white focus:border-gold-primary outline-none custom-scrollbar transition-colors"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-gold-primary text-black font-bold text-xs uppercase tracking-[0.2em] py-4 mt-4 hover:bg-white transition-all duration-300"
              >
                Submit For Authorization
              </button>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
