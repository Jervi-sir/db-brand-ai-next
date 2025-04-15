import { PromptHistoryTable } from "./prompt-history-table";

export default function PromptHistoryPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Prompt History</h1>
      <PromptHistoryTable />
    </div>
  );
}