-- Simple test data creation for email testing
-- Run this to get IDs for testing

-- Check if we have the test account
SELECT "accountId", email, "userType" 
FROM accounts 
WHERE email = 'trggg2004@gmail.com';

-- Check pet owner
SELECT po."petOwnerId", po."accountId", po."fullName" 
FROM pet_owners po
JOIN accounts a ON po."accountId" = a."accountId"
WHERE a.email = 'trggg2004@gmail.com';

-- Get or create a test pet
INSERT INTO pets ("ownerId", name, species, breed, "birthDate", gender, weight)
SELECT 
    po."petOwnerId",
    'Buddy Test',
    'Dog',
    'Golden Retriever',
    '2020-05-15'::date,
    'Male',
    25.5
FROM pet_owners po
JOIN accounts a ON po."accountId" = a."accountId"
WHERE a.email = 'trggg2004@gmail.com'
ON CONFLICT DO NOTHING
RETURNING "petId", name;

-- Show all pets for the test owner
SELECT p."petId", p.name, p.species, p.breed
FROM pets p
JOIN pet_owners po ON p."ownerId" = po."petOwnerId"
JOIN accounts a ON po."accountId" = a."accountId"  
WHERE a.email = 'trggg2004@gmail.com';

-- Get available services
SELECT "serviceId", name, price
FROM services
WHERE "isAvailable" = true
LIMIT 5;

-- Get veterinarians
SELECT e."employeeId", e."fullName", e.role
FROM employees e
WHERE e.role = 'VETERINARIAN'
LIMIT 3;
