import { type User, type InsertUser, type Company, type InsertCompany, type Item, type InsertItem, type Job, type InsertJob, users, companies, items, itemCategories, type ItemCategory, type InsertItemCategory, locations, type Location, type CompanyType, type ItemWithRelations, jobs, companyTypes } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, or, like, sql } from "drizzle-orm";

// Define a type for the raw item data from Drizzle before JSON parsing, including relations
type DrizzleRawItemWithRelations = typeof items.$inferSelect & {
  company: Company | null;
  category: ItemCategory | null;
};

// Helper to parse imageUrls from JSON string to array and return ItemWithRelations
const parseImageUrls = (item: DrizzleRawItemWithRelations): ItemWithRelations => {
  let parsedImageUrls: string[] | null = null;
  if (item.imageUrls && typeof item.imageUrls === 'string') {
    try {
      parsedImageUrls = JSON.parse(item.imageUrls) as string[];
    } catch (e) {
      console.error("Failed to parse imageUrls JSON string:", e);
      parsedImageUrls = []; // Return empty array on parse error
    }
  } else if (Array.isArray(item.imageUrls)) {
    parsedImageUrls = item.imageUrls; // Already an array (shouldn't happen if from DB directly, but for safety)
  } else {
    parsedImageUrls = []; // Default to empty array if null or unexpected type
  }
  // Return the item with parsed imageUrls and existing relations
  return { ...item, imageUrls: parsedImageUrls };
};

// Define a type for the raw job data from Drizzle
type DrizzleRawJob = typeof jobs.$inferSelect;

// Helper to map DrizzleRawJob to the Job type (converting null to undefined for optional fields)
const mapDrizzleJobToJob = (drizzleJob: DrizzleRawJob): Job => ({
  id: drizzleJob.id,
  title: drizzleJob.title,
  category: drizzleJob.category ?? null,
  description: drizzleJob.description,
  companyId: drizzleJob.companyId ?? null,
  userId: drizzleJob.userId ?? null,
  location: drizzleJob.location ?? null,
  salary: drizzleJob.salary ?? null,
  type: drizzleJob.type ?? null,
  position: drizzleJob.position ?? null,
  experience: drizzleJob.experience ?? null,
  requiredSkills: drizzleJob.requiredSkills ?? [],
  qualifications: drizzleJob.qualifications ?? null,
  howToApply: drizzleJob.howToApply ?? null,
  additionalNotes: drizzleJob.additionalNotes ?? null,
  applicationLink: drizzleJob.applicationLink ?? null,
  deadline: drizzleJob.deadline ?? null,
  createdAt: drizzleJob.createdAt ?? null, // Assuming createdAt can also be null from DB
});

export interface IStorage {
  // users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;

  // companies
  listCompanies(): Promise<Company[]>;
  listCompaniesByUserId(userId: string): Promise<Company[]>;
  searchCompanies(query: string): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(input: InsertCompany & { id?: string }): Promise<Company>; // Changed to optional id
  updateCompany(id: string, input: Partial<InsertCompany>): Promise<Company>;
  deleteCompany(id: string): Promise<void>;

  // company types
  listCompanyTypes(): Promise<CompanyType[]>;
  createCompanyType(input: { id?: string; name: string }): Promise<CompanyType>; // Add this

  // items
  listItems(): Promise<ItemWithRelations[]>;
  listItemsByCompany(companyId: string): Promise<ItemWithRelations[]>;
  listItemsByUserId(userId: string): Promise<ItemWithRelations[]>;
  searchItems(query: string, limit?: number, offset?: number): Promise<ItemWithRelations[]>;
  createItem(input: InsertItem): Promise<Item>;
  updateItem(id: string, input: Partial<InsertItem>): Promise<ItemWithRelations>;
  getItem(id: string): Promise<ItemWithRelations | undefined>;
  deleteItem(id: string): Promise<void>;

  // categories
  listCategories(): Promise<ItemCategory[]>;
  createCategory(input: InsertItemCategory): Promise<ItemCategory>;

  // locations
  listCities(): Promise<Location[]>;

  // jobs
  listJobs(): Promise<Job[]>;
  listJobsByUserId(userId: string): Promise<Job[]>;
  searchJobs(query: string): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  createJob(input: InsertJob & { id?: string }): Promise<Job>;
  updateJob(id: string, input: Partial<InsertJob>): Promise<Job>;
  deleteJob(id: string): Promise<void>;
}

