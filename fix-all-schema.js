import { db } from './server/db.js';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function main() {
  console.log('Fixing schema and creating admin user...');
  
  try {
    // Fix schema issues first
    console.log('Adding missing columns to users table...');
    await db.execute(`
      ALTER TABLE IF EXISTS users 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);
    
    console.log('Adding missing columns to schools table...');
    await db.execute(`
      ALTER TABLE IF EXISTS schools 
      ADD COLUMN IF NOT EXISTS type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS admin_first_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS admin_last_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS admin_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS admin_phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS district VARCHAR(255),
      ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);
    `);
    
    // Create admin user with literal password in SQL
    console.log('Creating admin user...');
    const hashedPassword = await hashPassword('admin123');
    
    // Check if admin already exists using a separate query
    const existingAdmins = await db.execute(`
      SELECT * FROM users WHERE username = 'admin'
    `);
    
    if (existingAdmins && existingAdmins.length > 0) {
      console.log('Admin user already exists.');
    } else {
      // Insert admin with literal SQL (not using parameters)
      await db.execute(`
        INSERT INTO users (username, email, password, role, created_at, updated_at)
        VALUES ('admin', 'admin@schoolapp.com', '${hashedPassword}', 'admin', NOW(), NOW())
      `);
      
      console.log('Admin user created successfully!');
      console.log('Login credentials:');
      console.log('Username: admin');
      console.log('Password: admin123');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

main();