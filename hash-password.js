import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

// Hash the password 'testpassword'
async function main() {
  const hashed = await hashPassword('testpassword');
  console.log('Hashed password:', hashed);
}

main().catch(console.error);