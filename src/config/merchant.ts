import { ISO3166Alpha2Country } from "@backpack-fux/pylon-sdk";
import { v4 as uuidv4 } from "uuid";

export const merchantConfig = {
  fee: 3,
  country: "US" as ISO3166Alpha2Country,
  role: "account owner",
  id: uuidv4(),
  iovationBlackbox: "extragay",
};
