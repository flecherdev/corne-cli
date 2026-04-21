import { syncTemplates } from '../../src/commands/templates';
import * as fsp from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { exec as cpExec } from 'child_process';

jest.mock('child_process');

describe('templates sync', () => {
  let tmpRepo: string;
  const templatesDir = path.join(__dirname, '../../templates');

  beforeAll(async () => {
    // Create a remote template content; we'll write it when `git clone` is mocked
    const remoteTemplateContent = JSON.stringify({ name: 'remote-test', layers: [{ name: 'BASE', keys: [[]] }] });
    // mock exec to simulate git clone: parse destination path and create templates there
    (cpExec as unknown as jest.Mock).mockImplementation((cmd: any, cb: any) => {
      // command expected: git clone --depth 1 <repo> <dest>
      const parts = String(cmd).split(/\s+/);
      const dest = parts[parts.length - 1];
      (async () => {
        try {
          const tmplDir = path.join(dest, 'templates');
          await fsp.mkdir(tmplDir, { recursive: true });
          await fsp.writeFile(path.join(tmplDir, 'remote-test.json'), remoteTemplateContent, 'utf-8');
          cb(null, { stdout: '', stderr: '' });
        } catch (err) {
          cb(err);
        }
      })();
    });
  });

  afterAll(async () => {
    try { await fsp.rm(path.join(templatesDir, 'remote-test.json'), { force: true }); } catch {}
    jest.restoreAllMocks();
  });

  it('copies remote templates into local templates dir', async () => {
    await syncTemplates('https://example.com/repo.git');
    const copied = await fsp.readFile(path.join(templatesDir, 'remote-test.json'), 'utf-8');
    expect(copied).toContain('remote-test');
  });
});
