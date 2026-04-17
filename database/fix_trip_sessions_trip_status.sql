-- Fix MySQL "Data truncated for column 'trip_status'" when ENUM does not list all Java TripStatus values.
-- Run once against your trailbuddy database (e.g. mysql -u root -p trailbuddy < fix_trip_sessions_trip_status.sql).

USE trailbuddy;

ALTER TABLE trip_sessions
  MODIFY COLUMN trip_status VARCHAR(32) NOT NULL;
