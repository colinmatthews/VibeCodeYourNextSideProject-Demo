
import { db } from '../db';

async function checkData() {
  try {
    console.log('Checking users table:');
    const users = await db.query.users.findMany();
    console.log(users);

    console.log('\nChecking items table:');
    const items = await db.query.items.findMany();
    console.log(items);

    console.log('\nChecking components table:');
    const components = await db.query.components.findMany();
    console.log(components);
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    process.exit(0);
  }
}

checkData();
