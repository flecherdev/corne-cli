// Keymap profile manager

import fs from 'fs/promises';
import path from 'path';
import { Keymap } from '../../types';

export class ProfileManager {
  private profilesDir: string;

  constructor(profilesDir: string = './profiles') {
    this.profilesDir = profilesDir;
  }

  /**
   * Initialize profiles directory
   */
  async init(): Promise<void> {
    try {
      await fs.mkdir(this.profilesDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to initialize profiles directory: ${(error as Error).message}`);
    }
  }

  /**
   * Save a keymap profile
   */
  async save(keymap: Keymap): Promise<void> {
    await this.init();
    
    try {
      const filePath = path.join(this.profilesDir, `${keymap.name}.json`);
      const data = JSON.stringify(keymap, null, 2);
      await fs.writeFile(filePath, data, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save profile "${keymap.name}": ${(error as Error).message}`);
    }
  }

  /**
   * Load a keymap profile
   */
  async load(name: string): Promise<Keymap> {
    try {
      const filePath = path.join(this.profilesDir, `${name}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Profile "${name}" not found`);
      }
      throw new Error(`Failed to load profile "${name}": ${(error as Error).message}`);
    }
  }

  /**
   * List all saved profiles
   */
  async list(): Promise<string[]> {
    await this.init();
    
    try {
      const files = await fs.readdir(this.profilesDir);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''))
        .sort();
    } catch (error) {
      throw new Error(`Failed to list profiles: ${(error as Error).message}`);
    }
  }

  /**
   * Delete a profile
   */
  async delete(name: string): Promise<void> {
    try {
      const filePath = path.join(this.profilesDir, `${name}.json`);
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Profile "${name}" not found`);
      }
      throw new Error(`Failed to delete profile "${name}": ${(error as Error).message}`);
    }
  }

  /**
   * Check if a profile exists
   */
  async exists(name: string): Promise<boolean> {
    try {
      const filePath = path.join(this.profilesDir, `${name}.json`);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get profile info without loading full keymap
   */
  async getInfo(name: string): Promise<{ name: string; description?: string; layers: number }> {
    const keymap = await this.load(name);
    return {
      name: keymap.name,
      description: keymap.description,
      layers: keymap.layers.length,
    };
  }

  /**
   * Duplicate a profile
   */
  async duplicate(sourceName: string, targetName: string): Promise<void> {
    const keymap = await this.load(sourceName);
    keymap.name = targetName;
    keymap.description = `Copy of ${sourceName}`;
    await this.save(keymap);
  }
}

// Export singleton instance
export const profileManager = new ProfileManager();
