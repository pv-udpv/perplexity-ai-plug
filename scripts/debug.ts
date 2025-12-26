#!/usr/bin/env node
/**
 * Debug helper script for development
 * Usage: npm run debug -- --script my-script --verbose
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

interface DebugOptions {
  script?: string;
  verbose?: boolean;
}

function parseArgs(): DebugOptions {
  const args = process.argv.slice(2);
  const opts: DebugOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--script' && args[i + 1]) {
      opts.script = args[++i];
    } else if (args[i] === '--verbose') {
      opts.verbose = true;
    }
  }
  
  return opts;
}

function debugScript(scriptName: string, verbose: boolean = false) {
  try {
    const scriptPath = resolve(`scripts/${scriptName}`);
    let manifestContent: string;
    
    try {
      manifestContent = readFileSync(resolve(`scripts/${scriptName}/manifest.ts`), 'utf-8');
    } catch {
      try {
        manifestContent = readFileSync(resolve(`scripts/${scriptName}/manifest.js`), 'utf-8');
      } catch {
        throw new Error(`Could not find manifest for ${scriptName}`);
      }
    }
    
    console.log(`\n🗐  Debugging ${scriptName}`);
    console.log('═'.repeat(50));
    
    const nameMatch = manifestContent.match(/@name\s+([^\n]+)/);
    const versionMatch = manifestContent.match(/@version\s+([^\n]+)/);
    const matchMatch = manifestContent.match(/@match\s+([^\n]+)/);
    const grantMatch = manifestContent.match(/@grant\s+([^\n]+)/);
    
    if (nameMatch) console.log(`📝 Name: ${nameMatch[1]}`);
    if (versionMatch) console.log(`📌 Version: ${versionMatch[1]}`);
    if (matchMatch) console.log(`🌐 Match: ${matchMatch[1]}`);
    if (grantMatch) console.log(`🔐 Grant: ${grantMatch[1]}`);
    
    if (verbose) {
      try {
        const indexPath = resolve(`scripts/${scriptName}/index.ts`);
        const indexContent = readFileSync(indexPath, 'utf-8');
        console.log(`\n📊 Metrics:`);
        console.log(`   TypeScript: ${indexContent.length} bytes`);
        console.log(`   Lines: ${indexContent.split('\n').length}`);
        
        const importCount = (indexContent.match(/^import /gm) || []).length;
        console.log(`   Imports: ${importCount}`);
        
        const funcCount = (indexContent.match(/^(async\s+)?function\s+/gm) || []).length + 
                         (indexContent.match(/\s+=\s+(async\s+)?\(/gm) || []).length;
        console.log(`   Functions: ${funcCount}`);
      } catch (e) {
        console.log(`   (Could not read index.ts)`);
      }
    }
    
    console.log('═'.repeat(50) + '\n');
  } catch (error) {
    console.error(`❌ Error debugging ${scriptName}:`, error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

const opts = parseArgs();

if (!opts.script) {
  console.log(`Usage: npm run debug -- --script <script-name> [--verbose]`);
  console.log(`\nExamples:`);
  console.log(`  npm run debug -- --script just-written`);
  console.log(`  npm run debug -- --script github-auto-approve --verbose`);
  process.exit(1);
}

debugScript(opts.script, opts.verbose);
