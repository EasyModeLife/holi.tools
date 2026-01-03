export const translations = {
    en: {
        meta_title: "Holi Paint - Creative Canvas",
        meta_description: "A modern, web-based digital painting and drawing tool.",
        hero_title: "holi paint",
        hero_slogan: "Unleash your creativity with our modern digital canvas.",
        coming_soon: "Coming Soon",
        back_home: "Back to Holi.tools",
    },
    es: {
        meta_title: "Holi Paint - Lienzo Creativo",
        meta_description: "Una herramienta moderna de dibujo y pintura digital en la web.",
        hero_title: "holi paint",
        hero_slogan: "Dera rienda suelta a tu creatividad con nuestro lienzo digital moderno.",
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
