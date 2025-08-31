const ngrok = require('ngrok');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

/**
 * Enhanced ngrok Manager for Kelmah Backend
 * Automatically updates frontend configuration when ngrok URL changes
 */

class NgrokManager {
  constructor() {
    this.configPath = path.join(__dirname, 'ngrok-config.json');
    this.vercelConfigPath = path.join(__dirname, 'kelmah-frontend', 'vercel.json');
    this.securityConfigPath = path.join(__dirname, 'kelmah-frontend', 'src', 'config', 'securityConfig.js');
    this.repoRoot = __dirname;
  }

  async start() {
    try {
      console.log('🚀 Starting ngrok tunnels...');
      
      // Start ngrok tunnel on port 3000 (API Gateway) for HTTP requests
      const apiUrl = await ngrok.connect(3000);
      console.log('✅ API Gateway tunnel started:', apiUrl);
      
      // Start ngrok tunnel on port 3005 (Messaging Service) for WebSocket connections
      const wsUrl = await ngrok.connect(3005);
      console.log('✅ WebSocket tunnel started:', wsUrl);

      // Use API Gateway URL as primary for HTTP requests
      const publicUrl = apiUrl;
      console.log('📡 Primary URL (API):', publicUrl);
      console.log('🔌 WebSocket URL:', wsUrl);

      // Save to config file
      await this.saveConfig(apiUrl, wsUrl);
      
      // Update frontend configuration
      await this.updateFrontendConfig(apiUrl, wsUrl);
      
      // Auto-commit and push the minimal set of files to trigger Vercel deploy
      await this.commitAndPush(apiUrl);
      
      console.log('🎉 Configuration updated and pushed successfully!');
      console.log('📋 Deployed via Vercel after Git push to main.');
      
      return publicUrl;
      
    } catch (error) {
      console.error('❌ Error starting ngrok:', error);
      throw error;
    }
  }

  async saveConfig(apiUrl, wsUrl) {
    const config = {
      apiDomain: apiUrl,
      wsDomain: wsUrl,
      timestamp: new Date().toISOString(),
      status: 'active'
    };
    
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    console.log('💾 Config saved to:', this.configPath);
  }

  async updateFrontendConfig(apiUrl, wsUrl) {
    try {
      // Update vercel.json
      const vercelConfig = JSON.parse(await fs.readFile(this.vercelConfigPath, 'utf8'));
      vercelConfig.rewrites[0].destination = `${apiUrl}/api/$1`;  // API Gateway
      vercelConfig.rewrites[1].destination = `${wsUrl}/socket.io/$1`;  // Messaging Service
      await fs.writeFile(this.vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
      console.log('✅ Updated vercel.json');

      // Update securityConfig.js
      let securityConfig = await fs.readFile(this.securityConfigPath, 'utf8');
      const urlRegex = /https:\/\/[a-zA-Z0-9-]+\.ngrok-free\.app/g;
      // Replace old URLs with new API Gateway URL
      securityConfig = securityConfig.replace(urlRegex, apiUrl);
      await fs.writeFile(this.securityConfigPath, securityConfig);
      console.log('✅ Updated securityConfig.js');

      // Create frontend runtime config for dynamic URL loading
      const frontendConfigPath = path.join(__dirname, 'kelmah-frontend', 'public', 'runtime-config.json');
      const runtimeConfig = {
        ngrokUrl: apiUrl,
        websocketUrl: wsUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:'),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
      await fs.writeFile(frontendConfigPath, JSON.stringify(runtimeConfig, null, 2));
      console.log('✅ Created frontend runtime config');

    } catch (error) {
      console.error('⚠️ Warning: Could not update frontend config:', error.message);
    }
  }

  async commitAndPush(url) {
    try {
      // Ensure git identity exists to avoid commit failures
      try {
        const name = execSync('git config user.name', { cwd: this.repoRoot }).toString().trim();
        const email = execSync('git config user.email', { cwd: this.repoRoot }).toString().trim();
        if (!name) execSync('git config user.name "Kelmah Bot"', { cwd: this.repoRoot });
        if (!email) execSync('git config user.email "bot@kelmah.local"', { cwd: this.repoRoot });
      } catch (_) {
        execSync('git config user.name "Kelmah Bot"', { cwd: this.repoRoot });
        execSync('git config user.email "bot@kelmah.local"', { cwd: this.repoRoot });
      }

      // Stage only the files we changed
      execSync(`git add "${path.relative(this.repoRoot, this.vercelConfigPath)}" "${path.relative(this.repoRoot, this.securityConfigPath)}" "${path.relative(this.repoRoot, this.configPath)}"`, { cwd: this.repoRoot, stdio: 'pipe' });

      // Create a commit if there are staged changes
      try {
        execSync(`git commit -m "chore(frontend): update ngrok URL to ${url}"`, { cwd: this.repoRoot, stdio: 'pipe' });
        console.log('📝 Committed ngrok URL update');
      } catch (e) {
        const msg = (e && e.stderr ? e.stderr.toString() : '').toLowerCase();
        if (msg.includes('nothing to commit')) {
          console.log('ℹ️ No changes to commit');
        } else {
          throw e;
        }
      }

      // Push to main; if rejected, inform user succinctly
      try {
        console.log('⬆️  Pushing to origin/main...');
        execSync('git push origin main', { cwd: this.repoRoot, stdio: 'pipe' });
        console.log('✅ Pushed to origin/main');
      } catch (e) {
        console.log('⚠️ Push failed (likely remote ahead). Minimal instructions:');
        console.log('   1) Resolve on GitHub web (edit files directly) or');
        console.log('   2) Run: git pull --rebase origin main && git push origin main');
        throw e;
      }
    } catch (error) {
      console.error('❌ Auto-commit/push failed:', (error && error.message) ? error.message : error);
    }
  }

  async getCurrentUrl() {
    try {
      const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
      return config.apiDomain || config.domain; // Backward compatibility
    } catch (error) {
      return null;
    }
  }

  async stop() {
    try {
      await ngrok.kill(); // This kills all ngrok tunnels
      console.log('🛑 All ngrok tunnels stopped');
    } catch (error) {
      console.error('❌ Error stopping ngrok:', error);
    }
  }
}

// Auto-start if run directly
if (require.main === module) {
  const manager = new NgrokManager();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    await manager.stop();
    process.exit(0);
  });

  manager.start().catch(console.error);
}

module.exports = NgrokManager;
