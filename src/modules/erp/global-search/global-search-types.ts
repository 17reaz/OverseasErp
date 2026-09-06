export type GlobalSearchResultType = "candidate";

export interface GlobalSearchCandidate {
  id: string;
  sl: number | null;
  passport_no: string;
  name: string;
}

export interface GlobalSearchResult {
  id: string;
  type: GlobalSearchResultType;
  title: string;
  subtitle: string;
  description?: string;
  route: string;
  candidate: GlobalSearchCandidate;
}

export interface GlobalSearchState {
  query: string;
  results: GlobalSearchResult[];
  loading: boolean;
  error: string | null;
}