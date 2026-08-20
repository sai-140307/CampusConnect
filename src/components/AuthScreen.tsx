import React, { useState } from 'react';
import { 
  Network, 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Copy,
  Check,
  KeyRound
} from 'lucide-react';
import { signInUser, signUpUser, signInWithGoogle } from '../firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { UserRole } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: FirebaseUser, role: UserRole) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [organizerCode, setOrganizerCode] = useState('');
  const [organizerDept, setOrganizerDept] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; organizerCode?: string }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const validateInputs = (): boolean => {
    const errors: { email?: string; password?: string; organizerCode?: string } = {};
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      errors.email = "Email address is required.";
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = "Invalid email format (e.g., student@vitstudent.ac.in).";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (mode === 'signup' && password.length < 6) {
      errors.password = "Weak password. Minimum 6 characters required.";
    }

    if (selectedRole === 'organizer' && mode === 'signup') {
      if (!organizerCode.trim()) {
        errors.organizerCode = "Organizer security passcode is required.";
      }
    }

    setFieldErrors(errors);

    if (errors.email) {
      setErrorTitle("Invalid Email Format");
      setErrorMessage(errors.email);
      return false;
    }

    if (errors.password) {
      setErrorTitle(mode === 'signup' && password.length < 6 ? "Weak Password" : "Password Required");
      setErrorMessage(errors.password);
      return false;
    }

    if (errors.organizerCode) {
      setErrorTitle("Organizer Verification Required");
      setErrorMessage("Please enter an Organizer Authorization Key (or use demo code: VIT-ORGANIZER-2026).");
      return false;
    }

    return true;
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setErrorTitle(null);
    setFieldErrors({});
    setSuccessMessage(null);
    setUnauthorizedDomain(null);
    setIsGoogleLoading(true);
    const { user, error, unauthorizedDomain: unauthDomain } = await signInWithGoogle();
    setIsGoogleLoading(false);
    if (error) {
      setErrorTitle(unauthDomain ? "Domain Not Authorized" : "Google Sign-In Error");
      setErrorMessage(error);
      if (unauthDomain) {
        setUnauthorizedDomain(unauthDomain);
      }
    } else if (user) {
      setSuccessMessage("Google sign-in successful!");
      localStorage.setItem('campuspulse_active_role', selectedRole);
      onAuthSuccess(user, selectedRole);
    }
  };

  const handleCopyDomain = () => {
    if (unauthorizedDomain) {
      navigator.clipboard.writeText(unauthorizedDomain);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorTitle(null);
    setSuccessMessage(null);

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    if (mode === 'signin') {
      const { user, error, errorCode } = await signInUser(email, password);
      setIsLoading(false);
      if (error) {
        if (errorCode === 'auth/invalid-email') {
          setErrorTitle("Invalid Email Format");
          setFieldErrors({ email: "Please enter a valid email address." });
        } else if (errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
          setErrorTitle("Authentication Failed");
          setFieldErrors({ password: "Incorrect password." });
        } else if (errorCode === 'auth/user-not-found') {
          setErrorTitle("Account Not Found");
          setFieldErrors({ email: "No account registered with this email." });
        } else {
          setErrorTitle("Sign In Error");
        }
        setErrorMessage(error);
      } else if (user) {
        setSuccessMessage("Sign in successful!");
        localStorage.setItem('campuspulse_active_role', selectedRole);
        onAuthSuccess(user, selectedRole);
      }
    } else {
      const { user, error, errorCode } = await signUpUser(email, password);
      setIsLoading(false);
      if (error) {
        if (errorCode === 'auth/email-already-in-use') {
          setErrorTitle("Account Already Exists");
          setFieldErrors({ email: "Email is already registered." });
        } else if (errorCode === 'auth/weak-password') {
          setErrorTitle("Weak Password");
          setFieldErrors({ password: "Password must be at least 6 characters long." });
        } else if (errorCode === 'auth/invalid-email') {
          setErrorTitle("Invalid Email Format");
          setFieldErrors({ email: "Please enter a valid email address." });
        } else {
          setErrorTitle("Registration Error");
        }
        setErrorMessage(error);
      } else if (user) {
        setSuccessMessage("Account created successfully!");
        localStorage.setItem('campuspulse_active_role', selectedRole);
        onAuthSuccess(user, selectedRole);
      }
    }
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setErrorMessage(null);
    setErrorTitle(null);
    setFieldErrors({});
    setSuccessMessage(null);
    setUnauthorizedDomain(null);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-orange-600 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Campus Brand Badge */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-600 text-white shadow-md mb-3.5">
          <Network className="w-6 h-6" />
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
          CampusConnect
        </h1>
        <p className="mt-1 text-xs text-stone-600 font-medium">
          Vellore Institute of Technology • Student & Event Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-9 rounded-2xl border border-orange-200/90 shadow-xl shadow-orange-950/5 space-y-5">
          
          {/* Account Role Selector */}
          <div>
            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-2">
              Select Your Campus Role
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-orange-50/80 border border-orange-200 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedRole === 'student'
                    ? 'bg-white text-orange-950 shadow-xs border border-orange-300'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-orange-600" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('organizer')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedRole === 'organizer'
                    ? 'bg-white text-orange-950 shadow-xs border border-orange-300'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Briefcase className="w-4 h-4 text-amber-600" />
                <span>Event Organizer</span>
              </button>
            </div>
            {selectedRole === 'organizer' ? (
              <p className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-lg mt-2 border border-amber-200 leading-relaxed">
                🔒 <strong>Organizer Account:</strong> Exclusively authorized to create, update, delete events, and broadcast announcements.
              </p>
            ) : (
              <p className="text-[11px] text-stone-500 mt-1.5 px-0.5">
                Students can browse, search with AI, RSVP to events, participate in discussions, and join clubs.
              </p>
            )}
          </div>

          {/* Tab Selection */}
          <div className="flex p-1 bg-stone-100 rounded-xl">
            <button
              id="btn-tab-signin"
              type="button"
              onClick={() => switchMode('signin')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Sign In
            </button>
            <button
              id="btn-tab-signup"
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Header Title for Mode */}
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              {mode === 'signin' ? 'Welcome back' : `Create ${selectedRole === 'organizer' ? 'Organizer' : 'Student'} Account`}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {mode === 'signin' 
                ? `Sign in as ${selectedRole} to manage your campus schedule.`
                : `Register your account to access VIT campus events.`}
            </p>
          </div>

          {/* Google Sign-in Button */}
          <button
            id="btn-google-auth"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-800 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <span className="text-stone-600">Connecting Google...</span>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-stone-200" />
            <span className="flex-shrink mx-3 text-[11px] font-medium text-stone-400">
              or continue with email
            </span>
            <div className="flex-grow border-t border-stone-200" />
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div 
              id="auth-error-box"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2 animate-in fade-in"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block text-rose-900">
                    {errorTitle || "Authentication Notice"}
                  </span>
                  <span className="text-rose-700 leading-relaxed block">
                    {unauthorizedDomain
                      ? "Google Sign-In requires your app's current domain to be added to Firebase's authorized list."
                      : errorMessage}
                  </span>
                </div>
              </div>

              {unauthorizedDomain && (
                <div className="pt-2 border-t border-rose-200/80 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between gap-2 p-1.5 px-2.5 rounded-lg bg-white border border-rose-200 text-stone-700">
                    <span className="font-mono truncate select-all">{unauthorizedDomain}</span>
                    <button
                      type="button"
                      onClick={handleCopyDomain}
                      className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-stone-900 text-white text-[10px] font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? "Copied!" : "Copy Domain"}</span>
                    </button>
                  </div>

                  <div className="text-stone-600 space-y-1 pl-1">
                    <p className="font-medium text-stone-800">Quick fix in Firebase Console:</p>
                    <ol className="list-decimal pl-4 space-y-0.5 text-stone-600">
                      <li>Go to <b>Authentication</b> → <b>Settings</b> tab.</li>
                      <li>Scroll down to <b>Authorized domains</b>.</li>
                      <li>Click <b>Add domain</b>, paste the copied domain, and save.</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success Message Box */}
          {successMessage && (
            <div 
              id="auth-success-box"
              className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5 animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="auth-email-input"
                className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${fieldErrors.email ? 'text-rose-500' : 'text-stone-400'}`} />
                <input
                  id="auth-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  placeholder={selectedRole === 'organizer' ? 'organizer@vit.ac.in' : 'student@vitstudent.ac.in'}
                  required
                  autoComplete="email"
                  className={`w-full rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none transition-all ${
                    fieldErrors.email 
                      ? 'bg-rose-50/50 border border-rose-400 focus:border-rose-600 focus:bg-white' 
                      : 'bg-stone-50 border border-stone-200 focus:border-orange-600 focus:bg-white'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium flex items-center gap-1">
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label 
                  htmlFor="auth-password-input"
                  className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider"
                >
                  Password
                </label>
                {mode === 'signup' && (
                  <span className={`text-[10px] font-medium ${password.length >= 6 ? 'text-emerald-600' : 'text-stone-400'}`}>
                    {password.length >= 6 ? '✓ Strong enough' : 'Min. 6 characters'}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${fieldErrors.password ? 'text-rose-500' : 'text-stone-400'}`} />
                <input
                  id="auth-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  placeholder="••••••••"
                  required
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className={`w-full rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none transition-all ${
                    fieldErrors.password 
                      ? 'bg-rose-50/50 border border-rose-400 focus:border-rose-600 focus:bg-white' 
                      : 'bg-stone-50 border border-stone-200 focus:border-orange-600 focus:bg-white'
                  }`}
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium flex items-center gap-1">
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            {/* Organizer Verification Fields */}
            {selectedRole === 'organizer' && mode === 'signup' && (
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/90 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                      Organizer Passcode
                    </label>
                    <button
                      type="button"
                      onClick={() => setOrganizerCode('VIT-ORGANIZER-2026')}
                      className="text-[10px] text-orange-700 hover:underline font-bold cursor-pointer"
                    >
                      Fill Demo (VIT-ORGANIZER-2026)
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={organizerCode}
                      onChange={(e) => setOrganizerCode(e.target.value)}
                      placeholder="e.g. VIT-ORGANIZER-2026"
                      className="w-full rounded-lg pl-9 pr-3 py-2 text-xs bg-white border border-amber-300 focus:outline-none focus:border-orange-600 text-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-950 uppercase tracking-wider mb-1">
                    Club or Department Name
                  </label>
                  <input
                    type="text"
                    value={organizerDept}
                    onChange={(e) => setOrganizerDept(e.target.value)}
                    placeholder="e.g. GDSC Campus / Student Council"
                    className="w-full rounded-lg px-3 py-2 text-xs bg-white border border-amber-300 focus:outline-none focus:border-orange-600 text-stone-900"
                  />
                </div>
              </div>
            )}

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <span>
                {isLoading 
                  ? 'Authenticating...' 
                  : mode === 'signin' 
                    ? `Sign In as ${selectedRole === 'organizer' ? 'Organizer' : 'Student'}` 
                    : `Register as ${selectedRole === 'organizer' ? 'Organizer' : 'Student'}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Mode Switch Helper Link */}
          <div className="text-center pt-1 border-t border-stone-100">
            {mode === 'signin' ? (
              <p className="text-xs text-stone-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-semibold text-orange-600 underline hover:text-orange-700 cursor-pointer"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p className="text-xs text-stone-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="font-semibold text-orange-600 underline hover:text-orange-700 cursor-pointer"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>

        </div>

        {/* Security / Notice Pill */}
        <div className="mt-6 text-center text-xs text-stone-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secured via Firebase Authentication • Role Gated</span>
        </div>
      </div>
    </div>
  );
};
