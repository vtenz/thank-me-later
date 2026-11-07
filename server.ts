import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '2mb' }));

// In-memory LRU-like cache for generated WAV audio
const ttsCache = new Map<string, { audioBase64: string; modelUsed: string }>();

function getGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.post('/api/tts', async (req, res) => {
  try {
    const {
      text,
      mode = 'single',
      voiceName = 'Kore',
      dialogueTurns,
    }: {
      text?: string;
      mode?: 'single' | 'podcast';
      voiceName?: 'Kore' | 'Puck' | 'Zephyr' | 'Charon' | 'Fenrir';
      dialogueTurns?: { speaker: 'Ostad' | 'Daneshjoo'; text: string }[];
    } = req.body || {};

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error: 'کلید GEMINI_API_KEY در تنظیمات سرور یافت نشد. لطفاً از بخش Settings > Secrets کلید را بررسی کنید.',
      });
      return;
    }

    const cacheKey = crypto
      .createHash('sha256')
      .update(JSON.stringify({ text, mode, voiceName, dialogueTurns }))
      .digest('hex');

    const cached = ttsCache.get(cacheKey);
    if (cached) {
      res.json({
        audioBase64: cached.audioBase64,
        mimeType: 'audio/wav',
        modelUsed: cached.modelUsed,
        cached: true,
      });
      return;
    }

    const ai = getGeminiClient();

    if (mode === 'podcast' && Array.isArray(dialogueTurns) && dialogueTurns.length > 0) {
      const parts = dialogueTurns.map((turn) => ({
        text: `${turn.speaker}: ${turn.text}`,
        speechMetadata: {
          speaker: turn.speaker,
          style:
            turn.speaker === 'Ostad'
              ? 'Warm, charismatic, clear Persian pharmacology professor explaining concepts with enthusiasm'
              : 'Curious, engaged Persian pharmacy student asking smart questions',
        },
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: 'Ostad',
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
                  },
                },
                {
                  speaker: 'Daneshjoo',
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: voiceName === 'Puck' ? 'Zephyr' : 'Puck',
                    },
                  },
                },
              ],
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error('پاسخ صوتی از مدل دریافت نشد.');
      }

      if (ttsCache.size > 40) {
        const firstKey = ttsCache.keys().next().value;
        if (firstKey) ttsCache.delete(firstKey);
      }
      ttsCache.set(cacheKey, {
        audioBase64: base64Audio,
        modelUsed: 'gemini-3.8-flash-tts (Dual-Speaker)',
      });

      res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
        modelUsed: 'gemini-3.8-flash-tts (Dual-Speaker)',
      });
      return;
    }

    // Single-speaker narration using gemini-3.8-flash-tts (with fallback to gemini-3.8-flash-lite-tts)
    const cleanText = (text || '').trim();
    if (!cleanText) {
      res.status(400).json({ error: 'متن برای تبدیل به گفتار خالی است.' });
      return;
    }

    let base64Audio: string | undefined;
    let modelUsed = 'gemini-3.8-flash-tts';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText,
                speechMetadata: {
                  style:
                    'Warm, articulate, engaging Persian pharmacology professor teaching an exam prep masterclass with clear pronunciation',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
            },
          },
        },
      });
      base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (primaryErr) {
      // Fallback to gemini-3.8-flash-lite-tts if needed
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText,
                speechMetadata: {
                  style:
                    'Warm, articulate, clear Persian pharmacology instructor',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
            },
          },
        },
      });
      base64Audio =
        fallbackResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      modelUsed = 'gemini-3.8-flash-lite-tts';
      if (!base64Audio) throw primaryErr;
    }

    if (!base64Audio) {
      throw new Error('تولید فایل صوتی توسط مدل با خطا مواجه شد.');
    }

    if (ttsCache.size > 40) {
      const firstKey = ttsCache.keys().next().value;
      if (firstKey) ttsCache.delete(firstKey);
    }
    ttsCache.set(cacheKey, { audioBase64: base64Audio, modelUsed });

    res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      modelUsed,
    });
  } catch (error: unknown) {
    const errMsg =
      error instanceof Error ? error.message : 'خطای ناشناخته در سرویس TTS';
    console.error('Gemini TTS Error:', errMsg);
    res.status(500).json({
      error: `خطا در تولید صدای هوشمند: ${errMsg}`,
    });
  }
});

async function startServer() {
  const port = 3000;

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
