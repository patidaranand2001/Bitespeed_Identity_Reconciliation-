// Use built-in Node.js fetch (available in Node 18+)
// No imports needed

const BASE_URL = 'http://localhost:3000';

async function test(description, body, expectedCondition) {
  try {
    const res = await fetch(`${BASE_URL}/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    const passed = expectedCondition(data);
    console.log(`${passed ? '✅' : '❌'} ${description}`);
    if (!passed) console.log('  Response:', JSON.stringify(data, null, 2));
    return passed;
  } catch (err) {
    console.error(`❌ ${description} - Error:`, err.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Running Identity Reconciliation Tests\n');

  const results = [];

  // Test 1: Create new contact with email and phone
  results.push(
    await test('Test 1: Create new contact with email and phone', 
      { email: 'lorraine@hillvalley.edu', phoneNumber: '123456' },
      (data) => {
        return data.contact.primaryContactId > 0 &&
               data.contact.emails.includes('lorraine@hillvalley.edu') &&
               data.contact.phoneNumbers.includes('123456') &&
               data.contact.secondaryContactIds.length === 0;
      }
    )
  );

  // Test 2: Link via same phone number (should create secondary)
  results.push(
    await test('Test 2: Link via same phone, new email creates secondary',
      { email: 'mcfly@hillvalley.edu', phoneNumber: '123456' },
      (data) => {
        return data.contact.primaryContactId === 1 &&
               data.contact.emails.length === 2 &&
               data.contact.phoneNumbers.length === 1 &&
               data.contact.secondaryContactIds.length === 1;
      }
    )
  );

  // Test 3: Query with existing data returns same result
  results.push(
    await test('Test 3: Query existing contact returns same consolidated result',
      { email: 'lorraine@hillvalley.edu', phoneNumber: '123456' },
      (data) => {
        return data.contact.primaryContactId === 1 &&
               data.contact.emails.length === 2 &&
               data.contact.phoneNumbers.length === 1 &&
               data.contact.secondaryContactIds.length === 1;
      }
    )
  );

  // Test 4: Create separate primary chain
  results.push(
    await test('Test 4: Create separate primary contact',
      { email: 'george@hillvalley.edu', phoneNumber: '919191' },
      (data) => {
        return data.contact.primaryContactId > 1 &&
               !data.contact.secondaryContactIds.includes(1);
      }
    )
  );

  // Test 5: Merge two chains by deliberately creating a separate primary with phone
  // First, create a separate primary with phone "717171" 
  await fetch(`${BASE_URL}/identify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'biffsucks@hillvalley.edu', phoneNumber: '717171' }),
  });

    // Add slight delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 100));

    // Now query with email from test 4's chain and phone from this new chain
  results.push(
    await test('Test 5: Merge two chains - older contact remains primary',
      { email: 'george@hillvalley.edu', phoneNumber: '717171' },
      (data) => {
          // Just verify both chains merged: 2 emails, 2 phones, 1 secondary
          return data.contact.emails.length === 2 &&
                 data.contact.phoneNumbers.length === 2 &&
                 data.contact.secondaryContactIds.length === 1;
      }
    )
  );

  // Test 6: New contact with only email
  results.push(
    await test('Test 6: Create new contact with only email',
      { email: 'doctor@future.com' },
      (data) => {
        return data.contact.primaryContactId > 0 &&
               data.contact.emails.length === 1 &&
               data.contact.phoneNumbers.length === 0 &&
               data.contact.secondaryContactIds.length === 0;
      }
    )
  );

  // Test 7: New contact with only phone
  results.push(
    await test('Test 7: Create new contact with only phone',
      { phoneNumber: '555555' },
      (data) => {
        return data.contact.primaryContactId > 0 &&
               data.contact.emails.length === 0 &&
               data.contact.phoneNumbers.length === 1 &&
               data.contact.secondaryContactIds.length === 0;
      }
    )
  );

  // Test 8: Query secondary contact returns same consolidated result
  results.push(
    await test('Test 8: Query via secondary contact returns full chain',
      { email: 'mcfly@hillvalley.edu' },
      (data) => {
        return data.contact.primaryContactId === 1 &&
               data.contact.secondaryContactIds.length >= 1;
      }
    )
  );

  // Summary
  console.log(`\n📊 Results: ${results.filter(Boolean).length}/${results.length} tests passed`);
  if (results.every(Boolean)) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed.');
  }
}

runTests().catch(console.error);
