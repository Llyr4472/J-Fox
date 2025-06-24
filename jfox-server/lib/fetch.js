const axios = require('axios');

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
};

async function fetchHtml(targetUrl) {
  console.log(`[Fetch] Fetching HTML from: ${targetUrl}`);
  const response = await axios.get(targetUrl, { headers: BROWSER_HEADERS });
  return response.data;
}

async function downloadScripts(urls) {
  console.log(`[Fetch] Downloading content for ${urls.length} scripts...`);
  const downloadPromises = urls.map(url => axios.get(url, { headers: BROWSER_HEADERS }));
  const responses = await Promise.all(downloadPromises);
  const scriptsData = responses.map((response, index) => ({
    url: urls[index],
    content: response.data,
  }));
  console.log(`[Fetch] All scripts downloaded successfully.`);
  return scriptsData;
}

module.exports = { fetchHtml, downloadScripts };