class SqliteStorage implements IStorage {
  // users
  async getUser(id: string): Promise<User | undefined> {
    return db.query.users.findFirst({ where: eq(users.id, id) });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.query.users.findFirst({ where: eq(users.username, username) });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      fullName: insertUser.fullName === undefined ? null : insertUser.fullName,
      email: insertUser.email === undefined ? null : insertUser.email,
      phone: insertUser.phone === undefined ? null : insertUser.phone,
      company: insertUser.company === undefined ? null : insertUser.company,
      bio: insertUser.bio === undefined ? null : insertUser.bio,
      location: insertUser.location === undefined ? null : insertUser.location,
      profilePictureUrl: insertUser.profilePictureUrl === undefined ? null : insertUser.profilePictureUrl,
      role: null,
    };
    await db.insert(users).values(user);
    return user;
  }

  async updateUser(id: string, insertUser: Partial<InsertUser>): Promise<User> {
    await db.update(users).set(insertUser).where(eq(users.id, id));
    return (await this.getUser(id))!;
  }

  // companies
  async listCompanies(): Promise<Company[]> {
    return db.query.companies.findMany();
  }

  async listCompanyTypes(): Promise<CompanyType[]> {
    return db.query.companyTypes.findMany();
  }

  async createCompanyType(input: { id?: string; name: string }): Promise<CompanyType> {
    const typeId = input.id || randomUUID();
    const companyTypeData = {
      id: typeId,
      name: input.name,
    };
    await db.insert(companyTypes).values(companyTypeData);
    return companyTypeData;
  }

  async listCompaniesByUserId(userId: string): Promise<Company[]> {
    return db.query.companies.findMany({ where: eq(companies.userId, userId) });
  }

  async searchCompanies(query: string): Promise<Company[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    return db.query.companies.findMany({
      where: or(
        like(companies.name, searchQuery),
        like(companies.description, searchQuery),
        like(companies.companyType, searchQuery),
        like(companies.location, searchQuery)
      ),
    });
  }

  async getCompany(id: string): Promise<Company | undefined> {
    return db.query.companies.findFirst({ where: eq(companies.id, id) });
  }

  async createCompany(input: InsertCompany & { id?: string }): Promise<Company> {
    const companyId = input.id || randomUUID();
    const companyData = {
      id: companyId,
      name: input.name!,
      typeId: input.typeId === undefined ? null : input.typeId, // Re-adding typeId
      address: input.address === undefined ? null : input.address,
      userId: input.userId === undefined ? null : input.userId,
      logoUrl: input.logoUrl === undefined ? null : input.logoUrl,
      email: input.email === undefined ? null : input.email,
      phone: input.phone === undefined ? null : input.phone,
      location: input.location === undefined ? null : input.location,
      description: input.description === undefined ? null : input.description,
      website: input.website === undefined ? null : input.website,
      isVerified: input.isVerified ?? false,
      createdAt: new Date(),
      companyType: input.companyType === undefined ? null : input.companyType,
    };
    await db.insert(companies).values(companyData);
    return companyData;
  }

  async updateCompany(id: string, input: Partial<InsertCompany>): Promise<Company> {
    const updatePayload: Partial<Company> = {
      name: input.name,
      typeId: input.typeId === undefined ? null : input.typeId,
      address: input.address,
      userId: input.userId,
      logoUrl: input.logoUrl,
      email: input.email,
      phone: input.phone,
      location: input.location,
      description: input.description,
      website: input.website,
      isVerified: input.isVerified,
      createdAt: input.createdAt,
      companyType: input.companyType === undefined ? null : input.companyType,
    };

    // Remove undefined values from payload to avoid overwriting with null if not intended
    Object.keys(updatePayload).forEach(key => {
      if (updatePayload[key as keyof typeof updatePayload] === undefined) {
        delete updatePayload[key as keyof typeof updatePayload];
      }
    });

    await db.update(companies).set(updatePayload).where(eq(companies.id, id));
    return (await this.getCompany(id))!;
  }

  async deleteCompany(id: string): Promise<void> {
    // First, delete all jobs associated with this company
    await db.delete(jobs).where(eq(jobs.companyId, id));
    // Then, delete all items (products) associated with this company
    await db.delete(items).where(eq(items.companyId, id));
    // Finally, delete the company itself
    await db.delete(companies).where(eq(companies.id, id));
  }

  async getItem(id: string): Promise<ItemWithRelations | undefined> {
    const fetchedItem: DrizzleRawItemWithRelations | undefined = await db.query.items.findFirst({
      where: eq(items.id, id),
      with: {
        company: true,
        category: true,
      },
    });

    if (!fetchedItem) {
      return undefined;
    }

    return parseImageUrls(fetchedItem);
  }

  // items
  async listItems(): Promise<ItemWithRelations[]> {
    const fetchedItems: DrizzleRawItemWithRelations[] = await db.query.items.findMany({
      with: {
        company: true,
        category: true,
      },
    });
    return fetchedItems.map(parseImageUrls);
  }

  async listItemsByCompany(companyId: string): Promise<ItemWithRelations[]> {
    const fetchedItems: DrizzleRawItemWithRelations[] = await db.query.items.findMany({
      where: eq(items.companyId, companyId),
      with: {
        company: true,
        category: true,
      },
    });
    return fetchedItems.map(parseImageUrls);
  }

  async listItemsByUserId(userId: string): Promise<ItemWithRelations[]> {
    const fetchedItems: DrizzleRawItemWithRelations[] = await db.query.items.findMany({
      where: eq(items.userId, userId),
      with: {
        company: true,
        category: true,
      },
    });
    return fetchedItems.map(parseImageUrls);
  }

  async searchItems(query: string, limit?: number, offset?: number): Promise<ItemWithRelations[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    let queryBuilder: any = db.select({
        item: items,
        company: companies,
        category: itemCategories,
      })
      .from(items)
      .leftJoin(companies, eq(items.companyId, companies.id))
      .leftJoin(itemCategories, eq(items.categoryId, itemCategories.id))
      .where(
        or(
          like(sql`LOWER(${items.name})`, searchQuery),
          like(sql`LOWER(${items.description})`, searchQuery),
          like(sql`LOWER(${companies.name})`, searchQuery),
          like(sql`LOWER(${itemCategories.category})`, searchQuery)
        )
      );

    if (limit !== undefined && offset !== undefined) {
      queryBuilder = queryBuilder.limit(limit).offset(offset);
    }

    const fetchedRawItems = await queryBuilder.execute();

    const transformedItems: DrizzleRawItemWithRelations[] = fetchedRawItems.map((row: { item: any; company: any; category: any; }) => ({
      ...row.item,
      company: row.company,
      category: row.category,
    }));

    return transformedItems.map(parseImageUrls);
  }

  async createItem(input: InsertItem): Promise<Item> {
    const id = randomUUID();
    const itemToInsert = {
      id,
      name: input.name!,
      companyId: input.companyId ?? null,
      userId: input.userId ?? null,
      categoryId: input.categoryId ?? null,
      price: input.price ?? null,
      unit: input.unit ?? null,
      description: input.description ?? null,
      imageUrls: input.imageUrls ?? [],
      createdAt: new Date(),
    };
    await db.insert(items).values(itemToInsert);
    return {
      id: itemToInsert.id,
      name: itemToInsert.name,
      companyId: itemToInsert.companyId,
      userId: itemToInsert.userId,
      categoryId: itemToInsert.categoryId,
      price: itemToInsert.price,
      unit: itemToInsert.unit,
      description: itemToInsert.description,
      imageUrls: itemToInsert.imageUrls,
      createdAt: itemToInsert.createdAt,
    };
  }

  async updateItem(id: string, input: Partial<InsertItem>): Promise<ItemWithRelations> {
    // Create a payload that matches the Drizzle insert type, excluding imageUrls initially
    const { imageUrls, ...restInput } = input;
    const updatePayload: Partial<typeof items.$inferInsert> = { ...restInput };

    if (imageUrls !== undefined) {
      updatePayload.imageUrls = imageUrls ?? [];
    }

    await db.update(items).set(updatePayload).where(eq(items.id, id));
    
    // Fetch the updated item and parse imageUrls before returning
    const updatedRawItem = await db.query.items.findFirst({
      where: eq(items.id, id),
      with: {
        company: true,
        category: true,
      },
    });

    if (!updatedRawItem) {
      throw new Error("Updated item not found");
    }

    return parseImageUrls(updatedRawItem);
  }

  async deleteItem(id: string): Promise<void> {
    await db.delete(items).where(eq(items.id, id));
  }

  // categories
  async listCategories(): Promise<ItemCategory[]> {
    // This is a simplified implementation. You might want to handle nested categories.
    return db.query.itemCategories.findMany();
  }

  async createCategory(input: InsertItemCategory): Promise<ItemCategory> {
    const id = randomUUID();
    const category: ItemCategory = {
      id,
      category: input.category!,
      type: input.type!,
      parentId: input.parentId ?? null,
    };
    await db.insert(itemCategories).values(category);
    return category;
  }

  // locations
  async listCities(): Promise<Location[]> {
    return db.query.locations.findMany();
  }

  // jobs
  async listJobs(): Promise<Job[]> {
    const fetchedJobs: DrizzleRawJob[] = await db.query.jobs.findMany();
    return fetchedJobs.map(mapDrizzleJobToJob);
  }

  async listJobsByUserId(userId: string): Promise<Job[]> {
    const fetchedJobs: DrizzleRawJob[] = await db.query.jobs.findMany({ where: eq(jobs.userId, userId) });
    return fetchedJobs.map(mapDrizzleJobToJob);
  }

  async searchJobs(query: string): Promise<Job[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    const fetchedRawJobs = await db.select({
        job: jobs,
        company: companies, // Join with companies to search by company name
      })
      .from(jobs)
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .where(
        or(
          like(sql`LOWER(${jobs.title})`, searchQuery),
          like(sql`LOWER(${jobs.description})`, searchQuery),
          like(sql`LOWER(${companies.name})`, searchQuery), // Search by company name
          like(sql`LOWER(${jobs.location})`, searchQuery),
          like(sql`LOWER(${jobs.category})`, searchQuery),
          like(sql`LOWER(${jobs.type})`, searchQuery),
          like(sql`LOWER(${jobs.position})`, searchQuery),
          like(sql`LOWER(${jobs.requiredSkills})`, searchQuery),
          like(sql`LOWER(${jobs.qualifications})`, searchQuery)
        )
      )
      .execute();

    const transformedJobs: DrizzleRawJob[] = fetchedRawJobs.map(row => ({
      ...row.job,
      // No direct relations to map back to Job type, just ensure all fields are present
    }));

    return transformedJobs.map(mapDrizzleJobToJob);
  }

  async getJob(id: string): Promise<Job | undefined> {
    const fetchedJob: DrizzleRawJob | undefined = await db.query.jobs.findFirst({ where: eq(jobs.id, id) });
    if (!fetchedJob) {
      return undefined;
    }
    return mapDrizzleJobToJob(fetchedJob);
  }

  async createJob(input: InsertJob & { id?: string }): Promise<Job> {
    const jobId = input.id || randomUUID();
    const jobData = {
      id: jobId,
      title: input.title!,
      category: input.category ?? null,
      description: input.description!,
      companyId: input.companyId ?? null,
      userId: input.userId ?? null,
      location: input.location ?? null,
      salary: input.salary ?? null,
      type: input.type ?? null,
      position: input.position ?? null,
      experience: input.experience ?? null,
      requiredSkills: input.requiredSkills ?? [],
      qualifications: input.qualifications ?? null,
      howToApply: input.howToApply ?? null,
      additionalNotes: input.additionalNotes ?? null,
      applicationLink: input.applicationLink ?? null,
      deadline: input.deadline ?? null,
      createdAt: new Date(),
    };
    await db.insert(jobs).values(jobData);
    return {
      id: jobData.id,
      title: jobData.title,
      category: jobData.category,
      description: jobData.description,
      companyId: jobData.companyId,
      userId: jobData.userId,
      location: jobData.location,
      salary: jobData.salary,
      type: jobData.type,
      position: jobData.position,
      experience: jobData.experience,
      requiredSkills: jobData.requiredSkills,
      qualifications: jobData.qualifications,
      howToApply: jobData.howToApply,
      additionalNotes: jobData.additionalNotes,
      applicationLink: jobData.applicationLink,
      deadline: jobData.deadline,
      createdAt: jobData.createdAt,
    };
  }

  async updateJob(id: string, input: Partial<InsertJob>): Promise<Job> {
    // Filter out undefined values from the input to prevent Drizzle from trying to set them to NULL
    const updatePayload: Partial<typeof jobs.$inferInsert> = {};
    for (const key in input) {
      if (input[key as keyof InsertJob] !== undefined) {
        (updatePayload as any)[key] = input[key as keyof InsertJob];
      }
    }

    await db.update(jobs).set(updatePayload).where(eq(jobs.id, id));
    return (await this.getJob(id))!;
  }

  async deleteJob(id: string): Promise<void> {
    await db.delete(jobs).where(eq(jobs.id, id));
  }
}

export const storage = new SqliteStorage();
