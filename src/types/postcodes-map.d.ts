   // src/types/postcodes-map.d.ts

   declare module '@/data/postcodes-map.json' {
    interface PostcodeMap {
      city: string | null;
      stateAbbreviation: string | null;
      stateName?: string | null;
      county?: string | null;
      countyFips?: string | null;
      countyNamesAll?: string | null;
      countyWeights?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      timezone?: string | null;
      imprecise?: boolean;
      density?: number;
      radius?: number;
    }

    const value: { [postcode: string]: PostcodeMap };
    export default value;
  }