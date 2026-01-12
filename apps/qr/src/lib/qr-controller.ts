import { state, initWasm, type BodyShape, type EyeFrameShape, type EyeBallShape } from './qr-engine';
import { getIconSvg, setIconContent } from './icons';
import { scanVerifier } from './scan-verifier';
import { qrScanner } from './qr-scanner';
import { getTypeLogo } from './brand-logos';
import { WasmSvgRenderer, RenderConfig } from './wasm-svg-renderer';
import { WebGLLiquidRenderer } from './webgl-liquid-renderer';
import { hexToRgb, parseBgColor } from './utils/color';
import { getBodyShapeId, getEyeFrameId, getEyeBallId } from './constants/shapes';
import { isGifFile, parseGifFile, gifAnimator } from './gif-handler';
import { strategies } from './strategies/content-types';

// Expose GIF handler globally for ArtPanel
(window as any).gifHandler = { isGifFile, parseGifFile, gifAnimator };

// Tipos para los elementos del DOM extendidos
interface QRElements {
    generateBtn: HTMLButtonElement | null;
    resetBtn: HTMLButtonElement | null;
    canvas: HTMLElement | null;
    qr: HTMLElement | null;
    qrFrame: HTMLElement | null; // Container for background color
    fg: HTMLInputElement | null;
    bg: HTMLInputElement | null;
    [key: string]: HTMLElement | null;
}

export class QRController {
    public els: QRElements = {
        generateBtn: null, resetBtn: null, canvas: null, qr: null, qrFrame: null, fg: null, bg: null
    };

    private inputDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    private static instance: QRController;
    private svgRenderer: WasmSvgRenderer | null = null;
    public webglRenderer: WebGLLiquidRenderer | null = null;
    private lastMatrixSize: number = 21;
    private abortController: AbortController = new AbortController();

