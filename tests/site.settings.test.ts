import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('citizen chatbot is prominent and can hand a complaint to the real filing workflow', async () => {
  const [app, chatbot, form] = await Promise.all([
    readFile('src/App.tsx', 'utf8'),
    readFile('src/components/GrievanceChatbot.tsx', 'utf8'),
    readFile('src/components/GrievanceForm.tsx', 'utf8'),
  ]);
  assert.match(app, /GrievanceChatbot/);
  assert.match(app, /onStartComplaint/);
  assert.match(chatbot, /File real complaint/);
  assert.match(chatbot, /onStartComplaint/);
  assert.match(form, /api.createComplaint/);
});

test('admin website settings are protected and persisted by the server', async () => {
  const [routes, api, settings, migration] = await Promise.all([
    readFile('server/grievanceRoutes.ts', 'utf8'),
    readFile('src/services/api.ts', 'utf8'),
    readFile('src/components/AdminSettings.tsx', 'utf8'),
    readFile('supabase/migrations/003_site_settings.sql', 'utf8'),
  ]);
  assert.match(routes, /\/api\/site-settings/);
  assert.match(routes, /site_settings/);
  assert.match(routes, /\{ admin: true \}/);
  assert.match(api, /getSiteSettings/);
  assert.match(api, /updateSiteSettings/);
  assert.match(settings, /Save settings/);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /grant all on table public.site_settings to service_role/i);
});


test('chatbot complaint flow collects the complaint step by step before official filing', async () => {
  const chatbot = await readFile('src/components/GrievanceChatbot.tsx', 'utf8');
  assert.match(chatbot, /ComplaintStep/);
  assert.match(chatbot, /problem.*location.*action/);
  assert.match(chatbot, /complaintStep === 'problem'/);
  assert.match(chatbot, /What happened\?/);
  assert.match(chatbot, /Where did it happen\?/);
  assert.match(chatbot, /What should be done\?/);
  assert.match(chatbot, /Review your complaint/);
  assert.match(chatbot, /Continue to official form/);
  assert.match(chatbot, /onStartComplaint\(draft\)/);
});
