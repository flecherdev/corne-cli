import fs from 'fs/promises';
import path from 'path';
import type { Keymap } from '../../types';
import { KeymapValidator } from './validator';
import { keymapGenerator, KeymapGeneratorOptions } from './generator';

export interface ConverterOptions extends KeymapGeneratorOptions {
  output?: string;
  validate?: boolean;
}

export class KeymapConverter {
  private validator: KeymapValidator;
  private generator: typeof keymapGenerator;

  constructor() {
    this.validator = new KeymapValidator();
    this.generator = keymapGenerator;
  }

  async convert(keymapPath: string, options: ConverterOptions): Promise<string> {
    const { validate = true, output, keyboard = 'crkbd' } = options;

    const data = await fs.readFile(keymapPath, 'utf-8');
    const keymap: Keymap = JSON.parse(data);

    if (validate) {
      const result = this.validator.validate(keymap);
      if (!result.valid) {
        throw new Error(`Invalid keymap: ${result.errors.join(', ')}`);
      }
    }

    const genOptions: KeymapGeneratorOptions = {
      keyboard,
      includeComments: true,
    };

    const cCode = this.generator.generate(keymap, genOptions);

    if (output) {
      await fs.writeFile(output, cCode, 'utf-8');
    }

    return cCode;
  }

  async convertFromJson(keymapJson: string | Keymap, options: ConverterOptions): Promise<string> {
    const { validate = true, output, keyboard = 'crkbd' } = options;

    const keymap = typeof keymapJson === 'string'
      ? JSON.parse(keymapJson)
      : keymapJson;

    if (validate) {
      const result = this.validator.validate(keymap);
      if (!result.valid) {
        throw new Error(`Invalid keymap: ${result.errors.join(', ')}`);
      }
    }

    const genOptions: KeymapGeneratorOptions = {
      keyboard,
      includeComments: true,
    };

    const cCode = this.generator.generate(keymap, genOptions);

    if (output) {
      await fs.writeFile(output, cCode, 'utf-8');
    }

    return cCode;
  }

  async loadTemplate(templateName: string, templatesDir: string = './templates'): Promise<Keymap> {
    const templatePath = path.join(templatesDir, `${templateName}.json`);
    const data = await fs.readFile(templatePath, 'utf-8');
    return JSON.parse(data);
  }

  listTemplates(templatesDir: string = './templates'): string[] {
    return [];
  }
}

export const keymapConverter = new KeymapConverter();