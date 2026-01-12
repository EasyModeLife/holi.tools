import { state, generateSVG, downloadBlob, exportPNG } from './qr-engine';

/**
 * ExportManager - Handles downloading QR codes in various formats
 * (SVG, PNG, PDF)
 */
export class ExportManager {

    constructor() { }

    /**
     * Download QR as SVG (WebGL snapshot embedded in SVG wrapper)
     */
    public async downloadSVG() {
        // @ts-ignore
        const pngBlob = await window.qrController?.getHighResSnapshot(2048);
        if (!pngBlob) {
            console.error("ExportManager: Failed to capture WebGL snapshot");
            return;
        }

        // Convert PNG blob to base64
        const base64 = await this.blobToBase64(pngBlob);

        // Create SVG wrapper with embedded PNG for scalability
        const svgWrapper = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="2048" height="2048" viewBox="0 0 2048 2048">
  <rect width="100%" height="100%" fill="${state.config.bg || 'transparent'}"/>
  <image href="${base64}" width="2048" height="2048"/>
</svg>`;

        const blob = new Blob([svgWrapper], { type: "image/svg+xml;charset=utf-8" });
        downloadBlob(blob, `qr-code-${Date.now()}.svg`);
    }

    /**
     * Download QR as PNG (Direct WebGL snapshot)
     */
    public async downloadPNG() {
        // @ts-ignore
        const blob = await window.qrController?.getHighResSnapshot(2048);
        if (!blob) {
            console.error("ExportManager: Failed to capture WebGL snapshot");
            return;
        }
        downloadBlob(blob, `qr-code-${Date.now()}.png`);
    }

    // PDF Export Removed as per user request to save bundle size

    /**
     * Handle download button click (Format selection)
     */
    public handleDownloadAction(format: 'svg' | 'png' | 'pdf' | 'jpeg' | 'webp') {
        switch (format) {
            case 'svg':
                this.downloadSVG();
                break;
            case 'png':
            default:
                this.downloadPNG();
                break;
        }
    }

    /**
     * Helper: Convert Blob to Base64 data URL
     */
    private async blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
}

export const exportManager = new ExportManager();
