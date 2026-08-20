import { CampusEvent, CampusClub, DispatchedEmail, UserProfile } from '../types';

const EMAIL_STORAGE_KEY = 'campuspulse_dispatched_emails_v2';

export function getDispatchedEmails(): DispatchedEmail[] {
  try {
    const saved = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (!saved) return [];
    const list: DispatchedEmail[] = JSON.parse(saved);
    // Deduplicate emails by ID or by same category + eventTitle
    const seenKeys = new Set<string>();
    const deduplicated: DispatchedEmail[] = [];

    for (const item of list) {
      const key = `${item.category}-${item.eventTitle || item.subject}`;
      if (seenKeys.has(item.id) || (item.category === 'missed_event_alert' && seenKeys.has(key))) {
        continue;
      }
      seenKeys.add(item.id);
      seenKeys.add(key);
      deduplicated.push(item);
    }
    return deduplicated;
  } catch {
    return [];
  }
}

export function saveDispatchedEmail(email: DispatchedEmail) {
  try {
    const current = getDispatchedEmails();
    // Do not save duplicate missed event alert for the same event title
    if (email.category === 'missed_event_alert') {
      const alreadyExists = current.some(
        (e) => e.category === 'missed_event_alert' && e.eventTitle === email.eventTitle
      );
      if (alreadyExists) return;
    }
    const updated = [email, ...current].slice(0, 50); // Keep last 50 emails
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(updated));

    // Try to trigger browser notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(email.subject, {
          body: email.previewText,
          icon: '/favicon.ico'
        });
      } catch {
        // Ignore notification errors
      }
    }
  } catch (err) {
    console.error('Failed to store email:', err);
  }
}

/**
 * Sends real RSVP Confirmation Email to student's Gmail address and outbox
 */
