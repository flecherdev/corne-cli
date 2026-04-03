import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { OLEDImageConverter } from '../core/keymap';
import { BootloaderDetector } from '../core/bootloader';
import boxen from 'boxen';

interface FrameData {
  buffer: Buffer;
  delay: number; // milliseconds
}

/**
 * Detect OLED display size from connected keyboard
 */
export async function detectOLEDSizeCommand(): Promise<void> {
  const spinner = ora('Detecting keyboard...').start();

  try {
    const detector = new BootloaderDetector();
    const model = await detector.detectKeyboardModel();

    if (model && model.oledWidth && model.oledHeight) {
      spinner.succeed(chalk.green('Keyboard detected!'));
      
      console.log('\n' + boxen(
        chalk.cyan.bold('🖥️  OLED Display Information\n\n') +
        chalk.white(`Keyboard: ${model.name}\n`) +
        chalk.cyan(`Display Size: ${model.oledWidth}x${model.oledHeight} pixels\n`) +
        chalk.cyan(`Number of Displays: ${model.oledCount || 1}\n\n`) +
        chalk.gray('This size will be used automatically when generating images.'),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'cyan',
        }
      ));
    } else {
      spinner.fail(chalk.yellow('No keyboard with known OLED detected'));
      
      console.log('\n' + boxen(
        chalk.yellow('⚠️  Unknown Keyboard\n\n') +
        chalk.white('Could not detect OLED size automatically.\n\n') +
        chalk.cyan('Common OLED sizes:\n') +
        chalk.gray('• 128x32 pixels (Corne, Lily58, Sofle)\n') +
        chalk.gray('• 128x64 pixels (Kyria, some customs)\n\n') +
        chalk.white('Specify size manually with:\n') +
        chalk.gray('  --width <pixels> --height <pixels>'),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'yellow',
        }
      ));
    }
  } catch (error) {
    spinner.fail(chalk.red('Error detecting keyboard'));
    console.error(chalk.red('Error:'), error);
  }
}

/**
 * Check if file is an animated GIF
 */
async function isAnimatedGif(imagePath: string): Promise<boolean> {
  try {
    const metadata = await sharp(imagePath).metadata();
    return metadata.format === 'gif' && (metadata.pages || 1) > 1;
  } catch {
    return false;
  }
}

/**
 * Extract frames from animated GIF
 */
async function extractGifFrames(
  imagePath: string,
  width: number,
  height: number
): Promise<FrameData[]> {
  const metadata = await sharp(imagePath).metadata();
  const frameCount = metadata.pages || 1;
  const delay = (metadata.delay || [100])[0]; // Default 100ms per frame

  const frames: FrameData[] = [];

  for (let i = 0; i < frameCount; i++) {
    const frameBuffer = await sharp(imagePath, { page: i })
      .resize(width, height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      })
      .greyscale()
      .threshold(128)
      .raw()
      .toBuffer();

    frames.push({
      buffer: frameBuffer,
      delay: Array.isArray(metadata.delay) ? metadata.delay[i] || delay : delay,
    });
  }

  return frames;
}

/**
 * Generate OLED image from source file (supports static images and animated GIFs)
 */
