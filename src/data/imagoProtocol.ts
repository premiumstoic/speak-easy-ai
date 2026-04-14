import type { TherapyConfig } from "@/types/therapyConfig";

export const imagoProtocol: TherapyConfig = {
  technique_id: "imago_core_dialogue",
  technique_name: "Imago Relationship Therapy",
  version: "1.0",
  description:
    "Slows down reactivity through strict Mirroring, Validation, and Empathy.",
  initial_state: "grounding",
  max_turns: 2,

  states: {
    grounding: {
      type: "breathing_exercise",
      layout: "fullscreen_overlay",
      duration_seconds: 60,
      transitions: {
        on_complete: "sender",
      },
    },

    sender: {
      type: "speaking_turn",
      layout: "split_screen",
      active_role: "SENDER",
      ui_config: {
        prompt_overlay:
          "Share what's on your heart. Your partner is listening with intention.",
        emotion_bank_visible: false,
        max_recording_time: 45,
      },
      evaluation_engine: {
        agent: "background_analyst",
        frameworks: ["gottman_toxicity", "eft_needs"],
        transitions: {
          on_pass: "mirroring",
          on_fail_toxicity: "sender",
        },
      },
      transitions: {
        on_complete: "mirroring",
      },
    },

    mirroring: {
      type: "speaking_turn",
      layout: "split_screen",
      active_role: "RECEIVER",
      ui_config: {
        prompt_overlay: 'Start with: "What I heard you say is..."',
        emotion_bank_visible: false,
        max_recording_time: 60,
      },
      evaluation_engine: {
        agent: "llm_as_judge",
        system_prompt:
          "Compare RECEIVER_TEXT to SENDER_TEXT. Fail if Receiver introduces defense, advice, or new arguments.",
        transitions: {
          on_pass: "validation",
          on_fail: "mirroring",
        },
      },
      transitions: {
        on_complete: "validation",
      },
    },

    validation: {
      type: "speaking_turn",
      layout: "split_screen",
      active_role: "RECEIVER",
      ui_config: {
        prompt_overlay: 'Start with: "You make sense because..."',
        emotion_bank_visible: false,
        max_recording_time: 45,
      },
      transitions: {
        on_complete: "empathy",
      },
    },

    empathy: {
      type: "speaking_turn",
      layout: "split_screen",
      active_role: "RECEIVER",
      ui_config: {
        prompt_overlay: "Choose the emotion you sense in your partner:",
        emotion_bank_visible: true,
        emotion_words: [
          "Angry",
          "Sad",
          "Scared",
          "Overwhelmed",
          "Lonely",
          "Hurt",
          "Anxious",
          "Unseen",
        ],
        max_recording_time: 30,
      },
      evaluation_engine: {
        agent: "llm_as_judge",
        system_prompt:
          'Ensure RECEIVER_TEXT contains a valid emotion word and does not substitute a thought for a feeling (e.g., "I feel like you are...").',
        transitions: {
          on_pass: "role_reversal",
          on_fail: "empathy",
        },
      },
      transitions: {
        on_complete: "role_reversal",
      },
    },

    role_reversal: {
      type: "role_reversal",
      layout: "split_screen",
      ui_config: {
        prompt_overlay: "Roles reversing... Take a breath.",
        emotion_bank_visible: false,
      },
      transitions: {
        on_complete: "sender",
      },
    },
  },
};
