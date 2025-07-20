/**
 * Test script to verify Offcloud deletion endpoints individually
 * This will help determine which deletion method works best
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const API_KEY = 'ZIZ63dPCgvpy5xC1BNopUUQgFfDfzjw9';
const TEST_REQUEST_ID = '687c464c70af281d65927375';

class OffcloudDeletionTester {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://offcloud.com';
  }

  makeRequest(method, url, data = null) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      };

      if (data && method === 'POST') {
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        options.headers['Content-Length'] = Buffer.byteLength(data);
      }

      const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve({ statusCode: res.statusCode, body: parsed });
          } catch {
            resolve({ statusCode: res.statusCode, body: body });
          }
        });
      });

      req.on('error', reject);
      
      if (data && method === 'POST') {
        req.write(data);
      }
      
      req.end();
    });
  }

  /**
   * Test Method 1: GET request to remove endpoint
   */
  async testMethod1(requestId) {
    console.log('\n=== Testing Method 1: GET /cloud/remove/{requestId} ===');
    try {
      const url = `${this.baseURL}/cloud/remove/${requestId}?key=${this.apiKey}`;
      console.log(`URL: ${url}`);
      
      const response = await this.makeRequest('GET', url);
      
      console.log(`Status: ${response.statusCode}`);
      console.log(`Response:`, response.body);
      return { success: response.statusCode === 200, data: response.body, method: 'GET' };
    } catch (error) {
      console.log(`Error:`, error.message);
      return { success: false, error: error.message, method: 'GET' };
    }
  }

  /**
   * Test Method 2: POST to cloud/delete with form data
   */
  async testMethod2(requestId) {
    console.log('\n=== Testing Method 2: POST /cloud/delete ===');
    try {
      const url = `${this.baseURL}/api/cloud/delete?key=${this.apiKey}`;
      console.log(`URL: ${url}`);
      
      const formData = `requestId=${encodeURIComponent(requestId)}`;
      const response = await this.makeRequest('POST', url, formData);
      
      console.log(`Status: ${response.statusCode}`);
      console.log(`Response:`, response.body);
      return { success: response.statusCode === 200, data: response.body, method: 'POST_FORM' };
    } catch (error) {
      console.log(`Error:`, error.message);
      return { success: false, error: error.message, method: 'POST_FORM' };
    }
  }

  /**
   * Test Method 3: POST to cloud/remove/{requestId}
   */
  async testMethod3(requestId) {
    console.log('\n=== Testing Method 3: POST /cloud/remove/{requestId} ===');
    try {
      const url = `${this.baseURL}/api/cloud/remove/${requestId}?key=${this.apiKey}`;
      console.log(`URL: ${url}`);
      
      const response = await this.makeRequest('POST', url);
      
      console.log(`Status: ${response.statusCode}`);
      console.log(`Response:`, response.body);
      return { success: response.statusCode === 200, data: response.body, method: 'POST_DIRECT' };
    } catch (error) {
      console.log(`Error:`, error.message);
      return { success: false, error: error.message, method: 'POST_DIRECT' };
    }
  }

  /**
   * Run all deletion tests
   */
  async runAllTests(requestId) {
    console.log(`Testing deletion methods for request ID: ${requestId}`);
    console.log('=' .repeat(60));

    const results = [];

    // Test each method
    results.push(await this.testMethod1(requestId));
    results.push(await this.testMethod2(requestId));
    results.push(await this.testMethod3(requestId));

    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('SUMMARY:');
    console.log('=' .repeat(60));

    results.forEach((result, index) => {
      const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
      console.log(`Method ${index + 1} (${result.method}): ${status}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });

    // Recommendation
    const workingMethods = results.filter(r => r.success);
    if (workingMethods.length > 0) {
      console.log(`\nRECOMMENDATION: Use ${workingMethods[0].method} method`);
    } else {
      console.log('\nNOTE: No methods worked - check API key and request ID');
    }

    return results;
  }
}

// Main execution
async function main() {
  if (API_KEY === 'YOUR_API_KEY_HERE' || TEST_REQUEST_ID === 'TEST_REQUEST_ID_HERE') {
    console.log('❌ Please update API_KEY and TEST_REQUEST_ID constants in this file');
    console.log('You can get your API key from: https://offcloud.com/#/account');
    console.log('You can get a request ID by first creating a download request');
    return;
  }

  const tester = new OffcloudDeletionTester(API_KEY);
  await tester.runAllTests(TEST_REQUEST_ID);
}

// Helper function to create a test download first
async function createTestDownload(apiKey, testUrl = 'https://file-examples.com/storage/fe68c1991b66405f87b4159/2017/10/file_example_JPG_100kB.jpg') {
  console.log('Creating test download...');
  try {
    const tester = new OffcloudDeletionTester(apiKey);
    const url = `https://offcloud.com/api/cloud?key=${apiKey}`;
    const formData = `url=${encodeURIComponent(testUrl)}`;
    
    const response = await tester.makeRequest('POST', url, formData);
    
    if (response.body.requestId) {
      console.log(`Test download created with ID: ${response.body.requestId}`);
      return response.body.requestId;
    } else {
      console.log('Failed to create test download:', response.body);
      return null;
    }
  } catch (error) {
    console.log('Error creating test download:', error.message);
    return null;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { OffcloudDeletionTester, createTestDownload };