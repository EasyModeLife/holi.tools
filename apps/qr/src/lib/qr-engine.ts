/**
 * QR Engine - WASM-powered QR code generation
 * Advanced shape customization with 3-layer system
 */

// Body shape types (module patterns for data area)
type BodyShape = 'square' | 'rounded' | 'dots' | 'diamond' | 'star' | 'classy' |
    'classy-rounded' | 'mosaic' | 'fluid' | 'vertical-lines' | 'horizontal-lines';

// Eye frame shape types (outer frame of finder patterns)
type EyeFrameShape = 'square' | 'rounded' | 'circle' | 'leaf' | 'pointed' | 'dotted' | 'shield';

// Eye ball shape types (center of finder patterns)
type EyeBallShape = 'square' | 'rounded' | 'circle' | 'star' | 'diamond' | 'heart' | 'hexagon';

interface QRConfig {
    fg: string;
    bg: string;
    bodyShape: BodyShape;
    eyeFrameShape: EyeFrameShape;
    eyeBallShape: EyeBallShape;
    ecc: 'L' | 'M' | 'Q' | 'H';
    mask?: number; // QR mask pattern (0-7), undefined for auto
    logoColor?: 'original' | 'white' | 'black' | string;
    logoX?: number;  // Logo position (0-1)
    logoY?: number;

    // Effects
    effectLiquid?: boolean;
    effectBlur?: number;
    effectCrystalize?: number;

    // Gradients
    gradientEnabled?: boolean;
    gradientType?: number | 'none' | 'linear' | 'radial' | 'conic' | 'diamond';
    gradientColors?: [string, string];
    gradientAngle?: number;

    // Noise
    noiseEnabled?: boolean;
    noiseAmount?: number;
    noiseScale?: number;

    // Logo
    logo?: string;
    logoSize?: number;
    logoBgEnabled?: boolean;
    logoBgColor?: string;
    logoBgShape?: 'square' | 'circle' | 'rounded';
    logoPadding?: number;
    logoCornerRadius?: number;
    logoRotation?: number;
    logoScale?: number;
    logoOffsetX?: number;
    logoOffsetY?: number;
    artEnabled?: boolean;
    artImage?: string;
    artOpacity?: number;      // 0.0 - 1.0
    artBlendMode?: string;    // 'normal', 'multiply', 'overlay', 'screen', 'darken'
    artFit?: 'cover' | 'contain' | 'fill';
    artRotation?: number;     // degrees
    artScale?: number;        // 1.0 = 100%
    artOffsetX?: number;      // -1 to 1
    artOffsetY?: number;      // -1 to 1
}

interface QRState {
    text: string;
    config: QRConfig;
    recent: QRHistoryItem[];
    collections: string[];
}

interface QRHistoryItem {
    id: string;
    text: string;
    name: string;
    config: QRConfig;
}

// WASM module reference
let wasm: any = null;

// Default config
const defaultConfig: QRConfig = {
    fg: '#000000',
    bg: 'transparent',
    bodyShape: 'square',
    eyeFrameShape: 'square',
    eyeBallShape: 'square',
    ecc: 'M',
    logoColor: 'original',
    logoBgEnabled: false,
    logoBgColor: '#ffffff',
    logoBgShape: 'circle',
    logoPadding: 0,
    logoCornerRadius: 10,
    logoRotation: 0,
    logoScale: 1.0,
    logoOffsetX: 0,
    logoOffsetY: 0,
    logoSize: 0.2,
    logoX: 0.5,
    logoY: 0.5
};

// Application state
export const state: QRState = {
    text: '',
    config: { ...defaultConfig },
    recent: [],
    collections: []
};

// Export types for use in components
export type { BodyShape, EyeFrameShape, EyeBallShape, QRConfig };

/**
 * Initialize WASM module
 */
export async function initWasm(): Promise<boolean> {
    try {
        // Switch to lightweight wasm-qr-svg (30KB) instead of legacy wasm-qr (4MB)
        const mod = await import('../../../../packages/wasm-qr-svg/pkg/holi_qr_svg.js');
        await mod.default();
        wasm = mod;
        console.log('Holi WASM Ready (Lightweight)');
        return true;
    } catch (e) {
        console.error('WASM Failed', e);
        return false;
    }
}

/**
 * Generate SVG from text and config
 */
