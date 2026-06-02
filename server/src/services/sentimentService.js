const RULE_BASED_PROVIDER = "RULE_BASED_FALLBACK";
const HUGGING_FACE_PROVIDER = "HUGGING_FACE_API";
const HUGGING_FACE_MODEL =
  "distilbert/distilbert-base-uncased-finetuned-sst-2-english";
const HUGGING_FACE_API_URL = `https://router.huggingface.co/hf-inference/models/${HUGGING_FACE_MODEL}`;
const HUGGING_FACE_TIMEOUT_MS = 8000;

const POSITIVE_KEYWORDS = [
  "good",
  "great",
  "excellent",
  "clean",
  "nice",
  "easy",
  "friendly",
  "comfortable",
  "amazing",
  "satisfied",
];

const NEGATIVE_KEYWORDS = [
  "bad",
  "poor",
  "dirty",
  "late",
  "broken",
  "expensive",
  "rude",
  "difficult",
  "problem",
  "disappointed",
];

function countKeywordMatches(text, keywords) {
  return keywords.reduce((total, keyword) => {
    const pattern = new RegExp(`\\b${keyword}\\b`, "gi");
    const matches = text.match(pattern);

    return total + (matches ? matches.length : 0);
  }, 0);
}

function calculateScore(winningCount, losingCount) {
  if (winningCount === 0 && losingCount === 0) {
    return 0.2;
  }

  const totalMatches = winningCount + losingCount;
  const confidence =
    0.5 + Math.min((winningCount - losingCount) / totalMatches, 1) * 0.5;

  return Number(confidence.toFixed(2));
}

function analyzeReviewSentimentWithRules(comment) {
  const normalizedComment =
    comment === undefined || comment === null ? "" : String(comment).trim();

  if (!normalizedComment) {
    return {
      sentimentLabel: "NEUTRAL",
      sentimentScore: 0.2,
      sentimentProvider: RULE_BASED_PROVIDER,
      sentimentAnalyzedAt: new Date(),
    };
  }

  const positiveMatches = countKeywordMatches(
    normalizedComment,
    POSITIVE_KEYWORDS
  );
  const negativeMatches = countKeywordMatches(
    normalizedComment,
    NEGATIVE_KEYWORDS
  );

  if (positiveMatches > negativeMatches) {
    return {
      sentimentLabel: "POSITIVE",
      sentimentScore: calculateScore(positiveMatches, negativeMatches),
      sentimentProvider: RULE_BASED_PROVIDER,
      sentimentAnalyzedAt: new Date(),
    };
  }

  if (negativeMatches > positiveMatches) {
    return {
      sentimentLabel: "NEGATIVE",
      sentimentScore: calculateScore(negativeMatches, positiveMatches),
      sentimentProvider: RULE_BASED_PROVIDER,
      sentimentAnalyzedAt: new Date(),
    };
  }

  return {
    sentimentLabel: "NEUTRAL",
    sentimentScore: positiveMatches > 0 ? 0.5 : 0.2,
    sentimentProvider: RULE_BASED_PROVIDER,
    sentimentAnalyzedAt: new Date(),
  };
}

function normalizeHuggingFaceResult(apiResult) {
  const resultList = Array.isArray(apiResult?.[0]) ? apiResult[0] : apiResult;

  if (!Array.isArray(resultList)) {
    return null;
  }

  const positiveResult = resultList.find(
    (result) => String(result.label).toUpperCase() === "POSITIVE"
  );
  const negativeResult = resultList.find(
    (result) => String(result.label).toUpperCase() === "NEGATIVE"
  );

  if (!positiveResult || !negativeResult) {
    return null;
  }

  const positiveScore = Number(positiveResult.score);
  const negativeScore = Number(negativeResult.score);

  if (!Number.isFinite(positiveScore) || !Number.isFinite(negativeScore)) {
    return null;
  }

  const scoreDifference = Math.abs(positiveScore - negativeScore);

  if (scoreDifference < 0.15) {
    return {
      sentimentLabel: "NEUTRAL",
      sentimentScore: Number(Math.max(positiveScore, negativeScore).toFixed(2)),
      sentimentProvider: HUGGING_FACE_PROVIDER,
      sentimentAnalyzedAt: new Date(),
    };
  }

  if (positiveScore > negativeScore) {
    return {
      sentimentLabel: "POSITIVE",
      sentimentScore: Number(positiveScore.toFixed(2)),
      sentimentProvider: HUGGING_FACE_PROVIDER,
      sentimentAnalyzedAt: new Date(),
    };
  }

  return {
    sentimentLabel: "NEGATIVE",
    sentimentScore: Number(negativeScore.toFixed(2)),
    sentimentProvider: HUGGING_FACE_PROVIDER,
    sentimentAnalyzedAt: new Date(),
  };
}

