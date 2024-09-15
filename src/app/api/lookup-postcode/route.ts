import { NextResponse } from "next/server";
import postcodeMap from "@/data/postcodes-map.json";

import { merchantConfig } from "@/config/merchant";

export async function GET(request: Request) {
  console.log("lookup-zip API route called", request.url);

  const { searchParams } = new URL(request.url);
  const postcode = searchParams.get("postcode");

  if (!postcode) {
    return NextResponse.json({ error: "Invalid zip code" }, { status: 400 });
  }

  try {
    const result = postcodeMap[postcode];

    if (result) {
      return NextResponse.json({
        city: result.city,
        state: result.stateAbbreviation,
        postcode: postcode,
        country: merchantConfig.country,
      });
    } else {
      return NextResponse.json({ error: "Zip code not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error looking up zip code:", error);

    return NextResponse.json({ error: "Error looking up zip code" }, { status: 500 });
  }
}
