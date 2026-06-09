const POSITIVE_TOPICS = [
  {
    label: "Clean facilities",
    keywords: ["clean"],
  },
  {
    label: "Friendly and helpful staff",
    keywords: ["friendly", "helpful"],
  },
  {
    label: "Positive facility experience",
    keywords: ["good", "excellent", "nice"],
  },
  {
    label: "Comfortable environment",
    keywords: ["comfortable"],
  },
  {
    label: "Easy and efficient experience",
    keywords: ["easy", "fast"],
  },
  {
    label: "Affordable pricing",
    keywords: ["affordable"],
  },
];

const COMPLAINT_TOPICS = [
  {
    label: "Cleanliness",
    keywords: ["dirty"],
    improvement: "Strengthen cleaning checks between bookings.",
  },
  {
    label: "Pricing",
    keywords: ["expensive"],
    improvement: "Review pricing and communicate the value included clearly.",
  },
  {
    label: "Equipment or facility maintenance",
    keywords: ["broken"],
    improvement: "Inspect and repair damaged equipment or facility areas promptly.",
  },
  {
    label: "Service delays",
    keywords: ["late"],
    improvement: "Improve staff readiness and booking-time handovers.",
  },
  {
    label: "Staff service",
    keywords: ["rude"],
    improvement: "Provide customer-service guidance and monitor staff interactions.",
  },
  {
    label: "Crowding and capacity",
    keywords: ["crowded"],
    improvement: "Review capacity, scheduling gaps, and peak-hour crowd control.",
  },
  {
    label: "Parking availability",
    keywords: ["parking"],
    improvement: "Clarify parking options and improve arrival guidance.",
  },
  {
    label: "Water facilities",
    keywords: ["water"],
    improvement: "Check water access and related amenities regularly.",
  },
  {
    label: "Toilet facilities",
    keywords: ["toilet"],
    improvement: "Improve toilet cleanliness, supplies, and maintenance checks.",
  },
  {
    label: "Lighting quality",
    keywords: ["lighting"],
    improvement: "Inspect court lighting and replace weak or faulty lights.",
  },
  {
    label: "Ventilation and indoor air comfort",
    keywords: [
      "humid",
      "humidity",
      "hot",
      "stuffy",
      "breathe",
      "breathing",
      "breath",
      "air",
      "ventilation",
      "airflow",
      "suffocating",
    ],
    improvement:
      "Improve court ventilation, air circulation, and indoor comfort. Check fans, airflow, and humidity conditions.",
  },
  {
    label: "Floor or court safety",
    keywords: ["slippery"],
    improvement: "Inspect playing surfaces and address slippery areas immediately.",
  },
];

