import type { Plugin } from 'vite';
import { getGeminiClient } from './gemini';

export function campusApiPlugin(): Plugin {
  return {
    name: 'campus-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        // Helper to parse JSON body
        const getBody = async (): Promise<any> => {
          return new Promise((resolve, reject) => {
            let data = '';
            req.on('data', (chunk) => {
              data += chunk;
            });
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch (e) {
                resolve({});
              }
            });
            req.on('error', reject);
          });
        };

        const sendJson = (statusCode: number, payload: any) => {
          res.statusCode = statusCode;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));
        };

        try {
          if (req.url === '/api/ai/match' && req.method === 'POST') {
            const body = await getBody();
            const { query, events = [], clubs = [], resources = [], userProfile } = body;

            const ai = getGeminiClient();
            if (!ai) {
              return sendJson(200, {
                status: 'fallback',
                message: 'AI key not detected on server; client fallback active',
              });
            }

            const prompt = `You are CampusPulse AI, an intelligent campus discovery assistant for university students.
The student asked: "${query}"

Student Profile:
- Name: ${userProfile?.name || 'Student'}
- Major: ${userProfile?.major || 'Undeclared'}
- Year: ${userProfile?.year || 'Undergraduate'}
- Interests: ${userProfile?.interests?.join(', ') || 'General'}

Campus Database Catalog:
Events: ${JSON.stringify(events.map((e: any) => ({ id: e.id, title: e.title, category: e.category, perks: e.perks, desc: e.shortDesc, building: e.building, displayTime: e.displayTime })))}
Clubs: ${JSON.stringify(clubs.map((c: any) => ({ id: c.id, name: c.name, category: c.category, perks: c.perks, desc: c.shortDesc, meetingSchedule: c.meetingSchedule })))}
Resources: ${JSON.stringify(resources.map((r: any) => ({ id: r.id, name: r.name, category: r.category, perks: r.perks, desc: r.shortDesc, openHours: r.openHours, currentStatus: r.currentStatus })))}

Return a JSON response strictly adhering to this format:
{
  "summary": "Warm, encouraging 2-3 sentence personalized summary for the student answering their exact request.",
  "personaMatch": "A brief tag like 'Late-Night Builder' or 'Social Foodie' or 'Career Climber'",
  "topPerksFound": ["Free Food 🍕", "Tutors On-Duty 📚"],
  "suggestedActionPlan": [
    {
      "step": 1,
      "action": "Head over to...",
      "targetTitle": "Event or Resource Title",
      "type": "event" | "club" | "resource",
      "timeOrLocation": "Room and Time",
      "why": "Specific reason why this fits their query"
    }
  ],
  "eventRankings": [
    { "id": "event-id", "matchScore": 95, "reason": "Why this matches" }
  ],
  "clubRankings": [
    { "id": "club-id", "matchScore": 90, "reason": "Why this club is relevant" }
  ],
  "resourceRankings": [
    { "id": "resource-id", "matchScore": 88, "reason": "Why this facility helps" }
  ]
}`;

            const response = await ai.models.generateContent({
              model: 'gemini-3.7-flash',
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
                systemInstruction: 'You are an enthusiastic, empathetic, and hyper-accurate university campus advisor AI that matches students to real campus events, clubs, and facilities.',
              },
            });

            const text = response.text || '{}';
            const parsed = JSON.parse(text);
            return sendJson(200, { status: 'success', data: parsed });
          }

          if (req.url === '/api/ai/enhance-event' && req.method === 'POST') {
            const body = await getBody();
            const { draftTitle, draftCategory, draftDesc, perks = [] } = body;

            const ai = getGeminiClient();
            if (!ai) {
              return sendJson(200, {
                status: 'fallback',
                data: {
                  enhancedTitle: draftTitle,
                  enhancedDesc: draftDesc + ' All students are warmly invited to attend!',
                  suggestedPerks: perks,
                  engagementTips: ['Provide free food or coffee to increase attendance by 3x.', 'Post reminders 2 hours before the start time.'],
                },
              });
            }

            const prompt = `You are a student engagement and campus marketing expert.
Enhance this campus event draft to make it compelling, clear, and high-converting for students.
Draft Title: ${draftTitle}
Category: ${draftCategory}
Description: ${draftDesc}
Current Perks: ${perks.join(', ')}

Return a JSON object:
{
  "enhancedTitle": "Catchy, professional, and clear event title",
  "enhancedDesc": "Polished, engaging 2-3 paragraph description highlighting takeaways and vibe",
  "suggestedPerks": ["Free Food 🍕", "Resume Drop 💼"],
  "engagementTips": ["Tip 1 to maximize RSVP", "Tip 2 for social buzz"],
  "targetAudiences": ["Computer Science majors", "Freshmen looking for clubs", "Job seekers"]
}`;

            const response = await ai.models.generateContent({
              model: 'gemini-3.7-flash',
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
              },
            });

            const text = response.text || '{}';
            const parsed = JSON.parse(text);
            return sendJson(200, { status: 'success', data: parsed });
          }

          if (req.url === '/api/health') {
            return sendJson(200, { status: 'healthy', timestamp: new Date().toISOString() });
          }

          return next();
        } catch (error: any) {
          console.error('API Error:', error);
          return sendJson(500, { error: error.message || 'Internal API Error' });
        }
      });
    },
  };
}
