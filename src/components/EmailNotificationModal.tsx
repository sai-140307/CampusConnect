import React, { useEffect, useState } from 'react';
import { useModal } from '../hooks/useModal';
import { 
  X, 
  Mail, 
  Bell, 
  CheckCircle2, 
  Clock, 
  Send, 
  Inbox, 
  Sparkles, 
  Calendar, 
  AlertTriangle,
  Radio,
  Sliders,
  Eye,
  Check,
  ShieldCheck
} from 'lucide-react';
import { EmailNotificationSettings, DispatchedEmail, UserProfile } from '../types';
import { getDispatchedEmails, saveDispatchedEmail, generateGmailComposeUrl, generateMailtoUrl, downloadEmlFile } from '../services/emailService';
import { ExternalLink, FileText } from 'lucide-react';
import { formatCampusClock, formatRelativeTime, now } from '../utils/campusTime';

interface EmailNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile;
  emailSettings?: EmailNotificationSettings;
  onUpdateEmailSettings?: (settings: EmailNotificationSettings) => void;
  onUpdateSettings?: (settings: EmailNotificationSettings) => void;
  userEmail?: string;
}

export const EmailNotificationModal: React.FC<EmailNotificationModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  emailSettings: directEmailSettings,
  onUpdateEmailSettings,
  onUpdateSettings,
  userEmail,
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'outbox'>('settings');
  const [emails, setEmails] = useState<DispatchedEmail[]>(() => getDispatchedEmails());
  const [selectedEmail, setSelectedEmail] = useState<DispatchedEmail | null>(null);

  // Settings State
  const defaultSettings: EmailNotificationSettings = {
    enabled: true,
    recipientEmail: userEmail || directEmailSettings?.recipientEmail || userProfile?.emailSettings?.recipientEmail || '',
    notifyOnRsvp: true,
    notifyOnMissedEvent: true,
    notify24hBefore: true,
    notify1hBefore: true,
    notifyClubAnnouncements: true,
    notifyAiDigest: true,
  };

  const [settings, setSettings] = useState<EmailNotificationSettings>(() => ({
    ...defaultSettings,
    ...(userProfile?.emailSettings || {}),
    ...(directEmailSettings || {}),
  }));

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testEmailSent, setTestEmailSent] = useState(false);

  useModal(isOpen, onClose);

  // Reload sent emails and the latest saved settings every time the dialog opens.
  useEffect(() => {
    if (!isOpen) return;
    setEmails(getDispatchedEmails());
    setSelectedEmail(null);
    if (directEmailSettings) setSettings((prev) => ({ ...prev, ...directEmailSettings }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateEmailSettings) {
      onUpdateEmailSettings(settings);
    } else if (onUpdateSettings) {
      onUpdateSettings(settings);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSendTestEmail = () => {
    const testEmail: DispatchedEmail = {
      id: `email-test-${Date.now()}`,
      recipientEmail: settings.recipientEmail,
      recipientName: userProfile?.name || 'Student',
      subject: '✅ CampusConnect Email Notifications Active!',
      previewText: 'Your email notification preferences have been saved and verified.',
      sentAt: formatCampusClock(),
      createdAt: now(),
      category: 'ai_digest',
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #fed7aa; padding: 24px; color: #1e293b;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 32px;">📬</span>
            <h2 style="color: #ea580c; margin: 8px 0 4px 0;">Notifications Connected!</h2>
            <p style="color: #64748b; font-size: 13px; margin: 0;">You'll now receive RSVP confirmations, missed event resources, and club announcements at <strong>${settings.recipientEmail}</strong>.</p>
          </div>
          <div style="background: #fff7ed; padding: 14px; border-radius: 8px; font-size: 12px; color: #9a3412;">
            ✨ <strong>Active preferences:</strong> Event RSVP Confirmations, Missed Event Recaps, 24h Reminders, Club Broadcasts.
          </div>
        </div>
      `
    };

    saveDispatchedEmail(testEmail);
    setEmails(getDispatchedEmails());
    setTestEmailSent(true);
    setTimeout(() => setTestEmailSent(false), 3000);
  };

  return (
    <div className="cc-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-xs" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div 
        className="cc-dialog relative w-full max-w-2xl bg-white border border-brand-200/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-ink-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-brand-50 to-amber-50/50 border-b border-brand-200/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="cc-btn-brand w-10 h-10 rounded-xl flex items-center justify-center shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-ink-900 text-base">Email center</h3>
              <p className="text-xs text-ink-500">Choose what you get emailed about, and see your tickets</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white border border-brand-200/80 hover:bg-brand-100/50 text-ink-500 hover:text-ink-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-brand-100 bg-brand-50/30 px-5 pt-2 gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab('settings'); setSelectedEmail(null); }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'settings'
                ? 'border-brand-600 text-brand-950 font-semibold'
                : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('outbox'); setEmails(getDispatchedEmails()); }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'outbox'
                ? 'border-brand-600 text-brand-950 font-semibold'
                : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Tickets and emails ({emails.length})</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-ink-50/40">
          {/* Helpful Environment Notice */}
          <div className="mb-5 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs">
            <span className="text-base mt-0.5">📬</span>
            <div className="flex-1 leading-relaxed">
              <p className="font-semibold text-amber-950">These are previews, not sent mail</p>
              <p className="text-xs text-amber-800 mt-0.5">
                This app does not send real email yet. Each ticket and notice is saved here, and you can open it in Gmail or download it.
              </p>
            </div>
          </div>

          {activeTab === 'settings' ? (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Primary Email Address */}
              <div>
                <label className="block text-xs font-bold text-ink-700 mb-2">
                  Delivery Email Address
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={settings.recipientEmail}
                      onChange={(e) => setSettings({ ...settings, recipientEmail: e.target.value })}
                      placeholder="student@vitstudent.ac.in"
                      required
                      className="w-full bg-white border border-brand-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-ink-900 focus:outline-none focus:border-brand-500 shadow-2xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    className="px-3.5 py-2.5 rounded-xl bg-brand-100 hover:bg-brand-200 text-brand-900 text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{testEmailSent ? "Test Sent!" : "Send Test"}</span>
                  </button>
                </div>
                <p className="text-xs text-ink-500 mt-1.5">
                  Confirmations and event pass reminders will be dispatched directly to this address.
                </p>
              </div>

              {/* Notification Categories */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-ink-700">
                  Notification Triggers
                </label>

                <div className="bg-white border border-brand-200/80 rounded-xl divide-y divide-brand-100 overflow-hidden shadow-2xs">
                  {/* RSVP Confirmation */}
                  <label className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-brand-50/40 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-ink-900">🎟️ Event RSVP & Entry Pass</p>
                      <p className="text-xs text-ink-500">
                        Instant email receipt with time, location, room number, and calendar (.ics) sync button.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifyOnRsvp}
                      onChange={(e) => setSettings({ ...settings, notifyOnRsvp: e.target.checked })}
                      className="w-4 h-4 text-brand-600 rounded mt-0.5 accent-brand-600"
                    />
                  </label>

                  {/* Missed Event Alerts */}
                  <label className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-brand-50/40 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-ink-900">⚠️ Missed Event Recaps & Slides</p>
                      <p className="text-xs text-ink-500">
                        If an event you registered for ends and attendance wasn't logged, receive presentation slides and recap materials.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifyOnMissedEvent}
                      onChange={(e) => setSettings({ ...settings, notifyOnMissedEvent: e.target.checked })}
                      className="w-4 h-4 text-brand-600 rounded mt-0.5 accent-brand-600"
                    />
                  </label>

                  {/* 24h & 1h Reminders */}
                  <label className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-brand-50/40 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-ink-900">⏰ 24h & 1h Event Countdown Alerts</p>
                      <p className="text-xs text-ink-500">
                        Timely reminders before your upcoming campus sessions kick off.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notify24hBefore}
                      onChange={(e) => setSettings({ ...settings, notify24hBefore: e.target.checked, notify1hBefore: e.target.checked })}
                      className="w-4 h-4 text-brand-600 rounded mt-0.5 accent-brand-600"
                    />
                  </label>

                  {/* Club Announcements */}
                  <label className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-brand-50/40 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-ink-900">📣 Club Updates & Broadcasts</p>
                      <p className="text-xs text-ink-500">
                        Official updates, meeting changes, and news from student clubs you have joined.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifyClubAnnouncements}
                      onChange={(e) => setSettings({ ...settings, notifyClubAnnouncements: e.target.checked })}
                      className="w-4 h-4 text-brand-600 rounded mt-0.5 accent-brand-600"
                    />
                  </label>

                  {/* AI Smart Match Digest */}
                  <label className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-brand-50/40 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-ink-900">✨ AI Matchmaker Weekly Digest</p>
                      <p className="text-xs text-ink-500">
                        Personalized curation of new events and free food drops matching your declared interests.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifyAiDigest}
                      onChange={(e) => setSettings({ ...settings, notifyAiDigest: e.target.checked })}
                      className="w-4 h-4 text-brand-600 rounded mt-0.5 accent-brand-600"
                    />
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                {savedSuccess && (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Preferences saved successfully!
                  </span>
                )}
                {!savedSuccess && <div />}

                <button
                  type="submit"
                  className="cc-btn-brand px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ml-auto"
                >
                  Save Email Preferences
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {selectedEmail ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedEmail(null)}
                    className="mb-3 text-xs font-bold text-brand-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    ← Back to all sent emails
                  </button>

                  <div className="bg-white border border-brand-200 rounded-xl p-5 shadow-2xs space-y-4">
                    <div className="border-b border-brand-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-ink-500 mb-1">
                          <span>To: <strong className="text-ink-800">{selectedEmail.recipientEmail}</strong></span>
                          <span>•</span>
                          <span>{formatRelativeTime(selectedEmail.createdAt, selectedEmail.sentAt)}</span>
                        </div>
                        <h4 className="font-bold text-base text-ink-900">{selectedEmail.subject}</h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
                        <a
                          id="btn-modal-open-gmail"
                          href={generateGmailComposeUrl(selectedEmail)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cc-btn-brand inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open in Gmail</span>
                        </a>

                        <button
                          id="btn-modal-download-eml"
                          type="button"
                          onClick={() => downloadEmlFile(selectedEmail)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-ink-100 hover:bg-ink-200 text-ink-700 border border-ink-300 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-ink-500" />
                          <span>Download .EML</span>
                        </button>

                        <a
                          id="btn-modal-mailto"
                          href={generateMailtoUrl(selectedEmail)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-ink-100 hover:bg-ink-200 text-ink-700 border border-ink-300 transition-colors cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5 text-ink-500" />
                          <span>Mail App</span>
                        </a>
                      </div>
                    </div>

                    <div 
                      className="text-xs text-ink-700 leading-relaxed overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
                    />
                  </div>
                </div>
              ) : emails.length === 0 ? (
                <div className="text-center py-16 text-ink-400 text-xs">
                  <Mail className="w-8 h-8 mx-auto mb-2 text-ink-300" />
                  <p>No email notifications dispatched yet.</p>
                  <p className="text-xs text-ink-400 mt-1">RSVP to any event or click "Send Test" in settings to preview!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-xs text-ink-500 font-medium">Select a message to preview it.</p>
                  {emails.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedEmail(item)}
                      className="p-3.5 rounded-xl bg-white border border-brand-200/80 hover:border-brand-400 hover:bg-brand-50/30 transition-all cursor-pointer shadow-2xs flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-ink-900 truncate">{item.subject}</span>
                          <span className="px-1.5 py-0.5 rounded text-2xs font-semibold bg-brand-100 text-brand-800">
                            {item.category.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-ink-500 truncate">{item.previewText}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-2xs text-ink-400">{formatRelativeTime(item.createdAt, item.sentAt)}</span>
                        <Eye className="w-4 h-4 text-ink-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
