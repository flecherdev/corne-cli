import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { OLEDImageConverter, WPMAnimationGenerator, WPMConfig, DEFAULT_WPM_CONFIG, WPMAnimationSet, LayerAnimationGenerator, LayerAnimationSet, LayerDefinition, DEFAULT_LAYER_NAMES } from '../core/keymap';
import { BootloaderDetector } from '../core/bootloader';
import boxen from 'boxen';

let sharpModule: typeof import('sharp') | null = null;

function getSharp(): typeof import('sharp') {
  if (!sharpModule) {
    sharpModule = require('sharp');
  }
  return sharpModule!;
}

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
    const sharp = getSharp();
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
  height: number,
  rotate: number = 0
): Promise<FrameData[]> {
  const sharp = getSharp();
  const metadata = await sharp(imagePath).metadata();
  const frameCount = metadata.pages || 1;
  const delay = (metadata.delay || [100])[0]; // Default 100ms per frame

  const frames: FrameData[] = [];

  for (let i = 0; i < frameCount; i++) {
    const sharp = getSharp();
    let pipeline = sharp(imagePath, { page: i });
    
    // Apply rotation if specified
    if (rotate !== 0) {
      pipeline = pipeline.rotate(rotate);
    }
    
    const frameBuffer = await pipeline
      .resize(width, height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      })
      .greyscale()
      .normalise()
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
  options: { side?: string; output?: string; preview?: boolean; width?: number; height?: number; rotate?: number }
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
      const frames = await extractGifFrames(imagePath, width, height, options.rotate || 0);
      
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
      const sharp = getSharp();
      let pipeline = sharp(imagePath);
      
      // Apply rotation if specified
      if (options.rotate && options.rotate !== 0) {
        pipeline = pipeline.rotate(options.rotate);
      }
      
      const imageBuffer = await pipeline
        .resize(width, height, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 1 },
        })
        .greyscale()
        .normalise()
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
    case 'image': {
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
    }

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
 * Generate WPM-based animations
 */
