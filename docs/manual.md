# GitHub Manual

## Introduction

This manual is designed for beginners who are new to GitHub. It provides step-by-step instructions on how to use GitHub for version control, collaboration, and project management, with a focus on branches, proper practices, commits, version control, pull requests, and forks.

---

## Table of Contents

1. [What is GitHub?](#what-is-github)
2. [Setting Up GitHub](#setting-up-github)
3. [Branches and Version Control](#branches-and-version-control)
4. [Proper Commit Practices](#proper-commit-practices)
5. [Making a Pull Request](#making-a-pull-request)
6. [Forking a Repository](#forking-a-repository)
7. [Collaborating on GitHub](#collaborating-on-github)
8. [Troubleshooting](#troubleshooting)

---

## What is GitHub?

GitHub is a platform for hosting and collaborating on code. It uses Git, a version control system, to track changes in your projects. GitHub allows multiple people to work on the same project simultaneously.

---

## Setting Up GitHub

### 1. Create a GitHub Account

1. Go to [GitHub](https://github.com).
2. Click on **Sign up**.
3. Fill in your details and create an account.

### 2. Install Git

1. Download Git from [git-scm.com](https://git-scm.com/).
2. Follow the installation instructions for your operating system.

### 3. Configure Git

Run the following commands in your terminal to set up your username and email:

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

---

## Branches and Version Control

### What are Branches?

Branches allow you to work on different features or fixes without affecting the main codebase. The default branch is usually called `main` or `master`.

### Creating a Branch

To create a new branch:

```bash
git branch <branch-name>
```

### Switching to a Branch

To switch to a branch:

```bash
git checkout <branch-name>
```

### Merging Branches

To merge a branch into the main branch:

1. Switch to the main branch:
   ```bash
   git checkout main
   ```
2. Merge the feature branch:
   ```bash
   git merge <branch-name>
   ```

### Deleting a Branch

To delete a branch after merging:

```bash
git branch -d <branch-name>
```

---

## Proper Commit Practices

### Writing Good Commit Messages

1. Use a short, descriptive title (50 characters or less).
2. Add a detailed description if necessary.
3. Use the imperative mood (e.g., "Add feature" instead of "Added feature").

### Staging Changes

Add specific files to the staging area:

```bash
git add <file-name>
```

Or add all changes:

```bash
git add .
```

### Committing Changes

Save your changes with a message:

```bash
git commit -m "Your commit message"
```

### Best Practices

- Commit often, but only when the code is in a working state.
- Group related changes into a single commit.
- Avoid committing large, unrelated changes.

---

## Making a Pull Request

### What is a Pull Request?

A pull request (PR) is a way to propose changes to a repository. It allows others to review and discuss your changes before merging them.

### Steps to Create a Pull Request

1. Push your changes to your branch:
   ```bash
   git push origin <branch-name>
   ```
2. Go to the repository on GitHub.
3. Click **Pull Requests** > **New Pull Request**.
4. Select your branch and the branch you want to merge into (e.g., `main`).
5. Add a title and description, then click **Create Pull Request**.

---

## Forking a Repository

### What is Forking?

Forking creates a copy of a repository in your GitHub account. It allows you to make changes without affecting the original repository.

### Steps to Fork a Repository

1. Go to the repository on GitHub.
2. Click **Fork** in the top-right corner.
3. The repository will be copied to your account.

### Cloning Your Fork

To work on your fork locally:

```bash
git clone <your-fork-url>
```

---

## Collaborating on GitHub

### Syncing Your Fork

To keep your fork up-to-date with the original repository:

1. Add the original repository as a remote:
   ```bash
   git remote add upstream <original-repo-url>
   ```
2. Fetch the latest changes:
   ```bash
   git fetch upstream
   ```
3. Merge the changes into your branch:
   ```bash
   git merge upstream/main
   ```

### Resolving Merge Conflicts

If there are conflicts, Git will mark them in the affected files. Open the files, resolve the conflicts, and then:

```bash
git add <file-name>
git commit
```

---

## Troubleshooting

### Common Issues

- **Authentication Failed**: Ensure your username and password are correct.
- **Merge Conflicts**: Resolve conflicts in your code editor and commit the changes.

### Resources

- [GitHub Docs](https://docs.github.com/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

---

## Conclusion

This manual provides the basics to get started with GitHub, focusing on branches, commits, version control, pull requests, and forks. For more advanced features, explore GitHub's documentation and tutorials.
