#!/usr/bin/env node
/**
 * Performance profiling script
 * Usage: npm run profile -- --script my-script [--iterations 1000]
 */

import { performance } from 'perf_hooks';
import { resolve } from 'path';

interface ProfileOptions {
  script?: string;
  iterations?: number;
}

function parseArgs(): ProfileOptions {
  const args = process.argv.slice(2);
  const opts: ProfileOptions = {
    iterations: 1000
  };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--script' && args[i + 1]) {
      opts.script = args[++i];
    } else if (args[i] === '--iterations' && args[i + 1]) {
      opts.iterations = parseInt(args[++i], 10);
    }
  }
  
  return opts;
}

async function profileScript(scriptName: string, iterations: number = 1000) {
  try {
    const scriptPath = resolve(`scripts/${scriptName}/index.ts`);
    const module = await import(scriptPath);
    const script = module.default || module;
    
    if (typeof script !== 'function') {
      throw new Error('Script does not export a default function');
    }
    
    console.log(`\n📊 Performance Profile: ${scriptName}`);
    console.log('═'.repeat(50));
    console.log(`Running ${iterations} iterations...\n`);
    
    for (let i = 0; i < 10; i++) {
      await script();
    }
    
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      await script();
    }
    
    const end = performance.now();
    const totalTime = end - start;
    const avgTime = totalTime / iterations;
    const opsPerSecond = 1000 / avgTime;
    
    console.log(`📈 Results:`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average: ${avgTime.toFixed(4)}ms per run`);
    console.log(`   Throughput: ${opsPerSecond.toFixed(0)} ops/sec`);
    
    if (avgTime > 100) {
      console.log(`   ⚠️  Slow: Consider optimization`);
    } else if (avgTime > 10) {
      console.log(`   ⏱️  Moderate performance`);
    } else {
      console.log(`   ✅ Good performance`);
    }
    
    console.log('═'.repeat(50) + '\n');
  } catch (error) {
    console.error(`❌ Error profiling ${scriptName}:`, error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

const opts = parseArgs();

if (!opts.script) {
  console.log(`Usage: npm run profile -- --script <script-name> [--iterations 1000]`);
  console.log(`\nExamples:`);
  console.log(`  npm run profile -- --script just-written`);
  console.log(`  npm run profile -- --script github-auto-approve --iterations 5000`);
  process.exit(1);
}

profileScript(opts.script, opts.iterations);
