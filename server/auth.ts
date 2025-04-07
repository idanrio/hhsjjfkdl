import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SchemaUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import type { IncomingMessage } from 'http';

// Define the shape of our user in Express session
// This avoids the recursive type reference issues
interface AuthUser {
  id: number;
  username: string;
  email: string | null;
  isAdmin: boolean;
  level: number;
  bio: string | null;
  riskTolerance: string | null;
  expiryDate: Date | null;
  password?: string; // Only included internally, never sent to client
}

declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}

const scryptAsync = promisify(scrypt);
const PostgresSessionStore = connectPg(session);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionStore = new PostgresSessionStore({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'capitulre-secret-key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === 'production'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          // Transform schema user to auth user
          const authUser: AuthUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            // Ensure isAdmin is always boolean
            isAdmin: user.isAdmin === true ? true : false,
            level: user.level || 1,
            bio: user.bio,
            riskTolerance: user.riskTolerance,
            expiryDate: user.expiryDate, 
            password: user.password // Keep password for now, will be removed before sending to client
          };
          return done(null, authUser);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      
      // Transform schema user to auth user
      const authUser: AuthUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        // Ensure isAdmin is always boolean
        isAdmin: user.isAdmin === true ? true : false,
        level: user.level || 1,
        bio: user.bio,
        riskTolerance: user.riskTolerance,
        expiryDate: user.expiryDate,
        password: user.password // Keep password for internal use
      };
      
      done(null, authUser);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      // Create new user with hashed password
      const schemaUser = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });
      
      // Transform to AuthUser
      const user: AuthUser = {
        id: schemaUser.id,
        username: schemaUser.username,
        email: schemaUser.email,
        isAdmin: schemaUser.isAdmin === true ? true : false,
        level: schemaUser.level || 1,
        bio: schemaUser.bio,
        riskTolerance: schemaUser.riskTolerance,
        expiryDate: schemaUser.expiryDate, 
        password: schemaUser.password
      };

      // Create paper trading account with $150,000 balance
      try {
        // Check if account already exists
        const existingAccount = await storage.getPaperTradingAccount(user.id);
        
        // Only create paper trading account if it doesn't exist
        if (!existingAccount) {
          await storage.createPaperTradingAccount({
            userId: user.id,
            balance: "150000",
            equity: "150000",
            availableMargin: "150000",
            usedMargin: "0",
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      } catch (error) {
        console.error("Warning: Could not create paper trading account:", error);
        // Continue registration even if paper trading account creation fails
      }

      // Log user in automatically after registration
      req.login(user, (err) => {
        if (err) return next(err);
        // Don't send password back to client
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: Error, user: AuthUser) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        // Don't send password back to client
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    // Don't send password back to client
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Create initial admin account if needed
  createAdminAccount();
}

async function createAdminAccount() {
  try {
    const adminEmail = 'idanfunnel@gmail.com';
    const adminUsername = 'idanfunnel';
    const adminPassword = 'idan0505742326';

    // Check if admin already exists
    const existingAdmin = await storage.getUserByUsername(adminUsername);
    if (existingAdmin) {
      console.log('Admin account already exists');
      return;
    }

    // Create admin user
    const adminSchemaUser = await storage.createUser({
      username: adminUsername,
      password: await hashPassword(adminPassword),
      email: adminEmail,
      isAdmin: true
    });
    
    // Transform to AuthUser for login
    const adminUser: AuthUser = {
      id: adminSchemaUser.id,
      username: adminSchemaUser.username,
      email: adminSchemaUser.email,
      isAdmin: true,
      level: adminSchemaUser.level || 1,
      bio: adminSchemaUser.bio,
      riskTolerance: adminSchemaUser.riskTolerance,
      expiryDate: adminSchemaUser.expiryDate
    };

    // Create paper trading account for admin
    await storage.createPaperTradingAccount({
      userId: adminUser.id,
      balance: "150000",
      equity: "150000",
      availableMargin: "150000",
      usedMargin: "0",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Admin account created successfully');
  } catch (error) {
    console.error('Failed to create admin account:', error);
  }
}