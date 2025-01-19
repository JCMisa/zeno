import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.85,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
];

export const chatSession = model.startChat({
  generationConfig,
  safetySettings,
  history: [
    {
      role: "user",
      parts: [
        {
          text: 'existing code: console.log("Hello Wo), if there is an existing code, help to debug or improve it further. Answer the question of the user which is: Why am I getting an error, wht is wrong with my code?. Provide a answer based on the question or a personalized suggestion based on the existing code if any. Provide a code snippet if necessary to help. Generate the response in html format without the DOCTYPE, html, head, title, meta, and body tags, only the content.',
        },
      ],
    },
    {
      role: "model",
      parts: [
        {
          text: '```html\n<p>The error you\'re getting is because of a syntax error in your <code>console.log</code> statement.  You have an unmatched parenthesis.</p>\n\n<p>Your code: <code>console.log("Hello Wo)</code></p>\n\n<p>The problem is the closing parenthesis `)` at the end.  It should be `")"` to correctly close the string literal. </p>\n\n<p>Here\'s the corrected code:</p>\n\n<pre><code class="language-javascript">console.log("Hello World");</code></pre>\n\n<p>Always double-check your parentheses, quotes, and brackets to ensure they\'re correctly paired.  This is a very common source of syntax errors in programming.</p>\n```\n',
        },
      ],
    },
  ],
});
