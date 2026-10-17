export interface PageParams {
  page: number;      // 1-based
  pageSize: number;
  search?: string;
}

export interface Paginated<T> {
  data: T[];
  count: number;
}

export interface Option<V extends string = string> {
  value: V;
  label: string;
}
