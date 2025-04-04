import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

type IconName = keyof typeof LucideIcons;

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

export function Icon({ name, ...props }: IconProps) {
  const LucideIcon = LucideIcons[name] as React.ComponentType<LucideProps>;

  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return <LucideIcon {...props} />;
} 