import { db } from '../db';
import { items, users, companies } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

const r2BaseUrl = process.env.VITE_R2_PUBLIC_URL || '';

async function migrate() {
  try {
    console.log('Starting URL migration to R2...');

    // Migrate items
    const allItems = await db.select().from(items);
    for (const item of allItems) {
      if (item.imageUrls) {
        const newImageUrls = item.imageUrls.map(url => {
          if (url.startsWith('/api/uploads/')) {
            return `${r2BaseUrl}/uploads/${url.replace('/api/uploads/', '')}`;
          }
          return url;
        });
        await db.update(items).set({ imageUrls: newImageUrls }).where(eq(items.id, item.id));
        console.log(`Migrated item: ${item.id}`);
      }
    }

    // Migrate users
    const allUsers = await db.select().from(users);
    for (const user of allUsers) {
      if (user.profilePictureUrl && user.profilePictureUrl.startsWith('/api/uploads/')) {
        const newProfilePictureUrl = `${r2BaseUrl}/uploads/${user.profilePictureUrl.replace('/api/uploads/', '')}`;
        await db.update(users).set({ profilePictureUrl: newProfilePictureUrl }).where(eq(users.id, user.id));
        console.log(`Migrated user: ${user.id}`);
      }
    }

    // Migrate companies
    const allCompanies = await db.select().from(companies);
    for (const company of allCompanies) {
      if (company.logoUrl && company.logoUrl.startsWith('/api/uploads/')) {
        const newLogoUrl = `${r2BaseUrl}/uploads/${company.logoUrl.replace('/api/uploads/', '')}`;
        await db.update(companies).set({ logoUrl: newLogoUrl }).where(eq(companies.id, company.id));
        console.log(`Migrated company: ${company.id}`);
      }
    }

    console.log('Migration completed');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
