import { db } from "./db.js";
import { companies } from "./schema.js";
import { eq } from "drizzle-orm";

async function updateCompanies() {
  console.log("Updating companies with contact information...");

  // Get all companies
  const allCompanies = await db.select().from(companies);

  for (const company of allCompanies) {
    if (!company.email || !company.phone) {
      const email = company.email || `contact@${company.name.toLowerCase().replace(/\s+/g, '')}.com`;
      const phone = company.phone || '+251911000000';

      await db.update(companies)
        .set({ email, phone })
        .where(eq(companies.id, company.id));

      console.log(`Updated ${company.name}: ${email}, ${phone}`);
    }
  }

  console.log("Companies update complete.");
}

updateCompanies().catch((error) => {
  console.error("Error updating companies:", error);
  process.exit(1);
});
