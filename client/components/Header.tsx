import { Sprout } from "lucide-react";
import { useI18n } from "@/contexts/i18n";
import LangSwitcher from "@/components/LangSwitcher";

export default function Header() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <a href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sprout className="h-5 w-5" />
          </span>
          <span>{t("brand")}</span>
        </a>
        <div className="flex items-center gap-2">
          <LangSwitcher />
        </div>
      </div>
    </header>
  );
}
