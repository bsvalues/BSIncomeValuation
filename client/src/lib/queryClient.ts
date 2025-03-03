import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  methodOrUrl: string,
  urlOrOptions?: string | RequestInit,
  maybeOptions?: RequestInit,
): Promise<T> {
  let method: string;
  let url: string;
  let options: RequestInit | undefined;

  // Handle different calling patterns
  if (typeof urlOrOptions === 'string') {
    // New pattern: apiRequest('GET', '/api/users', {})
    method = methodOrUrl;
    url = urlOrOptions;
    options = maybeOptions;
  } else {
    // Old pattern: apiRequest('/api/users', {})
    method = 'GET';
    url = methodOrUrl;
    options = urlOrOptions;
  }

  const res = await fetch(url, {
    method,
    headers: { 
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    },
    credentials: 'include',
    ...options,
  });

  await throwIfResNotOk(res);
  return await res.json() as T;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