export async function generateWPMAnimationCommand(options: any): Promise<void> {
  try {
    console.log('\n' + boxen(
      chalk.cyan.bold('🏃 WPM-Based Animation Generator\n\n') +
      chalk.white('Create dynamic OLED animations that respond to your typing speed!'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
      }
    ));

    // Prompt for animation files
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'idleAnimation',
        message: 'Path to idle animation (GIF/image):',
        validate: (input: string) => {
          if (!input) return 'Idle animation is required';
          return true;
        },
      },
      {
        type: 'input',
        name: 'typingAnimation',
        message: 'Path to typing animation (GIF/image):',
        validate: (input: string) => {
          if (!input) return 'Typing animation is required';
          return true;
        },
      },
      {
        type: 'confirm',
        name: 'hasFastAnimation',
        message: 'Add a separate animation for fast typing?',
        default: false,
      },
      {
        type: 'input',
        name: 'fastAnimation',
        message: 'Path to fast typing animation (GIF/image):',
        when: (answers: any) => answers.hasFastAnimation,
      },
      {
        type: 'number',
        name: 'idleThreshold',
        message: 'WPM threshold for idle state:',
        default: DEFAULT_WPM_CONFIG.idleThreshold,
      },
      {
        type: 'number',
        name: 'typingThreshold',
        message: 'WPM threshold for fast typing:',
        default: DEFAULT_WPM_CONFIG.typingThreshold,
        when: (answers: any) => answers.hasFastAnimation,
      },
      {
        type: 'confirm',
        name: 'showCounter',
        message: 'Display WPM counter on secondary OLED?',
        default: true,
      },
      {
        type: 'input',
        name: 'output',
        message: 'Output file name:',
        default: 'wpm_animation.h',
      },
    ]);

    const spinner = ora('Processing animations...').start();

    // Detect OLED size
    let width = options.width || 128;
    let height = options.height || 32;

    if (!options.width || !options.height) {
      spinner.text = 'Detecting OLED size...';
      const detector = new BootloaderDetector();
      const model = await detector.detectKeyboardModel();
      
      if (model && model.oledWidth && model.oledHeight) {
        width = model.oledWidth;
        height = model.oledHeight;
        spinner.info(chalk.cyan(`Detected OLED size: ${width}x${height}`));
        spinner.start('Processing animations...');
      }
    }

    // Process idle animation
    spinner.text = 'Processing idle animation...';
    const idleFrameData = await extractGifFrames(answers.idleAnimation, width, height);
    const idleFrames = idleFrameData.map(f => f.buffer);
    const idleDelay = options.idleDelay || (idleFrameData[0]?.delay || 400);

    // Process typing animation
    spinner.text = 'Processing typing animation...';
    const typingFrameData = await extractGifFrames(answers.typingAnimation, width, height);
    const typingFrames = typingFrameData.map(f => f.buffer);
    const typingDelay = options.typingDelay || options.typingDelay || (typingFrameData[0]?.delay || 200);

    // Process fast animation if provided
    let fastFrames: Buffer[] | undefined;
    let fastDelay: number | undefined;
    if (answers.hasFastAnimation && answers.fastAnimation) {
      spinner.text = 'Processing fast typing animation...';
      const fastFrameData = await extractGifFrames(answers.fastAnimation, width, height);
      fastFrames = fastFrameData.map(f => f.buffer);
      fastDelay = options.fastDelay || (fastFrameData[0]?.delay || 100);
    }

    // Create animation set
    const animationSet: WPMAnimationSet = {
      idle: {


        frames: idleFrames,
        frameDelay: idleDelay,
      },
      typing: {
        frames: typingFrames,
        frameDelay: typingDelay,
      },
    };

    if (fastFrames && fastDelay) {
      animationSet.fast = {
        frames: fastFrames,
        frameDelay: fastDelay,
      };
    }

    // Create WPM config
    const wpmConfig: WPMConfig = {
      enabled: true,
      idleThreshold: answers.idleThreshold,
      typingThreshold: answers.typingThreshold || DEFAULT_WPM_CONFIG.typingThreshold,
      updateInterval: DEFAULT_WPM_CONFIG.updateInterval,
      showCounter: answers.showCounter,
    };

    // Generate QMK code
    spinner.text = 'Generating QMK code...';
    const generator = new WPMAnimationGenerator(wpmConfig, width, height);
    const qmkCode = generator.generateQMKCode(animationSet, 'wpm_animation');

    // Write output file
    const outputPath = path.join(process.cwd(), answers.output);
    await fs.writeFile(outputPath, qmkCode, 'utf-8');

    // Generate additional files
    const rulesPath = outputPath.replace('.h', '_rules.mk');
    const keymapPath = outputPath.replace('.h', '_keymap_example.c');

    await fs.writeFile(rulesPath, generator.generateRulesMk(), 'utf-8');
    await fs.writeFile(keymapPath, generator.generateKeymapTemplate(), 'utf-8');

    spinner.succeed(chalk.green('WPM animation generated successfully!'));

    // Show summary
    console.log('\n' + boxen(
      chalk.cyan.bold('📦 Generated Files:\n\n') +
      chalk.white(`Animation Code: ${chalk.green(answers.output)}\n`) +
      chalk.white(`Rules Config:   ${chalk.green(path.basename(rulesPath))}\n`) +
      chalk.white(`Keymap Example: ${chalk.green(path.basename(keymapPath))}\n\n`) +
      chalk.cyan.bold('Animation Details:\n\n') +
      chalk.white(`Idle frames:   ${chalk.yellow(idleFrames.length)} @ ${idleDelay}ms\n`) +
      chalk.white(`Typing frames: ${chalk.yellow(typingFrames.length)} @ ${typingDelay}ms\n`) +
      (fastFrames ? chalk.white(`Fast frames:   ${chalk.yellow(fastFrames.length)} @ ${fastDelay}ms\n`) : '') +
      chalk.white(`\n`) +
      chalk.cyan.bold('Settings:\n\n') +
      chalk.white(`Idle threshold:   < ${chalk.yellow(wpmConfig.idleThreshold)} WPM\n`) +
      (wpmConfig.typingThreshold ? chalk.white(`Typing threshold: ≥ ${chalk.yellow(wpmConfig.typingThreshold)} WPM\n`) : '') +
      chalk.white(`WPM counter:      ${wpmConfig.showCounter ? chalk.green('Enabled') : chalk.gray('Disabled')}\n`),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
      }
    ));

    // Usage instructions
    console.log('\n' + boxen(
      chalk.cyan.bold('🚀 Usage Instructions:\n\n') +
      chalk.white('1. Add to your QMK keymap directory:\n') +
      chalk.gray(`   cp ${answers.output} ~/qmk_firmware/keyboards/YOUR_KB/keymaps/YOUR_KM/\n\n`) +
      chalk.white('2. Add to rules.mk:\n') +
      chalk.gray(`   cat ${path.basename(rulesPath)} >> rules.mk\n\n`) +
      chalk.white('3. Include in keymap.c:\n') +
      chalk.gray(`   #include "${answers.output}"\n\n`) +
      chalk.white('4. Add to oled_task_user():\n') +
      chalk.gray('   render_wpm_animation(is_keyboard_master());\n\n') +
      chalk.white('5. Compile and flash:\n') +
      chalk.gray('   qmk compile && qmk flash'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
      }
    ));

  } catch (error: any) {
    console.error(chalk.red('Error generating WPM animation:'), error.message);
    process.exit(1);
  }
}

