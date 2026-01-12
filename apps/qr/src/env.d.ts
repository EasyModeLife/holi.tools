/// <reference path="../.astro/types.d.ts" />

/**
 * Global Window Extensions for QR Generator
 * Provides type safety for global functions and state
 */

import type { QRController } from './lib/qr-controller';
import type { qrScanner } from './lib/qr-scanner';
import type { scanVerifier } from './lib/scan-verifier';
import type { gifAnimator } from './lib/gif-handler';
import type { RenderConfig } from './lib/core/types';

// Shape setter functions exposed globally
type ShapeSetter = (shape: string) => void | Promise<void>;

// Export format types
type ExportFormat = 'svg' | 'png' | 'pdf' | 'jpeg' | 'webp';

// QR Config interface (matches qr-engine.ts)
interface QRConfig {
    fg: string;
    bg: string;
    bodyShape: string;
    eyeFrameShape: string;
    eyeBallShape: string;
    ecc: 'L' | 'M' | 'Q' | 'H';
    mask?: number;
    logo?: string;
    logoColor?: 'original' | 'white' | 'black' | string;
    logoBgToggle?: boolean;
    logoSize?: number;
    logoX?: number;
    logoY?: number;
    gradientEnabled?: boolean;
    gradientType?: number;
    gradientAngle?: number;
    gradientColor2?: string;
    gradientColors?: string[];
    noiseEnabled?: boolean;
    noiseAmount?: number;
    noiseScale?: number;
    artEnabled?: boolean;
    artImage?: string;
    artBlendMode?: 'multiply' | 'overlay' | 'darken' | 'color-burn';
    artOpacity?: number;
    artIsAnimated?: boolean;
    artFrameCount?: number;
    effectLiquid?: boolean;
    effectBlur?: number;
    effectCrystalize?: number;
}

interface QRState {
    text: string;
    config: QRConfig;
    recent: Array<{ id: string; text: string; name: string; config: QRConfig }>;
    collections: string[];
}

// GIF Handler type  
interface GifHandler {
    isGifFile: (file: File) => boolean;
    parseGifFile: (file: File) => Promise<{
        frames: Array<{ imageData: ImageData; delay: number; width: number; height: number }>;
        width: number;
        height: number;
        totalDuration: number;
    }>;
    gifAnimator: typeof gifAnimator;
}

declare global {
    interface Window {
        // Core state and controller
        state: QRState;
        qrController: QRController;
        qrScanner: typeof qrScanner;
        scanVerifier: typeof scanVerifier;

        // Content type
        currentContentType: string;
        setContentType: (type: string) => void;

        // QR update function
        updateQR: () => void;

        // Shape setters
        setBodyShape: ShapeSetter;
        setEyeFrame: ShapeSetter;
        setEyeBall: ShapeSetter;
        setEcc: (ecc: string) => void;

        // Logo functions
        removeLogo: () => void;
        setLogoSize: (size: number) => void;
        handleLogoUpload: (e: Event) => void;

        // Download function
        downloadAs: (format: ExportFormat) => void;

        // Style panel functions
        toggleLiquid: (enabled: boolean) => void;
        toggleNoise: (enabled: boolean) => void;
        updateLiquidParam: (key: 'blur' | 'thresh', value: string) => void;
        updateNoiseParam: (key: 'amount' | 'scale', value: string) => void;
        applyPreset: (body: string, frame: string, ball: string, liquid: boolean) => void;

        // Color panel functions
        updateColor: (type: 'fg' | 'bg', value: string) => void;
        toggleGradient: (enabled: boolean) => void;
        updateGradient: () => void;
        setGradientType: (type: number) => void;
        toggleBgTransparent: (enabled: boolean) => void;
        applyTransparentPreset: () => void;

        // GIF handler
        gifHandler: GifHandler;
    }
}

export { };