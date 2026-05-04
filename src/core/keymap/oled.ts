// OLED display configuration and image conversion

export interface OLEDConfig {
  enabled: boolean;
  leftDisplay?: OLEDDisplayConfig;
  rightDisplay?: OLEDDisplayConfig;
  rotation?: 0 | 90 | 180 | 270;
  timeout?: number; // seconds
}

export interface OLEDDisplayConfig {
  type: 'logo' | 'status' | 'keylog' | 'custom';
  content?: string; // Path to image or custom text
  text?: string[];  // Lines of text
  logo?: string;    // Logo name or base64 data
}

// Standard OLED dimensions for Corne
export const OLED_WIDTH = 128;
export const OLED_HEIGHT = 32;

/**
 * Convert image to QMK OLED format
 */
export class OLEDImageConverter {
  private width: number;
  private height: number;

  constructor(width: number = OLED_WIDTH, height: number = OLED_HEIGHT) {
    this.width = width;
    this.height = height;
  }

  /**
   * Convert image buffer to QMK byte array
   * Images should be 128x32 pixels, monochrome
   */
  convertToQMKFormat(imageData: Buffer, name: string = 'custom_logo'): string {
    // This is a simplified version. In production, use a proper image library
    const bytes: number[] = [];
    
    // QMK expects data in vertical byte format (8 pixels per byte, column-wise)
    for (let page = 0; page < this.height / 8; page++) {
      for (let col = 0; col < this.width; col++) {
        let byte = 0;
        for (let bit = 0; bit < 8; bit++) {
          const y = page * 8 + bit;
          const pixelIndex = y * this.width + col;
          
          // imageData is a raw buffer from Sharp (grayscale/binary)
          if (pixelIndex < imageData.length && imageData[pixelIndex] > 0) {
            byte |= (1 << bit);
          }
        }
        bytes.push(byte);
      }
    }

    return this.formatAsCArray(bytes, name);
  }

  /**
   * Format byte array as C array for QMK
   */
  private formatAsCArray(bytes: number[], name: string): string {
    const lines: string[] = [];
    const bytesPerLine = 16;
    
    lines.push(`// Generated OLED image: ${name}`);
    lines.push(`// Size: ${this.width}x${this.height}`);
    lines.push(`static const char PROGMEM ${name}[] = {`);
    
    for (let i = 0; i < bytes.length; i += bytesPerLine) {
      const chunk = bytes.slice(i, i + bytesPerLine);
      const formatted = chunk.map(b => `0x${b.toString(16).padStart(2, '0')}`).join(', ');
      const isLast = i + bytesPerLine >= bytes.length;
      lines.push(`    ${formatted}${isLast ? '' : ','}`);
    }
    
    lines.push('};');
    lines.push('');
    lines.push('// Usage in keymap.c:');
    lines.push(`// oled_write_raw_P(${name}, sizeof(${name}));`);
    return lines.join('\n');
  }

