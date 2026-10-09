# cn_exam

Practice app for the Computer Networks final at UBB. About 670 questions from the Moodle exam bank.

Live: https://cn-exam-sand.vercel.app

Some marked answers are probably wrong. If you find one, report it or fix it (see below).

## Modes

- **Practice**: all questions, shuffled, feedback after each answer.
- **Exam**: N random questions (default 30), optional countdown timer, no feedback until you finish, then a full review.
- **Mistakes**: questions you got wrong last time and have not answered right since.
- **Unseen**: questions you have never answered.

Answer options are shuffled every session. Progress (per question: times seen, last result) and the current session are kept in your browser's localStorage, so a reload resumes where you left off. Settings has a reset button.

Optional: paste your own Gemini API key in settings to get an "explain" button after answering. The key stays in your browser and is only sent to Google when you click it.

## Keyboard

| key | action |
| --- | --- |
| `1`-`9` | toggle option a-i |
| `enter` | submit, then next |
| `up` / `down` | move focus between options |
| `space` | toggle the focused option |
| `left` / `right` | previous / next question |
| `cmd k` / `ctrl k` | search all questions and see their answers |
| `?` | shortcut sheet |
| `esc` | close dialogs |

## Fixing a wrong answer

All questions live in `public/questions.json`:

```json
{
  "question": "How many bits of zero does the following netmask have? 255.255.255.248",
  "answers": ["3", "4", "8", "2"],
  "correct": "a"
}
```

- `correct` is the letter(s) of the right options in the original order (`"a"`, `"bc"`).
- Free-text questions have `"answers": []` and the expected text in `correct`. Matching ignores case, extra spaces and spaces around commas.
- Optional `image` (path under `public/`) and `correction` (note shown after answering).

Edit the file and open a PR. Or use the "wrong answer in the dataset?" link on any question to open an issue.

## Run locally

```bash
pnpm i && pnpm dev
```

`pnpm test` runs the grading tests, `pnpm build` makes the production build.

## Python CLI

Same questions in the terminal:

```bash
python3 main.py
```

Type the letters of your answer (`a`, `bd`) or the text for free-text questions.
