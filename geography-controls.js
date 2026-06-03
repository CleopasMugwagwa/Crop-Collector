(function () {
  'use strict';

  const CANONICAL_PROVINCE_DISTRICTS = {
    'Bulawayo Metropolitan': ['Bulawayo'],
    'Harare Metropolitan': ['Chitungwiza', 'Epworth', 'Harare'],
    Manicaland: ['Buhera', 'Chimanimani', 'Chipinge', 'Makoni', 'Mutare', 'Mutasa', 'Nyanga'],
    'Mashonaland Central': ['Bindura', 'Guruve', 'Mazowe', 'Mbire', 'Mount Darwin', 'Muzarabani', 'Rushinga', 'Shamva'],
    'Mashonaland East': ['Chikomba', 'Goromonzi', 'Hwedza', 'Marondera', 'Mudzi', 'Murehwa', 'Mutoko', 'Seke', 'Uzumba-Maramba-Pfungwe'],
    'Mashonaland West': ['Chegutu', 'Hurungwe', 'Kariba', 'Makonde', 'Mhondoro-Ngezi', 'Sanyati', 'Zvimba'],
    Masvingo: ['Bikita', 'Chiredzi', 'Chivi', 'Gutu', 'Masvingo', 'Mwenezi', 'Zaka'],
    'Matabeleland North': ['Binga', 'Bubi', 'Hwange', 'Lupane', 'Nkayi', 'Tsholotsho', 'Umguza'],
    'Matabeleland South': ['Beitbridge', 'Bulilima', 'Gwanda', 'Insiza', 'Mangwe', 'Matobo', 'Umzingwane'],
    Midlands: ['Chirumanzu', 'Gokwe North', 'Gokwe South', 'Gokwe South Urban', 'Gweru', 'Gweru Urban', 'Kwekwe', 'Kwekwe Urban', 'Mberengwa', 'Redcliff', 'Shurugwi', 'Zvishavane']
  };
  const PROVINCE_ALIASES = {
    Bulawayo: 'Bulawayo Metropolitan',
    'Bulawayo Metropolitan': 'Bulawayo Metropolitan',
    Harare: 'Harare Metropolitan',
    'Harare Metropolitan': 'Harare Metropolitan'
  };

  let geographyMap = sanitizeGeographyMap(normalizeGeographyMap(window.GEOGRAPHY_MAP || {}));
  let geographyFetchStarted = false;

  function normalizeGeographyMap(source) {
    const normalized = {};
    Object.entries(source || {}).forEach(([province, districts]) => {
      const provinceName = normalizeGeoValue(province);
      if (!provinceName) return;
      normalized[provinceName] = {};
      Object.entries(districts || {}).forEach(([district, wards]) => {
        const districtName = normalizeGeoValue(district);
        if (!districtName) return;
        normalized[provinceName][districtName] = [...new Set((Array.isArray(wards) ? wards : []).map(normalizeGeoValue).filter(Boolean))].sort((a, b) =>
          compareGeoValues(a, b)
        );
      });
    });
    return normalized;
  }

  function sanitizeGeographyMap(source) {
    const sanitized = {};
    Object.entries(CANONICAL_PROVINCE_DISTRICTS).forEach(([province, districts]) => {
      sanitized[province] = {};
      districts.forEach((district) => {
        let wards = source?.[province]?.[district];
        if (!Array.isArray(wards)) {
          Object.values(source || {}).some((provinceDistricts) => {
            if (Array.isArray(provinceDistricts?.[district])) {
              wards = provinceDistricts[district];
              return true;
            }
            return false;
          });
        }
        sanitized[province][district] = [...new Set((Array.isArray(wards) ? wards : []).map(normalizeGeoValue).filter(Boolean))].sort((a, b) =>
          compareGeoValues(a, b)
        );
      });
    });
    return sanitized;
  }

  function findProvinceForDistrict(district) {
    const normalizedDistrict = normalizeGeoValue(district);
    if (!normalizedDistrict) return '';
    return (
      Object.entries(CANONICAL_PROVINCE_DISTRICTS).find(([, districts]) =>
        districts.includes(normalizedDistrict)
      )?.[0] || ''
    );
  }

  function normalizeGeoValue(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function normalizeProvinceValue(value) {
    const normalized = normalizeGeoValue(value);
    return PROVINCE_ALIASES[normalized] || normalized;
  }

  function compareGeoValues(left, right) {
    const leftNumber = Number(left);
    const rightNumber = Number(right);
    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) return leftNumber - rightNumber;
    return String(left).localeCompare(String(right));
  }

  function getProvinceOptions() {
    return Object.keys(geographyMap).sort((a, b) => a.localeCompare(b));
  }

  function getDistrictOptionsForProvince(province) {
    return Object.keys(geographyMap[normalizeProvinceValue(province)] || {}).sort((a, b) => a.localeCompare(b));
  }

  function getWardOptionsForSelection(province, district) {
    const normalizedProvince = normalizeProvinceValue(province);
    const normalizedDistrict = normalizeGeoValue(district);
    return [...(geographyMap[normalizedProvince]?.[normalizedDistrict] || [])];
  }

  function ensureSelectField(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return null;
    if (field.tagName === 'SELECT') return field;
    const select = document.createElement('select');
    select.id = field.id;
    select.required = field.required;
    select.className = field.className;
    select.dataset.originalType = 'geography-select';
    select.innerHTML = '<option value="" selected></option>';
    field.replaceWith(select);
    return select;
  }

  function ensureTextField(fieldId, labelText = '') {
    const field = document.getElementById(fieldId);
    if (!field) return null;
    if (field.tagName === 'INPUT') return field;
    const input = document.createElement('input');
    input.type = 'text';
    input.id = field.id;
    input.required = field.required;
    input.className = field.className;
    input.placeholder = ' ';
    input.dataset.originalType = 'geography-input';
    input.value = field.value || '';
    field.replaceWith(input);
    if (labelText) {
      const label = document.querySelector(`label[for="${fieldId}"]`);
      if (label) label.textContent = labelText;
    }
    return input;
  }

  function populateOptions(select, values, placeholder, currentValue, required) {
    if (!select) return;
    const normalizedCurrent = normalizeGeoValue(currentValue);
    select.innerHTML = '';
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder;
    placeholderOption.disabled = !!required;
    placeholderOption.selected = !normalizedCurrent;
    select.appendChild(placeholderOption);
    values.forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
    select.value = values.includes(normalizedCurrent) ? normalizedCurrent : '';
  }

  function syncGeographyControls(selectedProvince = '', selectedDistrict = '', selectedWard = '') {
    const provinceSelect = document.getElementById('province');
    const districtSelect = ensureSelectField('district');
    const currentWardField = document.getElementById('ward');
    if (!provinceSelect || !districtSelect) return;

    let provinceValue = normalizeProvinceValue(selectedProvince || provinceSelect.value);
    const districtValue = normalizeGeoValue(selectedDistrict || districtSelect.value);
    const wardValue = normalizeGeoValue(selectedWard || currentWardField?.value || '');
    const canonicalProvince = findProvinceForDistrict(districtValue);
    if (!selectedProvince && districtValue && canonicalProvince && provinceValue && provinceValue !== canonicalProvince) {
      provinceValue = canonicalProvince;
    }

    const provinceOptions = getProvinceOptions();
    if (provinceOptions.length) {
      populateOptions(provinceSelect, provinceOptions, 'Select province', provinceValue, true);
      provinceValue = normalizeProvinceValue(provinceSelect.value);
    } else if (provinceValue) {
      provinceSelect.value = provinceValue;
    }

    const districtOptions = getDistrictOptionsForProvince(provinceValue);
    const effectiveDistrictValue = districtOptions.includes(districtValue) ? districtValue : '';
    populateOptions(districtSelect, districtOptions, provinceValue ? 'Select district' : 'Select province first', effectiveDistrictValue, true);
    districtSelect.disabled = !provinceValue || !districtOptions.length;

    const wardOptions = getWardOptionsForSelection(provinceValue, districtSelect.value || effectiveDistrictValue);
    if (wardOptions.length) {
      const wardSelect = ensureSelectField('ward');
      if (!wardSelect) return;
      const effectiveWardValue = wardOptions.includes(wardValue) ? wardValue : '';
      populateOptions(wardSelect, wardOptions, districtSelect.value ? 'Select ward' : 'Select district first', effectiveWardValue, true);
      wardSelect.disabled = !(provinceValue && (districtSelect.value || effectiveDistrictValue) && wardOptions.length);
    } else {
      const wardInput = ensureTextField('ward', 'Ward Number');
      if (!wardInput) return;
      wardInput.disabled = !(provinceValue && (districtSelect.value || effectiveDistrictValue));
      wardInput.placeholder = districtSelect.value ? 'Enter ward number' : 'Select district first';
      if (!districtSelect.value) wardInput.value = '';
      if (!wardValue && districtSelect.value) wardInput.value = '';
    }
  }

  async function loadGeographyCatalog() {
    if (geographyFetchStarted) return;
    geographyFetchStarted = true;
    try {
      const response = await fetch(`${API_URL}/lookups/geography`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Could not load geography');
      geographyMap = sanitizeGeographyMap(normalizeGeographyMap(data));
      syncGeographyControls();
    } catch {
      syncGeographyControls();
    }
  }

  function attachGeographyListeners() {
    const provinceSelect = document.getElementById('province');
    const districtSelect = document.getElementById('district');
    const wardField = document.getElementById('ward');
    if (provinceSelect && !provinceSelect.dataset.geographyBound) {
      provinceSelect.dataset.geographyBound = 'true';
      provinceSelect.addEventListener('change', () => {
        syncGeographyControls(provinceSelect.value, '', '');
        if (typeof updateFarmerSummaryPanel === 'function') updateFarmerSummaryPanel();
      });
    }
    if (districtSelect && !districtSelect.dataset.geographyBound) {
      districtSelect.dataset.geographyBound = 'true';
      districtSelect.addEventListener('change', () => {
        syncGeographyControls(document.getElementById('province')?.value || '', districtSelect.value, '');
        if (typeof updateFarmerSummaryPanel === 'function') updateFarmerSummaryPanel();
      });
    }
    if (wardField && !wardField.dataset.geographyBound) {
      wardField.dataset.geographyBound = 'true';
      wardField.addEventListener('change', () => {
        if (typeof updateFarmerSummaryPanel === 'function') updateFarmerSummaryPanel();
      });
      wardField.addEventListener('input', () => {
        if (typeof updateFarmerSummaryPanel === 'function') updateFarmerSummaryPanel();
      });
    }
  }

  const originalInjectAdministrativeFields = window.injectAdministrativeFields;
  window.injectAdministrativeFields = function () {
    if (typeof originalInjectAdministrativeFields === 'function') originalInjectAdministrativeFields();
    ensureSelectField('district');
    ensureSelectField('ward');
    syncGeographyControls();
    attachGeographyListeners();
  };

  const originalInitGeographySelectors = window.initGeographySelectors;
  window.initGeographySelectors = function () {
    if (typeof originalInitGeographySelectors === 'function') originalInitGeographySelectors();
    ensureSelectField('district');
    ensureSelectField('ward');
    syncGeographyControls();
    attachGeographyListeners();
    loadGeographyCatalog();
  };

  window.updateDistrictOptions = function (selectedProvince = '', selectedDistrict = '', selectedWard = '') {
    syncGeographyControls(selectedProvince, selectedDistrict, selectedWard);
  };

  window.normalizeCollectorGeographySelection = function (selectedProvince = '', selectedDistrict = '', selectedWard = '') {
    const provinceField = document.getElementById('province');
    const districtField = document.getElementById('district');
    const wardField = document.getElementById('ward');
    const province = normalizeProvinceValue(selectedProvince || provinceField?.value || '');
    const district = normalizeGeoValue(selectedDistrict || districtField?.value || '');
    const ward = normalizeGeoValue(selectedWard || wardField?.value || '');
    const districtOptions = getDistrictOptionsForProvince(province);
    const isDistrictValid = !district || districtOptions.includes(district);
    const resolvedDistrict = isDistrictValid ? district : '';
    const wardOptions = getWardOptionsForSelection(province, resolvedDistrict);
    const isWardValid = !ward || !wardOptions.length || wardOptions.includes(ward);
    const resolvedWard = isWardValid ? ward : '';

    return {
      province,
      district: resolvedDistrict,
      ward: resolvedWard,
      enteredDistrict: district,
      enteredWard: ward,
      districtOptions,
      wardOptions,
      isDistrictValid,
      isWardValid
    };
  };

  window.refreshGeographyCatalog = async function () {
    geographyFetchStarted = false;
    await loadGeographyCatalog();
    syncGeographyControls(
      document.getElementById('province')?.value || '',
      document.getElementById('district')?.value || '',
      document.getElementById('ward')?.value || ''
    );
  };

  const originalSetLookupCatalog = window.setLookupCatalog;
  window.setLookupCatalog = function (catalog) {
    const result = typeof originalSetLookupCatalog === 'function' ? originalSetLookupCatalog(catalog) : undefined;
    syncGeographyControls();
    attachGeographyListeners();
    return result;
  };

  const originalStartEditingEntry = window.startEditingEntry;
  window.startEditingEntry = function (entryId) {
    const result = typeof originalStartEditingEntry === 'function' ? originalStartEditingEntry(entryId) : undefined;
    syncGeographyControls(
      document.getElementById('province')?.value || '',
      document.getElementById('district')?.value || '',
      document.getElementById('ward')?.value || ''
    );
    return result;
  };

  const originalPrepareNextPlotForSameFarmer = window.prepareNextPlotForSameFarmer;
  window.prepareNextPlotForSameFarmer = function (draft) {
    const result = typeof originalPrepareNextPlotForSameFarmer === 'function' ? originalPrepareNextPlotForSameFarmer(draft) : undefined;
    syncGeographyControls(draft?.province || '', draft?.district || '', draft?.ward || '');
    return result;
  };
})();
