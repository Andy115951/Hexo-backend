const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

describe('Hexo Configuration Tests', () => {
  let config;

  beforeAll(() => {
    const configPath = path.join(__dirname, '../../_config.yml');
    const configContent = fs.readFileSync(configPath, 'utf8');
    config = yaml.load(configContent);
  });

  describe('Basic Site Configuration', () => {
    test('should have a title', () => {
      expect(config).toHaveProperty('title');
      expect(typeof config.title).toBe('string');
    });

    test('should have an author', () => {
      expect(config).toHaveProperty('author');
      expect(typeof config.author).toBe('string');
    });

    test('should have a language set', () => {
      expect(config).toHaveProperty('language');
      expect(config.language).toMatch(/^(zh-CN|en|zh-TW)$/);
    });

    test('should have a URL configured', () => {
      expect(config).toHaveProperty('url');
      expect(config.url).toMatch(/^https?:\/\//);
    });
  });

  describe('Directory Configuration', () => {
    test('should have valid directory configuration', () => {
      expect(config.source_dir).toBe('source');
      expect(config.public_dir).toBe('public');
    });

    test('should have valid permalink configuration', () => {
      expect(config).toHaveProperty('permalink');
      expect(config.permalink).toContain(':title');
    });
  });

  describe('Theme Configuration', () => {
    test('should have a theme configured', () => {
      expect(config).toHaveProperty('theme');
      expect(typeof config.theme).toBe('string');
      expect(config.theme.length).toBeGreaterThan(0);
    });
  });

  describe('Deployment Configuration', () => {
    test('should have deployment configuration', () => {
      expect(config).toHaveProperty('deploy');
      expect(config.deploy).toHaveProperty('type');
      expect(config.deploy.type).toBe('git');
    });

    test('should have valid deployment repository', () => {
      expect(config.deploy).toHaveProperty('repo');
      expect(config.deploy.repo).toMatch(/^https?:\/\//);
    });

    test('should have a deployment branch', () => {
      expect(config.deploy).toHaveProperty('branch');
      expect(typeof config.deploy.branch).toBe('string');
    });
  });

  describe('Writing Configuration', () => {
    test('should have new post name format', () => {
      expect(config).toHaveProperty('new_post_name');
      expect(config.new_post_name).toContain('.md');
    });

    test('should have default layout', () => {
      expect(config).toHaveProperty('default_layout');
      expect(['post', 'page', 'draft']).toContain(config.default_layout);
    });

    test('should have syntax highlighter configured', () => {
      expect(config).toHaveProperty('syntax_highlighter');
      expect(['highlight.js', 'prismjs']).toContain(config.syntax_highlighter);
    });
  });

  describe('Pagination Configuration', () => {
    test('should have per_page setting', () => {
      expect(config).toHaveProperty('per_page');
      expect(typeof config.per_page).toBe('number');
      expect(config.per_page).toBeGreaterThanOrEqual(0);
    });

    test('should have pagination_dir', () => {
      expect(config).toHaveProperty('pagination_dir');
      expect(typeof config.pagination_dir).toBe('string');
    });
  });
});
