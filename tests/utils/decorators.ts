import { test } from '@playwright/test';

export function step(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Если декоратор применён не к методу (например, к полю) — игнорируем
    if (!descriptor || typeof descriptor.value !== 'function') {
      return descriptor;
    }

    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const stepName = name || `${target.constructor.name}.${propertyKey}`;
      return await test.step(stepName, async () => {
        return await originalMethod.apply(this, args);
      });
    };
    return descriptor;
  };
}