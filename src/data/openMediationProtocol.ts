import type { TherapyConfig } from "@/types/therapyConfig";

export const openMediationProtocol: TherapyConfig = {
  technique_id: "open_mediation_enactment",
  technique_name: "Guided Enactment (Open Mediation)",
  version: "1.0",
  description:
    "Continuous process observation. AI remains silent unless specific relational tripwires (Loop, Missed Drop, Escalation, Stonewall) are crossed.",
  initial_state: "state_open_floor",

  states: {
    state_open_floor: {
      type: "open_mic_stream",
      layout: "shared_hearth_orb",
      active_role: "BOTH",
      ui_config: {
        orb_state: "pulsing_listening",
        prompt_overlay: null,
        emotion_bank_visible: false,
        mic_locked: false,
      },
      evaluation_engine: {
        agent: "llm_as_judge_streaming",
        context_window_size: 20,
        confidence_threshold: 0.85,
        system_prompt:
          "You are an expert Clinical Process Observer. You must maintain SILENCE 95% of the time. Do NOT intervene in minor disagreements or content-based disputes. Evaluate the 20-message context using a Chain-of-Thought scratchpad. If a Tripwire is crossed with >= 0.85 confidence, output action_decision: 'interrupt'. Otherwise, output 'null'.",
        tripwires: [
          {
            id: "the_loop",
            name: "Circular Arguing",
            semantic_markers: [
              "high_cosine_similarity_across_10_turns",
              "high_lzw_compression_ratio",
              "vocabulary_exhaustion",
            ],
            acoustic_markers: [
              "sustained_mid_high_speech_rate",
              "lack_prosodic_variation",
            ],
            affective_trajectory: "static_negative_valence",
          },
          {
            id: "the_missed_drop",
            name: "Ignored Primary Vulnerability",
            semantic_markers: [
              "turn_a_uses_vulnerability_lexicon",
              "turn_b_uses_cognitive_justification_or_defense",
            ],
            acoustic_markers: [
              "turn_a_f0_drop_and_low_amplitude",
              "turn_b_f0_spike_and_rapid_onset",
            ],
          },
          {
            id: "the_escalation",
            name: "Severe Toxicity and Contempt",
            semantic_markers: [
              "absolute_quantifiers",
              "characterological_attacks",
              "profanity",
            ],
            acoustic_markers: [
              "high_jitter",
              "high_shimmer",
              "f0_spikes",
              "extended_overlapping_speech",
            ],
          },
          {
            id: "the_stonewall",
            name: "Emotional Disengagement",
            semantic_markers: [
              "monosyllabic_responses",
              "sharp_drop_in_word_count",
            ],
            acoustic_markers: [
              "absence_of_backchanneling",
              "abnormal_silence_greater_than_10s",
            ],
          },
        ],
        transitions: {
          on_action_interrupt: "state_ai_intervention",
          on_action_null: "state_open_floor",
        },
      },
      transitions: {
        on_complete: "state_open_floor",
      },
    },

    state_ai_intervention: {
      type: "system_interruption",
      layout: "ai_focus",
      active_role: "SYSTEM",
      ui_config: {
        orb_state: "expanded_speaking_amber",
        prompt_overlay: null,
        emotion_bank_visible: false,
        mic_locked: true,
      },
      action_sequence: [
        {
          action: "play_audio",
          payload: "resonant_singing_bowl_chime_1.5s",
          clinical_purpose: "Physiological reset and pattern interrupt.",
        },
        {
          action: "generate_tts",
          payload: "dynamic_template_based_on_detected_tripwire",
        },
      ],
      intervention_templates: {
        the_loop:
          "I am noticing that we are starting to go in circles. When we loop like this, it usually means both of you are fighting hard to be heard, but neither is feeling understood. Let us take a breath.",
        the_missed_drop:
          "I want to gently pause us right here, because something incredibly important just happened. A deeply vulnerable feeling was just shared. Let us hold space for that moment before moving forward.",
        the_escalation:
          "We are going to stop right here. The temperature has gotten very high, and we are speaking in ways that cause more damage than healing. Let us take a collective pause and a deep breath together.",
        the_stonewall:
          "I am going to pause the conversation. I am noticing that things have gone quiet. Sometimes when the emotion gets too intense, it is natural for our systems to shut down. Is it feeling overwhelming right now?",
      },
      transitions: {
        on_intervention_complete: "state_open_floor",
      },
    },
  },
};
