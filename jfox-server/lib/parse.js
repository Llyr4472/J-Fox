const cheerio = require("cheerio");
const { URL } = require("url");

/**
 * Extracts all executable JavaScript content from an HTML page.
 * This includes external script URLs, inline script content, and JS in attributes.
 * @param {string} html - The HTML content of the page.
 * @param {string} baseUrl - The base URL of the page, for resolving relative paths.
 * @returns {Object} - An object containing arrays of script URLs and inline code blocks.
 */
function extractAllJavaScript(html, baseUrl) {
  console.log(`[Parse] Extracting all JS from page...`);
  const $ = cheerio.load(html);

  // Extract external script URLs
  const scriptUrls = [];
  $("script[src]").each((_, element) => {
    try {
      const scriptSrc = $(element).attr("src");
      const absoluteUrl = new URL(scriptSrc, baseUrl).href;
      scriptUrls.push(absoluteUrl);
    } catch (e) {
      console.warn(
        `[Parse] Skipping invalid script URL: ${$(element).attr("src")}`
      );
    }
  });

  // Extract inline script content
  const inlineScripts = [];
  $("script:not([src])").each((_, element) => {
    const content = $(element).html();
    if (content) {
      inlineScripts.push({
        source: "inline-script",
        content: content,
      });
    }
  });

  // Extract JavaScript from event handler attributes (e.g., onclick)
  $("*").each((_, element) => {
    const attributes = $(element).attr();
    for (const attrName in attributes) {
      if (attrName.toLowerCase().startsWith("on")) {
        const content = $(element).attr(attrName);
        if (content) {
          inlineScripts.push({
            source: `attribute:${attrName}`,
            content: content,
          });
        }
      }
    }
  });

  console.log(
    `[Parse] Found ${scriptUrls.length} external scripts and ${inlineScripts.length} inline/attribute code blocks.`
  );
  return { scriptUrls, inlineScripts };
}

/**
 * Extracts all unique, crawlable links from an HTML page.
 * @param {string} html - The HTML content of the page.
 * @param {string} baseUrl - The base URL of the page.
 * @returns {Array<string>} - An array of unique, absolute URLs to crawl.
 */
function extractCrawlableLinks(html, baseUrl) {
  const $ = cheerio.load(html);
  const links = new Set();
  const baseOrigin = new URL(baseUrl).origin;

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");

    // Skip empty or placeholder links
    if (!href || href.startsWith("#") || href.trim() === "") {
      return; // 'return' inside a .each() is like 'continue' in a for loop
    }

    // Explicitly skip Cloudflare email protection links
    if (href.includes("/cdn-cgi/l/email-protection")) {
      return;
    }

    // Skip non-HTTP protocols
    if (
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    ) {
      return;
    }

    try {
      const absoluteUrl = new URL(href, baseUrl);

      // Only crawl links that are on the same domain/origin
      if (absoluteUrl.origin === baseOrigin) {
        // Remove the hash (#) part of the URL, as it's the same page
        links.add(absoluteUrl.href.split("#")[0]);
      }
    } catch (e) {
      console.warn(`[Parse] Skipping invalid link: ${href}`);
    }
  });

  return Array.from(links);
}

module.exports = { extractAllJavaScript, extractCrawlableLinks };