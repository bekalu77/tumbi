import { db } from "./db";
import { users, companyTypes, companies, itemCategories, items, locations, rfq, units } from "@shared/schema";
import fs from "fs";
import Papa from "papaparse";
import { randomUUID } from "crypto";

async function seed() {
  console.log("Seeding database from CSV files...");

  // Helper function to read and parse CSV files
  const parseCsv = (filePath: string) => {
    const csvFile = fs.readFileSync(filePath, "utf8");
    return Papa.parse(csvFile, { header: true, skipEmptyLines: true }).data;
  };

  // Seed Users
  const usersData = parseCsv("c:/Users/NIQU/Downloads/marketplace/users.csv");
  await db.insert(users).values(usersData.map((u: any) => ({ ...u, id: randomUUID(), password: "password" })));

  // Seed Company Types
  const companyTypesData = parseCsv("c:/Users/NIQU/Downloads/marketplace/company_types.csv");
  await db.insert(companyTypes).values(companyTypesData.map((ct: any) => ({ ...ct, id: randomUUID() })));

  // Seed Companies
  const companiesData = parseCsv("c:/Users/NIQU/Downloads/marketplace/companies.csv");
  await db.insert(companies).values(companiesData.map((c: any) => ({ ...c, id: randomUUID() })));

  // Seed Item Categories
  const itemCategoriesData = parseCsv("c:/Users/NIQU/Downloads/marketplace/item_category.csv");
  await db.insert(itemCategories).values(itemCategoriesData.map((ic: any) => ({ ...ic, id: randomUUID() })));

  // Seed Items
  const itemsData = parseCsv("c:/Users/NIQU/Downloads/marketplace/items.csv");
  await db.insert(items).values(itemsData.map((i: any) => ({ ...i, id: randomUUID(), price: parseFloat(i.price) })));

  // Seed Locations
  const locationsData = parseCsv("c:/Users/NIQU/Downloads/marketplace/locations.csv");
  await db.insert(locations).values(locationsData.map((l: any) => ({ ...l, id: randomUUID() })));

  // Seed RFQs
  const rfqData = parseCsv("c:/Users/NIQU/Downloads/marketplace/rfq.csv");
  await db.insert(rfq).values(rfqData.map((r: any) => ({ ...r, id: randomUUID(), quantity: parseInt(r.quantity) })));

  // Seed Units
  const unitsData = parseCsv("c:/Users/NIQU/Downloads/marketplace/units.csv");
  await db.insert(units).values(unitsData.map((u: any) => ({ ...u, id: randomUUID() })));

  console.log("Seeding from CSV files complete.");
}

seed().catch((error) => {
  console.error("Error seeding database from CSV files:", error);
  process.exit(1);
});
