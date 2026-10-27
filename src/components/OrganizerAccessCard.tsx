import React, { useEffect, useState } from 'react';
import { MailCheck, Clock, XCircle, CheckCircle2, Send, RefreshCw } from 'lucide-react';
import { OrganizerRequest } from '../types';
import {
  FirebaseUser,
  refreshVerification,
  requestOrganizerAccess,
  sendVerificationEmail,
  subscribeToMyOrganizerRequest,
} from '../firebase';
import { now } from '../utils/campusTime';

interface OrganizerAccessCardProps {
  user: FirebaseUser;
  name: string;
  defaultDepartment?: string;
  onToast: (message: string) => void;
}

/**
 * Lets a signed-in student ask for organizer access. An admin approves or
 * rejects the request in the admin panel. A verified email is required first,
 * so a request always belongs to a real inbox.
 */
export const OrganizerAccessCard: React.FC<OrganizerAccessCardProps> = ({ user, name, defaultDepartment, onToast }) => {
  const [request, setRequest] = useState<OrganizerRequest | null | undefined>(undefined);
  const [verified, setVerified] = useState(user.emailVerified);
  const [department, setDepartment] = useState(defaultDepartment || '');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeToMyOrganizerRequest(user.uid, setRequest), [user.uid]);

  const checkVerified = async () => {
    setBusy(true);
    try {
      const ok = await refreshVerification(user);
      setVerified(ok);
      onToast(ok ? 'Email verified.' : 'Not verified yet. Open the link in the email first.');
    } catch {
      onToast('Could not check. Try again.');
    }
    setBusy(false);
  };

  const resend = async () => {
    setBusy(true);
    try {
      await sendVerificationEmail(user);
      onToast(`Verification email sent to ${user.email}.`);
    } catch {
      onToast('Too many emails sent. Wait a few minutes and try again.');
    }
    setBusy(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department.trim()) return;
    setBusy(true);
    try {
      await requestOrganizerAccess({
        uid: user.uid,
        email: user.email || '',
        name: name || (user.email || '').split('@')[0],
        department: department.trim().slice(0, 120),
        reason: reason.trim().slice(0, 500) || undefined,
        requestedAt: now(),
      });
      onToast('Request sent to the admins.');
    } catch {
      onToast('Could not send the request. Check that your email is verified, then try again.');
    }
    setBusy(false);
  };

  const box = 'p-4 rounded-xl border text-left text-sm space-y-3';

  if (!verified) {
    return (
      <div className={`${box} bg-amber-50 border-amber-200 text-amber-900`}>
        <p className="flex items-start gap-2">
          <MailCheck className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            <strong className="font-semibold">Verify your email first.</strong> We sent a link to {user.email}. Open it, then
            come back here.
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={checkVerified} className="cc-btn-ink cc-press px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
            <RefreshCw className="w-3.5 h-3.5" />
            I have verified it
          </button>
          <button type="button" disabled={busy} onClick={resend} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-amber-300 cursor-pointer disabled:opacity-60">
            Resend the email
          </button>
        </div>
      </div>
    );
  }

  if (request === undefined) return <p className="text-sm text-ink-500">Checking your request…</p>;

  if (request?.status === 'pending') {
    return (
      <div className={`${box} bg-brand-50 border-brand-200 text-brand-900`}>
        <p className="flex items-start gap-2">
          <Clock className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            <strong className="font-semibold">Request sent.</strong> An admin will review it. You get organizer tools as soon as it is
            approved, without signing in again.
          </span>
        </p>
      </div>
    );
  }

  if (request?.status === 'approved') {
    return (
      <div className={`${box} bg-emerald-50 border-emerald-200 text-emerald-900`}>
        <p className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Approved. If organizer tools have not appeared, reload the page.</span>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`${box} bg-white border-ink-200 text-ink-800`}>
      {request?.status === 'rejected' && (
        <p className="flex items-start gap-2 text-rose-700">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Your last request was not approved. You can ask again with more detail.</span>
        </p>
      )}
      <div>
        <label htmlFor="org-dept" className="block text-xs font-medium text-ink-700 mb-1">
          Club or department
        </label>
        <input
          id="org-dept"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          required
          maxLength={120}
          placeholder="e.g. GDSC VIT, Department of CSE"
          className="w-full rounded-lg px-3 py-2 text-sm bg-ink-50 border border-ink-200 focus:outline-none focus:border-brand-600 focus:bg-white"
        />
      </div>
      <div>
        <label htmlFor="org-reason" className="block text-xs font-medium text-ink-700 mb-1">
          Why you need it <span className="text-ink-400">(optional)</span>
        </label>
        <textarea
          id="org-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="e.g. I coordinate events for the robotics club"
          className="w-full rounded-lg px-3 py-2 text-sm bg-ink-50 border border-ink-200 focus:outline-none focus:border-brand-600 focus:bg-white"
        />
      </div>
      <button type="submit" disabled={busy || !department.trim()} className="cc-btn-brand cc-press px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
        <Send className="w-3.5 h-3.5" />
        Request organizer access
      </button>
    </form>
  );
};
