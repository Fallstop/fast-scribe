import { OpenAI } from "openai";
import { config } from "dotenv";
import { env } from "process";

try {
  config();
} catch (ex) {}

const openai = new OpenAI({
  apiKey: env.OPEN_AI_KEY,
});

const available: { sentences: string[][] }[] = [];

const generateSentence = async () =>
  await openai.chat.completions
    .create({
      messages: [
        {
          role: "user",
          content:
            "Please fill out the list of sentences." +
            " Make sure that each sentence array contains strings with exactly one word." +
            " The sentences should be difficult and use words not commonly used in everyday speach" +
            " There should be at least 5 sentences." +
            " The sentences should be arranged in increasing complexity, starting off with sentences that would be rear in everyday communication but not unheard of",
        },
      ],
      model: "gpt-4.1-nano",
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "nested_sentences",
          strict: true,
          schema: {
            type: "object",
            properties: {
              sentences: {
                type: "array",
                description:
                  "A list of sentences, where each sentence is an array of words.",
                minLength: 5,
                maxLength: 15,
                items: {
                  type: "array",
                  description: "A sentence, represented as an array of words.",
                  minLength: 5,
                  maxLength: 15,
                  items: {
                    type: "string",
                    description: "A single word in the sentence.",
                    minLength: 1,
                  },
                },
              },
            },
            required: ["sentences"],
            additionalProperties: false,
          },
        },
      },
      temperature: 0,
      top_p: 1,
      max_completion_tokens: 2048 * 3,
    })
    .then(
      (res) =>
        JSON.parse(res.choices[0].message.content!) as {
          sentences: string[][];
        },
    );

export const getSentences = async () => {
  const sentences = available.pop();

  if (sentences) {
    generateSentence().then((result) => available.push(result));
  }

  return sentences ?? (await generateSentence());
};

for (let i = 0; i < 20; i++) {
  generateSentence()
    .then((result) => available.push(result))
    .catch(console.error);
}
