import { describe, it, expect } from 'vitest';
import { createManifest, ManifestBuilder, type UserscriptManifest, type GrantPermission } from './manifest';

describe('Manifest Schema', () => {
  describe('ManifestBuilder', () => {
    it('should create basic manifest', () => {
      const manifest = new ManifestBuilder('Test Script', '1.0.0')
        .description('A test script')
        .author('Test Author')
        .build();

      expect(manifest.name).toBe('Test Script');
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.description).toBe('A test script');
      expect(manifest.author).toBe('Test Author');
    });

    it('should handle match patterns', () => {
      const manifest = new ManifestBuilder('Test', '1.0.0')
        .match('https://example.com/*')
        .match('https://test.com/*')
        .build();

      expect(manifest.match).toEqual([
        'https://example.com/*',
        'https://test.com/*',
      ]);
    });

    it('should handle grant permissions', () => {
      const manifest = new ManifestBuilder('Test', '1.0.0')
        .grant('GM_setValue', 'GM_getValue')
        .build();

      expect(manifest.grant).toEqual(['GM_setValue', 'GM_getValue']);
    });

    it('should handle run-at directive', () => {
      const manifest = new ManifestBuilder('Test', '1.0.0')
        .runAt('document-start')
        .build();

      expect(manifest['run-at']).toBe('document-start');
    });

    it('should handle resources', () => {
      const manifest = new ManifestBuilder('Test', '1.0.0')
        .resource('icon', 'https://example.com/icon.png')
        .resource('style', 'https://example.com/style.css')
        .build();

      expect(manifest.resource).toEqual([
        { name: 'icon', url: 'https://example.com/icon.png' },
        { name: 'style', url: 'https://example.com/style.css' },
      ]);
    });

    it('should handle require dependencies', () => {
      const manifest = new ManifestBuilder('Test', '1.0.0')
        .require('https://cdn.jsdelivr.net/npm/jquery@3/dist/jquery.min.js')
        .build();

      expect(manifest.require).toEqual([
        'https://cdn.jsdelivr.net/npm/jquery@3/dist/jquery.min.js',
      ]);
    });

    it('should handle connect domains', () => {
      const manifest = new ManifestBuilder('Test', '1.0.0')
        .connect('example.com', 'api.example.com')
        .build();

      expect(manifest.connect).toEqual(['example.com', 'api.example.com']);
    });

    it('should handle exclude patterns', () => {
      const manifest = new ManifestBuilder('Test', '1.0.0')
        .match('https://example.com/*')
        .exclude('https://example.com/admin/*')
        .build();

      expect(manifest.exclude).toEqual(['https://example.com/admin/*']);
    });

    it('should handle noframes', () => {
      const manifest = new ManifestBuilder('Test', '1.0.0')
        .noframes()
        .build();

      expect(manifest.noframes).toBe(true);
    });

    it('should handle inject-into', () => {
      const manifest = new ManifestBuilder('Test', '1.0.0')
        .injectInto('page')
        .build();

      expect(manifest['inject-into']).toBe('page');
    });

    it('should throw error without name', () => {
      const builder = new ManifestBuilder('', '1.0.0');
      expect(() => builder.build()).toThrow('Manifest requires name and version');
    });

    it('should throw error without version', () => {
      const builder = new ManifestBuilder('Test', '');
      expect(() => builder.build()).toThrow('Manifest requires name and version');
    });

    it('should support fluent chaining', () => {
      const manifest = new ManifestBuilder('Test', '1.0.0')
        .description('Test')
        .author('Author')
        .namespace('test.com')
        .match('*://*/*')
        .grant('GM_setValue')
        .runAt('document-end')
        .build();

      expect(manifest.name).toBe('Test');
      expect(manifest.description).toBe('Test');
      expect(manifest.author).toBe('Author');
      expect(manifest.namespace).toBe('test.com');
      expect(manifest.match).toEqual(['*://*/*']);
      expect(manifest.grant).toEqual(['GM_setValue']);
      expect(manifest['run-at']).toBe('document-end');
    });
  });

  describe('createManifest', () => {
    it('should create manifest builder', () => {
      const builder = createManifest('Test', '1.0.0');
      expect(builder).toBeInstanceOf(ManifestBuilder);
      
      const manifest = builder.build();
      expect(manifest.name).toBe('Test');
      expect(manifest.version).toBe('1.0.0');
    });
  });

  describe('Type Safety', () => {
    it('should enforce RunAt type', () => {
      const manifest: UserscriptManifest = {
        name: 'Test',
        version: '1.0.0',
        'run-at': 'document-start',
      };

      expect(manifest['run-at']).toBe('document-start');
    });

    it('should enforce GrantPermission type', () => {
      const permissions: GrantPermission[] = [
        'GM_setValue',
        'GM_getValue',
        'GM_xmlhttpRequest',
      ];

      expect(permissions).toHaveLength(3);
    });
  });
});
