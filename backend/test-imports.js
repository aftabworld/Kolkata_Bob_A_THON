// Test script to check which import is undefined
const claimController = require('./src/controllers/claim.controller');
const { authenticate, authorize } = require('./src/middleware/auth');
const { validateClaim } = require('./src/middleware/validators');

console.log('claimController:', typeof claimController);
console.log('claimController.createClaim:', typeof claimController.createClaim);
console.log('authenticate:', typeof authenticate);
console.log('authorize:', typeof authorize);
console.log('authorize("CUSTOMER"):', typeof authorize('CUSTOMER'));
console.log('validateClaim:', typeof validateClaim);

if (typeof claimController.createClaim === 'undefined') {
    console.error('ERROR: claimController.createClaim is undefined!');
}
if (typeof authenticate === 'undefined') {
    console.error('ERROR: authenticate is undefined!');
}
if (typeof authorize === 'undefined') {
    console.error('ERROR: authorize is undefined!');
}
if (typeof validateClaim === 'undefined') {
    console.error('ERROR: validateClaim is undefined!');
}

console.log('\nAll imports checked.');

// Made with Bob
