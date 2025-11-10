# Contributing to Kelmah Platform

**IMPORTANT: Before contributing, you MUST read and sign the Contributor License Agreement (CLA).**

## ⚠️ Legal Requirements

### 1. Read the CLA
All contributors must read and agree to the [Contributor License Agreement](./CONTRIBUTOR_LICENSE_AGREEMENT.md) before any contributions can be accepted.

### 2. Sign the CLA
- Download the [CLA document](./CONTRIBUTOR_LICENSE_AGREEMENT.md)
- Fill out your information
- Sign and date the document
- Email the signed copy to: legal@kelmah.com
- Wait for confirmation before submitting contributions

### 3. Copyright and Ownership
- This is a **proprietary project** owned by Kelmah Platform
- All contributions become the **exclusive property** of Kelmah Platform
- You will **not retain ownership** of your contributions
- See [COPYRIGHT](./COPYRIGHT) for full ownership details

## 🔒 Confidentiality

### What You MUST Keep Confidential:
- All source code
- Architecture and design decisions
- Business logic and algorithms
- API specifications
- Database schemas
- Project roadmaps and plans
- Any discussions in private channels

### What You CANNOT Do:
- ❌ Share code or screenshots publicly
- ❌ Discuss the project on social media
- ❌ Fork the repository for personal use
- ❌ Use project code in other projects
- ❌ Share repository access with others
- ❌ Create competing products using project knowledge

## 👥 Team Collaboration Guidelines

### Access Levels

**Frontend Contributors:**
- Access to frontend codebase only
- Cannot access backend code
- Cannot see deployment configurations
- Cannot access production environment

**Repository Rules:**
- Do NOT clone the entire repository to your personal GitHub
- Do NOT create public forks
- Do NOT share access credentials
- Work only on assigned features/bugs

## 🚀 Development Workflow

### 1. Getting Started
```bash
# You will receive access to a specific branch
git clone [repository-url]
cd kelmah-frontend

# Install dependencies
npm install

# Create your feature branch from the assigned base branch
git checkout -b feature/your-feature-name
```

### 2. Making Changes
```bash
# Make your changes in the frontend directory only
# Stay within: kelmah-frontend/

# Test your changes
npm test
npm run lint

# Commit with clear messages
git add .
git commit -m "feat: your clear description"
```

### 3. Submitting Contributions
```bash
# Push to your feature branch
git push origin feature/your-feature-name

# Create a Pull Request with:
# - Clear description of changes
# - Screenshots if UI changes
# - Reference to issue/task number
```

### 4. Code Review Process
- All PRs require owner approval
- Address all review comments
- Do not merge your own PRs
- PRs may be rejected without explanation

## 📋 Contribution Standards

### Code Quality
- Follow existing code style and patterns
- Write clear, self-documenting code
- Add comments for complex logic
- Ensure all tests pass
- No console.log statements in production code

### Commit Messages
Follow conventional commits format:
```
feat: add new worker search filter
fix: resolve dashboard loading issue
docs: update component documentation
style: format code according to guidelines
refactor: restructure user profile component
test: add tests for job application flow
```

### Pull Request Template
```markdown
## Description
[Clear description of what this PR does]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Code refactoring
- [ ] Documentation update

## Testing
- [ ] All existing tests pass
- [ ] Added new tests for new features
- [ ] Tested on multiple browsers
- [ ] Tested responsive design

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] CLA signed and on file
```

## 🔐 Security Guidelines

### What to NEVER Commit:
- API keys or secrets
- Database credentials
- Environment variables with sensitive data
- Personal access tokens
- AWS or cloud provider credentials
- Test user passwords

### Use Environment Variables:
```javascript
// ✅ Good
const apiKey = process.env.REACT_APP_API_KEY;

// ❌ Bad
const apiKey = "sk_live_abc123xyz";
```

## 🚫 Prohibited Actions

You will be **immediately removed** and face **legal action** if you:

1. **Copy or steal code** for use in other projects
2. **Share repository access** with unauthorized persons
3. **Fork the project** for personal or commercial use
4. **Create competing products** using project knowledge
5. **Leak confidential information** publicly
6. **Bypass access controls** or access unauthorized code
7. **Remove copyright notices** or attribution
8. **Claim ownership** of the project or contributions

## ⚖️ Legal Consequences

Violations may result in:
- Immediate termination of access
- Civil litigation for damages
- Criminal prosecution
- Injunctive relief
- Recovery of legal fees
- Claims for actual and punitive damages

## 📞 Questions?

### Technical Questions:
- Create an issue in the repository
- Ask in the team chat (if provided)
- Email: dev@kelmah.com

### Legal Questions:
- Email: legal@kelmah.com
- Do NOT proceed with contributions until questions are resolved

### Access Issues:
- Email: admin@kelmah.com
- Include your GitHub username

## 📜 Additional Documents

Please review these documents before contributing:
- [LICENSE](./LICENSE) - Full license terms
- [COPYRIGHT](./COPYRIGHT) - Copyright and ownership notice
- [CONTRIBUTOR_LICENSE_AGREEMENT.md](./CONTRIBUTOR_LICENSE_AGREEMENT.md) - CLA to sign
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) - Expected behavior
- [SECURITY.md](./SECURITY.md) - Security policies

## ✅ Acknowledgment

By contributing to this project, you acknowledge that you have:
- Read and understood the CLA
- Signed and submitted the CLA
- Read and agreed to the LICENSE terms
- Understood the COPYRIGHT ownership
- Agreed to keep all project information confidential
- Agreed to the non-compete terms
- Understood the legal consequences of violations

---

**Thank you for contributing to Kelmah Platform! Your cooperation in following these guidelines helps protect the project and everyone involved.**

Last Updated: November 10, 2025
