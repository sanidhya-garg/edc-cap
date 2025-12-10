"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/providers/AuthProvider";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface StoreItem {
  id: string;
  title: string;
  description: string;
  pointsRequired: number;
  icon: string;
  type: "letter" | "merchandise" | "other";
}

const STORE_ITEMS: StoreItem[] = [
  {
    id: "campus-ambassador-letter",
    title: "Campus Ambassador Letter",
    description: "Official Campus Ambassador Letter from EDC IIT Delhi. Perfect for your resume and LinkedIn profile.",
    pointsRequired: 4,
    icon: "📜",
    type: "letter"
  }
];

export default function StorePage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const userPoints = userProfile?.points || 0;

  useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
      return;
    }
  }, [user, router]);

  const handleDownloadLetter = () => {
    if (userPoints < 4) {
      alert("You need at least 4 points to unlock this item!");
      return;
    }

    // Generate and download the letter
    generateCampusAmbassadorLetter();
  };

  const generateCampusAmbassadorLetter = async () => {
    try {
      const userName = userProfile?.displayName || user?.displayName || 'User';
      const currentDate = new Date().toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
      
      // Fetch the template document
      const response = await fetch('/assets/1.docx');
      const templateBlob = await response.blob();
      
      // Read the template as array buffer
      const arrayBuffer = await templateBlob.arrayBuffer();
      
      // Load the docx file as binary content
      const zip = new PizZip(arrayBuffer);
      
      // Create a docxtemplater instance
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
          start: '{{',
          end: '}}'
        }
      });
      
      // Set the template variables
      doc.render({
        Name: userName,
        name: userName,
        DATE: currentDate,
        Date: currentDate,
        date: currentDate
      });
      
      // Generate the DOCX document
      const docxBlob = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      // Since we can't directly convert DOCX to PDF in the browser,
      // we'll use an API approach - create a form and submit to a conversion service
      // For now, let's generate a better formatted PDF from the template content
      
      // Note: For production, you'd want to use a backend service to convert DOCX to PDF
      // For now, I'll create a temporary solution using the template
      
      alert("Generating PDF from template...");
      
      // Download as DOCX for now - conversion to PDF requires backend/API
      const url = window.URL.createObjectURL(docxBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EDC_Campus_Ambassador_Letter_${userName.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert("Letter downloaded! Please convert to PDF using MS Word or any online converter if needed. 🎉");
    } catch (error) {
      console.error("Error generating letter:", error);
      alert("Failed to download letter. Please try again.");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header Bar */}
      <div className="border-b sticky top-0 z-50 backdrop-blur-lg" 
           style={{ borderColor: 'var(--surface-light)', background: 'rgba(var(--surface-rgb), 0.8)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏪</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                No Cap Store
              </h1>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                Redeem exclusive rewards
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 text-sm sm:text-base"
            style={{ background: 'var(--surface-light)', color: 'var(--foreground)' }}
          >
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Points Balance Card - Hero Style */}
        <div className="relative overflow-hidden rounded-2xl"
             style={{ background: 'var(--gradient-primary)' }}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-10 -top-10 text-9xl">⭐</div>
            <div className="absolute -left-10 -bottom-10 text-9xl">💎</div>
          </div>
          <div className="relative p-6 sm:p-8 text-center">
            <p className="text-xs sm:text-sm uppercase tracking-widest mb-2 opacity-90" 
               style={{ color: 'var(--foreground)' }}>
              Your Points Balance
            </p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="text-5xl sm:text-7xl font-black" style={{ color: 'var(--foreground)' }}>
                {userPoints}
              </div>
              <span className="text-3xl">⭐</span>
            </div>
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-all hover:scale-105"
              style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
            >
              <span>✨</span>
              Earn More Points
            </Link>
          </div>
        </div>

        {/* Store Items Section */}
        <div className="space-y-6">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Available Rewards
            </h2>
            <p className="text-sm sm:text-base" style={{ color: 'var(--muted)' }}>
              {STORE_ITEMS.length} exclusive item{STORE_ITEMS.length !== 1 ? 's' : ''} • Unlock with your points
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
            {STORE_ITEMS.map((item) => {
              const isUnlocked = userPoints >= item.pointsRequired;
              const pointsNeeded = Math.max(0, item.pointsRequired - userPoints);
              const progress = Math.min((userPoints / item.pointsRequired) * 100, 100);

              return (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                  style={{
                    background: 'var(--surface)',
                    border: `2px solid ${isUnlocked ? 'var(--primary)' : 'var(--surface-lighter)'}`
                  }}
                >
                  {/* Unlocked Badge */}
                  {isUnlocked && (
                    <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold z-10 shadow-lg animate-pulse"
                         style={{ background: 'var(--success)', color: 'var(--background)' }}>
                      ✓ UNLOCKED
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="p-6 sm:p-8">
                    {/* Icon Section */}
                    <div className="relative mb-6 flex justify-center">
                      <div className="relative">
                        <div className="text-8xl transform group-hover:scale-110 transition-transform duration-300">
                          {item.icon}
                        </div>
                        {!isUnlocked && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-2xl"
                               style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}>
                            <span className="text-5xl">🔒</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="mb-5">
                      <h3 className="text-xl font-bold mb-2 text-center" style={{ color: 'var(--foreground)' }}>
                        {item.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-center" style={{ color: 'var(--muted)' }}>
                        {item.description}
                      </p>
                    </div>

                    {/* Progress Section (for locked items) */}
                    {!isUnlocked && (
                      <div className="mb-5 space-y-2">
                        <div className="flex items-center justify-between text-xs font-medium" style={{ color: 'var(--muted)' }}>
                          <span>Progress</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-light)' }}>
                          <div 
                            className="h-full transition-all duration-500 rounded-full"
                            style={{ 
                              width: `${progress}%`,
                              background: 'var(--gradient-primary)'
                            }}
                          />
                        </div>
                        <p className="text-center text-xs font-medium" style={{ color: 'var(--muted)' }}>
                          {userPoints} / {item.pointsRequired} points
                        </p>
                      </div>
                    )}

                    {/* Points Required Badge */}
                    <div className="mb-4 flex items-center justify-center gap-2 py-3 px-5 rounded-xl"
                         style={{ background: 'var(--surface-light)' }}>
                      <span className="text-2xl">⭐</span>
                      <span className="font-bold" style={{ color: 'var(--foreground)' }}>
                        {item.pointsRequired} Points
                      </span>
                    </div>

                    {/* Action Button */}
                    {isUnlocked ? (
                      <button
                        onClick={handleDownloadLetter}
                        className="w-full py-3.5 rounded-xl font-bold text-base transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
                        style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span>📥</span>
                          Download Now
                        </span>
                      </button>
                    ) : (
                      <div className="w-full py-3.5 rounded-xl font-semibold text-sm text-center border-2"
                           style={{ 
                             borderColor: 'var(--surface-lighter)', 
                             color: 'var(--muted)', 
                             background: 'var(--surface-lighter)',
                             borderStyle: 'dashed'
                           }}>
                        🔒 Need {pointsNeeded} more point{pointsNeeded !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12 text-center"
             style={{ background: 'var(--surface)' }}>
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 text-9xl">🎁</div>
            <div className="absolute bottom-0 right-0 text-9xl">✨</div>
          </div>
          <div className="relative max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 animate-bounce"
                 style={{ background: 'var(--gradient-primary)' }}>
              <span className="text-4xl">🎁</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              More Rewards Coming Soon!
            </h3>
            <p className="text-base sm:text-lg mb-8 max-w-xl mx-auto" style={{ color: 'var(--muted)' }}>
              We&apos;re cooking up exclusive EDC merch, event tickets, and premium perks. Keep stacking those points!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="p-4 rounded-xl transition-all hover:scale-105" style={{ background: 'var(--surface-light)' }}>
                <div className="text-3xl mb-2">👕</div>
                <div className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Exclusive Merch</div>
              </div>
              <div className="p-4 rounded-xl transition-all hover:scale-105" style={{ background: 'var(--surface-light)' }}>
                <div className="text-3xl mb-2">🎟️</div>
                <div className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Event Passes</div>
              </div>
              <div className="p-4 rounded-xl transition-all hover:scale-105" style={{ background: 'var(--surface-light)' }}>
                <div className="text-3xl mb-2">💎</div>
                <div className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Premium Perks</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
