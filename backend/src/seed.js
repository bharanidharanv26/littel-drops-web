import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Branch from './models/Branch.js';
import User from './models/User.js';
import Elder from './models/Elder.js';
import ElderMovement from './models/ElderMovement.js';
import ElderOutcome from './models/ElderOutcome.js';
import Request from './models/Request.js';
import Notification from './models/Notification.js';
import AuditLog from './models/AuditLog.js';
import UserBranchAssignment from './models/UserBranchAssignment.js';
import ImportJob from './models/ImportJob.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear ALL existing data
    await Branch.deleteMany({});
    await User.deleteMany({});
    await Elder.deleteMany({});
    await ElderMovement.deleteMany({});
    await ElderOutcome.deleteMany({});
    await Request.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});
    await UserBranchAssignment.deleteMany({});
    await ImportJob.deleteMany({});

    console.log('Cleared all existing data');

    // Create 8 branches
    const branches = await Branch.insertMany([
      { name: 'Paraniputhur', address: 'Kalluri Salai, Koluthuvanchery, Paraniputhur, Chennai' },
      { name: 'Gerugambakkam', address: 'Gerugambakkam, Chennai' },
      { name: 'Somangalam', address: 'Somangalam' },
      { name: 'Sriperumbudur', address: 'Sriperumbudur' },
      { name: 'Bengaluru', address: 'Bengaluru' },
      { name: 'Morappur', address: 'Morappur' },
      { name: 'Arcot', address: 'Arcot' },
      { name: 'Batlagundu', address: 'Batlagundu' },
    ]);

    console.log(`Created ${branches.length} branches`);

    // Create Founder account
    const founder = await User.create({
      name: 'Founder',
      username: 'founder',
      passwordHash: 'little',
      role: 'founder',
      mustChangePassword: true,
    });

    console.log('Created Founder account');

    console.log('');
    console.log('=== Seed Complete ===');
    console.log('');
    console.log('Branches:');
    branches.forEach(b => console.log(`  - ${b.name}`));
    console.log('');
    console.log('Login: founder / little');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
