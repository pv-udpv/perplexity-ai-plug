/**
 * Tampermonkey Manifest Generator
 * 
 * Converts TypeScript manifest objects to Tampermonkey userscript headers.
 * 
 * @module manifest-generator
 */

import type { UserscriptManifest, Resource } from './manifest';

/**
 * Directive order for consistent output
 * Based on common conventions and readability
 */
const DIRECTIVE_ORDER = [
  // Metadata
  'name',
  'namespace',
  'version',
  'author',
  'description',
  'license',
  
  // Links
  'homepage',
  'homepageURL',
  'supportURL',
  'updateURL',
  'downloadURL',
  'installURL',
  
  // Icons
  'icon',
  'iconURL',
  'icon64',
  'icon64URL',
  'defaulticon',
  
  // Matching
  'match',
  'include',
  'exclude',
  'exclude-match',
  
  // Execution
  'run-at',
  'inject-into',
  'sandbox',
  'noframes',
  'unwrap',
  
  // Permissions
  'grant',
  
  // Dependencies
  'require',
  'resource',
  'connect',
  
  // Compatibility
  'compatible',
  'incompatible',
  'antifeature',
  'nocompat',
  
  // Advanced
  'webRequest',
] as const;

/**
 * Format a single directive value
 */
function formatValue(key: string, value: unknown): string[] {
  if (value === undefined || value === null) {
    return [];
  }

  // Boolean values
  if (typeof value === 'boolean') {
    return value ? [`@${key}`] : [];
  }

  // Array values
  if (Array.isArray(value)) {
    if (key === 'resource') {
      // Special handling for resources
      return (value as Resource[]).map(
        (r) => `@resource ${r.name} ${r.url}`
      );
    }
    // Regular arrays - one directive per item
    return value.map((item) => `@${key} ${item}`);
  }

  // Object values (like webRequest)
  if (typeof value === 'object') {
    return [`@${key} ${JSON.stringify(value)}`];
  }

  // Simple values
  return [`@${key} ${value}`];
}

/**
 * Generate Tampermonkey userscript header from manifest
 * 
 * @param manifest - Userscript manifest object
 * @param options - Generation options
 * @returns Formatted Tampermonkey header block
 * 
 * @example
 * ```typescript
 * const manifest = {
 *   name: 'My Script',
 *   version: '1.0.0',
 *   match: ['https://example.com/*'],
 *   grant: ['GM_setValue'],
 * };
 * 
 * const header = generateManifest(manifest);
 * // ==UserScript==
 * // @name         My Script
 * // @version      1.0.0
 * // @match        https://example.com/*
 * // @grant        GM_setValue
 * // ==/UserScript==
 * ```
 */
export function generateManifest(
  manifest: UserscriptManifest,
  options: {
    /** Add padding for alignment (default: true) */
    padValues?: boolean;
    /** Add empty line before sections (default: true) */
    sectionSeparators?: boolean;
    /** Custom comment above header */
    headerComment?: string;
  } = {}
): string {
  const {
    padValues = true,
    sectionSeparators = true,
    headerComment,
  } = options;

  // Validate required fields
  if (!manifest.name) {
    throw new Error('Manifest requires "name" field');
  }
  if (!manifest.version) {
    throw new Error('Manifest requires "version" field');
  }

  const lines: string[] = [];

  // Add custom header comment if provided
  if (headerComment) {
    lines.push(`// ${headerComment}`);
  }

  lines.push('// ==UserScript==');

  // Track current section for separators
  let currentSection: string | null = null;
  const sections = {
    metadata: ['name', 'namespace', 'version', 'author', 'description', 'license'],
    links: ['homepage', 'homepageURL', 'supportURL', 'updateURL', 'downloadURL', 'installURL'],
    icons: ['icon', 'iconURL', 'icon64', 'icon64URL', 'defaulticon'],
    matching: ['match', 'include', 'exclude', 'exclude-match'],
    execution: ['run-at', 'inject-into', 'sandbox', 'noframes', 'unwrap'],
    permissions: ['grant'],
    dependencies: ['require', 'resource', 'connect'],
    compatibility: ['compatible', 'incompatible', 'antifeature', 'nocompat'],
    advanced: ['webRequest'],
  };

  // Find section for a directive
  const getSection = (directive: string): string | null => {
    for (const [section, directives] of Object.entries(sections)) {
      if (directives.includes(directive)) {
        return section;
      }
    }
    return null;
  };

  // Process directives in order
  const directives: string[] = [];
  
  for (const key of DIRECTIVE_ORDER) {
    const value = manifest[key as keyof UserscriptManifest];
    if (value !== undefined && value !== null) {
      // Add section separator
      if (sectionSeparators) {
        const section = getSection(key);
        if (section && section !== currentSection && directives.length > 0) {
          directives.push('');
          currentSection = section;
        }
      }

      // Format and add directive(s)
      const formatted = formatValue(key, value);
      directives.push(...formatted);
    }
  }

  // Calculate padding if enabled
  if (padValues && directives.length > 0) {
    // Find longest directive name
    const maxLength = directives
      .filter((d) => d.includes('@'))
      .map((d) => d.split(/\s+/)[0].length)
      .reduce((max, len) => Math.max(max, len), 0);

    // Pad directives
    const paddedDirectives = directives.map((directive) => {
      if (!directive.includes('@') || !directive.includes(' ')) {
        return directive;
      }
      const [name, ...rest] = directive.split(/\s+/);
      const padding = ' '.repeat(maxLength - name.length + 1);
      return `${name}${padding}${rest.join(' ')}`;
    });

    directives.splice(0, directives.length, ...paddedDirectives);
  }

  // Add directives with // prefix
  lines.push(...directives.map((d) => (d ? `// ${d}` : '//')));

  lines.push('// ==/UserScript==');

  return lines.join('\n');
}

