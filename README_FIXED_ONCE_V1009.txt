FIXED ONCE v1009

Changes from v1008:
- Removes the large section headings inside the field question flow:
  Farmer and contact details
  Growth, production, and expected yield
  Location and crop identity
  etc.
- Shows only the current field question.
- Keeps Back/Next one-question-at-a-time navigation.
- Keeps the required map geometry step before saving crop records.
- Keeps Crop Survey / Livestock Survey labels clean.

Geofencing note:
The app applies geofencing during record saving by checking the device GPS/location against the drawn or selected field geometry where the geofence helper is available. If the GPS point is outside/near/unchecked, the record is marked for review/uncertain with geofence notes. The field geometry step ensures crop records have geometry before saving.
