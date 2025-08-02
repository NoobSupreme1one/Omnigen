# WordPress Article Generator Setup Guide

This guide will help you set up and use the WordPress Article Generator feature in the BookGen application.

## Prerequisites

1. **WordPress Site**: You need a WordPress site with REST API enabled
2. **Application Password**: You'll need to create an application password in WordPress
3. **Gemini API Key**: Make sure you have a valid Google Gemini API key configured

## Setup Instructions

### 1. Create WordPress Application Password

1. Log into your WordPress admin dashboard
2. Go to **Users** → **Profile**
3. Scroll down to **Application Passwords**
4. Enter a name for your application (e.g., "BookGen Article Generator")
5. Click **Add New Application Password**
6. Copy the generated password (you won't be able to see it again)

### 2. Configure WordPress Connection

1. In BookGen, navigate to the **Articles** tab
2. If you haven't connected to WordPress yet, you'll see the configuration form
3. Enter your WordPress site URL (e.g., `https://yoursite.com`)
4. Enter your WordPress username
5. Enter the application password you created in step 1
6. Click **Connect to WordPress**

### 3. Generate Articles

Once connected, follow these steps:

1. **Select Category**: Click "Fetch Categories" to load your WordPress categories, then select one
2. **Fetch Articles**: Click "Fetch Articles" to load existing articles from the selected category
3. **Analyze Content**: Click "Analyze Content" to analyze your existing articles and generate topic suggestions
4. **Select Topic**: Choose from the AI-generated topic suggestions
5. **Generate Article**: The AI will create a new article based on your selected topic
6. **Generate Featured Image** (Optional): Create a featured image for your article
7. **Publish**: Review and edit the article, then publish it to WordPress

## Features

### Content Analysis
- Analyzes your existing WordPress articles
- Identifies writing style, tone, and common topics
- Generates SEO-friendly topic suggestions

### AI-Powered Article Generation
- Creates articles that match your site's style and tone
- Uses Google Gemini AI for high-quality content
- Generates SEO-optimized articles with proper HTML formatting

### Featured Image Generation
- Automatically creates featured images using AI
- Images are optimized for WordPress
- Supports various image styles and themes

### Article Editor
- Rich text editor for reviewing and editing generated content
- HTML formatting support
- Real-time preview

## Troubleshooting

### Connection Issues
- **Invalid URL**: Make sure your WordPress URL starts with `http://` or `https://`
- **Authentication Failed**: Verify your username and application password
- **REST API Disabled**: Ensure WordPress REST API is enabled on your site

### Article Generation Issues
- **API Key Missing**: Make sure your Gemini API key is configured
- **Quota Exceeded**: Check your Google Cloud billing and API quotas
- **Content Analysis Failed**: Ensure you have articles in the selected category

### Publishing Issues
- **Permission Denied**: Verify your WordPress user has publishing permissions
- **Category Not Found**: Make sure the category exists and is accessible
- **Image Upload Failed**: Check file size limits and media upload permissions

## Security Notes

- Application passwords are stored locally in your browser
- Never share your application password
- Use HTTPS for your WordPress site
- Regularly rotate your application passwords

## API Requirements

### WordPress REST API
- WordPress 4.7+ required
- REST API must be enabled
- User must have appropriate permissions

### Google Gemini API
- Valid API key required
- Sufficient quota for content generation
- Internet connection required

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your WordPress site is accessible
3. Test your Gemini API key separately
4. Check your WordPress site's error logs

For additional help, refer to the main BookGen documentation or create an issue in the project repository. 