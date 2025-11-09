import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../shared/schema';
import 'dotenv/config';

function parseDate(value: any): Date | null {
  if (value === null || value === undefined) {
    return null;
  }
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch (e) {
    return null;
  }
}

function safeJsonParse(value: any): string[] | null {
    if (typeof value !== 'string' || value.trim() === '') {
        return null;
    }
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
        return [value];
    }
}

async function main() {
  console.log('Starting data migration...');

  // Connect to SQLite
  const sqlite = new Database('data/database.sqlite');
  const dbSqlite = drizzleSqlite(sqlite);
  console.log('Connected to SQLite.');

  // Connect to PostgreSQL
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in .env file');
  }
  const connectionString = process.env.DATABASE_URL;
  const client = postgres(connectionString);
  const dbPg = drizzlePg(client, { schema });
  console.log('Connected to PostgreSQL.');

  // --- Data Migration ---

  // Users
  const users = await dbSqlite.select().from(schema.users);
  if (users.length > 0) {
    await dbPg.insert(schema.users).values(users).onConflictDoNothing();
    console.log(`Migrated ${users.length} users.`);
  }

  // Company Types
  const companyTypes = await dbSqlite.select().from(schema.companyTypes);
  if (companyTypes.length > 0) {
    await dbPg.insert(schema.companyTypes).values(companyTypes).onConflictDoNothing();
    console.log(`Migrated ${companyTypes.length} company types.`);
  }
  
  // Companies
  const companies = await dbSqlite.select().from(schema.companies);
  if (companies.length > 0) {
    const mappedCompanies = companies.map(c => ({
        ...c,
        createdAt: parseDate(c.createdAt)
    }));
    await dbPg.insert(schema.companies).values(mappedCompanies).onConflictDoNothing();
    console.log(`Migrated ${companies.length} companies.`);
  }

  // Item Categories
  const itemCategories = await dbSqlite.select().from(schema.itemCategories);
  if (itemCategories.length > 0) {
    await dbPg.insert(schema.itemCategories).values(itemCategories).onConflictDoNothing();
    console.log(`Migrated ${itemCategories.length} item categories.`);
  }

  // Items
  const items = await dbSqlite.select().from(schema.items);
  if (items.length > 0) {
    const mappedItems = items.map(item => ({
      ...item,
      imageUrls: safeJsonParse(item.imageUrls),
      createdAt: parseDate(item.createdAt)
    }));
    await dbPg.insert(schema.items).values(mappedItems).onConflictDoNothing();
    console.log(`Migrated ${items.length} items.`);
  }

  // Locations
  const locations = await dbSqlite.select().from(schema.locations);
  if (locations.length > 0) {
    await dbPg.insert(schema.locations).values(locations).onConflictDoNothing();
    console.log(`Migrated ${locations.length} locations.`);
  }

  // RFQs
  const rfqs = await dbSqlite.select().from(schema.rfq);
  if (rfqs.length > 0) {
    await dbPg.insert(schema.rfq).values(rfqs).onConflictDoNothing();
    console.log(`Migrated ${rfqs.length} RFQs.`);
  }

  // Jobs
  const jobs = await dbSqlite.select().from(schema.jobs);
  if (jobs.length > 0) {
     const mappedJobs = jobs.map(job => ({
      ...job,
      requiredSkills: safeJsonParse(job.requiredSkills),
      deadline: parseDate(job.deadline),
      createdAt: parseDate(job.createdAt),
    }));
    await dbPg.insert(schema.jobs).values(mappedJobs).onConflictDoNothing();
    console.log(`Migrated ${jobs.length} jobs.`);
  }

  // Units
  const units = await dbSqlite.select().from(schema.units);
  if (units.length > 0) {
    await dbPg.insert(schema.units).values(units).onConflictDoNothing();
    console.log(`Migrated ${units.length} units.`);
  }

  console.log('Data migration completed successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
