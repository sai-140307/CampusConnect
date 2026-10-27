import React, { useState } from 'react';
import { Network, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck, Copy, Check, User } from 'lucide-react';
import { signInUser, signUpUser, signInWithGoogle, sendVerificationEmail, sendPasswordReset } from '../firebase';

/**
 * Sign in and account creation.
 *
 * Everyone signs in the same way. Nobody chooses a role here: organizer access
 * is requested after sign-in and granted by an admin, and admins are set in the
 * Firebase console. That keeps roles out of reach of the browser.
 */

type Mode = 'signin' | 'signup' | 'reset';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns what is missing from a new password, or null when it is strong enough. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Use at least one letter and one number.';
  return null;
}

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
    setUnauthorizedDomain(null);
    setPassword('');
    setConfirm('');
  };

  const handleGoogle = async () => {
    setError(null);
    setNotice(null);
    setIsLoading(true);
    const { error: googleError, unauthorizedDomain: domain } = await signInWithGoogle();
    setIsLoading(false);
    if (googleError) {
      setError({ title: domain ? 'Domain not authorized' : 'Google sign-in failed', message: googleError });
      setUnauthorizedDomain(domain || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const trimmed = email.trim();

    if (!EMAIL_RE.test(trimmed)) {
      setError({ title: 'Check your email', message: 'Enter a valid email address, for example name@vitstudent.ac.in.' });
      return;
    }

    if (mode === 'reset') {
      setIsLoading(true);
      try {
        await sendPasswordReset(trimmed);
        setNotice(`If an account exists for ${trimmed}, a reset link is on its way. Check your inbox and spam folder.`);
      } catch {
        setError({ title: 'Could not send the link', message: 'Check your connection and try again.' });
      }
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError({ title: 'Password needed', message: 'Enter your password.' });
      return;
    }

    if (mode === 'signup') {
      const problem = passwordProblem(password);
      if (problem) {
        setError({ title: 'Choose a stronger password', message: problem });
        return;
      }
      if (password !== confirm) {
        setError({ title: 'Passwords do not match', message: 'Type the same password in both boxes.' });
        return;
      }
    }

    setIsLoading(true);
    if (mode === 'signin') {
      const { error: signInError } = await signInUser(trimmed, password);
      setIsLoading(false);
      if (signInError) setError({ title: 'Sign-in failed', message: signInError });
      return;
    }

    const { user, error: signUpError } = await signUpUser(trimmed, password);
    setIsLoading(false);
    if (signUpError || !user) {
      setError({ title: 'Could not create the account', message: signUpError || 'Try again.' });
      return;
    }
    // The app opens straight away; the verification email unlocks organizer access later.
    sendVerificationEmail(user).catch(() => undefined);
  };

  const strength = mode === 'signup' && password ? passwordProblem(password) : null;
  const inputClass =
    'w-full rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-ink-900 placeholder-ink-400 bg-ink-50 border border-ink-200 focus:outline-none focus:border-brand-600 focus:bg-white transition-all';

  return (
    <div className="cc-auth min-h-screen bg-paper flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl cc-btn-brand shadow-md mb-3.5">
          <Network className="w-6 h-6" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink-900">CampusConnect</h1>
        <p className="mt-1 text-sm text-ink-600">Events, clubs and services at Vellore Institute of Technology</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="cc-auth-card bg-white py-8 px-6 sm:px-9 rounded-3xl border border-ink-200 shadow-xl shadow-brand-950/5 space-y-5">
          {mode !== 'reset' ? (
            <div className="flex p-1 bg-ink-100 rounded-xl" role="tablist">
              {(['signin', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  id={m === 'signin' ? 'btn-tab-signin' : 'btn-tab-signup'}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    mode === m ? 'bg-white text-ink-900 shadow-2xs' : 'text-ink-500 hover:text-ink-900'
                  }`}
                >
                  {m === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-900">Reset your password</h2>
              <p className="text-sm text-ink-600 mt-1">We will email you a link to choose a new one.</p>
            </div>
          )}

          {mode !== 'reset' && (
            <>
              <button
                id="btn-google-auth"
                type="button"
                onClick={handleGoogle}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-ink-200 hover:bg-ink-50 text-ink-800 text-sm font-semibold transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google
              </button>
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-ink-200" />
                <span className="mx-3 text-xs text-ink-400">or with email</span>
                <div className="flex-grow border-t border-ink-200" />
              </div>
            </>
          )}

          {error && (
            <div id="auth-error-box" role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <span className="font-semibold block">{error.title}</span>
                  <span className="block">{error.message}</span>
                </div>
              </div>
              {unauthorizedDomain && (
                <div className="flex items-center justify-between gap-2 p-1.5 px-2.5 rounded-lg bg-white border border-rose-200 text-ink-700 text-xs">
                  <span className="font-mono truncate">{unauthorizedDomain}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(unauthorizedDomain).catch(() => undefined);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded cc-btn-ink text-2xs font-semibold cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {isCopied ? 'Copied' : 'Copy domain'}
                  </button>
                </div>
              )}
            </div>
          )}

          {notice && (
            <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{notice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="auth-email-input" className="block text-sm font-medium text-ink-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  id="auth-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@vitstudent.ac.in"
                  autoComplete="email"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="auth-password-input" className="block text-sm font-medium text-ink-700">
                    Password
                  </label>
                  {mode === 'signin' ? (
                    <button type="button" onClick={() => switchMode('reset')} className="text-xs font-medium text-brand-700 hover:underline cursor-pointer">
                      Forgot password?
                    </button>
                  ) : (
                    <span className={`text-xs ${password && !strength ? 'text-emerald-700' : 'text-ink-500'}`}>
                      {password && !strength ? 'Strong enough' : '8+ characters, a letter and a number'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    id="auth-password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    required
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-confirm-input" className="block text-sm font-medium text-ink-700 mb-1.5">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    id="auth-confirm-input"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={isLoading}
              className="cc-btn-brand cc-press w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading
                ? 'Please wait…'
                : mode === 'signin'
                  ? 'Sign in'
                  : mode === 'signup'
                    ? 'Create account'
                    : 'Email me a reset link'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {mode === 'reset' ? (
            <button type="button" onClick={() => switchMode('signin')} className="text-sm font-medium text-brand-700 hover:underline cursor-pointer">
              Back to sign in
            </button>
          ) : (
            <p className="text-xs text-ink-500 flex items-start gap-2 pt-3 border-t border-ink-100">
              <User className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Every account starts as a student. Event organizers request access after signing in, and an admin approves it.
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-ink-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Sign-in is handled by Firebase Authentication
        </p>
      </div>
    </div>
  );
};
