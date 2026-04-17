const fs = require('fs');
const path = require('path');

describe('Hexo Posts Structure Tests', () => {
  const postsDir = path.join(__dirname, '../../source/_posts');

  describe('Posts Directory', () => {
    test('should exist', () => {
      expect(fs.existsSync(postsDir)).toBe(true);
    });

    test('should be a directory', () => {
      const stats = fs.statSync(postsDir);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('Post Files', () => {
    const postFiles = fs.readdirSync(postsDir)
      .filter(file => file.endsWith('.md') && fs.statSync(path.join(postsDir, file)).isFile());

    test('should have at least one post', () => {
      expect(postFiles.length).toBeGreaterThan(0);
    });

    test('all post files should have .md extension', () => {
      postFiles.forEach(file => {
        expect(file.endsWith('.md')).toBe(true);
      });
    });

    describe('Individual Post Validation', () => {
      postFiles.forEach(file => {
        describe(`${file}`, () => {
          let content;
          let frontMatter;

          beforeAll(() => {
            const filePath = path.join(postsDir, file);
            content = fs.readFileSync(filePath, 'utf8');

            // Extract front matter
            const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
            if (frontMatterMatch) {
              frontMatter = {};
              frontMatterMatch[1].split('\n').forEach(line => {
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                  const key = line.substring(0, colonIndex).trim();
                  const value = line.substring(colonIndex + 1).trim();
                  frontMatter[key] = value;
                }
              });
            }
          });

          test('should have valid front matter', () => {
            expect(frontMatter).toBeDefined();
            expect(typeof frontMatter).toBe('object');
          });

          test('should have a title', () => {
            expect(frontMatter).toHaveProperty('title');
            expect(typeof frontMatter.title).toBe('string');
            expect(frontMatter.title.length).toBeGreaterThan(0);
          });

          test('should have a date', () => {
            expect(frontMatter).toHaveProperty('date');
            expect(frontMatter.date).toBeDefined();
          });

          test('should have content after front matter', () => {
            const contentAfterFrontMatter = content.replace(/^---\n[\s\S]*?\n---\n?/, '');
            expect(contentAfterFrontMatter.trim().length).toBeGreaterThan(0);
          });
        });
      });
    });
  });

  describe('Post Subdirectories', () => {
    let subdirs;

    beforeAll(() => {
      subdirs = fs.readdirSync(postsDir)
        .filter(file => {
          const filePath = path.join(postsDir, file);
          return fs.statSync(filePath).isDirectory() && !file.startsWith('.');
        });
    });

    test('should handle subdirectories gracefully', () => {
      expect(Array.isArray(subdirs)).toBe(true);
    });
  });
});
