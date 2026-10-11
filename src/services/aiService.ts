import { CampusEvent, CampusClub, CampusResource, AIMatchResult, UserProfile, PerkType } from '../types';
import { formatEventWhen } from '../utils/campusTime';

export async function requestAIMatch(
  query: string,
  events: CampusEvent[],
  clubs: CampusClub[],
  resources: CampusResource[],
  userProfile: UserProfile
): Promise<AIMatchResult> {
  try {
    const res = await fetch('/api/ai/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Send each event with a fresh, human-readable time so the model never sees stale labels.
      body: JSON.stringify({
        query,
        events: events.map((e) => ({ ...e, displayTime: formatEventWhen(e) })),
        clubs,
        resources,
        userProfile: { name: userProfile.name, major: userProfile.major, year: userProfile.year, interests: userProfile.interests },
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        const d = json.data;
        // Merge AI rankings with full event/club/resource objects
        const matchedEvents = (d.eventRankings || [])
          .map((item: any) => {
            const ev = events.find((e) => e.id === item.id);
            return ev ? { event: ev, matchScore: item.matchScore || 85, reason: item.reason || 'Relevant to your campus query.' } : null;
          })
          .filter(Boolean);

        const matchedClubs = (d.clubRankings || [])
          .map((item: any) => {
            const cl = clubs.find((c) => c.id === item.id);
            return cl ? { club: cl, matchScore: item.matchScore || 80, reason: item.reason || 'Active student community in this field.' } : null;
          })
          .filter(Boolean);

        const matchedResources = (d.resourceRankings || [])
          .map((item: any) => {
            const re = resources.find((r) => r.id === item.id);
            return re ? { resource: re, matchScore: item.matchScore || 80, reason: item.reason || 'Campus facility ready to support your goals.' } : null;
          })
          .filter(Boolean);

        if (matchedEvents.length > 0 || matchedClubs.length > 0 || matchedResources.length > 0) {
          return {
            query,
            summary: d.summary || `Here are the top matches for "${query}".`,
            personaMatch: d.personaMatch || 'Campus Explorer',
            suggestedActionPlan: d.suggestedActionPlan || [],
            matchedEvents: matchedEvents.slice(0, 4),
            matchedClubs: matchedClubs.slice(0, 3),
            matchedResources: matchedResources.slice(0, 3),
            topPerksFound: d.topPerksFound || ['Free Food 🍕', 'Networking 🤝'],
          };
        }
      }
    }
  } catch (err) {
    console.warn('AI API error, using intelligent client matcher:', err);
  }

  // Fallback intelligent semantic & keyword matcher
  return clientSideMatchHeuristic(query, events, clubs, resources, userProfile);
}

function clientSideMatchHeuristic(
  query: string,
  events: CampusEvent[],
  clubs: CampusClub[],
  resources: CampusResource[],
  userProfile: UserProfile
): AIMatchResult {
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter((w) => w.length > 2);

  // Score an event
  const scoreEvent = (ev: CampusEvent): { score: number; reason: string } => {
    let score = 50;
    const reasons: string[] = [];

    // Food checks
    if ((q.includes('food') || q.includes('pizza') || q.includes('eat') || q.includes('snack') || q.includes('hungry') || q.includes('dinner') || q.includes('pancake')) && ev.perks.includes('Free Food 🍕')) {
      score += 40;
      reasons.push('Features free food (' + (ev.foodDetails || 'catered meal') + ')');
    }

    // Tutoring / Study
    if ((q.includes('tutor') || q.includes('cs') || q.includes('math') || q.includes('study') || q.includes('homework') || q.includes('exam')) && (ev.category === 'Academic & STEM' || ev.perks.includes('Tutors On-Duty 📚'))) {
      score += 35;
      reasons.push('Live TA tutors and academic help on site');
    }

    // Coding / Hackathon / Tech
    if ((q.includes('hack') || q.includes('code') || q.includes('ai') || q.includes('tech') || q.includes('build') || q.includes('app')) && (ev.category === 'Tech & Hackathons' || ev.tags.some(t => t.toLowerCase().includes('ai') || t.toLowerCase().includes('tech')))) {
      score += 35;
      reasons.push('Direct match for student builders and technology enthusiasts');
    }

    // Social / People / Friends
    if ((q.includes('meet') || q.includes('people') || q.includes('friend') || q.includes('social') || q.includes('party')) && (ev.category === 'Free Food & Social' || ev.category === 'Arts, Music & Culture' || ev.perks.includes('Networking 🤝'))) {
      score += 30;
      reasons.push('High-energy social atmosphere with great student turnout');
    }

    // Dog / Pet / Stress / Wellness
    if ((q.includes('dog') || q.includes('pet') || q.includes('stress') || q.includes('relax') || q.includes('wellness') || q.includes('mindful')) && (ev.perks.includes('Pet Therapy 🐶') || ev.category === 'Health & Wellness')) {
      score += 40;
      reasons.push('Designed for mental recharge and hands-on pet relaxation');
    }

    // Career / Resume
    if ((q.includes('career') || q.includes('resume') || q.includes('job') || q.includes('intern') || q.includes('work')) && (ev.category === 'Career & Professional' || ev.perks.includes('Resume Drop 💼'))) {
      score += 35;
      reasons.push('Opportunity to submit resumes directly to alumni and recruiters');
    }

    // Word occurrences
    for (const w of words) {
      if (ev.title.toLowerCase().includes(w)) score += 15;
      if (ev.description.toLowerCase().includes(w)) score += 10;
      if (ev.tags.some((t) => t.toLowerCase().includes(w))) score += 15;
    }

    const finalScore = Math.min(99, Math.max(60, score));
    return {
      score: finalScore,
      reason: reasons.length > 0 ? reasons.join(' • ') : `Matches keywords related to ${ev.category.toLowerCase()}.`,
    };
  };

  // Score a club
  const scoreClub = (cl: CampusClub): { score: number; reason: string } => {
    let score = 45;
    const reasons: string[] = [];

    if ((q.includes('meet') || q.includes('friend') || q.includes('club') || q.includes('join')) && cl.membersCount > 200) {
      score += 30;
      reasons.push(`Large, welcoming community of ${cl.membersCount}+ active student members`);
    }

    if ((q.includes('code') || q.includes('ai') || q.includes('hack') || q.includes('dev')) && (cl.category === 'Tech & Hackathons' || cl.tags.includes('AI/ML'))) {
      score += 35;
      reasons.push('Hands-on technical workshops, dev teams, and project mentorship');
    }

    if ((q.includes('food') || q.includes('cook') || q.includes('eat')) && (cl.category === 'Free Food & Social' || cl.perks.includes('Free Food 🍕'))) {
      score += 35;
      reasons.push('Regular culinary socials and food rescue events');
    }

    if ((q.includes('hike') || q.includes('outdoor') || q.includes('climb') || q.includes('trip')) && cl.category === 'Sports & Outdoors') {
      score += 40;
      reasons.push('Free gear rental and regular weekend adventure trips');
    }

    for (const w of words) {
      if (cl.name.toLowerCase().includes(w)) score += 18;
      if (cl.description.toLowerCase().includes(w)) score += 10;
      if (cl.tags.some((t) => t.toLowerCase().includes(w))) score += 12;
    }

    return {
      score: Math.min(98, Math.max(55, score)),
      reason: reasons.length > 0 ? reasons.join(' • ') : `Weekly meetings at ${cl.meetingSchedule}.`,
    };
  };

  // Score a resource
  const scoreResource = (re: CampusResource): { score: number; reason: string } => {
    let score = 40;
    const reasons: string[] = [];

    if ((q.includes('tutor') || q.includes('math') || q.includes('cs') || q.includes('help') || q.includes('study')) && re.category === 'Academic & Tutoring') {
      score += 45;
      reasons.push('Drop-in 1-on-1 subject tutoring with no appointment needed');
    }

    if ((q.includes('food') || q.includes('pantry') || q.includes('hungry') || q.includes('groceries')) && re.category === 'Financial & Food Aid') {
      score += 50;
      reasons.push('Free confidential groceries and emergency meal vouchers');
    }

    if ((q.includes('maker') || q.includes('3d') || q.includes('print') || q.includes('laser') || q.includes('hardware')) && re.category === 'Makerspace & Tech') {
      score += 45;
      reasons.push('Free 3D printing quota and access to laser cutters');
    }

    if ((q.includes('resume') || q.includes('suit') || q.includes('interview') || q.includes('job')) && re.category === 'Career & Jobs') {
      score += 45;
      reasons.push('Free headshot booth, career closet suit rentals, and mock interviews');
    }

    if ((q.includes('stress') || q.includes('mental') || q.includes('therapy') || q.includes('counseling')) && re.category === 'Health & Wellness') {
      score += 45;
      reasons.push('24/7 on-call counseling and walk-in wellness support');
    }

    for (const w of words) {
      if (re.name.toLowerCase().includes(w)) score += 15;
      if (re.description.toLowerCase().includes(w)) score += 10;
      if (re.servicesOffered.some((s) => s.toLowerCase().includes(w))) score += 15;
    }

    return {
      score: Math.min(97, Math.max(50, score)),
      reason: reasons.length > 0 ? reasons.join(' • ') : `Open ${re.openHours}.`,
    };
  };

  const rankedEvents = events
    .map((e) => ({ event: e, ...scoreEvent(e) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => ({ event: item.event, matchScore: item.score, reason: item.reason }));

  const rankedClubs = clubs
    .map((c) => ({ club: c, ...scoreClub(c) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => ({ club: item.club, matchScore: item.score, reason: item.reason }));

  const rankedResources = resources
    .map((r) => ({ resource: r, ...scoreResource(r) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => ({ resource: item.resource, matchScore: item.score, reason: item.reason }));

  // Synthesize dynamic summary
  let persona = 'Campus Explorer';
  if (q.includes('food') || q.includes('eat')) persona = 'Campus Gourmet & Foodie';
  else if (q.includes('code') || q.includes('ai') || q.includes('hack')) persona = 'Technical Builder';
  else if (q.includes('meet') || q.includes('people') || q.includes('social')) persona = 'Social Connector';
  else if (q.includes('tutor') || q.includes('study')) persona = 'Academic Striver';
  else if (q.includes('resume') || q.includes('job')) persona = 'Career Accelerator';

  const actionPlan: AIMatchResult['suggestedActionPlan'] = [];
  if (rankedEvents[0]) {
    actionPlan.push({
      step: 1,
      action: `RSVP to ${rankedEvents[0].event.title}`,
      targetTitle: rankedEvents[0].event.title,
      type: 'event' as const,
      timeOrLocation: `${rankedEvents[0].event.building} (${formatEventWhen(rankedEvents[0].event)})`,
      why: rankedEvents[0].reason,
    });
  }
  if (rankedResources[0]) {
    actionPlan.push({
      step: 2,
      action: `Check in with ${rankedResources[0].resource.name}`,
      targetTitle: rankedResources[0].resource.name,
      type: 'resource' as const,
      timeOrLocation: rankedResources[0].resource.location,
      why: rankedResources[0].reason,
    });
  }
  if (rankedClubs[0]) {
    actionPlan.push({
      step: 3,
      action: `Join the ${rankedClubs[0].club.name} group chat`,
      targetTitle: rankedClubs[0].club.name,
      type: 'club' as const,
      timeOrLocation: rankedClubs[0].club.meetingSchedule,
      why: rankedClubs[0].reason,
    });
  }

  return {
    query,
    summary: `Here is what fits "${query}" from ${events.length} upcoming events, ${clubs.length} clubs and ${resources.length} campus services.`,
    personaMatch: persona,
    suggestedActionPlan: actionPlan,
    matchedEvents: rankedEvents,
    matchedClubs: rankedClubs,
    matchedResources: rankedResources,
    topPerksFound: ['Free Food 🍕', 'Networking 🤝', 'Free Coffee ☕'],
  };
}

export async function requestEventEnhancer(draft: {
  draftTitle: string;
  draftCategory: string;
  draftDesc: string;
  perks: string[];
}) {
  try {
    const res = await fetch('/api/ai/enhance-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch (e) {
    console.warn('Enhance API error:', e);
  }

  // Fallback enhancement
  return {
    enhancedTitle: draft.draftTitle.trim() ? `${draft.draftTitle} (Campus Special)` : 'Campus Innovation Meetup',
    enhancedDesc: `${draft.draftDesc}\n\n✨ Why you should attend: Connect with fellow ambitious students, collaborate on exciting initiatives, and enjoy complimentary refreshments!`,
    suggestedPerks: [...draft.perks, 'Free Food 🍕', 'Networking 🤝'].slice(0, 4),
    engagementTips: [
      'Mention free food in the first sentence of your promo.',
      'Set up a live Q&A channel 24 hours before kick-off to gauge questions.',
      'Offer digital badges or LinkedIn certificates for attendees.',
    ],
  };
}

export async function enhanceEventWithAI(params: {
  title: string;
  description: string;
  perks: string[];
  category: string;
}): Promise<{
  enhancedTitle: string;
  enhancedDescription: string;
  suggestedPerks?: PerkType[];
}> {
  const result = await requestEventEnhancer({
    draftTitle: params.title,
    draftCategory: params.category,
    draftDesc: params.description,
    perks: params.perks,
  });

  return {
    enhancedTitle: result.enhancedTitle || params.title,
    enhancedDescription: result.enhancedDesc || params.description,
    suggestedPerks: (result.suggestedPerks as PerkType[]) || [],
  };
}

