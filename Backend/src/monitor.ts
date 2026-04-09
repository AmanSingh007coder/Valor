import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { ComplianceRulesEngine } from "./compliance";
import type { WorldState } from "./types";

const STATE_PATH = path.join(process.cwd(), "src", "data", "world_state.json");
const LOG_PATH = path.join(process.cwd(), "src", "data", "logs.json");

/**
 * CONTINUOUS MONITORING SYSTEM
 * Monitors all suppliers in real-time for:
 * - Price gouging (> 20% increase)
 * - Compliance violations (child labor, illegal, etc)
 * - Weather/disaster risks
 * - News alerts (critical keywords)
 * 
 * Automatically triggers FAILOVER when violations detected:
 * Primary → Secondary → Tertiary
 */

interface SupplierViolation {
  supplierId: string;
  supplierName: string;
  violations: string[];
  complianceScore: number;
  action: "BLOCK" | "SHIFT" | "KEEP";
  timestamp: string;
}

export class SupplierMonitor {
  private monitoringActive = false;
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Evaluate a single supplier against all compliance standards
   */
  private async evaluateSupplier(
    supplier: any,
    rules: any
  ): Promise<SupplierViolation | null> {
    const engine = new ComplianceRulesEngine(rules);

    // 1. Check compliance against rules + news
    const newsData = supplier.internet_news || "";
    const complianceResult = engine.checkCompliance(supplier, newsData);

    // 2. Determine action based on compliance score
    const action = engine.determineAction(
      supplier,
      complianceResult.score,
      { web_news: newsData },
      { deviation: ((supplier.current_price - supplier.base_price) / supplier.base_price) * 100 }
    );

    // Update compliance score
    supplier.compliance_score = complianceResult.score;
    supplier.risk_level = complianceResult.score < 30 ? "HIGH" : complianceResult.score < 60 ? "MEDIUM" : "LOW";

    // 3. Update supplier status based on violations
    if (complianceResult.violations.length > 0) {
      // Determine which violation is most severe
      if (complianceResult.violations.some(v => v.includes("BLOCKED_TERM"))) {
        supplier.status = "CHILD_LABOR_RISK";
      } else if (complianceResult.violations.some(v => v.includes("PRICE_GOUGING"))) {
        supplier.status = "PRICE_GOUGING";
      } else if (complianceResult.violations.some(v => v.includes("WEATHER_RISK"))) {
        supplier.status = "WEATHER_RISK";
      } else if (complianceResult.violations.some(v => v.includes("CRITICAL_STATUS"))) {
        supplier.status = "CRITICAL_RISK";
      } else {
        supplier.status = "WARNING_ISSUED";
      }
    } else if (supplier.status !== "OPERATIONAL" && supplier.status !== "BLOCKED") {
      supplier.status = "OPERATIONAL";
    }

    // Return violation record if action is not KEEP
    if (action !== "KEEP") {
      return {
        supplierId: supplier.id,
        supplierName: supplier.name,
        violations: complianceResult.violations,
        complianceScore: complianceResult.score,
        action,
        timestamp: new Date().toISOString(),
      };
    }

    return null;
  }

  /**
   * Execute failover: shift active node to next tier in hierarchy
   */
  private async executeFailover(data: WorldState, violation: SupplierViolation) {
    console.log(`\n⚠️  VIOLATION DETECTED [${violation.supplierName}]`);
    console.log(`   Violations: ${violation.violations.join(", ")}`);
    console.log(`   Compliance Score: ${violation.complianceScore}%`);
    console.log(`   Action: ${violation.action}\n`);

    // Ensure compliance rules exist
    if (!data.compliance_rules) {
      data.compliance_rules = {
        raw: "",
        blockedTerms: ["child labor", "illegal", "violation", "sanction"],
        priceThreshold: 20,
        requiresCertification: false,
      };
    }

    const engine = new ComplianceRulesEngine(data.compliance_rules);
    const currentActive = data.active_node;

    // Only reroute if the violated supplier is currently active
    if (currentActive !== violation.supplierId) {
      console.log(`   ℹ️  [${violation.supplierName}] is not active, no rerouting needed`);
      return;
    }

    // Get next supplier in hierarchy
    const nextSupplier = engine.getNextInHierarchy(
      currentActive,
      data.hierarchy.primary,
      data.hierarchy.secondary,
      data.hierarchy.tertiary
    );

    if (!nextSupplier) {
      console.log(`   ❌ NO BACKUP SUPPLIERS AVAILABLE!`);
      data.suppliers.find((s: any) => s.id === currentActive)!.status = "UNRECOVERABLE";
      return;
    }

    const nextSupplierObj = data.suppliers.find((s: any) => s.id === nextSupplier);
    const currentSupplierObj = data.suppliers.find((s: any) => s.id === currentActive);

    // Execute the failover
    data.active_node = nextSupplier;
    if (!data.current_path) data.current_path = [];
    data.current_path.push(nextSupplier);

    // Mark current supplier as failed
    currentSupplierObj!.status = "BLOCKED";
    nextSupplierObj!.status = "OPERATIONAL";

    // Record disruption event
    if (!data.disruption_history) data.disruption_history = [];
    data.disruption_history.push({
      timestamp: new Date().toISOString(),
      supplierId: violation.supplierId,
      supplierName: violation.supplierName,
      reason: violation.violations[0] || "Compliance violation",
      previousActive: currentActive,
      newActive: nextSupplier,
      riskLevel: "HIGH",
    });

    console.log(
      `✅ FAILOVER EXECUTED: [${violation.supplierName}] → [${nextSupplierObj?.name}]`
    );
    console.log(`   New Active Path: ${nextSupplierObj?.name}\n`);
  }

  /**
   * Main monitoring loop - runs every 2 seconds
   */
  private async performHealthCheck() {
    try {
      const data: WorldState = JSON.parse(await fs.readFile(STATE_PATH, "utf-8"));

      if (!data.suppliers || data.suppliers.length === 0) {
        return; // Skip if no suppliers
      }

      // Ensure compliance rules exist
      if (!data.compliance_rules) {
        data.compliance_rules = {
          raw: "",
          blockedTerms: ["child labor", "illegal", "violation", "sanction"],
          priceThreshold: 20,
          requiresCertification: false,
        };
      }

      // Evaluate all suppliers
      const violations: SupplierViolation[] = [];

      for (const supplier of data.suppliers) {
        const violation = await this.evaluateSupplier(supplier, data.compliance_rules);
        if (violation) {
          violations.push(violation);
        }
      }

      // Process violations (execute failover if needed)
      for (const violation of violations) {
        if (violation.action === "BLOCK" || violation.action === "SHIFT") {
          await this.executeFailover(data, violation);
        }
      }

      // Write updated state
      await fs.writeFile(STATE_PATH, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("[Monitor] Health check error:", err);
    }
  }

  /**
   * Start the continuous monitoring system
   */
  start() {
    if (this.monitoringActive) {
      console.log("[Monitor] Already running");
      return;
    }

    this.monitoringActive = true;
    console.log("[Monitor] ✓ Started - Checking all suppliers every 2 seconds");

    // Run health check every 2 seconds
    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
    }, 2000);
  }

  /**
   * Stop the continuous monitoring system
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      this.monitoringActive = false;
      console.log("[Monitor] ✓ Stopped");
    }
  }

  /**
   * Get monitor status
   */
  isRunning(): boolean {
    return this.monitoringActive;
  }
}

// Singleton instance
export const monitor = new SupplierMonitor();