export async function generateOLEDImageCommand(
  imagePath: string,
  options: { side?: string; output?: string; preview?: boolean; width?: number; height?: number }
): Promise<void> {
  try {
    const spinner = ora('Processing image...').start();

    // Detect OLED size if not specified
    let width = options.width || 128;
    let height = options.height || 32;

    if (!options.width || !options.height) {
      const detector = new BootloaderDetector();
      const model = await detector.detectKeyboardModel();
      
      if (model?.oledWidth && model?.oledHeight) {
        width = model.oledWidth;
        height = model.oledHeight;
        spinner.text = `Detected ${width}x${height} OLED, processing image...`;
      }
    }

    // Validate input file
    try {
      await fs.access(imagePath);
    } catch {
      spinner.fail(chalk.red(`Image file not found: ${imagePath}`));
      return;
    }

    // Check if it's an animated GIF
    const isAnimated = await isAnimatedGif(imagePath);
    
    if (isAnimated) {
      spinner.text = 'Extracting animation frames...';
      const frames = await extractGifFrames(imagePath, width, height);
      
      spinner.text = `Converting ${frames.length} frames to QMK format...`;
      
      // Convert to QMK format
      const converter = new OLEDImageConverter(width, height);
      const qmkCode = converter.convertAnimationToQMKFormat(
        frames.map(f => f.buffer),
        frames[0].delay,
        'custom_animation'
      );

      // Determine output path
      const outputPath = options.output || imagePath.replace(/\.(gif)$/i, '_oled_anim.h');

      // Write C header file
      await fs.writeFile(outputPath, qmkCode, 'utf-8');

      spinner.succeed(chalk.green(`Generated animated OLED (${frames.length} frames, ${width}x${height}): ${outputPath}`));

      // Show preview if requested
      if (options.preview) {
        console.log(chalk.cyan(`\n🎬 Animation Preview (${frames.length} frames):\n`));
        await showOLEDPreview(frames[0].buffer, width, height);
        console.log(chalk.gray(`   Frame delay: ${frames[0].delay}ms\n`));
      }

      // Show usage instructions
      console.log('\n' + boxen(
        chalk.cyan('Usage Instructions (Animated):\n\n') +
        chalk.white('1. Add the generated header to your QMK keymap:\n') +
        chalk.gray(`   #include "${path.basename(outputPath)}"\n\n`) +
        chalk.white('2. In your oled_task_user() function:\n') +
        chalk.gray('   static uint32_t anim_timer = 0;\n') +
        chalk.gray('   static uint8_t current_frame = 0;\n') +
        chalk.gray('   if (timer_elapsed32(anim_timer) > ANIM_FRAME_DURATION) {\n') +
        chalk.gray('     anim_timer = timer_read32();\n') +
        chalk.gray('     oled_write_raw_P(custom_animation[current_frame], OLED_SIZE);\n') +
        chalk.gray('     current_frame = (current_frame + 1) % ANIM_FRAME_COUNT;\n') +
        chalk.gray('   }'),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'cyan',
        }
      ));
    } else {
      // Static image processing (original code)
      spinner.text = 'Processing static image...';
      
      const imageBuffer = await sharp(imagePath)
        .resize(width, height, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 1 },
        })
        .greyscale()
        .threshold(128)
        .raw()
        .toBuffer();

      spinner.text = 'Converting to QMK format...';

      const converter = new OLEDImageConverter(width, height);
      const qmkCode = converter.convertToQMKFormat(imageBuffer, 'custom_image');

      const outputPath = options.output || imagePath.replace(/\.(png|jpg|jpeg|bmp)$/i, '_oled.h');

      await fs.writeFile(outputPath, qmkCode, 'utf-8');

      spinner.succeed(chalk.green(`Generated OLED image (${width}x${height}): ${outputPath}`));

      if (options.preview) {
        await showOLEDPreview(imageBuffer, width, height);
      }

      console.log('\n' + boxen(
        chalk.cyan('Usage Instructions:\n\n') +
        chalk.white('1. Add the generated header to your QMK keymap:\n') +
        chalk.gray(`   #include "${path.basename(outputPath)}"\n\n`) +
        chalk.white('2. In your OLED rendering function:\n') +
        chalk.gray('   oled_write_raw_P(custom_image, sizeof(custom_image));'),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'cyan',
        }
      ));
    }
  } catch (error) {
    console.error(chalk.red('Error generating OLED image:'), error);
  }
}

/**
 * Generate OLED text display
 */
export async function generateOLEDTextCommand(): Promise<void> {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'text',
        message: 'Enter text to display (max 4 lines, comma-separated):',
        default: 'Hello, World',
        validate: (input: string) => {
          const lines = input.split(',');
          if (lines.length > 4) {
            return 'Maximum 4 lines allowed';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'output',
        message: 'Output file name:',
        default: 'oled_text.h',
      },
      {
        type: 'confirm',
        name: 'preview',
        message: 'Show preview?',
        default: true,
      },
    ]);

    const spinner = ora('Generating text display...').start();

    const converter = new OLEDImageConverter(128, 32);
    const lines = answers.text.split(',').map((t: string) => t.trim());
    const qmkCode = converter.generateText(lines, 'custom_text');

    // Write output file
    const outputPath = path.join(process.cwd(), answers.output);
    await fs.writeFile(outputPath, qmkCode, 'utf-8');

    spinner.succeed(chalk.green(`Generated text display: ${outputPath}`));

    // Show preview
    if (answers.preview) {
      console.log('\n' + boxen(
        chalk.cyan('Text Preview:\n\n') +
        lines.map((line: string) => chalk.white(`  ${line}`)).join('\n'),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'cyan',
        }
      ));
    }
  } catch (error) {
    console.error(chalk.red('Error generating text display:'), error);
  }
}

/**
 * Preview OLED templates
 */
export async function previewOLEDTemplatesCommand(): Promise<void> {
  console.log('\n' + chalk.cyan.bold('Available OLED Templates:\n'));

  const templates = [
    {
      name: 'default',
      description: 'Key logger on left, Corne logo on right',
      left: 'Shows last pressed key',
      right: 'Corne standard logo',
    },
    {
      name: 'minimal',
      description: 'Simple text displays',
      left: 'Layer and WPM info',
      right: 'Custom keyboard name',
    },
    {
      name: 'custom',
      description: 'Fully customizable',
      left: 'User-defined image or text',
      right: 'User-defined image or text',
    },
    {
      name: 'animated',
      description: 'Animated GIF support',
      left: 'Supports animated GIF files',
      right: 'Auto-converts to frame array',
    },
  ];

  templates.forEach((template) => {
    console.log(
      boxen(
        chalk.bold.white(template.name) + '\n' +
        chalk.gray(template.description) + '\n\n' +
        chalk.cyan('Left: ') + chalk.white(template.left) + '\n' +
        chalk.cyan('Right: ') + chalk.white(template.right),
        {
          padding: 1,
          margin: { top: 0, right: 0, bottom: 1, left: 2 },
          borderStyle: 'round',
        }
      )
    );
  });

  console.log(chalk.yellow('\nUse these templates when creating a keymap with:'));
  console.log(chalk.gray('  corne-cli keymap:create <name> --template qwerty\n'));
}

