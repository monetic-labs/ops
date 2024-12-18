import { useMemo } from "react";
import { ISO3166Alpha3Country as Countries } from "@backpack-fux/pylon-sdk";
import { Alpha3 } from "convert-iso-codes";
import { getCountryName } from "iso3166-helper";

type CountryData = {
  key: string;
  value: string;
  label: string;
  countryCode: string;
  flagUrl: string;
};

// Create a cache outside the hook to persist between renders
const countryCache: CountryData[] = [];

export function useCountries() {
  const countries = useMemo(() => {
    // Return cached data if available
    if (countryCache.length > 0) {
      return countryCache;
    }

    // Otherwise, compute and cache the data
    const computedCountries = Object.entries(Countries).map(([key, value]) => {
      const countryCode = Alpha3.toAlpha2(key);
      const countryData = {
        key,
        value,
        label: getCountryName(countryCode, "int") || key,
        countryCode: countryCode.toLowerCase(),
        flagUrl: `https://flagcdn.com/${countryCode.toLowerCase()}.svg`,
      };

      return countryData;
    });

    // Update cache
    countryCache.push(...computedCountries);

    return computedCountries;
  }, []); // Empty deps array since this should only compute once

  return countries;
}
