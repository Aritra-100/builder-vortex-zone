import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, MapPin, Sprout, Wheat, Compass, Repeat, Search } from "lucide-react";
import { useI18n } from "@/contexts/i18n";
import type { AiYieldEstimateRequest, AiYieldEstimateResponse, MarketPricesResponse } from "@shared/api";

export default function Index() {
  const { t, locale } = useI18n();

  const [crop, setCrop] = useState<string>("rice");
  const [size, setSize] = useState<string>("");
  const [unit, setUnit] = useState<string>("acres");
  const [locationName, setLocationName] = useState<string>("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiYieldEstimateResponse | null>(null);
  const [priceQuery, setPriceQuery] = useState("");
  const [prices, setPrices] = useState<MarketPricesResponse | null>(null);
  const [searching, setSearching] = useState(false);

  // Attempt GPS on mount (non-blocking)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }, []);

  // Geocode manual entry -> coords
  useEffect(() => {
    const q = locationName.trim();
    if (q.length < 3) {
      setGeocodeError(null);
      return;
    }
    let cancelled = false;
    const ctl = new AbortController();
    const doGeocode = async () => {
      try {
        setGeocoding(true);
        setGeocodeError(null);
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("format", "json");
        url.searchParams.set("q", q);
        url.searchParams.set("limit", "1");
        url.searchParams.set("addressdetails", "1");
        const resp = await fetch(url.toString(), {
          signal: ctl.signal,
          headers: { "Accept-Language": locale },
        });
        const data = (await resp.json()) as Array<{ lat: string; lon: string }>;
        if (!cancelled && data && data[0]) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          if (isFinite(lat) && isFinite(lng)) setCoords({ lat, lng });
        } else if (!cancelled) {
          setGeocodeError(t("locationNotFound"));
        }
      } catch {
        if (!cancelled) setGeocodeError(t("locationNotFound"));
      } finally {
        if (!cancelled) setGeocoding(false);
      }
    };
    const id = setTimeout(doGeocode, 500);
    return () => {
      cancelled = true;
      ctl.abort();
      clearTimeout(id);
    };
  }, [locationName, locale, t]);

  const crops = useMemo(
    () => [
      { value: "rice", label: t("rice") },
      { value: "wheat", label: t("wheat") },
      { value: "maize", label: t("maize") },
      { value: "others", label: t("others") },
    ],
    [locale],
  );

  const units = useMemo(
    () => [
      { value: "acres", label: t("acres") },
      { value: "gunthas", label: t("gunthas") },
      { value: "hectares", label: t("hectares") },
    ],
    [locale],
  );

  const detectLocation = async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert(t("gpsDenied")),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const onSubmit = async () => {
    setLoading(true);
    setResult(null);
    try {
      const payload: AiYieldEstimateRequest = {
        cropType: crop,
        fieldSize: parseFloat(size),
        unit,
        location: {
          name: locationName.trim() || undefined,
          latitude: coords?.lat,
          longitude: coords?.lng,
        },
        locale,
      };
      const res = await fetch("/api/ai/yield", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: AiYieldEstimateResponse = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch market prices when query changes (debounced)
  useEffect(() => {
    const q = priceQuery.trim();
    if (!q) {
      setPrices(null);
      return;
    }
    let cancelled = false;
    const id = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await fetch(`/api/market/prices?query=${encodeURIComponent(q)}`);
        const data: MarketPricesResponse = await res.json();
        if (!cancelled) setPrices(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [priceQuery]);

  const reset = () => {
    setSize("");
    setLocationName("");
    setResult(null);
  };

  // Area in hectares (client-side, to display t/ha)
  const areaHa = useMemo(() => {
    const val = parseFloat(size);
    if (!isFinite(val) || val <= 0) return 0;
    if (unit === "hectares") return val;
    if (unit === "acres") return val * 0.4046856422;
    if (unit === "gunthas") return val * (0.4046856422 / 40);
    return 0;
  }, [size, unit]);

  // Voice control integration
  useEffect(() => {
    const handler = (e: any) => {
      const text: string = (e.detail?.transcript || "").toLowerCase();
      if (!text) return;

      const hasAny = (arr: string[]) => arr.some((k) => text.includes(k));

      // Quick actions
      if (hasAny(["reset", "रीसेट", "রিসেট"])) {
        reset();
        return;
      }
      if (hasAny(["gps", "detect", "location", "स्थान", "লোকেশন"])) {
        detectLocation();
        return;
      }
      if (hasAny(["calculate", "गणना", "हिसाब", "গণনা", "হিসাব"])) {
        if (size) onSubmit();
        return;
      }

      // Set crop if mentioned
      const cropNames = [
        { v: "rice", names: ["rice", t("rice").toLowerCase()] },
        { v: "wheat", names: ["wheat", t("wheat").toLowerCase()] },
        { v: "maize", names: ["maize", t("maize").toLowerCase(), "corn"] },
        { v: "others", names: [t("others").toLowerCase()] },
      ];
      for (const c of cropNames) {
        if (c.names.some((n) => text.includes(n))) {
          setCrop(c.v);
          break;
        }
      }

      // Set unit and size if mentioned
      const num = text.match(/([0-9]+(?:\.[0-9]+)?)/);
      if (num) {
        setSize(num[1]);
        if (hasAny(["hectare", "hectares", t("hectares").toLowerCase()])) setUnit("hectares");
        else if (hasAny(["acre", "acres", t("acres").toLowerCase()])) setUnit("acres");
        else if (hasAny(["guntha", "gunthas", t("gunthas").toLowerCase()])) setUnit("gunthas");
      }

      // Price search intent
      if (hasAny(["price", "prices", "rate", "market", "दाम", "कीमत", "भाव", "দাম", "দর", "ব��জার"])) {
        const found = cropNames.find((c) => c.names.some((n) => text.includes(n)));
        if (found) setPriceQuery(found.names[0]);
        else setPriceQuery(text);
        return;
      }

      // If nothing matched and transcript is final, use as price query fallback
      if (e.detail?.isFinal && !priceQuery) {
        setPriceQuery(text);
      }
    };

    window.addEventListener("voice.transcript", handler as EventListener);
    return () => window.removeEventListener("voice.transcript", handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, t, size]);

  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50 via-emerald-50/70 to-white" />
        <div className="absolute inset-x-0 -top-24 -z-10 h-72 rounded-b-[50%] bg-gradient-to-b from-emerald-200/50 to-transparent blur-2xl" />
        <div className="container mx-auto px-4 py-10 sm:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-3xl font-extrabold tracking-tight text-emerald-900 sm:text-4xl"
            >
              {t("brand")} 
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mt-3 text-base text-emerald-800/80 sm:text-lg"
            >
              {t("tagline")}
            </motion.p>
          </div>

          <div className="mx-auto mt-8 grid max-w-5xl gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3 p-6 shadow-sm">
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <Label className="text-base font-semibold text-emerald-900">
                    {t("cropType")}
                  </Label>
                  <Select value={crop} onValueChange={setCrop}>
                    <SelectTrigger className="h-14 text-base">
                      <SelectValue placeholder={t("selectCrop")} />
                    </SelectTrigger>
                    <SelectContent>
                      {crops.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label className="text-base font-semibold text-emerald-900">
                    {t("fieldSize")}
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      inputMode="decimal"
                      value={size}
                      onChange={(e) => setSize(e.target.value.replace(/[^0-9.]/g, ""))}
                      placeholder="0.00"
                      className="col-span-2 h-14 text-lg"
                    />
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger className="h-14 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((u) => (
                          <SelectItem key={u.value} value={u.value}>
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-base font-semibold text-emerald-900">
                    {t("location")}
                  </Label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button onClick={detectLocation} variant="secondary" className="h-14 text-base">
                      <Compass className="h-5 w-5" /> {t("detectLocation")}
                    </Button>
                    <div className="flex items-center gap-2 text-sm text-emerald-800/70 sm:mx-1">
                      <span>{t("orEnterManually")}</span>
                    </div>
                    <Input
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder={t("locationPlaceholder")}
                      className="h-14 text-base flex-1"
                    />
                  </div>
                  {geocoding && (
                    <div className="mt-1 text-sm text-emerald-800/70">{t("locating")}</div>
                  )}
                  {coords && (
                    <div className="mt-1 flex items-center gap-2 text-sm text-emerald-800/70">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                      </span>
                    </div>
                  )}
                  {geocodeError && (
                    <div className="mt-1 text-sm text-red-600">{geocodeError}</div>
                  )}

                  {coords && (
                    <div className="mt-3">
                      <Label className="text-sm font-medium text-emerald-900">{t("mapTitle")}</Label>
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=13/${coords.lat}/${coords.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block mt-2 overflow-hidden rounded-md border"
                        aria-label={t("viewOnMap")}
                      >
                        <img
                          src={`https://staticmap.openstreetmap.de/staticmap.php?center=${coords.lat},${coords.lng}&zoom=13&size=640x320&maptype=mapnik&markers=${coords.lat},${coords.lng},darkgreen`}
                          alt="Map preview"
                          className="w-full h-auto"
                          loading="lazy"
                        />
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={onSubmit} className="h-14 px-6 text-base" disabled={loading || !size}>
                    <Sprout className="h-5 w-5" /> {loading ? t("calculating") : t("heroCta")}
                  </Button>
                  <Button onClick={reset} variant="ghost" className="h-14 px-6 text-base">
                    {t("reset")}
                  </Button>
                </div>
              </div>
            </Card>

            <div className="lg:col-span-2 grid gap-6">
              <Card className="p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <Search className="h-6 w-6 text-emerald-700" />
                  <h3 className="text-lg font-semibold text-emerald-900">{t("priceResults")}</h3>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Input
                    value={priceQuery}
                    onChange={(e) => setPriceQuery(e.target.value)}
                    placeholder={t("searchPrices")}
                    className="h-12 text-base"
                  />
                </div>
                {searching && (
                  <p className="mt-3 text-sm text-emerald-800/70">{t("calculating")}</p>
                )}
                {prices && prices.items.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-emerald-900">
                        <tr className="text-left">
                          <th className="py-2 pr-4">{t("cropType")}</th>
                          <th className="py-2 pr-4">{t("market")}</th>
                          <th className="py-2 pr-4">{t("state")}</th>
                          <th className="py-2 pr-4">{t("date")}</th>
                          <th className="py-2 pr-4">{t("min")}</th>
                          <th className="py-2 pr-4">{t("modal")}</th>
                          <th className="py-2 pr-4">{t("max")}</th>
                          <th className="py-2 pr-4">{t("unitLabel")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prices.items.map((it, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="py-2 pr-4">{it.crop}</td>
                            <td className="py-2 pr-4">{it.market}</td>
                            <td className="py-2 pr-4">{it.state}</td>
                            <td className="py-2 pr-4">{new Date(it.date).toLocaleDateString()}</td>
                            <td className="py-2 pr-4">{it.min}</td>
                            <td className="py-2 pr-4">{it.modal}</td>
                            <td className="py-2 pr-4">{it.max}</td>
                            <td className="py-2 pr-4">{it.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
              <Card className="p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <Wheat className="h-6 w-6 text-emerald-700" />
                  <h3 className="text-lg font-semibold text-emerald-900">
                    {t("resultsTitle")}
                  </h3>
                </div>
                <AnimatePresence mode="wait">
                  {result ? (
                    <motion.div
                      key="res"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="mt-4"
                    >
                      <div className="text-4xl font-extrabold text-emerald-900">
                        {areaHa > 0 ? (result.estimatedYield / areaHa).toFixed(2) + " t/ha" : result.estimatedYield.toFixed(2) + " t"}
                      </div>
                      <p className="mt-1 text-sm text-emerald-800/70">
                        {result.note}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.p
                      key="placeholder"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="mt-4 text-sm text-emerald-800/70"
                    >
                      —
                    </motion.p>
                  )}
                </AnimatePresence>
              </Card>

              <Card className="p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <Droplets className="h-6 w-6 text-emerald-700" />
                  <h3 className="text-lg font-semibold text-emerald-900">
                    {t("suggestionsTitle")}
                  </h3>
                </div>
                <ul className="mt-4 grid gap-3">
                  <li className="flex items-start gap-3 text-emerald-900">
                    <Sprout className="mt-0.5 h-5 w-5 text-emerald-700" />
                    <span>{t("fertilizerTips")}</span>
                  </li>
                  <li className="flex items-start gap-3 text-emerald-900">
                    <Droplets className="mt-0.5 h-5 w-5 text-emerald-700" />
                    <span>{t("irrigationTips")}</span>
                  </li>
                  <li className="flex items-start gap-3 text-emerald-900">
                    <Repeat className="mt-0.5 h-5 w-5 text-emerald-700" />
                    <span>{t("rotationTips")}</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
