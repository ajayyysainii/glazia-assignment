const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "/api";

/**
 * Is the API answering?
 *
 * A sleeping host answers from its own edge while the instance boots, so a
 * non-2xx (502/503) means "not ready yet" just as much as a thrown request
 * does — both are reported as false rather than distinguished.
 */
export async function pingHealth(timeoutMs = 5000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}/health`, {
      method: "GET",
      signal: controller.signal,
      // A cached 200 would make a sleeping server look awake.
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
