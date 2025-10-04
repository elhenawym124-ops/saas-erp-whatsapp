import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '💬 الدردشة - WhatsApp',
  description: 'إرسال واستقبال رسائل WhatsApp',
};

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

