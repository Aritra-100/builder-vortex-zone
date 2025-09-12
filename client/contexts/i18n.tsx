import { createContext, useContext, useMemo, useState, PropsWithChildren } from "react";

export type Locale = "en" | "bn";

type Dict = Record<string, string>;

type I18nContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
};

const dictionaries: Record<Locale, Dict> = {
  en: {
    brand: "KrishiYield AI",
    tagline: "Smart crop yield estimation for every farmer",
    heroCta: "Calculate Yield",
    cropType: "Crop type",
    selectCrop: "Select crop",
    rice: "Rice",
    wheat: "Wheat",
    maize: "Maize",
    others: "Others",
    fieldSize: "Field size",
    unit: "Unit",
    acres: "Acres",
    gunthas: "Gunthas",
    hectares: "Hectares",
    location: "Farmer's location",
    detectLocation: "Use GPS",
    orEnterManually: "or enter manually",
    locationPlaceholder: "Village, town or district",
    calculating: "Calculating...",
    resultsTitle: "Estimated crop yield",
    suggestionsTitle: "Suggestions to improve yield",
    fertilizerTips: "Balanced fertilizers based on soil test",
    irrigationTips: "Schedule irrigation at critical growth stages",
    rotationTips: "Practice crop rotation to enrich soil",
    share: "Share",
    reset: "Reset",
    gpsDenied: "Location permission denied. Please enter manually.",
  },
  bn: {
    brand: "কৃষিফল AI",
    tagline: "প্রতি কৃষকের জন্য স্মার্ট ফলন হিসাব",
    heroCta: "ফলন হিসাব করুন",
    cropType: "ফসলের ধরন",
    selectCrop: "ফসল নির্বাচন করুন",
    rice: "ধান",
    wheat: "গম",
    maize: "ভুট্টা",
    others: "অন্যান্য",
    fieldSize: "জমির আকার",
    unit: "একক",
    acres: "একর",
    gunthas: "গুঠা",
    hectares: "হেক্টর",
    location: "কৃষকের অবস্থান",
    detectLocation: "জিপিএস ব্যবহার করুন",
    orEnterManually: "অথবা হাতে লিখুন",
    locationPlaceholder: "গ্রাম, শহর বা জেলা",
    calculating: "হিসাব করা হচ্ছে...",
    resultsTitle: "আনুমানিক ফলন",
    suggestionsTitle: "ফলন বাড়াতে করণীয়",
    fertilizerTips: "মাটির পরীক্ষার ভিত্তিতে সুষম সার",
    irrigationTips: "গুরুত্বপূর্ণ ধাপে সেচ দিন",
    rotationTips: "ফসল পর্যায়ক্রম করুন",
    share: "শেয়ার",
    reset: "রিসেট",
    gpsDenied: "লোকেশন অনুমতি পাওয়া যায়নি। হাতে লিখুন।",
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocale] = useState<Locale>("en");
  const t = useMemo(() => {
    const dict = dictionaries[locale];
    return (key: string) => dict[key] ?? key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