function hasKeyword(comment, keyword) {
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escapedKeyword}\\b`, "i").test(comment);
}

function rankTopics(reviews, topics, shouldAnalyzeReview = () => true) {
  return topics
    .map((topic) => ({
      ...topic,
      count: reviews.reduce((total, review) => {
        if (!shouldAnalyzeReview(review)) {
          return total;
        }

        const comment = String(review.comment || "");
        const matched = topic.keywords.some((keyword) =>
          hasKeyword(comment, keyword)
        );

        return total + (matched ? 1 : 0);
      }, 0),
    }))
    .filter((topic) => topic.count > 0)
    .sort((firstTopic, secondTopic) => {
      if (secondTopic.count !== firstTopic.count) {
        return secondTopic.count - firstTopic.count;
      }

      return firstTopic.label.localeCompare(secondTopic.label);
    });
}

function getSatisfactionLevel(averageRating, negativeRatio) {
  const hasVeryHighNegativeRatio = negativeRatio >= 0.75;
  const hasHighNegativeRatio = negativeRatio > 0.4;
  const hasLowNegativeRatio = negativeRatio <= 0.2;
  const hasLowOrModerateNegativeRatio = negativeRatio <= 0.4;

  if (averageRating < 3 || hasVeryHighNegativeRatio) {
    return "Needs Attention";
  }

  if (averageRating >= 4.5 && hasLowNegativeRatio) {
    return "Excellent Satisfaction";
  }

  if (averageRating >= 4 && hasLowOrModerateNegativeRatio) {
    return "Good Satisfaction";
  }

  if (averageRating >= 4 && hasHighNegativeRatio) {
    return "Good Rating, Needs Attention";
  }

  if (averageRating >= 3 && hasHighNegativeRatio) {
    return "Mixed Feedback";
  }

  return "Moderate Satisfaction";
}

function buildReviewInsightSummary(reviews = []) {
  const totalReviews = reviews.length;

  if (totalReviews === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      sentimentCounts: {
        positive: 0,
        neutral: 0,
        negative: 0,
      },
      satisfactionLevel: "Not Enough Data",
      positivePoints: [],
      commonComplaints: [],
      suggestedImprovements: [],
      overallSummary:
        "Not enough review data yet. Insights will appear after customers submit reviews.",
      merchantRecommendation:
        "Encourage customers with completed bookings to leave ratings and written feedback.",
    };
  }

  const totalRating = reviews.reduce(
    (total, review) => total + Number(review.rating || 0),
    0
  );
  const averageRating = totalRating / totalReviews;
  const sentimentCounts = reviews.reduce(
    (counts, review) => {
      const sentimentLabel = String(review.sentimentLabel || "").toUpperCase();

      if (sentimentLabel === "POSITIVE") counts.positive += 1;
      if (sentimentLabel === "NEUTRAL") counts.neutral += 1;
      if (sentimentLabel === "NEGATIVE") counts.negative += 1;

      return counts;
    },
    {
      positive: 0,
      neutral: 0,
      negative: 0,
    }
  );
  const negativeRatio = sentimentCounts.negative / totalReviews;
  const satisfactionLevel = getSatisfactionLevel(
    averageRating,
    negativeRatio
  );
  const rankedPositiveTopics = rankTopics(
    reviews,
    POSITIVE_TOPICS,
    (review) =>
      String(review.sentimentLabel || "").toUpperCase() === "POSITIVE" ||
      Number(review.rating) >= 4
  );
  const rankedComplaintTopics = rankTopics(
    reviews,
    COMPLAINT_TOPICS,
    (review) =>
      String(review.sentimentLabel || "").toUpperCase() === "NEGATIVE" ||
      Number(review.rating) <= 2
  );
  const positivePoints = rankedPositiveTopics
    .slice(0, 3)
    .map((topic) => topic.label);
  const commonComplaints = rankedComplaintTopics
    .slice(0, 3)
    .map((topic) => topic.label);
  const suggestedImprovements = rankedComplaintTopics
    .slice(0, 3)
    .map((topic) => topic.improvement);

  if (positivePoints.length === 0 && sentimentCounts.positive > 0) {
    positivePoints.push("Customers generally report positive experiences");
  }

  if (commonComplaints.length === 0 && sentimentCounts.negative > 0) {
    commonComplaints.push(
      "Some customers expressed dissatisfaction without a repeated topic"
    );
  }

  if (suggestedImprovements.length === 0) {
    suggestedImprovements.push(
      "Maintain current service standards and continue monitoring new feedback."
    );
  }

  const reviewedFacilities = [
    ...new Set(
      reviews.map((review) => review.facility?.name).filter(Boolean)
    ),
  ];
  const facilityScope =
    reviewedFacilities.length === 1
      ? ` for ${reviewedFacilities[0]}`
      : ` across ${reviewedFacilities.length || "the merchant's"} facilities`;
  const overallSummary = `${totalReviews} customer review${
    totalReviews === 1 ? "" : "s"
  }${facilityScope} produced an average rating of ${averageRating.toFixed(
    1
  )}/5. The combined satisfaction assessment is "${satisfactionLevel}", with ${
    sentimentCounts.positive
  } positive, ${sentimentCounts.neutral} neutral, and ${
    sentimentCounts.negative
  } negative sentiment result${totalReviews === 1 ? "" : "s"}.`;
  const topComplaint = rankedComplaintTopics[0]?.label;
  const merchantRecommendation = topComplaint
    ? `Prioritize ${topComplaint.toLowerCase()} while protecting the service strengths customers already recognize.`
    : satisfactionLevel === "Excellent Satisfaction" ||
      satisfactionLevel === "Good Satisfaction"
    ? "Maintain the current customer experience and use future reviews to catch emerging issues early."
    : "Collect more written feedback and review lower-rated bookings to identify the most urgent operational issue.";

  return {
    totalReviews,
    averageRating: Number(averageRating.toFixed(2)),
    sentimentCounts,
    satisfactionLevel,
    positivePoints,
    commonComplaints,
    suggestedImprovements,
    overallSummary,
    merchantRecommendation,
  };
}

module.exports = {
  buildReviewInsightSummary,
};
