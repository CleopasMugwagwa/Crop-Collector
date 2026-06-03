FIXED ONCE v1010

Changes from v1009:
- Adds safe toggleSidebar fallback to fix:
  ReferenceError: toggleSidebar is not defined
- Fixes Chrome accessibility warning:
  Blocked aria-hidden because focused element is inside aria-hidden parent
- Cleans final step buttons:
  Save Entry remains the main final action.
  Finish is changed to Review to avoid duplicate final action confusion.
- Keeps v1009 one-question-at-a-time flow and hidden section headers.

Note:
If saveEntry says blocked-required-fields, it means some required fields were not filled.
If saveEntry says blocked-missing-geometry, crop record needs a drawn/selected polygon or point first.

Open:
http://127.0.0.1:5500/WELCOME.html?screen=collector&v=1010
