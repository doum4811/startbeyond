import { lazy, Suspense } from 'react';
import type { ComponentType, ComponentProps } from 'react';

interface DynamicProps<T extends ComponentType<any>> {
  loader: () => Promise<{ default: T }>;
  fallback?: React.ReactNode;
  componentProps?: ComponentProps<T>;
}

export function Dynamic<T extends ComponentType<any>>({
  loader,
  fallback = null,
  componentProps,
}: DynamicProps<T>) {
  const LazyComponent = lazy(loader);

  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...(componentProps as any)} />
    </Suspense>
  );
} 