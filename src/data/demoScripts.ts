import type { TripwireId } from "@/types/therapyEvents";

export interface DemoTurn {
  speaker: "A" | "B";
  text: string;
  /** If set, triggers this tripwire after the line is spoken */
  tripwire?: TripwireId;
  /** Pause in ms after this turn (default: 1200) */
  pauseAfter?: number;
}

/**
 * Open Mediation demo: a realistic couple conversation that starts calm,
 * escalates, and hits a tripwire — triggering the AI Process Observer.
 */
export const openMediationScript: DemoTurn[] = [
  {
    speaker: "A",
    text: "I want to talk about what happened last weekend. I felt really alone when I was cleaning the kitchen and nobody noticed.",
    pauseAfter: 1500,
  },
  {
    speaker: "B",
    text: "I hear you. I didn't realize it bothered you that much. I thought we were both just doing our own thing.",
    pauseAfter: 1500,
  },
  {
    speaker: "A",
    text: "It's not just about the kitchen. It's a pattern. I feel like I carry the invisible load and nobody sees it.",
    pauseAfter: 1200,
  },
  {
    speaker: "B",
    text: "That's not fair. I do a lot around here too. You just don't notice what I do.",
    pauseAfter: 1200,
  },
  {
    speaker: "A",
    text: "See, this is what always happens. I try to share something vulnerable and you get defensive.",
    pauseAfter: 1000,
  },
  {
    speaker: "B",
    text: "I'm not being defensive. You're attacking me. You always twist things to make me the bad guy.",
    pauseAfter: 1000,
  },
  {
    speaker: "A",
    text: "There you go again. You always say that. We go in the same circles every single time.",
    pauseAfter: 800,
  },
  {
    speaker: "B",
    text: "Because you always start it! You never take responsibility for your part.",
    tripwire: "the_escalation",
    pauseAfter: 800,
  },
];

/**
 * Imago Dialogue demo: one full turn cycle through the structured protocol.
 * Sender speaks → Receiver mirrors → validates → empathizes → roles reverse.
 */
export const imagoDialogueScript: DemoTurn[] = [
  // Sender phase (Partner A speaks)
  {
    speaker: "A",
    text: "When I come home after a long day and the house is quiet and dark, I feel invisible. Like my presence doesn't matter. I just want to feel welcomed.",
    pauseAfter: 2000,
  },
  // Mirroring phase (Partner B reflects)
  {
    speaker: "B",
    text: "What I heard you say is that when you come home after a long day and the house is quiet and dark, you feel invisible. Like your presence doesn't matter. And you want to feel welcomed.",
    pauseAfter: 2000,
  },
  // Validation phase (Partner B validates)
  {
    speaker: "B",
    text: "You make sense because everyone wants to feel seen when they come home. After a long day, of course you'd want to feel like your presence lights up the room. That makes complete sense to me.",
    pauseAfter: 2000,
  },
  // Empathy phase (Partner B empathizes)
  {
    speaker: "B",
    text: "I imagine you might be feeling lonely and unseen. And maybe a little scared that we're drifting apart.",
    pauseAfter: 2000,
  },
];

export const DEMO_SCRIPTS = {
  open_mediation_enactment: openMediationScript,
  imago_core_dialogue: imagoDialogueScript,
} as const;
