# Development Guide

## Setup

### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
```

### First Time
```bash
git clone https://github.com/pv-udpv/perplexity-ai-plug.git
cd perplexity-ai-plug
npm install
npm run prepare  # Setup git hooks
```

## VSCode Configuration

**Recommended Extensions:**
- `dbaeumer.vscode-eslint` - Real-time linting
- `esbenp.prettier-vscode` - Code formatting
- `vitest.explorer` - Test explorer UI
- `ms-vscode.vscode-typescript-next` - Latest TypeScript
- `eamodio.gitlens` - Git integration
- `GitHub.copilot` - AI assistance
- `usernamehw.errorlens` - Inline errors

All configurations are automatically applied from `.vscode/` directory.

## Daily Workflow

### Development
```bash
# Terminal 1: Watch mode (auto-rebuild)
npm run build:watch

# Terminal 2: Test mode (auto-test)
npm run test:watch

# Terminal 3: Your editor
code .
```

### Before Commit
```bash
npm run ci  # All checks
```

### Committing
```bash
git add .
git commit -m "feat: description"
# Pre-commit hooks automatically run ESLint + Prettier
```

## Scripts Reference

### Building
```bash
npm run build          # Build once
npm run build:watch    # Watch for changes
npm run build:analyze  # Analyze bundle
```

### Testing
```bash
npm run test           # Watch mode
npm run test:unit      # Run once
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
npm run test:ci        # CI format (JUnit)
```

### Quality
```bash
npm run lint           # Check style
npm run lint:fix       # Auto-fix
npm run format         # Format all files
npm run type-check     # Type check
```

### Debugging
```bash
npm run debug -- --script my-script              # Debug script
npm run debug -- --script my-script --verbose   # Verbose debug
npm run profile -- --script my-script           # Profile performance
```

## Debugging

### Debug Script
```bash
npm run debug -- --script just-written

# Output:
# 🗐  Debugging just-written
# 📝 Name: Just Written
# 📌 Version: 1.0.0
# 🌐 Match: https://perplexity.ai/*
# 🔐 Grant: GM_getValue, GM_setValue
```

### Profile Performance
```bash
npm run profile -- --script just-written

# Runs 1000 iterations, shows timing and throughput
```

### VSCode Debugging
1. Open `.vscode/launch.json` (pre-configured)
2. Press `F5` or `Shift+Cmd+D`
3. Select "Debug Tests" or "Debug Build"
4. Set breakpoints and debug

## Project Structure

```
perplexity-ai-plug/
├── scripts/                  # Userscripts
│   ├── just-written/        # Template
│   ├── debug.ts             # Debug utility
│   └── profile.ts           # Performance profiler
├── .vscode/                 # VSCode config
│   ├── extensions.json      # Recommended extensions
│   ├── settings.json        # Workspace settings
│   └── launch.json          # Debug configurations
├── .github/workflows/       # CI/CD workflows
├── docs/                    # Documentation
└── .husky/                  # Git hooks
```

## Troubleshooting

### Tests fail in CI but pass locally
```bash
npm run test:ci
```

### Build fails
```bash
rm -rf node_modules
npm install
npm run type-check
npm run build
```

### Pre-commit hook not running
```bash
npx husky install
chmod +x .husky/*
```

## Git Workflow

### Before PR
```bash
git checkout -b feat/my-feature
# ... make changes ...
git add .
git commit -m "feat: description"
npm run ci  # All checks
git push origin feat/my-feature
# Create PR on GitHub
```

### Branch Protection
- ✅ All CI checks pass
- ✅ At least 1 review approval
- ✅ Branch up to date

## Performance Tips

- Use `npm run build:watch` for fast iteration
- Use `npm run test:watch` for TDD
- Profile slow scripts: `npm run profile -- --script my-script`
- Check bundle size: `npm run build:analyze`

## References

- [Vitest Documentation](https://vitest.dev/)
- [ESLint Documentation](https://eslint.org/)
- [Prettier Documentation](https://prettier.io/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Husky Git Hooks](https://typicode.github.io/husky/)

---

**Questions?** Check existing issues or read full documentation in `/docs/`
