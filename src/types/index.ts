import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type OrderID = `${string}-${string}-${string}-${string}`;

export type ChainAddress = `0x${string}`;

