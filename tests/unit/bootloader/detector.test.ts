// Bootloader detector tests

import { BootloaderDetector, clearDeviceCache } from '../../../src/core/bootloader/detector';
import { matchBootloader, isCorneKeyboard } from '../../../src/core/bootloader/constants';
import { setMockDevices, clearMockDevices, MOCK_DEVICES } from '../../mocks/usb-device.mock';

// Mock node-hid
jest.mock('node-hid', () => ({
  devices: jest.fn(() => {
    const { getMockDevices } = require('../../mocks/usb-device.mock');
    return getMockDevices();
  }),
}));

describe('BootloaderDetector', () => {
  let detector: BootloaderDetector;

  beforeEach(() => {
    detector = new BootloaderDetector();
    clearMockDevices();
    clearDeviceCache();
  });

  afterEach(() => {
    clearMockDevices();
    clearDeviceCache();
  });

  describe('detect', () => {
    it('should detect DFU bootloader', async () => {
      setMockDevices([MOCK_DEVICES.DFU_STM32]);

      const bootloader = await detector.detect();

      expect(bootloader).toBeDefined();
      expect(bootloader?.type).toBe('dfu');
      expect(bootloader?.tool).toBe('dfu-util');
      expect(bootloader?.manufacturer).toBe('STMicroelectronics');
    });

    it('should detect Caterina bootloader', async () => {
      setMockDevices([MOCK_DEVICES.CATERINA_SPARKFUN]);

      const bootloader = await detector.detect();

      expect(bootloader).toBeDefined();
      expect(bootloader?.type).toBe('caterina');
      expect(bootloader?.tool).toBe('avrdude');
    });

    it('should return null when no bootloader detected', async () => {
      setMockDevices([MOCK_DEVICES.GENERIC_HID]);

      const bootloader = await detector.detect();

      expect(bootloader).toBeNull();
    });

    it('should return null with empty device list', async () => {
      setMockDevices([]);

      const bootloader = await detector.detect();

      expect(bootloader).toBeNull();
    });
  });

  describe('listDevices', () => {
    it('should list all devices with bootloader info', async () => {
      setMockDevices([
        MOCK_DEVICES.DFU_STM32,
        MOCK_DEVICES.GENERIC_HID,
      ]);

      const devices = await detector.listDevices();

      expect(devices).toHaveLength(2);
      expect(devices[0].bootloader).toBeDefined();
      expect(devices[0].bootloader?.type).toBe('dfu');
      expect(devices[1].bootloader).toBeUndefined();
    });

    it('should return empty array when no devices', async () => {
      setMockDevices([]);

      const devices = await detector.listDevices();

      expect(devices).toHaveLength(0);
    });
  });

  describe('detectCorneKeyboard', () => {
    it('should detect Corne keyboard in normal mode', async () => {
      // Use correct VID/PID from constants (0xfeed = 65261, 0x0000 = 0)
      setMockDevices([{
        vendorId: 0xfeed,
        productId: 0x0000,
        manufacturer: 'foostan',
        product: 'Corne Keyboard',
        path: 'USB\\VID_FEED&PID_0000',
      }]);

      const hasCorne = await detector.detectCorneKeyboard();

      expect(hasCorne).toBe(true);
    });

    it('should return false when no Corne keyboard', async () => {
      setMockDevices([MOCK_DEVICES.GENERIC_HID]);

      const hasCorne = await detector.detectCorneKeyboard();

      expect(hasCorne).toBe(false);
    });
  });

  describe('waitForBootloader', () => {
    it('should resolve when bootloader appears', async () => {
      // Start with no bootloader
      setMockDevices([]);

      // Add bootloader after 100ms
      setTimeout(() => {
        setMockDevices([MOCK_DEVICES.DFU_STM32]);
      }, 100);

      const bootloader = await detector.waitForBootloader(1000);

      expect(bootloader).toBeDefined();
      expect(bootloader.type).toBe('dfu');
    });

    it('should reject on timeout', async () => {
      setMockDevices([]);

      await expect(detector.waitForBootloader(100)).rejects.toThrow('Timeout');
    });
  });
});

describe('Bootloader matching', () => {
  describe('matchBootloader', () => {
    it('should match DFU STM32', () => {
      const bootloader = matchBootloader(0x0483, 0xdf11);

      expect(bootloader).toBeDefined();
      expect(bootloader?.type).toBe('dfu');
    });

    it('should match Caterina SparkFun', () => {
      const bootloader = matchBootloader(0x1b4f, 0x9203);

      expect(bootloader).toBeDefined();
      expect(bootloader?.type).toBe('caterina');
    });

    it('should return null for unknown device', () => {
      const bootloader = matchBootloader(0x1234, 0x5678);

      expect(bootloader).toBeNull();
    });
  });

  describe('isCorneKeyboard', () => {
    it('should identify Corne keyboard', () => {
      const isCorne = isCorneKeyboard(0xfeed, 0x0000);

      expect(isCorne).toBe(true);
    });

    it('should return false for non-Corne device', () => {
      const isCorne = isCorneKeyboard(0x1234, 0x5678);

      expect(isCorne).toBe(false);
    });
  });
});
