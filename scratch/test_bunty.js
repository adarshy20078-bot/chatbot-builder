import axios from 'axios';
import fs from 'fs';

const ELEVENLABS_KEY = 'sk_9ad6c2235f9fd999cdf3f39e4039170eb3a67be316dd3006';

async function testBuntyVoice() {
  console.log('🔍 Testing ElevenLabs Bunty - Fun Podcast Host Voice Models...');

  const candidateVoiceIds = [
    { name: 'Bunty (TX3LPaxmHKxFdv7VOQHJ)', id: 'TX3LPaxmHKxFdv7VOQHJ' },
    { name: 'Bunty (g5CIjZEefAph4nZcqdJ2)', id: 'g5CIjZEefAph4nZcqdJ2' },
    { name: 'Bunty (cgSgspJ2msm6clMCkdW9)', id: 'cgSgspJ2msm6clMCkdW9' },
    { name: 'Bunty (bIHbv24MWmeMgasZH58o)', id: 'bIHbv24MWmeMgasZH58o' },
    { name: 'Bunty (JBFqnCBsd6RMkjVDRZzb)', id: 'JBFqnCBsd6RMkjVDRZzb' }
  ];

  const text = 'Namaste dosto! Main Bunty hoon Aursgen AI se! Hum aapke business ko AI automation aur 24/7 WhatsApp chatbots se 10x grow karte hain!';

  for (const v of candidateVoiceIds) {
    try {
      console.log(`Testing ${v.name}...`);
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${v.id}`,
        {
          text: text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: { stability: 0.50, similarity_boost: 0.85, style: 0.2 }
        },
        {
          headers: {
            'xi-api-key': ELEVENLABS_KEY,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );
      const filePath = `/Users/adarsh/Documents/antigravity/lucid-carson/scratch/Bunty_${v.id}.mp3`;
      fs.writeFileSync(filePath, response.data);
      console.log(`✅ SUCCESS! Audio saved for ${v.name} (${response.data.length} bytes) at ${filePath}`);
    } catch (err) {
      console.log(`❌ ${v.name} error:`, err.response?.data ? Buffer.from(err.response.data).toString() : err.message);
    }
  }
}

testBuntyVoice();
