import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');
const db = new Database(dbPath);

console.log('Checking companies in database...');

// Get all companies
const companies = db.prepare('SELECT id, name, email, phone FROM companies').all();

console.log(`Found ${companies.length} companies:`);
companies.forEach(company => {
  console.log(`${company.name}: email=${company.email}, phone=${company.phone}`);
});

// Update companies with missing contact info
const updateStmt = db.prepare(`
  UPDATE companies
  SET email = CASE WHEN email IS NULL OR email = '' THEN 'contact@' || LOWER(REPLACE(name, ' ', '')) || '.com' ELSE email END,
      phone = CASE WHEN phone IS NULL OR phone = '' THEN '+251911000000' ELSE phone END
  WHERE email IS NULL OR email = '' OR phone IS NULL OR phone = ''
`);

const result = updateStmt.run();
console.log(`Updated ${result.changes} companies with contact information.`);

// Check updated companies
const updatedCompanies = db.prepare('SELECT id, name, email, phone FROM companies').all();
console.log('\nUpdated companies:');
updatedCompanies.forEach(company => {
  console.log(`${company.name}: email=${company.email}, phone=${company.phone}`);
});

db.close();
console.log('Done.');