/**
 * Interactive OLED wizard
 */
export async function oledWizardCommand(): Promise<void> {
  console.log('\n' + boxen(
    chalk.cyan.bold('🖥️  OLED Display Wizard\n\n') +
    chalk.white('This wizard will help you customize your Corne OLED displays.\n') +
    chalk.gray('You have two 128x32 pixel OLED screens: left and right.'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    }
  ));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: '📸 Convert image to OLED format', value: 'image' },
        { name: '📝 Generate custom text display', value: 'text' },
        { name: '👁️  Preview available templates', value: 'templates' },
        { name: '⚙️  Configure existing keymap OLED', value: 'configure' },
      ],
    },
  ]);

  switch (action) {
    case 'image':
      const { imagePath, side, output } = await inquirer.prompt([
        {
          type: 'input',
          name: 'imagePath',
          message: 'Enter image file path (PNG/JPG):',
        },
        {
          type: 'list',
          name: 'side',
          message: 'Which display?',
          choices: [
            { name: '👈 Left display', value: 'left' },
            { name: '👉 Right display', value: 'right' },
            { name: '🔀 Both displays', value: 'both' },
          ],
        },
        {
          type: 'input',
          name: 'output',
          message: 'Output file name:',
          default: 'oled_custom.h',
        },
      ]);
      await generateOLEDImageCommand(imagePath, { side, output, preview: true });
      break;

    case 'text':
      await generateOLEDTextCommand();
      break;

    case 'templates':
      await previewOLEDTemplatesCommand();
      break;

    case 'configure':
      console.log(chalk.yellow('\nTo configure OLED for an existing keymap, use:'));
      console.log(chalk.gray('  corne-cli keymap:edit <keymap-name>\n'));
      break;
  }
}

/**
 * Show ASCII preview of OLED image
 */
async function showOLEDPreview(imageBuffer: Buffer, width: number = 128, height: number = 32): Promise<void> {
  const pixelsPerChar = 2; // Each character represents 2x4 pixels

  console.log('\n' + chalk.cyan(`OLED Preview (${width}x${height}):`));
  console.log(chalk.gray('┌' + '─'.repeat(width / pixelsPerChar) + '┐'));

  for (let y = 0; y < height; y += 4) {
    let row = chalk.gray('│');
    for (let x = 0; x < width; x += pixelsPerChar) {
      // Sample 2x4 block
      let darkPixels = 0;
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < pixelsPerChar; dx++) {
          const px = x + dx;
          const py = y + dy;
          if (px < width && py < height) {
            const index = py * width + px;
            if (imageBuffer[index] === 0) {
              darkPixels++;
            }
          }
        }
      }

      // Choose character based on darkness
      const density = darkPixels / (pixelsPerChar * 4);
      if (density > 0.75) row += chalk.white('█');
      else if (density > 0.5) row += chalk.white('▓');
      else if (density > 0.25) row += chalk.gray('▒');
      else if (density > 0) row += chalk.gray('░');
      else row += ' ';
    }
    row += chalk.gray('│');
    console.log(row);
  }

  console.log(chalk.gray('└' + '─'.repeat(width / pixelsPerChar) + '┘\n'));
}

/**
 * Register OLED commands
 */
export function registerOLEDCommands(program: Command): void {
  const oled = program
    .command('oled')
    .description('OLED display customization tools');

  oled
    .command('generate <image>')
    .description('Convert image to OLED format')
    .option('-s, --side <side>', 'Display side (left/right/both)', 'both')
    .option('-o, --output <path>', 'Output file path')
    .option('-p, --preview', 'Show ASCII preview', false)
    .option('-w, --width <pixels>', 'OLED width in pixels (auto-detected if omitted)', parseInt)
    .option('-t, --height <pixels>', 'OLED height in pixels (auto-detected if omitted)', parseInt)
    .action(generateOLEDImageCommand);

  oled
    .command('text')
    .description('Generate custom text display')
    .action(generateOLEDTextCommand);

  oled
    .command('detect')
    .description('Detect OLED display size from connected keyboard')
    .action(detectOLEDSizeCommand);

  oled
    .command('templates')
    .alias('list')
    .description('Show available OLED templates')
    .action(previewOLEDTemplatesCommand);

  oled
    .command('wizard')
    .description('Interactive OLED configuration wizard')
    .action(oledWizardCommand);
}
