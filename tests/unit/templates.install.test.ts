import { installTemplate } from '../../src/commands/templates';
import * as fsp from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('templates install', () => {
  let qmkHome: string;

  beforeEach(async () => {
    qmkHome = await fsp.mkdtemp(path.join(os.tmpdir(), 'qmk-home-'));
    // create keyboard path
    await fsp.mkdir(path.join(qmkHome, 'keyboards', 'crkbd', 'keymaps'), { recursive: true });
  });

  afterEach(async () => {
    try { await fsp.rm(qmkHome, { recursive: true, force: true }); } catch {}
  });

  it('installs template into qmk keymaps directory', async () => {
    const name = 'qwerty';
    await installTemplate(name, 'crkbd', qmkHome);

    const dest = path.join(qmkHome, 'keyboards', 'crkbd', 'keymaps', name);
    const files = await fsp.readdir(dest);
    expect(files).toEqual(expect.arrayContaining(['keymap.c', 'rules.mk', 'config.h']));
  }, 20000);
});
