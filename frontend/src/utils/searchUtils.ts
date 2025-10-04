/**
 * Search Utilities
 * 
 * Helper functions for searching and highlighting text
 */

/**
 * Highlight search query in text
 */
export const highlightText = (text: string, query: string): string => {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 text-gray-900">$1</mark>');
};

/**
 * Get highlighted HTML
 */
export const getHighlightedHTML = (text: string, query: string): { __html: string } => {
  return { __html: highlightText(text, query) };
};

/**
 * Search in messages
 */
export const searchMessages = (messages: any[], query: string): any[] => {
  if (!query.trim()) return messages;
  
  const lowerQuery = query.toLowerCase();
  
  return messages.filter(msg => {
    const content = typeof msg.content === 'string'
      ? msg.content
      : msg.content?.text || '';
    
    return content.toLowerCase().includes(lowerQuery);
  });
};

/**
 * Count search results
 */
export const countSearchResults = (messages: any[], query: string): number => {
  return searchMessages(messages, query).length;
};

