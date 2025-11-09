import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function setAdmin(username: string) {
  if (!username) {
    console.error('Please provide a username.');
    process.exit(1);
  }

  try {
    console.log(`Attempting to set role for user: ${username}`);
    const user = await db.select().from(users).where(eq(users.username, username)).get();

    if (!user) {
      console.error(`User with username "${username}" not found.`);
      process.exit(1);
    }

    await db.update(users).set({ role: 'Admin' }).where(eq(users.id, user.id));

    console.log(`Successfully set user "${username}" with role "Admin".`);
  } catch (error) {
    console.error('An error occurred while setting the admin role:', error);
  } finally {
    process.exit(0);
  }
}

const username = process.argv[2];
setAdmin(username);
