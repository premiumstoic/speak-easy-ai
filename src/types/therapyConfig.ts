export interface UIConfig {
  prompt_overlay: string | null;
  emotion_bank_visible: boolean;
  emotion_words?: string[];
  max_recording_time?: number;
  orb_state?: "pulsing_listening" | "expanded_speaking_amber";
  mic_locked?: boolean;
}

export interface Tripwire {
  id: string;
  name: string;
  semantic_markers: string[];
  acoustic_markers?: string[];
  affective_trajectory?: string;
}

export interface EvaluationEngine {
  agent: "background_analyst" | "llm_as_judge" | "llm_as_judge_streaming";
  frameworks?: string[];
  system_prompt?: string;
  context_window_size?: number;
  confidence_threshold?: number;
  tripwires?: Tripwire[];
  transitions: {
    on_pass?: string;
    on_fail?: string;
    on_fail_toxicity?: string;
    on_action_interrupt?: string;
    on_action_null?: string;
  };
}

export interface ActionStep {
  action: string;
  payload: string;
  clinical_purpose?: string;
}

export interface TherapyState {
  type: "breathing_exercise" | "speaking_turn" | "role_reversal" | "open_mic_stream" | "system_interruption";
  layout: "fullscreen_overlay" | "split_screen" | "shared_hearth_orb" | "ai_focus";
  active_role?: "SENDER" | "RECEIVER" | "BOTH" | "SYSTEM";
  duration_seconds?: number;
  ui_config?: UIConfig;
  evaluation_engine?: EvaluationEngine;
  action_sequence?: ActionStep[];
  intervention_templates?: Record<string, string>;
  transitions: {
    on_complete?: string;
    on_pass?: string;
    on_fail?: string;
    on_fail_toxicity?: string;
    on_intervention_complete?: string;
  };
}

export interface TherapyConfig {
  technique_id: string;
  technique_name: string;
  version: string;
  description: string;
  initial_state: string;
  max_turns?: number;
  states: Record<string, TherapyState>;
}
