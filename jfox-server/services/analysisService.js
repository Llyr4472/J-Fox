const { fetchHtml, downloadScripts } = require("../lib/fetch");
const { extractAllJavaScript, extractCrawlableLinks } = require("../lib/parse");
const { findSecretsInContent, findLibrariesInContent } = require("../lib/scan");
const { queryOsvApiBatch } = require("../lib/osv");

const MAX_CRAWL_DEPTH = 3; 
const MAX_PAGES_TO_VISIT = 15; 

async function analyzePage(url) {
  const html = await fetchHtml(url);
  const { scriptUrls, inlineScripts } = extractAllJavaScript(html, url);

  const downloadedScripts = await downloadScripts(scriptUrls);
  const allCodeBlocks = [...downloadedScripts, ...inlineScripts];

  const pageVulnerabilities = [];
  const identifiedLibraries = [];

  for (const codeBlock of allCodeBlocks) {
    let contentToScan = codeBlock.content;
    if (typeof contentToScan !== "string") {
      contentToScan = JSON.stringify(contentToScan, null, 2);
    }

    // Find secrets and add them to results
    const secrets = findSecretsInContent(contentToScan);
    if (secrets.length > 0) {
      pageVulnerabilities.push({
        source: codeBlock.url || codeBlock.source,
        type: "Hardcoded Secret",
        findings: secrets,
      });
    }

    // Identify libraries to check later in a batch
    const libs = findLibrariesInContent(contentToScan);
    libs.forEach((lib) =>
      identifiedLibraries.push({
        ...lib,
        source: codeBlock.url || codeBlock.source,
      })
    );
  }

  // Find links on the page for the crawler
  const links = extractCrawlableLinks(html, url);

  return {
    vulnerabilities: pageVulnerabilities,
    libraries: identifiedLibraries,
    links,
  };
}

// This function crawls a starting URL, analyzes each page for vulnerabilities, and returns all findings.
async function analyzeUrl(startUrl) {
  const urlsToVisit = new Set([startUrl]);
  const visitedUrls = new Set();
  const allFindings = [];

  let currentDepth = 0;
  while (
    urlsToVisit.size > 0 &&
    visitedUrls.size < MAX_PAGES_TO_VISIT &&
    currentDepth < MAX_CRAWL_DEPTH
  ) {
    const currentBatch = Array.from(urlsToVisit);
    urlsToVisit.clear(); // Clear the set for the next level of links

    for (const url of currentBatch) {
      if (visitedUrls.has(url)) continue;

      console.log(`[CRAWL] Analyzing page: ${url} (Depth: ${currentDepth})`);
      visitedUrls.add(url);

      try {
        const pageResult = await analyzePage(url);

        // Add findings from this page
        allFindings.push(...pageResult.vulnerabilities);

        // Add newly found links to the queue for the next level
        pageResult.links.forEach((link) => {
          if (!visitedUrls.has(link)) {
            urlsToVisit.add(link);
          }
        });

        // Check libraries found on this page via OSV
        if (pageResult.libraries.length > 0) {
          const osvResults = await queryOsvApiBatch(pageResult.libraries);
          osvResults.forEach((result, index) => {
            if (result && result.vulns) {
              const lib = pageResult.libraries[index];
              allFindings.push({
                source: lib.source,
                type: "Vulnerable Library",
                findings: {
                  name: lib.name,
                  version: lib.version,
                  vulnerabilities: result.vulns,
                },
              });
            }
          });
        }
      } catch (error) {
        console.error(
          `[CRAWL] Failed to analyze page ${url}: ${error.message}`
        );
        allFindings.push({
          source: url,
          type: "Analysis Error",
          findings: [{ value: error.message }],
        });
      }
    }
    currentDepth++;
  }

  return {
    success: true,
    data: { vulnerabilities: allFindings, pagesScanned: visitedUrls.size },
  };
}

module.exports = { analyzeUrl };
