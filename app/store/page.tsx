"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/providers/AuthProvider";
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StoreItem, Order } from "@/lib/types";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export default function StorePage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const userPoints = userProfile?.points || 0;
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [orderFormData, setOrderFormData] = useState({
    name: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [userOrders, setUserOrders] = useState<Map<string, Order>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    
    // Pre-fill form data from user profile
    if (userProfile) {
      setOrderFormData({
        name: userProfile.displayName || "",
        email: userProfile.email || "",
        phone: userProfile.phoneNumber || "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: ""
      });
    }

    fetchStoreData();
  }, [user, userProfile, router]);

  const fetchStoreData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch store items
      const itemsQuery = query(
        collection(db, "storeItems"),
        orderBy("pointsRequired", "asc")
      );
      const itemsSnap = await getDocs(itemsQuery);
      const items = itemsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StoreItem[];
      
      // Filter active and non-paused items
      const activeItems = items.filter(item => item.isActive && !item.isPaused);
      setStoreItems(activeItems);

      // Fetch user's orders
      if (user) {
        const ordersQuery = query(
          collection(db, "orders"),
          where("userId", "==", user.uid)
        );
        const ordersSnap = await getDocs(ordersQuery);
        const ordersMap = new Map<string, Order>();
        ordersSnap.docs.forEach(doc => {
          const order = { id: doc.id, ...doc.data() } as Order;
          ordersMap.set(order.itemId, order);
        });
        setUserOrders(ordersMap);
      }
    } catch (error) {
      console.error("Error fetching store data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadLetter = () => {
    if (userPoints < 4) {
      alert("You need at least 4 points to unlock this item!");
      return;
    }

    // Generate and download the letter
    generateCampusAmbassadorLetter();
  };

  const handleOrderBook = (item: StoreItem) => {
    if (userPoints < item.pointsRequired) {
      alert(`You need at least ${item.pointsRequired} points to unlock this item!`);
      return;
    }

    setSelectedItem(item);
    setShowOrderForm(true);
  };

  const handleOrderFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderFormData({
      ...orderFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form
      if (!orderFormData.name || !orderFormData.email || !orderFormData.phone) {
        alert("Please complete your profile with name, email, and phone number first.");
        setIsSubmitting(false);
        return;
      }

      if (!orderFormData.addressLine1 || !orderFormData.city || !orderFormData.state || !orderFormData.pincode) {
        alert("Please fill in all required address fields.");
        setIsSubmitting(false);
        return;
      }

      if (!/^[0-9]{6}$/.test(orderFormData.pincode)) {
        alert("Please enter a valid 6-digit pincode.");
        setIsSubmitting(false);
        return;
      }

      // Save order to Firestore
      const orderData: Omit<Order, "id"> = {
        userId: user?.uid || "",
        userName: orderFormData.name,
        userEmail: orderFormData.email,
        itemId: selectedItem?.id || "",
        itemTitle: selectedItem?.title || "",
        pointsUsed: selectedItem?.pointsRequired || 0,
        status: "pending",
        shippingAddress: {
          name: orderFormData.name,
          email: orderFormData.email,
          phone: orderFormData.phone,
          addressLine1: orderFormData.addressLine1,
          addressLine2: orderFormData.addressLine2 || "",
          city: orderFormData.city,
          state: orderFormData.state,
          pincode: orderFormData.pincode,
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);

      // Update local orders map
      const newOrder: Order = { id: docRef.id, ...orderData };
      setUserOrders(prev => new Map(prev).set(selectedItem?.id || "", newOrder));

      alert("🎉 Order placed successfully! Your item will be delivered soon.");
      setShowOrderForm(false);
      setSelectedItem(null);
    } catch (error: unknown) {
      console.error("Error placing order:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to place order. Please try again.";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
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
              {storeItems.length} exclusive item{storeItems.length !== 1 ? 's' : ''} • Unlock with your points
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin text-6xl mb-4">⭐</div>
              <p className="text-lg" style={{ color: 'var(--muted)' }}>Loading rewards...</p>
            </div>
          ) : storeItems.length === 0 ? (
            <div className="text-center py-20 rounded-2xl" style={{ background: 'var(--surface)' }}>
              <div className="text-6xl mb-4">🎁</div>
              <p className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>No items available yet</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Check back soon for exciting rewards!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
              {/* Hardcoded Letter Item */}
              {(() => {
                const letterPoints = 4;
                const isLetterUnlocked = userPoints >= letterPoints;
                const pointsNeeded = Math.max(0, letterPoints - userPoints);
                const progress = Math.min((userPoints / letterPoints) * 100, 100);

                return (
                  <div
                    className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                    style={{
                      background: 'var(--surface)',
                      border: `2px solid ${isLetterUnlocked ? 'var(--primary)' : 'var(--surface-lighter)'}`
                    }}
                  >
                    {/* Unlocked Badge */}
                    {isLetterUnlocked && (
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
                          <div className="text-7xl sm:text-8xl transform group-hover:scale-110 transition-transform duration-300 filter group-hover:drop-shadow-2xl">
                            📜
                          </div>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="text-center mb-6">
                        <h3 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                          Campus Ambassador Letter
                        </h3>
                        <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--muted)' }}>
                          Get an official Campus Ambassador letter for your profile
                        </p>
                      </div>

                      {/* Points Section */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between text-sm">
                          <span style={{ color: 'var(--muted)' }}>Points Required</span>
                          <span className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>⭐ {letterPoints}</span>
                        </div>

                        {/* Progress Bar */}
                        {!isLetterUnlocked && (
                          <div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-light)' }}>
                              <div 
                                className="h-full transition-all duration-500 rounded-full"
                                style={{ 
                                  width: `${progress}%`,
                                  background: 'var(--gradient-primary)'
                                }}
                              />
                            </div>
                            <p className="text-xs mt-2 text-center" style={{ color: 'var(--muted)' }}>
                              {pointsNeeded} more {pointsNeeded === 1 ? 'point' : 'points'} needed
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={handleDownloadLetter}
                        disabled={!isLetterUnlocked}
                        className="w-full py-3.5 rounded-xl font-bold text-base transition-all hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        style={{
                          background: isLetterUnlocked ? 'var(--gradient-primary)' : 'var(--surface-light)',
                          color: isLetterUnlocked ? 'var(--foreground)' : 'var(--muted)'
                        }}
                      >
                        {isLetterUnlocked ? '📥 Download Letter' : '🔒 Locked'}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Dynamic Store Items from Firestore */}
              {storeItems.map((item) => {
                const isUnlocked = userPoints >= item.pointsRequired;
                const userOrder = userOrders.get(item.id);
                const isOrdered = !!userOrder;
                const pointsNeeded = Math.max(0, item.pointsRequired - userPoints);
                const progress = Math.min((userPoints / item.pointsRequired) * 100, 100);

                return (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                    style={{
                      background: 'var(--surface)',
                      border: `2px solid ${isOrdered ? '#8B5CF6' : isUnlocked ? 'var(--primary)' : 'var(--surface-lighter)'}`
                    }}
                  >
                    {/* Ordered/Unlocked Badge */}
                    {isOrdered ? (
                      <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold z-10 shadow-lg"
                           style={{ background: '#8B5CF6', color: 'white' }}>
                        {userOrder.status.toUpperCase()}
                      </div>
                    ) : isUnlocked && (
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
                          {item.imageUrl ? (
                            <div className="relative w-48 h-48 transform group-hover:scale-110 transition-transform duration-300">
                              <Image
                                src={item.imageUrl}
                                alt={item.title}
                                fill
                                className="object-contain rounded-lg"
                                style={{ filter: !isUnlocked ? 'blur(8px) brightness(0.5)' : 'none' }}
                              />
                            </div>
                          ) : (
                            <div className="text-8xl transform group-hover:scale-110 transition-transform duration-300">
                              {item.icon}
                            </div>
                          )}
                          {!isUnlocked && !item.imageUrl && (
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
                      {isOrdered ? (
                        <div className="w-full py-3.5 rounded-xl font-semibold text-base text-center border-2"
                             style={{ 
                               borderColor: '#8B5CF6', 
                               color: '#8B5CF6', 
                               background: 'rgba(139, 92, 246, 0.1)'
                             }}>
                          ✓ Order Status: {userOrder.status}
                        </div>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => item.type === "letter" ? handleDownloadLetter() : handleOrderBook(item)}
                          className="w-full py-3.5 rounded-xl font-bold text-base transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
                          style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}
                        >
                          <span className="inline-flex items-center gap-2">
                            {item.type === "letter" ? (
                              <>
                                <span>📥</span>
                                Download Now
                              </>
                            ) : (
                              <>
                                <span>🛒</span>
                                Order for Free
                              </>
                            )}
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
          )}
        </div>
      </div>

      {/* Order Form Modal */}
      {showOrderForm && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: 'var(--surface)' }}>
            {/* Modal Header */}
            <div className="sticky top-0 z-10 px-6 py-4 border-b backdrop-blur-lg" 
                 style={{ borderColor: 'var(--surface-light)', background: 'rgba(var(--surface-rgb), 0.95)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedItem.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                      Order: {selectedItem.title}
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      Fill in your delivery details
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOrderForm(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: 'var(--surface-light)', color: 'var(--foreground)' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleOrderSubmit} className="p-6 space-y-5">
              {/* Name (Auto-filled) */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={orderFormData.name}
                  readOnly
                  className="w-full px-4 py-3 rounded-lg text-base border-2 cursor-not-allowed"
                  style={{ 
                    background: 'var(--surface-light)', 
                    borderColor: 'var(--surface-lighter)',
                    color: 'var(--muted)'
                  }}
                />
              </div>

              {/* Email (Auto-filled) */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={orderFormData.email}
                  readOnly
                  className="w-full px-4 py-3 rounded-lg text-base border-2 cursor-not-allowed"
                  style={{ 
                    background: 'var(--surface-light)', 
                    borderColor: 'var(--surface-lighter)',
                    color: 'var(--muted)'
                  }}
                />
              </div>

              {/* Phone (Auto-filled) */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={orderFormData.phone}
                  readOnly
                  className="w-full px-4 py-3 rounded-lg text-base border-2 cursor-not-allowed"
                  style={{ 
                    background: 'var(--surface-light)', 
                    borderColor: 'var(--surface-lighter)',
                    color: 'var(--muted)'
                  }}
                />
              </div>

              <div className="h-px" style={{ background: 'var(--surface-light)' }}></div>

              {/* Address Line 1 */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={orderFormData.addressLine1}
                  onChange={handleOrderFormChange}
                  placeholder="House/Flat No., Street Name"
                  required
                  className="w-full px-4 py-3 rounded-lg text-base border-2 transition-all focus:outline-none focus:border-[var(--primary)]"
                  style={{ 
                    background: 'var(--background)', 
                    borderColor: 'var(--surface-light)',
                    color: 'var(--foreground)'
                  }}
                />
              </div>

              {/* Address Line 2 */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={orderFormData.addressLine2}
                  onChange={handleOrderFormChange}
                  placeholder="Landmark, Area (Optional)"
                  className="w-full px-4 py-3 rounded-lg text-base border-2 transition-all focus:outline-none focus:border-[var(--primary)]"
                  style={{ 
                    background: 'var(--background)', 
                    borderColor: 'var(--surface-light)',
                    color: 'var(--foreground)'
                  }}
                />
              </div>

              {/* City and State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={orderFormData.city}
                    onChange={handleOrderFormChange}
                    placeholder="City"
                    required
                    className="w-full px-4 py-3 rounded-lg text-base border-2 transition-all focus:outline-none focus:border-[var(--primary)]"
                    style={{ 
                      background: 'var(--background)', 
                      borderColor: 'var(--surface-light)',
                      color: 'var(--foreground)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={orderFormData.state}
                    onChange={handleOrderFormChange}
                    placeholder="State"
                    required
                    className="w-full px-4 py-3 rounded-lg text-base border-2 transition-all focus:outline-none focus:border-[var(--primary)]"
                    style={{ 
                      background: 'var(--background)', 
                      borderColor: 'var(--surface-light)',
                      color: 'var(--foreground)'
                    }}
                  />
                </div>
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  Pincode *
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={orderFormData.pincode}
                  onChange={handleOrderFormChange}
                  placeholder="6-digit pincode"
                  required
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg text-base border-2 transition-all focus:outline-none focus:border-[var(--primary)]"
                  style={{ 
                    background: 'var(--background)', 
                    borderColor: 'var(--surface-light)',
                    color: 'var(--foreground)'
                  }}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowOrderForm(false)}
                  className="flex-1 py-3.5 rounded-xl font-bold text-base transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: 'var(--surface-light)', color: 'var(--foreground)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 rounded-xl font-bold text-base transition-all hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}
                >
                  {isSubmitting ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
