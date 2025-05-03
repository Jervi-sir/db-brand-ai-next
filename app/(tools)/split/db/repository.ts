// db/repository.ts
import { db } from '@/lib/db/queries';
import { content } from '@/lib/db/schema';
import { SaveRequest, SavedContent } from '../type';

export class ContentRepository {
  async saveContent(data: SaveRequest & { userId: string }): Promise<SavedContent> {
    const [newContent] = await db
      .insert(content)
      .values({
        userId: data.userId,
        title: data.title,
        userPrompt: data.userPrompt,
        topicPrompt: data.topicPrompt,
        content_idea: data.content_idea,
        hook_type: data.hook_type,
        mood: data.mood,
        generatedScript: data.generatedScript,
        stage: data.stage,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return {
      id: newContent.id,
      userId: newContent.userId,
      title: newContent.title,
      userPrompt: newContent.userPrompt,
      topicPrompt: newContent.topicPrompt || '',
      content_idea: newContent.content_idea || '',
      hook_type: newContent.hook_type || '',
      mood: newContent.mood,
      generatedScript: newContent.generatedScript,
      stage: newContent.stage,
    };
  }

  async batchSaveContent(data: Array<SaveRequest & { userId: string }>): Promise<SavedContent[]> {
    const results = await db
      .insert(content)
      .values(
        data.map((item) => ({
          userId: item.userId,
          title: item.title,
          userPrompt: item.userPrompt,
          topicPrompt: item.topicPrompt,
          content_idea: item.content_idea,
          hook_type: item.hook_type,
          mood: item.mood,
          generatedScript: item.generatedScript,
          stage: item.stage,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      )
      .returning();

    return results.map((item) => ({
      id: item.id,
      userId: item.userId,
      title: item.title,
      userPrompt: item.userPrompt,
      topicPrompt: item.topicPrompt || '',
      content_idea: item.content_idea || '',
      hook_type: item.hook_type || '',
      mood: item.mood,
      generatedScript: item.generatedScript,
      stage: item.stage,
    }));
  }
}