    constructor() {
        console.log("QRController: Constructor started");
        (window as any).state = state;
        (window as any).qrController = this;

        (window as any).downloadAs = (format: string) => {
            import('./export-manager').then(m => m.exportManager.handleDownloadAction(format as any));
        };

        // UI Helpers exposed for HTML interaction
        (window as any).setBodyShape = (val: BodyShape) => { state.config.bodyShape = val; this.updateUI('bodyshape', val); this.updateWebGLPreview(); };
        (window as any).setEyeFrame = (val: EyeFrameShape) => { state.config.eyeFrameShape = val; this.updateUI('eyeframe', val); this.updateWebGLPreview(); };
        (window as any).setEyeBall = (val: EyeBallShape) => { state.config.eyeBallShape = val; this.updateUI('eyeball', val); this.updateWebGLPreview(); };

        // ECC and Mask setters
        (window as any).setEcc = (val: string) => {
            state.config.ecc = val as any;
            console.log("ECC set to:", val);
            this.generateQR(true);
        };
        (window as any).setMaskPattern = (val: string) => {
            state.config.mask = val === "auto" ? undefined : parseInt(val);
            console.log("Mask set to:", state.config.mask);
            this.generateQR(true);
        };

        // toggleLiquidMode removed (Liquid is now native)

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => this.onDomReady());
        } else {
            this.onDomReady();
        }
    }

    private onDomReady() {
        console.log("QRController: onDomReady executing. Readystate:", document.readyState);
        this.initElements();
        this.initListeners();
        this.init();
    }

    public static getInstance(): QRController {
        if (!QRController.instance) QRController.instance = new QRController();
        return QRController.instance;
    }

    /**
     * Cleanup all event listeners and resources
     */
    public destroy(): void {
        this.abortController.abort();
        console.log("QRController: Destroyed, all event listeners removed");
    }

    private initElements() {
        console.log("QRController: initElements");

        // Explicit mapping + Debug
        this.els.generateBtn = document.getElementById("generate-btn") as HTMLButtonElement;
        if (this.els.generateBtn) console.log("QRController: generate-btn found in DOM");
        else console.warn("QRController: generate-btn NOT FOUND in DOM (will use delegation)");

        this.els.resetBtn = document.getElementById("btn-reset") as HTMLButtonElement;
        this.els.canvas = document.getElementById("canvas-container");
        this.els.qrFrame = document.getElementById("qr-frame"); // Container frame
        this.els.qr = document.getElementById("qr-svg-target"); // UPDATED: Target inner wrapper
        this.els.fg = document.getElementById("color-fg") as HTMLInputElement;
        this.els.bg = document.getElementById("color-bg") as HTMLInputElement;

        // Init WASM SVG Renderer
        if (this.els.qr) {
            console.log("QRController: Initializing WasmSvgRenderer");
            this.svgRenderer = new WasmSvgRenderer("qr-svg-target");
            this.svgRenderer.init();

            // Init WebGL Liquid Renderer (for fast preview when Liquid is ON)
            this.webglRenderer = new WebGLLiquidRenderer("qr-frame");
            this.webglRenderer.init().then(ok => {
                if (ok) console.log("🎮 WebGL Liquid Renderer ready");
            });
        } else {
            console.error("QRController: qr-svg-target NOT FOUND");
        }

        // Auto-map inputs by ID
        const inputIds = [
            ['urlInput', 'input-url'], ['textInput', 'input-text'],
            ['wifiSsid', 'input-wifi-ssid'], ['wifiPass', 'input-wifi-pass'], ['wifiEnc', 'input-wifi-enc'],
            ['vcardName', 'input-vcard-name'], ['vcardPhone', 'input-vcard-phone'], ['vcardEmail', 'input-vcard-email'], ['vcardCompany', 'input-vcard-company'],
            ['appstoreInput', 'input-appstore'], ['playstoreInput', 'input-playstore'],
            ['fbInput', 'input-fb'], ['twitterInput', 'input-twitter'], ['ytInput', 'input-yt'],
            ['phoneInput', 'input-phone'],
            ['emailAddr', 'input-email-addr'], ['emailSub', 'input-email-sub'], ['emailBody', 'input-email-body'],
            ['smsPhone', 'input-sms-phone'], ['smsMsg', 'input-sms-msg'],
            ['locLat', 'input-loc-lat'], ['locLong', 'input-loc-long'],
            ['eventTitle', 'input-event-title'], ['eventStart', 'input-event-start'], ['eventEnd', 'input-event-end'], ['eventLoc', 'input-event-loc'],
            ['btcAddr', 'input-btc-addr'], ['btcAmount', 'input-btc-amount']
        ];

        inputIds.forEach(([prop, id]) => {
            this.els[prop] = document.getElementById(id);
            // Silent validation for inputs, as they switch visibility
        });
    }

    private initListeners() {
        console.log("QRController: initListeners (using delegation)");
        const signal = this.abortController.signal;

        // ROBUST EVENT DELEGATION
        // Catch clicks on document and check if they bubbled from our elements
        document.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;

            // Generate Button
            if (target.closest("#generate-btn")) {
                console.log("QRController: Delegated Click -> Generate");
                this.generateQR();
                return;
            }

            // Reset Button
            if (target.closest("#btn-reset")) {
                this.resetToZero();
                return;
            }

            // Verify Button
            if (target.closest("#btn-verify")) {
                scanVerifier.verifyScan();
                return;
            }

            // Copy Button
            if (target.closest("#btn-copy")) {
                this.copyQRToClipboard();
                return;
            }
        }, { signal });

        // Input listeners - specific delegation
        document.body.addEventListener("input", (e) => {
            if ((e.target as HTMLElement).classList.contains("input-field")) {
                this.debouncedAutoGenerate();
            }
        }, { signal });

        document.body.addEventListener("keydown", (e) => {
            if ((e.target as HTMLElement).classList.contains("input-field") && (e as KeyboardEvent).key === "Enter" && !(e.target as HTMLElement).matches("textarea")) {
                if (this.inputDebounceTimer) clearTimeout(this.inputDebounceTimer);
                this.generateQR();
            }
        }, { signal });

        window.addEventListener('qr-type-changed', ((e: CustomEvent<{ type?: string }>) => {
            const type = e.detail?.type || (window as any).currentContentType;
            if (type === 'scan') {
                // Activate scanner, don't auto-generate
                qrScanner.activate();
            } else {
                // Inject brand logo for branded content types
                this.injectBrandLogo(type);
                this.debouncedAutoGenerate();
            }
        }) as EventListener, { signal });

        // Effect Change Listener (From StylePanel) - Full re-render (toggle on/off)
        window.addEventListener('qr-effect-change', async (e) => {
            const detail = (e as CustomEvent).detail;
            console.log("QRController: Effect Change (full)", detail);
            const { liquid, blur, thresh } = detail;
            state.config.effectLiquid = liquid;
            state.config.effectBlur = blur;
            state.config.effectCrystalize = thresh;

            // Use WebGL if: Liquid is ON OR gradients are active OR Art (Background) is active
            const gType = state.config.gradientType;
            const hasGradient = (typeof gType === 'number' && gType > 0) || (typeof gType === 'string' && gType !== 'none');
            const hasArt = state.config.artEnabled && state.config.artImage;
            const useWebGL = liquid || hasGradient || hasArt;

            // Toggle WebGL visibility based on Liquid state OR gradient state OR Art state
            if (this.webglRenderer) {
                this.webglRenderer.setVisible(useWebGL);

                // Toggle SVG visibility (hide when WebGL is active)
                if (this.els.qr) {
                    this.els.qr.style.opacity = useWebGL ? '0' : '1';
                }

                // If using WebGL, upload matrix and render
                if (useWebGL && state.text) {
                    await this.uploadMatrixToWebGL(true);
                    console.log("WebGL: Rendering frame (liquid/gradient/art)");
                    this.webglRenderer.render(this.getFullRenderConfig());
                }
            }

            // Sync SVG state (render in background)
            (window as any).updateQR();
        }, { signal });

        // LIVE Filter Tweak (60fps) - Uses WebGL for ultra-fast updates
        window.addEventListener('qr-filter-tweak', (e) => {
            const detail = (e as CustomEvent).detail;
            const { blur, thresh } = detail;
            state.config.effectBlur = blur;
            state.config.effectCrystalize = thresh;

            if (this.webglRenderer && (state.config.effectLiquid || state.config.artEnabled)) {
                // Get full config (will use the just-updated blur/thresh from state)
                const config = this.getFullRenderConfig();
                // Override for live preview with exact slider values
                config.blur = blur;
                config.threshold = thresh;

                this.webglRenderer.render(config);

                // Trigger verification (Debounced)
                scanVerifier.debouncedVerify();
            } else if (this.svgRenderer) {
                this.svgRenderer.updateFilterParams(blur, thresh);
            }
        }, { signal });

        // Gradient Change Listener
        window.addEventListener('qr-gradient-change', async (e) => {
            const detail = (e as CustomEvent).detail;
            console.log("🎨 Gradient Change:", detail);
            const { type, color2, angle } = detail;
            state.config.gradientType = type;
            state.config.gradientColors = [state.config.fg, color2]; // Store as array
            state.config.gradientAngle = angle;

            // If gradient is active (type > 0), switch to WebGL
            const hasGradient = type > 0;
            const hasArt = state.config.artEnabled && state.config.artImage;

            if (this.webglRenderer && state.text) {
                if (hasGradient || hasArt) {
                    // Enable WebGL canvas, hide SVG
                    this.webglRenderer.setVisible(true);
                    if (this.els.qr) this.els.qr.style.opacity = '0';

                    // Upload matrix if not already done
                    if (!this.lastMatrixSize) {
                        await this.uploadMatrixToWebGL(true);
                    }
                }

                // Render with gradient (or without if type=0)
                this.updateWebGLPreview();
                scanVerifier.debouncedVerify();
            }
        }, { signal });

        // Noise Change Listener
        window.addEventListener('qr-noise-change', async (e) => {
            const detail = (e as CustomEvent).detail;
            console.log("🌫️ Noise Change:", detail);
            const { enabled, amount, scale } = detail;
            state.config.noiseEnabled = enabled;
            // CRITICAL: Set noiseAmount to 0 when disabled, otherwise effect persists
            state.config.noiseAmount = enabled ? (amount / 100) : 0;
            state.config.noiseScale = scale;

            if (this.webglRenderer && state.text) {
                // Enable WebGL if noise is on
                if (enabled || state.config.artEnabled) {
                    this.webglRenderer.setVisible(true);
                    if (this.els.qr) this.els.qr.style.opacity = '0';

                    // Upload matrix if not already done
                    if (!this.lastMatrixSize) {
                        await this.uploadMatrixToWebGL(true);
                    }
                }

                this.updateWebGLPreview();
                scanVerifier.debouncedVerify();
            }
        }, { signal });

        (window as any).updateQR = () => { this.renderQR(); scanVerifier.debouncedVerify(); };

        // Setters moved to top of constructor
        // (window as any).updateQR = ... kept below

        const logoInput = document.getElementById("logo-upload") as HTMLInputElement;
        if (logoInput) logoInput.addEventListener("change", (e) => this.handleLogoUpload(e), { signal });
        (window as any).removeLogo = () => this.removeLogo();
        (window as any).setLogoSize = (size: number) => {
            state.config.logoSize = size;
            const valueEl = document.getElementById('logo-size-value');
            if (valueEl) valueEl.textContent = Math.round(size * 100) + '%';
            (window as any).updateQR();
        };
        (window as any).handleLogoUpload = (e: Event) => this.handleLogoUpload(e);
    }

    /**
     * Helper: Update WebGL preview only
     */

    /**
     * CENTRALIZED RENDER CONFIG
     * Single source of truth for all WebGL render calls.
     * All effects (gradients, noise, etc.) must be added here.
     */
    public getFullRenderConfig(): any {
        const isLiquid = state.config.effectLiquid;
        return {
            blur: isLiquid ? (state.config.effectBlur || 0.35) : 0.0,
            threshold: isLiquid ? (state.config.effectCrystalize || 6) : -10.0,
            color: hexToRgb(state.config.fg || '#000000'),
            // Gradients
            gradientColor2: hexToRgb((state.config.gradientColors && state.config.gradientColors[1]) || '#000000'),
            gradientType: state.config.gradientType || 0,
            gradientAngle: state.config.gradientAngle || 0,
            // Noise Effect
            noiseAmount: state.config.noiseAmount || 0,
            noiseScale: state.config.noiseScale || 100,
            // Base settings
            backgroundColor: parseBgColor(state.config.bg),
            qrSize: this.lastMatrixSize || 21,
            bodyShape: getBodyShapeId(state.config.bodyShape || 'square'),
            eyeFrameShape: getEyeFrameId(state.config.eyeFrameShape || 'square'),
            eyeBallShape: getEyeBallId(state.config.eyeBallShape || 'square'),
            // Logo
            logo: state.config.logo,
            logoSize: state.config.logoSize || 0.2,
            logoBgEnabled: state.config.logoBgEnabled,
            logoBgColor: state.config.logoBgColor ? hexToRgb(state.config.logoBgColor) : [1, 1, 1],
            logoBgShape: state.config.logoBgShape || 'square',
            logoPadding: state.config.logoPadding || 0,
            logoCornerRadius: state.config.logoCornerRadius || 0,
            logoRotation: state.config.logoRotation || 0,
            logoScale: state.config.logoScale ?? 1.0,
            logoOffsetX: state.config.logoOffsetX || 0,
            logoOffsetY: state.config.logoOffsetY || 0,
            // Art / Background
            artImage: state.config.artEnabled ? state.config.artImage : undefined,
            artOpacity: state.config.artOpacity ?? 1.0,
            artBlendMode: state.config.artBlendMode || 'normal',
            artFit: state.config.artFit || 'cover',
            artRotation: state.config.artRotation || 0,
            artScale: state.config.artScale || 1.0,
            artOffsetX: state.config.artOffsetX || 0,
            artOffsetY: state.config.artOffsetY || 0
        };
    }

    private updateWebGLPreview() {
        if (!this.webglRenderer || !this.lastMatrixSize) return;

        // Use centralized config
        this.webglRenderer.render(this.getFullRenderConfig());

        // Update container background color (since WebGL canvas is transparent)
        if (this.els.qrFrame) {
            // If Art is active, we might want the bg to be transparent so Art shows?
            // Actually, RenderConfig.backgroundColor clears the WebGL buffer.
            // But if we want the "Page" background to show through, we keep this.
            this.els.qrFrame.style.backgroundColor = state.config.bg || '#ffffff';
        }
    }


    private updateUI(type: string, value: string) {
        document.querySelectorAll(`[data-${type}]`).forEach((b) =>
            b.classList.toggle("active", (b as HTMLElement).dataset[type] === value)
        );
    }

    public async init() {
        const ready = await initWasm();
        if (ready && state.text) {
            (window as any).updateQR();
        }
    }

    /**
     * Upload matrix data to WebGL
     * This is now the PRIMARY rendering path.
     */
    private async uploadMatrixToWebGL(liquid: boolean) {
        if (!this.webglRenderer || !state.text) {
            // If no text, just clear rendering?
            return;
        }

        // Always upload if we have text, regardless of "liquid" flag
        // (Liquid flag might control the boolean uniforms, but data is needed always)

        try {
            console.log("uploadMatrixToWebGL: Importing WASM module...");
            // Import get_qr_matrix from WASM module
            const wasmModule = await import('../../../../packages/wasm-qr-svg/pkg/holi_qr_svg.js');
            console.log("uploadMatrixToWebGL: Calling get_qr_matrix for:", state.text, state.config.ecc, state.config.mask);
            const maskVal = (state.config.mask === undefined || state.config.mask === null) ? -1 : state.config.mask;
            const matrixData = wasmModule.get_qr_matrix(state.text, state.config.ecc || 'M', maskVal);

            if (matrixData && matrixData.length > 1) {
                const size = matrixData[0]; // First byte is size
                // IMPORTANT: Create a FRESH Uint8Array (not a view) for WebGL
                // AND Normalize 0/1 to 0/255 for correct texture sampling
                const data = new Uint8Array(size * size);
                for (let i = 0; i < size * size; i++) {
                    data[i] = matrixData[i + 1] ? 255 : 0;
                }
                console.log(`uploadMatrixToWebGL: Matrix ${size}x${size}, ${data.length} bytes (normalized 0-255)`);
                this.lastMatrixSize = size; // Store for render() calls
                this.webglRenderer.setMatrix(data, size);

                // Trigger initial render
                this.updateWebGLPreview();
                this.webglRenderer.setVisible(true);

            } else {
                console.warn("uploadMatrixToWebGL: Empty or invalid matrix data");
            }
        } catch (e) {
            console.error("Failed to upload matrix to WebGL:", e);
        }
    }

    private async renderQR() {
        if (!state.text) return;

        console.log("Rendering QR:", state.text);

        // WEBGL IS ALWAYS PRIMARY for consistency
        // SVG is only used for export

        // Ensure Art Image is loaded into WebGL Texture (if art active)
        if (this.webglRenderer && state.config.artEnabled && state.config.artImage) {
            await this.webglRenderer.setArtImage(state.config.artImage);
        } else if (this.webglRenderer && state.config.logo) {
            // Also ensure Logo loading for Logo mode
            await this.webglRenderer.setLogo(state.config.logo);
        }

        // ALWAYS hide SVG container - WebGL is primary
        if (this.els.qr) {
            this.els.qr.style.display = 'none';
        }

        // ALWAYS use WebGL
        if (this.webglRenderer) {
            this.webglRenderer.setVisible(true);
            // Upload matrix and render (this triggers render internally)
            await this.uploadMatrixToWebGL(true);
            // Trigger verification after render
            scanVerifier.debouncedVerify();
        }
    }

    public generateQR(immediate: boolean = false) {
        console.log("QRController: generateQR called");
        const content = this.getContentData();
        console.log("QRController: content =", content);

        if (!content) {
            console.warn("QRController: No content data found");
            return;
        }
        state.text = content;
        if (this.els.canvas?.classList.contains("generating") || immediate) {
            this.renderQR();
            scanVerifier.debouncedVerify();
        } else {
            this.els.canvas?.classList.add("generating");
            setTimeout(() => { this.renderQR(); scanVerifier.debouncedVerify(); }, 400);
        }
    }

    private debouncedAutoGenerate() {
        if (this.inputDebounceTimer) clearTimeout(this.inputDebounceTimer);
        this.inputDebounceTimer = setTimeout(() => {
            const content = this.getContentData();
            if (content) this.generateQR(true);
        }, 300);
    }

    public resetToZero() {
        state.text = "";
        Object.values(this.els).forEach(el => {
            if (el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) el.value = "";
        });
        if (this.els.qr) this.els.qr.innerHTML = "";
        this.els.canvas?.classList.remove("generating");
        if ((window as any).setContentType) (window as any).setContentType("url");
        this.removeLogo();
    }

    public async copyQRToClipboard() {
        if (!state.text) return;

        try {
            // Capture high-res PNG from WebGL (same as download)
            const blob = await this.getHighResSnapshot(2048);
            if (!blob) {
                alert("Failed to capture QR code");
                return;
            }

            // Copy PNG to clipboard
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);

            console.log("✅ PNG copied to clipboard");
        } catch (e) {
            console.error("Copy failed:", e);
            alert("Copy failed. Try downloading instead.");
        }
    }

    /**
     * Generate SVG string for Export (Download/Copy)
     * Uses WasmSvgRenderer to ensure 1:1 match with WebGL preview
     */
    public async getSVGForExport(): Promise<string> {
        if (!state.text || !this.svgRenderer) return "";

        // Map full config
        const config: RenderConfig = this.getFullRenderConfig();

        return await this.svgRenderer.getSVG(state.text, config);
    }

    /**
     * Capture high-resolution WebGL snapshot for export
     * Returns PNG blob at 2048x2048 resolution (or custom size)
     */
    async getHighResSnapshot(targetSize: number = 2048): Promise<Blob | null> {
        if (!this.webglRenderer || !state.text) {
            console.error('QRController: WebGL renderer not available for snapshot');
            return null;
        }

        // Use centralized render config for consistent output
        const config = this.getFullRenderConfig();

        // Ensure Art Image is loaded if present
        if (config.artImage) {
            await this.webglRenderer.setArtImage(config.artImage);
        }

        return await this.webglRenderer.captureHighRes(config, targetSize);
    }

    private getContentData(): string {
        const type = (window as any).currentContentType || "url";
        const strategy = strategies[type];
        return strategy ? strategy.getData(this.els) : "";
    }

    private async handleLogoUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            const logoUrl = e.target?.result as string;
            state.config.logo = logoUrl;
            state.config.ecc = "H";
            this.updateUI("ecc", "H");
            if (!state.config.logoSize) state.config.logoSize = 0.2;

            // Load logo into WebGL
            if (this.webglRenderer) {
                await this.webglRenderer.setLogo(logoUrl);
            }

            this.updateLogoUI();
            this.generateQR(true);
        };
        reader.readAsDataURL(file);
    }

    private updateLogoUI() {
        const hasLogo = !!state.config.logo;
        const preview = document.getElementById("logo-preview");
        const placeholder = document.getElementById("logo-placeholder");
        const controls = document.getElementById("logo-controls");
        const img = document.getElementById("logo-img") as HTMLImageElement;

        if (hasLogo && preview && placeholder && controls && img) {
            preview.classList.remove("hidden");
            preview.style.display = "flex";
            placeholder.style.display = "none";
            controls.style.display = "flex";
            img.src = state.config.logo || "";
        } else if (!hasLogo && preview && placeholder && controls) {
            preview.classList.add("hidden");
            preview.style.display = "none";
            placeholder.style.display = "flex";
            controls.style.display = "none";
        }
    }

    public removeLogo() {
        state.config.logo = undefined;
        const logoInput = document.getElementById("logo-upload") as HTMLInputElement;
        if (logoInput) logoInput.value = "";
        this.updateLogoUI();
        this.generateQR(true);
    }

    /**
     * Inject brand logo for branded content types (youtube, facebook, etc.)
     * Automatically sets the logo in state.config and updates ECC for better scanning
     */
    private async injectBrandLogo(type: string) {
        // List of branded types that should have logos auto-injected
        const brandedTypes = ['facebook', 'twitter', 'youtube', 'bitcoin', 'appstore', 'playstore', 'wifi'];

        if (brandedTypes.includes(type)) {
            const logo = getTypeLogo(type);
            if (logo) {
                state.config.logo = logo;
                state.config.ecc = 'H'; // High ECC for logo
                state.config.logoSize = state.config.logoSize || 0.2;
                this.updateUI('ecc', 'H');

                // Load logo into WebGL
                if (this.webglRenderer) {
                    await this.webglRenderer.setLogo(logo);
                }

                this.updateLogoUI();
                console.log(`[QRController] Injected brand logo for: ${type}`);
            }
        } else {
            // Clear logo for non-branded types (only auto-injected ones)
            // Don't clear if user uploaded a custom logo
            const currentLogo = state.config.logo;
            // Check if it's a brand logo (starts with data:image/svg+xml and is from our brands)
            if (currentLogo && brandedTypes.some(bt => {
                const brandLogo = getTypeLogo(bt);
                return brandLogo && currentLogo === brandLogo;
            })) {
                state.config.logo = undefined;
                this.updateLogoUI();
                console.log(`[QRController] Cleared brand logo for non-branded type: ${type}`);
            }
        }
    }
}

// hexToRgb moved to ./utils/color.ts

export const qrController = new QRController();
