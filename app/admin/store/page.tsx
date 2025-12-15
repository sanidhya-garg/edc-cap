"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAdminAuth } from "@/app/providers/AdminAuthProvider";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StoreItem, Order, OrderStatus } from "@/lib/types";

export default function AdminStorePage() {
  const { admin } = useAdminAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"items" | "orders">("items");
  
  // Store Items State
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [itemFormData, setItemFormData] = useState<{
    title: string;
    description: string;
    pointsRequired: number;
    icon: string;
    type: StoreItem["type"];
    imageUrl: string;
    isActive: boolean;
    isPaused: boolean;
  }>({
    title: "",
    description: "",
    pointsRequired: 0,
    icon: "📦",
    type: "other",
    imageUrl: "",
    isActive: true,
    isPaused: false,
  });
  
  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchStoreItems(), fetchOrders()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!admin) {
      router.replace("/admin/login");
      return;
    }

    fetchData();
  }, [admin, router, fetchData]);

  const fetchStoreItems = async () => {
    try {
      const itemsQuery = query(
        collection(db, "storeItems"),
        orderBy("createdAt", "desc")
      );
      const itemsSnap = await getDocs(itemsQuery);
      const items = itemsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StoreItem[];
      setStoreItems(items);
    } catch (error) {
      console.error("Error fetching store items:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const ordersQuery = query(
        collection(db, "orders"),
        orderBy("createdAt", "desc")
      );
      const ordersSnap = await getDocs(ordersQuery);
      const ordersList = ordersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersList);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const handleItemFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setItemFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === "pointsRequired") {
      // Keep the value as is (even if empty string), let form validation handle it
      const numValue = value === "" ? "" : parseInt(value);
      setItemFormData(prev => ({ ...prev, [name]: numValue as number }));
    } else {
      setItemFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setItemFormData({
      title: "",
      description: "",
      pointsRequired: 0,
      icon: "📦",
      type: "other",
      imageUrl: "",
      isActive: true,
      isPaused: false,
    });
    setShowItemForm(true);
  };

  const handleEditItem = (item: StoreItem) => {
    setEditingItem(item);
    setItemFormData({
      title: item.title,
      description: item.description,
      pointsRequired: item.pointsRequired,
      icon: item.icon,
      type: item.type,
      imageUrl: item.imageUrl || "",
      isActive: item.isActive,
      isPaused: item.isPaused,
    });
    setShowItemForm(true);
  };

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingItem) {
        // Update existing item
        const itemRef = doc(db, "storeItems", editingItem.id);
        await updateDoc(itemRef, {
          ...itemFormData,
          updatedAt: Timestamp.now(),
        });
        alert("✅ Item updated successfully!");
      } else {
        // Add new item
        await addDoc(collection(db, "storeItems"), {
          ...itemFormData,
          createdBy: admin?.username || "admin",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        alert("✅ Item added successfully!");
      }

      setShowItemForm(false);
      setEditingItem(null);
      fetchStoreItems();
    } catch (error) {
      console.error("Error saving item:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`❌ Failed to save item: ${errorMessage}`);
    }
  };

  const handleTogglePause = async (item: StoreItem) => {
    try {
      const itemRef = doc(db, "storeItems", item.id);
      await updateDoc(itemRef, {
        isPaused: !item.isPaused,
        updatedAt: Timestamp.now(),
      });
      fetchStoreItems();
    } catch (error) {
      console.error("Error toggling pause:", error);
      alert("❌ Failed to update item status.");
    }
  };

  const handleDeleteItem = async (item: StoreItem) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "storeItems", item.id));
      alert("✅ Item deleted successfully!");
      fetchStoreItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("❌ Failed to delete item.");
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
      alert("✅ Order status updated!");
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("❌ Failed to update order status.");
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending": return "#FFA500";
      case "processing": return "#3B82F6";
      case "shipped": return "#8B5CF6";
      case "delivered": return "#10B981";
      case "cancelled": return "#EF4444";
      default: return "#6B7280";
    }
  };

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="text-sm mb-2 inline-block hover:underline" style={{ color: 'var(--primary)' }}>
              ← Back to Admin
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--foreground)' }}>
              🏪 Store Management
            </h1>
            <p className="text-sm sm:text-base mt-1" style={{ color: 'var(--muted)' }}>
              Manage store items and orders
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'var(--surface)' }}>
          <button
            onClick={() => setActiveTab("items")}
            className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all"
            style={{
              background: activeTab === "items" ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === "items" ? 'var(--foreground)' : 'var(--muted)',
            }}
          >
            📦 Store Items ({storeItems.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all"
            style={{
              background: activeTab === "orders" ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === "orders" ? 'var(--foreground)' : 'var(--muted)',
            }}
          >
            📋 Orders ({orders.length})
          </button>
        </div>

        {/* Store Items Tab */}
        {activeTab === "items" && (
          <div className="space-y-4">
            {/* Add Item Button */}
            <div className="flex justify-end">
              <button
                onClick={handleAddItem}
                className="px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg"
                style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}
              >
                + Add New Item
              </button>
            </div>

            {/* Items List */}
            {isLoading ? (
              <div className="text-center py-20">
                <div className="animate-spin text-6xl mb-4">⭐</div>
                <p className="text-lg" style={{ color: 'var(--muted)' }}>Loading items...</p>
              </div>
            ) : storeItems.length === 0 ? (
              <div className="text-center py-20 rounded-2xl" style={{ background: 'var(--surface)' }}>
                <div className="text-6xl mb-4">📦</div>
                <p className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>No items yet</p>
                <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Add your first store item!</p>
                <button
                  onClick={handleAddItem}
                  className="px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
                  style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}
                >
                  + Add Item
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {storeItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl p-6 space-y-4"
                    style={{
                      background: 'var(--surface)',
                      border: `2px solid ${item.isPaused ? '#FFA500' : item.isActive ? 'var(--primary)' : '#EF4444'}`,
                    }}
                  >
                    {/* Status Badges */}
                    <div className="flex gap-2 flex-wrap">
                      {item.isPaused && (
                        <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ background: '#FFA500', color: 'white' }}>
                          ⏸️ PAUSED
                        </span>
                      )}
                      {!item.isActive && (
                        <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ background: '#EF4444', color: 'white' }}>
                          🚫 INACTIVE
                        </span>
                      )}
                      {item.isActive && !item.isPaused && (
                        <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ background: '#10B981', color: 'white' }}>
                          ✓ ACTIVE
                        </span>
                      )}
                    </div>

                    {/* Item Preview */}
                    <div className="text-center">
                      {item.imageUrl ? (
                        <div className="relative w-32 h-32 mx-auto mb-2">
                          <Image src={item.imageUrl} alt={item.title} fill className="object-contain rounded-lg" />
                        </div>
                      ) : (
                        <div className="text-6xl mb-2">{item.icon}</div>
                      )}
                      <h3 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>{item.title}</h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{item.description}</p>
                    </div>

                    {/* Item Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--muted)' }}>Points:</span>
                        <span className="font-bold" style={{ color: 'var(--foreground)' }}>⭐ {item.pointsRequired}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--muted)' }}>Type:</span>
                        <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{item.type}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="py-2 px-3 rounded-lg font-semibold text-sm transition-all hover:scale-105"
                        style={{ background: 'var(--primary)', color: 'var(--foreground)' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleTogglePause(item)}
                        className="py-2 px-3 rounded-lg font-semibold text-sm transition-all hover:scale-105"
                        style={{ background: item.isPaused ? '#10B981' : '#FFA500', color: 'white' }}
                      >
                        {item.isPaused ? '▶️ Resume' : '⏸️ Pause'}
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="py-2 px-3 rounded-lg font-semibold text-sm transition-all hover:scale-105 col-span-2"
                        style={{ background: '#EF4444', color: 'white' }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-20">
                <div className="animate-spin text-6xl mb-4">📦</div>
                <p className="text-lg" style={{ color: 'var(--muted)' }}>Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20 rounded-2xl" style={{ background: 'var(--surface)' }}>
                <div className="text-6xl mb-4">📋</div>
                <p className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>No orders yet</p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Orders will appear here once users start redeeming items</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg"
                    style={{ background: 'var(--surface)', border: `2px solid ${getStatusColor(order.status)}` }}
                    onClick={() => handleViewOrder(order)}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                            {order.itemTitle}
                          </h3>
                          <span
                            className="px-3 py-1 rounded-full text-xs font-bold"
                            style={{ background: getStatusColor(order.status), color: 'white' }}
                          >
                            {order.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm" style={{ color: 'var(--muted)' }}>
                          <p>👤 {order.userName} ({order.userEmail})</p>
                          <p>📍 {order.shippingAddress.city}, {order.shippingAddress.state}</p>
                          <p>📅 {order.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl" style={{ color: 'var(--foreground)' }}>
                          ⭐ {order.pointsUsed}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewOrder(order);
                          }}
                          className="mt-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105"
                          style={{ background: 'var(--primary)', color: 'var(--foreground)' }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Item Form Modal */}
      {showItemForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: 'var(--surface)' }}>
            <div className="sticky top-0 z-10 px-6 py-4 border-b backdrop-blur-lg"
                 style={{ borderColor: 'var(--surface-light)', background: 'rgba(var(--surface-rgb), 0.95)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                {editingItem ? '✏️ Edit Item' : '+ Add New Item'}
              </h2>
            </div>

            <form onSubmit={handleSubmitItem} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={itemFormData.title}
                  onChange={handleItemFormChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border-2"
                  style={{ background: 'var(--background)', borderColor: 'var(--surface-light)', color: 'var(--foreground)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Description *</label>
                <textarea
                  name="description"
                  value={itemFormData.description}
                  onChange={handleItemFormChange}
                  required
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border-2 resize-none"
                  style={{ background: 'var(--background)', borderColor: 'var(--surface-light)', color: 'var(--foreground)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Points Required *</label>
                <input
                  type="number"
                  name="pointsRequired"
                  value={itemFormData.pointsRequired}
                  onChange={handleItemFormChange}
                  required
                  min="0"
                  className="w-full px-4 py-3 rounded-lg border-2"
                  style={{ background: 'var(--background)', borderColor: 'var(--surface-light)', color: 'var(--foreground)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Icon (Emoji)</label>
                <input
                  type="text"
                  name="icon"
                  value={itemFormData.icon}
                  onChange={handleItemFormChange}
                  className="w-full px-4 py-3 rounded-lg border-2"
                  style={{ background: 'var(--background)', borderColor: 'var(--surface-light)', color: 'var(--foreground)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Type *</label>
                <select
                  name="type"
                  value={itemFormData.type}
                  onChange={handleItemFormChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border-2"
                  style={{ background: 'var(--background)', borderColor: 'var(--surface-light)', color: 'var(--foreground)' }}
                >
                  <option value="letter">Letter</option>
                  <option value="book">Book</option>
                  <option value="merchandise">Merchandise</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  Image URL (optional, e.g., /assets/book.jpg)
                </label>
                <input
                  type="text"
                  name="imageUrl"
                  value={itemFormData.imageUrl}
                  onChange={handleItemFormChange}
                  placeholder="/assets/image.jpg"
                  className="w-full px-4 py-3 rounded-lg border-2"
                  style={{ background: 'var(--background)', borderColor: 'var(--surface-light)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={itemFormData.isActive}
                    onChange={handleItemFormChange}
                    className="w-5 h-5"
                  />
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isPaused"
                    checked={itemFormData.isPaused}
                    onChange={handleItemFormChange}
                    className="w-5 h-5"
                  />
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Paused</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowItemForm(false)}
                  className="flex-1 py-3 rounded-xl font-bold"
                  style={{ background: 'var(--surface-light)', color: 'var(--foreground)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold"
                  style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: 'var(--surface)' }}>
            <div className="sticky top-0 z-10 px-6 py-4 border-b backdrop-blur-lg flex justify-between items-center"
                 style={{ borderColor: 'var(--surface-light)', background: 'rgba(var(--surface-rgb), 0.95)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                📦 Order Details
              </h2>
              <button
                onClick={() => setShowOrderModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--surface-light)', color: 'var(--foreground)' }}
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Status */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Order Status</label>
                <div className="flex gap-2 flex-wrap">
                  {(["pending", "processing", "shipped", "delivered", "cancelled"] as OrderStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, status)}
                      className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105"
                      style={{
                        background: selectedOrder.status === status ? getStatusColor(status) : 'var(--surface-light)',
                        color: selectedOrder.status === status ? 'white' : 'var(--foreground)',
                      }}
                    >
                      {status.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Item Details */}
              <div className="p-4 rounded-xl" style={{ background: 'var(--surface-light)' }}>
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--foreground)' }}>Item</h3>
                <p className="text-lg" style={{ color: 'var(--foreground)' }}>{selectedOrder.itemTitle}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Points: ⭐ {selectedOrder.pointsUsed}</p>
              </div>

              {/* Customer Details */}
              <div className="p-4 rounded-xl" style={{ background: 'var(--surface-light)' }}>
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--foreground)' }}>Customer</h3>
                <div className="space-y-1 text-sm" style={{ color: 'var(--foreground)' }}>
                  <p><strong>Name:</strong> {selectedOrder.userName}</p>
                  <p><strong>Email:</strong> {selectedOrder.userEmail}</p>
                  <p><strong>Phone:</strong> {selectedOrder.shippingAddress.phone}</p>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="p-4 rounded-xl" style={{ background: 'var(--surface-light)' }}>
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--foreground)' }}>Shipping Address</h3>
                <div className="space-y-1 text-sm" style={{ color: 'var(--foreground)' }}>
                  <p>{selectedOrder.shippingAddress.addressLine1}</p>
                  {selectedOrder.shippingAddress.addressLine2 && <p>{selectedOrder.shippingAddress.addressLine2}</p>}
                  <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}</p>
                </div>
              </div>

              {/* Order Timeline */}
              <div className="p-4 rounded-xl" style={{ background: 'var(--surface-light)' }}>
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--foreground)' }}>Timeline</h3>
                <div className="space-y-1 text-sm" style={{ color: 'var(--foreground)' }}>
                  <p><strong>Ordered:</strong> {selectedOrder.createdAt?.toDate?.().toLocaleString() || 'N/A'}</p>
                  <p><strong>Last Updated:</strong> {selectedOrder.updatedAt?.toDate?.().toLocaleString() || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
