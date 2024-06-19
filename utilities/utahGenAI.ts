// utilities/utahGenAI.ts

import { openaiApiKey } from '@/constants/env';

export interface StatusCheckResult {
  item: string;
  description: string;
  fiscalYear: string;
  amount: number;
  classification: 'NOT MET' | 'ON TRACK' | 'MET';
  additionalInfo?: string;
}

interface PromptContent {
  items: string[];
  results: string[];
}

export const generateOpenAIPrompt = async (content: PromptContent): Promise<string> => {
  const { items, results } = content;

  const promptContent = `
    Governance Analytics:
    Analyze the following items and provide insights regarding their statuses.

    Items:
    ${items.map(item => `- ${item}`).join('\n')}
  
    Results:
    ${results.map((result, index) => `Result ${index + 1}: ${result}`).join('\n')}

    Please provide detailed analysis and classify each item as 'NOT MET', 'ON TRACK', or 'MET' based on the results.
  `;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: promptContent }],
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const responseData = await response.json();
    const generatedPrompt = responseData?.choices?.[0]?.message?.content || '';

    return generatedPrompt;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
};

export const processStatusCheck = async (
  data: StatusCheckResult[],
  criteria: { [key: string]: string }
): Promise<StatusCheckResult[]> => {
  try {
    const updatedResults: StatusCheckResult[] = data.map(result => {
      let classification: 'NOT MET' | 'ON TRACK' | 'MET' = 'ON TRACK';

      // Check if the description matches any criteria for classification
      if (result.description.toLowerCase().includes(criteria['NOT MET'].toLowerCase())) {
        classification = 'NOT MET';
      } else if (result.description.toLowerCase().includes(criteria['MET'].toLowerCase())) {
        classification = 'MET';
      }

      return { ...result, classification };
    });

    return updatedResults;
  } catch (error) {
    console.error('Error processing status check:', error);
    throw error;
  }
};
