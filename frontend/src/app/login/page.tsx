'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { apiClient, API_ENDPOINTS } from '@/lib/api';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'test@test.com',
      password: 'test123'
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, data);

      if (response.data.success) {
        console.log('Login response:', response.data);

        // حفظ الـ tokens في localStorage
        if (response.data.data?.tokens?.accessToken) {
          localStorage.setItem('accessToken', response.data.data.tokens.accessToken);
          console.log('✅ Access token saved');
        }
        if (response.data.data?.tokens?.refreshToken) {
          localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
          console.log('✅ Refresh token saved');
        }

        // حفظ معلومات المستخدم
        if (response.data.data?.user) {
          localStorage.setItem('user', JSON.stringify(response.data.data.user));
          console.log('✅ User data saved');
        }

        toast.success('تم تسجيل الدخول بنجاح!');

        // Redirect to WhatsApp messages page
        setTimeout(() => {
          router.push('/dashboard/whatsapp/messages');
        }, 500);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(
        error.response?.data?.message || 'حدث خطأ أثناء تسجيل الدخول'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          {/* Logo */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              نظام إدارة المؤسسات
            </h1>
            <p className="mt-2 text-gray-600">تسجيل الدخول إلى حسابك</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                البريد الإلكتروني
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="example@company.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                كلمة المرور
              </label>
              <input
                {...register('password')}
                type="password"
                id="password"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ليس لديك حساب؟{' '}
              <a
                href="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                سجل الآن
              </a>
            </p>
          </div>

          {/* Test Credentials */}
          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-700">
              بيانات الاختبار:
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Email: admin@example.com
            </p>
            <p className="text-xs text-gray-600">Password: Admin@1234</p>
          </div>
        </div>
      </div>
    </div>
  );
}

