import React from 'react';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-12 h-12 text-base',
};

const colorClasses = {
  blue: 'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  purple: 'bg-purple-500 text-white',
  orange: 'bg-orange-500 text-white',
  red: 'bg-red-500 text-white',
  gray: 'bg-gray-400 text-white',
};

export const Avatar: React.FC<AvatarProps> = ({
  name = '?',
  src,
  size = 'md',
  color = 'blue',
  className = '',
}) => {
  const initial = name ? name[0].toUpperCase() : '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full flex items-center justify-center font-bold ${className}`}
    >
      {initial}
    </div>
  );
};

export default Avatar;

