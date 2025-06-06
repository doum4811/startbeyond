export interface UICategory {
  code: string;
  label: string;
  icon: string;
  color?: string;
  isCustom: boolean;
  isActive: boolean;
  hasDuration: boolean;
  sort_order?: number;
}

export type LoaderFunctionArgs = {
  request: Request;
  params: Record<string, string>;
}; 