# Kelmah Platform - Frontend Development Repository

> ⚠️ **IMPORTANT:** This is a **PRIVATE** and **PROPRIETARY** repository. All code is confidential. By accessing this repository, you agree to the terms in [CONTRIBUTOR_LICENSE_AGREEMENT.md](./CONTRIBUTOR_LICENSE_AGREEMENT.md).

## 🔒 Legal Notice

**Copyright © 2025 Kelmah Platform. All Rights Reserved.**

This repository contains proprietary and confidential source code. Unauthorized use, copying, distribution, or disclosure is strictly prohibited and may result in legal action.

**Before contributing, you MUST:**
1. Read the [LICENSE](./LICENSE)
2. Read the [COPYRIGHT](./COPYRIGHT) notice
3. Sign the [Contributor License Agreement](./CONTRIBUTOR_LICENSE_AGREEMENT.md)
4. Read [CONTRIBUTING.md](./CONTRIBUTING.md) guidelines

---

## 📋 Project Overview

**Kelmah** is a comprehensive platform connecting vocational job seekers (carpenters, masons, plumbers, electricians, etc.) with potential hirers in Ghana.

**This repository contains:** Frontend code only (React application)  
**You do NOT have access to:** Backend code, APIs, database schemas, deployment configs

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Git
- Code editor (VS Code recommended)
- **Signed CLA on file**

### Setup

```bash
# Clone repository (you should have received access)
git clone https://github.com/Tonyeligate/Kelmah-Frontend-Team.git
cd Kelmah-Frontend-Team/kelmah-frontend

# Install dependencies
npm install

# Copy environment template
copy .env.example .env

# Start development server
npm start
```

The application will open at `http://localhost:3000`

### Available Scripts

```bash
npm start          # Start development server
npm test           # Run tests
npm run build      # Create production build
npm run lint       # Check code style
npm run lint:fix   # Fix code style issues
npm run format     # Format code with Prettier
```

---

## 📁 Repository Structure

```
kelmah-frontend/
├── public/              # Static files
├── src/
│   ├── modules/         # Feature modules (auth, jobs, workers, etc.)
│   ├── components/      # Shared React components
│   ├── assets/          # Images, fonts, etc.
│   ├── config/          # Frontend configuration
│   ├── utils/           # Utility functions
│   ├── hooks/           # Custom React hooks
│   └── store/           # Redux store
├── .env.example         # Environment variables template
└── package.json         # Dependencies
```

---

## 🛠️ Development Workflow

### 1. Get Assignment

You will be assigned specific tasks/features through GitHub Issues.

### 2. Create Feature Branch

```bash
# Always branch from main
git checkout main
git pull origin main

# Create your feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

**Branch Naming Convention:**
- `feature/worker-search-filter` - New features
- `fix/dashboard-loading-issue` - Bug fixes
- `refactor/profile-component` - Code refactoring
- `docs/update-readme` - Documentation updates

### 3. Make Changes

- Work ONLY in the `kelmah-frontend/` directory
- Follow existing code patterns and styles
- Write clean, commented code
- Test your changes thoroughly

### 4. Commit Your Work

```bash
# Stage your changes
git add .

# Commit with clear message
git commit -m "feat: add worker availability filter"

# Push to your branch
git push origin feature/your-feature-name
```

**Commit Message Format:**
```
type: short description

