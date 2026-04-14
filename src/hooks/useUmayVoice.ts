import { useState } from 'react';
import { fal } from '@fal-ai/client';

// Voice IDs for reference
export const VOICES = {
  HURREM: 'TASY7VCrU29rEMoYFTGG', // Default Umay Voice
  MELIKSAH: 'fm1seF9YQKcWP97SJETV',
};

export const useUmayVoice = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakIntervention = async (
    text: string,
    voiceId = VOICES.HURREM,
    stability = 0.5
  ) => {
    if (!text) return;

    try {
      setIsSpeaking(true);

      // Call the Fal.ai ElevenLabs endpoint
      const result = await fal.subscribe('fal-ai/elevenlabs/tts/eleven-v3', {
        input: {
          text: text,
          voice: voiceId,
          stability: stability,
          apply_text_normalization: 'auto' as any
        }
      });

      // The endpoint returns an audio_url. We play it natively in the browser.
      if (result && (result as any).audio?.url) {
        const audio = new Audio((result as any).audio.url);

        // When the audio finishes playing, reset the state
        audio.onended = () => {
          setIsSpeaking(false);
        };

        await audio.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("Umay TTS Error:", error);
      setIsSpeaking(false);
    }
  };

  return { speakIntervention, isSpeaking };
};