export function generateSVG(text: string, cfg: QRConfig): string {
    if (!text) return '';
    if (!wasm) return `<svg viewBox="0 0 100 100"><text x="50" y="50" text-anchor="middle" fill="#888">Initializing WASM...</text></svg>`;

    try {
        // Use mask from config, default to -1 (auto)
        const maskValue = typeof cfg.mask === 'number' ? cfg.mask : -1;
        // wasm-qr-svg returns flat array [size, ...data]
        const raw = wasm.get_qr_matrix(text, cfg.ecc || 'M', maskValue);

        if (!raw || raw.length === 0) throw new Error("WASM returned empty matrix");

        const size = raw[0];
        const data = raw.subarray(1);

        // Helper to check if module at (x,y) is dark
        // 255 = dark, 0 = light
        const isDark = (x: number, y: number): boolean => {
            if (x < 0 || x >= size || y < 0 || y >= size) return false;
            return data[y * size + x] === 255;
        };

        // Finder patterns 7x7 zones
        const isFinderZone = (x: number, y: number): boolean => {
            if (x < 7 && y < 7) return true; // TL
            if (x >= size - 7 && y < 7) return true; // TR
            if (x < 7 && y >= size - 7) return true; // BL
            return false;
        };

        const margin = 2;
        const totalSize = size + margin * 2;

        // --- 1. RENDER DATA MODULES ---
        let bodyPath = '';

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (isFinderZone(x, y)) continue; // Skip finder zones
                if (!isDark(x, y)) continue;

                const px = x + margin;
                const py = y + margin;

                switch (cfg.bodyShape) {
                    case 'rounded':
                        bodyPath += `M${px + 0.2},${py}h0.6a0.2,0.2 0 0 1 0.2,0.2v0.6a0.2,0.2 0 0 1 -0.2,0.2h-0.6a0.2,0.2 0 0 1 -0.2,-0.2v-0.6a0.2,0.2 0 0 1 0.2,-0.2z`;
                        break;
                    case 'dots':
                        bodyPath += `M${px + 0.5},${py + 0.5} m-0.35,0 a0.35,0.35 0 1,0 0.7,0 a0.35,0.35 0 1,0 -0.7,0`;
                        break;
                    case 'diamond':
                        bodyPath += `M${px + 0.5},${py} L${px + 1},${py + 0.5} L${px + 0.5},${py + 1} L${px},${py + 0.5} Z`;
                        break;
                    case 'star':
                        // Simple 4-point star/diamond hybrid
                        bodyPath += `M${px + 0.5},${py} Q${px + 0.6},${py + 0.4} ${px + 1},${py + 0.5} Q${px + 0.6},${py + 0.6} ${px + 0.5},${py + 1} Q${px + 0.4},${py + 0.6} ${px},${py + 0.5} Q${px + 0.4},${py + 0.4} ${px + 0.5},${py} Z`;
                        break;
                    case 'classy':
                        bodyPath += `M${px},${py} h1 a0,0 0 0 1 0,0 v0.5 a0.5,0.5 0 0 1 -0.5,0.5 h-0.5 a0,0 0 0 1 0,0 v-1 z`;
                        break;
                    case 'classy-rounded':
                        bodyPath += `M${px + 0.1},${py} h0.8 a0.1,0.1 0 0 1 0.1,0.1 v0.8 a0.1,0.1 0 0 1 -0.1,0.1 h-0.8 a0.1,0.1 0 0 1 -0.1,-0.1 v-0.8 a0.1,0.1 0 0 1 0.1,-0.1 z`;
                        break;
                    case 'square':
                    default:
                        bodyPath += `M${px},${py}h1v1h-1z`;
                        break;
                }
            }
        }

        // --- 2. RENDER FINDER PATTERNS ---

        // Helper to draw a finder pattern at specific coords
        const drawFinder = (ox: number, oy: number) => {
            const fx = ox + margin;
            const fy = oy + margin;
            let path = '';

            // -- EYE FRAME (Outer 7x7) --
            // We use counter-clockwise winding for inner shapes to create holes
            switch (cfg.eyeFrameShape) {
                case 'circle':
                    // Outer Circle (CW) + Inner Circle (CCW)
                    path += `M${fx + 3.5},${fy} A3.5,3.5 0 1,1 ${fx + 3.5},${fy + 7} A3.5,3.5 0 1,1 ${fx + 3.5},${fy} M${fx + 3.5},${fy + 1} A2.5,2.5 0 1,0 ${fx + 3.5},${fy + 6} A2.5,2.5 0 1,0 ${fx + 3.5},${fy + 1} Z`;
                    break;
                case 'rounded':
                    // Outer Rounded Box 7x7
                    // Inner Rounded Box 5x5 (Hole)
                    path += `M${fx + 2},${fy} h3 a2,2 0 0 1 2,2 v3 a2,2 0 0 1 -2,2 h-3 a2,2 0 0 1 -2,-2 v-3 a2,2 0 0 1 2,-2 z`;
                    // Inner (Counter-Clockwise)
                    path += `M${fx + 2},${fy + 1} a1,1 0 0 0 -1,1 v3 a1,1 0 0 0 1,1 h3 a1,1 0 0 0 1,-1 v-3 a1,1 0 0 0 -1,-1 h-3 z`;
                    break;
                case 'leaf':
                    // Outer Leaf
                    path += `M${fx},${fy} h4 a3,3 0 0 1 3,3 v4 h-4 a3,3 0 0 1 -3,-3 v-4 z`;
                    // Inner Leaf (Hole) - CCW
                    path += `M${fx + 1},${fy + 1} v3 a2,2 0 0 0 2,2 h3 v-3 a2,2 0 0 0 -2,-2 h-3 z`;
                    break;
                case 'square':
                default:
                    // Outer 7x7 CW
                    path += `M${fx},${fy} h7 v7 h-7 z`;
                    // Inner 5x5 CCW: Down, Right, Up, Left
                    path += `M${fx + 1},${fy + 1} v5 h5 v-5 h-5 z`;
                    break;
            }

            // -- EYE BALL (Inner 3x3) --
            const bx = fx + 2;
            const by = fy + 2;

            switch (cfg.eyeBallShape) {
                case 'circle':
                    path += `M${bx + 1.5},${by} a1.5,1.5 0 1,0 0,3 a1.5,1.5 0 1,0 0,-3 z`;
                    break;
                case 'diamond':
                    path += `M${bx + 1.5},${by} L${bx + 3},${by + 1.5} L${bx + 1.5},${by + 3} L${bx},${by + 1.5} z`;
                    break;
                case 'rounded':
                    path += `M${bx + 0.5},${by} h2 a0.5,0.5 0 0 1 0.5,0.5 v2 a0.5,0.5 0 0 1 -0.5,0.5 h-2 a0.5,0.5 0 0 1 -0.5,-0.5 v-2 a0.5,0.5 0 0 1 0.5,-0.5 z`;
                    break;
                case 'square':
                default:
                    path += `M${bx},${by} h3 v3 h-3 z`;
                    break;
            }
            return path;
        };

        const finderPath =
            drawFinder(0, 0) +
            drawFinder(size - 7, 0) +
            drawFinder(0, size - 7);


        // --- COMPOSE SVG ---
        let content = '';

        // Background
        content += `<rect width="${totalSize}" height="${totalSize}" fill="${cfg.bg}"/>`;

        // Data Modules
        content += `<path d="${bodyPath}" fill="${cfg.fg}"/>`;

        // Finder Patterns
        content += `<path d="${finderPath}" fill="${cfg.fg}"/>`;

        // Render logo in center if provided
        if (cfg.logo) {
            const logoRatio = cfg.logoSize || 0.2;
            const logoSize = totalSize * logoRatio;
            const logoX = (totalSize - logoSize) / 2;
            const logoY = (totalSize - logoSize) / 2;

            // Optional background container
            if (cfg.logoBgEnabled) {
                // White background circle with subtle shadow
                content += `<circle cx="${totalSize / 2}" cy="${totalSize / 2}" r="${logoSize / 2 * 1.1}" fill="${cfg.logoBgColor || '#ffffff'}"/>`;
            }

            // Clip path for circular logo
            const clipId = 'logo-clip-' + Date.now();
            content += `<defs><clipPath id="${clipId}"><circle cx="${totalSize / 2}" cy="${totalSize / 2}" r="${logoSize / 2}"/></clipPath></defs>`;

            // Determine which logo string to use (original vs colorized)
            let logoHref = cfg.logo;

            // If logo is a data URI containing SVG, we can potentially colorize it
            // However, most logos in state are already data URIs.
            // For Simple Icons, we have the RAW_ICONS in brand-logos.ts
            // But here we only have the final string.
            // The state.config.logo is currently a data URI.

            // To properly colorize, we might need a way to pass the raw SVG or 
            // the colorization should happen before setting state.config.logo.
            // But let's check if it's an SVG data URI we can manipulate.

            // Logo image
            content += `<image href="${logoHref}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice"/>`;
        }

        return `<svg viewBox="0 0 ${totalSize} ${totalSize}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            ${content}
        </svg>`;
    } catch (e) {
        console.error(e);
        return '<svg><text>Error</text></svg>';
    }
}

