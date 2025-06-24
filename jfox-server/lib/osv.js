const axios = require("axios");

const OSV_API_BATCH_URL = "https://api.osv.dev/v1/querybatch";

async function queryOsvApiBatch(libraries) {
  if (!libraries || libraries.length === 0) {
    return []; // Don't make an API call if there's nothing to query.
  }

  console.log(`[OSV] Starting batch query for ${libraries.length} libraries.`);

  // Construct the array of queries for the batch request.
  const queries = libraries.map((lib) => ({
    version: lib.version,
    package: {
      name: lib.name,
      // Use the correct ecosystem for JavaScript libraries.
      ecosystem: "npm",
    },
  }));

  try {
    const response = await axios.post(OSV_API_BATCH_URL, { queries: queries });

    // The 'results' property will be an array corresponding to our queries array.
    const results = response.data.results || [];
    console.log(
      `[OSV] Batch query successful. Received ${results.length} results.`
    );
    return results;
  } catch (error) {
    console.error(`[OSV] Batch API error: ${error.message}`);
    return []; // Return an empty array on failure.
  }
}

module.exports = { queryOsvApiBatch };
