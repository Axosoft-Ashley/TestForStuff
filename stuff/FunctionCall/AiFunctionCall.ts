// @ts-nocheck
import { MakeError } from '@axosoft/gk-service';
import {
  FunctionCallingConfigMode,
  GoogleGenAI
} from '@google/genai';
import { Octokit } from '@octokit/core';
import FunctionAssistedQuery, { GetFileContent, regex, SystemPrompt } from '../functionAssistedQuery';


export function createFilterForAi(
  value: string
): AiMatcherFilterFunction {
  const parsedValue = JSON.parse(value);
  const ai = new GoogleGenAI({ apiKey: parsedValue.apiKey });
  const github = new Octokit({
    auth: parsedValue.githubApiKey
  });
  return async (data: Parameters<AiMatcherFilterFunction>[0]): ReturnType<AiMatcherFilterFunction> => {
    try {
      const query = new FunctionAssistedQuery(SystemPrompt, FunctionCallingConfigMode.AUTO, ai, github, {
        owner: data.owner,
        repo: data.repoName,
        baseSha: data.baseSha
      });

      const response = await query.processQuery({
        parts: [
          {
            text: JSON.stringify({
              query: parsedValue.prompt,
              changes: data.fileChanges
            })
          }
        ]
      });

      let responseText = '';
      response.flatMap(({ parts }) => {
        if (!parts || !Array.isArray(parts)) {
          return;
        }
        parts.forEach((part) => {
          if (part.text) {
            responseText += part.text;
          }
        });
      });

      // eslint-disable-next-line no-cond-assign
      const match = regex.exec(responseText);
      if (match === null) {
        return {
          isTrue: false,
          conditionMetadata: {
            why: 'No valid JSON response found'
          }
        };
      }

      const jsonStr = match[1];

      const {
        result,
        reason
      } = JSON.parse(jsonStr);

      return {
        isTrue: result,
        conditionMetadata: {
          why: reason
        }
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error calling Gemini API:', error);
      throw MakeError.internalServerError('Failed to process AI filter');
    }
  };
}
