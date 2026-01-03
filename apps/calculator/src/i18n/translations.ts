export const translations = {
    en: {
        meta_title: "Holi Calculator - Scientific Tool",
        meta_description: "A powerful, privacy-first scientific calculator and math tool.",
        hero_title: "holi calculator",
        hero_slogan: "Precision mathematics. Privacy first. Zero bloat.",
        coming_soon: "Coming Soon",
        back_home: "Back to Holi.tools",
    },
    es: {
        meta_title: "Holi Calculator - Herramienta Científica",
        meta_description: "Una calculadora científica potente y privada.",
        hero_title: "holi calculator",
        hero_slogan: "Matemáticas de precisión. Privacidad primero. Sin bloatware.",
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
    const t = translations[lang as keyof typeof translations] || translations.en;
    return { ...translations.en, ...t };
}
