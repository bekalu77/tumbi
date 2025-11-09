import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createUserSchema, insertUserSchema, insertItemCategorySchema, createCompanySchema, insertItemSchema, Company, InsertCompany, createItemSchema, CreateItem, ItemWithRelations, InsertJob, createJobSchema, insertJobSchema, Job } from "@shared/schema";
import path from "path";
import fs from "fs"; // Re-add fs import
import multer from "multer";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import { randomUUID } from "crypto";
import matter from "gray-matter";
import yaml from "js-yaml";
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'; // Import ListObjectsV2Command
import 'dotenv/config'; // Ensure dotenv is configured

// R2 Configuration
const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
} = process.env;

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '', // Provide default empty string for type safety
    secretAccessKey: R2_SECRET_ACCESS_KEY || '', // Provide default empty string for type safety
  },
});

// Define interfaces for data types used in search (Tender is not in shared/schema.ts)
interface Tender {
  id: string;
  tenderNo: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  publishedOn: string;
  bidClosingDate: string;
  bidOpeningDate: string;
  region: string;
  featured?: boolean;
}

interface SearchProduct {
  id: string;
  name: string;
  company: string | null; // This will be the company name (string)
  category: string; // This is now a string
  price: number;
  unit: string | null;
  imageUrls: string[];
  companyPhone?: string;
  companyEmail?: string;
  description?: string | null;
  isOwner?: boolean;
  userId: string | null;
  companyId: string | null;
  categoryId: string | null;
  createdAt: Date | null;
}

interface SearchJob {
  id: string;
  title: string;
  category: string | null;
  description: string;
  companyId: string | null;
  userId: string | null;
  location: string | null;
  salary: string | null;
  type: string | null;
  position: string | null;
  experience: string | null;
  requiredSkills: string[] | null; // Changed to string[] | null
  qualifications: string | null;
  howToApply: string | null;
  additionalNotes: string | null;
  applicationLink: string | null;
  deadline: Date | null;
  createdAt: Date | null;
}

const MemoryStoreSession = MemoryStore(session);

