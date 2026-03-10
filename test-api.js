#!/usr/bin/env node
/**
 * Vera ML System - API Test Script
 * Tests all endpoints to verify the system is working correctly
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api/v1';
const ML_BASE = 'http://localhost:8000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, ...args) {
  console.log(color + args.join(' ') + colors.reset);
}

function logTest(name) {
  log(colors.cyan, `\n📋 Testing: ${name}`);
}

async function test(name, fn) {
  try {
    await fn();
    log(colors.green, `✓ ${name}`);
    return true;
  } catch (err) {
    log(colors.red, `✗ ${name}`);
    log(colors.red, `  Error: ${err.message}`);
    return false;
  }
}

async function testsuite() {
  log(colors.blue, `
╔════════════════════════════════════════╗
║   Vera ML System - API Test Suite      ║
║   Testing all endpoints & integration  ║
╚════════════════════════════════════════╝
  `);

  let passed = 0;
  let failed = 0;

  // Test 1: ML Service Health
  logTest('ML Service');
  if (await test('ML Service - Health Check', async () => {
    const res = await axios.get(`${ML_BASE}/health`);
    if (!res.data.status) throw new Error('Invalid response');
  })) passed++; else failed++;

  if (await test('ML Service - Service Info', async () => {
    const res = await axios.get(`${ML_BASE}/info`);
    if (!res.data.service) throw new Error('Invalid response');
  })) passed++; else failed++;

  // Test 2: Backend Health
  logTest('Backend');
  if (await test('Backend - Health Check', async () => {
    const res = await axios.get(`${API_BASE.replace('/api/v1', '')}/health`);
    if (!res.data.success) throw new Error('Invalid response');
  })) passed++; else failed++;

  if (await test('Backend - ML Health Endpoint', async () => {
    const res = await axios.get(`${API_BASE}/ml/health`);
    if (!res.data.success) throw new Error('Invalid response');
  })) passed++; else failed++;

  if (await test('Backend - ML Service Info', async () => {
    const res = await axios.get(`${API_BASE}/ml/info`);
    if (!res.data.success) throw new Error('Invalid response');
  })) passed++; else failed++;

  // Test 3: Disease Classes
  logTest('Disease Detection');
  if (await test('Get Available Disease Classes', async () => {
    const res = await axios.get(`${API_BASE}/ml/disease-classes`);
    if (!res.data.data.classes) throw new Error('Invalid disease classes');
    log(colors.yellow, `  Available classes: ${Object.values(res.data.data.classes).join(', ')}`);
  })) passed++; else failed++;

  // Test 4: Authentication (if needed - skip for now)
  log(colors.yellow, `\nℹ️  Authentication test skipped (requires valid credentials)`);

  // Test 5: File Upload Test
  logTest('File Upload & ML Processing');
  
  // Create a test image (1x1 pixel)
  const testImagePath = path.join(__dirname, 'test-image.jpg');
  const testImageBuffer = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAACAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhAAACAQIEBwEAAAAAAAAAAAABAgADEQExEiJBUfAEMXGB/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAaEQEAAwADAAAAAAAAAAAAAAAEAQIRElEx/9oADAMBAAIRAxEAPwCdyOyPw7R28gk3wkOUxmVUfG/QNyiZFG0V/Z//2Q==', 'base64');
  fs.writeFileSync(testImagePath, testImageBuffer);

  if (await test('Create Scan - File Upload', async () => {
    const form = new FormData();
    const stream = fs.createReadStream(testImagePath);
    form.append('file', stream);
    
    const res = await axios.post(`${API_BASE}/scans`, form, {
      headers: form.getHeaders()
    });
    
    if (!res.data.success) throw new Error(res.data.error || 'Upload failed');
    log(colors.yellow, `  Scan ID: ${res.data.data.scan._id}`);
  })) passed++; else failed++;

  // Cleanup
  if (fs.existsSync(testImagePath)) {
    fs.unlinkSync(testImagePath);
  }

  // Summary
  log(colors.blue, `
╔════════════════════════════════════════╗
║          Test Results Summary          ║
╚════════════════════════════════════════╝
  `);

  log(colors.green, `✓ Passed: ${passed}`);
  log(colors.red, `✗ Failed: ${failed}`);
  log(colors.cyan, `Total: ${passed + failed}`);

  if (failed === 0) {
    log(colors.green, `\n🎉 All tests passed! System is ready to use.`);
  } else {
    log(colors.red, `\n⚠️  Some tests failed. Please check the errors above.`);
  }

  log(colors.cyan, `\n📚 Available Endpoints:`);
  log(colors.yellow, `  Frontend:       http://localhost:5173`);
  log(colors.yellow, `  Backend API:    http://localhost:5000/api/v1`);
  log(colors.yellow, `  ML Service:     http://localhost:8000`);
  log(colors.yellow, `  API Docs:       http://localhost:8000/docs`);

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
testsuite().catch(err => {
  log(colors.red, `\nFatal error: ${err.message}`);
  process.exit(1);
});
