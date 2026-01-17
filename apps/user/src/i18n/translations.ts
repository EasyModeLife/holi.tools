export const translations = {
  en: {
    changelog_title: "Version Log",
    changelog_current: "Current",
    changelog_footer: "Unified Sovereign Suite",
  },
  es: {
    changelog_title: "Registro de Versiones",
    changelog_current: "Actual",
    changelog_footer: "Suite Soberana Unificada",
  },
} as const;

export type Language = keyof typeof translations;

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
  const key = (lang || "en") as Language;
  return (translations as any)[key] || translations.en;
}
