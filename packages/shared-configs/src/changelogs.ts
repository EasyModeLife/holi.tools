export interface VersionEntry {
    version: string;
    date: string;
    changes: string[];
}

export type LocalizedChangelog = Record<string, VersionEntry[]>;

export const mainAppChangelog: LocalizedChangelog = {
    en: [
        {
            version: "0.1.1",
            date: "2026-01-12",
            changes: [
                "Hotfix: Updated dependencies",
                "Minor UI improvements"
            ]
        },
        {
            version: "0.1.0",
            date: "2026-01-12",
            changes: [
                "Configuration centralization",
                "Architecture cleanup",
                "Prepared for 0.1.0 release"
            ]
        }
    ],
    es: [
        {
            version: "0.1.1",
            date: "2026-01-12",
            changes: [
                "Hotfix: Actualización de dependencias",
                "Mejoras menores de UI"
            ]
        },
        {
            version: "0.1.0",
            date: "2026-01-12",
            changes: [
                "Centralización de configuración",
                "Limpieza de arquitectura",
                "Preparación para release 0.1.0"
            ]
        }
    ]
};

export const qrAppChangelog: LocalizedChangelog = {
    en: [
        {
            version: "0.1.1",
            date: "2026-01-12",
            changes: [
                "Fixed WebGL shader compilation errors",
                "Resolved 'Outdated Optimize Dep' issues"
            ]
        },
        {
            version: "0.1.0",
            date: "2026-01-12",
            changes: [
                "Profound WASM optimization (reduced to ~30kb)",
                "Fixed white background issue",
                "Removed legacy jsPDF dependency",
                "Theme support implementation"
            ]
        }
    ],
    es: [
        {
            version: "0.1.1",
            date: "2026-01-12",
            changes: [
                "Arreglados errores de compilación de shaders WebGL",
                "Resuelto problemas de dependencias optimizadas"
            ]
        },
        {
            version: "0.1.0",
            date: "2026-01-12",
            changes: [
                "Optimización profunda de WASM (reducido a ~30kb)",
                "Arreglado problema de fondo blanco",
                "Eliminada dependencia legacy jsPDF",
                "Implementación de soporte de temas"
            ]
        }
    ]
};

export const labsAppChangelog: VersionEntry[] = [
    {
        version: "0.1.1",
        date: "2026-01-12",
        changes: [
            "Sync with core library updates",
            "General stability improvements"
        ]
    },
    {
        version: "0.1.0",
        date: "2026-01-12",
        changes: [
            "Initial implementation of content collections",
            "WebGPU Shaders integration",
            "Performance experiments"
        ]
    }
];

export const testAppChangelog: VersionEntry[] = [
    {
        version: "0.0.1",
        date: "2024-01-12",
        changes: [
            "Initial Design System prototype",
            "Added Version Control UI system",
            "Implemented GlassCard intensity and alignment fixes"
        ]
    }
];
