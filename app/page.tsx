"use client";
import Navbar from "./components/Navbar";
import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is the Campus Ambassador Program?",
      answer: "The EDC IIT Delhi Campus Ambassador Program empowers students to represent EDC at their colleges, organize events, and foster entrepreneurial culture among peers."
    },
    {
      question: "Who can apply?",
      answer: "Any undergraduate or graduate student passionate about entrepreneurship and willing to dedicate time to promote EDC initiatives can apply."
    },
    {
      question: "What are the benefits?",
      answer: "Ambassadors receive certificates, exclusive goodies, networking opportunities, skill development workshops, and recognition from IIT Delhi."
    },
    {
      question: "What's the time commitment?",
      answer: "We expect 3-5 hours per week, including organizing events, social media promotion, and engaging with your campus community."
    },
    {
      question: "How do I earn points?",
      answer: "Complete assigned tasks, organize events, promote EDC activities, and submit proof of work through your dashboard to earn points and climb the leaderboard."
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full blur-3xl"
               style={{ background: 'var(--gradient-primary)' }}></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full blur-3xl"
               style={{ background: 'var(--gradient-secondary)' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <div className="inline-block mb-6 px-4 py-2 rounded-full border animate-pulse"
                 style={{ background: 'var(--surface-light)', borderColor: 'var(--primary)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                🚀 Applications Open for 2025-26
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fadeIn"
                style={{ color: 'var(--foreground)' }}>
              Become a <br />
              <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Campus Ambassador
              </span>
            </h1>
            
            <p className="mt-6 text-lg md:text-xl leading-8 max-w-3xl mx-auto mb-10"
               style={{ color: 'var(--muted)' }}>
              Join the Entrepreneurship Development Cell at IIT Delhi and become a catalyst for innovation in your campus. Lead events, build communities, and shape the future.
            </p>
            
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a
                href="/auth/signup"
                className="px-8 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-lg"
                style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}
              >
                🎯 Apply Now
              </a>
              <a href="#benefits" 
                 className="px-8 py-4 rounded-lg font-semibold text-lg border transition-all hover:scale-105"
                 style={{ background: 'var(--surface)', borderColor: 'var(--surface-light)', color: 'var(--foreground)' }}>
                Learn More →
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
              <div className="stat-card p-6 rounded-lg text-center">
                <div className="text-4xl font-bold mb-2" style={{ color: 'var(--accent)' }}>500+</div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>Active Ambassadors</div>
              </div>
              <div className="stat-card p-6 rounded-lg text-center">
                <div className="text-4xl font-bold mb-2" style={{ color: 'var(--accent)' }}>100+</div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>Partner Colleges</div>
              </div>
              <div className="stat-card p-6 rounded-lg text-center">
                <div className="text-4xl font-bold mb-2" style={{ color: 'var(--accent)' }}>50+</div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>Events Annually</div>
              </div>
              <div className="stat-card p-6 rounded-lg text-center">
                <div className="text-4xl font-bold mb-2" style={{ color: 'var(--accent)' }}>10k+</div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>Students Reached</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              Why Join Us? 🌟
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--muted)' }}>
              Get exclusive benefits and opportunities that will accelerate your journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="glass-card p-8 hover:scale-105 transition-all">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
                Learning & Growth
              </h3>
              <p style={{ color: 'var(--muted)' }}>
                Access workshops, mentorship, and resources to develop entrepreneurial skills and leadership abilities.
              </p>
            </div>

            <div className="glass-card p-8 hover:scale-105 transition-all">
              <div className="text-5xl mb-4">🤝</div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
                Premium Networking
              </h3>
              <p style={{ color: 'var(--muted)' }}>
                Connect with founders, industry leaders, and like-minded peers from IIT Delhi and beyond.
              </p>
            </div>

            <div className="glass-card p-8 hover:scale-105 transition-all">
              <div className="text-5xl mb-4">🏆</div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
                Recognition & Rewards
              </h3>
              <p style={{ color: 'var(--muted)' }}>
                Earn certificates, exclusive goodies, and recognition from India&apos;s premier institution.
              </p>
            </div>

            <div className="glass-card p-8 hover:scale-105 transition-all">
              <div className="text-5xl mb-4">💡</div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
                Real Impact
              </h3>
              <p style={{ color: 'var(--muted)' }}>
                Make a difference in your campus by organizing events and building entrepreneurial culture.
              </p>
            </div>

            <div className="glass-card p-8 hover:scale-105 transition-all">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
                Skill Development
              </h3>
              <p style={{ color: 'var(--muted)' }}>
                Develop marketing, event management, leadership, and communication skills through hands-on experience.
              </p>
            </div>

            <div className="glass-card p-8 hover:scale-105 transition-all">
              <div className="text-5xl mb-4">🎁</div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
                Exclusive Perks
              </h3>
              <p style={{ color: 'var(--muted)' }}>
                Access to exclusive EDC events, workshops, competitions, and early-bird opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Programs/What You'll Do Section */}
      <section id="programs" className="py-20" style={{ background: 'var(--surface)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              What You&apos;ll Do 🚀
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--muted)' }}>
              Your responsibilities as a Campus Ambassador
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="glass-card p-8 border-l-4 hover:scale-[1.02] transition-all"
                 style={{ borderColor: 'var(--primary)' }}>
              <div className="flex items-start gap-4">
                <div className="text-4xl">🎪</div>
                <div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                    Organize Events
                  </h3>
                  <p style={{ color: 'var(--muted)' }}>
                    Host workshops, competitions, speaker sessions, and networking events at your college to inspire entrepreneurship.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 border-l-4 hover:scale-[1.02] transition-all"
                 style={{ borderColor: 'var(--secondary)' }}>
              <div className="flex items-start gap-4">
                <div className="text-4xl">📢</div>
                <div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                    Promote EDC Initiatives
                  </h3>
                  <p style={{ color: 'var(--muted)' }}>
                    Spread awareness about EDC programs, hackathons, competitions, and opportunities through various channels.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 border-l-4 hover:scale-[1.02] transition-all"
                 style={{ borderColor: 'var(--accent)' }}>
              <div className="flex items-start gap-4">
                <div className="text-4xl">👥</div>
                <div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                    Build Community
                  </h3>
                  <p style={{ color: 'var(--muted)' }}>
                    Create and nurture an entrepreneurial ecosystem, connect students, and foster collaboration in your campus.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 border-l-4 hover:scale-[1.02] transition-all"
                 style={{ borderColor: 'var(--success)' }}>
              <div className="flex items-start gap-4">
                <div className="text-4xl">⚡</div>
                <div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                    Drive Engagement
                  </h3>
                  <p style={{ color: 'var(--muted)' }}>
                    Engage students through social media campaigns, newsletters, direct outreach, and creative content.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              Frequently Asked Questions 💬
            </h2>
            <p className="text-lg" style={{ color: 'var(--muted)' }}>
              Everything you need to know about the program
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="glass-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-opacity-80 transition-all"
                >
                  <h3 className="text-lg font-semibold pr-8" style={{ color: 'var(--foreground)' }}>
                    {faq.question}
                  </h3>
                  <span className="text-2xl transition-transform" 
                        style={{ 
                          color: 'var(--primary)',
                          transform: openFaq === index ? 'rotate(45deg)' : 'rotate(0deg)'
                        }}>
                    +
                  </span>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6 animate-fadeIn" style={{ color: 'var(--muted)' }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20" style={{ background: 'var(--surface)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass-card p-12 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 opacity-10"
                 style={{ background: 'var(--gradient-primary)' }}></div>
            
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
                Ready to Make an Impact? 🎯
              </h2>
              <p className="text-lg max-w-2xl mx-auto mb-8" style={{ color: 'var(--muted)' }}>
                Join hundreds of ambassadors already shaping the entrepreneurial landscape. Start your journey today!
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <a
                  href="/auth/signup"
                  className="px-8 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-lg"
                  style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}
                >
                  ✨ Get Started Now
                </a>
                <a
                  href="/auth/login"
                  className="px-8 py-4 rounded-lg font-semibold text-lg border transition-all hover:scale-105"
                  style={{ background: 'var(--surface)', borderColor: 'var(--surface-light)', color: 'var(--foreground)' }}
                >
                  Already a member? Sign In
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="py-16 border-t" style={{ background: 'var(--surface)', borderColor: 'var(--surface-light)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="relative h-16 w-64">
                  <Image 
                    src="/assets/logo.png" 
                    alt="EDC IIT Delhi Logo" 
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <p className="text-sm mb-4 max-w-sm" style={{ color: 'var(--muted)' }}>
                Empowering students to foster entrepreneurial spirit across colleges nationwide. Join us in building the next generation of innovators and leaders.
              </p>
              <div className="flex gap-4">
                <a href="#" 
                   className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                   style={{ background: 'var(--surface-light)' }}>
                  <span style={{ color: 'var(--foreground)' }}>𝕏</span>
                </a>
                <a href="#" 
                   className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                   style={{ background: 'var(--surface-light)' }}>
                  <span style={{ color: 'var(--foreground)' }}>in</span>
                </a>
                <a href="#" 
                   className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                   style={{ background: 'var(--surface-light)' }}>
                  <span style={{ color: 'var(--foreground)' }}>IG</span>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                Quick Links
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#benefits" 
                     className="transition-all hover:scale-105 inline-block"
                     style={{ color: 'var(--muted)' }}
                     onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                     onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>
                    Why Join Us
                  </a>
                </li>
                <li>
                  <a href="#programs" 
                     className="transition-all hover:scale-105 inline-block"
                     style={{ color: 'var(--muted)' }}
                     onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                     onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>
                    What We Do
                  </a>
                </li>
                <li>
                  <a href="#faq" 
                     className="transition-all hover:scale-105 inline-block"
                     style={{ color: 'var(--muted)' }}
                     onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                     onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="/leaderboard" 
                     className="transition-all hover:scale-105 inline-block"
                     style={{ color: 'var(--muted)' }}
                     onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                     onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>
                    Leaderboard
                  </a>
                </li>
              </ul>
            </div>

            {/* Get Started */}
            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                Get Started
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="/auth/signup" 
                     className="transition-all hover:scale-105 inline-block"
                     style={{ color: 'var(--muted)' }}
                     onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                     onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>
                    Sign Up
                  </a>
                </li>
                <li>
                  <a href="/auth/login" 
                     className="transition-all hover:scale-105 inline-block"
                     style={{ color: 'var(--muted)' }}
                     onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                     onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>
                    Login
                  </a>
                </li>
                <li>
                  <a href="/dashboard" 
                     className="transition-all hover:scale-105 inline-block"
                     style={{ color: 'var(--muted)' }}
                     onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                     onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>
                    Dashboard
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4" 
               style={{ borderColor: 'var(--surface-light)' }}>
            <p className="text-sm text-center md:text-left" style={{ color: 'var(--muted)' }}>
              © {new Date().getFullYear()} Entrepreneurship Development Cell, IIT Delhi. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" 
                 className="transition-all hover:scale-105"
                 style={{ color: 'var(--muted)' }}
                 onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                 onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>
                Privacy Policy
              </a>
              <a href="#" 
                 className="transition-all hover:scale-105"
                 style={{ color: 'var(--muted)' }}
                 onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                 onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
