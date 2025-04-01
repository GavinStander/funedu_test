import { db } from './server/db.js';

async function main() {
  console.log('Updating tables...');
  
  try {
    // Create user_role and school_type enums if they don't exist
    await db.execute(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
          CREATE TYPE user_role AS ENUM ('student', 'school', 'admin');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'school_type') THEN
          CREATE TYPE school_type AS ENUM ('public', 'private', 'charter', 'international');
        END IF;
      END
      $$;
    `);
    
    // Update schools table to match schema
    await db.execute(`
      -- Drop columns that need to be recreated with different types
      ALTER TABLE IF EXISTS schools 
      ADD COLUMN IF NOT EXISTS type school_type,
      ADD COLUMN IF NOT EXISTS admin_first_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS admin_last_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS admin_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS admin_phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS district VARCHAR(255);
    `);

    // Update users table to use enum
    await db.execute(`
      -- Make sure role column uses the enum type
      ALTER TABLE IF EXISTS users 
      ALTER COLUMN role TYPE user_role USING role::user_role;
    `);
    
    console.log('Schema updated successfully!');
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    process.exit(0);
  }
}

main();