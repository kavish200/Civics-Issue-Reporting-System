const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../../shared/models/User');

const seeds = [
  {
    name: process.env.ADMIN_NAME || 'Admin User',
    email: (process.env.ADMIN_EMAIL || 'admin@civics.dev').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    role: 'admin'
  },
  {
    name: process.env.OFFICER1_NAME || 'Officer One',
    email: (process.env.OFFICER1_EMAIL || 'officer1@civics.dev').toLowerCase(),
    password: process.env.OFFICER1_PASSWORD || 'Officer@123',
    role: 'officer'
  },
  {
    name: process.env.OFFICER2_NAME || 'Officer Two',
    email: (process.env.OFFICER2_EMAIL || 'officer2@civics.dev').toLowerCase(),
    password: process.env.OFFICER2_PASSWORD || 'Officer@123',
    role: 'officer'
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Database connected');

  for (const item of seeds) {
    const existing = await User.findOne({ email: item.email });
    if (existing) {
      console.log(`User already exists: ${item.email}`);
      continue;
    }
    const hashedPassword = await bcrypt.hash(item.password, 10);
    await User.create({
      name: item.name,
      email: item.email,
      password: hashedPassword,
      role: item.role
    });
    console.log(`Created ${item.role}: ${item.email}`);
  }

  await mongoose.disconnect();
  console.log('Seeding finished');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
