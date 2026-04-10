import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn, getInitials } from '@/lib/utils';

interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

function Avatar({ src, alt = '', fallback, size = 'md', className, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn('relative flex shrink-0 overflow-hidden rounded-full', sizeClasses[size], className)}
      {...props}
    >
      <AvatarPrimitive.Image className="aspect-square h-full w-full object-cover" src={src ?? undefined} alt={alt} />
      <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-primary-100 text-primary-700 font-medium">
        {fallback ?? getInitials(alt)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

export { Avatar };
