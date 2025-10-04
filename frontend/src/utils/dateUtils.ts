/**
 * Date Utilities
 * 
 * Helper functions for date formatting and grouping
 */

/**
 * Format date for message grouping
 * Returns "اليوم", "أمس", or formatted date
 */
export const formatMessageDate = (date: string | Date): string => {
  const messageDate = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time to compare dates only
  const resetTime = (d: Date) => {
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const msgDate = resetTime(new Date(messageDate));
  const todayDate = resetTime(new Date(today));
  const yesterdayDate = resetTime(new Date(yesterday));

  if (msgDate.getTime() === todayDate.getTime()) {
    return 'اليوم';
  } else if (msgDate.getTime() === yesterdayDate.getTime()) {
    return 'أمس';
  } else {
    // Format as "DD/MM/YYYY"
    const day = messageDate.getDate().toString().padStart(2, '0');
    const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');
    const year = messageDate.getFullYear();
    return `${day}/${month}/${year}`;
  }
};

/**
 * Group messages by date
 */
export interface MessageGroup {
  date: string;
  messages: any[];
}

export const groupMessagesByDate = (messages: any[]): MessageGroup[] => {
  const groups: { [key: string]: any[] } = {};

  messages.forEach(message => {
    const dateKey = formatMessageDate(message.sentAt);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
  });

  return Object.entries(groups).map(([date, msgs]) => ({
    date,
    messages: msgs,
  }));
};

