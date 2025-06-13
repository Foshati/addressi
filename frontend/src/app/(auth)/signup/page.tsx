'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Github, GoogleButton } from '@/components/icons';
import { useUser } from '@/hooks/useUser';

// ===== Custom hook for debounce =====
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ===== Custom hook for countdown timer =====
function useCountdown(initial = 60) {
  const [time, setTime] = useState(initial);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;

    const id = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          clearInterval(id);
          setRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [running]);

  return {
    time,
    running,
    start: () => {
      setTime(initial);
      setRunning(true);
    },
    stop: () => {
      setRunning(false);
    },
  };
}

// ===== Zod validation schema =====
const signupSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  username: z
    .string()
    .min(1, { message: 'Username is required' })
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(30, { message: 'Username must be less than 30 characters' })
    .regex(/^[a-z0-9_]+$/, {
      message:
        'Username can only contain lowercase letters, numbers, and underscores',
    }),
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' })
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
      message: 'Please enter a valid email address',
    }),
  password: z
    .string()
    .min(1, { message: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters' }),
});

// Type based on Zod schema
type SignupFormData = z.infer<typeof signupSchema>;

// ===== Main component function =====
export default function SignupPage() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isShowOtp, setIsShowOtp] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [userData, setUserData] = useState<SignupFormData | null>(null);
  const inputRef = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !isUserLoading) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  // Using OTP timer hook
  const {
    time: otpTimer,
    running: otpRunning,
    start: startOtpTimer,
  } = useCountdown(60);
  const canResendOtp = !otpRunning && otpTimer === 0;

  // Using React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    watch,
    setValue,
    trigger,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'all',
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
    },
  });

  // Field values
  const nameValue = watch('name');
  const usernameValue = watch('username');
  const emailValue = watch('email');
  const passwordValue = watch('password');

  // Handle username input to convert to lowercase
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lowercaseValue = e.target.value.toLowerCase();
    setValue('username', lowercaseValue);
    trigger('username');
  };

  // Debounced values to reduce server requests
  const debouncedUsername = useDebounce(usernameValue, 500);
  const debouncedEmail = useDebounce(emailValue, 500);

  // ===== Server validation for email =====
  const {
    data: emailValidation,
    isLoading: isEmailValidating,
    isFetched: isEmailValidated,
  } = useQuery({
    queryKey: ['validateEmail', debouncedEmail],
    queryFn: async () => {
      if (
        !debouncedEmail ||
        !debouncedEmail.includes('@') ||
        !debouncedEmail.includes('.')
      ) {
        return { valid: false, message: 'Invalid email address' };
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/v1/utils/validate-field`,
        { field: 'email', value: debouncedEmail }
      );
      return response.data;
    },
    enabled:
      Boolean(debouncedEmail) &&
      debouncedEmail.includes('@') &&
      debouncedEmail.includes('.'),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false,
    refetchOnWindowFocus: false,
  });

  // ===== Server validation for username =====
  const {
    data: usernameValidation,
    isLoading: isUsernameValidating,
    isFetched: isUsernameValidated,
  } = useQuery({
    queryKey: ['validateUsername', debouncedUsername],
    queryFn: async () => {
      if (!debouncedUsername || debouncedUsername.length < 3) {
        return {
          valid: false,
          message: 'Username must be at least 3 characters',
        };
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/v1/utils/validate-field`,
        { field: 'username', value: debouncedUsername }
      );
      return response.data;
    },
    enabled: Boolean(debouncedUsername) && debouncedUsername.length >= 3,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false,
    refetchOnWindowFocus: false,
  });

  // ===== Submit signup form =====
  const onSubmit = async (data: SignupFormData) => {
    // Check email and username validity before submitting
    const isEmailValid = emailValidation?.valid === true;
    const isUsernameValid = usernameValidation?.valid === true;

    if (!isEmailValid || !isUsernameValid) {
      setServerError('Please fix the form errors');
      return;
    }

    try {
      setServerError(null);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/v1/auth/register`,
        data
      );

      if (response.data) {
        setUserData(data);
        setIsShowOtp(true);
        startOtpTimer();
      }
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.message) {
        setServerError(error.response.data.message);
      } else {
        setServerError('Registration failed. Please try again.');
      }
    }
  };

  // ===== Verify OTP =====
  const verifyOtp = async () => {
    if (!userData) return;

    try {
      setServerError(null);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/v1/auth/verify`,
        {
          ...userData,
          otp: otp.join(''),
        }
      );

      if (response.data.success) {
        router.push('/login');
      } else {
        setServerError('Invalid OTP. Please try again.');
      }
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.message) {
        setServerError(error.response.data.message);
      } else {
        setServerError('OTP verification failed. Please try again.');
      }
    }
  };

  // ===== Resend OTP =====
  const resendOtp = async () => {
    if (!userData || !canResendOtp) return;

    try {
      setServerError(null);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/v1/utils/resend-otp`,
        { email: userData.email }
      );

      if (response.data.success) {
        startOtpTimer();
      }
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.message) {
        setServerError(error.response.data.message);
      } else {
        setServerError('Failed to resend OTP. Please try again.');
      }
    }
  };

  // ===== Handle OTP input change =====
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

  // ===== Handle OTP key down =====
  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRef.current[index - 1]?.focus();
    }
  };

  // ===== Determine input border color class based on validation state =====
  const getBorderColorClass = (fieldName: string, hasError: boolean) => {
    if (hasError) return 'border-red-500';

    // Check specific field validation
    if (fieldName === 'email') {
      if (isEmailValidated && emailValidation) {
        return emailValidation.valid ? 'border-green-500' : 'border-red-500';
      }
    } else if (fieldName === 'username') {
      if (isUsernameValidated && usernameValidation) {
        return usernameValidation.valid ? 'border-green-500' : 'border-red-500';
      }
    } else if (fieldName === 'password') {
      if (passwordValue && passwordValue.length >= 8) {
        return 'border-green-500';
      }
    } else if (fieldName === 'name') {
      if (nameValue && nameValue.length > 0) {
        return 'border-green-500';
      }
    }

    return 'border-gray-300';
  };

  // ===== Check signup button disabled state =====
  const isSignupButtonDisabled =
    isSubmitting ||
    !isValid ||
    (isEmailValidated && !emailValidation?.valid) ||
    (isUsernameValidated && !usernameValidation?.valid) ||
    isEmailValidating ||
    isUsernameValidating;

  // ===== Check OTP verify button disabled state =====
  const isVerifyOtpButtonDisabled = otp.some((digit) => !digit);

  return (
    <div className="w-full flex flex-col items-center pt-10 min-h-screen">
      <div className="w-full max-w-md mx-auto  p-6 ">
        {!isShowOtp ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <h1 className="text-2xl font-bold text-center">Sign Up</h1>

            {/* Name field */}
            <div className="mt-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name
              </label>
              <div className="relative">
                <input
                  placeholder="Enter your name"
                  className={`w-full p-2 pl-3 pr-10 border ${getBorderColorClass(
                    'name',
                    !!errors.name
                  )} rounded-md focus:ring-[.5px] focus:ring-gray-500 focus:border-gray-500 outline-none`}
                  type="text"
                  id="name"
                  {...register('name')}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  pattern="[a-zA-Z0-9\s]+"
                />
                {nameValue && !errors.name && (
                  <div className="absolute right-3 top-3">
                    <CheckCircle className="text-green-500" size={18} />
                  </div>
                )}
              </div>
              {errors.name && (
                <p
                  id="name-error"
                  className="text-red-500 text-sm mt-1"
                  aria-live="polite"
                >
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Username field */}
            <div className="mt-4">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Username
              </label>
              <div className="relative">
                <input
                  placeholder="Username"
                  className={`w-full p-2 pl-3 pr-10 border ${getBorderColorClass(
                    'username',
                    !!errors.username
                  )} rounded-md focus:ring-[.5px] focus:ring-gray-500 focus:border-gray-500 outline-none`}
                  type="text"
                  id="username"
                  {...register('username')}
                  onChange={handleUsernameChange}
                  aria-invalid={!!errors.username}
                  aria-describedby={
                    errors.username || usernameValidation
                      ? 'username-feedback'
                      : undefined
                  }
                  pattern="[a-z0-9_]+"
                />
                {usernameValue && usernameValue.length >= 3 && (
                  <div className="absolute right-3 top-3">
                    {isUsernameValidating ? (
                      <Loader2
                        className="animate-spin text-gray-400"
                        size={18}
                      />
                    ) : isUsernameValidated && usernameValidation ? (
                      usernameValidation.valid ? (
                        <CheckCircle className="text-green-500" size={18} />
                      ) : (
                        <XCircle className="text-red-500" size={18} />
                      )
                    ) : null}
                  </div>
                )}
              </div>
              {/* فقط اگر خطا وجود داشته باشد یا یوزرنیم از قبل گرفته شده باشد پیام را نمایش می‌دهیم */}
              {(errors.username ||
                (isUsernameValidated && !usernameValidation?.valid)) && (
                  <p
                    id="username-feedback"
                    className="text-red-500 text-sm mt-1"
                    aria-live="polite"
                  >
                    {errors.username?.message || usernameValidation?.message}
                  </p>
                )}
            </div>

            {/* Email field */}
            <div className="mt-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <div className="relative">
                <input
                  placeholder="Email"
                  className={`w-full p-2 pl-3 pr-10 border ${getBorderColorClass(
                    'email',
                    !!errors.email
                  )} rounded-md focus:ring-[.5px] focus:ring-gray-500 focus:border-gray-500 outline-none`}
                  type="email"
                  id="email"
                  {...register('email')}
                  aria-invalid={!!errors.email}
                  aria-describedby={
                    errors.email || emailValidation
                      ? 'email-feedback'
                      : undefined
                  }
                  pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                />
                {emailValue &&
                  emailValue.includes('@') &&
                  emailValue.includes('.') && (
                    <div className="absolute right-3 top-3">
                      {isEmailValidating ? (
                        <Loader2
                          className="animate-spin text-gray-400"
                          size={18}
                        />
                      ) : isEmailValidated && emailValidation ? (
                        emailValidation.valid ? (
                          <CheckCircle className="text-green-500" size={18} />
                        ) : (
                          <XCircle className="text-red-500" size={18} />
                        )
                      ) : null}
                    </div>
                  )}
              </div>
              {/* فقط اگر خطا وجود داشته باشد یا ایمیل از قبل گرفته شده باشد پیام را نمایش می‌دهیم */}
              {(errors.email ||
                (isEmailValidated && !emailValidation?.valid)) && (
                  <p
                    id="email-feedback"
                    className="text-red-500 text-sm mt-1"
                    aria-live="polite"
                  >
                    {errors.email?.message || emailValidation?.message}
                  </p>
                )}
            </div>

            {/* Password field */}
            <div className="mt-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  placeholder="Enter your password"
                  className={`w-full p-2 pl-3 pr-10 border ${getBorderColorClass(
                    'password',
                    !!errors.password
                  )} rounded-md focus:ring-[.5px] focus:ring-gray-500 focus:border-gray-500 outline-none`}
                  type={passwordVisible ? 'text' : 'password'}
                  id="password"
                  {...register('password')}
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? 'password-error' : undefined
                  }
                />
                <div className="absolute right-3 gap-2 flex">
                  <button
                    className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    aria-label={
                      passwordVisible ? 'Hide password' : 'Show password'
                    }
                  >
                    {passwordVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>

                  {passwordValue &&
                    passwordValue.length >= 8 &&
                    !errors.password && (
                      <CheckCircle className="text-green-500" size={18} />
                    )}
                </div>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  className="text-red-500 text-sm mt-1"
                  aria-live="polite"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Signup button */}
            <button
              className="w-full mt-4 bg-orange-500 text-white p-2 rounded-md hover:bg-orange-600 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed"
              type="submit"
              disabled={isSignupButtonDisabled}
            >
              {isSubmitting ? (
                <div className="flex justify-center">
                  <Loader2 className="animate-spin" size={22} />
                  <span className="ml-2">Signing up...</span>
                </div>
              ) : (
                'Sign Up'
              )}
            </button>

            {/* Server error display */}
            {serverError && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-2"
                role="alert"
                aria-live="assertive"
              >
                <span className="block sm:inline">{serverError}</span>
              </div>
            )}
          </form>
        ) : (
          // OTP verification section
          <div>
            <h2 className="text-xl font-semibold text-center mb-2">
              Email Verification
            </h2>
            <p className="text-center text-gray-600 mb-4">
              Enter the OTP sent to your email
            </p>

            {/* OTP input fields */}
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
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>

            {/* Verify OTP button */}
            <button
              disabled={isVerifyOtpButtonDisabled}
              onClick={verifyOtp}
              className="mt-4 cursor-pointer w-full bg-orange-500 text-white p-2 rounded-md hover:bg-orange-600 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex justify-center">
                  <Loader2 className="animate-spin" size={22} />
                  <span className="ml-2">Verifying...</span>
                </div>
              ) : (
                'Verify OTP'
              )}
            </button>

            {/* Resend OTP section */}
            <div className="flex justify-center mt-4">
              {canResendOtp ? (
                <button
                  onClick={resendOtp}
                  className="text-orange-500 cursor-pointer hover:underline"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Resend OTP'}
                </button>
              ) : (
                <span className="text-gray-500">
                  Resend OTP in {otpTimer} seconds
                </span>
              )}
            </div>

            {/* Server error display */}
            {serverError && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-2"
                role="alert"
                aria-live="assertive"
              >
                <span className="block sm:inline">{serverError}</span>
              </div>
            )}
          </div>
        )}

        {/* Divider with or text */}
        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-gray-500 text-xs font-light">
            OR
          </span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Social login buttons */}
        <div className="flex gap-4 items-center">
          <button
            type="button"
            className="flex items-center justify-center gap-2 w-full mt-4 bg-gray-200 p-2 rounded-md hover:bg-gray-300 transition-colors"
            aria-label="Sign in with Google"
          >
            <GoogleButton className="w-5 h-5" />
            <p className="text-sm font-light">Sign in with Google</p>
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 w-full mt-4 bg-gray-200 p-2 rounded-md hover:bg-gray-300 transition-colors"
            aria-label="Sign in with GitHub"
          >
            <Github className="w-5 h-5" />
            <p className="text-sm font-light">Sign in with GitHub</p>
          </button>
        </div>

        {/* Login link for existing users */}
        <p className="text-gray-500 text-sm text-center mt-4">
          Already registered?{' '}
          <Link className="text-orange-500 text-md" href="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
