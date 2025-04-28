export type Task = {
  id: string;
  title: string;
  columnId: 'done' | 'voice_over' | 'creation'; // Add new stages
  userPrompt?: string;
  generatedScript?: string;
  scheduledDate?: string;
  deadline?: string;
};