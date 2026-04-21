import { applyTemplateCommand } from '../../src/commands/templates';
import inquirer from 'inquirer';
import * as fsp from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { profileManager } from '../../src/core/keymap/manager';

jest.mock('inquirer');

describe('templates apply', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'corne-templates-'));
    // prevent actual profile writes
    jest.spyOn(profileManager, 'save').mockImplementation(async () => Promise.resolve());
    jest.spyOn(profileManager, 'exists').mockImplementation(async () => false);
    (inquirer.prompt as unknown as jest.Mock).mockImplementation(async (q: any) => {
      // Default: confirm prompts return true
      if (Array.isArray(q)) {
        const names = q.map((x: any) => x.name);
        if (names.includes('confirmOverwrite')) return { confirmOverwrite: true };
        if (names.includes('confirmGen')) return { confirmGen: true };
      }
      return {};
    });
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    try { await fsp.rm(tmpDir, { recursive: true, force: true }); } catch {}
  });

  it('generates example files from template', async () => {
    const name = 'qwerty';
    await applyTemplateCommand(name, { target: tmpDir });

    const dest = path.join(tmpDir, name);
    const files = await fsp.readdir(dest);

    expect(files).toEqual(expect.arrayContaining(['keymap.c', 'rules.mk', 'config.h']));
  }, 20000);

  it('asks before overwriting non-empty target and aborts when declined', async () => {
    const name = 'qwerty';
    const dest = path.join(tmpDir, name);
    await fsp.mkdir(dest, { recursive: true });
    // create an existing file
    const existingPath = path.join(dest, 'existing.txt');
    await fsp.writeFile(existingPath, 'keep', 'utf-8');

    // mock prompt to decline overwrite
    (inquirer.prompt as unknown as jest.Mock).mockImplementationOnce(async (q: any) => ({ confirmGen: false }));

    await applyTemplateCommand(name, { target: tmpDir });

    // ensure keymap.c was not created
    const exists = await fsp.readdir(dest);
    expect(exists).toEqual(expect.arrayContaining(['existing.txt']));
    expect(exists).not.toEqual(expect.arrayContaining(['keymap.c']));
  }, 20000);
});
