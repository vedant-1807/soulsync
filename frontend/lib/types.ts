export interface AgentPanel {
  agent_used:       string;
  sources:          string[];
  confidence:       number;
  retrieval_method: string;
}

export interface Message {
  id:        string;
  role:      "user" | "assistant";
  content:   string;
  panel?:    AgentPanel;
  timestamp: string;   // ISO-8601 string — safe for JSON / localStorage
}

export interface ChatSession {
  id:        string;
  title:     string;
  messages:  Message[];
  createdAt: string;   // ISO-8601 string
  updatedAt: string;   // ISO-8601 string
}

export interface ChatResponse {
  answer:     string;
  session_id: string;
  panel:      AgentPanel;
}

export interface MoodPoint {
  timestamp: string;
  score:     number;
  emotion:   string;
  note:      string;
}
