import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { Pool } from "pg";

async function createAdminUser() {
  try {
    // Check if user already exists
    const existingUser = await storage.getUserByUsername("idanfunnel@gmail.com");
    
    if (existingUser) {
      // Update existing user to admin if needed
      if (!existingUser.isAdmin) {
        await db.update(users)
          .set({ isAdmin: true })
          .where(eq(users.id, existingUser.id));
        console.log("User idanfunnel@gmail.com updated to admin status");
      } else {
        console.log("User idanfunnel@gmail.com is already an admin");
      }
    } else {
      // Create new admin user
      const newUser = await storage.createUser({
        username: "idanfunnel@gmail.com",
        email: "idanfunnel@gmail.com",
        password: "idan0505742326",
        isAdmin: true,
        bio: "Admin account",
        riskTolerance: "moderate"
      });
      
      // Create paper trading account
      try {
        await storage.createPaperTradingAccount({
          userId: newUser.id,
          balance: "150000",
          equity: "150000",
          availableMargin: "150000",
          usedMargin: "0",
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } catch (e) {
        console.warn("Could not create paper trading account for admin:", e);
      }
      
      console.log("Admin user created successfully with ID:", newUser.id);
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

// Execute the function
createAdminUser();