import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Gemini grievance chatbot is wired into the home page', async () => {
  const [server, app, chatbot] = await Promise.all([
    readFile('server.ts', 'utf8'),
    readFile('src/App.tsx', 'utf8'),
    readFile('src/components/GrievanceChatbot.tsx', 'utf8'),
  ]);

  assert.match(server, /\/api\/ai\/grievance-chat/);
  assert.match(server, /model:\s*'gemini-3\.8-flash'/);
  assert.match(server, /GEMINI_API_KEY/);
  assert.match(server, /Never invent government rules, departments, officers/);
  assert.match(server, /Never execute or claim to execute grievance submission/);
  assert.match(app, /GrievanceChatbot/);
  assert.match(chatbot, /\/api\/ai\/grievance-chat/);
  assert.match(chatbot, /Submit a grievance/);
  assert.match(chatbot, /Track my grievance/);
});
