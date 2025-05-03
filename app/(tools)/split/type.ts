// type.ts
export interface Script {
  subtitle: string;
  content: string;
}

export interface GenerateScriptsRequest {
  userPrompt: string;
  topicPrompt?: string;
  content_idea: string;
  hook_type: string;
}

export interface GenerateScriptsResponse {
  title?: string;
  scripts: Script[];
  usedModelId?: string | null;
  tokenUsage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface SaveRequest {
  title: string;
  userPrompt: string;
  topicPrompt?: string;
  content_idea?: string;
  hook_type?: string;
  mood: string;
  generatedScript: string;
  stage: string;
}

export interface SavedContent {
  id: string;
  userId: string;
  title: string;
  userPrompt: string;
  topicPrompt?: string;
  content_idea?: string;
  hook_type?: string;
  mood: string;
  generatedScript: string;
  stage: string;
}

export interface FormData {
  userPrompt: string;
  topicPrompt?: string;
  content_idea: string;
  hook_type: string;
}