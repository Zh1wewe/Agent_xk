/**
 * Agent_xk v0.2 Project Configuration
 * Based on Page 1 of the SOP
 */
export const PROJECT_CONFIG = {
  projectName: "Agent_xk",
  coreFeatures: [
    "Requirement Driven",
    "Dynamic DAG Scheduling",
    "Experience Injection",
    "Sandbox Rollback",
    "Meta-Instruction Evolution"
  ],
  architecture: "Master-Slave Multi-Agent + Dynamic Shared State + Layered Memory",
  maxGlobalIterations: 3,
  maxTaskAutoFixes: 3,
  sandbox: "Browser-Simulated Container (Support for State Snapshots)",
  memoryLayers: ["Patterns", "Fix_Trace", "Preferences", "Negative"],
  deduplicationThreshold: 0.85,
  evolutionThreshold: 2, // Trigger System Prompt update after 2 successful fixes of similar errors
  reflectionTriggers: [
    "Task Failed (Transfer to Manual)",
    "Human Review Rejected",
    "Success after >2 Sandbox Retries"
  ],
  traceCompression: "Summarization (Keep only Error Fingerprint and Fix Path)"
};
