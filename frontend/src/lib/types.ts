export type EventTypeStats = {
  event_type: string;
  total: number;
  converted: number;
  conversion_rate: number;
  last_occurred_at: string | null;
};

export type TemplateTypeItem = {
  key: string;
  label: string;
  created_at: string;
};

export type MessageTemplate = {
  id: number;
  key: string;
  title: string;
  text: string;
  event_type: string | null;
  template_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TemplateInput = {
  key: string;
  title: string;
  text: string;
  event_type: string | null;
  template_type: string;
  is_active: boolean;
};

export type TemplateListResponse = {
  items: MessageTemplate[];
  total: number;
};
