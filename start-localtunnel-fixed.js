const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class LocalTunnelManager {
    constructor() {
        this.configPath = path.join(__dirname, 'ngrok-config.json'); // Use same config file as ngrok
        this.tunnels = [];
        this.isRunning = false;
        // NEW: Support for unified vs dual tunnel modes
        // UNIFIED MODE is now the DEFAULT for best practices
        this.unifiedMode = process.env.DUAL_WEBSOCKET !== 'true' && !process.argv.includes('--dual');
    }

    async startTunnels() {
        console.log('🎯 Kelmah LocalTunnel Manager');
        console.log('============================');

        if (this.unifiedMode) {
            console.log('� UNIFIED MODE: Single tunnel for HTTP + WebSocket');
        } else {
            console.log('🔀 DUAL MODE: Separate tunnels for HTTP and WebSocket');
        }

        console.log('�🚀 Starting LocalTunnel tunnels...');

        try {
            // Start API Gateway tunnel (port 5000)
            const apiTunnel = await this.createTunnel(5000, 'kelmah-api');
            console.log(`✅ API Gateway tunnel started: ${apiTunnel}`);

            let wsTunnel;
            let config;

            if (this.unifiedMode) {
                // UNIFIED MODE: Use API Gateway for everything
                wsTunnel = apiTunnel; // Same URL for WebSocket
                console.log(`🔗 WebSocket will use API Gateway: ${apiTunnel}/socket.io`);

                config = {
                    apiDomain: apiTunnel,
                    wsDomain: apiTunnel, // Same URL
                    mode: 'unified',
                    timestamp: new Date().toISOString(),
                    status: 'active'
                };
            } else {
                // DUAL MODE: Separate tunnel for WebSocket
                wsTunnel = await this.createTunnel(5005, 'kelmah-ws');
                console.log(`✅ WebSocket tunnel started: ${wsTunnel}`);

                config = {
                    apiDomain: apiTunnel,
                    wsDomain: wsTunnel,
                    mode: 'dual',
                    timestamp: new Date().toISOString(),
                    status: 'active'
                };
            }

            console.log(`📡 Primary URL (API): ${apiTunnel}`);
            console.log(`🔌 WebSocket URL: ${wsTunnel}`);

            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
            console.log(`💾 Config saved to: ${this.configPath}`);

            // Update configuration files
            await this.updateConfigFiles(config);
            await this.commitAndPush();

            console.log('🎉 Configuration updated and pushed successfully!');
            console.log('📋 Deployed via Vercel after Git push to main.');
            console.log('');
            console.log('🎉 SUCCESS! Your backend is now accessible at:');
            console.log(`🌐 ${apiTunnel}`);

            if (this.unifiedMode) {
                console.log('');
                console.log('🔗 UNIFIED ARCHITECTURE:');
                console.log(`   HTTP API: ${apiTunnel}/api/*`);
                console.log(`   WebSocket: ${apiTunnel}/socket.io`);
                console.log('   ✅ Single domain for all traffic');
            }

            console.log('');
            console.log('📋 What happens next:');
            console.log('1. ✅ localtunnel tunnels are running');
            console.log('2. ✅ Frontend config files updated');
            console.log('3. ✅ No browser warning pages (LocalTunnel advantage)');
            console.log('4. 🔄 Ready to deploy to Vercel');
            console.log('');
            console.log('🚀 To deploy:');
            console.log('   git add .');
            console.log('   git commit -m "Update localtunnel URL"');
            console.log('   git push origin main');
            console.log('');
            console.log('⏹️  Press Ctrl+C to stop localtunnel');

            // Keep the process alive
            this.keepAlive();

        } catch (error) {
            console.error('❌ Error starting tunnels:', error.message);
            process.exit(1);
        }
    }

    createTunnel(port, subdomain) {
        return new Promise((resolve, reject) => {
            console.log(`🚀 Starting tunnel for port ${port}...`);

            // Try with specific subdomain first using npx
            const process = spawn('npx', ['localtunnel', '--port', port.toString(), '--subdomain', subdomain], {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true
            });

            let output = '';
            let resolved = false;

            process.stdout.on('data', (data) => {
                output += data.toString();
                const urlMatch = output.match(/your url is: (https:\/\/[^\s]+)/);

                if (urlMatch && !resolved) {
                    resolved = true;
                    this.tunnels.push(process);
                    resolve(urlMatch[1]);
                }
            });

            process.stderr.on('data', (data) => {
                const errorMsg = data.toString();
                if (errorMsg.includes('subdomain is not available') || errorMsg.includes('already in use')) {
                    // Try without specific subdomain
                    process.kill();
                    this.createTunnelRandomSubdomain(port).then(resolve).catch(reject);
                }
            });

            process.on('exit', (code) => {
                if (!resolved && code !== 0) {
                    // Try without specific subdomain as fallback
                    this.createTunnelRandomSubdomain(port).then(resolve).catch(reject);
                }
            });

            // Timeout fallback
            setTimeout(() => {
                if (!resolved) {
                    process.kill();
                    this.createTunnelRandomSubdomain(port).then(resolve).catch(reject);
                }
            }, 10000);
        });
    }

    createTunnelRandomSubdomain(port) {
        return new Promise((resolve, reject) => {
            console.log(`🔄 Trying random subdomain for port ${port}...`);

            const process = spawn('npx', ['localtunnel', '--port', port.toString()], {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true
            });

            let output = '';
            let resolved = false;

            process.stdout.on('data', (data) => {
                output += data.toString();
                const urlMatch = output.match(/your url is: (https:\/\/[^\s]+)/);

                if (urlMatch && !resolved) {
                    resolved = true;
                    this.tunnels.push(process);
                    resolve(urlMatch[1]);
                }
            });

            process.stderr.on('data', (data) => {
                console.error('LocalTunnel error:', data.toString());
            });

            process.on('exit', (code) => {
                if (!resolved) {
                    reject(new Error(`LocalTunnel process exited with code ${code}`));
                }
            });

            // Timeout
            setTimeout(() => {
                if (!resolved) {
                    process.kill();
                    reject(new Error('Timeout waiting for tunnel'));
                }
            }, 15000);
        });
    }

    async updateConfigFiles(config) {
        try {
            // Update root vercel.json (main project config)
            const rootVercelPath = path.join(__dirname, 'vercel.json');
            if (fs.existsSync(rootVercelPath)) {
                let vercelConfig = JSON.parse(fs.readFileSync(rootVercelPath, 'utf8'));

                // Update environment variables based on mode
                if (!vercelConfig.env) vercelConfig.env = {};
                vercelConfig.env.VITE_API_URL = config.apiDomain;
                vercelConfig.env.VITE_WS_URL = config.mode === 'unified' ? config.apiDomain : config.wsDomain;

                // Update build environment based on mode
                if (!vercelConfig.build) vercelConfig.build = {};
                if (!vercelConfig.build.env) vercelConfig.build.env = {};
                vercelConfig.build.env.VITE_API_URL = config.apiDomain;
                vercelConfig.build.env.VITE_WS_URL = config.mode === 'unified' ? config.apiDomain : config.wsDomain;

                // Update rewrites section based on mode
                if (vercelConfig.rewrites && Array.isArray(vercelConfig.rewrites)) {
                    vercelConfig.rewrites = vercelConfig.rewrites.map(rewrite => {
                        if (rewrite.source === "/api/(.*)") {
                            return {
                                ...rewrite,
                                destination: `${config.apiDomain}/api/$1`
                            };
                        }
                        if (rewrite.source === "/socket.io/(.*)") {
                            return {
                                ...rewrite,
                                destination: config.mode === 'unified'
                                    ? `${config.apiDomain}/socket.io/$1`  // UNIFIED: Route WebSocket through API Gateway
                                    : `${config.wsDomain}/socket.io/$1`   // DUAL: Use separate WebSocket tunnel
                            };
                        }
                        return rewrite;
                    });
                }

                fs.writeFileSync(rootVercelPath, JSON.stringify(vercelConfig, null, 2));
                console.log('✅ Updated root vercel.json');
            }

            // Update frontend vercel.json (specific to frontend deployment)
            const frontendVercelPath = path.join(__dirname, 'kelmah-frontend', 'vercel.json');
            if (fs.existsSync(frontendVercelPath)) {
                let frontendVercelConfig = JSON.parse(fs.readFileSync(frontendVercelPath, 'utf8'));

                // Update rewrites section based on mode
                if (frontendVercelConfig.rewrites && Array.isArray(frontendVercelConfig.rewrites)) {
                    frontendVercelConfig.rewrites = frontendVercelConfig.rewrites.map(rewrite => {
                        if (rewrite.source === "/api/(.*)") {
                            return {
                                ...rewrite,
                                destination: `${config.apiDomain}/api/$1`
                            };
                        }
                        if (rewrite.source === "/socket.io/(.*)") {
                            return {
                                ...rewrite,
                                destination: config.mode === 'unified'
                                    ? `${config.apiDomain}/socket.io/$1`  // UNIFIED: Route WebSocket through API Gateway
                                    : `${config.wsDomain}/socket.io/$1`   // DUAL: Use separate WebSocket tunnel
                            };
                        }
                        return rewrite;
                    });
                }

                fs.writeFileSync(frontendVercelPath, JSON.stringify(frontendVercelConfig, null, 2));
                console.log(`✅ Updated frontend vercel.json for ${config.mode?.toUpperCase() || 'DUAL'} mode`);
            }

            // Update securityConfig.js exactly like ngrok script
            const securityConfigPath = path.join(__dirname, 'kelmah-frontend', 'src', 'config', 'securityConfig.js');
            if (fs.existsSync(securityConfigPath)) {
                let securityConfig = fs.readFileSync(securityConfigPath, 'utf8');

                // Extract domain from API URL
                const apiDomain = config.apiDomain.replace('https://', '');
                const wsDomain = config.wsDomain.replace('https://', '');

                // Replace any existing ngrok or localtunnel domains
                securityConfig = securityConfig.replace(/[a-zA-Z0-9-]+\.ngrok-free\.app/g, apiDomain);
                securityConfig = securityConfig.replace(/[a-zA-Z0-9-]+\.loca\.lt/g, apiDomain);

                fs.writeFileSync(securityConfigPath, securityConfig);
                console.log('✅ Updated securityConfig.js');
            }

            // Create frontend runtime config with unified mode support
            const frontendConfigDir = path.join(__dirname, 'kelmah-frontend', 'public');
            const runtimeConfigPath = path.join(frontendConfigDir, 'runtime-config.json');

            // Ensure directory exists
            if (!fs.existsSync(frontendConfigDir)) {
                fs.mkdirSync(frontendConfigDir, { recursive: true });
            }

            const runtimeConfig = {
                ngrokUrl: config.apiDomain,              // Frontend looks for 'ngrokUrl'
                websocketUrl: config.mode === 'unified'
                    ? config.apiDomain.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')  // Use API Gateway for WebSocket
                    : config.wsDomain.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:'),  // Use dedicated WebSocket tunnel
                API_URL: config.apiDomain,               // Backup field
                WS_URL: config.mode === 'unified' ? config.apiDomain : config.wsDomain, // Unified or separate
                NODE_ENV: 'production',
                TUNNEL_TYPE: 'localtunnel',
                WEBSOCKET_MODE: config.mode || 'dual',   // Track which mode we're using
                isDevelopment: true,                     // Indicate this is dev setup
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            };

            fs.writeFileSync(runtimeConfigPath, JSON.stringify(runtimeConfig, null, 2));
            console.log(`✅ Created frontend runtime config for ${config.mode?.toUpperCase() || 'DUAL'} mode`);

        } catch (error) {
            console.warn('⚠️  Could not update all config files:', error.message);
        }
    }

    async commitAndPush() {
        console.log('\n⚠️  SKIPPING AUTO-COMMIT: Frontend now intelligently detects available backends');
        console.log('ℹ️  The frontend will automatically use:');
        console.log('   1. Render backend (if available)');
        console.log('   2. LocalTunnel backend (if Render is down)');
        console.log('\n💡 To manually update config, run:');
        console.log('   git add .');
        console.log('   git commit -m "Update LocalTunnel URL"');
        console.log('   git push origin main');
        return Promise.resolve();
    }

    keepAlive() {
        this.isRunning = true;

        // Handle graceful shutdown exactly like ngrok script
        process.on('SIGINT', () => {
            console.log('\n🛑 Stopping LocalTunnel tunnels...');

            // Kill all tunnel processes
            this.tunnels.forEach(tunnel => {
                if (tunnel && !tunnel.killed) {
                    tunnel.kill();
                }
            });

            this.isRunning = false;
            console.log('✅ All tunnels stopped');
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log('\n🛑 Received SIGTERM, stopping tunnels...');
            this.tunnels.forEach(tunnel => {
                if (tunnel && !tunnel.killed) {
                    tunnel.kill();
                }
            });
            this.isRunning = false;
            process.exit(0);
        });

        // Keep process alive and monitor tunnels
        const keepAliveInterval = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(keepAliveInterval);
                return;
            }

            // Check if tunnels are still running
            let activeTunnels = 0;
            this.tunnels.forEach(tunnel => {
                if (tunnel && !tunnel.killed) {
                    activeTunnels++;
                }
            });

            if (activeTunnels === 0 && this.tunnels.length > 0) {
                console.log('⚠️  All tunnels have stopped unexpectedly');
                this.isRunning = false;
                process.exit(1);
            }
        }, 5000);

        // Log status every 30 seconds
        setInterval(() => {
            if (this.isRunning) {
                console.log(`🔄 LocalTunnel status: ${this.tunnels.length} tunnel(s) active`);
            }
        }, 30000);
    }
}

// Start if called directly
if (require.main === module) {
    const manager = new LocalTunnelManager();
    manager.startTunnels();
}

module.exports = LocalTunnelManager;
