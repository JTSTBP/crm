/*
  # Seed Demo Data for CRM System

  1. Demo Users
    - Admin user
    - Manager user  
    - BD Executive users

  2. Sample Leads
    - Various stages and values
    - Assigned to different executives

  3. Sample Remarks
    - Text remarks with timeline
    - Different users adding remarks

  4. Rate Card
    - Sample rate card with pricing items
*/

-- Insert demo profiles (these will be created when users sign up through auth)
-- The auth.users entries should be created first through the authentication flow

-- For demo purposes, we'll assume these user IDs exist
-- In production, these would be created through the signup process

-- Insert sample rate card
INSERT INTO rate_cards (version, created_by, items, active) VALUES
('v1.0', (SELECT id FROM profiles WHERE role = 'Admin' LIMIT 1), 
'[
  {"name": "Website Development", "price": 50000, "discountLimit": 10},
  {"name": "Mobile App Development", "price": 150000, "discountLimit": 15},
  {"name": "SEO Services", "price": 25000, "discountLimit": 5},
  {"name": "Digital Marketing", "price": 40000, "discountLimit": 8},
  {"name": "Content Writing", "price": 15000, "discountLimit": 5}
]'::jsonb, 
true);

-- Note: The actual demo data will be populated when users sign up
-- and start using the system. The profiles table will be populated
-- through the authentication flow and user registration process.

-- Sample leads, remarks, and other data will be created when
-- users interact with the system through the UI.