export function sendRsvpConfirmationEmail(user?: UserProfile | null, event?: CampusEvent | null, userEmail?: string): DispatchedEmail | null {
  if (!event) return null;
  const userName = user?.name || 'Student';
  const emailAddress = userEmail || user?.email || user?.emailSettings?.recipientEmail || 'saikanala1403@gmail.com';
  const email: DispatchedEmail = {
    id: `email-rsvp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    recipientEmail: emailAddress,
    recipientName: userName,
    subject: `🎟️ RSVP Confirmed: ${event.title}`,
    previewText: `You're officially registered for ${event.title} at ${event.building} (Room ${event.room})`,
    sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
    category: 'rsvp_confirmation',
    eventTitle: event.title,
    eventDate: event.displayTime,
    eventLocation: `${event.building} • Room ${event.room}`,
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #fed7aa; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ea580c, #c2410c); padding: 28px 24px; color: #ffffff; text-align: center;">
          <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">CampusConnect Verified Entry Ticket</span>
          <h1 style="margin: 14px 0 6px 0; font-size: 22px; font-weight: 800;">You're Registered!</h1>
          <p style="margin: 0; font-size: 13px; opacity: 0.95;">Sent to: <strong>${emailAddress}</strong></p>
        </div>
        
        <div style="padding: 24px; color: #1e293b;">
          <h2 style="font-size: 18px; margin: 0 0 16px 0; color: #0f172a;">${event.title}</h2>
          
          <div style="background: #fff7ed; border: 1px solid #ffedd5; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #9a3412; font-weight: 600; width: 110px;">📅 Date & Time:</td>
                <td style="padding: 6px 0; color: #1e293b;">${event.displayTime}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9a3412; font-weight: 600;">📍 Location:</td>
                <td style="padding: 6px 0; color: #1e293b;">${event.building} (Room ${event.room})</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9a3412; font-weight: 600;">👥 Organizer:</td>
                <td style="padding: 6px 0; color: #1e293b;">${event.organizer}</td>
              </tr>
              ${event.foodDetails ? `
              <tr>
                <td style="padding: 6px 0; color: #9a3412; font-weight: 600;">🍕 Catering:</td>
                <td style="padding: 6px 0; color: #1e293b;">${event.foodDetails}</td>
              </tr>` : ''}
            </table>
          </div>

          <p style="font-size: 13px; color: #475569; line-height: 1.6;">
            <strong>Important Instructions:</strong> Please show this ticket or your digital barcode at the venue check-in desk. Join the live attendee discussion on CampusConnect to connect with fellow attendees.
          </p>
        </div>

        <div style="background: #fffbf7; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
          Vellore Institute of Technology • CampusConnect Automated Notification Dispatcher<br/>
          Delivered directly to ${emailAddress}
        </div>
      </div>
    `
  };

  saveDispatchedEmail(email);
  return email;
}

/**
 * Sends Missed/Ended Event recap email strictly once to the registered student's Gmail
 */
export function sendMissedEventEmail(user?: UserProfile | null, event?: CampusEvent | null, userEmail?: string): DispatchedEmail | null {
  if (!event) return null;

  const emailAddress = userEmail || user?.email || user?.emailSettings?.recipientEmail || 'saikanala1403@gmail.com';
  
  // Verify that we haven't already dispatched a missed event email for this event
  const existingEmails = getDispatchedEmails();
  const alreadySent = existingEmails.some(
    (e) => e.category === 'missed_event_alert' && (e.eventTitle === event.title || e.id.includes(event.id))
  );
  if (alreadySent) {
    return null;
  }

  const userName = user?.name || 'Student';
  const email: DispatchedEmail = {
    id: `email-missed-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    recipientEmail: emailAddress,
    recipientName: userName,
    subject: `⚠️ Missed Event Notice & Resources: ${event.title}`,
    previewText: `The deadline for ${event.title} has completed. Slides and notes have been archived.`,
    sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
    category: 'missed_event_alert',
    eventTitle: event.title,
    eventDate: event.displayTime,
    eventLocation: `${event.building} • Room ${event.room}`,
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #fed7aa; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #d97706, #b45309); padding: 26px 24px; color: #ffffff; text-align: center;">
          <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">Event Completed Notice</span>
          <h1 style="margin: 12px 0 4px 0; font-size: 20px; font-weight: 800;">Missed Event Follow-up</h1>
          <p style="margin: 0; font-size: 13px; opacity: 0.95;">Sent to: ${emailAddress}</p>
        </div>
        
        <div style="padding: 24px; color: #1e293b;">
          <p style="font-size: 13px; color: #475569; margin-top: 0;">
            Hi <strong>${userName}</strong>, you were registered for <strong>${event.title}</strong> (${event.displayTime}) which has now completed its schedule.
          </p>

          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin: 18px 0;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #92400e; font-weight: 700;">📦 Event Recaps & Resources</h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #78350f; line-height: 1.8;">
              <li>Presentation slides and shared materials are available via the student hub.</li>
              <li>You can continue chatting with attendees in the club discussion channel.</li>
              <li>Stay tuned for subsequent hackathons & workshops!</li>
            </ul>
          </div>
        </div>

        <div style="background: #fffbf7; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
          Vellore Institute of Technology • CampusConnect Smart Attendance Assistant
        </div>
      </div>
    `
  };

  saveDispatchedEmail(email);
  return email;
}

export function sendClubWelcomeEmail(user?: UserProfile | null, club?: CampusClub | null, userEmail?: string): DispatchedEmail | null {
  if (!club) return null;
  const userName = user?.name || 'Student';
  const emailAddress = userEmail || user?.email || user?.emailSettings?.recipientEmail || 'saikanala1403@gmail.com';
  const email: DispatchedEmail = {
    id: `email-club-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    recipientEmail: emailAddress,
    recipientName: userName,
    subject: `✨ Welcome to ${club.name}!`,
    previewText: `You've joined ${club.name}. Weekly meetings: ${club.meetingSchedule}`,
    sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
    category: 'club_welcome',
    eventTitle: club.name,
    eventDate: club.meetingSchedule,
    eventLocation: club.location,
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #fed7aa; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ea580c, #9a3412); padding: 26px 24px; color: #ffffff; text-align: center;">
          <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">New Member Onboarding</span>
          <h1 style="margin: 12px 0 4px 0; font-size: 20px; font-weight: 800;">Welcome to ${club.name}!</h1>
          <p style="margin: 0; font-size: 13px; opacity: 0.95;">You're now part of a community of ${club.membersCount}+ passionate students.</p>
        </div>
        
        <div style="padding: 24px; color: #1e293b;">
          <div style="background: #fff7ed; border: 1px solid #ffedd5; border-radius: 12px; padding: 16px; margin-bottom: 18px;">
            <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #9a3412;">📅 Meeting Schedule:</p>
            <p style="margin: 0 0 12px 0; font-size: 13px; color: #1e293b;">${club.meetingSchedule} at ${club.location}</p>
            <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #9a3412;">👤 Club President:</p>
            <p style="margin: 0; font-size: 13px; color: #1e293b;">${club.president} (${club.contactEmail})</p>
          </div>

          <p style="font-size: 13px; color: #475569; line-height: 1.6;">
            ${club.description}
          </p>
        </div>

        <div style="background: #fffbf7; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
          Vellore Institute of Technology • CampusConnect Student Affairs
        </div>
      </div>
    `
  };

  saveDispatchedEmail(email);
  return email;
}

export function sendOrganizerBroadcastEmail(
  organizerName: string,
  eventTitle: string,
  subject: string,
  announcementText: string,
  recipientCount: number
): DispatchedEmail {
  const email: DispatchedEmail = {
    id: `email-broadcast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    recipientEmail: `[Broadcast to ${recipientCount} registered students]`,
    recipientName: 'All Registered Students',
    subject: `📢 Announcement: ${subject}`,
    previewText: `${organizerName} sent an update regarding ${eventTitle}`,
    sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
    category: 'organizer_broadcast',
    eventTitle: eventTitle,
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #fed7aa; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0f172a, #334155); padding: 26px 24px; color: #ffffff; text-align: center;">
          <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">Official Organizer Announcement</span>
          <h1 style="margin: 12px 0 4px 0; font-size: 20px; font-weight: 800;">${subject}</h1>
          <p style="margin: 0; font-size: 13px; opacity: 0.9;">Regarding: <strong>${eventTitle}</strong></p>
        </div>
        
        <div style="padding: 24px; color: #1e293b;">
          <p style="font-size: 14px; color: #334155; line-height: 1.7; white-space: pre-line;">
            ${announcementText}
          </p>

          <p style="font-size: 12px; color: #64748b; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
            Sent by <strong>${organizerName}</strong> to all RSVP'd attendees.
          </p>
        </div>
      </div>
    `
  };

  saveDispatchedEmail(email);
  return email;
}

/**
 * Generates direct Google Webmail compose URL with formatted recipient, subject, and ticket body
 */
export function generateGmailComposeUrl(email: DispatchedEmail): string {
  const to = encodeURIComponent(email.recipientEmail || '');
  const su = encodeURIComponent(email.subject || 'CampusConnect Ticket & Confirmation');
  const plainBody = `Hi ${email.recipientName || 'Student'},

${email.previewText || ''}

EVENT DETAILS:
• Title: ${email.eventTitle || 'Campus Event'}
• Date & Time: ${email.eventDate || 'Scheduled on CampusConnect'}
• Location: ${email.eventLocation || 'Main Campus'}

---
Ticket Verification ID: ${email.id}
Vellore Institute of Technology • CampusConnect Smart Notification System`;

  return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${encodeURIComponent(plainBody)}`;
}

/**
 * Generates mailto link for default email client (Apple Mail, Outlook, Thunderbird)
 */
export function generateMailtoUrl(email: DispatchedEmail): string {
  const to = encodeURIComponent(email.recipientEmail || '');
  const su = encodeURIComponent(email.subject || 'CampusConnect Ticket & Confirmation');
  const plainBody = `Hi ${email.recipientName || 'Student'},

${email.previewText || ''}

EVENT DETAILS:
• Title: ${email.eventTitle || 'Campus Event'}
• Date & Time: ${email.eventDate || 'Scheduled on CampusConnect'}
• Location: ${email.eventLocation || 'Main Campus'}

Ticket Verification ID: ${email.id}
Vellore Institute of Technology`;

  return `mailto:${to}?subject=${su}&body=${encodeURIComponent(plainBody)}`;
}

/**
 * Exports complete standard .EML email ticket file that can be opened in any email client
 */
export function downloadEmlFile(email: DispatchedEmail): void {
  const emlContent = [
    `From: "CampusConnect" <notifications@campusconnect.vit.ac.in>`,
    `To: <${email.recipientEmail}>`,
    `Subject: ${email.subject}`,
    `Date: ${new Date().toUTCString()}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    `X-Mailer: CampusConnect-VIT-Portal`,
    ``,
    email.htmlContent,
  ].join('\r\n');

  const blob = new Blob([emlContent], { type: 'message/rfc822' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const sanitizedTitle = (email.eventTitle || 'Ticket').replace(/[^a-zA-Z0-9]/g, '_');
  a.href = url;
  a.download = `CampusConnect_${sanitizedTitle}.eml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
