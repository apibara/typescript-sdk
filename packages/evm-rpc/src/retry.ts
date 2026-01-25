export async function retry<T>({
  fn,
  maxAttempts = 3,
  delay = 100,
}: {
  fn: () => Promise<T>;
  maxAttempts?: number;
  delay?: number;
}): Promise<T> {
  let attempts = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) throw error;
      console.warn(`RPC error ${error}. Retrying in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
