export type Placeholder = {
  content: string; // e.g., "$1"
  example: string; // e.g., "https://developer.mozilla.org"
};

export type Message = {
  message: string;
  description: string;
  not_found?: boolean;
  placeholders?: {
    [placeholder_name: string]: Placeholder;
  };
};

export type Messages = {
  [message_key: string]: Message;
};
