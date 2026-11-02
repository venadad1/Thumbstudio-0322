import { afterEach, expect, test } from 'bun:test';
import app from '../src/api';
import { imageStyles } from '../src/shared/image-styles';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });
function mockFetch(handler: (url: string, options?: RequestInit) => Response | Promise<Response>) {
  globalThis.fetch = ((url: string | URL | Request, options?: RequestInit) => Promise.resolve(handler(String(url), options))) as typeof fetch;
}
function response(data: unknown) { return Response.json({ code: 200, data }); }
function rpc(action: string, data: object) {
  return app.request(`/api/rpc/generation/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ json: data }) });
}
const apiKey = 'test-only-not-a-real-key';

test('Z-Image payload uses 16:9 and folds negative instructions into prompt', async () => {
  mockFetch((url, options) => {
    expect(url).toBe('https://api.kie.ai/api/v1/jobs/createTask');
    expect(options?.headers).toMatchObject({ Authorization: `Bearer ${apiKey}` });
    const body = JSON.parse(String(options?.body));
    expect(body.model).toBe('z-image');
    expect(body.input.aspect_ratio).toBe('16:9');
    expect(body.input.prompt).toBe('Mountain sunset\nAvoid the following: watermark');
    expect(body.input.negative_prompt).toBeUndefined();
    return response({ taskId: 'mock-task' });
  });
  const res = await rpc('create', { apiKey, prompt: 'Mountain sunset', negative: 'watermark' });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ json: { taskId: 'mock-task' } });
});

test('Rejects combined prompt over provider limit before any upstream request', async () => {
  mockFetch(() => { throw new Error('Should not call upstream'); });
  const res = await rpc('create', { apiKey, prompt: 'x'.repeat(999), negative: 'watermark' });
  expect(res.status).toBe(400);
  expect(await res.text()).toContain('1,000 characters');
});

test('All ten named styles add their instructions to the Z-Image prompt', async () => {
  expect(imageStyles).toHaveLength(10);
  for (const style of imageStyles) {
    mockFetch((_url, options) => {
      const body = JSON.parse(String(options?.body));
      expect(body.input.prompt).toBe(`Mountain sunset\nVisual style: ${style.prompt}\nAvoid the following: watermark`);
      expect(body.model).toBe('z-image');
      return response({ taskId: `mock-${style.id}` });
    });
    const res = await rpc('create', { apiKey, prompt: 'Mountain sunset', negative: 'watermark', style: style.id });
    expect(res.status).toBe(200);
  }
});

test('Unknown styles are rejected before any upstream request', async () => {
  mockFetch(() => { throw new Error('Should not call upstream'); });
  const res = await rpc('create', { apiKey, prompt: 'Mountain sunset', negative: '', style: 'unknown-style' });
  expect(res.status).toBe(400);
});

test('Style instructions count toward the provider prompt length limit', async () => {
  mockFetch(() => { throw new Error('Should not call upstream'); });
  const res = await rpc('create', { apiKey, prompt: 'x'.repeat(950), negative: '', style: 'realistic' });
  expect(res.status).toBe(400);
  expect(await res.text()).toContain('1,000 characters');
});

test('Provider key errors are surfaced without exposing credentials', async () => {
  mockFetch(() => Response.json({ code: 401, msg: 'Unauthorized' }));
  const res = await rpc('create', { apiKey, prompt: 'Mountain sunset', negative: '' });
  expect(res.status).toBe(400);
  const body = await res.text();
  expect(body).toContain('API key is invalid');
  expect(body).not.toContain(apiKey);
});

test('Queued task state is returned for browser status checking', async () => {
  mockFetch(url => {
    expect(url).toContain('jobs/recordInfo?taskId=mock-task');
    return response({ state: 'generating' });
  });
  const res = await rpc('status', { apiKey, taskId: 'mock-task' });
  expect(await res.json()).toEqual({ json: { state: 'generating', image: null } });
});

test('Finished task image is downloaded server-side as an export-safe data URI', async () => {
  mockFetch(url => {
    if (url.startsWith('https://api.kie.ai/')) return response({ state: 'success', resultJson: JSON.stringify({ resultUrls: ['https://example.com/mock.png'] }) });
    expect(url).toBe('https://example.com/mock.png');
    return new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'image/png' } });
  });
  const res = await rpc('status', { apiKey, taskId: 'mock-task' });
  expect(await res.json()).toEqual({ json: { state: 'success', image: 'data:image/png;base64,AQID' } });
});

test('Failed task returns provider failure message', async () => {
  mockFetch(() => response({ state: 'fail', failMsg: 'Safety check failed' }));
  const res = await rpc('status', { apiKey, taskId: 'mock-task' });
  expect(res.status).toBe(400);
  expect(await res.text()).toContain('Safety check failed');
});