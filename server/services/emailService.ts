import { InsertVerificationCode, verificationCodes } from '@shared/schema';
import { db } from '../db';
import { eq, and, gt } from 'drizzle-orm';
import { Request, Response } from 'express';

// Helper to mask the email for privacy
export function maskEmail(email: string | null): string {
  if (!email) return 'unknown@email.com';
  
  const [username, domain] = email.split('@');
  const maskedUsername = username.substring(0, 3) + '*'.repeat(username.length - 3);
  return `${maskedUsername}@${domain}`;
}

// Generate a random 6-digit code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store the verification code in the database
export async function storeVerificationCode(userId: number, code: string): Promise<void> {
  // Set expiry to 3 minutes (180 seconds) from now
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + 180);

  // Insert the code
  await db.insert(verificationCodes).values({
    userId,
    code,
    expiresAt,
  });
}

// Generate verification code without sending email
export async function sendVerificationEmail(user: Express.User, isLogin = false): Promise<{ success: boolean, code?: string }> {
  try {
    // Generate a verification code
    const code = generateVerificationCode();
    
    // Store the code in the database
    await storeVerificationCode(user.id, code);
    
    // Instead of sending email, return the code to be displayed in the UI
    console.log(`Verification code for user ${user.username}: ${code}`);
    
    // Return the code so it can be displayed to the user directly
    return { success: true, code };
  } catch (error) {
    console.error('Error generating verification code:', error);
    return { success: false };
  }
}

// Verify a code for a specific user
export async function verifyCode(userId: number, code: string): Promise<boolean> {
  try {
    const now = new Date();
    
    // Find an active, non-expired, non-used code
    const [verificationCode] = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.userId, userId),
          eq(verificationCodes.code, code),
          eq(verificationCodes.isUsed, false),
          gt(verificationCodes.expiresAt, now)
        )
      );

    if (!verificationCode) {
      return false;
    }

    // Mark the code as used
    await db
      .update(verificationCodes)
      .set({ isUsed: true })
      .where(eq(verificationCodes.id, verificationCode.id));

    // Update the user's verification status if needed
    // This is handled in the auth controller

    return true;
  } catch (error) {
    console.error('Error verifying code:', error);
    return false;
  }
}

// Check if a verification code has been sent recently (within 3 minutes)
export async function hasRecentVerificationCode(userId: number): Promise<boolean> {
  try {
    const threeMinutesAgo = new Date();
    threeMinutesAgo.setMinutes(threeMinutesAgo.getMinutes() - 3);

    const [recentCode] = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.userId, userId),
          eq(verificationCodes.isUsed, false),
          gt(verificationCodes.createdAt, threeMinutesAgo)
        )
      );

    return !!recentCode;
  } catch (error) {
    console.error('Error checking recent verification code:', error);
    return false;
  }
}

// Mark all unused verification codes for a user as used (for cleanup)
export async function markAllCodesAsUsed(userId: number): Promise<void> {
  try {
    await db
      .update(verificationCodes)
      .set({ isUsed: true })
      .where(
        and(
          eq(verificationCodes.userId, userId),
          eq(verificationCodes.isUsed, false)
        )
      );
  } catch (error) {
    console.error('Error marking codes as used:', error);
  }
}