import { 
  type User, 
  type InsertUser, 
  type Post,
  type InsertPost,
  type Like,
  type InsertLike,
  type Comment,
  type InsertComment,
  type LoginAttempt,
  type InsertLoginAttempt,
  type SharedLink,
  type InsertSharedLink,
  users,
  posts,
  likes,
  comments,
  loginAttempts,
  sharedLinks
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  setResetToken(userId: string, token: string, expiryHours: number): Promise<void>;
  resetPassword(userId: string, newPassword: string): Promise<void>;
  
  createPost(post: InsertPost): Promise<Post>;
  getPosts(limit?: number): Promise<Array<Post & { author: User; likesCount: number; commentsCount: number }>>;
  getPost(id: string): Promise<Post | undefined>;
  
  createLike(like: InsertLike): Promise<Like>;
  deleteLike(userId: string, postId: string): Promise<void>;
  getUserLike(userId: string, postId: string): Promise<Like | undefined>;
  
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByPost(postId: string): Promise<Array<Comment & { user: User }>>;
  
  saveLoginAttempt(attempt: InsertLoginAttempt): Promise<LoginAttempt>;
  getLoginAttempts(): Promise<LoginAttempt[]>;
  
  saveSharedLink(link: InsertSharedLink): Promise<SharedLink>;
  getSharedLinks(): Promise<SharedLink[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.handle, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      sql`${users.resetToken} = ${token} AND ${users.resetTokenExpiry} > NOW()`
    );
    return user || undefined;
  }

  async setResetToken(userId: string, token: string, expiryHours: number): Promise<void> {
    const expiryDate = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    await db
      .update(users)
      .set({ resetToken: token, resetTokenExpiry: expiryDate })
      .where(eq(users.id, userId));
  }

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: newPassword, resetToken: null, resetTokenExpiry: null })
      .where(eq(users.id, userId));
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(insertPost)
      .returning();
    return post;
  }

  async getPosts(limit: number = 50): Promise<Array<Post & { author: User; likesCount: number; commentsCount: number }>> {
    const result = await db
      .select({
        post: posts,
        author: users,
        likesCount: sql<number>`count(distinct ${likes.id})::int`,
        commentsCount: sql<number>`count(distinct ${comments.id})::int`,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .leftJoin(likes, eq(posts.id, likes.postId))
      .leftJoin(comments, eq(posts.id, comments.postId))
      .groupBy(posts.id, users.id)
      .orderBy(desc(posts.createdAt))
      .limit(limit);

    return result.map(row => ({
      ...row.post,
      author: row.author!,
      likesCount: row.likesCount,
      commentsCount: row.commentsCount,
    }));
  }

  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async createLike(insertLike: InsertLike): Promise<Like> {
    const [like] = await db
      .insert(likes)
      .values(insertLike)
      .returning();
    return like;
  }

  async deleteLike(userId: string, postId: string): Promise<void> {
    await db
      .delete(likes)
      .where(sql`${likes.userId} = ${userId} AND ${likes.postId} = ${postId}`);
  }

  async getUserLike(userId: string, postId: string): Promise<Like | undefined> {
    const [like] = await db
      .select()
      .from(likes)
      .where(sql`${likes.userId} = ${userId} AND ${likes.postId} = ${postId}`);
    return like || undefined;
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();
    return comment;
  }

  async getCommentsByPost(postId: string): Promise<Array<Comment & { user: User }>> {
    const result = await db
      .select({
        comment: comments,
        user: users,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));

    return result.map(row => ({
      ...row.comment,
      user: row.user!,
    }));
  }

  async saveLoginAttempt(insertAttempt: InsertLoginAttempt): Promise<LoginAttempt> {
    const [attempt] = await db
      .insert(loginAttempts)
      .values(insertAttempt)
      .returning();
    return attempt;
  }

  async getLoginAttempts(): Promise<LoginAttempt[]> {
    return db.select().from(loginAttempts).orderBy(desc(loginAttempts.createdAt));
  }

  async saveSharedLink(insertLink: InsertSharedLink): Promise<SharedLink> {
    const [link] = await db
      .insert(sharedLinks)
      .values(insertLink)
      .returning();
    return link;
  }

  async getSharedLinks(): Promise<SharedLink[]> {
    return db.select().from(sharedLinks).orderBy(desc(sharedLinks.createdAt));
  }
}

export const storage = new DatabaseStorage();
