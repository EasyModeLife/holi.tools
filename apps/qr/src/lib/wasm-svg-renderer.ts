/**
 * Ultra-Light Rust SVG Renderer
 * Uses wasm-qr-svg (27KB) to generate optimized Path data
 */

import init, { generate_svg } from '../../../../packages/wasm-qr-svg/pkg/holi_qr_svg.js';
import { drawAllFinderPatterns } from './shapes/finder-renderer';

export interface RenderConfig {
    // Colors
    fgColor?: string;
    bgColor?: string; // If transparent, use 'transparent' or null

    // Gradient
    gradientEnabled?: boolean;
    gradientType?: 'linear' | 'radial';
    gradientColors?: string[]; // [start, end]
    gradientAngle?: number;

    // Shapes
    bodyShape?: 'square' | 'dots' | 'rounded' | string;
    eyeFrameShape?: string; // Not implemented in Rust yet
    eyeBallShape?: string; // Not implemented in Rust yet

    // Logo
    logo?: string; // Data URL or URL
    logoSize?: number; // 0.1 to 0.5 (percent of QR size)

    // Effects (Expert)
    effectLiquid?: boolean; // New independent flag
    effectBlur?: number; // Default 0.35
    effectCrystalize?: number; // Default -6 (Threshold)

    // Data Config
    ecc?: 'L' | 'M' | 'Q' | 'H';
    mask?: number; // 0-7 or -1/undefined
}

export class WasmSvgRenderer {
    private containerId: string;
    private initialized = false;

    constructor(containerId: string) {
        this.containerId = containerId;
    }

    async init() {
        if (this.initialized) return;
        try {
            await init(); // Load WASM module
            console.log("📐 WASM SVG Renderer Initialized (<10KB)");
            this.initialized = true;
        } catch (e) {
            console.error("❌ SVG Renderer Failed:", e);
        }
    }

    /**
     * Live-updates filter params without regenerating the SVG (60fps capable)
     * Only works if a QR with liquid effect is already rendered.
     */
    updateFilterParams(blur: number, thresh: number) {
        const blurEl = document.getElementById('qr-blur-el');
        const matrixEl = document.getElementById('qr-matrix-el');

        if (blurEl) {
            blurEl.setAttribute('stdDeviation', blur.toString());
        }
        if (matrixEl) {
            // Matrix: 1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 [contrast] -[thresh]
            matrixEl.setAttribute('values', `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -${thresh}`);
        }
    }

    /**
     * Generates SVG via Rust and injects into DOM
     * @param text Content to encode
     * @param config Optional customization
     */
    /**
     * Generates SVG via Rust and injects into DOM
     * @param text Content to encode
     * @param config Optional customization
     */
    async render(text: string, config?: RenderConfig) {
        if (!this.initialized) await this.init();

        try {
            const svgString = await this.getSVG(text, config);

            // 4. Inject into DOM
            const container = document.getElementById(this.containerId);
            if (container) {
                container.innerHTML = svgString;
            }
        } catch (e) {
            console.error("Error rendering SVG:", e);
        }
    }