function logHuggingFaceDebug(message, details = {}) {
  console.log("[Sentiment][Hugging Face]", message, details);
}

function getShortErrorMessage(error) {
  if (!error) {
    return "Unknown error";
  }

  return error.message || String(error);
}

async function analyzeWithHuggingFace(comment) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HUGGING_FACE_TIMEOUT_MS);

  logHuggingFaceDebug("Calling sentiment API", {
    apiKeyExists: Boolean(process.env.HUGGINGFACE_API_KEY),
    endpoint: HUGGING_FACE_API_URL,
  });

  try {
    const response = await fetch(HUGGING_FACE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: comment,
        parameters: {
          function_to_apply: "softmax",
          top_k: 2,
        },
        options: {
          wait_for_model: true,
        },
      }),
      signal: controller.signal,
    });

    logHuggingFaceDebug("API response received", {
      status: response.status,
      ok: response.ok,
    });

    const apiResult = await response.json().catch((error) => {
      logHuggingFaceDebug("Could not parse API JSON response", {
        error: getShortErrorMessage(error),
      });
      return null;
    });

    if (!response.ok) {
      logHuggingFaceDebug("API unavailable, falling back", {
        status: response.status,
        error:
          apiResult?.error ||
          apiResult?.message ||
          "No readable error body returned",
      });
      return null;
    }

    if (apiResult?.error || apiResult?.estimated_time) {
      logHuggingFaceDebug("Model loading or unavailable, falling back", {
        error: apiResult.error || "Model unavailable",
        estimatedTime: apiResult.estimated_time,
      });
      return null;
    }

    const normalizedResult = normalizeHuggingFaceResult(apiResult);

    if (!normalizedResult) {
      logHuggingFaceDebug("API response was unclear, falling back", {
        responseType: Array.isArray(apiResult) ? "array" : typeof apiResult,
      });
    }

    return normalizedResult;
  } finally {
    clearTimeout(timeout);
  }
}

async function analyzeReviewSentiment(comment) {
  const normalizedComment =
    comment === undefined || comment === null ? "" : String(comment).trim();

  if (!normalizedComment) {
    logHuggingFaceDebug("Skipping API call, empty comment", {
      apiKeyExists: Boolean(process.env.HUGGINGFACE_API_KEY),
    });
    return analyzeReviewSentimentWithRules(normalizedComment);
  }

  if (!process.env.HUGGINGFACE_API_KEY) {
    logHuggingFaceDebug("Skipping API call, missing API key", {
      apiKeyExists: false,
    });
    return analyzeReviewSentimentWithRules(normalizedComment);
  }

  if (!global.fetch) {
    logHuggingFaceDebug("Skipping API call, fetch is unavailable", {
      apiKeyExists: true,
      endpoint: HUGGING_FACE_API_URL,
    });
    return analyzeReviewSentimentWithRules(normalizedComment);
  }

  try {
    const apiSentiment = await analyzeWithHuggingFace(normalizedComment);

    if (apiSentiment) {
      return apiSentiment;
    }
  } catch (error) {
    console.warn("Hugging Face sentiment analysis failed:", {
      error: getShortErrorMessage(error),
      cause: getShortErrorMessage(error.cause),
    });
  }

  return analyzeReviewSentimentWithRules(normalizedComment);
}

module.exports = {
  analyzeReviewSentiment,
};
