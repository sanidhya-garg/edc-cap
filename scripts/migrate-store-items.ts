import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";

// Firebase config - replace with your actual config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const storeItems = [
  {
    title: "Campus Ambassador Letter",
    description: "Get an official Campus Ambassador letter for your profile",
    pointsRequired: 4,
    icon: "📜",
    type: "letter" as const,
    imageUrl: "",
    isActive: true,
    isPaused: false,
    createdBy: "system",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    title: "Principles of Building AI Agents",
    description: "A comprehensive book on building AI agents - delivered to your doorstep",
    pointsRequired: 100,
    icon: "📚",
    type: "book" as const,
    imageUrl: "/assets/book.jpg",
    isActive: true,
    isPaused: false,
    createdBy: "system",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];

async function migrateStoreItems() {
  console.log("Starting migration of store items...");
  
  try {
    for (const item of storeItems) {
      const docRef = await addDoc(collection(db, "storeItems"), item);
      console.log(`Added item: ${item.title} with ID: ${docRef.id}`);
    }
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error migrating store items:", error);
  }
}

migrateStoreItems();