/**
 * Check if WASM is ready
 */
export function isWasmReady(): boolean {
    return wasm !== null;
}

/**
 * Decode QR code from ImageData using jsQR
 * @param imageData - Canvas ImageData containing QR code
 * @returns Decoded text or null if not found
 */
export async function decodeQRImage(imageData: ImageData): Promise<string | null> {
    try {
        // Dynamically import jsQR to decode
        const jsQR = (await import('jsqr')).default;
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        return code?.data ?? null;
    } catch (error) {
        console.error('QR decode error:', error);
        return null;
    }
}

/**
 * Export QR as PNG with specified DPI
 * @param svgString - The SVG string to convert
 * @param dpi - DPI setting (72, 150, 300, 600)
 * @returns Promise<Blob> - PNG blob
 */
/**
 * Export QR as PNG with specified size
 * @param svgString - The SVG string to convert
 * @param size - Target size in pixels (e.g., 1000)
 * @returns Promise<Blob> - PNG blob
 */
export async function exportPNG(svgString: string, size: number = 1000): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            const canvas = document.createElement('canvas');

            // Set canvas size directly to target size
            canvas.width = size;
            canvas.height = size;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            // High-quality rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Draw SVG to canvas scaling it to fit
            ctx.drawImage(img, 0, 0, size, size);

            // Convert to PNG blob
            canvas.toBlob((blob) => {
                URL.revokeObjectURL(url);
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to create PNG blob'));
                }
            }, 'image/png');
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load SVG'));
        };

        img.src = url;
    });
}

/**
 * Export QR as PDF
 * Download file utility
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
