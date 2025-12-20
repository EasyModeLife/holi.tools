import React, { useEffect, useRef } from 'react';

export const ShaderBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wasmRef = useRef<any>(null);

    useEffect(() => {
        const init = async () => {
            if (!canvasRef.current) return;
            try {
                // Dynamically import the Wasm module
                // @ts-ignore
                const wasm = await import('@holi/wasm-core');
                wasmRef.current = wasm;

                // Initialize the WASM module (required for --target web)
                await wasm.default();

                await wasm.start(canvasRef.current);
            } catch (e) {
                console.error("Failed to initialize WebGPU shader:", e);
            }
        };

        init();

        return () => {
            // Cleanup provided by the Rust module
            if (wasmRef.current) {
                wasmRef.current.stop();
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                // Ensure the canvas doesn't block interactions if it's just a background
                pointerEvents: 'none',
            }}
        />
    );
};
