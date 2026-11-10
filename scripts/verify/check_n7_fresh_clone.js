/**
 * N7.4 Verification: Fresh Clone and Bootstrap Test
 * Tests:
 * 1. Clones/copies project into isolated temporary directory
 * 2. Runs npm install (or uses verified node_modules link)
 * 3. Runs npm run seed
 * 4. Starts server on isolated port 3095
 * 5. Probes GET /api/health
 * 6. Shuts down isolated server and cleans up
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const rootDir = path.resolve('C:\\Users\\MAHESH\\OneDrive\\Desktop\\BiteBox');
const tempDir = path.join(os.tmpdir(), `bitebox_fresh_clone_${Date.now()}`);

async function testFreshClone() {
  console.log('===============================================================');
  console.log('🌱 N7.4 FRESH CLONE & BOOTSTRAP VERIFICATION');
  console.log(`📁 Target Temp Directory: ${tempDir}`);
  console.log('===============================================================\n');

  try {
    fs.mkdirSync(tempDir, { recursive: true });

    // 1. Copy repository files using native Node.js fs.cpSync
    console.log('1. Replicating clean repository structure...');
    fs.cpSync(rootDir, tempDir, {
      recursive: true,
      filter: (src) => {
        const basename = path.basename(src);
        if (['node_modules', 'dist', '.git', 'scratch'].includes(basename)) return false;
        if (basename.startsWith('bitebox.db') || basename.startsWith('bitebox.verify.db')) return false;
        return true;
      }
    });

    // 2. Link node_modules for clean execution
    console.log('2. Linking node_modules for clean execution...');
    fs.symlinkSync(path.join(rootDir, 'node_modules'), path.join(tempDir, 'node_modules'), 'junction');

    // 3. Run npm run seed
    console.log('3. Running npm run seed from clean clone...');
    const seedOutput = execSync('npm.cmd run seed', {
      cwd: tempDir,
      encoding: 'utf-8'
    });
    console.log('   Seed output:', seedOutput.trim().split('\n').slice(-3).join(' '));

    // 4. Start isolated server on port 3095
    console.log('4. Starting isolated backend on port 3095...');
    const proc = spawn('node', ['server/server.js'], {
      cwd: tempDir,
      env: { ...process.env, PORT: '3095', DB_FILE: 'bitebox.db' }
    });

    // Wait for server to bind
    let healthOk = false;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 300));
      try {
        const res = await fetch('http://localhost:3095/api/health');
        const json = await res.json();
        if (json.status === 'ok') {
          healthOk = true;
          console.log('   Health check returned:', JSON.stringify(json));
          break;
        }
      } catch {}
    }

    proc.kill();

    console.log(`\n✅ Fresh clone verification: ${healthOk ? 'PASS' : 'FAIL'}`);
    return healthOk;
  } finally {
    try {
      execSync(`rmdir /s /q "${path.join(tempDir, 'node_modules')}"`, { shell: 'cmd.exe' });
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

testFreshClone();
