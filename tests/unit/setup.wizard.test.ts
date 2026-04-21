import setupWizardCommand from '../../src/commands/setup';
import inquirer from 'inquirer';
import * as child from 'child_process';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { profileManager } from '../../src/core/keymap/manager';

jest.mock('inquirer');
jest.mock('child_process');

describe('setup wizard', () => {
  const tmpBasePrefix = path.join(process.cwd(), 'tmp-test-');
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await fsp.mkdtemp(tmpBasePrefix);
    // Redirect cwd to tmpDir for file generation
    jest.spyOn(process, 'cwd').mockReturnValue(tmpDir);

    // Mock qmk detection: child_process.exec should call callback with error
    (child.exec as unknown as jest.Mock).mockImplementation((cmd: any, cb: any) => cb(new Error('not found')));

    // Do not mock fs.stat to avoid interfering with other modules

    // Spy on profileManager.save to avoid writing into repo profiles
    jest.spyOn(profileManager, 'save').mockImplementation(async (k: any) => Promise.resolve());
  });

  afterAll(async () => {
    // cleanup
    try {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    } catch { }
    jest.restoreAllMocks();
  });

  it('generates example files when user accepts prompts', async () => {
    const prompts = [
      { qmkHome: '' }, // qmkHome input
      { device: -1 },
      { template: '__empty__', profileName: 'test-profile', saveNow: true },
      { generateFiles: true },
      { dest: process.cwd() },
    ];

    (inquirer.prompt as unknown as jest.Mock).mockImplementation(async (questions: any) => {
      // Return answers based on the prompt names to avoid ordering issues
      if (Array.isArray(questions)) {
        const names = questions.map((q: any) => q.name);
        if (names.includes('qmkHome')) return { qmkHome: '' };
        if (names.includes('device')) return { device: -1 };
        if (names.includes('template')) return { template: '__empty__', profileName: 'test-profile', saveNow: true };
        if (names.includes('generateFiles')) return { generateFiles: true };
        if (names.includes('dest')) return { dest: process.cwd(), keyboardPath: '' };
      }
      return {};
    });

    // Run wizard
    await setupWizardCommand();

    // Assert files exist under tmpDir/test-profile
    const profileDir = path.join(tmpDir, 'test-profile');
    const files = await fsp.readdir(profileDir);
    expect(files).toEqual(expect.arrayContaining(['keymap.c', 'config.h', 'rules.mk']));
  }, 20000);
});
