-- Email-based accounts do not require a phone number.
-- Existing phone values remain unchanged.
ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;
