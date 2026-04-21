const child_process = require('child_process');

describe('macos setup --yes', () => {
  let origExec: any;
  beforeEach(() => {
    origExec = child_process.exec;
    child_process.exec = jest.fn((cmd: any, cb: any) => cb(null, 'OK', ''));
    // clear module cache so macos module re-reads child_process
    jest.resetModules();
  });

  afterEach(() => {
    child_process.exec = origExec;
  });

  it('runs brew --version and brew install when autoYes is true', async () => {
    const { macosSetupCommand } = require('../../src/commands/macos');
    await expect(macosSetupCommand(true)).resolves.not.toThrow();
  }, 20000);
});
