export type Property = {
  id?: number;
  apn: string;
  description?: string | null;
  created_at?: string;
};

export type CreatePropertyInput = {
  apn: string;
  description?: string | null;
};