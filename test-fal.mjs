/**
 * Quick FAL.ai Whisper API test.
 * Usage:  FAL_KEY=your_key_here node test-fal.mjs
 * Or add VITE_FAL_KEY to .env and run:  node -e "require('dotenv').config({path:'.env'})" test-fal.mjs
 */

import { fal } from "@fal-ai/client";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const HARDCODED_FAL_KEY = "304998f9-4b85-480a-8110-4902ad069841:87b17f14c88fafbfb4e0490c9de7ee95";

// Load .env manually if present
const envPath = resolve(".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim().replace(/^"|"$/g, "");
  }
}

const FAL_KEY = process.env.FAL_KEY || process.env.VITE_FAL_KEY || HARDCODED_FAL_KEY;

if (!FAL_KEY) {
  console.error("❌  No FAL key found. Set FAL_KEY=<your_key> or add VITE_FAL_KEY to .env");
  process.exit(1);
}

fal.config({ credentials: FAL_KEY });

// Generate a minimal 2-second silent WAV (PCM 16-bit, 16 kHz, mono)
// Whisper needs real speech to transcribe — silence returns empty string,
// which still confirms the API key and network path work.
function makeSilentWav(seconds = 2) {
  const sampleRate = 16000;
  const numSamples = sampleRate * seconds;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + numSamples * 2, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);   // PCM
  header.writeUInt16LE(1, 22);   // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(numSamples * 2, 40);
  return Buffer.concat([header, Buffer.alloc(numSamples * 2, 0)]);
}

async function run() {
  console.log("🔑  Key:", FAL_KEY.slice(0, 8) + "…");
  console.log("📤  Uploading test WAV to FAL storage…");

  const wavBuffer = makeSilentWav(2);
  const file = new File([wavBuffer], "test.wav", { type: "audio/wav" });

  let audioUrl;
  try {
    audioUrl = await fal.storage.upload(file);
    console.log("✅  Upload OK →", audioUrl);
  } catch (err) {
    console.error("❌  Upload failed:", err.message ?? err);
    process.exit(1);
  }

  console.log("🎙️  Calling fal-ai/whisper…");
  try {
    const result = await fal.subscribe("fal-ai/whisper", {
      input: { audio_url: audioUrl, task: "transcribe", chunk_level: "segment" },
    });
    const text = result.data?.text ?? "(empty — silence was the input, that's expected)";
    console.log("✅  Whisper response:", text);
    console.log("\n🎉  FAL API is working correctly!");
  } catch (err) {
    console.error("❌  Whisper call failed:", err.message ?? err);
    process.exit(1);
  }
}

run();
