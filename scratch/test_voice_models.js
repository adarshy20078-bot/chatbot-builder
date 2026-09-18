import axios from 'axios';
import fs from 'fs';

const ELEVENLABS_KEY = 'sk_9ad6c2235f9fd999cdf3f39e4039170eb3a67be316dd3006';

async function testVoices() {
  console.log('🔍 Testing ElevenLabs eleven_turbo_v2_5 Model for Perfect Hindi Word Clarity...');

  const text = 'नमस्ते! क्या मेरी बात पूजा जी से हो रही है? मैं ऑर्सजेन एआई से बोल रही हूँ। क्या आपके पास 30 सेकंड का समय है?';
  const voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Kanika

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: text,
        model_id: 'eleven_turbo_v2_5', // Newest 2.5 Model for Native Hindi Word Clarity
        voice_settings: { stability: 0.65, similarity_boost: 0.90 }
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    const filePath = `/Users/adarsh/Documents/antigravity/lucid-carson/scratch/Kanika_Turbo_v2_5.mp3`;
    fs.writeFileSync(filePath, response.data);
    console.log(`✅ SUCCESS! eleven_turbo_v2_5 Audio Generated (${response.data.length} bytes) at: ${filePath}`);
  } catch (err) {
    console.error(`❌ ERROR:`, err.response?.data ? Buffer.from(err.response.data).toString() : err.message);
  }
}

testVoices();
