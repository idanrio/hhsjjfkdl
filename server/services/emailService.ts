import nodemailer from 'nodemailer';
import { InsertVerificationCode, verificationCodes } from '@shared/schema';
import { db } from '../db';
import { eq, and, gt } from 'drizzle-orm';
import { Request, Response } from 'express';

// Create reusable transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'capitularsells@gmail.com', // Your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD, // Application-specific password
  },
});

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

// Send a verification email with code
export async function sendVerificationEmail(user: Express.User, isLogin = false): Promise<boolean> {
  try {
    // Generate a verification code
    const code = generateVerificationCode();
    
    // Store the code in the database
    await storeVerificationCode(user.id, code);

    // Email subject based on action
    const subject = isLogin 
      ? 'Your Capitulre Login Verification Code' 
      : 'Verify Your Email for Capitulre';

    // Construct the message
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #1c3d86; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://capitulre.com/logo.png" alt="Capitulre Logo" style="max-width: 150px;">
        </div>
        <h2 style="color: #1c3d86; text-align: center;">Verification Code</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">Hello ${user.username},</p>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">Your verification code for ${isLogin ? 'logging into' : 'registering with'} Capitulre is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #22a1e2; background-color: #f8f8f8; padding: 15px; border-radius: 6px; display: inline-block;">
            ${code}
          </div>
        </div>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">This code will expire in 3 minutes.</p>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">If you didn't request this code, please ignore this email.</p>
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 14px;">
          &copy; ${new Date().getFullYear()} Capitulre. All rights reserved.
        </div>
      </div>
    `;

    // Send the email
    if (!user.email) {
      throw new Error('User has no email address');
    }
    
    await transporter.sendMail({
      from: '"Capitulre Security" <capitularsells@gmail.com>',
      to: user.email,
      subject,
      html: message,
    });

    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
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