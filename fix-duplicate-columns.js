import { db } from './server/db.js';

async function main() {
  console.log('Fixing duplicate columns in schools table...');
  
  try {
    // Check if the schools table exists and has the zip_code column
    const checkTable = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'schools'
    `);
    
    const columns = checkTable.map(row => row.column_name);
    console.log('Current columns in schools table:', columns);
    
    // Fix duplicate columns in schools table
    if (columns.includes('zip') && columns.includes('zip_code')) {
      // Drop the zip column in favor of zip_code which matches our schema
      await db.execute(`ALTER TABLE schools DROP COLUMN IF EXISTS zip`);
      console.log('Dropped duplicate zip column');
    }
    
    if (columns.includes('email')) {
      await db.execute(`ALTER TABLE schools DROP COLUMN IF EXISTS email`);
      console.log('Dropped duplicate email column');
    }
    
    if (columns.includes('phone')) {
      await db.execute(`ALTER TABLE schools DROP COLUMN IF EXISTS phone`);
      console.log('Dropped duplicate phone column');
    }
    
    if (columns.includes('website')) {
      await db.execute(`ALTER TABLE schools DROP COLUMN IF EXISTS website`);
      console.log('Dropped duplicate website column');
    }
    
    if (columns.includes('school_type') && columns.includes('type')) {
      // We want to keep the type column which matches our schema
      await db.execute(`ALTER TABLE schools DROP COLUMN IF EXISTS school_type`);
      console.log('Dropped duplicate school_type column');
    }
    
    // Ensure the type column is using the proper enum
    await db.execute(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'school_type') THEN
          CREATE TYPE school_type AS ENUM ('public', 'private', 'charter', 'international');
        END IF;
      END
      $$;
    `);
    
    // Ensure the type column has the right datatype
    await db.execute(`
      ALTER TABLE schools 
      ALTER COLUMN type TYPE school_type USING type::school_type;
    `);
    
    console.log('Schema updated successfully!');
    
    // Add example school for testing
    const schoolUser = await db.execute(`
      SELECT id FROM users WHERE role = 'school' LIMIT 1
    `);
    
    if (schoolUser && schoolUser.length > 0) {
      const userId = schoolUser[0].id;
      
      const schoolExists = await db.execute(`
        SELECT COUNT(*) FROM schools WHERE user_id = ${userId}
      `);
      
      if (parseInt(schoolExists[0].count) === 0) {
        console.log(`Creating example school for user ID ${userId}...`);
        await db.execute(`
          INSERT INTO schools (
            user_id, name, type, district, admin_first_name, admin_last_name, 
            admin_email, admin_phone, address, city, state, zip_code, description
          ) VALUES (
            ${userId}, 'Springfield High School', 'public', 'Springfield School District', 
            'Gavin', 'Stander', 'mrgavinstander@gmail.com', '555-123-4567',
            '123 School St', 'Springfield', 'IL', '62701', 'A great high school in Springfield'
          )
        `);
        console.log('Example school created successfully!');
      } else {
        console.log('Example school already exists for this user, skipping creation');
      }
    } else {
      console.log('No school user found, cannot create example school');
    }
  } catch (error) {
    console.error('Error fixing schema:', error);
  } finally {
    process.exit(0);
  }
}

main();