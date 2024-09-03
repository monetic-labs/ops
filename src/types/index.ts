import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type OrderID = `${string}-${string}-${string}-${string}`;

export type Order = {
  id: OrderID;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  amount: number;
};

export type ChainAddress = `0x${string}`;

export type CountryCode = {
  [key: string]: {
    areaCode: string;
    country: string;
  };
};

export const countryCodes: CountryCode = {
  US: {
    areaCode: "+1",
    country: "United States",
  },
  GB: {
    areaCode: "+44",
    country: "United Kingdom",
  },
  SP: {
    areaCode: "+34",
    country: "Spain",
  },
  FR: {
    areaCode: "+33",
    country: "France",
  },
  IT: {
    areaCode: "+39",
    country: "Italy",
  },
  DE: {
    areaCode: "+49",
    country: "Germany",
  },
  JP: {
    areaCode: "+81",
    country: "Japan",
  },
  AU: {
    areaCode: "+61",
    country: "Australia",
  },
  CA: {
    areaCode: "+1",
    country: "Canada",
  },
  MX: {
    areaCode: "+52",
    country: "Mexico",
  },
  IN: {
    areaCode: "+91",
    country: "India",
  },
  BR: {
    areaCode: "+55",
    country: "Brazil",
  },
  ZA: {
    areaCode: "+27",
    country: "South Africa",
  },
  NZ: {
    areaCode: "+64",
    country: "New Zealand",
  },
  SG: {
    areaCode: "+60",
    country: "Singapore",
  },
};

export type StateCode = {
  [key: string]: {
    state: string;
    code: string;
  };
};

export const stateCodes: StateCode = {
  US: {
    state: "California",
    code: "CA",
  },
  GB: {
    state: "London",
    code: "LDN",
  },
  CA: {
    state: "Ontario",
    code: "ON",
  },
  AU: {
    state: "New South Wales",
    code: "NSW",
  },
  FR: {
    state: "Paris",
    code: "PRS",
  },
  IT: {
    state: "Rome",
    code: "RM",
  },
  DE: {
    state: "Berlin",
    code: "BR",
  },
  JP: {
    state: "Tokyo",
    code: "TK",
  },
  IN: {
    state: "Delhi",
    code: "DL",
  },
  BR: {
    state: "Sao Paulo",
    code: "SP",
  },
  ZA: {
    state: "Cape Town",
    code: "CT",
  },
  NZ: {
    state: "Auckland",
    code: "AK",
  },
  SG: {
    state: "Singapore",
    code: "SG",
  },
};

export type ISO3166Alpha2Country = "US" | "CA" | "GB" | "FR" | "DE" | "JP" | "AU" | "IN" | "BR" | "ZA" | "NZ" | "SG" | "MX" | "IT" | "ES";