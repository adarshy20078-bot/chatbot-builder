import axios from 'axios';

const ELEVENLABS_KEY = 'sk_9ad6c2235f9fd999cdf3f39e4039170eb3a67be316dd3006';

async function findBuntySharedVoice() {
  try {
    const res = await axios.get('https://api.elevenlabs.io/v1/shared-voices?search=Bunty', {
      headers: { 'xi-api-key': ELEVENLABS_KEY }
    });
    console.log('Shared Bunty Voices:', JSON.stringify(res.data.voices, null, 2));
  } catch (err) {
    console.error('Error fetching shared voices:', err.message);
  }
}

findBuntySharedVoice();
