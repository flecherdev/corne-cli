// Mock HID device for testing

export interface MockHIDDeviceInfo {
  vendorId: number;
  productId: number;
  manufacturer?: string;
  product?: string;
  serialNumber?: string;
  path?: string;
}

export class MockHIDDevice {
  constructor(
    public vendorId: number,
    public productId: number,
    public manufacturer?: string,
    public product?: string,
    public path?: string
  ) {}

  write(data: number[]): number {
    return data.length;
  }

  read(callback: (err: any, data: Buffer) => void): void {
    setTimeout(() => {
      callback(null, Buffer.from([0x00, 0x01, 0x02]));
    }, 10);
  }

  close(): void {
    // Mock close
  }
}

// Mock device list
let mockDeviceList: MockHIDDeviceInfo[] = [];

export function setMockDevices(devices: MockHIDDeviceInfo[]): void {
  mockDeviceList = devices;
}

export function getMockDevices(): MockHIDDeviceInfo[] {
  return mockDeviceList;
}

export function clearMockDevices(): void {
  mockDeviceList = [];
}

// Predefined mock devices for testing
export const MOCK_DEVICES = {
  DFU_STM32: {
    vendorId: 0x0483,
    productId: 0xdf11,
    manufacturer: 'STMicroelectronics',
    product: 'STM32 BOOTLOADER',
    path: 'USB\\VID_0483&PID_DF11',
  },
  CATERINA_SPARKFUN: {
    vendorId: 0x1b4f,
    productId: 0x9203,
    manufacturer: 'SparkFun',
    product: 'Pro Micro',
    path: 'USB\\VID_1B4F&PID_9203',
  },
  CORNE_NORMAL: {
    vendorId: 0xfeed,
    productId: 0x0000,
    manufacturer: 'foostan',
    product: 'Corne Keyboard',
    path: 'USB\\VID_FEED&PID_0000',
  },
  GENERIC_HID: {
    vendorId: 0x1234,
    productId: 0x5678,
    manufacturer: 'Generic',
    product: 'HID Device',
    path: 'USB\\VID_1234&PID_5678',
  },
};
