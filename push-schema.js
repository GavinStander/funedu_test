
import { db } from './server/db.js';

async function main() {
  console.log('Creating tables...');
  
  try {
    // Create enums first
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

    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role user_role NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create schools table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS schools (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type school_type NOT NULL,
        district TEXT,
        admin_first_name TEXT,
        admin_last_name TEXT,
        admin_email TEXT,
        admin_phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create events table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        event_type TEXT NOT NULL,
        date TIMESTAMP NOT NULL DEFAULT NOW(),
        start_time TEXT,
        end_time TEXT,
        location TEXT,
        capacity INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Schema created successfully!');
  } catch (error) {
    console.error('Error creating schema:', error);
  } finally {
    process.exit(0);
  }
}

main();
