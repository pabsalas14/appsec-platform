import { expect, test } from '../fixtures';

test.describe('SCR Code Security Reviews', () => {
  test('create and list review via API contract', async ({ request }) => {
    const apiRoot = (process.env.TEST_API_BASE_URL ?? process.env.E2E_API_URL ?? 'http://nginx').replace(/\/$/, '');
    const unique = Date.now();
    const title = `SCR E2E ${unique}`;
    const username = `scr_e2e_${unique}`;
    const password = `ScrE2E_${unique}_Pwd!`;

    const register = await request.post(`${apiRoot}/api/v1/auth/register`, {
      data: {
        username,
        email: `${username}@example.com`,
        password,
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(register.ok()).toBeTruthy();

    const login = await request.post(`${apiRoot}/api/v1/auth/login`, {
      data: { username, password },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(login.ok()).toBeTruthy();

    const state = await request.storageState();
    const csrf = state.cookies.find((c) => c.name === 'csrf_token')?.value;
    expect(csrf).toBeTruthy();

    const createResp = await request.post(`${apiRoot}/api/v1/code_security_reviews`, {
      data: {
        titulo: title,
        estado: 'PENDING',
        descripcion: 'E2E API flow',
        progreso: 0,
        rama_analizar: 'main',
        url_repositorio: `https://github.com/example/repo-${unique}`,
        scan_mode: 'PUBLIC_URL',
        repositorio_id: null,
      },
      headers: { 'X-CSRF-Token': csrf ?? '' },
    });
    expect(createResp.ok()).toBeTruthy();

    const listResp = await request.get(`${apiRoot}/api/v1/code_security_reviews`);
    expect(listResp.ok()).toBeTruthy();
    const listBody = await listResp.json();
    expect(Array.isArray(listBody.data)).toBeTruthy();
    expect(listBody.data.some((r: { titulo: string }) => r.titulo === title)).toBeTruthy();
  });
});
