import { $, type QRL } from '@builder.io/qwik';
import type { MaybeValue } from './types';

type Value = MaybeValue<string>;

/**
 * Creates a validation functions that validates a URL.
 *
 * @param error The error message.
 *
 * @returns A validation function.
 */
export function url(error: string): QRL<(value: Value) => string> {
  return $((value: Value) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      value && new URL(value);
      return '';
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      return error;
    }
  });
}
