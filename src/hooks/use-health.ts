import { useQuery } from '@tanstack/react-query';

interface HealthResponse {
  status: string;
  time: string;
}

const HEALTH_KEY = ['health'] as const;

async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch('https://api.github.com/zen');
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return { status: 'ok', time: new Date().toLocaleTimeString() };
}

export function useHealth() {
  return useQuery({ queryKey: HEALTH_KEY, queryFn: fetchHealth });
}
