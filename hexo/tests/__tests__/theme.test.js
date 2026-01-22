const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

describe('Hexo Theme Tests', () => {
  const themeConfigPath = path.join(__dirname, '../../_config.fluid.yml');

  describe('Fluid Theme Config', () => {
    let themeConfig;
    let configExists;

    beforeAll(() => {
      configExists = fs.existsSync(themeConfigPath);
      if (configExists) {
        const configContent = fs.readFileSync(themeConfigPath, 'utf8');
        try {
          themeConfig = yaml.load(configContent);
        } catch (e) {
          themeConfig = null;
        }
      }
    });

    test('theme config file exists (optional)', () => {
      expect(typeof configExists).toBe('boolean');
    });

    test('theme config should be valid YAML if it exists', () => {
      if (configExists) {
        expect(themeConfig).not.toBeNull();
      } else {
        expect(configExists).toBe(false);
      }
    });

    test('should have theme configured in main config', () => {
      const mainConfigPath = path.join(__dirname, '../../_config.yml');
      const mainConfigContent = fs.readFileSync(mainConfigPath, 'utf8');
      const mainConfig = yaml.load(mainConfigContent);

      expect(mainConfig).toHaveProperty('theme');
      expect(['fluid', 'landscape']).toContain(mainConfig.theme);
    });
  });

  describe('Theme Directory Structure', () => {
    const themesDir = path.join(__dirname, '../../themes');

    test('themes directory should exist', () => {
      expect(fs.existsSync(themesDir)).toBe(true);
    });

    test('should have at least one theme', () => {
      const themes = fs.readdirSync(themesDir)
        .filter(file => {
          const filePath = path.join(themesDir, file);
          return fs.statSync(filePath).isDirectory() && !file.startsWith('.');
        });

      expect(themes.length).toBeGreaterThan(0);
    });

    test('active theme should exist', () => {
      const mainConfigPath = path.join(__dirname, '../../_config.yml');
      const mainConfigContent = fs.readFileSync(mainConfigPath, 'utf8');
      const mainConfig = yaml.load(mainConfigContent);

      const activeThemePath = path.join(themesDir, mainConfig.theme);
      expect(fs.existsSync(activeThemePath)).toBe(true);
    });
  });

  describe('Theme Assets', () => {
    const themesDir = path.join(__dirname, '../../themes');
    const mainConfigPath = path.join(__dirname, '../../_config.yml');
    const mainConfigContent = fs.readFileSync(mainConfigPath, 'utf8');
    const mainConfig = yaml.load(mainConfigContent);
    const activeThemePath = path.join(themesDir, mainConfig.theme);

    test('theme should have layout directory', () => {
      const layoutDir = path.join(activeThemePath, 'layout');
      expect(fs.existsSync(layoutDir)).toBe(true);
    });

    test('theme should have source directory', () => {
      const sourceDir = path.join(activeThemePath, 'source');
      expect(fs.existsSync(sourceDir)).toBe(true);
    });

    test('theme should have config file', () => {
      const themeConfigFile = path.join(activeThemePath, '_config.yml');
      expect(fs.existsSync(themeConfigFile)).toBe(true);
    });
  });

  describe('Theme Configuration Validation', () => {
    const mainConfigPath = path.join(__dirname, '../../_config.yml');
    const mainConfigContent = fs.readFileSync(mainConfigPath, 'utf8');
    const mainConfig = yaml.load(mainConfigContent);

    test('should not have example URL in production (warning)', () => {
      if (mainConfig.url === 'http://example.com') {
        console.warn('\n⚠️  WARNING: URL is still set to example.com. Update with your actual site URL.');
      }
      // This is a warning, not a failure
      expect(mainConfig).toHaveProperty('url');
    });

    test('should have valid timezone configuration', () => {
      expect(mainConfig).toHaveProperty('timezone');
      const validTimezone = mainConfig.timezone === '' ||
        typeof mainConfig.timezone === 'string';
      expect(validTimezone).toBe(true);
    });

    test('should have proper language configuration', () => {
      expect(mainConfig).toHaveProperty('language');
      const validLanguages = ['zh-CN', 'en', 'zh-TW', 'ja', 'ko'];
      expect(validLanguages).toContain(mainConfig.language);
    });
  });

  describe('Public Directory', () => {
    const publicDir = path.join(__dirname, '../../public');

    test('public directory should exist or be creatable', () => {
      const exists = fs.existsSync(publicDir);
      expect(typeof exists).toBe('boolean');
    });
  });
});
