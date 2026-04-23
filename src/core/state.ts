import { StateGraphArgs } from "@langchain/langgraph";

/**
 * Agent_xk v0.2 Core State Protocol
 * Based on Page 2 (Phase 2) of the SOP
 */
export interface AgentState {
  // --- Basic Information ---
  user_input: string;
  project_spec: Record<string, any>;

  // --- Scheduling & Execution ---
  task_dag: Record<string, string[]>; // { task_id: dependencies[] }
  task_list: Array<{
    id: string;
    description: string;
    parallel_group?: string;
    is_critical: boolean;
    status: 'pending' | 'running' | 'completed' | 'failed';
  }>;
  current_task_index: number;
  source_code_path: string;

  // --- Experience & Feedback ---
  retrieved_experiences: Array<{
    type: 'Pattern' | 'Fix_Trace' | 'Preference' | 'Negative';
    content: any;
    score: number;
  }>;
  negative_feedback: string[];
  test_report: string;
  error_info: string;
  hitl_feedback: string; // Human-in-the-loop feedback

  // --- Engineering Control ---
  last_stable_snapshot: string; // Docker Image ID / Checkpoint
  auto_retry_count: number;
  global_iteration_count: number;
  execution_trace_summary: string;
}

export const agentStateChannels: StateGraphArgs<AgentState>["channels"] = {
  user_input: {
    value: (x: string, y: string) => y ?? x,
    default: () => "",
  },
  project_spec: {
    value: (x: any, y: any) => ({ ...x, ...y }),
    default: () => ({}),
  },
  task_dag: {
    value: (x: any, y: any) => ({ ...x, ...y }),
    default: () => ({}),
  },
  task_list: {
    value: (x: any[], y: any[]) => y ?? x,
    default: () => [],
  },
  current_task_index: {
    value: (x: number, y: number) => y ?? x,
    default: () => 0,
  },
  source_code_path: {
    value: (x: string, y: string) => y ?? x,
    default: () => "",
  },
  retrieved_experiences: {
    value: (x: any[], y: any[]) => [...x, ...y],
    default: () => [],
  },
  negative_feedback: {
    value: (x: string[], y: string[]) => [...x, ...y],
    default: () => [],
  },
  test_report: {
    value: (x: string, y: string) => y ?? x,
    default: () => "",
  },
  error_info: {
    value: (x: string, y: string) => y ?? x,
    default: () => "",
  },
  hitl_feedback: {
    value: (x: string, y: string) => y ?? x,
    default: () => "",
  },
  last_stable_snapshot: {
    value: (x: string, y: string) => y ?? x,
    default: () => "",
  },
  auto_retry_count: {
    value: (x: number, y: number) => y ?? x,
    default: () => 0,
  },
  global_iteration_count: {
    value: (x: number, y: number) => y ?? x,
    default: () => 0,
  },
  execution_trace_summary: {
    value: (x: string, y: string) => y ?? x,
    default: () => "",
  },
};
