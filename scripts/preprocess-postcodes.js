   // scripts/preprocess-zipcodes.js

   const fs = require('fs');
   const path = require('path');

   const inputPath = path.join(__dirname, '..', 'data', 'postcodes.json');
   const outputPath = path.join(__dirname, '..', 'data', 'postcodes-map.json');

   try {
    // Read and parse the input JSON file
    const zipCodes = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    const zipMap = {};

   zipCodes.forEach((zip, index) => {
    // Ensure the 'zip' property exists to avoid undefined keys
    if (zip.zip) {
      zipMap[zip.zip] = {
        city: zip.city || null,
        stateAbbreviation: zip.state_id || null,       // Mapped from 'state_id'
        stateName: zip.state_name || null,             // Mapped from 'state_name'
        county: zip.county_name || null,               // Mapped from 'county_name'
        countyFips: zip.county_fips || null,           // Mapped from 'county_fips'
        countyNamesAll: zip.county_names_all || null,  // Mapped from 'county_names_all'
        countyWeights: zip.county_weights || null,
        latitude: parseFloat(zip.lat) || null,          // Converted to number
        longitude: parseFloat(zip.lng) || null,         // Converted to number
        timezone: zip.timezone || null,
        imprecise: zip.imprecise === "TRUE" ? true : false, // Converted to boolean
        density: parseFloat(zip.density) || 0,         // Converted to number
        radius: parseInt(zip.radius, 10) || 0,         // Converted to number
        // If needed, add more fields here
      };
    } else {
      console.warn(`Skipping entry at index ${index} due to missing 'zip' property.`);
    }
  });

  fs.writeFileSync(outputPath, JSON.stringify(zipMap, null, 2));
  console.log(`Preprocessed ZIP code data saved to ${outputPath}`);
} catch (error) {
  console.error('Error during preprocessing:', error.message);
}