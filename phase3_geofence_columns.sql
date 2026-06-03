-- Phase 3 geofence metadata columns
ALTER TABLE field_entries ADD COLUMN IF NOT EXISTS geofence_status VARCHAR;
ALTER TABLE field_entries ADD COLUMN IF NOT EXISTS gps_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE field_entries ADD COLUMN IF NOT EXISTS gps_latitude DOUBLE PRECISION;
ALTER TABLE field_entries ADD COLUMN IF NOT EXISTS gps_longitude DOUBLE PRECISION;
ALTER TABLE field_entries ADD COLUMN IF NOT EXISTS gps_accuracy_m DOUBLE PRECISION;
ALTER TABLE field_entries ADD COLUMN IF NOT EXISTS distance_to_field_m DOUBLE PRECISION;
ALTER TABLE field_entries ADD COLUMN IF NOT EXISTS geofence_requires_review BOOLEAN DEFAULT FALSE;
ALTER TABLE field_entries ADD COLUMN IF NOT EXISTS geofence_message VARCHAR;
