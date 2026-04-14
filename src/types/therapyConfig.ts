export interface UIConfig {
  prompt_overlay: string;
  emotion_bank_visible: boolean;
  emotion_words?: string[];
  max_recording_time?: number;
}

export interface EvaluationEngine {
  agent: "background_analyst" | "llm_as_judge";
  frameworks?: string[];
  system_prompt?: string;
  transitions: {
    on_pass?: string;
    on_fail?: string;
    on_fail_toxicity?: string;
  };
}

export interface TherapyState {
  type: "breathing_exercise" | "speaking_turn" | "role_reversal";
  layout: "fullscreen_overlay" | "split_screen";
  active_role?: "SENDER" | "RECEIVER" | "BOTH";
  duration_seconds?: number;
  ui_config?: UIConfig;
  evaluation_engine?: EvaluationEngine;
  transitions: {
    on_complete?: string;
    on_pass?: string;
    on_fail?: string;
    on_fail_toxicity?: string;
  };
}

export interface TherapyConfig {
  technique_id: string;
  technique_name: string;
  version: string;
  description: string;
  initial_state: string;
  states: Record<string, TherapyState>;
}
