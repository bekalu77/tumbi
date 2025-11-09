import { db } from "./db";
import { users, itemCategories, companies, items, companyTypes } from "@shared/schema"; // Import companyTypes
import data from "./data.json";
import { eq, inArray } from "drizzle-orm"; // Import eq and inArray

async function seed() {
  console.log("Seeding database...");

  console.log("Seeding database...");

  // Ensure demo user exists
  let demoUser = await db.query.users.findFirst({ where: eq(users.username, "demo") });
  if (!demoUser) {
    console.log("Creating demo user...");
    const [newDemoUser] = await db.insert(users).values({ id: "demo-user-id", username: "demo", password: "demo123", fullName: "Demo User" }).returning();
    demoUser = newDemoUser;
  } else {
    console.log("Demo user already exists.");
  }

  // Seed company types
  const companyTypesToInsert = [
    { id: "company-type-contractor", name: "Contractor" },
    { id: "company-type-supplier", name: "Supplier" },
    { id: "company-type-manufacturer", name: "Manufacturer" },
    { id: "company-type-consultant", name: "Consultant" },
  ];

  const existingCompanyTypes = await db.select().from(companyTypes);
  const newCompanyTypes = companyTypesToInsert.filter(
    (ct) => !existingCompanyTypes.some((ect) => ect.id === ct.id)
  );

  if (newCompanyTypes.length > 0) {
    await db.insert(companyTypes).values(newCompanyTypes);
  }

  // Seed categories
  // The demoUser is now guaranteed to exist.
  // Removed seeding other users from data.json to avoid UNIQUE constraint errors.

  // Clear existing products and product categories before re-seeding to avoid duplicates and foreign key constraints
  console.log("Clearing existing products...");
  // First, delete all items that belong to product categories
  const productCategoryIds = (await db.select({ id: itemCategories.id }).from(itemCategories).where(eq(itemCategories.type, "product"))).map(c => c.id);
  if (productCategoryIds.length > 0) {
    await db.delete(items).where(inArray(items.categoryId, productCategoryIds));
  }

  console.log("Clearing existing product categories...");
  await db.delete(itemCategories).where(eq(itemCategories.type, "product"));

  // Seed categories with parent-child relationships
  const newProductCategories = [
    { id: "cat-cement-concrete", category: "Cement & Concrete", type: "product", parentId: null },
    { id: "cat-portland-cement", category: "Portland Cement", type: "product", parentId: "cat-cement-concrete" },
    { id: "cat-ready-mix-concrete", category: "Ready-Mix Concrete", type: "product", parentId: "cat-cement-concrete" },
    { id: "cat-concrete-blocks", category: "Concrete Blocks", type: "product", parentId: "cat-cement-concrete" },

    { id: "cat-steel-metals", category: "Steel & Metals", type: "product", parentId: null },
    { id: "cat-rebar", category: "Rebar", type: "product", parentId: "cat-steel-metals" },
    { id: "cat-structural-steel", category: "Structural Steel", type: "product", parentId: "cat-steel-metals" },
    { id: "cat-aluminum-profiles", category: "Aluminum Profiles", type: "product", parentId: "cat-steel-metals" },

    { id: "cat-wood-timber", category: "Wood & Timber", type: "product", parentId: null },
    { id: "cat-lumber", category: "Lumber", type: "product", parentId: "cat-wood-timber" },
    { id: "cat-plywood", category: "Plywood", type: "product", parentId: "cat-wood-timber" },
    { id: "cat-mdf", category: "MDF", type: "product", parentId: "cat-wood-timber" },

    { id: "cat-roofing-materials", category: "Roofing Materials", type: "product", parentId: null },
    { id: "cat-corrugated-iron-sheets", category: "Corrugated Iron Sheets", type: "product", parentId: "cat-roofing-materials" },
    { id: "cat-roof-tiles", category: "Roof Tiles", type: "product", parentId: "cat-roofing-materials" },
    { id: "cat-waterproofing-membranes", category: "Waterproofing Membranes", type: "product", parentId: "cat-roofing-materials" },

    { id: "cat-finishing-materials", category: "Finishing Materials", type: "product", parentId: null },
    { id: "cat-paints-coatings", category: "Paints & Coatings", type: "product", parentId: "cat-finishing-materials" },
    { id: "cat-floor-tiles", category: "Floor Tiles", type: "product", parentId: "cat-finishing-materials" },
    { id: "cat-wallpapers", category: "Wallpapers", type: "product", parentId: "cat-finishing-materials" },

    { id: "cat-plumbing-sanitation", category: "Plumbing & Sanitation", type: "product", parentId: null },
    { id: "cat-pipes-fittings", category: "Pipes & Fittings", type: "product", parentId: "cat-plumbing-sanitation" },
    { id: "cat-water-heaters", category: "Water Heaters", type: "product", parentId: "cat-plumbing-sanitation" },
    { id: "cat-sanitary-ware", category: "Sanitary Ware", type: "product", parentId: "cat-plumbing-sanitation" },

    { id: "cat-electrical-supplies", category: "Electrical Supplies", type: "product", parentId: null },
    { id: "cat-cables-wires", category: "Cables & Wires", type: "product", parentId: "cat-electrical-supplies" },
    { id: "cat-switches-sockets", category: "Switches & Sockets", type: "product", parentId: "cat-electrical-supplies" },
    { id: "cat-lighting-fixtures", category: "Lighting Fixtures", type: "product", parentId: "cat-electrical-supplies" },
  ];

  for (const category of newProductCategories) {
    const existing = await db.query.itemCategories.findFirst({ where: eq(itemCategories.id, category.id) });
    if (!existing) {
      await db.insert(itemCategories).values(category);
    }
  }

  // Get a guaranteed product category ID for products (using one of the new categories)
  let defaultProductCategoryId: string | undefined = "cat-portland-cement"; // Use a specific subcategory as default
  const existingProductCategory = await db.query.itemCategories.findFirst({ where: eq(itemCategories.id, defaultProductCategoryId) });
  if (!existingProductCategory) {
    // Fallback if the specific default doesn't exist for some reason
    const firstProductCategory = await db.query.itemCategories.findFirst({ where: eq(itemCategories.type, "product") });
    if (firstProductCategory) {
      defaultProductCategoryId = firstProductCategory.id;
    } else {
      console.error("No product categories found after seeding. Cannot set defaultProductCategoryId.");
      defaultProductCategoryId = undefined; // Ensure it's undefined if no categories exist
    }
  }

  // Seed tender categories
  const tenderCategoriesToInsert = [
    { id: "tender-category-construction", category: "Construction", type: "tender", parentId: null },
    { id: "tender-category-services", category: "Services", type: "tender", parentId: null },
    { id: "tender-category-supplies", category: "Supplies", type: "tender", parentId: null },
    { id: "tender-category-consultancy", category: "Consultancy", type: "tender", parentId: null },
    { id: "tender-category-building-construction", category: "Building Construction", type: "tender", parentId: null },
    { id: "tender-category-road-bridge-construction", category: "Road and Bridge Construction", type: "tender", parentId: null },
    { id: "tender-category-water-system-installation", category: "Water System Installation", type: "tender", parentId: null },
    { id: "tender-category-water-well-pool-cleaning", category: "Water Well and Pool Cleaning", type: "tender", parentId: null },
    { id: "tender-category-architectural-consulting", category: "Architectural and Consulting", type: "tender", parentId: null },
    { id: "tender-category-water-construction", category: "Water Construction", type: "tender", parentId: null },
    { id: "tender-category-irrigation-works", category: "Irrigation Works", type: "tender", parentId: null },
    { id: "tender-category-finishing-works", category: "Finishing Works", type: "tender", parentId: null },
    { id: "tender-category-water-proofing-works", category: "Water Proofing Works", type: "tender", parentId: null },
    { id: "tender-category-sewerage", category: "Sewerage", type: "tender", parentId: null },
    { id: "tender-category-water-engineering-machinery", category: "Water Engineering Machinery", type: "tender", parentId: null },
    { id: "tender-category-water-well-drilling", category: "Water Well Drilling", type: "tender", parentId: null },
    { id: "tender-category-water-pipes-fittings", category: "Water Pipes and Fittings", type: "tender", parentId: null },
    { id: "tender-category-building-finishing-materials", category: "Building and Finishing Materials", type: "tender", parentId: null },
    { id: "tender-category-contract-administration", category: "Contract Administration", type: "tender", parentId: null },
    { id: "tender-category-construction-machinery", category: "Construction Machinery", type: "tender", parentId: null },
  ];

  const existingTenderCategories = await db.select().from(itemCategories).where(eq(itemCategories.type, "tender"));
  const newTenderCategories = tenderCategoriesToInsert.filter(
    (tc) => !existingTenderCategories.some((etc) => etc.id === tc.id)
  );

  if (newTenderCategories.length > 0) {
    await db.insert(itemCategories).values(newTenderCategories);
  }

  // Clear existing service categories before re-seeding
  console.log("Clearing existing service categories...");
  await db.delete(itemCategories).where(eq(itemCategories.type, "service"));

  // Seed service categories with parent-child relationships
  const newServiceCategories = [
    { id: "cat-consulting", category: "Consulting", type: "service", parentId: null },
    { id: "cat-construction-services", category: "Construction Services", type: "service", parentId: null },
    { id: "cat-general-contracting", category: "General Contracting", type: "service", parentId: "cat-construction-services" },
    { id: "cat-sub-contracts", category: "Sub Contracts", type: "service", parentId: "cat-construction-services" },
    { id: "cat-carpentry", category: "Carpentry", type: "service", parentId: "cat-sub-contracts" },
    { id: "cat-masonry", category: "Masonry", type: "service", parentId: "cat-sub-contracts" },
    { id: "cat-plumbing", category: "Plumbing", type: "service", parentId: "cat-sub-contracts" },
    { id: "cat-concrete-work", category: "Concrete Work", type: "service", parentId: "cat-sub-contracts" },
    { id: "cat-rebar-bending", category: "Rebar Bending", type: "service", parentId: "cat-sub-contracts" },
    { id: "cat-electrical-installation", category: "Electrical Installation", type: "service", parentId: "cat-sub-contracts" },
    { id: "cat-painting-finishing", category: "Painting & Finishing", type: "service", parentId: "cat-sub-contracts" },
    { id: "cat-landscaping", category: "Landscaping", type: "service", parentId: "cat-construction-services" },
    { id: "cat-labour-work", category: "Labour Work", type: "service", parentId: null },
    { id: "cat-skilled-labour", category: "Skilled Labour", type: "service", parentId: "cat-labour-work" },
    { id: "cat-unskilled-labour", category: "Unskilled Labour", type: "service", parentId: "cat-labour-work" },
    { id: "cat-equipment-rental", category: "Equipment Rental", type: "service", parentId: null },
    { id: "cat-heavy-equipment", category: "Heavy Equipment", type: "service", parentId: "cat-equipment-rental" },
    { id: "cat-light-equipment", category: "Light Equipment", type: "service", parentId: "cat-equipment-rental" },
  ];

  for (const category of newServiceCategories) {
    const existing = await db.query.itemCategories.findFirst({ where: eq(itemCategories.id, category.id) });
    if (!existing) {
      await db.insert(itemCategories).values(category);
    }
  }

  // Seed companies (hardcoded to avoid data.json issues)
  let defaultCompanyId: string | undefined;
  const existingCompany = await db.query.companies.findFirst();
  if (existingCompany) {
    defaultCompanyId = existingCompany.id;
    console.log("Default company already exists.");
  } else {
    console.log("Creating default company...");
    const [newCompany] = await db.insert(companies).values({ 
      id: "company-default", 
      name: "Default Company", 
      userId: demoUser.id, 
      email: "default@example.com", 
      phone: "1234567890", 
      location: "Addis Ababa", 
      description: "Default company for seeding",
      typeId: "company-type-supplier", // Ensure a valid typeId
    }).returning();
    defaultCompanyId = newCompany.id;
  }

  // Seed products (hardcoded to avoid data.json issues)
  const existingProducts = await db.select().from(items);
  if (existingProducts.length === 0 && defaultCompanyId && defaultProductCategoryId) {
    console.log("Creating default product...");
    await db.insert(items).values([
      {
        id: "product-default-1",
        name: "Default Product 1",
        companyId: defaultCompanyId,
        userId: demoUser.id,
        categoryId: defaultProductCategoryId,
        price: 100.00,
        unit: "pcs",
        description: "A default product for testing.",
        imageUrls: JSON.stringify([]), // No placeholder image for seeded products
        createdAt: new Date(),
      },
    ]);
  } else if (existingProducts.length > 0) {
    console.log("Products already exist.");
  } else {
    console.warn("Could not create default product: Missing defaultCompanyId or defaultProductCategoryId.");
  }

  console.log("Seeding complete.");
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
