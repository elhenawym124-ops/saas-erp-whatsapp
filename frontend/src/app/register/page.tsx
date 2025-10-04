'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import axios from 'axios';

const registerSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z
    .string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'يجب أن تحتوي على حرف كبير وصغير ورقم'),
  phone: z.string().regex(/^\d{10,15}$/, 'رقم الهاتف غير صحيح'),
  firstName: z.string().min(2, 'الاسم الأول مطلوب'),
  lastName: z.string().min(2, 'اسم العائلة مطلوب'),
  organizationName: z.string().min(2, 'اسم المؤسسة مطلوب'),
  organizationDomain: z
    .string()
    .min(3, 'نطاق المؤسسة مطلوب')
    .regex(/^[a-z0-9-]+$/, 'يجب أن يحتوي على أحرف صغيرة وأرقام فقط'),
  organizationEmail: z.string().email('البريد الإلكتروني غير صحيح'),
  organizationPhone: z.string().regex(/^\d{10,15}$/, 'رقم الهاتف غير صحيح'),
  employeeId: z.string().min(3, 'رقم الموظف مطلوب'),
  department: z.string().min(2, 'القسم مطلوب'),
  position: z.string().min(2, 'المنصب مطلوب'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      const payload = {
        email: data.email,
        password: data.password,
        phone: data.phone,
        personalInfo: {
          firstName: data.firstName,
          lastName: data.lastName,
        },
        organizationData: {
          name: data.organizationName,
          domain: data.organizationDomain,
          industry: 'technology',
          size: '10-50',
          contactInfo: {
            email: data.organizationEmail,
            phone: data.organizationPhone,
          },
        },
        workInfo: {
          employeeId: data.employeeId,
          department: data.department,
          position: data.position,
        },
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        payload
      );

      if (response.data.success) {
        // Save token
        localStorage.setItem('accessToken', response.data.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));

        toast.success('تم التسجيل بنجاح!');
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              إنشاء حساب جديد
            </h1>
            <p className="mt-2 text-gray-600">
              سجل الآن للبدء في استخدام نظام إدارة المؤسسات
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Info */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                المعلومات الشخصية
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    الاسم الأول
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أحمد"
                    disabled={isLoading}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    اسم العائلة
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="محمد"
                    disabled={isLoading}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    البريد الإلكتروني
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ahmed@example.com"
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    رقم الهاتف
                  </label>
                  <input
                    {...register('phone')}
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1234567890"
                    disabled={isLoading}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    كلمة المرور
                  </label>
                  <input
                    {...register('password')}
                    type="password"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Organization Info */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                معلومات المؤسسة
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    اسم المؤسسة
                  </label>
                  <input
                    {...register('organizationName')}
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="شركتي"
                    disabled={isLoading}
                  />
                  {errors.organizationName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.organizationName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    نطاق المؤسسة
                  </label>
                  <input
                    {...register('organizationDomain')}
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="my-company"
                    disabled={isLoading}
                  />
                  {errors.organizationDomain && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.organizationDomain.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    بريد المؤسسة
                  </label>
                  <input
                    {...register('organizationEmail')}
                    type="email"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="info@company.com"
                    disabled={isLoading}
                  />
                  {errors.organizationEmail && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.organizationEmail.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    هاتف المؤسسة
                  </label>
                  <input
                    {...register('organizationPhone')}
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1234567890"
                    disabled={isLoading}
                  />
                  {errors.organizationPhone && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.organizationPhone.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Work Info */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                معلومات العمل
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    رقم الموظف
                  </label>
                  <input
                    {...register('employeeId')}
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="EMP001"
                    disabled={isLoading}
                  />
                  {errors.employeeId && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.employeeId.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    القسم
                  </label>
                  <input
                    {...register('department')}
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="IT"
                    disabled={isLoading}
                  />
                  {errors.department && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.department.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    المنصب
                  </label>
                  <input
                    {...register('position')}
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="مدير"
                    disabled={isLoading}
                  />
                  {errors.position && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.position.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              لديك حساب بالفعل؟{' '}
              <a
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                سجل الدخول
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

