import { SVGProps } from "react";
import { ISO3166Alpha2Country } from "@backpack-fux/pylon-sdk";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type OrderID = `${string}-${string}-${string}-${string}`;

export type ChainAddress = `0x${string}`;

