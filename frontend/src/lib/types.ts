export type BotMessage = {
  id: number;
  telegram_user_id: number;
  username: string | null;
  chat_id: number | null;
  message_type: string;
  text: string;
  event_id: number | null;
  event_type: string | null;
  sent_at: string;
};

export type MessageListResponse = {
  items: BotMessage[];
  total: number;
};

export type EventTypeStats = {
  event_type: string;
  total: number;
  converted: number;
  conversion_rate: number;
  last_occurred_at: string | null;
};

export type MessageTemplate = {
  id: number;
  key: string;
  title: string;
  text: string;
  event_type: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TemplateInput = {
  key: string;
  title: string;
  text: string;
  event_type: string | null;
  is_active: boolean;
};

export type TemplateListResponse = {
  items: MessageTemplate[];
  total: number;
};
