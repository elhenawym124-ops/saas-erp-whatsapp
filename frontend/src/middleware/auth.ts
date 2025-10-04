/**
 * Authentication Middleware
 * التحقق من صلاحية المستخدم
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook للتحقق من تسجيل الدخول
 */
export const useAuth = (redirectTo: string = '/login') => {
  const router = useRouter();

  useEffect(() => {
    // التحقق من وجود token
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      // إذا لم يكن هناك token، إعادة التوجيه لصفحة تسجيل الدخول
      router.push(redirectTo);
    }
  }, [router, redirectTo]);
};

/**
 * التحقق من وجود token
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const token = localStorage.getItem('accessToken');
  return !!token;
};

/**
 * الحصول على معلومات المستخدم
 */
export const getUser = (): any => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    return null;
  }
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * تسجيل الخروج
 */
export const logout = () => {
  if (typeof window === 'undefined') {
    return;
  }
  
  // حذف جميع البيانات
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // إعادة التوجيه لصفحة تسجيل الدخول
  window.location.href = '/login';
};

