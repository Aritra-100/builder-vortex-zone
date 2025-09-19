import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/i18n";
import { Mic, MicOff, Circle } from "lucide-react";

function mapLocaleToSpeechLang(locale: string): string {
  switch (locale) {
    case "en":
      return "en-IN";
    case "hi":
      return "hi-IN";
    case "bn":
      return "bn-IN";
    case "ta":
      return "ta-IN";
    case "te":
      return "te-IN";
    case "mr":
      return "mr-IN";
    case "gu":
      return "gu-IN";
    case "kn":
      return "kn-IN";
    case "ml":
      return "ml-IN";
    case "pa":
      return "pa-IN";
    case "or":
      return "or-IN";
    case "ur":
      return "ur-IN";
    // fallback best-effort
    default:
      return "en-IN";
  }
}

export default function VoiceControl() {
  const { locale, t } = useI18n();
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    const SR: any =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = mapLocaleToSpeechLang(locale);

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    rec.onresult = (event: any) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript as string;
        if (event.results[i].isFinal) finalText += transcript + " ";
        else interim += transcript + " ";
      }
      const payload = (finalText || interim).trim();
      if (payload) {
        window.dispatchEvent(
          new CustomEvent("voice.transcript", {
            detail: { transcript: payload, isFinal: !!finalText },
          }),
        );
      }
    };

    recognitionRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {}
      recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const toggle = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      if (listening) rec.stop();
      else {
        rec.lang = mapLocaleToSpeechLang(locale);
        rec.start();
      }
    } catch {}
  };

  if (!supported) {
    return (
      <Button
        variant="outline"
        size="icon"
        aria-label={t("voiceNotSupported")}
        title={t("voiceNotSupported")}
        disabled
      >
        <MicOff className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant={listening ? "destructive" : "secondary"}
      size="icon"
      onClick={toggle}
      aria-label={listening ? t("stopVoice") : t("startVoice")}
      title={listening ? t("stopVoice") : t("startVoice")}
    >
      {listening ? (
        <span className="relative inline-flex">
          <Mic className="h-5 w-5" />
          <Circle
            className="absolute -right-1 -top-1 h-3 w-3 text-red-500"
            fill="currentColor"
          />
        </span>
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  );
}
