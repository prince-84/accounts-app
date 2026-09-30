"use client";

import React, { useState, useEffect } from "react";
import { COUNTRIES_DATA, CountryConfig, getCitiesByCountry, getCountryByName } from "@/data/countries-cities";

interface CountryCitySelectProps {
  country: string;
  city: string;
  onCountryChange: (country: string, config?: CountryConfig) => void;
  onCityChange: (city: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export default function CountryCitySelect({
  country,
  city,
  onCountryChange,
  onCityChange,
  required = true,
  disabled = false,
}: CountryCitySelectProps) {
  const currentConfig = getCountryByName(country) || COUNTRIES_DATA[0];
  const cities = getCitiesByCountry(country || currentConfig.name);

  // Check if current city is in the predefined list
  const isCityInList = cities.includes(city);
  const [isCustomCity, setIsCustomCity] = useState(!isCityInList && city.trim() !== "");

  useEffect(() => {
    if (cities.includes(city)) {
      setIsCustomCity(false);
    }
  }, [cities, city]);

  const handleCountrySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCountry = e.target.value;
    const config = getCountryByName(selectedCountry);
    const newCities = config ? config.cities : [];
    const defaultCity = newCities[0] || "";

    setIsCustomCity(false);
    onCountryChange(selectedCountry, config);
    onCityChange(defaultCity);
  };

  const handleCitySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === "__custom__") {
      setIsCustomCity(true);
      onCityChange("");
    } else {
      setIsCustomCity(false);
      onCityChange(selected);
    }
  };

  return (
    <>
      {/* Country Dropdown */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-[#0F172A]">
          Country / Jurisdiction {required && <span className="text-[#EF4444]">*</span>}
        </label>
        <select
          value={country}
          disabled={disabled}
          onChange={handleCountrySelect}
          className="w-full rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] disabled:opacity-50"
        >
          {COUNTRIES_DATA.map((c) => (
            <option key={c.name} value={c.name}>
              {c.flag} {c.name} ({c.currency})
            </option>
          ))}
          {!COUNTRIES_DATA.some((c) => c.name.toLowerCase() === country.toLowerCase()) && country && (
            <option value={country}>🌐 {country}</option>
          )}
        </select>
      </div>

      {/* City Dropdown */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-[#0F172A]">
          City / Emirate / State {required && <span className="text-[#EF4444]">*</span>}
        </label>
        {!isCustomCity ? (
          <select
            value={city}
            disabled={disabled}
            onChange={handleCitySelect}
            className="w-full rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] disabled:opacity-50"
          >
            {cities.map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
            {!cities.includes(city) && city && (
              <option value={city}>{city}</option>
            )}
            <option value="__custom__">➕ Other / Enter Custom City...</option>
          </select>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                disabled={disabled}
                placeholder="Type city or state name..."
                value={city}
                onChange={(e) => onCityChange(e.target.value)}
                className="w-full rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => {
                  setIsCustomCity(false);
                  onCityChange(cities[0] || "");
                }}
                className="shrink-0 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-2 text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              >
                List
              </button>
            </div>
            <p className="text-[10px] text-[#64748B]">Custom city entry active.</p>
          </div>
        )}
      </div>
    </>
  );
}
