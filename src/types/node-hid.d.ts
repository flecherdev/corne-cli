// Type definitions for node-hid
declare module 'node-hid' {
  export interface Device {
    vendorId: number;
    productId: number;
    path?: string;
    serialNumber?: string;
    manufacturer?: string;
    product?: string;
    release?: number;
    interface?: number;
    usagePage?: number;
    usage?: number;
  }

  export class HID {
    constructor(path: string);
    constructor(vid: number, pid: number);
    close(): void;
    read(callback: (err: any, data: Buffer) => void): void;
    write(values: number[] | Buffer): number;
    getFeatureReport(reportId: number, reportLength: number): number[];
    sendFeatureReport(data: number[] | Buffer): number;
  }

  export function devices(): Device[];
}
