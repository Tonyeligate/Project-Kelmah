const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');

// LocalTunnel URLs
const LOCALTUNNEL_CONFIG = {
    apiDomain: 'https://kelmah-api.loca.lt',
    wsDomain: 'https://kelmah-ws.loca.lt',
    timestamp: new Date().toISOString(),
    status: 'active'
};

console.log('🎯 LocalTunnel Configuration Manager');
console.log('===================================');
console.log('📡 API Gateway:', LOCALTUNNEL_CONFIG.apiDomain);
console.log('🔌 WebSocket:', LOCALTUNNEL_CONFIG.wsDomain);
console.log('');

async function updateConfigurations() {
    try {
        // 1. Update ngrok-config.json (reuse the same file)
        console.log('💾 Updating configuration files...');
        fs.writeFileSync(
            path.join(__dirname, 'ngrok-config.json'),
            JSON.stringify(LOCALTUNNEL_CONFIG, null, 2)
        );
        console.log('✅ Updated ngrok-config.json with localtunnel URLs');

        // 2. Update vercel.json
        const vercelPath = path.join(__dirname, 'vercel.json');
        if (fs.existsSync(vercelPath)) {
            const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));

            // Update rewrites to use localtunnel
            if (vercelConfig.rewrites) {
                vercelConfig.rewrites = vercelConfig.rewrites.map(rewrite => {
                    if (rewrite.destination && rewrite.destination.includes('ngrok-free.app')) {
                        return {
                            ...rewrite,
                            destination: rewrite.destination.replace(/https:\/\/[a-z0-9]+\.ngrok-free\.app/, LOCALTUNNEL_CONFIG.apiDomain)
                        };
                    }
                    return rewrite;
                });
            }

            fs.writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2));
            console.log('✅ Updated vercel.json');
        }

        // 3. Update frontend runtime config
        const frontendConfigPath = path.join(__dirname, 'kelmah-frontend', 'public', 'runtime-config.json');
        const frontendConfig = {
            API_URL: LOCALTUNNEL_CONFIG.apiDomain,
            WS_URL: LOCALTUNNEL_CONFIG.wsDomain,
            NODE_ENV: 'production',
            timestamp: new Date().toISOString()
        };

        if (!fs.existsSync(path.dirname(frontendConfigPath))) {
            fs.mkdirSync(path.dirname(frontendConfigPath), { recursive: true });
        }

        fs.writeFileSync(frontendConfigPath, JSON.stringify(frontendConfig, null, 2));
        console.log('✅ Updated frontend runtime config');

        // 4. Update security config
        const securityConfigPath = path.join(__dirname, 'kelmah-frontend', 'src', 'config', 'securityConfig.js');
        if (fs.existsSync(securityConfigPath)) {
            let securityConfig = fs.readFileSync(securityConfigPath, 'utf8');

            // Update the domain in CSP
            const newDomain = LOCALTUNNEL_CONFIG.apiDomain.replace('https://', '');
            securityConfig = securityConfig.replace(/[a-z0-9]+\.ngrok-free\.app/g, newDomain);
            securityConfig = securityConfig.replace(/[a-z0-9]+\.loca\.lt/g, newDomain);

            fs.writeFileSync(securityConfigPath, securityConfig);
            console.log('✅ Updated securityConfig.js');
        }

        console.log('📋 Configuration update completed!');

    } catch (error) {
        console.error('❌ Error updating configurations:', error.message);
    }
}

async function testEndpoints() {
    console.log('\n🧪 Testing LocalTunnel Endpoints');
    console.log('================================');

    const endpoints = [
        { name: 'Health Check', url: `${LOCALTUNNEL_CONFIG.apiDomain}/health` },
        { name: 'Jobs API', url: `${LOCALTUNNEL_CONFIG.apiDomain}/api/jobs?limit=5` },
        { name: 'Dashboard Metrics', url: `${LOCALTUNNEL_CONFIG.apiDomain}/api/dashboard/metrics` },
        { name: 'Dashboard Workers', url: `${LOCALTUNNEL_CONFIG.apiDomain}/api/dashboard/workers` },
        { name: 'Dashboard Analytics', url: `${LOCALTUNNEL_CONFIG.apiDomain}/api/dashboard/analytics` },
        { name: 'Notifications (unauth)', url: `${LOCALTUNNEL_CONFIG.apiDomain}/api/notifications/unread` }
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(endpoint.url, {
                timeout: 10000,
                validateStatus: (status) => status < 500 // Accept 4xx as valid responses for auth-required endpoints
            });

            if (response.status === 200) {
                console.log(`✅ ${endpoint.name}: SUCCESS (${response.status})`);
            } else if (response.status === 401) {
                console.log(`🔐 ${endpoint.name}: AUTH REQUIRED (${response.status}) - Endpoint accessible`);
            } else {
                console.log(`⚠️  ${endpoint.name}: ${response.status} - ${response.statusText}`);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                console.log(`🔐 ${endpoint.name}: AUTH REQUIRED (401) - Endpoint accessible`);
            } else {
                console.log(`❌ ${endpoint.name}: ERROR - ${error.message}`);
            }
        }
    }
}

async function commitAndPush() {
    console.log('\n📝 Committing configuration changes...');

    return new Promise((resolve, reject) => {
        exec('git add . && git commit -m "Update to LocalTunnel URLs" && git push origin main', (error, stdout, stderr) => {
            if (error) {
                console.log('⚠️  Git commit/push failed (this is okay if no changes):', error.message);
            } else {
                console.log('✅ Committed and pushed to origin/main');
                console.log('📋 Deployed via Vercel after Git push to main');
            }
            resolve();
        });
    });
}

async function main() {
    await updateConfigurations();
    await testEndpoints();
    await commitAndPush();

    console.log('\n🎉 LocalTunnel setup completed successfully!');
    console.log('🌐 Your backend is now accessible at:');
    console.log(`   API: ${LOCALTUNNEL_CONFIG.apiDomain}`);
    console.log(`   WebSocket: ${LOCALTUNNEL_CONFIG.wsDomain}`);
    console.log('\n🔄 LocalTunnel tunnels are running in background terminals');
    console.log('⏹️  To stop tunnels, close the terminal windows or press Ctrl+C');
}

main().catch(console.error);
