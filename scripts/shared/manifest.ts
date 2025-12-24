/**
 * Tampermonkey UserScript Manifest Schema
 * 
 * Type-safe manifest definitions for userscripts.
 * Based on Tampermonkey documentation: https://www.tampermonkey.net/documentation.php
 * 
 * @module manifest
 */

/**
 * When to execute the userscript
 */
export type RunAt = 'document-start' | 'document-end' | 'document-idle';

/**
 * Tampermonkey API permissions
 */
export type GrantPermission =
  | 'none'
  | 'unsafeWindow'
  | 'GM_addStyle'
  | 'GM_addElement'
  | 'GM_deleteValue'
  | 'GM_getValue'
  | 'GM_setValue'
  | 'GM_listValues'
  | 'GM_getResourceText'
  | 'GM_getResourceURL'
  | 'GM_registerMenuCommand'
  | 'GM_unregisterMenuCommand'
  | 'GM_notification'
  | 'GM_openInTab'
  | 'GM_setClipboard'
  | 'GM_xmlhttpRequest'
  | 'GM_info'
  | 'GM_getTab'
  | 'GM_saveTab'
  | 'GM_getTabs'
  | 'GM_download'
  | 'GM_log'
  | 'GM.info'
  | 'GM.setValue'
  | 'GM.getValue'
  | 'GM.deleteValue'
  | 'GM.listValues'
  | 'GM.getResourceUrl'
  | 'GM.addStyle'
  | 'GM.addElement'
  | 'GM.openInTab'
  | 'GM.notification'
  | 'GM.setClipboard'
  | 'GM.xmlHttpRequest'
  | 'window.close'
  | 'window.focus'
  | 'window.onurlchange';

/**
 * Resource definition for external files
 */
export interface Resource {
  /** Resource name */
  name: string;
  /** Resource URL */
  url: string;
}

/**
 * Complete Tampermonkey UserScript Manifest
 */
export interface UserscriptManifest {
  // === Required fields ===
  
  /** Script name displayed in Tampermonkey dashboard */
  name: string;
  
  /** Script version (semantic versioning recommended) */
  version: string;
  
  // === Metadata ===
  
  /** Script description */
  description?: string;
  
  /** Script author/maintainer */
  author?: string;
  
  /** Namespace to avoid conflicts (usually domain or GitHub username) */
  namespace?: string;
  
  /** Homepage URL */
  homepage?: string;
  
  /** Homepage URL (alias for homepage) */
  homepageURL?: string;
  
  /** Support/issues URL */
  supportURL?: string;
  
  /** License identifier (SPDX format) */
  license?: string;
  
  // === Icons ===
  
  /** Script icon (32x32 recommended) */
  icon?: string;
  
  /** Script icon URL (64x64 recommended) */
  iconURL?: string;
  
  /** Default icon URL (fallback) */
  defaulticon?: string;
  
  /** Low-res icon (32x32) */
  icon64?: string;
  
  /** High-res icon (64x64) */
  icon64URL?: string;
  
  // === URL Matching ===
  
  /** URL patterns to match (supports wildcards) */
  match?: string[];
  
  /** URL patterns to include (TamperMonkey-specific) */
  include?: string[];
  
  /** URL patterns to exclude */
  exclude?: string[];
  
  /** Exclude URL patterns that match */
  'exclude-match'?: string[];
  
  // === Execution ===
  
  /** When to inject and execute the script */
  'run-at'?: RunAt;
  
  /** Run in sandboxed environment */
  sandbox?: 'JavaScript' | 'raw' | 'DOM';
  
  /** Permissions granted to the script */
  grant?: GrantPermission[];
  
  /** Inject into specific frames */
  'inject-into'?: 'page' | 'content' | 'auto';
  
  /** No frames (run only in top frame) */
  noframes?: boolean;
  
  // === Dependencies ===
  
  /** External JavaScript files to load before script */
  require?: string[];
  
  /** External resources (CSS, JSON, etc.) accessible via GM_getResourceText */
  resource?: Resource[];
  
  // === Updates ===
  
  /** URL to check for updates (userscript) */
  updateURL?: string;
  
  /** URL to download updates from */
  downloadURL?: string;
  
  /** URL to install from */
  installURL?: string;
  
  // === CORS & Network ===
  
  /** Domains allowed for GM_xmlhttpRequest */
  connect?: string[];
  
  /** Compatible browsers/userscript managers */
  compatible?: string[];
  
  /** Incompatible browsers/userscript managers */
  incompatible?: string[];
  
  // === Advanced ===
  
  /** Require specific Tampermonkey features */
  antifeature?: string[];
  
  /** Don't start until manually enabled */
  nocompat?: string;
  
  /** Unwrap the script from the default wrapper */
  unwrap?: boolean;
  
  /** WebRequest rules (advanced) */
  webRequest?: Array<{
    selector: string;
    action: string;
  }>;
}

/**
 * Simplified manifest for common use cases
 */
export interface SimpleManifest {
  name: string;
  version: string;
  description?: string;
  author?: string;
  match: string[];
  grant?: GrantPermission[];
  'run-at'?: RunAt;
}

/**
 * Manifest builder with fluent API
 */
export class ManifestBuilder {
  private manifest: Partial<UserscriptManifest> = {};

  constructor(name: string, version: string) {
    this.manifest.name = name;
    this.manifest.version = version;
  }

  description(desc: string): this {
    this.manifest.description = desc;
    return this;
  }

  author(author: string): this {
    this.manifest.author = author;
    return this;
  }

  namespace(ns: string): this {
    this.manifest.namespace = ns;
    return this;
  }

  match(...patterns: string[]): this {
    this.manifest.match = [...(this.manifest.match || []), ...patterns];
    return this;
  }

  include(...patterns: string[]): this {
    this.manifest.include = [...(this.manifest.include || []), ...patterns];
    return this;
  }

  exclude(...patterns: string[]): this {
    this.manifest.exclude = [...(this.manifest.exclude || []), ...patterns];
    return this;
  }

  grant(...permissions: GrantPermission[]): this {
    this.manifest.grant = [...(this.manifest.grant || []), ...permissions];
    return this;
  }

  runAt(runAt: RunAt): this {
    this.manifest['run-at'] = runAt;
    return this;
  }

  icon(url: string): this {
    this.manifest.icon = url;
    return this;
  }

  homepage(url: string): this {
    this.manifest.homepage = url;
    return this;
  }

  require(...urls: string[]): this {
    this.manifest.require = [...(this.manifest.require || []), ...urls];
    return this;
  }

  resource(name: string, url: string): this {
    this.manifest.resource = [...(this.manifest.resource || []), { name, url }];
    return this;
  }

  updateURL(url: string): this {
    this.manifest.updateURL = url;
    return this;
  }

  downloadURL(url: string): this {
    this.manifest.downloadURL = url;
    return this;
  }

  connect(...domains: string[]): this {
    this.manifest.connect = [...(this.manifest.connect || []), ...domains];
    return this;
  }

  noframes(): this {
    this.manifest.noframes = true;
    return this;
  }

  injectInto(target: 'page' | 'content' | 'auto'): this {
    this.manifest['inject-into'] = target;
    return this;
  }

  build(): UserscriptManifest {
    if (!this.manifest.name || !this.manifest.version) {
      throw new Error('Manifest requires name and version');
    }
    return this.manifest as UserscriptManifest;
  }
}

/**
 * Create a new manifest builder
 */
export function createManifest(name: string, version: string): ManifestBuilder {
  return new ManifestBuilder(name, version);
}
