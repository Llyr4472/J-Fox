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

// More specific regex to reduce false positives
const CANDIDATE_REGEX = /['"`]([A-Za-z0-9+\/=_\-]{20,80})['"`]/g;

const IGNORE_PATTERNS = {
  PLACEHOLDER:
    /your-key|placeholder|example|test-key|dummy|sample|default|undefined|null/i,
  URL_PATH: /(https?:\/\/[^\s]+)|(\/[a-z0-9_-]+\/)/i,
  MINIFIED_JS_CHUNK: /[a-zA-Z]{1,2}\.[a-zA-Z]{1,2}\(.*\)/,
  HTML_CONTENT: /<[^>]+>/,
  COMMON_WORDS:
    /\b(password|username|email|phone|address|name|title|description|content|message|text|data)\b/i,
  FILE_PATHS: /([A-Za-z]:\\|\/)[\w\-. \\\/]+/,
  BASE64_IMAGE: /data:image\/[^;]+;base64,/,
  UUID: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
};

function calculateEntropy(str) {
  if (!str || str.length === 0) return 0;
  const frequency = {},
    len = str.length;
  for (const char of str) {
    frequency[char] = (frequency[char] || 0) + 1;
  }
  let entropy = 0;
  for (const char in frequency) {
    const p = frequency[char] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function countUniqueChars(str) {
  return new Set(str).size;
}

function isLikelySecret(str) {
  // Check for common patterns that indicate a non-secret
  if (str.length > 80) return false;
  if (str.includes(" ")) return false;
  if (/^[0-9]+$/.test(str)) return false; // all numbers

  // Must contain at least one number and one letter
  if (!(/[0-9]/.test(str) && /[a-zA-Z]/.test(str))) return false;

  return true;
}

function findSecretsInContent(content) {
  const allFindings = new Map();
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    let candidateMatch;
    while ((candidateMatch = CANDIDATE_REGEX.exec(line)) !== null) {
      const candidate = candidateMatch[1];

      // Enhanced validation pipeline
      if (countUniqueChars(candidate) < 8) continue;
      const entropy = calculateEntropy(candidate);
      if (entropy < 3.5) continue;
      if (!isLikelySecret(candidate)) continue;

      // Check against all ignore patterns
      let shouldIgnore = false;
      for (const [, pattern] of Object.entries(IGNORE_PATTERNS)) {
        if (pattern.test(candidate)) {
          shouldIgnore = true;
          break;
        }
      }
      if (shouldIgnore) continue;

      // Context analysis
      const surroundingContext = lines
        .slice(Math.max(0, i - 2), Math.min(lines.length, i + 3))
        .join(" ")
        .toLowerCase();

      const hasContext = CONTEXT_KEYWORDS.some((keyword) =>
        surroundingContext.includes(keyword)
      );

      const confidence = hasContext ? "High" : "Medium";

      // Only include findings with high confidence or those matching known patterns
      if (
        confidence === "High" ||
        Object.values(HIGH_CONFIDENCE_PATTERNS).some((pattern) =>
          pattern.test(candidate)
        )
      ) {
        if (!allFindings.has(candidate)) {
          allFindings.set(candidate, {
            type: hasContext ? "Contextual Secret" : "Potential Secret",
            value: candidate,
            confidence,
            lineNumber,
            lineContent: line.trim(),
          });
        }
      }
    }

    // Check for known high-confidence patterns
    for (const [type, pattern] of Object.entries(HIGH_CONFIDENCE_PATTERNS)) {
      const match = line.match(pattern);
      if (match && !allFindings.has(match[0])) {
        allFindings.set(match[0], {
          type,
          value: match[0],
          confidence: "High",
          lineNumber,
          lineContent: line.trim(),
        });
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
