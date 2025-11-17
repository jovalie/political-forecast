# GitHub Pages Deployment Guide

This project is configured to deploy automatically to GitHub Pages.

## Current Setup

- **Repository**: `jovalie/political-forecast`
- **Deployment URL**: `https://jovalie.github.io/political-forecast/`
- **Deployment Method**: GitHub Actions (automated)

## How It Works

1. **Automatic Deployment**: When you push to the `main` branch, the deployment workflow automatically builds and deploys the site.

2. **Data Updates**: The data ingestion workflow runs every 12 hours and updates `public/data/states-topics.json`. When data is updated, it commits and pushes the changes, which triggers a new deployment.

3. **Manual Deployment**: You can also trigger deployment manually from the GitHub Actions tab.

## Initial Setup Steps

To enable GitHub Pages for this repository:

1. **Enable GitHub Pages**:
   - Go to your repository on GitHub: `https://github.com/jovalie/political-forecast`
   - Navigate to **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - Save the settings

2. **Push the deployment workflow**:
   - The `.github/workflows/deploy.yml` file is already configured
   - Push your changes to the `main` branch
   - The workflow will run automatically

3. **Verify deployment**:
   - Go to the **Actions** tab in your repository
   - You should see the "Deploy to GitHub Pages" workflow running
   - Once complete, your site will be available at: `https://jovalie.github.io/political-forecast/`

## Deployment to Root Domain (jovalie.github.io)

If you want to deploy this project to `https://jovalie.github.io` (instead of the subdirectory), you have two options:

### Option 1: Rename Repository (Recommended)
1. Rename the repository from `political-forecast` to `jovalie.github.io`
2. Update `vite.config.js` to set `base: '/'` instead of `'/political-forecast/'`
3. Push the changes

### Option 2: Use Existing jovalie.github.io Repository
1. If you already have a `jovalie.github.io` repository with other content:
   - You can copy the built `dist` folder contents to that repository
   - Or set up a separate workflow that deploys to that repository

## Configuration Files

- **`.github/workflows/deploy.yml`**: GitHub Actions workflow for building and deploying
- **`vite.config.js`**: Vite configuration with base path for GitHub Pages
- **`.github/workflows/data-ingestion.yml`**: Data ingestion workflow (triggers deployment on data updates)

## Troubleshooting

### Site Not Updating
- Check the **Actions** tab to see if the deployment workflow ran successfully
- Verify that GitHub Pages is enabled in repository settings
- Check that the base path in `vite.config.js` matches your repository name

### Assets Not Loading
- Ensure the `base` path in `vite.config.js` is correct
- For repository `political-forecast`, base should be `/political-forecast/`
- For repository `jovalie.github.io`, base should be `/`

### Build Failures
- Check the workflow logs in the **Actions** tab
- Verify all dependencies are listed in `package.json`
- Ensure Node.js version matches (currently set to 20)

## Manual Deployment

To manually trigger a deployment:

1. Go to **Actions** tab in GitHub
2. Select **Deploy to GitHub Pages** workflow
3. Click **Run workflow** → **Run workflow**

## Local Testing

To test the production build locally:

```bash
npm run build
npm run preview
```

This will build the project and serve it locally, simulating the GitHub Pages environment.