  /**
   * Generate text as OLED data
   */
  /**
   * Convert multiple frames to QMK format for animation
   */
  convertAnimationToQMKFormat(frames: Buffer[], frameDelay: number, name: string = 'animation'): string {
    const lines: string[] = [];
    const frameSize = this.width * this.height / 8;
    
    lines.push(`// Generated OLED animation: ${name}`);
    lines.push(`// Size: ${this.width}x${this.height}`);
    lines.push(`// Frames: ${frames.length}`);
    lines.push(`// Frame delay: ${frameDelay}ms`);
    lines.push('');
    lines.push(`#define ANIM_FRAME_DURATION ${frameDelay}`);
    lines.push(`#define ANIM_FRAME_COUNT ${frames.length}`);
    lines.push(`#define OLED_SIZE ${frameSize}`);
    lines.push('');
    
    // Generate array of frames
    lines.push(`static const char PROGMEM ${name}[ANIM_FRAME_COUNT][OLED_SIZE] = {`);
    
    frames.forEach((frameBuffer, frameIndex) => {
      const bytes: number[] = [];
      
      // Convert frame to QMK format
      for (let page = 0; page < this.height / 8; page++) {
        for (let col = 0; col < this.width; col++) {
          let byte = 0;
          for (let bit = 0; bit < 8; bit++) {
            const y = page * 8 + bit;
            const pixelIndex = y * this.width + col;
            
            if (pixelIndex < frameBuffer.length && frameBuffer[pixelIndex] > 0) {
              byte |= (1 << bit);
            }
          }
          bytes.push(byte);
        }
      }
      
      // Format frame data
      lines.push(`    // Frame ${frameIndex + 1}`);
      lines.push('    {');
      
      const bytesPerLine = 16;
      for (let i = 0; i < bytes.length; i += bytesPerLine) {
        const chunk = bytes.slice(i, i + bytesPerLine);
        const formatted = chunk.map(b => `0x${b.toString(16).padStart(2, '0')}`).join(', ');
        lines.push(`        ${formatted}${i + bytesPerLine < bytes.length ? ',' : ''}`);
      }
      
      lines.push(`    }${frameIndex < frames.length - 1 ? ',' : ''}`);
    });
    
    lines.push('};');
    lines.push('');
    lines.push('// Usage in oled_task_user():');
    lines.push('// static uint32_t anim_timer = 0;');
    lines.push('// static uint8_t current_frame = 0;');
    lines.push('// if (timer_elapsed32(anim_timer) > ANIM_FRAME_DURATION) {');
    lines.push('//     anim_timer = timer_read32();');
    lines.push(`//     oled_write_raw_P(${name}[current_frame], OLED_SIZE);`);
    lines.push('//     current_frame = (current_frame + 1) % ANIM_FRAME_COUNT;');
    lines.push('// }');
    
    return lines.join('\n');
  }

  /**
   * Generate text as OLED data
   */
  generateText(text: string[], name: string = 'custom_text'): string {
    // Generate simple text display code
    const lines: string[] = [];
    
    lines.push(`// Custom text display: ${name}`);
    lines.push(`void oled_render_${name}(void) {`);
    
    text.forEach((line, index) => {
      lines.push(`    oled_set_cursor(0, ${index});`);
      lines.push(`    oled_write_P(PSTR("${line}"), false);`);
    });
    
    lines.push('}');
    lines.push('');
    lines.push('// Usage in oled_task_user():');
    lines.push(`// oled_render_${name}();`);
    
    return lines.join('\n');
  }

  /**
   * Create logo from ASCII art
   */
  asciiToOLED(ascii: string[], name: string = 'ascii_logo'): string {
    // Convert ASCII art to OLED bitmap
    const width = Math.max(...ascii.map(line => line.length));
    const height = ascii.length;
    
    const bytes: number[] = [];
    
    for (let page = 0; page < Math.ceil(height / 8); page++) {
      for (let col = 0; col < width; col++) {
        let byte = 0;
        for (let bit = 0; bit < 8; bit++) {
          const y = page * 8 + bit;
          if (y < height && col < ascii[y].length) {
            if (ascii[y][col] !== ' ') {
              byte |= (1 << bit);
            }
          }
        }
        bytes.push(byte);
      }
    }

    return this.formatAsCArray(bytes, name);
  }
}

/**
 * OLED configuration templates
 */
export const OLED_TEMPLATES = {
  default: {
    enabled: true,
    leftDisplay: {
      type: 'keylog' as const,
      text: ['Key Logger', 'Last pressed:'],
    },
    rightDisplay: {
      type: 'logo' as const,
      logo: 'corne',
    },
    rotation: 0 as const,
    timeout: 30,
  },
  
  minimal: {
    enabled: true,
    leftDisplay: {
      type: 'status' as const,
      text: ['Layer:', 'WPM:'],
    },
    rightDisplay: {
      type: 'status' as const,
      text: ['Caps Lock', 'Num Lock'],
    },
    rotation: 0 as const,
  },
  
  custom: {
    enabled: true,
    leftDisplay: {
      type: 'custom' as const,
      text: ['Custom Text', 'Line 2', 'Line 3'],
    },
    rightDisplay: {
      type: 'custom' as const,
      logo: 'custom',
    },
    rotation: 0 as const,
  },
};

// Export singleton instance
export const oledConverter = new OLEDImageConverter();
