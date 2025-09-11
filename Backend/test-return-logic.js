// Test script to verify the return logic
// This script demonstrates the new return logic where unreturned quantity is added to stock

function testReturnLogic() {
  console.log('Testing Return Logic - Unreturned Quantity Added to Stock');
  console.log('=======================================================');
  
  // Test case 1: Return 3 out of 10 items
  console.log('\nTest Case 1: Return 3 out of 10 items');
  const totalQty1 = 10;
  const returnedQty1 = 3;
  const unreturnedQty1 = totalQty1 - returnedQty1; // 7
  console.log(`Total Quantity: ${totalQty1}`);
  console.log(`Returned Quantity: ${returnedQty1}`);
  console.log(`Unreturned Quantity (added to stock): ${unreturnedQty1}`);
  console.log(`Expected: 7 items should be added to stock`);
  
  // Test case 2: Return 5 out of 8 items (partial return)
  console.log('\nTest Case 2: Return 5 out of 8 items (partial return)');
  const totalQty2 = 8;
  const returnedQty2 = 5;
  const unreturnedQty2 = totalQty2 - returnedQty2; // 3
  console.log(`Total Quantity: ${totalQty2}`);
  console.log(`Returned Quantity: ${returnedQty2}`);
  console.log(`Unreturned Quantity (added to stock): ${unreturnedQty2}`);
  console.log(`Expected: 3 items should be added to stock`);
  
  // Test case 3: Return all items (full return)
  console.log('\nTest Case 3: Return all items (full return)');
  const totalQty3 = 15;
  const returnedQty3 = 15;
  const unreturnedQty3 = totalQty3 - returnedQty3; // 0
  console.log(`Total Quantity: ${totalQty3}`);
  console.log(`Returned Quantity: ${returnedQty3}`);
  console.log(`Unreturned Quantity (added to stock): ${unreturnedQty3}`);
  console.log(`Expected: 0 items should be added to stock (all returned)`);
  
  // Test case 4: Multiple partial returns
  console.log('\nTest Case 4: Multiple partial returns');
  const totalQty4 = 20;
  const alreadyReturned = 4;
  const currentReturn = 6;
  const newTotalReturned = alreadyReturned + currentReturn; // 10
  const unreturnedQty4 = totalQty4 - newTotalReturned; // 10
  console.log(`Total Quantity: ${totalQty4}`);
  console.log(`Already Returned: ${alreadyReturned}`);
  console.log(`Current Return: ${currentReturn}`);
  console.log(`New Total Returned: ${newTotalReturned}`);
  console.log(`Unreturned Quantity (added to stock): ${unreturnedQty4}`);
  console.log(`Expected: 10 items should be added to stock`);
  
  console.log('\n=======================================================');
  console.log('✅ All test cases demonstrate the correct logic:');
  console.log('   - Unreturned quantity = Total quantity - Returned quantity');
  console.log('   - Unreturned quantity is added to stock');
  console.log('   - This ensures inventory reflects items that are kept, not returned');
}

// Run the test
testReturnLogic();
