import {
  formatMessageDate,
  groupMessagesByDate,
  MessageGroup,
} from '@/utils/dateUtils';

describe('dateUtils', () => {
  describe('formatMessageDate', () => {
    beforeEach(() => {
      // Mock current date to 2025-10-03 12:00:00
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-10-03T12:00:00'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return "اليوم" for today\'s date', () => {
      const today = new Date('2025-10-03T10:30:00');
      const result = formatMessageDate(today);
      
      expect(result).toBe('اليوم');
    });

    it('should return "اليوم" for today at different times', () => {
      const morning = new Date('2025-10-03T08:00:00');
      const evening = new Date('2025-10-03T20:00:00');
      
      expect(formatMessageDate(morning)).toBe('اليوم');
      expect(formatMessageDate(evening)).toBe('اليوم');
    });

    it('should return "أمس" for yesterday\'s date', () => {
      const yesterday = new Date('2025-10-02T15:30:00');
      const result = formatMessageDate(yesterday);
      
      expect(result).toBe('أمس');
    });

    it('should return formatted date for older dates', () => {
      const oldDate = new Date('2025-09-15T10:00:00');
      const result = formatMessageDate(oldDate);
      
      expect(result).toBe('15/09/2025');
    });

    it('should handle string dates', () => {
      const dateString = '2025-10-03T10:00:00';
      const result = formatMessageDate(dateString);
      
      expect(result).toBe('اليوم');
    });

    it('should format single digit days and months with leading zeros', () => {
      const date = new Date('2025-01-05T10:00:00');
      const result = formatMessageDate(date);
      
      expect(result).toBe('05/01/2025');
    });

    it('should handle dates from different years', () => {
      const lastYear = new Date('2024-12-25T10:00:00');
      const result = formatMessageDate(lastYear);
      
      expect(result).toBe('25/12/2024');
    });

    it('should handle edge case: midnight today', () => {
      const midnight = new Date('2025-10-03T00:00:00');
      const result = formatMessageDate(midnight);
      
      expect(result).toBe('اليوم');
    });

    it('should handle edge case: just before midnight today', () => {
      const beforeMidnight = new Date('2025-10-03T23:59:59');
      const result = formatMessageDate(beforeMidnight);
      
      expect(result).toBe('اليوم');
    });

    it('should handle edge case: midnight yesterday', () => {
      const midnightYesterday = new Date('2025-10-02T00:00:00');
      const result = formatMessageDate(midnightYesterday);
      
      expect(result).toBe('أمس');
    });
  });

  describe('groupMessagesByDate', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-10-03T12:00:00'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should group messages by date', () => {
      const messages = [
        { id: 1, content: 'Message 1', sentAt: '2025-10-03T10:00:00' },
        { id: 2, content: 'Message 2', sentAt: '2025-10-03T11:00:00' },
        { id: 3, content: 'Message 3', sentAt: '2025-10-02T10:00:00' },
        { id: 4, content: 'Message 4', sentAt: '2025-09-15T10:00:00' },
      ];

      const result = groupMessagesByDate(messages);

      expect(result).toHaveLength(3);
      
      // Find groups by date label
      const todayGroup = result.find(g => g.date === 'اليوم');
      const yesterdayGroup = result.find(g => g.date === 'أمس');
      const oldGroup = result.find(g => g.date === '15/09/2025');

      expect(todayGroup?.messages).toHaveLength(2);
      expect(yesterdayGroup?.messages).toHaveLength(1);
      expect(oldGroup?.messages).toHaveLength(1);
    });

    it('should return empty array for empty messages', () => {
      const messages: any[] = [];
      const result = groupMessagesByDate(messages);

      expect(result).toHaveLength(0);
    });

    it('should handle single message', () => {
      const messages = [
        { id: 1, content: 'Message 1', sentAt: '2025-10-03T10:00:00' },
      ];

      const result = groupMessagesByDate(messages);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('اليوم');
      expect(result[0].messages).toHaveLength(1);
    });

    it('should group all messages from same day together', () => {
      const messages = [
        { id: 1, content: 'Message 1', sentAt: '2025-10-03T08:00:00' },
        { id: 2, content: 'Message 2', sentAt: '2025-10-03T12:00:00' },
        { id: 3, content: 'Message 3', sentAt: '2025-10-03T18:00:00' },
        { id: 4, content: 'Message 4', sentAt: '2025-10-03T23:00:00' },
      ];

      const result = groupMessagesByDate(messages);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('اليوم');
      expect(result[0].messages).toHaveLength(4);
    });

    it('should preserve message order within groups', () => {
      const messages = [
        { id: 1, content: 'First', sentAt: '2025-10-03T10:00:00' },
        { id: 2, content: 'Second', sentAt: '2025-10-03T11:00:00' },
        { id: 3, content: 'Third', sentAt: '2025-10-03T12:00:00' },
      ];

      const result = groupMessagesByDate(messages);

      expect(result[0].messages[0].id).toBe(1);
      expect(result[0].messages[1].id).toBe(2);
      expect(result[0].messages[2].id).toBe(3);
    });

    it('should handle messages from multiple different dates', () => {
      const messages = [
        { id: 1, sentAt: '2025-10-03T10:00:00' }, // Today
        { id: 2, sentAt: '2025-10-02T10:00:00' }, // Yesterday
        { id: 3, sentAt: '2025-09-15T10:00:00' }, // Old date 1
        { id: 4, sentAt: '2025-08-20T10:00:00' }, // Old date 2
        { id: 5, sentAt: '2025-10-03T15:00:00' }, // Today again
      ];

      const result = groupMessagesByDate(messages);

      expect(result).toHaveLength(4);
      
      const todayGroup = result.find(g => g.date === 'اليوم');
      expect(todayGroup?.messages).toHaveLength(2);
    });

    it('should return MessageGroup type with correct structure', () => {
      const messages = [
        { id: 1, content: 'Test', sentAt: '2025-10-03T10:00:00' },
      ];

      const result: MessageGroup[] = groupMessagesByDate(messages);

      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('messages');
      expect(typeof result[0].date).toBe('string');
      expect(Array.isArray(result[0].messages)).toBe(true);
    });

    it('should handle messages with different date formats', () => {
      const messages = [
        { id: 1, sentAt: new Date('2025-10-03T10:00:00') },
        { id: 2, sentAt: '2025-10-03T11:00:00' },
      ];

      const result = groupMessagesByDate(messages);

      expect(result).toHaveLength(1);
      expect(result[0].messages).toHaveLength(2);
    });
  });
});

