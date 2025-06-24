console.log("[Scan] Scanner module loaded.");

const CONTEXT_KEYWORDS = [
  "apikey",
  "api_key",
  "client_secret",
  "secret",
  "token",
  "auth",
  "password",
  "pass",
  "key",
  "bearer",
  "credential",
];

// Patterns for a generic, high-entropy string.
// We look for strings of 20-60 characters that mix letters, numbers, and symbols.
const HIGH_ENTROPY_STRING_PATTERN = new RegExp(
  "[a-zA-Z0-9-_.+!@#$%^&*()]{20,60}",
  "g"
);

// Patterns that are highly specific and likely to be a secret on their own.
const HIGH_CONFIDENCE_PATTERNS = {
  GOOGLE_API_KEY: new RegExp("AIza[0-9A-Za-z-_]{35}"),
  AWS_ACCESS_KEY_ID: new RegExp("AKIA[0-9A-Z]{16}"),
  SLACK_TOKEN: new RegExp(
    "(xox[p|b|a|r]-[0-9]{12}-[0-9]{12}-[0-9]{12}-[a-z0-9]{32})",
    "i"
  ),
  GITHUB_TOKEN: new RegExp("ghp_[0-9a-zA-Z]{36}"),
  RSA_PRIVATE_KEY: new RegExp("-----BEGIN RSA PRIVATE KEY-----"),
};

// Common placeholder values to ignore.
const IGNORE_PATTERNS = [
  /your-api-key/i,
  /your-secret/i,
  /placeholder/i,
  /example/i,
  /test-key/i,
  /dummy-key/i,
  /sample-key/i,
  /test-secret/i,
  /dummy-secret/i,
  /example-key/i,
  /test-token/i,
  /dummy-token/i,
  /example-token/i,
  /your-token/i,
  /your-password/i,
  /your-client-secret/i,
  /your-access-key/i,
];

const MINIFIED_LINE_LENGTH_THRESHOLD = 1000;

const DOMAIN_NAME_PATTERN = new RegExp(/([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}/);

// --- ENTROPY CALCULATION --
function calculateEntropy(str) {
  if (!str) return 0;
  const frequency = {};
  for (const char of str) {
    frequency[char] = (frequency[char] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const char in frequency) {
    const p = frequency[char] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

// --- REWRITTEN CORE SCANNER ---
function findSecretsInContent(content) {
  const allFindings = new Map();
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    const trimmedLine = line.trim();

    // --- HEURISTIC: Check if the line looks minified ---
    const isMinified = trimmedLine.length > MINIFIED_LINE_LENGTH_THRESHOLD;

    // Tier 1, check for high-confidence, specific patterns.
    for (const [type, pattern] of Object.entries(HIGH_CONFIDENCE_PATTERNS)) {
      const match = trimmedLine.match(pattern);
      if (match && !allFindings.has(match[0])) {
        allFindings.set(match[0], {
          type,
          value: match[0],
          confidence: "High",
          lineNumber,
          lineContent: trimmedLine,
        });
      }
    }

    // Tier 2, check for generic high-entropy strings.
    if (!isMinified) {
      const hasContextKeyword = CONTEXT_KEYWORDS.some((keyword) =>
        trimmedLine.toLowerCase().includes(keyword)
      );

      if (hasContextKeyword) {
        const entropyMatches = trimmedLine.match(HIGH_ENTROPY_STRING_PATTERN);
        if (entropyMatches) {
          for (const match of entropyMatches) {
            // 1. Check if it's an obvious placeholder
            const isIgnoredPlaceholder = IGNORE_PATTERNS.some((p) =>
              p.test(match)
            );
            if (isIgnoredPlaceholder || allFindings.has(match)) continue;

            // 2. Check if it looks like a domain name
            const isDomainName = DOMAIN_NAME_PATTERN.test(match);
            if (isDomainName) continue; // If it's a domain, skip it!

            // 3. Only now, calculate entropy
            const entropy = calculateEntropy(match);
            if (entropy > 3.5) {
              allFindings.set(match, {
                type: "Generic Secret (High Entropy)",
                value: match,
                confidence: "Medium",
                lineNumber,
                lineContent: trimmedLine,
              });
            }
          }
        }
      }
    }
  }

  return Array.from(allFindings.values());
  }

// --- LIBRARY IDENTIFICATION ---
const LIBRARY_PATTERNS = [
  { name: "jquery", pattern: /jQuery v([0-9.]+)/ },
  { name: "angular.js", pattern: /AngularJS v([0-9.]+)/ },
  { name: "react", pattern: /React v([0-9.]+)/ },
  { name: "vue.js", pattern: /Vue.js v([0-9.]+)/ },
  { name: "bootstrap", pattern: /Bootstrap v([0-9.]+)/ },
  { name: "lodash", pattern: /lodash v([0-9.]+)/ },
  { name: "moment.js", pattern: /moment.js v([0-9.]+)/ },
  { name: "axios", pattern: /axios v([0-9.]+)/ },
  { name: "express", pattern: /Express v([0-9.]+)/ },
  { name: "d3.js", pattern: /D3 v([0-9.]+)/ },
  { name: "underscore.js", pattern: /Underscore.js v([0-9.]+)/ },
  { name: "backbone.js", pattern: /Backbone.js v([0-9.]+)/ },
  { name: "chart.js", pattern: /Chart.js v([0-9.]+)/ },
  { name: "socket.io", pattern: /Socket.IO v([0-9.]+)/ },
  { name: "three.js", pattern: /Three.js v([0-9.]+)/ },
  { name: "redux", pattern: /Redux v([0-9.]+)/ },
  { name: "vuex", pattern: /Vuex v([0-9.]+)/ },
  { name: "next.js", pattern: /Next\.js v([0-9.]+)/ },
  { name: "nuxt.js", pattern: /Nuxt\.js v([0-9.]+)/ },
];

function findLibrariesInContent(content) {
  const findings = [];
  for (const lib of LIBRARY_PATTERNS) {
    const match = content.match(lib.pattern);
    if (match && match[1]) {
      findings.push({
        name: lib.name,
        version: match[1],
      });
    }
  }
  if (findings.length > 0) {
    console.log(`[Scan] Found ${findings.length} library(ies) in content.`);
  } else {
    console.log("[Scan] No libraries found in content.");
  }
  return findings;
}

module.exports = { findSecretsInContent, findLibrariesInContent };
