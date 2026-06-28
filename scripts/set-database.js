const fs = require('fs');
const path = require('path');

const target = process.argv[2]; // 'sqlite' or 'postgres'
if (target !== 'sqlite' && target !== 'postgres') {
  console.error("Usage: node set-database.js [sqlite|postgres]");
  process.exit(1);
}

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
if (!fs.existsSync(schemaPath)) {
  console.error(`Schema file not found at ${schemaPath}`);
  process.exit(1);
}

let schema = fs.readFileSync(schemaPath, 'utf8');

if (target === 'sqlite') {
  schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
} else {
  schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
}

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log(`[Wollomat] Set schema.prisma provider to: ${target}`);
