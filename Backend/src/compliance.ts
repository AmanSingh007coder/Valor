import { Supplier, ComplianceRule } from "./types";

export class ComplianceRulesEngine {
  private rules: ComplianceRule;

  constructor(rules: ComplianceRule | undefined) {
    // Provide default rules if undefined
    this.rules = rules || {
      raw: "",
      blockedTerms: ["child labor", "illegal", "violation", "sanction"],
      priceThreshold: 20,
      requiresCertification: false,
    };
  }

  /**
   * Check if a supplier violates any compliance rules
   */
  checkCompliance(supplier: Supplier, newsFeed: string): {
    isCompliant: boolean;
    violations: string[];
    score: number; // 0-100
  } {
    const violations: string[] = [];
    let score = 100;

    // 1. Check for blocked terms in news
    const lowerNews = newsFeed.toLowerCase();
    const blockedTerms = this.rules?.blockedTerms || [];
    for (const term of blockedTerms) {
      if (lowerNews.includes(term.toLowerCase())) {
        violations.push(`BLOCKED_TERM: "${term}" detected in news feed`);
        score -= 40;
      }
    }

    // 2. Check price gouging
    const priceThreshold = this.rules?.priceThreshold || 20;
    const priceDeviation = ((supplier.current_price - supplier.base_price) / supplier.base_price) * 100;
    if (priceDeviation > priceThreshold) {
      violations.push(`PRICE_GOUGING: ${priceDeviation.toFixed(2)}% increase (threshold: ${priceThreshold}%)`);
      score -= 30;
    }

    // 3. Check for critical keywords that should trigger alerts
    const criticalKeywords = ["critical", "urgent", "emergency", "failure", "collapse"];
    for (const keyword of criticalKeywords) {
      if (lowerNews.includes(keyword)) {
        violations.push(`CRITICAL_STATUS: "${keyword}" mentioned in latest intel`);
        score -= 20;
      }
    }

    // 4. Check weather warnings
    if (supplier.satellite_view && supplier.satellite_view.includes("OBSCURED")) {
      violations.push("WEATHER_RISK: Severe weather detected at supplier location");
      score -= 15;
    }

    // 5. GPS status check
    if (supplier.gps_status && supplier.gps_status.includes("DEGRADED")) {
      violations.push("GPS_DEGRADED: Communication reliability is compromised");
      score -= 10;
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      score: Math.max(0, score),
    };
  }

  /**
   * Determine if a supplier should be BLOCKED, SHIFTED, or KEPT
   */
  determineAction(
    supplier: Supplier,
    complianceScore: number,
    newsIntel: any,
    financeIntel: any
  ): "BLOCK" | "SHIFT" | "KEEP" {
    // BLOCK if compliance score is critically low
    if (complianceScore < 30) {
      return "BLOCK";
    }

    // SHIFT if there are significant operational risks
    if (complianceScore < 60) {
      return "SHIFT";
    }

    // KEEP if compliant
    return "KEEP";
  }

  /**
   * Get the next supplier in hierarchy if current one fails
   */
  getNextInHierarchy(
    currentSupplier: string,
    primaryId: string,
    secondaryId?: string,
    tertiaryId?: string
  ): string | undefined {
    if (currentSupplier === primaryId) {
      return secondaryId;
    }
    if (currentSupplier === secondaryId) {
      return tertiaryId;
    }
    return undefined;
  }
}

/**
 * Parse compliance rules from string format
 */
export function parseComplianceRules(rulesText: string): ComplianceRule {
  const priceMatch = rulesText.match(/(\d+)%/);
  const priceThreshold = priceMatch ? parseInt(priceMatch[1]) : 20;

  const blockedTerms = [
    "child labor",
    "illegal",
    "violation",
    "sanction",
    "breach",
  ];

  return {
    raw: rulesText,
    priceThreshold,
    blockedTerms,
    requiresCertification: rulesText.toLowerCase().includes("cert"),
  };
}