/**
 * Validate manifest for common issues
 * 
 * @param manifest - Manifest to validate
 * @returns Array of validation warnings (empty if valid)
 */
export function validateManifest(manifest: UserscriptManifest): string[] {
  const warnings: string[] = [];

  // Required fields
  if (!manifest.name) {
    warnings.push('Missing required field: name');
  }
  if (!manifest.version) {
    warnings.push('Missing required field: version');
  }

  // Version format
  if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
    warnings.push('Version should follow semantic versioning (e.g., 1.0.0)');
  }

  // URL matching
  if (!manifest.match && !manifest.include) {
    warnings.push('No URL matching patterns defined (match or include)');
  }

  // Grant permissions
  if (manifest.grant && manifest.grant.includes('none' as any)) {
    if (manifest.grant.length > 1) {
      warnings.push('Grant "none" should not be combined with other permissions');
    }
  }

  // Conflicting directives
  if (manifest.homepage && manifest.homepageURL) {
    warnings.push('Both homepage and homepageURL defined (use one)');
  }

  // URL validation (basic)
  const urlFields = ['homepage', 'homepageURL', 'supportURL', 'updateURL', 'downloadURL', 'installURL', 'icon', 'iconURL'];
  for (const field of urlFields) {
    const value = manifest[field as keyof UserscriptManifest];
    if (value && typeof value === 'string' && !value.startsWith('http')) {
      warnings.push(`${field} should be a valid URL (http:// or https://)`);
    }
  }

  return warnings;
}

/**
 * Extract manifest from existing userscript header
 * 
 * @param source - Userscript source code with header
 * @returns Parsed manifest object
 */
export function parseManifest(source: string): Partial<UserscriptManifest> {
  const manifest: Partial<UserscriptManifest> = {};
  
  const headerMatch = source.match(/\/\/\s*==UserScript==([\s\S]*?)\/\/\s*==\/UserScript==/m);
  if (!headerMatch) {
    return manifest;
  }

  const header = headerMatch[1];
  const lines = header.split('\n').map((l) => l.trim());

  for (const line of lines) {
    if (!line.startsWith('//')) continue;
    
    const content = line.replace(/^\/\/\s*/, '');
    if (!content.startsWith('@')) continue;

    const match = content.match(/^@(\S+)\s+(.+)$/);
    if (!match) continue;

    const [, key, value] = match;
    
    // Handle array fields
    if (['match', 'include', 'exclude', 'grant', 'require', 'connect'].includes(key)) {
      const existing = manifest[key as keyof UserscriptManifest] as string[] | undefined;
      manifest[key as keyof UserscriptManifest] = [...(existing || []), value] as any;
    }
    // Handle resource
    else if (key === 'resource') {
      const resourceMatch = value.match(/^(\S+)\s+(.+)$/);
      if (resourceMatch) {
        const [, name, url] = resourceMatch;
        const existing = manifest.resource || [];
        manifest.resource = [...existing, { name, url }];
      }
    }
    // Single value fields
    else {
      manifest[key as keyof UserscriptManifest] = value as any;
    }
  }

  return manifest;
}
