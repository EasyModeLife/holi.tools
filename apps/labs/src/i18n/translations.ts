export const translations = {
    en: {
        meta_title: "Holi Labs - Experimental",
        meta_description: "Bleeding edge research, WebGPU experiments, and technical papers.",
        hero_slogan: "Bleeding edge research & experiments.",
        coming_soon: "Coming Soon",
        back_home: "Back to Holi.tools",
    },
    es: {
        meta_title: "Holi Labs - Experimental",
        meta_description: "Investigación de vanguardia, experimentos WebGPU y papers técnicos.",
        hero_slogan: "Investigación y experimentos de vanguardia.",
        coming_soon: "Próximamente",
        back_home: "Volver a Holi.tools",
    },
} as const;

export type Language = "en" | "es" | "fr" | "de" | "pt" | "it" | "zh" | "ja" | "ko" | "ru";

export const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "pt", name: "Português" },
    { code: "it", name: "Italiano" },
    { code: "zh", name: "中文" },
    { code: "ja", name: "日本語" },
    { code: "ko", name: "한국어" },
    { code: "ru", name: "Русский" },
] as const;

export function getTranslations(lang: string) {
    // Fallback to English if exact language missing or key missing
    const t = translations[lang as keyof typeof translations] || translations.en;
    // Merge with English to ensure all keys present if partial translation
    return { ...translations.en, ...t };
}
