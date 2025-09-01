const NgrokManager = require('./ngrok-manager');

async function main() {
  const manager = new NgrokManager();
  
  try {
    console.log('🎯 Kelmah ngrok Manager');
    console.log('========================');
    
    const url = await manager.start();
    
    console.log('\n🎉 SUCCESS! Your backend is now accessible at:');
    console.log(`🌐 ${url}`);
    console.log('\n📋 What happens next:');
    console.log('1. ✅ ngrok tunnel is running');
    console.log('2. ✅ Frontend config files updated');
    console.log('3. ✅ ngrok-skip-browser-warning header configured');
    console.log('4. 🔄 Ready to deploy to Vercel');
    
    console.log('\n🚀 To deploy:');
    console.log('   git add .');
    console.log('   git commit -m "Update ngrok URL"');
    console.log('   git push origin main');
    
    console.log('\n⏹️  Press Ctrl+C to stop ngrok');
    
  } catch (error) {
    console.error('❌ Failed to start ngrok:', error.message);
    process.exit(1);
  }
}

main();
