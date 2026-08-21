import { useQuery } from '@tanstack/react-query';

import { httpClient } from '@/lib/http-client';

interface HealthResponse {
  status: string;
  time: string;
}

const HEALTH_KEY = ['health'] as const;

async function fetchHealth(): Promise<HealthResponse> {
  await httpClient.get<string>('https://api.github.com/zen');
  return { status: 'ok', time: new Date().toLocaleTimeString() };
}

export function useHealth() {
  return useQuery({ queryKey: HEALTH_KEY, queryFn: fetchHealth });
}
