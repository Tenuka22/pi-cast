/**
 * Rate Limiting Test Script
 * 
 * Tests the rate limiting configuration of the Hono API server.
 * Verifies that requests are properly limited after exceeding the threshold.
 * 
 * Usage:
 *   bun run test:rate-limit
 * 
 * Prerequisites:
 *   - API server running on http://localhost:3001
 *   - Rate limiting enabled in .env
 */

const API_BASE_URL = 'http://localhost:3001';
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10');
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');

interface TestResult {
  requestNumber: number;
  status: number;
  success: boolean;
  rateLimitHeaders?: {
    limit: string;
    remaining: string;
    reset: string;
  };
  error?: string;
}

async function makeRequest(requestNumber: number): Promise<TestResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const rateLimitHeaders = {
      limit: response.headers.get('X-RateLimit-Limit') || 'N/A',
      remaining: response.headers.get('X-RateLimit-Remaining') || 'N/A',
      reset: response.headers.get('X-RateLimit-Reset') || 'N/A',
    };

    const result: TestResult = {
      requestNumber,
      status: response.status,
      success: response.ok,
      rateLimitHeaders,
    };

    if (!response.ok) {
      const errorData = await response.json().catch((): { message?: string } => ({ message: undefined }));
      if (typeof errorData === 'object' && errorData !== null && 'message' in errorData) {
        const message = errorData.message;
        result.error = typeof message === 'string' ? message : response.statusText;
      } else {
        result.error = response.statusText;
      }
    }

    return result;
  } catch (error) {
    return {
      requestNumber,
      status: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function printResult(result: TestResult) {
  const statusColor = result.success ? '✅' : '❌';
  console.log(
    `${statusColor} Request #${result.requestNumber}: ${result.status} ${result.success ? 'OK' : 'FAILED'}`,
    result.rateLimitHeaders && result.rateLimitHeaders.remaining !== 'N/A'
      ? `(Remaining: ${result.rateLimitHeaders.remaining})`
      : ''
  );

  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }
}

async function runRateLimitTest() {
  console.log('🧪 Rate Limiting Test\n');
  console.log(`Configuration:`);
  console.log(`  - Max Requests: ${RATE_LIMIT_MAX_REQUESTS}`);
  console.log(`  - Window: ${RATE_LIMIT_WINDOW_MS}ms (${RATE_LIMIT_WINDOW_MS / 1000}s)`);
  console.log(`  - API URL: ${API_BASE_URL}\n`);

  const results: TestResult[] = [];
  const totalRequests = RATE_LIMIT_MAX_REQUESTS + 5; // Exceed limit by 5

  console.log(`Sending ${totalRequests} requests...\n`);

  // Send requests rapidly to exceed rate limit
  for (let i = 1; i <= totalRequests; i++) {
    const result = await makeRequest(i);
    results.push(result);
    printResult(result);

    // Small delay between requests (10ms)
    if (i < totalRequests) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  // Analyze results
  console.log('\n📊 Test Results:\n');

  const successfulRequests = results.filter((r) => r.success).length;
  const rateLimitedRequests = results.filter(
    (r) => r.status === 429
  ).length;
  const failedRequests = results.filter(
    (r) => !r.success && r.status !== 429
  ).length;

  console.log(`  Total Requests: ${results.length}`);
  console.log(`  Successful: ${successfulRequests}`);
  console.log(`  Rate Limited (429): ${rateLimitedRequests}`);
  console.log(`  Other Failures: ${failedRequests}`);

  // Verify rate limiting worked
  console.log('\n✅ Validation:\n');

  const passedChecks: string[] = [];
  const failedChecks: string[] = [];

  // Check 1: Some requests should succeed
  if (successfulRequests >= RATE_LIMIT_MAX_REQUESTS) {
    passedChecks.push(`✓ At least ${RATE_LIMIT_MAX_REQUESTS} requests succeeded`);
  } else {
    failedChecks.push(`✗ Expected at least ${RATE_LIMIT_MAX_REQUESTS} successful requests`);
  }

  // Check 2: Some requests should be rate limited
  if (rateLimitedRequests > 0) {
    passedChecks.push(`✓ Rate limiting triggered (${rateLimitedRequests} requests blocked)`);
  } else {
    failedChecks.push(`✗ Rate limiting did not trigger`);
  }

  // Check 3: Rate limit headers should be present
  const requestsWithHeaders = results.filter(
    (r) => r.rateLimitHeaders && r.rateLimitHeaders.limit !== 'N/A'
  ).length;
  if (requestsWithHeaders > 0) {
    passedChecks.push(`✓ Rate limit headers present in ${requestsWithHeaders} responses`);
  } else {
    failedChecks.push(`✗ Rate limit headers not found`);
  }

  // Print passed checks
  passedChecks.forEach((check) => console.log(`  ${check}`));

  // Print failed checks
  if (failedChecks.length > 0) {
    console.log('\n⚠️  Failed Checks:\n');
    failedChecks.forEach((check) => console.log(`  ${check}`));
  }

  // Summary
  console.log('\n📝 Summary:\n');
  const allPassed = failedChecks.length === 0;
  if (allPassed) {
    console.log('  ✅ All checks passed! Rate limiting is working correctly.');
  } else {
    console.log(
      `  ⚠️  ${failedChecks.length} check(s) failed. Review rate limiting configuration.`
    );
  }

  // Show first rate-limited response details
  const firstRateLimited = results.find((r) => r.status === 429);
  if (firstRateLimited) {
    console.log('\n📋 First Rate-Limited Response:\n');
    console.log(`  Status: ${firstRateLimited.status}`);
    console.log(`  Error: ${firstRateLimited.error || 'N/A'}`);
    if (firstRateLimited.rateLimitHeaders) {
      console.log(`  Headers:`);
      console.log(`    X-RateLimit-Limit: ${firstRateLimited.rateLimitHeaders.limit}`);
      console.log(`    X-RateLimit-Remaining: ${firstRateLimited.rateLimitHeaders.remaining}`);
      console.log(`    X-RateLimit-Reset: ${firstRateLimited.rateLimitHeaders.reset}`);
    }
  }

  console.log('\n');

  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    return true;
  } catch {
    console.error('❌ Cannot connect to API server at', API_BASE_URL);
    console.error('   Please start the server with: bun run dev\n');
    process.exit(1);
  }
}

// Run tests
void (async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runRateLimitTest();
  }
})();
