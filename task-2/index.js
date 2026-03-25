import dotenv from 'dotenv';
import promptSync from 'prompt-sync';

dotenv.config({ path: './.env' });

const prompt = promptSync({ sigint: true });

console.log('ENV token =', process.env.GITHUB_TOKEN);
// ANSI colors for terminal
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function parseJsonFromModel(content) {
  if (typeof content !== "string") {
    throw new Error("Model content is not a string");
  }

  let cleaned = content.trim();

  // remove ```json ... ```
  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error("Could not parse JSON from model response:\n" + cleaned);
  }
}

function validateQuestions(questions) {
  if (!Array.isArray(questions)) {
    throw new Error("Model did not return an array");
  }

  if (questions.length !== 10) {
    throw new Error("Model did not return exactly 10 questions");
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    if (!q || typeof q !== "object") {
      throw new Error(`Question ${i + 1} is not an object`);
    }

    if (typeof q.question !== "string" || q.question.trim() === "") {
      throw new Error(`Question ${i + 1} has no valid question text`);
    }

    if (!Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error(`Question ${i + 1} must have exactly 4 options`);
    }

    for (let j = 0; j < q.options.length; j++) {
      if (typeof q.options[j] !== "string" || q.options[j].trim() === "") {
        throw new Error(`Question ${i + 1}, option ${j + 1} is invalid`);
      }
    }

    if (
      typeof q.answerIndex !== "number" ||
      !Number.isInteger(q.answerIndex) ||
      q.answerIndex < 0 ||
      q.answerIndex > 3
    ) {
      throw new Error(`Question ${i + 1} has invalid answerIndex`);
    }
  }
}

async function getQuestions(topic) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("GITHUB_TOKEN is missing in .env");
  }

  if (typeof fetch !== "function") {
    throw new Error("fetch is not available. Use Node 18+ or newer.");
  }

  const requestBody = {
  model: "openai/gpt-4.1-mini",
  messages: [
    {
      role: "user",
      content:
        `Create exactly 10 multiple choice quiz questions about "${topic}". ` +
        `Return ONLY valid JSON. No markdown. No explanation. ` +
        `[{"question":"...","options":["...","...","...","..."],"answerIndex":0}]`,
    },
  ],
  temperature: 0.7,
};
  const response = await fetch(
    "https://models.github.ai/inference/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Model returned empty content");
  }

  const questions = parseJsonFromModel(content);
  validateQuestions(questions);

  return questions;
}

async function startQuiz() {
  try {
    console.log(CYAN + "Welcome to the AI Quiz Game!" + RESET);

    let topic = prompt("Choose a topic: ").trim();
    if (!topic) {
      topic = "general knowledge";
    }

    console.log(YELLOW + "\nGenerating 10 questions...\n" + RESET);

    const questions = await getQuestions(topic);

    let score = 0;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      console.log(CYAN + `Question ${i + 1}/10` + RESET);
      console.log(q.question);

      for (let j = 0; j < q.options.length; j++) {
        console.log(`${j + 1}. ${q.options[j]}`);
      }

      let answer = prompt("Your answer (1-4): ").trim();

      while (!["1", "2", "3", "4"].includes(answer)) {
        answer = prompt("Please type 1, 2, 3, or 4: ").trim();
      }

      const userIndex = Number(answer) - 1;

      if (userIndex === q.answerIndex) {
        score++;
        console.log(GREEN + "Correct! +1 point\n" + RESET);
      } else {
        console.log(
          RED +
            `Wrong! Correct answer: ${q.answerIndex + 1}. ${q.options[q.answerIndex]}\n` +
            RESET,
        );
      }
    }

    console.log(YELLOW + `Final score: ${score}/10` + RESET);
  } catch (error) {
    console.error(RED + "Error: " + error.message + RESET);
  }
}

startQuiz();
