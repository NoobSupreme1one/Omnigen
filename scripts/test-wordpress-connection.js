#!/usr/bin/env node

// WordPress Connection Test Script
// Run with: node scripts/test-wordpress-connection.js

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testWordPressConnection() {
  console.log('🔧 WordPress Connection Troubleshooter\n');
  
  try {
    // Get user input
    const url = await question('Enter your WordPress URL (e.g., https://yoursite.com): ');
    const username = await question('Enter your WordPress username: ');
    const appPassword = await question('Enter your Application Password (xxxx xxxx xxxx xxxx): ');
    
    console.log('\n🧪 Running connection tests...\n');
    
    // Test 1: Basic URL validation
    console.log('1️⃣ Testing URL format...');
    try {
      const urlObj = new URL(url);
      console.log('   ✅ URL format is valid');
      console.log(`   📍 Protocol: ${urlObj.protocol}`);
      console.log(`   📍 Host: ${urlObj.host}`);
      
      if (urlObj.protocol === 'http:') {
        console.log('   ⚠️  Warning: Using HTTP instead of HTTPS');
      }
    } catch (error) {
      console.log('   ❌ Invalid URL format');
      console.log(`   💡 Make sure to include http:// or https://`);
      return;
    }
    
    // Test 2: Site accessibility
    console.log('\n2️⃣ Testing site accessibility...');
    try {
      const response = await fetch(url, { method: 'HEAD' });
      console.log(`   ✅ Site is accessible (Status: ${response.status})`);
    } catch (error) {
      console.log('   ❌ Cannot reach site');
      console.log(`   💡 Error: ${error.message}`);
      console.log('   💡 Check if your site is online and accessible');
    }
    
    // Test 3: REST API availability
    console.log('\n3️⃣ Testing WordPress REST API...');
    try {
      const apiUrl = `${url.replace(/\/$/, '')}/wp-json/wp/v2`;
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ WordPress REST API is available');
        console.log(`   📍 Namespace: ${data.namespace || 'wp/v2'}`);
        console.log(`   📍 Routes: ${Object.keys(data.routes || {}).length} available`);
      } else if (response.status === 404) {
        console.log('   ❌ WordPress REST API not found (404)');
        console.log('   💡 SOLUTION: Go to WordPress Admin → Settings → Permalinks');
        console.log('   💡 Change from "Plain" to any other option (like "Post name")');
        console.log('   💡 Click "Save Changes" and try again');
      } else {
        console.log(`   ❌ REST API error (Status: ${response.status})`);
      }
    } catch (error) {
      console.log('   ❌ Failed to access REST API');
      console.log(`   💡 Error: ${error.message}`);
    }
    
    // Test 4: Authentication
    console.log('\n4️⃣ Testing authentication...');
    try {
      const credentials = Buffer.from(`${username}:${appPassword}`).toString('base64');
      const authUrl = `${url.replace(/\/$/, '')}/wp-json/wp/v2/users/me`;
      
      const response = await fetch(authUrl, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('   ✅ Authentication successful');
        console.log(`   📍 User: ${userData.name} (ID: ${userData.id})`);
        console.log(`   📍 Roles: ${userData.roles?.join(', ') || 'Unknown'}`);
        console.log(`   📍 Email: ${userData.email || 'Not provided'}`);
      } else if (response.status === 401) {
        console.log('   ❌ Authentication failed (401 Unauthorized)');
        console.log('   💡 SOLUTION: Check your credentials');
        console.log('   💡 1. Verify username is correct (not email)');
        console.log('   💡 2. Generate new Application Password in WordPress Admin');
        console.log('   💡 3. Go to Users → Profile → Application Passwords');
        console.log('   💡 4. Copy password exactly as shown (with spaces)');
      } else if (response.status === 403) {
        console.log('   ❌ Access forbidden (403)');
        console.log('   💡 SOLUTION: User needs proper permissions');
        console.log('   💡 Ensure user has "Editor" or "Administrator" role');
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Authentication error (Status: ${response.status})`);
        console.log(`   💡 Response: ${errorText.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log('   ❌ Authentication test failed');
      console.log(`   💡 Error: ${error.message}`);
    }
    
    // Test 5: Post creation permissions
    console.log('\n5️⃣ Testing post creation permissions...');
    try {
      const credentials = Buffer.from(`${username}:${appPassword}`).toString('base64');
      const postsUrl = `${url.replace(/\/$/, '')}/wp-json/wp/v2/posts`;
      
      const testPost = {
        title: 'BookGen Connection Test',
        content: 'This is a test post to verify permissions. It will be deleted automatically.',
        status: 'draft'
      };
      
      const response = await fetch(postsUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPost)
      });
      
      if (response.ok) {
        const postData = await response.json();
        console.log('   ✅ Can create posts');
        console.log(`   📍 Test post created (ID: ${postData.id})`);
        
        // Clean up test post
        const deleteResponse = await fetch(`${postsUrl}/${postData.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${credentials}`,
          }
        });
        
        if (deleteResponse.ok) {
          console.log('   🧹 Test post cleaned up');
        }
      } else if (response.status === 403) {
        console.log('   ❌ Cannot create posts (403 Forbidden)');
        console.log('   💡 SOLUTION: User needs "publish_posts" capability');
        console.log('   💡 Ensure user has "Editor" or "Administrator" role');
      } else {
        console.log(`   ⚠️  Post creation test inconclusive (Status: ${response.status})`);
      }
    } catch (error) {
      console.log('   ⚠️  Post creation test failed');
      console.log(`   💡 Error: ${error.message}`);
    }
    
    // Test 6: Check common endpoints
    console.log('\n6️⃣ Testing common endpoints...');
    const endpoints = [
      { name: 'Categories', path: '/wp-json/wp/v2/categories' },
      { name: 'Tags', path: '/wp-json/wp/v2/tags' },
      { name: 'Media', path: '/wp-json/wp/v2/media' }
    ];
    
    const credentials = Buffer.from(`${username}:${appPassword}`).toString('base64');
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${url.replace(/\/$/, '')}${endpoint.path}`, {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ ${endpoint.name}: ${Array.isArray(data) ? data.length : 'Available'} items`);
        } else {
          console.log(`   ⚠️  ${endpoint.name}: Status ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint.name}: ${error.message}`);
      }
    }
    
    console.log('\n🎯 Summary:');
    console.log('If all tests pass, your WordPress site should work with BookGen.');
    console.log('If any tests fail, follow the solutions provided above.');
    console.log('\n📚 Additional Resources:');
    console.log('• WordPress REST API: https://developer.wordpress.org/rest-api/');
    console.log('• Application Passwords: https://wordpress.org/support/article/application-passwords/');
    console.log('• Permalinks: https://wordpress.org/support/article/using-permalinks/');
    
  } catch (error) {
    console.log(`\n❌ Test failed: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Run the test
testWordPressConnection().catch(console.error);
