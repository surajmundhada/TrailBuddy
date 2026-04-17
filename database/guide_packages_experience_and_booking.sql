-- Dev: prefer `spring.jpa.hibernate.ddl-auto=update` so new columns are applied automatically.
-- Production: run equivalent ALTERs once (adjust if your MySQL version does not support a syntax).

-- guide_packages
--   meeting_point VARCHAR(280)
--   max_guests INT
--   host_intro TEXT
--   languages JSON
--   whats_included JSON

-- bookings
--   guide_package_id BIGINT NULL