/**
 * Generate layer-specific animations
 */
export async function generateLayerAnimationCommand(options: any): Promise<void> {
  try {
    console.log('\n' + boxen(
      chalk.cyan.bold('🎨 Layer-Specific Animation Generator\n\n') +
      chalk.white('Create different OLED animations for each keyboard layer!'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
      }
    ));

    // Detect OLED size
    let width = options.width || 128;
    let height = options.height || 32;

    if (!options.width || !options.height) {
      const spinner = ora('Detecting OLED size...').start();
      const detector = new BootloaderDetector();
      const model = await detector.detectKeyboardModel();
      
      if (model && model.oledWidth && model.oledHeight) {
        width = model.oledWidth;
        height = model.oledHeight;
        spinner.succeed(chalk.cyan(`Detected OLED size: ${width}x${height}`));
      } else {
        spinner.info(chalk.yellow(`Using default size: ${width}x${height}`));
      }
    }

    // Ask how many layers to configure
    const layerCountAnswer = await inquirer.prompt([
      {
        type: 'number',
        name: 'layerCount',
        message: 'How many layers to configure?',
        default: 4,
        validate: (input: number) => {
          if (input < 1 || input > 8) return 'Please enter between 1 and 8 layers';
          return true;
        },
      },
      {
        type: 'confirm',
        name: 'enableTransitions',
        message: 'Enable smooth transitions between layers?',
        default: true,
      },
      {
        type: 'number',
        name: 'transitionDuration',
        message: 'Transition duration (ms):',
        default: 200,
        when: (answers: any) => answers.enableTransitions,
      },
    ]);

    const layers: LayerDefinition[] = [];

    // Configure each layer
    for (let i = 0; i < layerCountAnswer.layerCount; i++) {
      console.log(chalk.cyan(`\n📝 Configuring Layer ${i}:`));
      console.log(chalk.gray(`   Layer name: descriptive name like "Base", "Lower", "Raise"`));
      console.log(chalk.gray(`   Animation file: path to GIF like "./my-animation.gif"\n`));

      const layerConfig = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: `Layer name (e.g., Base, Lower, Symbols):`,
          default: DEFAULT_LAYER_NAMES[i] || `Layer${i}`,
          validate: (input: string) => {
            if (!input || input.trim() === '') return 'Layer name is required';
            if (input.includes('.gif') || input.includes('.png')) {
              return 'Layer name should be a descriptive name, not a filename';
            }
            return true;
          },
        },
        {
          type: 'input',
          name: 'animation',
          message: `Animation file path (e.g., ./animations/idle.gif):`,
          validate: (input: string) => {
            if (!input) return 'Animation file is required';
            if (!input.includes('/') && !input.includes('.')) {
              return 'Please provide a file path (e.g., ./myfile.gif or /full/path/to/file.gif)';
            }
            return true;
          },
        },
        {
          type: 'number',
          name: 'frameDelay',
          message: 'Frame delay (ms):',
          default: 100,
          validate: (input: number) => {
            if (input < 10) return 'Frame delay must be at least 10ms';
            return true;
          },
        },
        {
          type: 'confirm',
          name: 'addIndicator',
          message: 'Add text indicator for this layer?',
          default: i > 0, // Add indicators for non-base layers
        },
        {
          type: 'input',
          name: 'indicatorText',
          message: 'Indicator text (3-4 chars):',
          default: (answers: any) => answers.name.substring(0, 4).toUpperCase(),
          when: (answers: any) => answers.addIndicator,
          validate: (input: string) => {
            if (input.length > 6) return 'Too long (max 6 characters)';
            return true;
          },
        },
      ]);

      // Process animation
      const spinner = ora(`Processing ${layerConfig.name} animation...`).start();
      
      try {
        const frameData = await extractGifFrames(layerConfig.animation, width, height);
        const frames = frameData.map(f => f.buffer);
        
        layers.push({
          id: i,
          name: layerConfig.name,
          animation: {
            frames,
            frameDelay: layerConfig.frameDelay,
          },
          indicator: layerConfig.addIndicator ? {
            text: layerConfig.indicatorText,
            position: 'top-right',
          } : undefined,
        });

        spinner.succeed(chalk.green(`${layerConfig.name}: ${frames.length} frames loaded`));
      } catch (error: any) {
        spinner.fail(chalk.red(`Error processing ${layerConfig.name} animation`));
        console.error(chalk.red(error.message));
        return;
      }
    }

    // Create animation set
    const animationSet: LayerAnimationSet = {
      layers,
      config: {
        enabled: true,
        enableTransitions: layerCountAnswer.enableTransitions,
        transitionDuration: layerCountAnswer.transitionDuration || 200,
        layers,
      },
    };

    // Validate configuration
    const generator = new LayerAnimationGenerator(animationSet.config, width, height);
    const validation = generator.validateConfig(animationSet);

    if (!validation.valid) {
      console.error(chalk.red('\n❌ Configuration validation failed:'));
      validation.errors.forEach(err => console.error(chalk.red(`  • ${err}`)));
      return;
    }

    // Get output filename first
    const outputAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'output',
        message: 'Output file name:',
        default: 'layer_animation.h',
      },
    ]);

    const outputPath = path.join(process.cwd(), outputAnswer.output);
    
    // Generate QMK code (with progress feedback)
    const spinner = ora('Generating QMK code...').start();
    spinner.text = 'Generating header and constants...';
    const qmkCode = generator.generateQMKCode(animationSet);
    
    spinner.text = 'Writing output file...';
    await fs.writeFile(outputPath, qmkCode, 'utf-8');

    // Generate rules.mk addition
    const rulesContent = `# Layer-specific OLED animations
OLED_ENABLE = yes
OLED_DRIVER = ssd1306
`;
    const rulesPath = outputPath.replace('.h', '_rules.mk');
    await fs.writeFile(rulesPath, rulesContent, 'utf-8');

    spinner.succeed(chalk.green('Layer animations generated successfully!'));

    // Show summary
    const layerSummary = layers.map(l => 
      `    ${chalk.cyan(l.name.padEnd(10))} (${chalk.yellow(l.animation.frames.length + ' frames')} @ ${l.animation.frameDelay}ms)`
    ).join('\n');

    console.log('\n' + boxen(
      chalk.cyan.bold('📦 Generated Files:\n\n') +
      chalk.white(`Animation Code: ${chalk.green(outputAnswer.output)}\n`) +
      chalk.white(`Rules Config:   ${chalk.green(path.basename(rulesPath))}\n\n`) +
      chalk.cyan.bold('Configured Layers:\n\n') +
      layerSummary + '\n\n' +
      chalk.cyan.bold('Settings:\n\n') +
      chalk.white(`Transitions: ${animationSet.config.enableTransitions ? chalk.green('Enabled') : chalk.gray('Disabled')}\n`) +
      (animationSet.config.enableTransitions ? 
        chalk.white(`Duration:    ${chalk.yellow(animationSet.config.transitionDuration + 'ms')}\n`) : ''),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
      }
    ));

    // Usage instructions
    console.log('\n' + boxen(
      chalk.cyan.bold('🚀 Usage Instructions:\n\n') +
      chalk.white('1. Add to your QMK keymap directory:\n') +
      chalk.gray(`   cp ${outputAnswer.output} ~/qmk_firmware/keyboards/YOUR_KB/keymaps/YOUR_KM/\n\n`) +
      chalk.white('2. Include in keymap.c:\n') +
      chalk.gray(`   #include "${outputAnswer.output}"\n\n`) +
      chalk.white('3. Add to oled_task_user():\n') +
      chalk.gray('   bool oled_task_user(void) {\n') +
      chalk.gray('       render_layer_animation();\n') +
      chalk.gray('       return false;\n') +
      chalk.gray('   }\n\n') +
      chalk.white('4. Compile and flash:\n') +
      chalk.gray('   qmk compile && qmk flash\n\n') +
      chalk.cyan('💡 Tip: ') +
      chalk.gray('The animation automatically changes when you switch layers!'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
      }
    ));

  } catch (error: any) {
    console.error(chalk.red('Error generating layer animations:'), error.message);
    process.exit(1);
  }
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
    .option('-r, --rotate <degrees>', 'Rotate image (0, 90, 180, 270)', parseInt, 0)
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

  oled
    .command('wpm')
    .description('Generate WPM-based dynamic animations')
    .option('-w, --width <pixels>', 'OLED width in pixels', parseInt)
    .option('-t, --height <pixels>', 'OLED height in pixels', parseInt)
    .option('--idle-delay <ms>', 'Frame delay for idle animation (ms)', parseInt)
    .option('--typing-delay <ms>', 'Frame delay for typing animation (ms)', parseInt)
    .option('--fast-delay <ms>', 'Frame delay for fast typing animation (ms)', parseInt)
    .action(generateWPMAnimationCommand);

  oled
    .command('layers')
    .description('[EXPERIMENTAL] Generate layer-specific animations - Use "oled generate --rotate" for stable animations')
    .option('-w, --width <pixels>', 'OLED width in pixels', parseInt)
    .option('-t, --height <pixels>', 'OLED height in pixels', parseInt)
    .action(generateLayerAnimationCommand);
}