[optional body]
[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, styling
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance

### 5. Create Pull Request

1. Go to GitHub repository
2. Click "New Pull Request"
3. Select your branch
4. Fill out the PR template completely
5. Request review from project owner
6. Wait for approval - **DO NOT MERGE**

### 6. Address Review Comments

- Make requested changes
- Push updates to your branch
- Request re-review
- PR will be merged by owner after approval

---

## 📐 Code Standards

### Code Style

- **JavaScript:** ES6+ features
- **React:** Functional components with hooks
- **Formatting:** Prettier (runs automatically)
- **Linting:** ESLint (must pass before PR)

### File Naming

- Components: `PascalCase.jsx` (e.g., `WorkerCard.jsx`)
- Utilities: `camelCase.js` (e.g., `formatDate.js`)
- Styles: `ComponentName.module.css`

### Component Structure

```javascript
/**
 * Component description
 * @param {Object} props - Component props
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './ComponentName.module.css';

const ComponentName = ({ prop1, prop2 }) => {
  // State and hooks
  const [state, setState] = useState(null);
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // Handlers
  const handleAction = () => {
    // Handler logic
  };
  
  // Render
  return (
    <div className={styles.container}>
      {/* JSX */}
    </div>
  );
};

ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};

export default ComponentName;
```

---

## 🧪 Testing

### Writing Tests

All new features must include tests:

```javascript
// ComponentName.test.jsx
import { render, screen } from '@testing-library/react';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

**Requirements:**
- All tests must pass before PR submission
- Aim for 80%+ code coverage on new code

---

## 🎨 UI/UX Guidelines

### Design System

**Colors:**
- Primary: Black (#1a1a1a)
- Secondary: Gold (#D4AF37)
- Background: White (#ffffff)
- Text: Dark Gray (#333333)

**Typography:**
- Headings: Montserrat (bold)
- Body: Roboto (regular)
- Code: Roboto Mono

**Spacing:**
- Use multiples of 8px (8, 16, 24, 32, etc.)

### Responsive Design

Test on:
- Mobile: 375px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

```javascript
// Use Material-UI breakpoints
import { useMediaQuery, useTheme } from '@mui/material';

const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
```

---

## 🚫 What NOT to Do

### Prohibited Actions

**You MUST NOT:**
- ❌ Access or request backend code
- ❌ Commit API keys or secrets
- ❌ Fork this repository
- ❌ Share repository access with others
- ❌ Use project code in other projects
- ❌ Discuss project details publicly
- ❌ Create public forks or copies
- ❌ Bypass branch protection rules
- ❌ Merge your own pull requests
- ❌ Remove copyright notices

**Violations will result in:**
- Immediate access revocation
- Legal action
- Damages claims

---

## 📞 Support & Communication

### Getting Help

**Technical Questions:**
- Create an issue with "Question" label
- Ask in team chat (if provided)
- Email: dev@kelmah.com

**Access Issues:**
- Email: admin@kelmah.com
- Include your GitHub username

**Legal Questions:**
- Email: legal@kelmah.com

### Communication Channels

- **GitHub Issues:** Task tracking and technical discussions
- **Pull Requests:** Code review and feedback
- **Email:** Administrative and legal matters

---

## 📚 Additional Resources

### Documentation

- [Contributing Guidelines](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Style Guide](./docs/STYLE_GUIDE.md)
- [Component Library](./docs/COMPONENTS.md)

### External Resources

- [React Documentation](https://react.dev)
- [Material-UI Documentation](https://mui.com)
- [Redux Toolkit](https://redux-toolkit.js.org)

---

## ✅ Before Your First Contribution

Make sure you have:

- [ ] Read and signed the CLA
- [ ] Read the LICENSE file
- [ ] Read the COPYRIGHT notice
- [ ] Read CONTRIBUTING.md
- [ ] Set up your development environment
- [ ] Successfully run the project locally
- [ ] Run tests successfully
- [ ] Understood the code standards
- [ ] Know how to create proper commits and PRs

---

## 🙏 Acknowledgments

Thank you for contributing to Kelmah Platform! Your work helps connect vocational workers with opportunities across Ghana.

**Remember:** This is a professional project with legal protections. Always follow the guidelines and maintain confidentiality.

---

## 📄 License

This project is proprietary and confidential. See [LICENSE](./LICENSE) for details.

**Copyright © 2025 Kelmah Platform. All Rights Reserved.**

---

Last Updated: November 10, 2025
