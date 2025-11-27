export interface AdminCredentials {
  username: string;
  password: string;
  name: string;
}

// Hardcoded admin credentials
const ADMIN_CREDENTIALS: AdminCredentials[] = [
  {
    username: "admin",
    password: "admin123",
    name: "Administrator"
  }
];

export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<{ success: boolean; admin?: AdminCredentials; error?: string }> {
  try {
    const admin = ADMIN_CREDENTIALS.find(
      (a) => a.username === username && a.password === password
    );

    if (admin) {
      return { success: true, admin };
    } else {
      return { success: false, error: "Invalid username or password" };
    }
  } catch (error) {
    console.error("Error verifying admin:", error);
    return { success: false, error: `Authentication failed: ${error}` };
  }
}