async function requireAuth(req: Request, res: Response, next: () => void) {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  (req as any).userId = userId;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const r2BaseUrl = process.env.VITE_R2_PUBLIC_URL || ''; // Define R2 base URL

  // Helper function to upload file to R2
  async function uploadFileToR2(fileBuffer: Buffer, filename: string, contentType: string, folder: 'articles' | 'tenders' | 'uploads' = 'uploads'): Promise<string> {
    if (!R2_BUCKET_NAME) {
      throw new Error('R2_BUCKET_NAME is not defined');
    }
    const fileKey = `${folder}/${filename}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: contentType,
      })
    );
    return `${r2BaseUrl}/${fileKey}`;
  }

  // Helper function to get content type
  function getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.gif':
        return 'image/gif';
      case '.webp':
        return 'image/webp';
      case '.svg':
        return 'image/svg+xml';
      case '.md':
        return 'text/markdown';
      default:
        return 'application/octet-stream';
    }
  }

  // Configure session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "ethio-build-mart-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    })
  );

  // Multer configuration for image uploads (using memory storage for direct R2 upload)
  const upload = multer({
    storage: multer.memoryStorage(), // Store files in memory
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    }
  });

  // Create uploads directory (still needed for multer to save files locally before they are uploaded to R2)
  // This block is now redundant as Multer uses memory storage for image uploads.
  // However, it's kept for articleStorage which still uses diskStorage.
  const uploadsDir = path.join(process.cwd(), "data", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const uploadArticle = multer({
    storage: multer.memoryStorage(), // Store files in memory
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file: Express.Multer.File, cb) => { // Explicitly type 'file'
      if (!file.originalname.match(/\.(md)$/)) {
        return cb(new Error('Please upload a Markdown file'));
      }
      cb(null, true);
    },
  });

  const uploadAd = multer({
    storage: multer.memoryStorage(), // Store files in memory
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file: Express.Multer.File, cb) => { // Explicitly type 'file'
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
        return cb(new Error('Please upload a valid image file (jpg, jpeg, png, gif, svg, webp)'));
      }
      cb(null, true);
    },
  });

  // Removed local static file serving for uploads and ad banners, as they will be served from R2.
  // The Cloudflare Worker (VITE_R2_PUBLIC_URL) is expected to handle these requests.

  // ========== AUTH ROUTES ==========
  app.post("/api/register", upload.single("profilePicture"), async (req: Request, res: Response) => {
    try {
      let profilePictureUrl: string | undefined;
      if (req.file) {
        const filename = `profile-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
        profilePictureUrl = await uploadFileToR2(req.file.buffer, filename, req.file.mimetype);
      }

      const parsed = createUserSchema.parse({
        ...req.body,
        profilePictureUrl: profilePictureUrl,
      });
      const existing = await storage.getUserByUsername(parsed.username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const user = await storage.createUser({ ...parsed, id: randomUUID() });
      return res.json({ id: user.id, username: user.username });
    } catch (err: any) {
      console.error("Error during user registration:", err);
      return res.status(400).json({ message: err?.message ?? "Invalid payload" });
    }
  });

  app.put("/api/users/:id", requireAuth, upload.single("profilePicture"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      if (id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let profilePictureUrl: string | undefined;
      if (req.file) {
        const filename = `profile-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
        profilePictureUrl = await uploadFileToR2(req.file.buffer, filename, req.file.mimetype);
      }

      const parsed = insertUserSchema.partial().parse({
        ...req.body,
        profilePictureUrl: profilePictureUrl,
      });

      const updatedUser = await storage.updateUser(id, parsed);
      return res.json(updatedUser);
    } catch (err: any) {
      console.error("Error during user update:", err);
      return res.status(400).json({ message: err?.message ?? "Invalid payload" });
    }
  });

  app.post("/api/login", async (req: Request, res: Response) => {
    const { username, password } = req.body ?? {};
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }
    const user = await storage.getUserByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Store user ID in session
    (req.session as any).userId = user.id;
    
    return res.json({ token: "demo-token", user: { id: user.id, username: user.username } });
  });

  app.post("/api/logout", async (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/me", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.json({ authenticated: false });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.json({ authenticated: false });
    }
    
    return res.json({ 
      authenticated: true, 
      user: { id: user.id, username: user.username, fullName: user.fullName, email: user.email, phone: user.phone, company: user.company, bio: user.bio, location: user.location, profilePictureUrl: user.profilePictureUrl, role: user.role } 
    });
  });

  app.put("/api/users/:id", requireAuth, upload.single("profilePicture"), async (req, res) => {
    try {
      const { id } = req.params;
      if (id !== (req as any).userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      let profilePictureUrl: string | undefined;
      if (req.file) {
        const filename = `profile-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
        profilePictureUrl = await uploadFileToR2(req.file.buffer, filename, req.file.mimetype);
      }

      const parsed = insertUserSchema.partial().parse({
        ...req.body,
        profilePictureUrl: profilePictureUrl,
      });
      const user = await storage.updateUser(id, parsed);
      return res.json(user);
    } catch (err: any) {
      console.error("Error during user update (duplicate route):", err);
      return res.status(400).json({ message: err?.message ?? "Invalid payload" });
    }
  });

  // ========== CATEGORY ROUTES ==========
  app.get("/api/categories", async (_req, res) => {
    try {
      const rows = await storage.listCategories();
      // Filter for both product and service categories
      const categories = rows.filter((c) => !c.parentId && (c.type === "product" || c.type === "service"));
      const subcategories = rows.filter((c) => c.parentId);
      const nestedCategories = categories.map((c) => ({
        ...c,
        subcategories: subcategories.filter((s) => s.parentId === c.id),
      }));
      res.json(nestedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // The /api/categories/products-services endpoint is no longer needed as /api/categories now handles both.
  // Removing it to avoid redundancy.

  // New endpoint for tender categories
  app.get("/api/tender-categories", async (_req, res) => {
    try {
      const rows = await storage.listCategories();
      const tenderCategories = rows.filter((c) => c.type === "tender"); // Filter for tender categories
      res.json(tenderCategories);
    } catch (error) {
      console.error("Error fetching tender categories:", error);
      res.status(500).json({ message: "Failed to fetch tender categories" });
    }
  });

  app.post("/api/categories", requireAuth, async (req, res) => {
    try {
      const payload = insertItemCategorySchema.parse({
        ...req.body,
        userId: (req as any).userId,
      });
      const row = await storage.createCategory(payload);
      res.json(row);
    } catch (e: any) {
      res.status(400).json({ message: e?.message || "Invalid category" });
    }
  });

  // ========== CITY ROUTES ==========
  app.get("/api/cities", async (_req, res) => {
    try {
      const rows = await storage.listCities();
      res.json(rows);
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });

  // ========== COMPANY TYPES ==========
  app.get("/api/company-types", async (_req, res) => {
    try {
      const rows = await storage.listCompanyTypes();
      res.json(rows);
    } catch (error) {
      console.error("Error fetching company types:", error);
      res.status(500).json({ message: "Failed to fetch company types" });
    }
  });


  // ========== PRODUCT ROUTES ==========
  app.get("/api/products", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      let items;

      if (userId) {
        items = await storage.listItemsByUserId(userId);
      } else {
        items = await storage.listItems();
      }

      const response = items.map((item: ItemWithRelations) => ({
        ...item,
        companyName: item.company?.name || 'N/A',
        categoryName: item.category?.category || 'Uncategorized',
        companyPhone: item.company?.phone || '',
        companyEmail: item.company?.email || '',
      }));
      res.json(response);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Create product with image upload
  app.post("/api/products", requireAuth, upload.array("productImages", 3), async (req, res) => {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ message: "At least one product image is required" });
      }

      const parsedPrice = parseFloat(req.body.price || '0');
      if (isNaN(parsedPrice)) {
        return res.status(400).json({ message: "Invalid price format" });
      }

      const uploadedImageUrls: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files as Express.Multer.File[]) {
          const filename = `product-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
          const imageUrl = await uploadFileToR2(file.buffer, filename, file.mimetype);
          uploadedImageUrls.push(imageUrl);
        }
      }

      const itemPayload = {
        name: req.body.name,
        companyId: req.body.companyId,
        userId: (req as any).userId,
        categoryId: req.body.categoryId,
        price: parsedPrice,
        unit: req.body.unit,
        description: req.body.description,
        imageUrls: uploadedImageUrls, // Fixed: Use uploadedImageUrls
      };

      console.log("=== PRODUCT CREATION ===");
      console.log("Authenticated userId:", (req as any).userId);
      console.log("Item Payload before schema parse:", itemPayload);
      const payload = createItemSchema.parse(itemPayload); // Use createItemSchema
      console.log("Payload after schema parse:", payload);

      const product = await storage.createItem({ ...payload, id: randomUUID() }); // Add ID here
      res.status(201).json(product);
    } catch (error: any) {
      console.error("Error creating product:", error); // More specific error logging
      res.status(400).json({ message: error?.message || "Failed to create product" });
    }
  });

  // Update product with image upload
  app.put("/api/products/:id", requireAuth, upload.array("productImages", 3), async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      const existingProduct = await storage.getItem(id); // Use getItem to fetch the product
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      const user = await storage.getUser(userId);
      if (existingProduct.userId !== userId && user?.username !== "admin77") {
        return res.status(403).json({ message: "Forbidden: You can only update your own products" });
      }

      // Parse existing image URLs from the request body
      let imageUrlsToRetain: string[] = [];
      if (req.body.existingImageUrls) {
        try {
          imageUrlsToRetain = JSON.parse(req.body.existingImageUrls);
          if (!Array.isArray(imageUrlsToRetain)) {
            throw new Error("existingImageUrls must be a JSON array string.");
          }
        } catch (e) {
          return res.status(400).json({ message: "Invalid format for existingImageUrls" });
        }
      }

      // Get new image URLs from uploaded files
      const newImageUrls: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files as Express.Multer.File[]) {
          const filename = `product-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
          const imageUrl = await uploadFileToR2(file.buffer, filename, file.mimetype);
          newImageUrls.push(imageUrl);
        }
      }

      // Combine existing and new image URLs
      const combinedImageUrls = [...imageUrlsToRetain, ...newImageUrls];

      if (combinedImageUrls.length === 0) {
        return res.status(400).json({ message: "At least one product image is required" });
      }
      if (combinedImageUrls.length > 3) {
        return res.status(400).json({ message: "You can upload a maximum of 3 images (including existing ones)." });
      }

      const parsedPrice = parseFloat(req.body.price || '0');
      if (isNaN(parsedPrice)) {
        return res.status(400).json({ message: "Invalid price format" });
      }

      const itemPayload = {
        name: req.body.name,
        companyId: req.body.companyId,
        userId: userId, // Ensure userId is from auth
        categoryId: req.body.categoryId,
        price: parsedPrice,
        unit: req.body.unit,
        description: req.body.description,
        imageUrls: combinedImageUrls, // Pass as array
      };

      const payload = insertItemSchema.partial().parse(itemPayload); // Use partial for updates
      const updatedProduct = await storage.updateItem(id, payload);
      res.json(updatedProduct);
    } catch (error: any) {
      res.status(400).json({ message: error?.message || "Failed to update product" });
    }
  });

  // Delete product
  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      const existingProduct = await storage.getItem(id);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      const user = await storage.getUser(userId);
      if (existingProduct.userId !== userId && user?.username !== "admin77") {
        return res.status(403).json({ message: "Forbidden: You can only delete your own products" });
      }

      await storage.deleteItem(id);
      res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error?.message || "Failed to delete product" });
    }
  });

  // ========== COMPANY ROUTES ==========
  // Get all companies
  app.get("/api/companies", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      if (userId) {
        const rows = await storage.listCompaniesByUserId(userId);
        return res.json(rows);
      }
      const rows = await storage.listCompanies();
      res.json(rows);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  // Get single company
  app.get("/api/companies/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  // Get products by company
  app.get("/api/companies/:id/products", async (req, res) => {
    try {
      const { id } = req.params;
      const products = await storage.listItemsByCompany(id);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products for company:", error);
      res.status(500).json({ message: "Failed to fetch products for company" });
    }
  });

  // Create company with logo upload - SIMPLIFIED VERSION
// Create company with logo upload - FIXED VERSION
app.post("/api/companies", requireAuth, upload.single("companyLogo"), async (req, res) => {
  try {
    console.log("=== COMPANY CREATION ===");
    console.log("Authenticated userId:", (req as any).userId);
    console.log("Request body:", req.body);

    let logoUrl: string | undefined;
    if (req.file) {
      const filename = `company-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
      logoUrl = await uploadFileToR2(req.file.buffer, filename, req.file.mimetype);
    }

    const payload = createCompanySchema.parse({
      ...req.body,
      userId: (req as any).userId,
      logoUrl: logoUrl,
      typeId: req.body.typeId, // Include typeId
      companyType: req.body.companyType, // Include companyType
    });

    console.log("Company payload after schema parse:", payload);

    const company = await storage.createCompany({ ...payload, id: randomUUID() });
    res.status(201).json(company);
  } catch (error: any) {
    res.status(400).json({ message: error?.message || "Failed to create company" });
  }
});

  // Update company with optional logo upload
  app.put("/api/companies/:id", requireAuth, upload.single("companyLogo"), async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;
      
      console.log("=== COMPANY UPDATE REQUEST ===");
      console.log("Company ID:", id);
      console.log("Uploaded file:", req.file);
      console.log("Request body:", req.body);

      // Check if company exists
      const existingCompany = await storage.getCompany(id);
      if (!existingCompany) {
        return res.status(404).json({ message: "Company not found" });
      }

      const user = await storage.getUser(userId);
      if (existingCompany.userId !== userId && user?.username !== "admin77") {
        return res.status(403).json({ message: "Forbidden: You can only update your own companies" });
      }

      // Prepare update payload
      const updatePayload: Partial<InsertCompany> = { // Use Partial<InsertCompany> for type safety
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        description: req.body.description,
        location: req.body.location,
        typeId: req.body.typeId, // Include typeId
        companyType: req.body.companyType, // Also include companyType
      };

      // Remove undefined values from payload to avoid overwriting with null
      Object.keys(updatePayload).forEach(key => {
        if (updatePayload[key as keyof typeof updatePayload] === undefined) {
          delete updatePayload[key as keyof typeof updatePayload];
        }
      });

      // Add logo URL if new logo was uploaded
      if (req.file) {
        const filename = `company-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
        updatePayload.logoUrl = await uploadFileToR2(req.file.buffer, filename, req.file.mimetype);
      }

      console.log("Company update payload:", updatePayload);

      // Update company
      const updatedCompany = await storage.updateCompany(id, updatePayload as any); // Cast to any to satisfy storage.updateCompany signature if it's not typed to accept Partial<Company>
      console.log("✅ Company updated successfully:", id);
      
      res.json(updatedCompany);

    } catch (error: any) {
      console.error("Error updating company:", error);
      res.status(400).json({ 
        message: error?.message || "Failed to update company" 
      });
    }
  });

  // Delete company
  app.delete("/api/companies/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      const existingCompany = await storage.getCompany(id);
      if (!existingCompany) {
        return res.status(404).json({ message: "Company not found" });
      }

      const user = await storage.getUser(userId);
      if (existingCompany.userId !== userId && user?.username !== "admin77") {
        return res.status(403).json({ message: "Forbidden: You can only delete your own companies" });
      }

      await storage.deleteCompany(id);
      console.log("✅ Company deleted successfully:", id);

      res.json({ message: "Company deleted successfully" });

    } catch (error: any) {
      console.error("Error deleting company:", error);
      res.status(500).json({
        message: error?.message || "Failed to delete company"
      });
    }
  });

  // ========== JOB ROUTES ==========
  app.get("/api/jobs", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      let jobs;

      if (userId) {
        jobs = await storage.listJobsByUserId(userId);
      } else {
        jobs = await storage.listJobs();
      }
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const job = await storage.getJob(id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.post("/api/jobs", requireAuth, async (req, res) => {
    try {
      console.log("=== JOB CREATION ===");
      console.log("Authenticated userId:", (req as any).userId);
      console.log("Request body:", req.body);

      const payload = createJobSchema.parse({
        ...req.body,
        userId: (req as any).userId,
      });
      const job = await storage.createJob({ ...payload, id: randomUUID() });
      res.status(201).json(job);
    } catch (error: any) {
      console.error("Error creating job:", error);
      res.status(400).json({ message: error?.message || "Failed to create job" });
    }
  });

  app.put("/api/jobs/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      console.log("=== JOB UPDATE ===");
      console.log("Authenticated userId:", userId);
      console.log("Job ID:", id);
      console.log("Request body:", req.body);

      const existingJob = await storage.getJob(id);
      if (!existingJob) {
        return res.status(404).json({ message: "Job not found" });
      }

      const user = await storage.getUser(userId);
      if (existingJob.userId !== userId && user?.username !== "admin77") {
        return res.status(403).json({ message: "Forbidden: You can only update your own jobs" });
      }

      const payload = insertJobSchema.partial().parse(req.body);
      const updatedJob = await storage.updateJob(id, payload);
      res.json(updatedJob);
    } catch (error: any) {
      console.error("Error updating job:", error);
      res.status(400).json({ message: error?.message || "Failed to update job" });
    }
  });

  app.delete("/api/jobs/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      const existingJob = await storage.getJob(id);
      if (!existingJob) {
        return res.status(404).json({ message: "Job not found" });
      }

      const user = await storage.getUser(userId);
      if (existingJob.userId !== userId && user?.username !== "admin77") {
        return res.status(403).json({ message: "Forbidden: You can only delete your own jobs" });
      }

      await storage.deleteJob(id);
      res.json({ message: "Job deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: error?.message || "Failed to delete job" });
    }
  });

  // ========== ARTICLE ROUTES ==========
  app.get("/api/articles/filenames", async (_req, res) => {
    try {
      if (!R2_BUCKET_NAME) {
        throw new Error('R2_BUCKET_NAME is not defined');
      }

      const listObjectsResponse = await s3.send(new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: 'articles/',
      }));

      const files = listObjectsResponse.Contents?.map(obj => obj.Key?.replace('articles/', '')) || [];
      res.json(files);
    } catch (error) {
      console.error("Error fetching article filenames:", error);
      res.status(500).json({ message: "Failed to fetch article filenames" });
    }
  });

  // New endpoint to get raw content of a specific article markdown file from R2
  app.get("/api/articles/content/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const fileKey = `articles/${filename}`;

      if (!R2_BUCKET_NAME) {
        throw new Error('R2_BUCKET_NAME is not defined');
      }

      const object = await s3.send(new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
      }));

      if (!object.Body) {
        return res.status(404).json({ message: "Article file not found" });
      }

      const fileContent = await object.Body.transformToString('utf-8');
      res.setHeader('Content-Type', 'text/plain');
      res.send(fileContent);
    } catch (error) {
      console.error(`Error fetching article content for ${req.params.filename}:`, error);
      res.status(500).json({ message: "Failed to fetch article content" });
    }
  });

  app.post("/api/articles", requireAuth, async (req, res) => {
    try {
      const { filename, content } = req.body;

      if (!filename || !content) {
        return res.status(400).json({ message: "Filename and content are required" });
      }

      const fileBuffer = Buffer.from(content, 'utf-8');
      const articleUrl = await uploadFileToR2(fileBuffer, filename, 'text/markdown', 'articles');

      res.status(201).json({ message: "Article created successfully", url: articleUrl });
    } catch (error: any) {
      console.error("Error creating article:", error);
      res.status(500).json({ message: error?.message || "Failed to create article" });
    }
  });

  app.post("/api/articles/upload", requireAuth, uploadArticle.single("article"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
      }

      const filename = `article-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
      const articleUrl = await uploadFileToR2(req.file.buffer, filename, req.file.mimetype, 'articles');

      res.status(200).json({ message: "Article uploaded successfully.", url: articleUrl });
    } catch (error: any) {
      console.error("Error uploading article:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ========== AD ROUTES ==========
  app.get("/api/ads/markdown", async (req, res) => {
    try {
      const fileKey = `ad/ads.md`; // Corrected path for ads.md in R2

      if (!R2_BUCKET_NAME) {
        throw new Error('R2_BUCKET_NAME is not defined');
      }

      const object = await s3.send(new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
      }));

      if (!object.Body) {
        return res.json([]);
      }

      const fileContent = await object.Body.transformToString('utf-8');
      const ads = yaml.load(fileContent) as any[];
      res.json(ads || []);
    } catch (error) {
      console.error("Error fetching ads from markdown:", error);
      res.status(500).json({ message: "Failed to fetch ads" });
    }
  });

  app.post("/api/ads", requireAuth, uploadAd.single("banner"), async (req, res) => {
    try {
      const { title, link } = req.body;
      const banner = req.file;

      if (!title || !link || !banner) {
        return res.status(400).json({ error: "Title, link, and banner are required." });
      }

      const filename = `banner-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(banner.originalname)}`;
      const bannerPath = await uploadFileToR2(banner.buffer, filename, banner.mimetype, 'ad/banner' as any);

      const newAd = {
        id: randomUUID(),
        title,
        link,
        banner: bannerPath,
        status: 'on' // Default status
      };

      let ads = [];
      const fileKey = 'ad/ads.md';

      try {
        const object = await s3.send(new GetObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: fileKey,
        }));
        if (object.Body) {
          const fileContent = await object.Body.transformToString('utf-8');
          ads = yaml.load(fileContent) as any[] || [];
        }
      } catch (error) {
        // If the file doesn't exist, we'll create it.
        console.log("ads.md not found in R2, creating a new one.");
      }

      ads.push(newAd);
      const newContent = yaml.dump(ads);

      await s3.send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
        Body: newContent,
        ContentType: 'text/markdown',
      }));

      res.status(201).json({ message: "Ad created successfully." });
    } catch (error: any) {
      console.error("Error creating ad:", error);
      res.status(500).json({ error: error.message || "An unknown error occurred" });
    }
  });

  app.put("/api/ads/:id/status", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || (status !== "on" && status !== "off")) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const fileKey = 'ad/ads.md';
      const object = await s3.send(new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
      }));

      if (!object.Body) {
        return res.status(404).json({ error: "Ad file not found." });
      }

      const fileContent = await object.Body.transformToString('utf-8');
      const ads = yaml.load(fileContent) as any[];

      const adIndex = ads.findIndex(ad => ad.id === id);
      if (adIndex === -1) {
        return res.status(404).json({ error: "Ad not found." });
      }

      ads[adIndex].status = status;

      const newContent = yaml.dump(ads);
      await s3.send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
        Body: newContent,
        ContentType: 'text/markdown',
      }));

      res.json(ads[adIndex]);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || "Failed to update ad status" });
    }
  });

  app.put("/api/ads/:id", requireAuth, uploadAd.single("banner"), async (req, res) => {
    try {
      const { id } = req.params;
      const { title, link } = req.body;
      const banner = req.file;

      const fileKey = 'ad/ads.md';
      const object = await s3.send(new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
      }));

      if (!object.Body) {
        return res.status(404).json({ error: "Ad file not found." });
      }

      const fileContent = await object.Body.transformToString('utf-8');
      const ads = yaml.load(fileContent) as any[];

      const adIndex = ads.findIndex(ad => ad.id === id);
      if (adIndex === -1) {
        return res.status(404).json({ error: "Ad not found." });
      }

      ads[adIndex].title = title;
      ads[adIndex].link = link;
      if (banner) {
        const filename = `banner-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(banner.originalname)}`;
        ads[adIndex].banner = await uploadFileToR2(banner.buffer, filename, banner.mimetype, 'ad/banner' as any);
      }

      const newContent = yaml.dump(ads);
      await s3.send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
        Body: newContent,
        ContentType: 'text/markdown',
      }));

      res.status(200).json({ message: "Ad updated successfully." });
    } catch (error: any) {
      console.error("Error updating ad:", error);
      res.status(500).json({ error: error.message || "An unknown error occurred" });
    }
  });

  app.delete("/api/ads/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "Ad ID is required." });
      }

      const fileKey = 'ad/ads.md';
      const object = await s3.send(new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
      }));

      if (!object.Body) {
        return res.status(404).json({ error: "Ad file not found." });
      }

      const fileContent = await object.Body.transformToString('utf-8');
      const ads = yaml.load(fileContent) as any[];

      const updatedAds = ads.filter(ad => ad.id !== id);

      if (ads.length === updatedAds.length) {
        return res.status(404).json({ error: "Ad not found." });
      }

      const newContent = yaml.dump(updatedAds);
      await s3.send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
        Body: newContent,
        ContentType: 'text/markdown',
      }));

      res.status(200).json({ message: "Ad deleted successfully." });
    } catch (error: any) {
      console.error("Error deleting ad:", error);
      res.status(500).json({ error: error.message || "An unknown error occurred" });
    }
  });

  // ========== SEARCH ROUTE ==========
  app.get("/api/search", async (req, res) => {
    try {
      const query = (req.query.query as string || "").toLowerCase();
      const typesParam = (req.query.types as string || "products,companies,tenders,jobs,articles").toLowerCase(); // Added jobs and articles to default search types
      const requestedTypes = typesParam.split(',').map(type => type.trim());
      const page = parseInt(req.query.page as string || "1");
      const limit = parseInt(req.query.limit as string || "16");
      const offset = (page - 1) * limit;

      const results: { products?: SearchProduct[]; companies?: Company[]; tenders?: Tender[]; jobs?: SearchJob[]; articles?: any[] } = {}; // Added jobs and articles to results type

      if (requestedTypes.includes("products")) {
        const productsData = await storage.searchItems(query, limit, offset);
        const filteredProducts = productsData.map((p: ItemWithRelations) => ({
          id: p.id,
          name: p.name,
          company: p.company?.name || null, // Mapped to company name (string)
          category: p.category?.category || 'Uncategorized',
          price: Number(p.price),
          unit: p.unit,
          imageUrls: p.imageUrls || [],
          companyPhone: p.company?.phone || '',
          companyEmail: p.company?.email || '',
          description: p.description,
          isOwner: false,
          userId: p.userId,
          companyId: p.companyId,
          categoryId: p.categoryId,
          createdAt: p.createdAt,
        }));
        results.products = filteredProducts;
      }

      if (requestedTypes.includes("companies")) {
        const companiesData = await storage.searchCompanies(query);
        const filteredCompanies = companiesData.map((c: Company) => ({
          id: c.id,
          name: c.name,
          description: c.description || "",
          location: c.location || "",
          companyType: c.companyType || "General",
          logoUrl: c.logoUrl,
          isVerified: c.isVerified || false,
          email: c.email,
          phone: c.phone,
          userId: c.userId,
          typeId: c.typeId,
          address: c.address,
          website: c.website,
          createdAt: c.createdAt,
        }));
        results.companies = filteredCompanies;
      }

      if (requestedTypes.includes("tenders")) {
        if (!R2_BUCKET_NAME) {
          results.tenders = [];
        } else {
          const listObjectsResponse = await s3.send(new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
            Prefix: 'tenders/',
          }));

          const tenderPromises = (listObjectsResponse.Contents || []).map(async (obj) => {
            if (!obj.Key) return null;
            try {
              const object = await s3.send(new GetObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: obj.Key,
              }));
              if (!object.Body) return null;

              const fileContent = await object.Body.transformToString('utf-8');
              const { data, content } = matter(fileContent);
              const firstParagraphMatch = content.match(/\n\n([^\n]+)/);
              const excerpt = firstParagraphMatch && firstParagraphMatch[1].trim() ? firstParagraphMatch[1].trim().substring(0, 150) + '...' : 'Click to view full tender document.';
              const filename = obj.Key.replace('tenders/', '');

              return {
                id: filename.replace(/\.md$/, ''),
                tenderNo: data.tender_no || 0,
                title: data.closing || 'Untitled Tender',
                slug: data.opening || filename.replace(/\.md$/, ''),
                excerpt: excerpt,
                content: content,
                category: data.category || 'General',
                publishedOn: data.published || 'N/A',
                bidClosingDate: data.closing || 'N/A',
                bidOpeningDate: data.opening || 'N/A',
                region: data.region || 'N/A',
                featured: data.featured || false,
              } as Tender;
            } catch (e) {
              console.error(`Error processing tender file ${obj.Key}:`, e);
              return null;
            }
          });

          const tendersData = (await Promise.all(tenderPromises)).filter((t): t is Tender => t !== null);

          const filteredTenders = tendersData.filter((t: any) => {
            const searchableText = `${t.title} ${t.category || ''} ${t.excerpt || ''} ${t.content || ''} ${t.region || ''} ${t.bidClosingDate || ''} ${t.bidOpeningDate || ''}`.toLowerCase();
            return searchableText.includes(query);
          });
          results.tenders = filteredTenders;
        }
      }

      if (requestedTypes.includes("jobs")) {
        const jobsData = await storage.searchJobs(query);
        const filteredJobs = jobsData.map((j: Job) => ({
          id: j.id,
          title: j.title,
          category: j.category || null,
          description: j.description,
          companyId: j.companyId || null,
          userId: j.userId || null,
          location: j.location || null,
          salary: j.salary || null,
          type: j.type || null,
          position: j.position || null,
          experience: j.experience || null,
          requiredSkills: j.requiredSkills || null,
          qualifications: j.qualifications || null,
          howToApply: j.howToApply || null,
          additionalNotes: j.additionalNotes || null,
          applicationLink: j.applicationLink || null,
          deadline: j.deadline || null,
          createdAt: j.createdAt || null,
        }));
        results.jobs = filteredJobs;
      }

      if (requestedTypes.includes("articles")) {
        if (!R2_BUCKET_NAME) {
          results.articles = [];
        } else {
          const listObjectsResponse = await s3.send(new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
            Prefix: 'articles/',
          }));

          const articlePromises = (listObjectsResponse.Contents || []).map(async (obj) => {
            if (!obj.Key) return null;
            try {
              const object = await s3.send(new GetObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: obj.Key,
              }));
              if (!object.Body) return null;

              const fileContent = await object.Body.transformToString('utf-8');
              const { data, content } = matter(fileContent);
              const firstParagraphMatch = content.match(/\n\n([^\n]+)/);
              const excerpt = firstParagraphMatch && firstParagraphMatch[1].trim() ? firstParagraphMatch[1].trim().substring(0, 150) + '...' : 'Click to view full article.';
              const filename = obj.Key.replace('articles/', '');

              return {
                id: filename.replace(/\.md$/, ''),
                title: data.title || 'Untitled Article',
                slug: data.slug || filename.replace(/\.md$/, ''),
                excerpt: excerpt,
                content: content,
                category: data.category || 'General',
                published_date: data.published_date || 'N/A',
                author: data.author || 'Admin',
                fileType: 'md',
                image: data.image || undefined,
                read_time: data.read_time || undefined,
                featured: data.featured || false,
                views: data.views || 0,
              };
            } catch (e) {
              console.error(`Error processing article file ${obj.Key}:`, e);
              return null;
            }
          });

          const articlesData = (await Promise.all(articlePromises)).filter(a => a !== null);

          const filteredArticles = articlesData.filter((a: any) => {
            const searchableText = `${a.title} ${a.category || ''} ${a.excerpt || ''} ${a.content || ''} ${a.author || ''}`.toLowerCase();
            return searchableText.includes(query);
          });
          results.articles = filteredArticles;
        }
      }

      res.json(results);

    } catch (error) {
      console.error("Error fetching search results:", error);
      res.status(500).json({ message: "Failed to fetch search results" });
    }
  });

  // New endpoint to list tender markdown filenames from R2
  app.get("/api/tenders/filenames", async (_req, res) => {
    try {
      if (!R2_BUCKET_NAME) {
        throw new Error('R2_BUCKET_NAME is not defined');
      }

      const listObjectsResponse = await s3.send(new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: 'tenders/',
      }));

      const files = listObjectsResponse.Contents?.map(obj => obj.Key?.replace('tenders/', '')) || [];
      res.json(files);
    } catch (error) {
      console.error("Error fetching tender filenames:", error);
      res.status(500).json({ message: "Failed to fetch tender filenames" });
    }
  });

  // New endpoint to get raw content of a specific tender markdown file from R2
  app.get("/api/tenders/content/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const fileKey = `tenders/${filename}`;

      if (!R2_BUCKET_NAME) {
        throw new Error('R2_BUCKET_NAME is not defined');
      }

      const object = await s3.send(new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
      }));

      if (!object.Body) {
        return res.status(404).json({ message: "Tender file not found" });
      }

      const fileContent = await object.Body.transformToString('utf-8');
      res.setHeader('Content-Type', 'text/plain');
      res.send(fileContent);
    } catch (error) {
      console.error(`Error fetching tender content for ${req.params.filename}:`, error);
      res.status(500).json({ message: "Failed to fetch tender content" });
    }
  });

  app.post("/api/tenders", requireAuth, async (req, res) => {
    try {
      const { filename, content } = req.body;

      if (!filename || !content) {
        return res.status(400).json({ message: "Filename and content are required" });
      }

      const fileBuffer = Buffer.from(content, 'utf-8');
      const tenderUrl = await uploadFileToR2(fileBuffer, filename, 'text/markdown', 'tenders');

      res.status(201).json({ message: "Tender created successfully", url: tenderUrl });
    } catch (error: any) {
      console.error("Error creating tender:", error);
      res.status(500).json({ message: error?.message || "Failed to create tender" });
    }
  });

  // ========== SEED ROUTE ==========
  app.post("/api/seed", async (_req, res) => {
    try {
      // Simple seed function
      const existingProducts = await storage.listItems();
      if (existingProducts.length > 0) {
        return res.json({ message: "Already seeded" });
      }

      // Create a demo user for seeding
      let demoUser = await storage.getUserByUsername("demo");
      if (!demoUser) {
        demoUser = await storage.createUser({ id: "demo-user-id", username: "demo", password: "demo123" });
      }

      // Create categories
      const productCategories = ["Cement", "Steel", "Wood", "Tiles", "Paint", "Other"];
      for (const name of productCategories) {
        await storage.createCategory({ id: `category-${name.toLowerCase()}`, category: name, type: "product" });
      }

      // Create company types
      const companyTypes = ["Supplier", "Manufacturer", "Wholesaler", "Renter", "Service Provider"];
      const createdCompanyTypes = [];
      for (const name of companyTypes) {
        const newType = await storage.createCompanyType({ id: `company-type-${name.toLowerCase().replace(/\s/g, '-')}`, name: name });
        createdCompanyTypes.push(newType);
      }

      // Create companies linked to demo user
      const companies = [
        { name: "Derba Midroc Cement", email: "contact@derba.com", phone: "+251 11 123 4567", location: "Addis Ababa", description: "Leading cement producer in Ethiopia.", logoUrl: `${r2BaseUrl}/uploads/company-placeholder-1.jpg`, userId: demoUser.id, typeId: createdCompanyTypes[0].id, companyType: createdCompanyTypes[0].name },
        { name: "Ethiopian Steel", email: "info@ethsteel.com", phone: "+251 25 111 2233", location: "Adama", description: "Major steel manufacturer.", logoUrl: `${r2BaseUrl}/uploads/company-placeholder-2.jpg`, userId: demoUser.id, typeId: createdCompanyTypes[1].id, companyType: createdCompanyTypes[1].name },
        { name: "Addis Tiles", email: "sales@addistiles.com", phone: "+251 11 555 6677", location: "Addis Ababa", description: "High-quality ceramic tiles.", logoUrl: `${r2BaseUrl}/uploads/company-placeholder-3.jpg`, userId: demoUser.id, typeId: createdCompanyTypes[0].id, companyType: createdCompanyTypes[0].name },
        { name: "Forest Products", email: "info@forestproducts.com", phone: "+251 11 888 9900", location: "Oromia", description: "Supplier of wood and related products.", logoUrl: `${r2BaseUrl}/uploads/company-placeholder-4.jpg`, userId: demoUser.id, typeId: createdCompanyTypes[0].id, companyType: createdCompanyTypes[0].name },
      ];
      for (const company of companies) {
        await storage.createCompany(company as any);
      }

      res.json({ ok: true, message: "Database seeded successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error?.message || "Seed failed" });
    }
  });

  app.get("/api/health", (_req, res) => {
    res.status(200).send("OK");
  });

  const httpServer = createServer(app);
  return httpServer;
}
