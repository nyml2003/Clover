import { isError } from "@clover.js/protocol";

import {
  AutomationExecutionEventKind,
  type AutomationConfig,
  type AutomationExecutionEvent,
  type AutomationExecutionPlan,
  type AutomationExecutionReport,
  type AutomationPolicy,
  type AutomationTaskOutput,
  type AutomationTaskRunner
} from "./types.js";

function appendEvent(
  events: AutomationExecutionEvent[],
  kind: AutomationExecutionEvent["kind"],
  nodeId: string,
  code: number = 0,
  detail: string = ""
): void {
  events.push({
    kind,
    nodeId,
    code,
    detail
  });
}

function adjacencyMap(plan: AutomationExecutionPlan): Readonly<Record<string, readonly string[]>> {
  const adjacency: Record<string, string[]> = {};

  for (const node of plan.nodes) {
    adjacency[node.id] = [];
  }

  for (const edge of plan.edges) {
    const outgoing = adjacency[edge.from];
    if (outgoing) {
      outgoing.push(edge.to);
    }
  }

  return adjacency;
}

function indegreeMap(plan: AutomationExecutionPlan): Readonly<Record<string, number>> {
  const indegrees: Record<string, number> = {};

  for (const node of plan.nodes) {
    indegrees[node.id] = 0;
  }

  for (const edge of plan.edges) {
    const current = indegrees[edge.to];
    if (typeof current === "number") {
      indegrees[edge.to] = current + 1;
    }
  }

  return indegrees;
}

function skippedNodeIds(
  plan: AutomationExecutionPlan,
  completed: ReadonlySet<string>,
  failed: ReadonlySet<string>
): readonly string[] {
  return plan.nodes
    .map((node) => node.id)
    .filter((nodeId) => !completed.has(nodeId) && !failed.has(nodeId))
    .sort();
}

export async function runAutomationPlan(
  plan: AutomationExecutionPlan,
  config: AutomationConfig,
  policy: AutomationPolicy,
  runNode: AutomationTaskRunner
): Promise<AutomationExecutionReport> {
  const nodeMap = new Map(plan.nodes.map((node) => [node.id, node]));
  const adjacency = adjacencyMap(plan);
  const indegrees = { ...indegreeMap(plan) };
  const ready = plan.nodes
    .map((node) => node.id)
    .filter((nodeId) => indegrees[nodeId] === 0)
    .sort();
  const outputs: Record<string, AutomationTaskOutput> = {};
  const events: AutomationExecutionEvent[] = [];
  const completed = new Set<string>();
  const failed = new Set<string>();
  const maxParallelism = config.maxParallelism > 0 ? config.maxParallelism : 1;

  while (ready.length > 0) {
    const batchIds = ready.splice(0, maxParallelism);

    for (const nodeId of batchIds) {
      appendEvent(events, AutomationExecutionEventKind.NodeStarted, nodeId);
    }

    const batchResults = await Promise.all(
      batchIds.map(async (nodeId) => {
        const node = nodeMap.get(nodeId);
        if (!node) {
          return {
            nodeId,
            result: null
          };
        }

        return {
          nodeId,
          result: await runNode(node)
        };
      })
    );

    let batchFailed = false;

    for (const item of batchResults) {
      if (item.result === null) {
        continue;
      }

      if (isError(item.result)) {
        failed.add(item.nodeId);
        batchFailed = true;
        appendEvent(
          events,
          AutomationExecutionEventKind.NodeFailed,
          item.nodeId,
          item.result.__code__,
          "node-failed"
        );
        continue;
      }

      completed.add(item.nodeId);
      outputs[item.nodeId] = item.result;
      appendEvent(events, AutomationExecutionEventKind.NodeCompleted, item.nodeId);

      const outgoing = adjacency[item.nodeId] ?? [];
      for (const nextId of outgoing) {
        const current = indegrees[nextId];
        if (typeof current !== "number") {
          continue;
        }

        indegrees[nextId] = current - 1;
        if (indegrees[nextId] === 0) {
          ready.push(nextId);
        }
      }
    }

    ready.sort();

    if (batchFailed && policy.stopOnFirstFailure) {
      break;
    }
  }

  const skipped = skippedNodeIds(plan, completed, failed);
  for (const nodeId of skipped) {
    appendEvent(events, AutomationExecutionEventKind.NodeSkipped, nodeId);
  }

  return {
    ok: failed.size === 0,
    completedNodeIds: [...completed].sort(),
    failedNodeIds: [...failed].sort(),
    skippedNodeIds: skipped,
    outputs,
    events
  };
}
