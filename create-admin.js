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
  console.log('Creating admin user...');
  
  try {
    // Fix schema issues first
    await db.execute(`
      -- Add updated_at column to users table
      ALTER TABLE IF EXISTS users 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);
    
    // Create admin user
    const hashedPassword = await hashPassword('admin123');
    
    // Check if admin already exists
    const [existingAdmin] = await db.execute(`
      SELECT * FROM users WHERE username = 'admin'
    `);
    
    if (existingAdmin && existingAdmin.length > 0) {
      console.log('Admin user already exists.');
      return;
    }
    
    await db.execute(`
      INSERT INTO users (username, email, password, role, created_at, updated_at)
      VALUES ('admin', 'admin@schoolapp.com', $1, 'admin', NOW(), NOW())
    `, [hashedPassword]);
    
    console.log('Admin user created successfully!');
    console.log('Login credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit(0);
  }
}

main();