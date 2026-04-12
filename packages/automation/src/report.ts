import { inRange } from "@clover.js/std";

import type { AutomationExecutionReport, AutomationExecutionSummary } from "./types.js";

export type AutomationExitCodeMapping = Partial<Record<number, number>>;

export function createAutomationExecutionSummary(
  report: AutomationExecutionReport
): AutomationExecutionSummary {
  return {
    ok: report.ok,
    completedCount: report.completedNodeIds.length,
    failedCount: report.failedNodeIds.length,
    skippedCount: report.skippedNodeIds.length
  };
}

export function formatAutomationExecutionReport(
  report: AutomationExecutionReport
): readonly string[] {
  const summary = createAutomationExecutionSummary(report);
  const lines = [
    `ok=${summary.ok ? "true" : "false"}`,
    `completed=${summary.completedCount}`,
    `failed=${summary.failedCount}`,
    `skipped=${summary.skippedCount}`
  ];

  for (const nodeId of report.failedNodeIds) {
    lines.push(`failed-node=${nodeId}`);
  }

  for (const nodeId of report.skippedNodeIds) {
    lines.push(`skipped-node=${nodeId}`);
  }

  return lines;
}

export function toAutomationExitCode(
  report: AutomationExecutionReport,
  mapping: AutomationExitCodeMapping = {}
): number {
  if (report.ok) {
    return 0;
  }

  const defaultCode = report.failedNodeIds.length > 0 ? 1 : 0;
  const mapped = mapping[defaultCode];

  if (
    typeof mapped === "number" &&
    Number.isInteger(mapped) &&
    inRange(mapped, 0, 255)
  ) {
    return mapped;
  }

  return defaultCode;
}
