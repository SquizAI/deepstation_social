# Contributing to DeepStation

First off, thank you for considering contributing to DeepStation! 🎉

It's people like you that make DeepStation such a great tool for the community.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Guidelines](#coding-guidelines)
- [Commit Messages](#commit-messages)
- [Community](#community)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

**Our Pledge:**
- Be respectful and inclusive
- Welcome newcomers
- Focus on what's best for the community
- Show empathy towards others

## 🤝 How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**When submitting a bug report, include:**
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, Node version)

**Use this template:**
```markdown
## Bug Description
[Clear description of the bug]

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
[What you expected to happen]

## Actual Behavior
[What actually happened]

## Environment
- OS: [e.g., macOS 13.0]
- Browser: [e.g., Chrome 119]
- Node: [e.g., 20.10.0]
- DeepStation version: [e.g., 1.0.0]

## Screenshots
[If applicable]
```

### 💡 Suggesting Features

Feature suggestions are welcome! Please provide:
- Clear use case
- Expected behavior
- Why this benefits users
- Any implementation ideas

**Use this template:**
```markdown
## Feature Description
[Clear description of the feature]

## Use Case
[Why is this needed? What problem does it solve?]

## Proposed Solution
[How should it work?]

## Alternatives Considered
[What other solutions did you consider?]

## Additional Context
[Screenshots, mockups, examples from other tools]
```

### 📝 Improving Documentation

Documentation improvements are always appreciated:
- Fix typos or clarify existing docs
- Add examples or tutorials
- Improve API documentation
- Translate documentation

### 💻 Contributing Code

1. **Find an Issue**: Look for issues labeled `good first issue` or `help wanted`
2. **Comment**: Let others know you're working on it
3. **Fork & Branch**: Create a feature branch
4. **Code**: Follow our coding guidelines
5. **Test**: Ensure all tests pass
6. **Submit**: Open a pull request

## 🛠️ Development Setup

### Prerequisites

- Node.js 20+
- npm or yarn
- Git
- Supabase account
- API keys (OpenAI, social platforms)

### Setup Steps

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/deepstation.git
cd deepstation

# 3. Add upstream remote
git remote add upstream https://github.com/yourusername/deepstation.git

# 4. Install dependencies
npm install

# 5. Copy environment variables
cp .env.local.example .env.local

# 6. Add your API keys to .env.local

# 7. Run development server
npm run dev
```

### Project Structure

```
deepstation/
├── app/                  # Next.js app directory
│   ├── api/             # API routes
│   ├── dashboard/       # Dashboard pages
│   └── auth/            # Auth pages
├── components/          # React components
├── lib/                 # Business logic
│   ├── ai/             # AI integrations
│   ├── publishing/     # Platform publishers
│   └── supabase/       # Database clients
├── supabase/           # Supabase config
│   ├── functions/      # Edge Functions
│   └── migrations/     # Database migrations
└── docs/               # Documentation
```

## 🔄 Pull Request Process

### Before Submitting

- ✅ Code follows project style guidelines
- ✅ All tests pass (`npm run test`)
- ✅ No linting errors (`npm run lint`)
- ✅ Build succeeds (`npm run build`)
- ✅ Documentation updated (if needed)
- ✅ Commit messages follow convention

### Submitting a PR

1. **Update from main:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Create descriptive PR title:**
   ```
   feat: add Instagram video support
   fix: resolve timezone issue in scheduler
   docs: update deployment guide
   ```

3. **Fill out PR template:**
   - What changes were made
   - Why the changes were necessary
   - How to test the changes
   - Related issues

4. **Request review:**
   - Tag relevant maintainers
   - Respond to feedback promptly
   - Make requested changes

### PR Template

```markdown
## Description
[Brief description of changes]

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
[Describe the tests you ran]

## Screenshots (if applicable)
[Add screenshots]

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Related Issues
Closes #[issue number]
```

## 📝 Coding Guidelines

### TypeScript

- Use TypeScript for all new code
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Export types for reusability

```typescript
// Good
interface User {
  id: string;
  email: string;
  createdAt: Date;
}

// Avoid
const user: any = { ... };
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop typing

```typescript
// Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

### File Naming

- Components: `PascalCase.tsx` (e.g., `PostEditor.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Hooks: `use*.ts` (e.g., `useAuth.ts`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `API_ENDPOINTS`)

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Use trailing commas in objects/arrays
- Keep lines under 100 characters

**Run linter before committing:**
```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

### Comments

- Write self-documenting code
- Comment "why", not "what"
- Use JSDoc for functions/components
- Remove commented-out code

```typescript
// Good
/**
 * Publishes a post to multiple platforms simultaneously
 * @param post - The post content and metadata
 * @returns Publishing results for each platform
 */
async function publishPost(post: Post): Promise<PublishResults> {
  // Use Promise.allSettled to handle partial failures gracefully
  return await Promise.allSettled([...]);
}

// Avoid
// This function publishes posts
function publishPost(post) {
  // Loop through platforms
  for (let platform of platforms) {
    // Publish to each one
  }
}
```

## 📦 Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, missing semicolons)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples

```bash
feat(publishing): add Instagram video support

- Implement video upload to Instagram API
- Add video validation and compression
- Update UI to handle video files

Closes #123

---

fix(scheduler): resolve timezone conversion bug

The scheduler was using UTC instead of user's timezone
when scheduling posts, causing posts to be published
at incorrect times.

Fixes #456

---

docs(readme): update installation instructions

- Clarify Supabase setup steps
- Add troubleshooting section
- Fix broken links
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test PostEditor.test.tsx

# Run with coverage
npm test -- --coverage
```

### Writing Tests

- Test user-facing behavior, not implementation
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PostEditor } from './PostEditor';

describe('PostEditor', () => {
  it('should update character count when typing', () => {
    // Arrange
    render(<PostEditor />);
    const textarea = screen.getByRole('textbox');

    // Act
    fireEvent.change(textarea, { target: { value: 'Hello' } });

    // Assert
    expect(screen.getByText('5/280')).toBeInTheDocument();
  });
});
```

## 🌍 Community

### Get Help

- 💬 [Discord](https://discord.gg/deepstation) - Chat with the community
- 💭 [GitHub Discussions](https://github.com/yourusername/deepstation/discussions) - Ask questions
- 🐛 [GitHub Issues](https://github.com/yourusername/deepstation/issues) - Report bugs

### Stay Updated

- ⭐ Star the repository
- 👀 Watch for releases
- 🐦 Follow [@deepstation](https://twitter.com/deepstation)

## 🎯 Good First Issues

New to the project? Look for issues labeled:
- `good first issue` - Perfect for beginners
- `help wanted` - We need your help!
- `documentation` - Improve docs

## 🏆 Recognition

All contributors will be:
- Listed in our README
- Mentioned in release notes
- Added to our all-contributors list

## 📞 Questions?

Don't hesitate to ask! We're here to help:
- Open a discussion on GitHub
- Join our Discord
- Tag maintainers in issues

---

**Thank you for contributing to DeepStation! 🚀**

Together, we're making social media management effortless for everyone.

---

**Remember:** The best contribution is the one that helps others. Whether it's a bug fix, feature, or documentation improvement - every contribution matters! ❤️
