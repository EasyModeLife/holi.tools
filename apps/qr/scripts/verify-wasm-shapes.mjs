#!/usr/bin/env node
/**
 * QR Shape Verification Script
 * 
 * Uses the WASM module to generate QR codes with all shape combinations
 * and verifies they render correctly.
 * 
 * Usage: node scripts/verify-wasm-shapes.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Shape definitions (must match Rust enums)
const BODY_SHAPES = [
    'square', 'rounded', 'dots', 'diamond', 'star', 'classy', 'classy-rounded',
    'arrow', 'arrow-left', 'heart', 'hexagon', 'octagon', 'cross', 'plus',
    'blob', 'clover', 'mini-square', 'tiny-dots', 'hash', 'leaf'
];

const EYE_FRAME_SHAPES = [
    'square', 'circle', 'rounded', 'leaf', 'cushion', 'double',
    'fancy', 'dots-square', 'heavy-rounded', 'clover-frame'
];

const EYE_BALL_SHAPES = [
    'square', 'circle', 'diamond', 'rounded', 'star', 'heart', 'hexagon',
    'bars-h', 'bars-v', 'dots-grid', 'flower', 'clover', 'cushion', 'octagon'
];

async function loadWasm() {
    // Script is at /apps/qr/scripts/
    // WASM is at /packages/wasm-qr/pkg/
    const wasmPath = join(__dirname, '..', '..', '..', 'packages', 'wasm-qr', 'pkg', 'holi_wasm_qr.js');

    if (!existsSync(wasmPath)) {
        console.error('❌ WASM module not found at:', wasmPath);
        console.error('   Run: cd packages/wasm-qr && wasm-pack build --target nodejs');
        process.exit(1);
    }

    // For Node.js target, wasm-pack generates CommonJS module that self-initializes
    // We need to use createRequire to load it as CJS in ESM context
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    const mod = require(wasmPath);
    return mod;
}

function validateSvg(svg) {
    const issues = [];

    if (!svg || svg.length === 0) {
        issues.push('Empty SVG');
        return { valid: false, issues };
    }

    if (!svg.startsWith('<svg')) {
        issues.push('Does not start with <svg');
    }

    if (!svg.includes('</svg>')) {
        issues.push('Missing </svg>');
    }

    if (svg.includes('NaN') || svg.includes('undefined')) {
        issues.push('Contains NaN or undefined');
    }

    // Check for path elements
    const pathCount = (svg.match(/<path/g) || []).length;
    if (pathCount === 0) {
        issues.push('No path elements found');
    }

    return {
        valid: issues.length === 0,
        issues,
        pathCount,
        length: svg.length
    };
}

async function main() {
    console.log('🔍 QR WASM Shape Verification\n');
    console.log('='.repeat(60) + '\n');

    // Load WASM
    console.log('📦 Loading WASM module...');
    let wasm;
    try {
        wasm = await loadWasm();
        console.log(`✅ WASM loaded: ${wasm.qr_version()}\n`);
    } catch (e) {
        console.error('❌ Failed to load WASM:', e.message);

        // Try to build it
        console.log('\n🔧 Attempting to build WASM...');
        const { execSync } = await import('child_process');
        try {
            execSync('cd packages/wasm-qr && wasm-pack build --target nodejs', {
                cwd: join(__dirname, '..', '..'),
                stdio: 'inherit'
            });
            wasm = await loadWasm();
        } catch (buildErr) {
            console.error('❌ Build failed:', buildErr.message);
            process.exit(1);
        }
    }

    const testText = 'https://holi.tools';
    const results = {
        body: [],
        eyeFrame: [],
        eyeBall: [],
        combos: []
    };

    const outputDir = join(__dirname, '..', 'test-output', 'wasm-shapes');
    mkdirSync(outputDir, { recursive: true });

    // Test body shapes
    console.log('📦 BODY SHAPES\n');
    for (const shape of BODY_SHAPES) {
        try {
            const options = JSON.stringify({
                body_shape: shape,
                fg_color: '#000000',
                bg_color: '#FFFFFF'
            });
            const svg = wasm.generate_styled_svg(testText, options);
            const validation = validateSvg(svg);

            const status = validation.valid ? '✅' : '❌';
            console.log(`${status} ${shape.padEnd(18)} paths:${validation.pathCount} len:${svg.length}`);

            results.body.push({
                shape,
                valid: validation.valid,
                issues: validation.issues
            });

            // Save SVG
            writeFileSync(join(outputDir, `body-${shape}.svg`), svg);

        } catch (e) {
            console.log(`❌ ${shape.padEnd(18)} ERROR: ${e.message}`);
            results.body.push({ shape, valid: false, issues: [e.message] });
        }
    }

    console.log('\n🎯 EYE FRAME SHAPES\n');
    for (const shape of EYE_FRAME_SHAPES) {
        try {
            const options = JSON.stringify({
                eye_frame_shape: shape,
                fg_color: '#000000',
                bg_color: '#FFFFFF'
            });
            const svg = wasm.generate_styled_svg(testText, options);
            const validation = validateSvg(svg);

            const status = validation.valid ? '✅' : '❌';
            console.log(`${status} ${shape.padEnd(18)} paths:${validation.pathCount} len:${svg.length}`);

            results.eyeFrame.push({
                shape,
                valid: validation.valid,
                issues: validation.issues
            });

            writeFileSync(join(outputDir, `eyeframe-${shape}.svg`), svg);

        } catch (e) {
            console.log(`❌ ${shape.padEnd(18)} ERROR: ${e.message}`);
            results.eyeFrame.push({ shape, valid: false, issues: [e.message] });
        }
    }

    console.log('\n👁️ EYE BALL SHAPES\n');
    for (const shape of EYE_BALL_SHAPES) {
        try {
            const options = JSON.stringify({
                eye_ball_shape: shape,
                fg_color: '#000000',
                bg_color: '#FFFFFF'
            });
            const svg = wasm.generate_styled_svg(testText, options);
            const validation = validateSvg(svg);

            const status = validation.valid ? '✅' : '❌';
            console.log(`${status} ${shape.padEnd(18)} paths:${validation.pathCount} len:${svg.length}`);

            results.eyeBall.push({
                shape,
                valid: validation.valid,
                issues: validation.issues
            });

            writeFileSync(join(outputDir, `eyeball-${shape}.svg`), svg);

        } catch (e) {
            console.log(`❌ ${shape.padEnd(18)} ERROR: ${e.message}`);
            results.eyeBall.push({ shape, valid: false, issues: [e.message] });
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 SUMMARY\n');

    const bodyPassed = results.body.filter(r => r.valid).length;
    const framePassed = results.eyeFrame.filter(r => r.valid).length;
    const ballPassed = results.eyeBall.filter(r => r.valid).length;

    console.log(`Body Shapes:      ${bodyPassed}/${BODY_SHAPES.length} passed`);
    console.log(`Eye Frame Shapes: ${framePassed}/${EYE_FRAME_SHAPES.length} passed`);
    console.log(`Eye Ball Shapes:  ${ballPassed}/${EYE_BALL_SHAPES.length} passed`);

    // Generate HTML preview
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>WASM Shape Verification</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 20px; background: #1a1a1a; color: #eee; }
        h1 { color: #4CAF50; }
        h2 { color: #2196F3; border-bottom: 1px solid #333; padding-bottom: 8px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; }
        .card { background: #2a2a2a; padding: 12px; border-radius: 8px; text-align: center; }
        .card img { width: 100%; background: white; border-radius: 4px; }
        .card .name { margin-top: 8px; font-size: 12px; }
        .pass { border: 2px solid #4CAF50; }
        .fail { border: 2px solid #f44336; }
    </style>
</head>
<body>
    <h1>🔍 WASM Shape Verification</h1>
    <p>Generated by Rust core via WASM</p>
    
    <h2>📦 Body Shapes (${bodyPassed}/${BODY_SHAPES.length})</h2>
    <div class="grid">
        ${BODY_SHAPES.map(s => `
            <div class="card ${results.body.find(r => r.shape === s)?.valid ? 'pass' : 'fail'}">
                <img src="body-${s}.svg" alt="${s}">
                <div class="name">${s}</div>
            </div>
        `).join('')}
    </div>
    
    <h2>🎯 Eye Frame Shapes (${framePassed}/${EYE_FRAME_SHAPES.length})</h2>
    <div class="grid">
        ${EYE_FRAME_SHAPES.map(s => `
            <div class="card ${results.eyeFrame.find(r => r.shape === s)?.valid ? 'pass' : 'fail'}">
                <img src="eyeframe-${s}.svg" alt="${s}">
                <div class="name">${s}</div>
            </div>
        `).join('')}
    </div>
    
    <h2>👁️ Eye Ball Shapes (${ballPassed}/${EYE_BALL_SHAPES.length})</h2>
    <div class="grid">
        ${EYE_BALL_SHAPES.map(s => `
            <div class="card ${results.eyeBall.find(r => r.shape === s)?.valid ? 'pass' : 'fail'}">
                <img src="eyeball-${s}.svg" alt="${s}">
                <div class="name">${s}</div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;

    writeFileSync(join(outputDir, 'index.html'), htmlContent);
    console.log(`\n📁 Preview saved to: ${join(outputDir, 'index.html')}`);

    const allPassed = bodyPassed === BODY_SHAPES.length &&
        framePassed === EYE_FRAME_SHAPES.length &&
        ballPassed === EYE_BALL_SHAPES.length;

    process.exit(allPassed ? 0 : 1);
}

main().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});
