/**
 * Creates a debounced version of the given function.
 * The debounced function delays invoking `fn` until after
 * `delay` milliseconds have elapsed since the last invocation.
 *
 * @param fn    - The function to debounce.
 * @param delay - The delay in milliseconds.
 * @returns A debounced version of `fn`.
 *
 * @example
 * const debouncedSetUrl = debounce((url: string) => setUrl(url), 500)
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
