import fs from "fs";
import path from "path";
import csv from "csvtojson";

interface PostcodeData {
  zip: string;
  city: string | null;
  state_id: string | null;
  state_name: string | null;
  county_name: string | null;
  county_fips: string | null;
  county_names_all: string | null;
  county_weights: string | null;
  lat: string;
  lng: string;
  timezone: string | null;
  imprecise: string;
  density: string;
  radius: string;
}

interface PostcodeMap {
  [key: string]: {
    city: string | null;
    stateAbbreviation: string | null;
    stateName: string | null;
    county: string | null;
    countyFips: string | null;
    countyNamesAll: string | null;
    countyWeights: string | null;
    latitude: number | null;
    longitude: number | null;
    timezone: string | null;
    imprecise: boolean;
    density: number;
    radius: number;
  };
}

const csvFilePath = path.join(__dirname, "../data/postcodes.csv");
const jsonFilePath = path.join(__dirname, "../data/postcodes.json");
const outputPath = path.join(__dirname, "../data/postcodes-map.json");

async function processPostcodes() {
  try {
    // Convert CSV to JSON
    const jsonData = await csv().fromFile(csvFilePath);
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));
    console.log("CSV file successfully converted to JSON.");

    // Preprocess JSON data
    const postcodeMap: PostcodeMap = {};

    jsonData.forEach((postcode: PostcodeData, index: number) => {
      if (postcode.zip) {
        postcodeMap[postcode.zip] = {
          city: postcode.city || null,
          stateAbbreviation: postcode.state_id || null,
          stateName: postcode.state_name || null,
          county: postcode.county_name || null,
          countyFips: postcode.county_fips || null,
          countyNamesAll: postcode.county_names_all || null,
          countyWeights: postcode.county_weights || null,
          latitude: parseFloat(postcode.lat) || null,
          longitude: parseFloat(postcode.lng) || null,
          timezone: postcode.timezone || null,
          imprecise: postcode.imprecise === "TRUE",
          density: parseFloat(postcode.density) || 0,
          radius: parseInt(postcode.radius, 10) || 0,
        };
      } else {
        console.warn(`Skipping entry at index ${index} due to missing 'zip' property.`);
      }
    });

    fs.writeFileSync(outputPath, JSON.stringify(postcodeMap, null, 2));
    console.log(`Preprocessed postcode data saved to ${outputPath}`);
  } catch (error) {
    console.error("Error during processing:", error);
  }
}

processPostcodes();
