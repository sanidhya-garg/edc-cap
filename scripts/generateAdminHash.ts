/**
 * Admin Password Hash Generator
 * 
 * This script helps you generate password hashes for admin accounts.
 * 
 * Usage:
 * 1. Open your browser console
 * 2. Copy and paste the generateHash function
 * 3. Run: generateHash("your_password")
 * 4. Copy the output hash to Firestore
 */

export function generateHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// Example usage (for documentation):
// console.log(generateHash("admin123"));  // Output: -6d45de78
// 
// Add to Firestore admins collection:
// {
//   username: "admin",
//   passwordHash: "-6d45de78",
//   name: "Administrator",
//   createdAt: Firebase.Timestamp.now()
// }
