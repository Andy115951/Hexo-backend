const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

describe('Hexo Integration Tests', () => {
  const rootDir = path.join(__dirname, '../..');

  describe('Project Structure', () => {
    test('should have required directories', () => {
      const requiredDirs = ['source', 'themes', 'scaffolds'];
      requiredDirs.forEach(dir => {
        expect(fs.existsSync(path.join(rootDir, dir))).toBe(true);
      });
    });

    test('should have _config.yml', () => {
      expect(fs.existsSync(path.join(rootDir, '_config.yml'))).toBe(true);
    });

    test('should have package.json', () => {
      expect(fs.existsSync(path.join(rootDir, 'package.json'))).toBe(true);
    });
  });

  describe('Source Directory Structure', () => {
    const sourceDir = path.join(rootDir, 'source');

    test('should have _posts directory', () => {
      const postsDir = path.join(sourceDir, '_posts');
      expect(fs.existsSync(postsDir)).toBe(true);
    });

    test('posts directory should be readable', () => {
      const postsDir = path.join(sourceDir, '_posts');
      expect(() => fs.readdirSync(postsDir)).not.toThrow();
    });
  });

  describe('Scaffolds', () => {
    const scaffoldsDir = path.join(rootDir, 'scaffolds');

    test('should have scaffolds directory', () => {
      expect(fs.existsSync(scaffoldsDir)).toBe(true);
    });

    test('should have post scaffold', () => {
      const postScaffold = path.join(scaffoldsDir, 'post.md');
      expect(fs.existsSync(postScaffold)).toBe(true);
    });

    test('should have page scaffold', () => {
      const pageScaffold = path.join(scaffoldsDir, 'page.md');
      expect(fs.existsSync(pageScaffold)).toBe(true);
    });

    test('scaffold files should be valid markdown', () => {
      const scaffolds = fs.readdirSync(scaffoldsDir)
        .filter(file => file.endsWith('.md'));

      scaffolds.forEach(scaffold => {
        const filePath = path.join(scaffoldsDir, scaffold);
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Plugin Installation', () => {
    let packageJson;

    beforeAll(() => {
      const packageJsonPath = path.join(rootDir, 'package.json');
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    });

    test('should have essential plugins installed', () => {
      const essentialPlugins = [
        'hexo',
        'hexo-server',
        'hexo-generator-index',
        'hexo-generator-archive',
        'hexo-generator-category',
        'hexo-generator-tag',
        'hexo-renderer-marked',
        'hexo-renderer-stylus',
        'hexo-renderer-ejs',
        'hexo-deployer-git'
      ];

      essentialPlugins.forEach(plugin => {
        expect(packageJson.dependencies).toHaveProperty(plugin);
      });
    });

    test('all dependencies should be installed (node_modules exists)', () => {
      const nodeModulesPath = path.join(rootDir, 'node_modules');
      expect(fs.existsSync(nodeModulesPath)).toBe(true);
    });
  });

  describe('Configuration Consistency', () => {
    let config;

    beforeAll(() => {
      const configPath = path.join(rootDir, '_config.yml');
      const configContent = fs.readFileSync(configPath, 'utf8');
      config = yaml.load(configContent);
    });

    test('public_dir should not be in source_dir', () => {
      expect(config.public_dir).not.toBe(config.source_dir);
    });

    test('permalink should contain :title', () => {
      expect(config.permalink).toContain(':title');
    });

    test('default_layout should be valid', () => {
      const validLayouts = ['post', 'page', 'draft'];
      expect(validLayouts).toContain(config.default_layout);
    });

    test('per_page should be a positive number', () => {
      expect(typeof config.per_page).toBe('number');
      expect(config.per_page).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Content Validation', () => {
    test('should have at least one blog post', () => {
      const postsDir = path.join(rootDir, 'source/_posts');
      const posts = fs.readdirSync(postsDir)
        .filter(file => file.endsWith('.md') &&
          fs.statSync(path.join(postsDir, file)).isFile());

      expect(posts.length).toBeGreaterThan(0);
    });

    test('all posts should have valid front matter format', () => {
      const postsDir = path.join(rootDir, 'source/_posts');
      const posts = fs.readdirSync(postsDir)
        .filter(file => file.endsWith('.md') &&
          fs.statSync(path.join(postsDir, file)).isFile());

      posts.forEach(postFile => {
        const filePath = path.join(postsDir, postFile);
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for front matter delimiters
        const hasFrontMatter = content.startsWith('---');
        expect(hasFrontMatter).toBe(true);

        // Check for closing delimiter
        const secondDelimiter = content.indexOf('---', 4);
        expect(secondDelimiter).toBeGreaterThan(0);
      });
    });
  });

  describe('Build System', () => {
    let packageJson;

    beforeAll(() => {
      const packageJsonPath = path.join(rootDir, 'package.json');
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    });

    test('should have build script', () => {
      expect(packageJson.scripts).toHaveProperty('build');
    });

    test('should have clean script', () => {
      expect(packageJson.scripts).toHaveProperty('clean');
    });

    test('should have server script', () => {
      expect(packageJson.scripts).toHaveProperty('server');
    });

    test('should have deploy script', () => {
      expect(packageJson.scripts).toHaveProperty('deploy');
    });

    test('all scripts should reference hexo commands', () => {
      const hexoScripts = ['build', 'clean', 'server', 'deploy'];
      hexoScripts.forEach(script => {
        expect(packageJson.scripts[script]).toContain('hexo');
      });
    });
  });

  describe('Package Metadata', () => {
    let packageJson;

    beforeAll(() => {
      const packageJsonPath = path.join(rootDir, 'package.json');
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    });

    test('should have hexo version specified', () => {
      expect(packageJson).toHaveProperty('hexo');
      expect(packageJson.hexo).toHaveProperty('version');
    });

    test('package should be marked as private', () => {
      expect(packageJson.private).toBe(true);
    });

    test('should have valid name', () => {
      expect(packageJson).toHaveProperty('name');
      expect(typeof packageJson.name).toBe('string');
      expect(packageJson.name.length).toBeGreaterThan(0);
    });

    test('should have version', () => {
      expect(packageJson).toHaveProperty('version');
      expect(typeof packageJson.version).toBe('string');
    });
  });
});
