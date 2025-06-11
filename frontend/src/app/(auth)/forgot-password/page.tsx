'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';

// Define validation schema with Zod
const emailSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' })
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
      message: 'Please enter a valid email address',
    }),
});

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[a-z]/, { message: 'Password must contain lowercase letters' })
    .regex(/[A-Z]/, { message: 'Password must contain uppercase letters' })
    .regex(/[0-9]/, { message: 'Password must contain numbers' }),
  confirmPassword: z.string(),
});

// Add confirmPassword validation
const passwordSchemaWithConfirm = passwordSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  }
);

type EmailFormData = z.infer<typeof emailSchema>;
type PasswordFormData = z.infer<typeof passwordSchemaWithConfirm>;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(60);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const inputRef = useRef<(HTMLInputElement | null)[]>([]);

  // Email form setup
  const emailForm = useForm<EmailFormData>({
    mode: 'all',
    resolver: zodResolver(emailSchema),
  });

  // Password form setup
  const passwordForm = useForm<PasswordFormData>({
    mode: 'all',
    resolver: zodResolver(passwordSchemaWithConfirm),
  });

  const startResendTimer = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setTimer(60);
    setCanResend(false);

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const requestOtpMutation = useMutation({
    mutationFn: async (data: EmailFormData) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/v1/auth/forgot-password`,
        { email: data.email }
      );
      return response.data;
    },
    onSuccess: (_, data) => {
      setUserEmail(data.email);
      setStep('otp');
      setServerError(null);
      startResendTimer();
    },
    onError: (error: AxiosError) => {
      setServerError(
        (error.response?.data as { message?: string })?.message ||
          'Failed to send verification code, please try again'
      );
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!userEmail) throw new Error('User email not found');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/v1/auth/forgot-password/verify`,
        { email: userEmail, otp: otp.join('') }
      );
      return response.data;
    },
    onSuccess: () => {
      setStep('reset');
      setServerError(null);
    },
    onError: (error: AxiosError) => {
      setServerError(
        (error.response?.data as { message?: string })?.message ||
          'Invalid verification code, please try again'
      );
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      if (!userEmail) throw new Error('User email not found');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/v1/auth/reset-password`,
        { email: userEmail, newPassword: data.password }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success(
        'Password reset successfully. Please login with your new password.'
      );
      setServerError(null);
      router.push('/login');
    },
    onError: (error: AxiosError) => {
      setServerError(
        (error.response?.data as { message?: string })?.message ||
          'Failed to reset password, please try again'
      );
    },
  });

  const handleOtpChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    if (value === '' || /^[0-9]$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < otp.length - 1) {
        inputRef.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRef.current[index - 1]?.focus();
    }
  };

  const onSubmitEmail = (data: EmailFormData) => {
    requestOtpMutation.mutate(data);
  };

  const onSubmitPassword = (data: PasswordFormData) => {
    resetPasswordMutation.mutate(data);
  };

  const resendOtp = () => {
    // Use email from userEmail state
    if (userEmail) {
      requestOtpMutation.mutate({ email: userEmail });
    }
  };

  return (
   <div className="w-full flex flex-col items-center pt-10 min-h-screen">
      <div className="w-full max-w-md mx-auto  p-6 ">
        {step === 'email' && (
          <>
            <h1 className="text-2xl font-bold text-center mb-6">
              Forgot Password
            </h1>
            <form
              onSubmit={emailForm.handleSubmit(onSubmitEmail)}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  placeholder="your@email.com"
                  className={`w-full p-2 border rounded-md focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none ${
                    emailForm.formState.errors.email
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  type="email"
                  id="email"
                  {...emailForm.register('email')}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  !emailForm.formState.isValid || requestOtpMutation.isPending
                }
                className={`w-full mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
                  !emailForm.formState.isValid || requestOtpMutation.isPending
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {requestOtpMutation.isPending ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Sending code...
                  </span>
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </form>

            {serverError && (
              <div className="m-4 text-red-700 rounded-md text-center text-sm">
                {serverError}
              </div>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Return to </span>
              <Link
                href="/login"
                className="font-medium text-orange-600 hover:text-orange-500"
              >
                Login
              </Link>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <h1 className="text-2xl font-bold text-center mb-6">
              Verification Code
            </h1>
            <p className="text-center text-gray-600 mb-4">
              Enter the verification code sent to {userEmail}
            </p>
            <div className="flex justify-center gap-2 mt-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  ref={(el) => {
                    inputRef.current[index] = el;
                  }}
                  maxLength={1}
                  onChange={(e) => handleOtpChange(e, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  value={digit}
                  className="w-12 h-12 text-center border border-gray-300 rounded-md focus:ring-[.5px] focus:ring-gray-500 focus:border-gray-500 outline-none"
                />
              ))}
            </div>
            <button
              disabled={
                verifyOtpMutation.isPending || otp.some((digit) => !digit)
              }
              onClick={() => verifyOtpMutation.mutate()}
              className="mt-4 cursor-pointer w-full bg-orange-500 text-white p-2 rounded-md hover:bg-orange-600 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed"
            >
              {verifyOtpMutation.isPending ? (
                <div className="flex justify-center">
                  <Loader2 className="animate-spin" size={22} />
                </div>
              ) : (
                'Verify Code'
              )}
            </button>
            <div className="flex justify-center mt-4">
              {canResend ? (
                <button
                  onClick={resendOtp}
                  className="text-orange-500 cursor-pointer hover:underline"
                >
                  Resend Code
                </button>
              ) : (
                <span className="text-gray-500">Resend code in {timer}s</span>
              )}
            </div>
            {serverError && (
              <p className="text-red-500 text-sm mt-2 text-center">
                {serverError}
              </p>
            )}
          </>
        )}

        {step === 'reset' && (
          <>
            <h3 className="text-xl font-semibold text-center mb-4">
              Reset Your Password
            </h3>

            <form
              onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    placeholder="••••••••"
                    className={`w-full p-2 border rounded-md focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none ${
                      passwordForm.formState.errors.password
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    type={passwordVisible ? 'text' : 'password'}
                    id="password"
                    {...passwordForm.register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                  >
                    {passwordVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                {passwordForm.formState.errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {passwordForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    placeholder="••••••••"
                    className={`w-full p-2 border rounded-md focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none ${
                      passwordForm.formState.errors.confirmPassword
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    type={confirmPasswordVisible ? 'text' : 'password'}
                    id="confirmPassword"
                    {...passwordForm.register('confirmPassword')}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-3 text-gray-500 hover:text-gray-700"
                    onClick={() =>
                      setConfirmPasswordVisible(!confirmPasswordVisible)
                    }
                  >
                    {confirmPasswordVisible ? (
                      <Eye size={18} />
                    ) : (
                      <EyeOff size={18} />
                    )}
                  </button>
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  resetPasswordMutation.isPending ||
                  !passwordForm.formState.isValid
                }
                className={`w-full mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
                  !passwordForm.formState.isValid ||
                  resetPasswordMutation.isPending
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {resetPasswordMutation.isPending ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Saving...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </button>

              {serverError && (
                <div className="m-4 text-red-700 rounded-md text-center text-sm">
                  {serverError}
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
