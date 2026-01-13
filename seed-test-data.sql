-- ========================================
-- TEST DATA FOR EMAIL SYSTEM
-- ========================================

-- 1. Create test pet owner account
INSERT INTO accounts (email, "passwordHash", "userType", "isActive")
VALUES ('trggg2004@gmail.com', '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijk', 'PET_OWNER', true)
ON CONFLICT (email) DO UPDATE SET "isActive" = true
RETURNING "accountId", email;

-- Get the account ID for next inserts
DO $$
DECLARE
    test_account_id INTEGER;
    test_pet_owner_id INTEGER;
    test_pet_id INTEGER;
    test_service_id INTEGER;
    test_appointment_id INTEGER;
    test_invoice_id INTEGER;
BEGIN
    -- Get test account ID
    SELECT "accountId" INTO test_account_id 
    FROM accounts WHERE email = 'trggg2004@gmail.com';

    -- 2. Create/Update pet owner profile
    INSERT INTO pet_owners ("accountId", "fullName", "phoneNumber", address, "preferredContactMethod")
    VALUES (test_account_id, 'Trần Gia Huy', '0987654321', '123 Test Street, District 1, HCMC', 'Email')
    ON CONFLICT ("accountId") DO UPDATE 
    SET "fullName" = 'Trần Gia Huy', "phoneNumber" = '0987654321'
    RETURNING "petOwnerId" INTO test_pet_owner_id;

    -- 3. Create test pet
    INSERT INTO pets ("ownerId", name, species, breed, "dateOfBirth", gender, weight, "microchipNumber")
    VALUES (test_pet_owner_id, 'Buddy', 'Dog', 'Golden Retriever', '2020-05-15', 'Male', 25.5, 'MC123456789')
    ON CONFLICT DO NOTHING
    RETURNING "petId" INTO test_pet_id;

    -- If pet already exists, get its ID
    IF test_pet_id IS NULL THEN
        SELECT "petId" INTO test_pet_id FROM pets WHERE "ownerId" = test_pet_owner_id LIMIT 1;
    END IF;

    -- 4. Create test service category
    INSERT INTO service_categories (name, description)
    VALUES ('Medical Services', 'Medical examination and treatment services')
    ON CONFLICT DO NOTHING;

    -- 5. Create test service
    INSERT INTO services (name, description, price, duration, "categoryId", "isAvailable", "requiredStaffType")
    VALUES ('General Health Checkup', 'Comprehensive health examination', 200000, 30, 1, true, 'VETERINARIAN')
    ON CONFLICT DO NOTHING
    RETURNING "serviceId" INTO test_service_id;

    IF test_service_id IS NULL THEN
        SELECT "serviceId" INTO test_service_id FROM services LIMIT 1;
    END IF;

    -- 6. Create test appointment (for tomorrow at 10 AM)
    INSERT INTO appointments ("petId", "serviceId", "appointmentDate", status, notes)
    VALUES (test_pet_id, test_service_id, CURRENT_TIMESTAMP + INTERVAL '1 day', 'PENDING', 'Test appointment for email testing')
    ON CONFLICT DO NOTHING
    RETURNING "appointmentId" INTO test_appointment_id;

    -- 7. Create test invoice
    INSERT INTO invoices ("appointmentId", "petOwnerId", "totalAmount", status, "dueDate", notes)
    VALUES (test_appointment_id, test_pet_owner_id, 200000, 'PENDING', CURRENT_TIMESTAMP + INTERVAL '7 days', 'Test invoice for payment email')
    ON CONFLICT DO NOTHING
    RETURNING "invoiceId" INTO test_invoice_id;

    -- 8. Create invoice items
    INSERT INTO invoice_items ("invoiceId", "serviceId", description, quantity, "unitPrice", subtotal)
    VALUES (test_invoice_id, test_service_id, 'General Health Checkup', 1, 200000, 200000)
    ON CONFLICT DO NOTHING;

    -- Print results
    RAISE NOTICE 'Test data created successfully!';
    RAISE NOTICE 'Account ID: %', test_account_id;
    RAISE NOTICE 'Pet Owner ID: %', test_pet_owner_id;
    RAISE NOTICE 'Pet ID: %', test_pet_id;
    RAISE NOTICE 'Appointment ID: %', test_appointment_id;
    RAISE NOTICE 'Invoice ID: %', test_invoice_id;
END $$;

-- Query to verify data
SELECT 
    a."accountId",
    a.email,
    po."petOwnerId",
    po."fullName",
    p."petId",
    p.name as pet_name,
    ap."appointmentId",
    ap."appointmentDate",
    i."invoiceId",
    i."totalAmount"
FROM accounts a
LEFT JOIN pet_owners po ON a."accountId" = po."accountId"
LEFT JOIN pets p ON po."petOwnerId" = p."ownerId"
LEFT JOIN appointments ap ON p."petId" = ap."petId"
LEFT JOIN invoices i ON ap."appointmentId" = i."appointmentId"
WHERE a.email = 'trggg2004@gmail.com';
