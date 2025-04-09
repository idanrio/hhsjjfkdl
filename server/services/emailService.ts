import nodemailer from 'nodemailer';
import { VerificationCode, InsertVerificationCode, verificationCodes } from '@shared/schema';
import { storage } from '../storage';
import { log } from '../vite';
import { db } from '../db';
import { eq, and, sql } from 'drizzle-orm';



// Create a nodemailer transporter
let transporter: nodemailer.Transporter;

if (process.env.GMAIL_APP_PASSWORD) {
  // Use Gmail if app password is available
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'info@capitulre.com', // Replace with your actual Gmail address
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  log('Email service initialized with Gmail', 'email');
} else {
  // Use a fake SMTP server for development
  transporter = {
    sendMail: async (mailOptions: nodemailer.SendMailOptions) => {
      // Log the email instead of sending
      log(`Email would be sent to: ${mailOptions.to}`, 'email');
      log(`Subject: ${mailOptions.subject}`, 'email');
      log(`Content: ${mailOptions.text || mailOptions.html}`, 'email');
      return { messageId: 'fake-message-id' };
    },
  } as any;
  log('Email service initialized with fake transport (for development)', 'email');
}

// Generate a random 6-digit code
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to mask email for privacy
export const maskEmail = (email: string): string => {
  if (!email) return '';
  
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  
  const name = parts[0];
  const domain = parts[1];
  
  // Show first and last character of name, mask the rest
  const maskedName = name.length <= 2 
    ? name 
    : `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}`;
  
  return `${maskedName}@${domain}`;
};

// Verify a code
export const verifyCode = async (userId: number, code: string): Promise<boolean> => {
  const verificationCode = await storage.getVerificationCode(userId, code);
  
  if (!verificationCode) {
    return false;
  }
  
  // Check if the code is expired
  const now = new Date();
  if (now > new Date(verificationCode.expiresAt)) {
    return false;
  }
  
  // Mark the code as used
  await storage.markVerificationCodeAsUsed(verificationCode.id);
  
  return true;
};

// Mark all codes as used for a user
export const markAllCodesAsUsed = async (userId: number): Promise<void> => {
  // Update all unused codes for this user to used=true
  await db
    .update(verificationCodes)
    .set({ isUsed: true })
    .where(
      and(
        eq(verificationCodes.userId, userId),
        eq(verificationCodes.isUsed, false)
      )
    );
};

// Send verification email with code
export const sendVerificationEmail = async (user: any, sendEmail: boolean = true): Promise<{ success: boolean, code: string }> => {
  // Generate a new verification code
  const code = generateVerificationCode();
  
  // Store the code in the database
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Code expires in 1 hour
  
  const newCode: InsertVerificationCode = {
    userId: user.id,
    code,
    expiresAt,
  };
  
  try {
    await storage.createVerificationCode(newCode);
    
    // If sendEmail is false, just return the code without sending email
    if (!sendEmail || !user.email) {
      return { success: true, code };
    }
    
    // Create email content with Capitulre branding
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://capitulre.com/logo.png" alt="Capitulre" style="max-width: 150px; height: auto;" />
        </div>
        
        <div style="background-color: #1c3d86; color: white; padding: 15px; border-radius: 5px; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">Verify Your Email</h2>
        </div>
        
        <p style="margin-bottom: 15px;">Hello,</p>
        
        <p style="margin-bottom: 15px;">Thank you for joining Capitulre. To complete your registration and access all of our trading features, please verify your email address.</p>
        
        <p style="margin-bottom: 15px;">Your verification code is:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin-bottom: 20px; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
          ${code}
        </div>
        
        <p style="margin-bottom: 15px;">This code will expire in 1 hour. If you did not request this verification, please ignore this email.</p>
        
        <p style="margin-bottom: 20px;">Best regards,<br />The Capitulre Team</p>
        
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eaeaea; color: #888888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Capitulre. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    `;
    
    // Send the email
    const mailOptions = {
      from: 'Capitulre <info@capitulre.com>',
      to: user.email,
      subject: 'Verify Your Email - Capitulre',
      html: emailContent,
    };
    
    if (process.env.NODE_ENV === 'production' && process.env.GMAIL_APP_PASSWORD) {
      // Only send email in production and if we have Gmail credentials
      try {
        const info = await transporter.sendMail(mailOptions);
        log(`Email sent: ${info.messageId}`, 'email');
      } catch (error) {
        log(`Error sending email: ${error}`, 'email');
        // Don't throw, still return the code
      }
    } else {
      // In development, just log the code
      log(`Verification code for ${user.email}: ${code}`, 'email');
    }
    
    return { success: true, code };
  } catch (error) {
    log(`Error creating verification code: ${error}`, 'email');
    return { success: false, code: '' };
  }
};

// Send welcome email after verification
export const sendWelcomeEmail = async (email: string, username: string): Promise<void> => {
  // Create email content with Capitulre branding
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://capitulre.com/logo.png" alt="Capitulre" style="max-width: 150px; height: auto;" />
      </div>
      
      <div style="background-color: #1c3d86; color: white; padding: 15px; border-radius: 5px; text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0;">Welcome to Capitulre!</h2>
      </div>
      
      <p style="margin-bottom: 15px;">Hello ${username},</p>
      
      <p style="margin-bottom: 15px;">Thank you for verifying your email address. Your account is now fully activated, and you can start using all of Capitulre's trading and educational features.</p>
      
      <p style="margin-bottom: 15px;">With your account, you now have access to:</p>
      
      <ul style="margin-bottom: 15px;">
        <li>Professional TradingView charting tools</li>
        <li>$150,000 paper trading account</li>
        <li>Advanced backtesting capabilities</li>
        <li>AI-powered Wyckoff analysis tools</li>
      </ul>
      
      <p style="margin-bottom: 15px;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      
      <p style="margin-bottom: 20px;">Happy trading!<br />The Capitulre Team</p>
      
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eaeaea; color: #888888; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Capitulre. All rights reserved.</p>
        <p>This is an automated message, please do not reply.</p>
      </div>
    </div>
  `;
  
  // Send the email
  const mailOptions = {
    from: 'Capitulre <info@capitulre.com>',
    to: email,
    subject: 'Welcome to Capitulre!',
    html: emailContent,
  };
  
  if (process.env.NODE_ENV === 'production') {
    // Only send email in production
    try {
      const info = await transporter.sendMail(mailOptions);
      log(`Welcome email sent: ${info.messageId}`, 'email');
    } catch (error) {
      log(`Error sending welcome email: ${error}`, 'email');
      // Don't throw an error here, as this is not critical
    }
  } else {
    // In development, just log the content
    log(`Welcome email would be sent to ${email}`, 'email');
  }
};

export default {
  sendVerificationEmail,
  sendWelcomeEmail,
  verifyCode,
  maskEmail,
  markAllCodesAsUsed
};