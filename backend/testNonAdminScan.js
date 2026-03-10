/**
 * Test script to verify non-admin user scan uploads
 * Run: node testNonAdminScan.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const API_BASE = 'http://localhost:5000/api/v1';

// Test credentials
const testUserEmail = 'user@vera.com';
const testUserPassword = 'User@123456';

// Create a simple test image (1x1 pixel PNG)
const testImagePath = path.join(__dirname, 'test-image.png');
const pngData = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
  0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0xFE,
  0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE5, 0x27, 0xDE, 0xFC, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
]);

fs.writeFileSync(testImagePath, pngData);
console.log('✓ Created test image:', testImagePath);

const test = async () => {
  try {
    // Step 1: Login as non-admin user
    console.log('\n[Step 1] Logging in as non-admin user...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: testUserEmail,
      password: testUserPassword
    });
    
    const token = loginRes.data.data.token;
    const user = loginRes.data.data.user;
    console.log('✓ Login successful');
    console.log('  User ID:', user.id);
    console.log('  User Email:', user.email);
    console.log('  User Role:', user.role);
    console.log('  Token:', token.substring(0, 20) + '...');

    // Create axios instance with token
    const apiClient = axios.create({
      baseURL: API_BASE,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Step 2: Get analytics summary
    console.log('\n[Step 2] Getting analytics summary...');
    try {
      const analyticsRes = await apiClient.get('/analytics/summary');
      console.log('✓ Analytics summary retrieved successfully');
      console.log('  Total plants:', analyticsRes.data.data.total_plants);
      console.log('  Total scans:', analyticsRes.data.data.total_scans);
    } catch (analyticsErr) {
      console.error('✗ Analytics error:');
      console.error('  Status:', analyticsErr.response?.status);
      console.error('  Error:', analyticsErr.response?.data?.error || analyticsErr.message);
    }

    // Step 3: Upload scan
    console.log('\n[Step 3] Uploading scan image...');
    const FormData = require('form-data');
    const form = new FormData();
    form.append('image', fs.createReadStream(testImagePath), 'test-image.png');

    try {
      const uploadRes = await apiClient.post('/scans', form, {
        headers: form.getHeaders()
      });

      console.log('✓ Scan uploaded successfully');
      console.log('  Scan ID:', uploadRes.data.data.scan._id);
      console.log('  Disease detected:', uploadRes.data.data.scan.analysis_result.disease_detected);
      console.log('  Health score:', uploadRes.data.data.scan.analysis_result.health_score);
    } catch (scanErr) {
      console.error('✗ Scan upload error:');
      console.error('  Status:', scanErr.response?.status);
      console.error('  Error:', scanErr.response?.data?.error || scanErr.message);
      console.error('  Response data:', scanErr.response?.data);
    }

    // Step 4: Get all scans
    console.log('\n[Step 4] Getting all scans...');
    try {
      const scansRes = await apiClient.get('/scans');
      console.log('✓ Scans retrieved successfully');
      console.log('  Total scans:', scansRes.data.data.scans.length);
    } catch (scansErr) {
      console.error('✗ Scans retrieval error:');
      console.error('  Status:', scansErr.response?.status);
      console.error('  Error:', scansErr.response?.data?.error || scansErr.message);
    }

  } catch (error) {
    console.error('✗ Test failed:');
    console.error('  Status:', error.response?.status);
    console.error('  Error:', error.response?.data?.error || error.message);
    if (error.response?.data) {
      console.error('  Full response:', error.response.data);
    }
  } finally {
    // Cleanup
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('\n✓ Cleaned up test image');
    }
    process.exit(0);
  }
};

test();
