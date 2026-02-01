#!/usr/bin/env node

/**
 * Router Configuration Setup Script
 * Updates all configurations to use router IP instead of LocalTunnel
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Router Configuration Setup');
console.log('============================\n');

// Get router IP from user or use default
const routerIP = process.argv[2] || '192.168.1.1'; // Default to router IP
const apiPort = process.argv[3] || '3000'; // API Gateway port
const fullAPIUrl = `http://${routerIP}:${apiPort}`;

console.log(`📡 Configuring for router IP: ${routerIP}`);
console.log(`🌐 API Gateway URL: ${fullAPIUrl}\n`);

const configFiles = [
    {
        name: 'Frontend Runtime Config',
        path: path.join(__dirname, 'kelmah-frontend', 'public', 'runtime-config.json'),
        update: (config) => ({
            ...config,
            ngrokUrl: fullAPIUrl,
            websocketUrl: `ws://${routerIP}:${apiPort}`,
            API_URL: fullAPIUrl,
            WS_URL: fullAPIUrl,
            TUNNEL_TYPE: 'router',
            WEBSOCKET_MODE: 'unified',
            isDevelopment: false,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        })
    },
    {
        name: 'Root Vercel Config',
        path: path.join(__dirname, 'vercel.json'),
        update: (config) => ({
            ...config,
            rewrites: [
                {
                    source: '/api/(.*)',
                    destination: `${fullAPIUrl}/api/$1`
                },
                {
                    source: '/socket.io/(.*)',
                    destination: `${fullAPIUrl}/socket.io/$1`
                }
            ],
            env: {
                VITE_API_URL: fullAPIUrl,
                VITE_WS_URL: fullAPIUrl
            },
            build: {
                env: {
                    VITE_API_URL: fullAPIUrl,
                    VITE_WS_URL: fullAPIUrl
                }
            }
        })
    },
    {
        name: 'Frontend Vercel Config',
        path: path.join(__dirname, 'kelmah-frontend', 'vercel.json'),
        update: (config) => ({
            ...config,
            rewrites: [
                {
                    source: '/api/(.*)',
                    destination: `${fullAPIUrl}/api/$1`
                },
                {
                    source: '/socket.io/(.*)',
                    destination: `${fullAPIUrl}/socket.io/$1`
                },
                {
                    source: '/(.*)',
                    destination: '/index.html'
                }
            ]
        })
    },
    {
        name: 'Security Config',
        path: path.join(__dirname, 'kelmah-frontend', 'src', 'config', 'securityConfig.js'),
        update: (content) => {
            // Update the connect-src array to include router IP
            return content.replace(
                /'connect-src': \[[^\]]*\]/s,
                `'connect-src': [
      "'self'",
      '${fullAPIUrl}',
      'http://${routerIP}:${apiPort}',
      // Legacy URLs (kept for compatibility)
      'https://shaggy-snake-43.loca.lt',
      "https://kelmah-auth-service.onrender.com",
      "https://kelmah-user-service.onrender.com",
      "https://kelmah-job-service.onrender.com",
      "https://kelmah-messaging-service.onrender.com",
      "https://kelmah-payment-service.onrender.com"
    ]`
            );
        }
    }
];

console.log('📝 Updating configuration files...\n');

// Update each config file
configFiles.forEach(({ name, path: filePath, update }) => {
    try {
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');

            if (filePath.endsWith('.json')) {
                const config = JSON.parse(content);
                const updatedConfig = update(config);
                content = JSON.stringify(updatedConfig, null, 2);
            } else if (filePath.endsWith('.js')) {
                content = update(content);
            }

            fs.writeFileSync(filePath, content);
            console.log(`✅ Updated ${name}`);
        } else {
            console.log(`⚠️  ${name} not found: ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Error updating ${name}:`, error.message);
    }
});

console.log('\n🎉 Router configuration complete!');
console.log('\n📋 Next Steps:');
console.log('1. Ensure your router forwards external requests to your local API Gateway');
console.log('2. Update your router\'s port forwarding:');
console.log(`   - External Port ${apiPort} → Internal IP:YOUR_LOCAL_IP Port ${apiPort}`);
console.log('3. Start your backend services:');
console.log('   node start-api-gateway.js');
console.log('   node start-auth-service.js');
console.log('   node start-user-service.js');
console.log('   # ... etc');
console.log('4. Test the configuration with: node test-router-connection.js');

console.log('\n🔧 If you need to change the router IP, run:');
console.log(`   node setup-router-config.js YOUR_EXTERNAL_IP ${apiPort}`);