    /**
     * Generate SVG string without injecting into DOM
     * Useful for Export/Copy functionality in WebGL-only mode
     */
    async getSVG(content: string, config?: RenderConfig): Promise<string> {
        if (!this.initialized) await this.init();

        // 1. Generate Base Path from WASM
        // Options: 0 = Square, 1 = Dots, 2 = Rounded, 3 = Diamond, 4 = Star, 5 = Clover, 6 = Tiny-Dot, 7 = H-Bars
        let shapeId = 0;
        switch (config?.bodyShape) {
            case 'dots': shapeId = 1; break;
            case 'rounded': shapeId = 2; break;
            case 'diamond': shapeId = 3; break;
            case 'star': shapeId = 4; break;
            case 'clover': shapeId = 5; break;
            case 'tiny-dots': shapeId = 6; break;
            case 'classy': shapeId = 7; break; // H-Bars
            default: shapeId = 0;
        }

        // Generate raw SVG path from Rust
        const ecc = config?.ecc || 'M';
        const mask = (config?.mask === undefined || config?.mask === null) ? -1 : config.mask;
        let svgString = generate_svg(content, shapeId, ecc, mask);

        // 2. Determine Filter Usage
        const useLiquidFilter = config?.effectLiquid ?? false;

        // 3. Post-Process SVG for Styles

        // --- Colors & Gradients ---
        let fillAttr = 'fill="currentColor"';
        let defs = '';
        const uuid = 'grad-' + Math.random().toString(36).substring(2, 11);
        // STABLE Filter ID for live updates
        const filterId = 'qr-goo-filter';

        // Define Gooey Filter if needed
        if (useLiquidFilter) {
            // --- UNIFIED MATH CALIBRATION ---
            // Goal: Match WebGL visual appearance exactly.
            // WebGL: Uses fixed 512px canvas. Blur 1.0 = 10px radius.
            //        Blur Fraction = 10 / 512 = ~0.0195 (1.95% of image width).
            // SVG:   Uses "Module" units (viewBox size). 
            //        To match 1.95% width, we must scale by the viewBox size.

            // 1. Get ViewBox Size (Modules)
            let viewBoxSize = 29; // Fallback default
            const vbMatch = svgString.match(/viewBox="0 0 (\d+) (\d+)"/);
            if (vbMatch) {
                viewBoxSize = parseInt(vbMatch[1]);
            }

            // 2. Calculate Calibration Factor
            // factor = (WebGL_Max_Blur_Px / WebGL_Canvas_Px) * SVG_Size
            // factor = (10.0 / 512.0) * viewBoxSize
            // stdDeviation = inputBlur * factor
            const CALIBRATION_FACTOR = (10.0 / 512.0) * viewBoxSize;

            // 3. Apply
            const rawBlur = config?.effectBlur ?? 0.35; // 0.1 to 2.0
            // We use a slightly boosted 2.5 multiplier because SVG Gaussian is theoretically infinite 
            // while WebGL often clamps or has different discrete sampling. 
            // Empirically, SVG blur looks "weaker" than WebGL for same sigma.
            // Boosting the calculated sigma by 1.5x - 2.0x usually helps.
            // Let's stick to the STRICT math first, then tweak if user complains.
            // Actually, let's use the empirical observation that SVG needs ~1.5x to match WebGL's appearance.
            const calibratedBlur = rawBlur * CALIBRATION_FACTOR * 1.5;

            const thresh = config?.effectCrystalize ?? 6;

            // Use stable element IDs for live DOM updates
            defs += `<filter id="${filterId}">
              <feGaussianBlur id="qr-blur-el" in="SourceGraphic" stdDeviation="${calibratedBlur.toFixed(3)}" result="blur" />
              <feColorMatrix id="qr-matrix-el" in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -${thresh}" result="goo" />
              <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
            </filter>`;
        }

        if (config?.gradientEnabled && config?.gradientColors?.length === 2) {
            const [c1, c2] = config.gradientColors;
            // Linear Gradient
            defs += `<linearGradient id="${uuid}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${c1}"/>
                    <stop offset="100%" stop-color="${c2}"/>
                 </linearGradient>`;
            fillAttr = `fill="url(#${uuid})"`;
        } else if (config?.fgColor) {
            fillAttr = `fill="${config.fgColor}"`;
        }

        // Replace global fill
        svgString = svgString.replace('fill="currentColor"', fillAttr);

        // Apply Filter to the base path
        if (useLiquidFilter) {
            // Apply to Body
            svgString = svgString.replace('<path ', `<path filter="url(#${filterId})" `);

            // Note: If we want to apply to EYES too, we'd do it in the Eye Injection step.
            // For now, let's keep it on Body as that's the main "Liquid" look.
            // Eyes usually look better crisp or strictly geometric unless fully integrated.
        }

        // Inject Defs
        if (defs) {
            // Rust output often looks like: <svg ...><path ...>
            // We insert defs before the first path
            svgString = svgString.replace('<path', `<defs>${defs}</defs><path`);
        }

        // --- Background ---
        if (config?.bgColor && config.bgColor !== 'transparent') {
            // Prepend bg rect
            svgString = svgString.replace('<svg ', `<svg style="background-color: ${config.bgColor};" `);
        }

        // --- Logo Injection ---
        if (config?.logo) {
            // Find viewBox to calculate alignment
            // Format: viewBox="0 0 W H"
            const vbMatch = svgString.match(/viewBox="0 0 (\d+) (\d+)"/);
            if (vbMatch) {
                const size = parseInt(vbMatch[1]);
                const logoSize = (config.logoSize || 0.2) * size;
                const xy = (size - logoSize) / 2;

                const imgTag = `<image href="${config.logo}" x="${xy}" y="${xy}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid slice"/>`;
                svgString = svgString.replace('</svg>', imgTag + '</svg>');
            }
        }

        // --- 5. Eye Injection (Hybrid Mode) ---
        // Rust skips finders, we inject them here for max customization
        const vbMatch = svgString.match(/viewBox="0 0 (\d+) (\d+)"/);
        if (vbMatch) {
            const size = parseInt(vbMatch[1]);
            const margin = 0; // Rust uses 0 margin

            // Helper to draw finder at ox,oy
            const drawFinder = (ox: number, oy: number) => {
                let path = '';
                const fx = ox;
                const fy = oy;

                // --- FRAME (Outer 7x7) ---
                switch (config?.eyeFrameShape || 'square') {
                    case 'circle':
                        path += `M${fx + 3.5},${fy} A3.5,3.5 0 1,1 ${fx + 3.5},${fy + 7} A3.5,3.5 0 1,1 ${fx + 3.5},${fy} M${fx + 3.5},${fy + 1} A2.5,2.5 0 1,0 ${fx + 3.5},${fy + 6} A2.5,2.5 0 1,0 ${fx + 3.5},${fy + 1} Z `;
                        break;
                    case 'rounded':
                        path += `M${fx + 2},${fy} h3 a2,2 0 0 1 2,2 v3 a2,2 0 0 1 -2,2 h-3 a2,2 0 0 1 -2,-2 v-3 a2,2 0 0 1 2,-2 z `;
                        path += `M${fx + 2},${fy + 1} a1,1 0 0 0 -1,1 v3 a1,1 0 0 0 1,1 h3 a1,1 0 0 0 1,-1 v-3 a1,1 0 0 0 -1,-1 h-3 z `;
                        break;
                    case 'leaf':
                        path += `M${fx},${fy} h4 a3,3 0 0 1 3,3 v4 h-4 a3,3 0 0 1 -3,-3 v-4 z `;
                        path += `M${fx + 1},${fy + 1} v3 a2,2 0 0 0 2,2 h3 v-3 a2,2 0 0 0 -2,-2 h-3 z `;
                        break;
                    case 'cushion':
                        path += `M${fx + 3.5},${fy} Q${fx + 7},${fy} ${fx + 7},${fy + 3.5} Q${fx + 7},${fy + 7} ${fx + 3.5},${fy + 7} Q${fx},${fy + 7} ${fx},${fy + 3.5} Q${fx},${fy} ${fx + 3.5},${fy} Z `;
                        path += `M${fx + 3.5},${fy + 1} Q${fx + 1},${fy + 1} ${fx + 1},${fy + 3.5} Q${fx + 1},${fy + 6} ${fx + 3.5},${fy + 6} Q${fx + 6},${fy + 6} ${fx + 6},${fy + 3.5} Q${fx + 6},${fy + 1} ${fx + 3.5},${fy + 1} Z `;
                        break;
                    case 'double':
                        path += `M${fx},${fy} h7 v7 h-7 z M${fx + 0.8},${fy + 0.8} v5.4 h5.4 v-5.4 h-5.4 z `;
                        path += `M${fx + 1.6},${fy + 1.6} h3.8 v3.8 h-3.8 z M${fx + 2.4},${fy + 2.4} v2.2 h2.2 v-2.2 h-2.2 z `;
                        break;
                    case 'fancy':
                        path += `M${fx + 1},${fy} h5 l1,1 v5 l-1,1 h-5 l-1,-1 v-5 l1,-1 z `;
                        path += `M${fx + 1.5},${fy + 1} l-0.5,0.5 v4 l0.5,0.5 h4 l0.5,-0.5 v-4 l-0.5,-0.5 h-4 z `;
                        break;
                    case 'dots-square':
                        // Simplified dotted square as solid frame for now, or dashed
                        path += `M${fx},${fy} h7 v7 h-7 z M${fx + 1},${fy + 1} v5 h5 v-5 h-5 z `;
                        break;
                    case 'heavy-rounded':
                        path += `M${fx + 2.5},${fy} h2 a2.5,2.5 0 0 1 2.5,2.5 v2 a2.5,2.5 0 0 1 -2.5,2.5 h-2 a2.5,2.5 0 0 1 -2.5,-2.5 v-2 a2.5,2.5 0 0 1 2.5,-2.5 z `;
                        path += `M${fx + 2.5},${fy + 1} a1.5,1.5 0 0 0 -1.5,1.5 v2 a1.5,1.5 0 0 0 1.5,1.5 h2 a1.5,1.5 0 0 0 1.5,-1.5 v-2 a1.5,1.5 0 0 0 -1.5,-1.5 h-2 z `;
                        break;
                    case 'clover-frame':
                        path += `M${fx + 3.5},${fy} C${fx + 5.5},${fy} ${fx + 7},${fy + 1.5} ${fx + 7},${fy + 3.5} C${fx + 7},${fy + 5.5} ${fx + 5.5},${fy + 7} ${fx + 3.5},${fy + 7} C${fx + 1.5},${fy + 7} ${fx},${fy + 5.5} ${fx},${fy + 3.5} C${fx},${fy + 1.5} ${fx + 1.5},${fy} ${fx + 3.5},${fy} Z `;
                        path += `M${fx + 3.5},${fy + 1} C${fx + 1.5},${fy + 1} ${fx + 1},${fy + 1.5} ${fx + 1},${fy + 3.5} C${fx + 1},${fy + 5.5} ${fx + 1.5},${fy + 6} ${fx + 3.5},${fy + 6} C${fx + 5.5},${fy + 6} ${fx + 6},${fy + 5.5} ${fx + 6},${fy + 3.5} C${fx + 6},${fy + 1.5} ${fx + 5.5},${fy + 1} ${fx + 3.5},${fy + 1} Z `;
                        break;
                    default: // Square
                        path += `M${fx},${fy} h7 v7 h-7 z M${fx + 1},${fy + 1} v5 h5 v-5 h-5 z `;
                        break;
                }

                // --- BALL (Inner 3x3) ---
                const bx = fx + 2;
                const by = fy + 2;
                switch (config?.eyeBallShape || 'square') {
                    case 'circle':
                        path += `M${bx + 1.5},${by} a1.5,1.5 0 1,0 0,3 a1.5,1.5 0 1,0 0,-3 z `;
                        break;
                    case 'diamond':
                        path += `M${bx + 1.5},${by} L${bx + 3},${by + 1.5} L${bx + 1.5},${by + 3} L${bx},${by + 1.5} Z `;
                        break;
                    case 'rounded':
                        path += `M${bx + 0.5},${by} h2 a0.5,0.5 0 0 1 0.5,0.5 v2 a0.5,0.5 0 0 1 -0.5,0.5 h-2 a0.5,0.5 0 0 1 -0.5,-0.5 v-2 a0.5,0.5 0 0 1 0.5,-0.5 z `;
                        break;
                    case 'star':
                        path += `M${bx + 1.5},${by} L${bx + 1.9},${by + 1.1} L${bx + 3},${by + 1.5} L${bx + 1.9},${by + 1.9} L${bx + 1.5},${by + 3} L${bx + 1.1},${by + 1.9} L${bx},${by + 1.5} L${bx + 1.1},${by + 1.1} Z M${bx + 1.5},${by + 1.5} m-0.8,0 a0.8,0.8 0 1,0 1.6,0 a0.8,0.8 0 1,0 -1.6,0 `;
                        break;
                    case 'heart':
                        path += `M${bx + 1.5},${by + 2.8} L${bx + 0.2},${by + 1.2} Q${bx},${by + 0.5} ${bx + 0.8},${by + 0.2} Q${bx + 1.2},${by + 0.1} ${bx + 1.5},${by + 0.6} Q${bx + 1.8},${by + 0.1} ${bx + 2.2},${by + 0.2} Q${bx + 3},${by + 0.5} ${bx + 2.8},${by + 1.2} Z `;
                        break;
                    case 'hexagon':
                        path += `M${bx + 0.5},${by + 0.2} L${bx + 2.5},${by + 0.2} L${bx + 3},${by + 1.5} L${bx + 2.5},${by + 2.8} L${bx + 0.5},${by + 2.8} L${bx},${by + 1.5} Z `;
                        break;
                    case 'octagon':
                        path += `M${bx + 0.9},${by + 0.1} L${bx + 2.1},${by + 0.1} L${bx + 2.9},${by + 0.9} L${bx + 2.9},${by + 2.1} L${bx + 2.1},${by + 2.9} L${bx + 0.9},${by + 2.9} L${bx + 0.1},${by + 2.1} L${bx + 0.1},${by + 0.9} Z `;
                        break;
                    case 'bars-h':
                        path += `M${bx},${by + 0.5} v0.5 h3 v-0.5 z M${bx},${by + 1.25} v0.5 h3 v-0.5 z M${bx},${by + 2} v0.5 h3 v-0.5 z `;
                        break;
                    case 'bars-v':
                        path += `M${bx + 0.5},${by} h0.5 v3 h-0.5 z M${bx + 1.25},${by} h0.5 v3 h-0.5 z M${bx + 2},${by} h0.5 v3 h-0.5 z `;
                        break;
                    case 'flower':
                        path += `M${bx + 1.5},${by + 0.2} m-0.7,0 a0.7,0.7 0 1,0 1.4,0 a0.7,0.7 0 1,0 -1.4,0 M${bx + 2.8},${by + 1.5} m-0.7,0 a0.7,0.7 0 1,0 1.4,0 a0.7,0.7 0 1,0 -1.4,0 M${bx + 1.5},${by + 2.8} m-0.7,0 a0.7,0.7 0 1,0 1.4,0 a0.7,0.7 0 1,0 -1.4,0 M${bx + 0.2},${by + 1.5} m-0.7,0 a0.7,0.7 0 1,0 1.4,0 a0.7,0.7 0 1,0 -1.4,0 M${bx + 1.5},${by + 1.5} m-0.6,0 a0.6,0.6 0 1,0 1.2,0 a0.6,0.6 0 1,0 -1.2,0 `;
                        break;
                    case 'dots-grid':
                        for (let r = 0; r < 3; r++) { for (let c = 0; c < 3; c++) { path += `M${bx + 0.5 + c + 0.45},${by + 0.5 + r} a0.45,0.45 0 1,1 -0.9,0 a0.45,0.45 0 1,1 0.9,0 `; } }
                        break;
                    case 'clover':
                        path += `M${bx + 1.5},${by + 1.5} m-0.7,0 a0.7,0.7 0 1,0 1.4,0 a0.7,0.7 0 1,0 -1.4,0 M${bx + 1.5},${by + 0.6} m-0.6,0 a0.6,0.6 0 1,0 1.2,0 a0.6,0.6 0 1,0 -1.2,0 M${bx + 2.4},${by + 1.5} m-0.6,0 a0.6,0.6 0 1,0 1.2,0 a0.6,0.6 0 1,0 -1.2,0 M${bx + 1.5},${by + 2.4} m-0.6,0 a0.6,0.6 0 1,0 1.2,0 a0.6,0.6 0 1,0 -1.2,0 M${bx + 0.6},${by + 1.5} m-0.6,0 a0.6,0.6 0 1,0 1.2,0 a0.6,0.6 0 1,0 -1.2,0 `;
                        break;
                    case 'cushion':
                        path += `M${bx + 1.5},${by + 0.1} Q${bx + 2.9},${by + 0.1} ${bx + 2.9},${by + 1.5} Q${bx + 2.9},${by + 2.9} ${bx + 1.5},${by + 2.9} Q${bx + 0.1},${by + 2.9} ${bx + 0.1},${by + 1.5} Q${bx + 0.1},${by + 0.1} ${bx + 1.5},${by + 0.1} Z `;
                        break;
                    case 'leaf':
                        path += `M${bx},${by} h1.5 a1.5,1.5 0 0 1 1.5,1.5 v1.5 h-1.5 a1.5,1.5 0 0 1 -1.5,-1.5 z `;
                        break;
                    case 'shield':
                        path += `M${bx},${by} h3 v1.5 a1.5,1.5 0 0 1 -1.5,1.5 a1.5,1.5 0 0 1 -1.5,-1.5 z `;
                        break;
                    default: // Square
                        path += `M${bx},${by} h3 v3 h-3 z `;
                        break;
                }
                return path;
            };

            // Use shared finder pattern renderer (margin=0 for Rust SVG)
            const eyesPath = drawAllFinderPatterns(size, 0, {
                eyeFrameShape: config?.eyeFrameShape || 'square',
                eyeBallShape: config?.eyeBallShape || 'square'
            });

            // Apply filter to Eyes if Liquid is ON
            const eyesFilter = useLiquidFilter ? `filter="url(#${filterId})"` : '';
            // We need to inject the path with the correct fill. 
            // Reuse fillAttr which is like 'fill="..."'
            const eyePathTag = `<path d="${eyesPath}" ${fillAttr} ${eyesFilter} />`;

            svgString = svgString.replace('</svg>', eyePathTag + '</svg>');
        }

        // Add 100% dimensions for responsiveness if not present
        if (!svgString.includes('width="100%"')) {
            svgString = svgString.replace('<svg ', '<svg width="100%" height="100%" ');
        }

        return svgString;
    }
}
