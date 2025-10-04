/**
 * Loading Skeleton Components
 * 
 * Reusable skeleton components for better perceived performance
 */

import React from 'react';

/**
 * Message Skeleton
 */
export const MessageSkeleton: React.FC<{ isOutbound?: boolean }> = ({ isOutbound = false }) => {
  return (
    <div className={`mb-4 flex ${isOutbound ? 'justify-end' : 'justify-start'} animate-pulse`}>
      <div className={`max-w-md px-4 py-2 rounded-lg ${isOutbound ? 'bg-gray-300' : 'bg-gray-200'}`}>
        <div className="h-4 bg-gray-400 rounded w-48 mb-2"></div>
        <div className="h-3 bg-gray-400 rounded w-24"></div>
      </div>
    </div>
  );
};

/**
 * Contact Skeleton
 */
export const ContactSkeleton: React.FC = () => {
  return (
    <div className="p-3 border-b border-gray-200 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Messages List Skeleton
 */
export const MessagesListSkeleton: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
      <MessageSkeleton isOutbound={false} />
      <MessageSkeleton isOutbound={true} />
      <MessageSkeleton isOutbound={false} />
      <MessageSkeleton isOutbound={true} />
      <MessageSkeleton isOutbound={false} />
    </div>
  );
};

/**
 * Contacts List Skeleton
 */
export const ContactsListSkeleton: React.FC = () => {
  return (
    <div>
      <ContactSkeleton />
      <ContactSkeleton />
      <ContactSkeleton />
      <ContactSkeleton />
      <ContactSkeleton />
    </div>
  );
};

