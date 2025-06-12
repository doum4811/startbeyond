import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ko from "./locales/ko/translation.json";
import en from "./locales/en/translation.json";

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: {
          translation: en,
        },
        ko: {
          translation: ko,
        },
      },
      fallbackLng: "ko",
      debug: true,
      interpolation: {
        escapeValue: false, // not needed for react as it escapes by default
      },
      returnEmptyString: true,
    });
}

export default i18n; 