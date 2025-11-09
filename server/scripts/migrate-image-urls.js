import { db } from '../db.ts';
import { items } from '../../shared/schema.ts';
import { eq } from 'drizzle-orm';

async function migrate() {
  try {
    // Get all items that have null imageUrls
    const existingItems = await db.select().from(items).where(eq(items.imageUrls, null));

    console.log('Found', existingItems.length, 'items to migrate');

    for (const item of existingItems) {
      // If there's an old imageUrl field, convert it to imageUrls array
      const imageUrls = item.imageUrl ? JSON.stringify([item.imageUrl]) : JSON.stringify([]);

      await db.update(items)
        .set({ imageUrls })
        .where(eq(items.id, item.id));

      console.log('Migrated item:', item.id);
    }

    console.log('Migration completed');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
