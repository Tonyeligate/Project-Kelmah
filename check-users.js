const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

async function checkUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    // Check for Gifty user
    const gifty = await User.findOne({ email: 'gifty@example.com' });
    console.log('👤 Gifty user:', gifty ? 'Found' : 'Not found');
    if (gifty) {
      console.log('- Name:', gifty.firstName, gifty.lastName);
      console.log('- Email:', gifty.email);
      console.log('- Role:', gifty.role);
      console.log('- Active:', gifty.isActive);
    }
    
    // Check for other users
    const users = await User.find({ role: { $in: ['hirer', 'worker'] } }).limit(3);
    console.log('👥 Other users found:', users.length);
    users.forEach(user => {
      console.log('- Name:', user.firstName, user.lastName);
      console.log('  Email:', user.email);
      console.log('  Role:', user.role);
      console.log('  Active:', user.isActive);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
