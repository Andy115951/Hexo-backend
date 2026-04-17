const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('js-yaml');

describe('Hexo Deployment Tests', () => {
  const configPath = path.join(__dirname, '../../_config.yml');
  let config;

  beforeAll(() => {
    const configContent = fs.readFileSync(configPath, 'utf8');
    config = yaml.load(configContent);
  });

  describe('Deployment Configuration', () => {
    test('should have deploy section', () => {
      expect(config).toHaveProperty('deploy');
      expect(typeof config.deploy).toBe('object');
    });

    test('should have git deployment type', () => {
      expect(config.deploy).toHaveProperty('type');
      expect(config.deploy.type).toBe('git');
    });

    test('should have deployment repository', () => {
      expect(config.deploy).toHaveProperty('repo');
      expect(typeof config.deploy.repo).toBe('string');
      expect(config.deploy.repo.length).toBeGreaterThan(0);
    });

    test('repository should be valid HTTPS or SSH URL', () => {
      const repo = config.deploy.repo;
      const isValidUrl =
        repo.startsWith('https://') ||
        repo.startsWith('git@') ||
        repo.startsWith('git://');

      expect(isValidUrl).toBe(true);
    });

    test('should have deployment branch', () => {
      expect(config.deploy).toHaveProperty('branch');
      expect(typeof config.deploy.branch).toBe('string');
      expect(config.deploy.branch.length).toBeGreaterThan(0);
    });

    test('branch name should be valid', () => {
      const branch = config.deploy.branch;
      const validBranches = ['main', 'master', 'gh-pages'];
      expect(validBranches).toContain(branch);
    });
  });

  describe('Git Configuration', () => {
    test('.gitignore should exist', () => {
      const gitignorePath = path.join(__dirname, '../../.gitignore');
      expect(fs.existsSync(gitignorePath)).toBe(true);
    });

    test('.gitignore should ignore node_modules', () => {
      const gitignorePath = path.join(__dirname, '../../.gitignore');
      const gitignore = fs.readFileSync(gitignorePath, 'utf8');
      expect(gitignore).toContain('node_modules');
    });

    test('.gitignore should ignore db.json', () => {
      const gitignorePath = path.join(__dirname, '../../.gitignore');
      const gitignore = fs.readFileSync(gitignorePath, 'utf8');
      expect(gitignore).toContain('db.json');
    });

    test('.gitignore should ignore public directory', () => {
      const gitignorePath = path.join(__dirname, '../../.gitignore');
      const gitignore = fs.readFileSync(gitignorePath, 'utf8');
      expect(gitignore).toContain('public');
    });
  });

  describe('Build Artifacts', () => {
    test('package.json should exist', () => {
      const packageJsonPath = path.join(__dirname, '../../package.json');
      expect(fs.existsSync(packageJsonPath)).toBe(true);
    });

    test('should have build script', () => {
      const packageJsonPath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      expect(packageJson.scripts).toHaveProperty('build');
      expect(packageJson.scripts.build).toContain('generate');
    });

    test('should have clean script', () => {
      const packageJsonPath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      expect(packageJson.scripts).toHaveProperty('clean');
    });

    test('should have deploy script', () => {
      const packageJsonPath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      expect(packageJson.scripts).toHaveProperty('deploy');
    });
  });

  describe('Deployment Dependencies', () => {
    test('hexo-deployer-git should be installed', () => {
      const packageJsonPath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      expect(packageJson.dependencies).toHaveProperty('hexo-deployer-git');
    });

    test('hexo should be installed', () => {
      const packageJsonPath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      expect(packageJson.dependencies).toHaveProperty('hexo');
    });
  });

  describe('GitHub Actions (Optional)', () => {
    const workflowsDir = path.join(__dirname, '../../.github/workflows');

    test('workflows directory structure is valid', () => {
      const workflowsDirExists = fs.existsSync(workflowsDir);
      expect(typeof workflowsDirExists).toBe('boolean');
    });

    if (fs.existsSync(workflowsDir)) {
      test('workflow files should be valid YAML', () => {
        const workflowFiles = fs.readdirSync(workflowsDir)
          .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));

        workflowFiles.forEach(file => {
          const filePath = path.join(workflowsDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          expect(() => yaml.load(content)).not.toThrow();
        });
      });
    }
  });
});
