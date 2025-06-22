/**
 * Seed Script
 * Populates the SQL database with initial data (roles)
 */

const { Role } = require('../models');
const { sequelize } = require('../config/db');

const roles = [
  { name: 'admin', description: 'Administrator role', level: 1 },
  { name: 'hirer', description: 'Hirer user role', level: 5 },
  { name: 'worker', description: 'Worker user role', level: 10 },
  { name: 'staff', description: 'Staff user role', level: 3 }
];

const seedRoles = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to SQL database');

    // Ensure tables are created
    await sequelize.sync();
    console.log('Database synchronized');

    for (const roleData of roles) {
      const [role, created] = await Role.findOrCreate({
        where: { name: roleData.name },
        defaults: roleData
      });
      console.log(`${role.name} role ${created ? 'created' : 'already exists'}`);
    }

    console.log('Role seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding roles:', error);
    process.exit(1);
  }
};

seedRoles(); 