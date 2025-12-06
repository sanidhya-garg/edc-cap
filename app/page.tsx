"use client";
import Navbar from "./components/Navbar";
import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is the Campus Ambassador Program?",
      answer: "The eDC IIT Delhi Campus Ambassador Program empowers students to represent eDC at their colleges, organize events, and foster entrepreneurial culture among peers."
    },
    {
      question: "Who can apply?",
      answer: "Any undergraduate or graduate student passionate about entrepreneurship and willing to dedicate time to promote eDC initiatives can apply."
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
      answer: "Complete assigned tasks, organize events, promote eDC activities, and submit proof of work through your dashboard to earn points and climb the leaderboard."
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
              Why Join Us? 
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
                Access to exclusive eDC events, workshops, competitions, and early-bird opportunities.
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
              What You&apos;ll Do
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
                    Spread awareness about eDC programs, hackathons, competitions, and opportunities through various channels.
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
      <section id="faq" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              Frequently Asked Questions 
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
      <section className="relative py-16 overflow-hidden">
        {/* Subtle Background Element */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl rounded-full blur-3xl opacity-10"
               style={{ background: 'var(--gradient-primary)' }}></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-4 px-4 py-2 rounded-full"
               style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
              🚀 Start Your Journey
            </span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            Ready to Make an Impact? 
          </h2>
          
          <p className="text-base md:text-lg max-w-2xl mx-auto mb-8" style={{ color: 'var(--muted)' }}>
            Join hundreds of ambassadors shaping the entrepreneurial landscape and earn exclusive rewards.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-10">
            <a
              href="/auth/signup"
              className="group relative px-6 py-3 rounded-xl font-bold text-base transition-all hover:scale-105 shadow-lg overflow-hidden w-full sm:w-auto"
              style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <span className="relative flex items-center justify-center gap-2">
                <span>✨</span>
                <span>Get Started Now</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </a>
            
            <a
              href="/auth/login"
              className="group px-6 py-3 rounded-xl font-semibold text-base border transition-all hover:scale-105 w-full sm:w-auto"
              style={{ 
                background: 'transparent', 
                borderColor: 'var(--surface-lighter)', 
                color: 'var(--foreground)' 
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--surface-lighter)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <span>Already a member?</span>
                <span className="font-bold" style={{ color: 'var(--primary)' }}>Sign In</span>
              </span>
            </a>
          </div>
          
          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎓</span>
              <span className="font-semibold" style={{ color: 'var(--foreground)' }}>500+</span>
              <span style={{ color: 'var(--muted)' }}>Ambassadors</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <span className="font-semibold" style={{ color: 'var(--foreground)' }}>100+</span>
              <span style={{ color: 'var(--muted)' }}>Colleges</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🌟</span>
              <span className="font-semibold" style={{ color: 'var(--foreground)' }}>50+</span>
              <span style={{ color: 'var(--muted)' }}>Events</span>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="relative overflow-hidden py-20 border-t" 
              style={{ 
                background: 'linear-gradient(135deg, var(--surface) 0%, rgba(15, 23, 42, 0.95) 100%)',
                borderColor: 'var(--surface-light)' 
              }}>
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-20 blur-3xl"
             style={{ background: 'var(--gradient-primary)' }}></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl"
             style={{ background: 'var(--gradient-accent)' }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            {/* Brand */}
            <div className="md:col-span-5">
              <div className="flex items-center mb-6">
                <div className="relative h-16 w-64">
                  <Image 
                    src="/assets/logo.png" 
                    alt="eDC IIT Delhi Logo" 
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <p className="text-base mb-6 max-w-md leading-relaxed" style={{ color: 'var(--muted)' }}>
                Empowering students to foster entrepreneurial spirit across colleges nationwide. Join us in building the next generation of innovators and leaders.
              </p>
              
              {/* Social Links */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Connect with us:</span>
                <div className="flex gap-3">
                  <a href="https://x.com/edciitdelhi?lang=en" 
                     target="_blank"
                     rel="noopener noreferrer"
                     className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:rotate-6 group relative overflow-hidden"
                     style={{ background: 'var(--surface-light)', border: '1px solid var(--surface-lighter)' }}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                         style={{ background: 'var(--gradient-primary)' }}></div>
                    <span className="relative text-lg font-bold" style={{ color: 'var(--foreground)' }}>𝕏</span>
                  </a>
                  <a href="https://www.linkedin.com/company/edc-iit-delhi/?viewAsMember=true" 
                     target="_blank"
                     rel="noopener noreferrer"
                     className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:rotate-6 group relative overflow-hidden"
                     style={{ background: 'var(--surface-light)', border: '1px solid var(--surface-lighter)' }}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                         style={{ background: 'var(--gradient-secondary)' }}></div>
                    <span className="relative text-base font-bold" style={{ color: 'var(--foreground)' }}>in</span>
                  </a>
                  <a href="https://www.instagram.com/edc_iitd?igsh=dHY2bmx0a3ZmbWV4" 
                     target="_blank"
                     rel="noopener noreferrer"
                     className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:rotate-6 group relative overflow-hidden"
                     style={{ background: 'var(--surface-light)', border: '1px solid var(--surface-lighter)' }}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                         style={{ background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' }}></div>
                    <svg className="relative w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--foreground)' }}>
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="https://www.youtube.com/@edciitd6869" 
                     target="_blank"
                     rel="noopener noreferrer"
                     className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:rotate-6 group relative overflow-hidden"
                     style={{ background: 'var(--surface-light)', border: '1px solid var(--surface-lighter)' }}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                         style={{ background: '#FF0000' }}></div>
                    <svg className="relative w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--foreground)' }}>
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-2">
              <h4 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <span className="text-2xl"></span>
                <span>Quick Links</span>
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="#benefits" 
                     className="text-sm transition-all hover:translate-x-1 inline-flex items-center gap-2 group"
                     style={{ color: 'var(--muted)' }}
                     onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                     onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    Why Join Us
                  </a>
                </li>
                <li>
                  <a href="#programs" 
                     className="text-sm transition-all hover:translate-x-1 inline-flex items-center gap-2 group"
                     style={{ color: 'var(--muted)' }}
                     onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                     onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    What We Do
                  </a>
                </li>
                <li>
                  <a href="#faq" 
                     className="text-sm transition-all hover:translate-x-1 inline-flex items-center gap-2 group"
                     style={{ color: 'var(--muted)' }}
                     onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                     onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="/leaderboard" 
                     className="text-sm transition-all hover:translate-x-1 inline-flex items-center gap-2 group"
                     style={{ color: 'var(--muted)' }}
                     onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                     onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    Leaderboard 
                  </a>
                </li>
              </ul>
            </div>

            {/* Get Started */}
            <div className="md:col-span-2">
              <h4 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <span className="text-2xl"></span>
                <span>Get Started</span>
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="/auth/signup" 
                     className="text-sm transition-all hover:translate-x-1 inline-flex items-center gap-2 group"
                     style={{ color: 'var(--muted)' }}
                     onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                     onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    Sign Up
                  </a>
                </li>
                <li>
                  <a href="/auth/login" 
                     className="text-sm transition-all hover:translate-x-1 inline-flex items-center gap-2 group"
                     style={{ color: 'var(--muted)' }}
                     onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                     onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    Login
                  </a>
                </li>
                <li>
                  <a href="/dashboard" 
                     className="text-sm transition-all hover:translate-x-1 inline-flex items-center gap-2 group"
                     style={{ color: 'var(--muted)' }}
                     onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                     onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    Dashboard 
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact/Support */}
            <div className="md:col-span-3">
              <h4 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <span className="text-2xl"></span>
                <span>Get in Touch</span>
              </h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl"></span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>IIT Delhi</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Hauz Khas, New Delhi</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl"></span>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>support@edciitd.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="pt-8 border-t" 
               style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
            <div className="flex flex-col md:flex-row justify-center items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-center" style={{ color: 'var(--muted)' }}>
                <span>Made with</span>
                <span className="text-red-500 animate-pulse text-lg">❤️</span>
                <span>by eDC IIT Delhi © {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
