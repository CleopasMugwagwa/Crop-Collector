(function () {
  'use strict';

  const NOTE_MARKER = '[MINISTRY_EXTRA_JSON]';
  const HEADER_SOURCE = Array.isArray(window.MINISTRY_CSV_HEADERS) ? window.MINISTRY_CSV_HEADERS : [];
  const BINARY_OPTIONS = ['', 'Yes', 'No', 'N/A'];
  const BUILTIN_LABELS = new Set(
    [
      'Province',
      'District',
      'Ward Number',
      'Questionnaire ID',
      'Name of AEO',
      'Aeo Contact Number',
      'Sector',
      'Name of Farmer',
      'Contact of Farmer or Manager',
      'Village/ Farm Name',
      'AEZ',
      'Gender of HHH',
      'Gender of decision maker',
      'Age of HHH',
      'Marital status of HHH',
      'Level of education of HHH',
      'Does HH have any disability?',
      'State the condition if any',
      '0-17',
      '18-35',
      '36_60',
      '60+',
      'Total owned Land Holding (ha)',
      'Owned arable land (ha)',
      'Land rented from others 2024_25 (ha)',
      'Land rented to others 2024_25 (ha)',
      'Total area planted all crops (ha)',
      'Cropped Area With Contours (ha)'
    ].map(normalizeLabel)
  );
  const SECTION_STARTS = new Map([
    ['Did you plant any Maize this season', 'Maize Module'],
    ['Did you plant any Sorghum this season', 'Sorghum Module'],
    ['Did you plant any Pearl Millet this season', 'Pearl Millet Module'],
    ['SECTION D: OTHER CROPS', 'Other Crops'],
    ['SECTION E:PFUMVUDZA CROPS', 'Pfumvudza, Stocks and Livestock'],
    ['Do you have any Cattle?', 'Livestock - Cattle'],
    ['Do you have any Donkeys?', 'Livestock - Donkeys'],
    ['Do you have any goats?', 'Livestock - Goats'],
    ['Do you have any sheep?', 'Livestock - Sheep'],
    ['Do you have any pig?', 'Livestock - Pigs'],
    ['Do you have any poultry and rabbits?', 'Poultry and Rabbits'],
    ['The area under selected fodder crops and pastures', 'Fodder and Pasture'],
    ['GPS Coordinates', 'GPS and Submission Metadata']
  ]);

  function normalizeLabel(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function inferFieldKind(label) {
    const normalized = normalizeLabel(label);
    if (!normalized) return 'text';
    if (label.includes('/')) return 'checkbox';
    if (
      /^(do you|did you|are you|which method of dipping are you using\?|market type|ownership$|census or sample$|crop grown$|ca principles practised$|source of tick grease$|livestock condition$|dipping adequacy$|supplementary feeding$|supp\. feeding$|grazing condition$|type of water source$|draft power$|production system$|main production system$|vaccination$|feed type$|orange maize$|biofortified$|indigenous chickens$|other poultry$|rabbits$|donkeys$|cattle$|goats$|sheep$|pigs$|fodder legume planted$|fodder grass planted$|crop condition$|crop condition for orange maize$)/i.test(
        label
      )
    ) {
      return 'select';
    }
    if (
      /^_/.test(label) ||
      /(_submission_time|_validation_status|_notes|_status|_submitted_by|__version__|_tags|_id|_uuid|custom-name this form:|thank the participant for their time and end the questionaire)/i.test(
        label
      )
    ) {
      return 'text';
    }
    if (
      /(\barea\b|\bnumber\b|\btotal\b|\bquantity\b|\btimes\b|\bsize\b|\bseed used\b|\bplanted\b|\bborn\b|\bdeaths?\b|\bsold\b|\bslaughtered\b|\btransferred\b|\bbrought in\b|\bleased\b|\bstolen\b|\blost\b|\bcalves\b|\bbulls\b|\bcows\b|\bheifers\b|\boxen\b|\bsteers\b|\bfoals\b|\bbucks\b|\bdoes\b|\bkids\b|\brams\b|\bewes\b|\blambs\b|\bboars\b|\bsows\b|\bgilts\b|\blitter\b|0-17|18-35|36_60|60\+|latitude|longitude|altitude|precision|\(ha\)|\(kg\)|\bkg\b|\bha\b)/i.test(
        label
      )
    ) {
      return 'number';
    }
    return 'text';
  }

  function buildFieldDefinition(label, index) {
    return {
      key: `ministry_extra_${String(index + 1).padStart(3, '0')}`,
      label,
      kind: inferFieldKind(label)
    };
  }

  function buildSections() {
    const sections = [];
    let current = null;

    HEADER_SOURCE.forEach((label, index) => {
      if (index < 3) return;
      const normalized = normalizeLabel(label);
      if (!normalized || BUILTIN_LABELS.has(normalized)) return;

      if (SECTION_STARTS.has(label)) {
        if (current && current.fields.length) sections.push(current);
        current = { title: SECTION_STARTS.get(label), fields: [] };
        if (!/^SECTION /i.test(label)) current.fields.push(buildFieldDefinition(label, index));
        return;
      }

      if (/^SECTION /i.test(label)) {
        if (current && current.fields.length) sections.push(current);
        current = { title: label.replace(/^SECTION\s+[A-Z]+:\s*/i, ''), fields: [] };
        return;
      }

      if (!current) current = { title: 'Extended Ministry Questionnaire', fields: [] };
      current.fields.push(buildFieldDefinition(label, index));
    });

    if (current && current.fields.length) sections.push(current);
    return sections;
  }

  const MINISTRY_SECTIONS = buildSections();
  const SECTION_BY_TITLE = new Map(MINISTRY_SECTIONS.map((section) => [section.title, section]));
  const STRUCTURED_CROP_MODULE_SECTIONS = [
    { code: 'maize', title: 'Maize Module' },
    { code: 'sorghum', title: 'Sorghum Module' },
    { code: 'pearl_millet', title: 'Pearl Millet Module' }
  ];
  const STRUCTURED_OTHER_CROPS_SECTION = 'Other Crops';
  const STRUCTURED_PFUMVUDZA_SECTION = 'Pfumvudza, Stocks and Livestock';
  const STRUCTURED_LIVESTOCK_SECTIONS = [
    { code: 'cattle', title: 'Livestock - Cattle' },
    { code: 'donkeys', title: 'Livestock - Donkeys' },
    { code: 'goats', title: 'Livestock - Goats' },
    { code: 'sheep', title: 'Livestock - Sheep' },
    { code: 'pigs', title: 'Livestock - Pigs' },
    { code: 'poultry_rabbits', title: 'Poultry and Rabbits' },
    { code: 'fodder_pasture', title: 'Fodder and Pasture' }
  ];
  const LIVESTOCK_SECTION_TITLES = new Set(STRUCTURED_LIVESTOCK_SECTIONS.map((section) => section.title));

  function asNumber(value) {
    if (value == null || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function asString(value) {
    if (value == null) return '';
    return String(value).trim();
  }

  function normalizeCropModules(modules) {
    return Array.isArray(modules)
      ? modules
          .filter((item) => item && item.module_code)
          .map((item) => ({
            moduleCode: item.moduleCode || item.module_code,
            moduleLabel: item.moduleLabel || item.module_label || item.moduleCode || item.module_code,
            plantedThisSeason: item.plantedThisSeason || item.planted_this_season || '',
            censusOrSample: item.censusOrSample || item.census_or_sample || '',
            firstSuccessfulPlantingDekad:
              item.firstSuccessfulPlantingDekad || item.first_successful_planting_dekad || '',
            plantingNov: item.plantingNov || item.planting_nov || null,
            plantingDec: item.plantingDec || item.planting_dec || null,
            plantingJan: item.plantingJan || item.planting_jan || null,
            totalAreaPlantedHa: item.totalAreaPlantedHa ?? item.total_area_planted_ha ?? '',
            confirmTotalAreaPlanted:
              item.confirmTotalAreaPlanted || item.confirm_total_area_planted || '',
            seedType: item.seedType || item.seed_type || '',
            majorVariety: item.majorVariety || item.major_variety || '',
            writeOff: item.writeOff || item.write_off || '',
            writeOffAreaHa: item.writeOffAreaHa ?? item.write_off_area_ha ?? '',
            writeOffCause: item.writeOffCause || item.write_off_cause || '',
            writeOffOtherCause: item.writeOffOtherCause || item.write_off_other_cause || '',
            gapFilling: item.gapFilling || item.gap_filling || '',
            areaReplantedHa: item.areaReplantedHa ?? item.area_replanted_ha ?? '',
            majorInputSource: item.majorInputSource || item.major_input_source || '',
            inputSourceDetails: item.inputSourceDetails || item.input_source_details || null,
            providerQuantities: item.providerQuantities || item.provider_quantities || null
          }))
      : [];
  }

  function normalizeOtherCropItems(items) {
    return Array.isArray(items)
      ? items
          .filter((item) => item && (item.cropName || item.crop_name))
          .map((item, index) => ({
            cropName: item.cropName || item.crop_name,
            sortOrder:
              item.sortOrder != null
                ? Number(item.sortOrder)
                : item.sort_order != null
                  ? Number(item.sort_order)
                  : (index + 1) * 10
          }))
          .sort((left, right) => (left.sortOrder || 0) - (right.sortOrder || 0))
      : [];
  }

  function normalizePfumvudzaModule(module) {
    if (!module) return null;
    const cropsGrown = Array.isArray(module.cropsGrown || module.crops_grown)
      ? (module.cropsGrown || module.crops_grown)
          .map((item) => asString(item))
          .filter(Boolean)
      : [];
    const caPrinciples = Array.isArray(module.caPrinciples || module.ca_principles)
      ? (module.caPrinciples || module.ca_principles)
          .map((item) => asString(item))
          .filter(Boolean)
      : [];
    const biofortifiedEntries = Array.isArray(module.biofortifiedEntries || module.biofortified_entries)
      ? (module.biofortifiedEntries || module.biofortified_entries)
          .map((item) => ({
            name: asString(item?.name || item?.crop_or_variety || item?.cropName),
            areaHa: item?.areaHa ?? item?.area_ha ?? '',
            cropCondition: asString(item?.cropCondition || item?.crop_condition || item?.condition)
          }))
          .filter((item) => item.name || item.areaHa !== '' || item.cropCondition)
      : [];
    const rawStocks = module.cropStocks || module.crop_stocks || {};
    const cropStocks = {
      maizeKg: rawStocks.maizeKg ?? rawStocks.maize_kg ?? '',
      sorghumKg: rawStocks.sorghumKg ?? rawStocks.sorghum_kg ?? '',
      pearlMilletKg: rawStocks.pearlMilletKg ?? rawStocks.pearl_millet_kg ?? '',
      fingerMilletKg: rawStocks.fingerMilletKg ?? rawStocks.finger_millet_kg ?? ''
    };
    const hasStocks = Object.values(cropStocks).some((value) => value !== '' && value != null);
    const normalized = {
      practicedPfumvudza: asString(module.practicedPfumvudza || module.practiced_pfumvudza),
      cropsGrown,
      croppedAreaUnderCa: module.croppedAreaUnderCa ?? module.cropped_area_under_ca ?? '',
      caPrinciples,
      orangeMaizePlanted: asString(module.orangeMaizePlanted || module.orange_maize_planted),
      orangeMaizeValue: asString(module.orangeMaizeValue || module.orange_maize_value),
      orangeMaizeCensusOrSample: asString(module.orangeMaizeCensusOrSample || module.orange_maize_census_or_sample),
      orangeMaizeAreaHa: module.orangeMaizeAreaHa ?? module.orange_maize_area_ha ?? '',
      orangeMaizeCropCondition: asString(module.orangeMaizeCropCondition || module.orange_maize_crop_condition),
      biofortifiedPlanted: asString(module.biofortifiedPlanted || module.biofortified_planted),
      biofortifiedValue: asString(module.biofortifiedValue || module.biofortified_value),
      biofortifiedCensusOrSample: asString(module.biofortifiedCensusOrSample || module.biofortified_census_or_sample),
      biofortifiedEntries,
      cropStocks: hasStocks ? cropStocks : null
    };
    const hasValue = [
      normalized.practicedPfumvudza,
      normalized.cropsGrown.length,
      normalized.croppedAreaUnderCa !== '' && normalized.croppedAreaUnderCa != null,
      normalized.caPrinciples.length,
      normalized.orangeMaizePlanted,
      normalized.orangeMaizeValue,
      normalized.orangeMaizeCensusOrSample,
      normalized.orangeMaizeAreaHa !== '' && normalized.orangeMaizeAreaHa != null,
      normalized.orangeMaizeCropCondition,
      normalized.biofortifiedPlanted,
      normalized.biofortifiedValue,
      normalized.biofortifiedCensusOrSample,
      normalized.biofortifiedEntries.length,
      normalized.cropStocks && Object.values(normalized.cropStocks).some((value) => value !== '' && value != null)
    ].some(Boolean);
    return hasValue ? normalized : null;
  }

  function normalizeLivestockModules(modules) {
    return Array.isArray(modules)
      ? modules
          .filter((item) => item && (item.moduleCode || item.module_code))
          .map((item) => ({
            moduleCode: item.moduleCode || item.module_code,
            moduleLabel: item.moduleLabel || item.module_label || item.moduleCode || item.module_code,
            answers: Array.isArray(item.answers)
              ? item.answers
                  .map((answer) => ({
                    key: asString(answer?.key),
                    label: asString(answer?.label || answer?.key),
                    value: asString(answer?.value),
                    kind: asString(answer?.kind || 'text') || 'text'
                  }))
                  .filter((answer) => answer.key && answer.value)
              : []
          }))
          .filter((item) => item.answers.length)
      : [];
  }

  function buildSectionValueMap(extraData, title) {
    const section = SECTION_BY_TITLE.get(title);
    const values = new Map();
    if (!section) return values;
    section.fields.forEach((field) => {
      const value = extraData?.[field.key]?.value;
      if (value != null && value !== '') values.set(field.key, value);
    });
    return values;
  }

  function extractCropModuleFromSection(extraData, definition) {
    const section = SECTION_BY_TITLE.get(definition.title);
    if (!section) return null;
    const sectionValues = buildSectionValueMap(extraData, definition.title);
    if (!sectionValues.size) return null;
    const fields = section.fields;
    const read = (index) => asString(sectionValues.get(fields[index]?.key));
    const readNumber = (index) => asNumber(sectionValues.get(fields[index]?.key));
    const checkboxValue = (indices) =>
      indices
        .map((index) => ({
          option: fields[index]?.label.split('/')[1]?.trim() || '',
          value: read(index)
        }))
        .find((item) => item.value)?.option || '';
    const monthBlock = (startIndex) => ({
      crop_planted: read(startIndex),
      area_ha: readNumber(startIndex + 1),
      seed_kg: readNumber(startIndex + 2),
      basal_dressing_kg: readNumber(startIndex + 3),
      top_dressing_kg: readNumber(startIndex + 4),
      lime_kg: readNumber(startIndex + 5),
      crop_condition: read(startIndex + 6),
      crop_stage: read(startIndex + 7)
    });
    return {
      module_code: definition.code,
      module_label: definition.title,
      planted_this_season: read(0) || null,
      census_or_sample: read(1) || null,
      first_successful_planting_dekad: read(2) || null,
      planting_nov: monthBlock(3),
      planting_dec: monthBlock(11),
      planting_jan: monthBlock(19),
      total_area_planted_ha: readNumber(27),
      confirm_total_area_planted: read(28) || null,
      seed_type: checkboxValue([30, 31, 32]) || read(29) || null,
      major_variety: checkboxValue([34, 35, 36, 37, 38]) || read(33) || null,
      write_off: read(39) || null,
      write_off_area_ha: readNumber(40),
      write_off_cause: read(41) || null,
      write_off_other_cause: read(42) || null,
      gap_filling: read(43) || null,
      area_replanted_ha: readNumber(44),
      major_input_source: read(45) || null,
      input_source_details: {
        seed: read(46) || null,
        other_seed_source: read(47) || null,
        basal: read(48) || null,
        other_basal_source: read(49) || null,
        top_dressing: read(50) || null,
        other_top_dressing_source: read(51) || null,
        input_received: read(52) || null
      },
      provider_quantities: {
        presidential_seed_kg: readNumber(53),
        presidential_basal_fert_kg: readNumber(54),
        presidential_topdressing_fert_kg: readNumber(55),
        afc_seed_kg: readNumber(56),
        afc_basal_fert_kg: readNumber(57),
        afc_topdressing_fert_kg: readNumber(58),
        cbz_agroyield_seed_kg: readNumber(59),
        cbz_agroyield_basal_fert_kg: readNumber(60),
        cbz_agroyield_topdressing_fert_kg: readNumber(61),
        ngo_seed_kg: readNumber(62),
        ngo_basal_fert_kg: readNumber(63),
        ngo_topdressing_fert_kg: readNumber(64),
        other_seed_kg: readNumber(65),
        other_basal_fert_kg: readNumber(66),
        other_topdressing_fert_kg: readNumber(67)
      }
    };
  }

  function extractStructuredCropModules(extraData) {
    const remaining = { ...normalizeExtraData(extraData) };
    const cropModules = [];
    STRUCTURED_CROP_MODULE_SECTIONS.forEach((definition) => {
      const section = SECTION_BY_TITLE.get(definition.title);
      const module = extractCropModuleFromSection(remaining, definition);
      if (module) {
        cropModules.push(module);
        (section?.fields || []).forEach((field) => {
          delete remaining[field.key];
        });
      }
    });
    return { cropModules, remainingExtraData: remaining };
  }

  function extractOtherCropItems(extraData) {
    const remaining = { ...normalizeExtraData(extraData) };
    const section = SECTION_BY_TITLE.get(STRUCTURED_OTHER_CROPS_SECTION);
    if (!section) return { otherCropItems: [], remainingExtraData: remaining };
    const items = [];
    section.fields.forEach((field, index) => {
      if (index < 2) return;
      const record = remaining[field.key];
      const optionName = field.label.split('/')[1]?.trim() || '';
      if (!record || !optionName || /^none$/i.test(optionName)) {
        delete remaining[field.key];
        return;
      }
      items.push({
        crop_name: optionName,
        sort_order: items.length * 10 + 10
      });
      delete remaining[field.key];
    });
    if (section.fields[0]) delete remaining[section.fields[0].key];
    if (section.fields[1]) delete remaining[section.fields[1].key];
    return { otherCropItems: items, remainingExtraData: remaining };
  }

  function extractPfumvudzaModule(extraData) {
    const remaining = { ...normalizeExtraData(extraData) };
    const section = SECTION_BY_TITLE.get(STRUCTURED_PFUMVUDZA_SECTION);
    if (!section) return { pfumvudzaModule: null, remainingExtraData: remaining };
    const sectionValues = buildSectionValueMap(remaining, STRUCTURED_PFUMVUDZA_SECTION);
    if (!sectionValues.size) return { pfumvudzaModule: null, remainingExtraData: remaining };
    const fields = section.fields;
    const read = (index) => asString(sectionValues.get(fields[index]?.key));
    const readNumber = (index) => asNumber(sectionValues.get(fields[index]?.key));
    const cropsGrown = [
      { index: 3, label: 'Maize' },
      { index: 4, label: 'Sorghum' },
      { index: 5, label: 'Pearl Millet' },
      { index: 6, label: 'Soyabean' },
      { index: 7, label: 'Sunflower' },
      { index: 8, label: 'ground nut' },
      { index: 9, label: 'cow pea' }
    ].filter((item) => /^(yes|true|1)$/i.test(read(item.index))).map((item) => item.label);
    const caPrinciples = [
      { index: 13, label: 'Minimum soil tillage' },
      { index: 14, label: 'Soil Cover' },
      { index: 15, label: 'Rotation' }
    ].filter((item) => /^(yes|true|1)$/i.test(read(item.index))).map((item) => item.label);
    const biofortifiedEntries = [
      {
        name: read(24),
        area_ha: readNumber(25),
        crop_condition: read(26)
      },
      {
        name: read(27),
        area_ha: readNumber(28),
        crop_condition: read(29)
      }
    ].filter((item) => item.name || item.area_ha != null || item.crop_condition);
    const cropStocks = {
      maize_kg: readNumber(30),
      sorghum_kg: readNumber(31),
      pearl_millet_kg: readNumber(32),
      finger_millet_kg: readNumber(33)
    };
    const hasStocks = Object.values(cropStocks).some((value) => value != null);
    const pfumvudzaModule = normalizePfumvudzaModule({
      practiced_pfumvudza: read(1),
      crops_grown: cropsGrown,
      cropped_area_under_ca: readNumber(11),
      ca_principles: caPrinciples,
      orange_maize_planted: read(16),
      orange_maize_value: read(17),
      orange_maize_census_or_sample: read(18),
      orange_maize_area_ha: readNumber(19),
      orange_maize_crop_condition: read(20),
      biofortified_planted: read(21),
      biofortified_value: read(22),
      biofortified_census_or_sample: read(23),
      biofortified_entries: biofortifiedEntries,
      crop_stocks: hasStocks ? cropStocks : null
    });
    if (!pfumvudzaModule) return { pfumvudzaModule: null, remainingExtraData: remaining };
    section.fields.forEach((field) => {
      delete remaining[field.key];
    });
    return { pfumvudzaModule, remainingExtraData: remaining };
  }

  function extractLivestockModules(extraData) {
    const remaining = { ...normalizeExtraData(extraData) };
    const livestockModules = [];
    STRUCTURED_LIVESTOCK_SECTIONS.forEach((definition) => {
      const section = SECTION_BY_TITLE.get(definition.title);
      if (!section) return;
      const answers = [];
      section.fields.forEach((field) => {
        const record = remaining[field.key];
        if (!record || record.value == null || record.value === '') return;
        answers.push({
          key: field.key,
          label: record.label || field.label,
          value: String(record.value),
          kind: record.kind || field.kind || 'text'
        });
      });
      if (!answers.length) return;
      livestockModules.push({
        module_code: definition.code,
        module_label: definition.title,
        answers
      });
      section.fields.forEach((field) => {
        delete remaining[field.key];
      });
    });
    return { livestockModules, remainingExtraData: remaining };
  }

  function buildStructuredCropModuleExtraData(cropModules) {
    const extraData = {};
    normalizeCropModules(cropModules).forEach((module) => {
      const section = SECTION_BY_TITLE.get(module.moduleLabel || '');
      if (!section) return;
      const write = (index, value, kind) => {
        const field = section.fields[index];
        if (!field || value == null || value === '') return;
        extraData[field.key] = {
          label: field.label,
          value: String(value),
          kind: kind || field.kind
        };
      };
      const writeMonth = (startIndex, month) => {
        if (!month) return;
        write(startIndex, month.crop_planted);
        write(startIndex + 1, month.area_ha, 'number');
        write(startIndex + 2, month.seed_kg, 'number');
        write(startIndex + 3, month.basal_dressing_kg, 'number');
        write(startIndex + 4, month.top_dressing_kg, 'number');
        write(startIndex + 5, month.lime_kg, 'number');
        write(startIndex + 6, month.crop_condition);
        write(startIndex + 7, month.crop_stage);
      };
      write(0, module.plantedThisSeason);
      write(1, module.censusOrSample);
      write(2, module.firstSuccessfulPlantingDekad);
      writeMonth(3, module.plantingNov);
      writeMonth(11, module.plantingDec);
      writeMonth(19, module.plantingJan);
      write(27, module.totalAreaPlantedHa, 'number');
      write(28, module.confirmTotalAreaPlanted);
      write(29, module.seedType);
      if (module.seedType) {
        const seedOption = {
          Hybrid: 30,
          'O.P.V': 31,
          OPV: 31,
          'N/A': 32
        }[module.seedType];
        if (seedOption != null) write(seedOption, 'Yes', 'checkbox');
      }
      write(33, module.majorVariety);
      const varietyOption = {
        'Ultra-Short season': 34,
        'Short season': 35,
        'Medium season': 36,
        'Long season': 37,
        'N/A': 38
      }[module.majorVariety];
      if (varietyOption != null) write(varietyOption, 'Yes', 'checkbox');
      write(39, module.writeOff);
      write(40, module.writeOffAreaHa, 'number');
      write(41, module.writeOffCause);
      write(42, module.writeOffOtherCause);
      write(43, module.gapFilling);
      write(44, module.areaReplantedHa, 'number');
      write(45, module.majorInputSource);
      write(46, module.inputSourceDetails?.seed);
      write(47, module.inputSourceDetails?.other_seed_source);
      write(48, module.inputSourceDetails?.basal);
      write(49, module.inputSourceDetails?.other_basal_source);
      write(50, module.inputSourceDetails?.top_dressing);
      write(51, module.inputSourceDetails?.other_top_dressing_source);
      write(52, module.inputSourceDetails?.input_received);
      write(53, module.providerQuantities?.presidential_seed_kg, 'number');
      write(54, module.providerQuantities?.presidential_basal_fert_kg, 'number');
      write(55, module.providerQuantities?.presidential_topdressing_fert_kg, 'number');
      write(56, module.providerQuantities?.afc_seed_kg, 'number');
      write(57, module.providerQuantities?.afc_basal_fert_kg, 'number');
      write(58, module.providerQuantities?.afc_topdressing_fert_kg, 'number');
      write(59, module.providerQuantities?.cbz_agroyield_seed_kg, 'number');
      write(60, module.providerQuantities?.cbz_agroyield_basal_fert_kg, 'number');
      write(61, module.providerQuantities?.cbz_agroyield_topdressing_fert_kg, 'number');
      write(62, module.providerQuantities?.ngo_seed_kg, 'number');
      write(63, module.providerQuantities?.ngo_basal_fert_kg, 'number');
      write(64, module.providerQuantities?.ngo_topdressing_fert_kg, 'number');
      write(65, module.providerQuantities?.other_seed_kg, 'number');
      write(66, module.providerQuantities?.other_basal_fert_kg, 'number');
      write(67, module.providerQuantities?.other_topdressing_fert_kg, 'number');
    });
    return extraData;
  }

  function buildOtherCropItemsExtraData(otherCropItems) {
    const extraData = {};
    const section = SECTION_BY_TITLE.get(STRUCTURED_OTHER_CROPS_SECTION);
    if (!section) return extraData;
    const selected = new Set(normalizeOtherCropItems(otherCropItems).map((item) => item.cropName));
    section.fields.forEach((field, index) => {
      if (index < 2) return;
      const optionName = field.label.split('/')[1]?.trim() || '';
      if (!optionName || !selected.has(optionName)) return;
      extraData[field.key] = {
        label: field.label,
        value: 'Yes',
        kind: 'checkbox'
      };
    });
    return extraData;
  }

  function buildPfumvudzaExtraData(pfumvudzaModule) {
    const extraData = {};
    const section = SECTION_BY_TITLE.get(STRUCTURED_PFUMVUDZA_SECTION);
    const module = normalizePfumvudzaModule(pfumvudzaModule);
    if (!section || !module) return extraData;
    const write = (index, value, kind) => {
      const field = section.fields[index];
      if (!field || value == null || value === '') return;
      extraData[field.key] = {
        label: field.label,
        value: String(value),
        kind: kind || field.kind
      };
    };
    const markCheckbox = (index) => write(index, 'Yes', 'checkbox');
    write(1, module.practicedPfumvudza);
    if (module.cropsGrown.length) write(2, module.cropsGrown.join(', '));
    const cropIndexByName = {
      Maize: 3,
      Sorghum: 4,
      'Pearl Millet': 5,
      Soyabean: 6,
      Sunflower: 7,
      'ground nut': 8,
      'cow pea': 9
    };
    module.cropsGrown.forEach((item) => {
      const index = cropIndexByName[item];
      if (index != null) markCheckbox(index);
    });
    write(11, module.croppedAreaUnderCa, 'number');
    if (module.caPrinciples.length) write(12, module.caPrinciples.join(', '));
    const principleIndexByName = {
      'Minimum soil tillage': 13,
      'Soil Cover': 14,
      Rotation: 15
    };
    module.caPrinciples.forEach((item) => {
      const index = principleIndexByName[item];
      if (index != null) markCheckbox(index);
    });
    write(16, module.orangeMaizePlanted);
    write(17, module.orangeMaizeValue);
    write(18, module.orangeMaizeCensusOrSample);
    write(19, module.orangeMaizeAreaHa, 'number');
    write(20, module.orangeMaizeCropCondition);
    write(21, module.biofortifiedPlanted);
    write(22, module.biofortifiedValue);
    write(23, module.biofortifiedCensusOrSample);
    const firstEntry = module.biofortifiedEntries[0];
    const secondEntry = module.biofortifiedEntries[1];
    write(24, firstEntry?.name);
    write(25, firstEntry?.areaHa, 'number');
    write(26, firstEntry?.cropCondition);
    write(27, secondEntry?.name);
    write(28, secondEntry?.areaHa, 'number');
    write(29, secondEntry?.cropCondition);
    write(30, module.cropStocks?.maizeKg, 'number');
    write(31, module.cropStocks?.sorghumKg, 'number');
    write(32, module.cropStocks?.pearlMilletKg, 'number');
    write(33, module.cropStocks?.fingerMilletKg, 'number');
    return extraData;
  }

  function buildLivestockModulesExtraData(livestockModules) {
    const extraData = {};
    normalizeLivestockModules(livestockModules).forEach((module) => {
      module.answers.forEach((answer) => {
        if (!answer.key || answer.value == null || answer.value === '') return;
        extraData[answer.key] = {
          label: answer.label || answer.key,
          value: String(answer.value),
          kind: answer.kind || 'text'
        };
      });
    });
    return extraData;
  }

  function ensureSelectOption(select, value) {
    if (!select || value == null || value === '') return;
    if ([...select.options].some((option) => option.value === value)) return;
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }

  function renderField(field) {
    const wrapper = document.createElement('div');
    const slashIndex = field.label.indexOf('/');
    const optionLabel = slashIndex > -1 ? field.label.slice(slashIndex + 1).trim() : field.label;
    const baseLabel = slashIndex > -1 ? field.label.slice(0, slashIndex).trim() : field.label;

    if (field.kind === 'checkbox') {
      wrapper.className = 'status';
      wrapper.style.marginBottom = '.75rem';
      wrapper.style.padding = '.7rem .8rem';
      wrapper.innerHTML = `<label style="display:flex;gap:.6rem;align-items:flex-start;cursor:pointer"><input type="checkbox" id="${field.key}" data-ministry-extra-key="${field.key}" data-ministry-extra-label="${escapeHtml(
        field.label
      )}" data-ministry-extra-kind="${field.kind}" style="margin-top:.2rem"><span><strong style="display:block">${escapeHtml(
        baseLabel
      )}</strong><span style="font-size:.88rem;color:#5f6f5f">${escapeHtml(optionLabel)}</span></span></label>`;
      return wrapper;
    }

    wrapper.className = 'input-group';
    if (field.kind === 'select') {
      wrapper.innerHTML = `<select id="${field.key}" data-ministry-extra-key="${field.key}" data-ministry-extra-label="${escapeHtml(
        field.label
      )}" data-ministry-extra-kind="${field.kind}">${BINARY_OPTIONS.map(
        (option) => `<option value="${escapeHtml(option)}"${option ? '' : ' selected'}>${escapeHtml(option || '')}</option>`
      ).join('')}</select><label for="${field.key}">${escapeHtml(field.label)}</label>`;
      return wrapper;
    }

    const inputType = field.kind === 'number' ? 'number' : 'text';
    const step = field.kind === 'number' ? ' step="any"' : '';
    wrapper.innerHTML = `<input type="${inputType}" id="${field.key}" placeholder=" " data-ministry-extra-key="${field.key}" data-ministry-extra-label="${escapeHtml(
      field.label
    )}" data-ministry-extra-kind="${field.kind}"${step}><label for="${field.key}">${escapeHtml(field.label)}</label>`;
    return wrapper;
  }

  function getModuleFocusForSection(title) {
    return LIVESTOCK_SECTION_TITLES.has(title) ? 'livestock' : 'crop';
  }

  function applyModuleFocus(drawer, focus) {
    const toggleButtons = drawer.querySelectorAll('[data-module-focus]');
    toggleButtons.forEach((button) => {
      const active = button.dataset.moduleFocus === focus;
      button.classList.toggle('active', active);
      button.classList.toggle('secondary', !active);
      button.setAttribute('aria-pressed', String(active));
    });
    drawer.querySelectorAll('[data-ministry-module]').forEach((sectionDrawer) => {
      const matches = focus === 'all' || sectionDrawer.dataset.ministryModule === focus;
      sectionDrawer.hidden = !matches;
    });
  }

  function injectExtendedQuestionnaire() {
    if (!MINISTRY_SECTIONS.length || document.getElementById('ministry-full-questionnaire')) return;

      const host =
        document.getElementById('collect-step-more-panel') ||
        document.getElementById('crop-form');
      const saveAnchor =
        document.getElementById('save-action-stack') ||
        document.getElementById('save-flow-card') ||
        document.getElementById('save-entry-btn');
      if (!host || !saveAnchor) return;

    const drawer = document.createElement('details');
    drawer.id = 'ministry-full-questionnaire';
    drawer.className = 'compact-menu';
    drawer.innerHTML =
      '<summary><span id="ministry-questionnaire-summary-label">Crop Questionnaire Extensions</span><i data-feather="chevron-down"></i></summary><div class="compact-menu-body"><div class="status" style="margin-bottom:.75rem;background:#eef6ef;color:#1b5e20">The remaining ministry questions now sit inside the active ODK path. Stay in Crop for crop production questions or Livestock for animal-related questions.</div><div class="status" id="ministry-module-focus-note" style="margin-bottom:.75rem;background:#f5faf5;color:#49604c">Only the pages that belong to the selected questionnaire module stay visible.</div></div>';

    const body = drawer.querySelector('.compact-menu-body');
    MINISTRY_SECTIONS.forEach((section) => {
      const sectionDrawer = document.createElement('details');
      sectionDrawer.className = 'compact-menu';
      sectionDrawer.dataset.ministryModule = getModuleFocusForSection(section.title);
      sectionDrawer.innerHTML = `<summary><span>${escapeHtml(section.title)}</span><i data-feather="chevron-down"></i></summary><div class="compact-menu-body"></div>`;
      const sectionBody = sectionDrawer.querySelector('.compact-menu-body');
      section.fields.forEach((field) => sectionBody.appendChild(renderField(field)));
      body.appendChild(sectionDrawer);
    });

      if (host.id === 'crop-form' && saveAnchor.parentNode === host) {
        host.insertBefore(drawer, saveAnchor);
      } else {
        host.appendChild(drawer);
      }

    drawer.addEventListener('toggle', () => feather.replace());
    drawer.querySelectorAll('details').forEach((item) =>
      item.addEventListener('toggle', () => feather.replace())
    );
    const preferredFocus =
      document.body?.dataset?.collectorPrimaryModule ||
      localStorage.getItem('crop_collector_primary_module') ||
      'crop';
    applyModuleFocus(drawer, preferredFocus === 'livestock' ? 'livestock' : 'crop');
    window.setMinistryQuestionnaireModuleFocus = function (focus = 'crop') {
      applyModuleFocus(drawer, focus === 'livestock' ? 'livestock' : 'crop');
      const summaryLabel = document.getElementById('ministry-questionnaire-summary-label');
      const note = document.getElementById('ministry-module-focus-note');
      if (summaryLabel) summaryLabel.textContent = focus === 'livestock' ? 'Livestock Questionnaire Extensions' : 'Crop Questionnaire Extensions';
      if (note) note.textContent = focus === 'livestock'
        ? 'Only livestock extension pages remain visible in this questionnaire path.'
        : 'Only crop extension pages remain visible in this questionnaire path.';
    };
    window.setMinistryQuestionnaireModuleFocus(preferredFocus === 'livestock' ? 'livestock' : 'crop');
    feather.replace();
  }

  function normalizeExtraData(data) {
    const normalized = {};
    Object.entries(data || {}).forEach(([key, value]) => {
      const record = value && typeof value === 'object' ? value : { value };
      const nextValue =
        record.value == null ? '' : typeof record.value === 'string' ? record.value.trim() : String(record.value);
      if (!nextValue) return;
      normalized[key] = {
        label: record.label || key,
        value: nextValue,
        kind: record.kind || 'text'
      };
    });
    return normalized;
  }

  function readExtraFieldValues() {
    const values = {};
    document.querySelectorAll('[data-ministry-extra-key]').forEach((field) => {
      const kind = field.dataset.ministryExtraKind || 'text';
      const value = kind === 'checkbox' ? (field.checked ? 'Yes' : '') : String(field.value || '').trim();
      if (!value) return;
      values[field.dataset.ministryExtraKey] = {
        label: field.dataset.ministryExtraLabel || field.id,
        value,
        kind
      };
    });
    return values;
  }

  function writeExtraFieldValues(data) {
    const normalized = normalizeExtraData(data);
    document.querySelectorAll('[data-ministry-extra-key]').forEach((field) => {
      const key = field.dataset.ministryExtraKey;
      const value = normalized[key]?.value || '';
      if ((field.dataset.ministryExtraKind || 'text') === 'checkbox') {
        field.checked = /^(yes|true|1)$/i.test(value);
      } else {
        if (field.tagName === 'SELECT') ensureSelectOption(field, value);
        field.value = value;
      }
    });
  }

  function splitNotesAndExtra(notes) {
    const text = String(notes || '');
    const markerIndex = text.indexOf(NOTE_MARKER);
    if (markerIndex === -1) return { notes: text, extra: {} };
    const plainNotes = text.slice(0, markerIndex).replace(/\s+$/, '');
    const payload = text.slice(markerIndex + NOTE_MARKER.length).trim();
    try {
      return { notes: plainNotes, extra: normalizeExtraData(JSON.parse(payload)) };
    } catch {
      return { notes: plainNotes, extra: {} };
    }
  }

  function getFilledExtraItems(entry) {
    return Object.values(normalizeExtraData(entry?.ministryRemainingExtraData || entry?.ministryExtraData)).sort((a, b) =>
      String(a.label || '').localeCompare(String(b.label || ''))
    );
  }

  function patchGlobalFunctions() {
    const originalReadPlotAgronomyFields = window.readPlotAgronomyFields;
    const originalWritePlotAgronomyFields = window.writePlotAgronomyFields;
    const originalResetForm = window.resetForm;
    const originalPrepareNextPlot = window.prepareNextPlotForSameFarmer;
    const originalNormalizeLocalEntry = window.normalizeLocalEntry;
    const originalNormalizeBackendEntry = window.normalizeBackendEntry;
    const originalBuildSyncItem = window.buildSyncItem;
    const originalBuildUpdateItem = window.buildUpdateItem;
    const originalCreateEntryListItem = window.createEntryListItem;
    const originalCollectionGeoJSON = window.collectionGeoJSON;

    if (typeof originalReadPlotAgronomyFields === 'function') {
      window.readPlotAgronomyFields = function () {
        const values = originalReadPlotAgronomyFields();
        values.ministryExtraData = readExtraFieldValues();
        return values;
      };
    }

    if (typeof originalWritePlotAgronomyFields === 'function') {
      window.writePlotAgronomyFields = function (values) {
        originalWritePlotAgronomyFields(values);
        writeExtraFieldValues(values?.ministryExtraData || {});
      };
    }

    if (typeof originalResetForm === 'function') {
      window.resetForm = function () {
        originalResetForm();
        writeExtraFieldValues({});
      };
    }

    if (typeof originalPrepareNextPlot === 'function') {
      window.prepareNextPlotForSameFarmer = function (draft) {
        const extraData = normalizeExtraData(draft?.ministryExtraData);
        originalPrepareNextPlot(draft);
        writeExtraFieldValues(extraData);
      };
    }

    if (typeof originalNormalizeLocalEntry === 'function') {
      window.normalizeLocalEntry = function (entry) {
        const normalized = originalNormalizeLocalEntry(entry);
        const parsed = splitNotesAndExtra(entry?.notes || normalized.notes || '');
        normalized.notes = parsed.notes;
        const cropModules = normalizeCropModules(entry?.cropModules || entry?.crop_modules || []);
        const otherCropItems = normalizeOtherCropItems(entry?.otherCropItems || entry?.other_crop_items || []);
        const pfumvudzaModule = normalizePfumvudzaModule(entry?.pfumvudzaModule || entry?.pfumvudza_module);
        const livestockModules = normalizeLivestockModules(entry?.livestockModules || entry?.livestock_modules || []);
        const baseExtra = normalizeExtraData(entry?.ministryExtraData || entry?.ministry_extra_data || parsed.extra);
        const extractedModules = extractStructuredCropModules(baseExtra);
        const extractedOtherCrops = extractOtherCropItems(extractedModules.remainingExtraData);
        const extractedPfumvudza = extractPfumvudzaModule(extractedOtherCrops.remainingExtraData);
        const extractedLivestock = extractLivestockModules(extractedPfumvudza.remainingExtraData);
        normalized.cropModules = cropModules.length ? cropModules : normalizeCropModules(extractedModules.cropModules);
        normalized.otherCropItems = otherCropItems.length ? otherCropItems : normalizeOtherCropItems(extractedOtherCrops.otherCropItems);
        normalized.pfumvudzaModule = pfumvudzaModule || normalizePfumvudzaModule(extractedPfumvudza.pfumvudzaModule);
        normalized.livestockModules = livestockModules.length ? livestockModules : normalizeLivestockModules(extractedLivestock.livestockModules);
        normalized.ministryRemainingExtraData = extractedLivestock.remainingExtraData;
        normalized.ministryExtraData = {
          ...extractedLivestock.remainingExtraData,
          ...buildStructuredCropModuleExtraData(normalized.cropModules),
          ...buildOtherCropItemsExtraData(normalized.otherCropItems),
          ...buildPfumvudzaExtraData(normalized.pfumvudzaModule),
          ...buildLivestockModulesExtraData(normalized.livestockModules)
        };
        return normalized;
      };
    }

    if (typeof originalNormalizeBackendEntry === 'function') {
      window.normalizeBackendEntry = function (entry) {
        const parsed = splitNotesAndExtra(entry?.notes || '');
        const normalized = originalNormalizeBackendEntry({ ...entry, notes: parsed.notes });
        normalized.notes = parsed.notes;
        const baseExtra = normalizeExtraData(entry?.ministry_extra_data || parsed.extra);
        const extractedModules = extractStructuredCropModules(baseExtra);
        const extractedOtherCrops = extractOtherCropItems(extractedModules.remainingExtraData);
        const extractedPfumvudza = extractPfumvudzaModule(extractedOtherCrops.remainingExtraData);
        const extractedLivestock = extractLivestockModules(extractedPfumvudza.remainingExtraData);
        normalized.cropModules = normalizeCropModules(entry?.crop_modules || []).length
          ? normalizeCropModules(entry?.crop_modules || [])
          : normalizeCropModules(extractedModules.cropModules);
        normalized.otherCropItems = normalizeOtherCropItems(entry?.other_crop_items || []).length
          ? normalizeOtherCropItems(entry?.other_crop_items || [])
          : normalizeOtherCropItems(extractedOtherCrops.otherCropItems);
        normalized.pfumvudzaModule =
          normalizePfumvudzaModule(entry?.pfumvudza_module) ||
          normalizePfumvudzaModule(extractedPfumvudza.pfumvudzaModule);
        normalized.livestockModules = normalizeLivestockModules(entry?.livestock_modules || []).length
          ? normalizeLivestockModules(entry?.livestock_modules || [])
          : normalizeLivestockModules(extractedLivestock.livestockModules);
        normalized.ministryRemainingExtraData = extractedLivestock.remainingExtraData;
        normalized.ministryExtraData = {
          ...normalized.ministryRemainingExtraData,
          ...buildStructuredCropModuleExtraData(normalized.cropModules),
          ...buildOtherCropItemsExtraData(normalized.otherCropItems),
          ...buildPfumvudzaExtraData(normalized.pfumvudzaModule),
          ...buildLivestockModulesExtraData(normalized.livestockModules)
        };
        return normalized;
      };
    }

    if (typeof originalBuildSyncItem === 'function') {
      window.buildSyncItem = function (entry) {
        const parsed = splitNotesAndExtra(entry?.notes || '');
        const payload = originalBuildSyncItem({ ...entry, notes: parsed.notes });
        payload.notes = parsed.notes || null;
        const extractedModules = extractStructuredCropModules(entry?.ministryExtraData || parsed.extra);
        const extractedOtherCrops = extractOtherCropItems(extractedModules.remainingExtraData);
        const extractedPfumvudza = extractPfumvudzaModule(extractedOtherCrops.remainingExtraData);
        const extractedLivestock = extractLivestockModules(extractedPfumvudza.remainingExtraData);
        payload.ministry_extra_data = extractedLivestock.remainingExtraData;
        payload.crop_modules = extractedModules.cropModules;
        payload.other_crop_items = extractedOtherCrops.otherCropItems;
        payload.pfumvudza_module = extractedPfumvudza.pfumvudzaModule;
        const livestockModules = normalizeLivestockModules(entry?.livestockModules || entry?.livestock_modules || payload.livestock_modules || []);
        payload.livestock_modules = livestockModules.length ? livestockModules : extractedLivestock.livestockModules;
        return payload;
      };
    }

    if (typeof originalBuildUpdateItem === 'function') {
      window.buildUpdateItem = function (entry) {
        const parsed = splitNotesAndExtra(entry?.notes || '');
        const payload = originalBuildUpdateItem({ ...entry, notes: parsed.notes });
        payload.notes = parsed.notes || null;
        const extractedModules = extractStructuredCropModules(entry?.ministryExtraData || parsed.extra);
        const extractedOtherCrops = extractOtherCropItems(extractedModules.remainingExtraData);
        const extractedPfumvudza = extractPfumvudzaModule(extractedOtherCrops.remainingExtraData);
        const extractedLivestock = extractLivestockModules(extractedPfumvudza.remainingExtraData);
        payload.ministry_extra_data = extractedLivestock.remainingExtraData;
        payload.crop_modules = extractedModules.cropModules;
        payload.other_crop_items = extractedOtherCrops.otherCropItems;
        payload.pfumvudza_module = extractedPfumvudza.pfumvudzaModule;
        const livestockModules = normalizeLivestockModules(entry?.livestockModules || entry?.livestock_modules || payload.livestock_modules || []);
        payload.livestock_modules = livestockModules.length ? livestockModules : extractedLivestock.livestockModules;
        return payload;
      };
    }

    if (typeof originalCreateEntryListItem === 'function') {
      window.createEntryListItem = function (entry) {
        const node = originalCreateEntryListItem(entry);
        const filledItems = getFilledExtraItems(entry);
        const details = node.querySelector('.entry-details');
        if (!details || details.querySelector('[data-ministry-extra-panel]')) return node;
        const cropModules = normalizeCropModules(entry?.cropModules || entry?.crop_modules || []);
        const otherCropItems = normalizeOtherCropItems(entry?.otherCropItems || entry?.other_crop_items || []);
        const pfumvudzaModule = normalizePfumvudzaModule(entry?.pfumvudzaModule || entry?.pfumvudza_module);
        const livestockModules = normalizeLivestockModules(entry?.livestockModules || entry?.livestock_modules || []);
        if (!filledItems.length && !cropModules.length && !otherCropItems.length && !pfumvudzaModule && !livestockModules.length) return node;
        if (cropModules.length && !details.querySelector('[data-crop-module-panel]')) {
          const modulePanel = document.createElement('details');
          modulePanel.className = 'compact-menu';
          modulePanel.setAttribute('data-crop-module-panel', 'true');
          modulePanel.style.marginTop = '.65rem';
          modulePanel.innerHTML = `<summary><span>Crop Modules (${cropModules.length})</span><i data-feather="chevron-down"></i></summary><div class="compact-menu-body"></div>`;
          const moduleBody = modulePanel.querySelector('.compact-menu-body');
          cropModules.forEach((module) => {
            const row = document.createElement('div');
            row.style.marginBottom = '.6rem';
            row.innerHTML = `<strong>${escapeHtml(module.moduleLabel)}:</strong> ${escapeHtml(
              [module.plantedThisSeason, module.totalAreaPlantedHa != null && module.totalAreaPlantedHa !== '' ? `${module.totalAreaPlantedHa} ha` : '', module.majorVariety]
                .filter(Boolean)
                .join(' | ') || 'No summary'
            )}`;
            moduleBody.appendChild(row);
          });
          details.appendChild(modulePanel);
        }
        if (otherCropItems.length && !details.querySelector('[data-other-crops-panel]')) {
          const otherPanel = document.createElement('details');
          otherPanel.className = 'compact-menu';
          otherPanel.setAttribute('data-other-crops-panel', 'true');
          otherPanel.style.marginTop = '.65rem';
          otherPanel.innerHTML = `<summary><span>Other Crops (${otherCropItems.length})</span><i data-feather="chevron-down"></i></summary><div class="compact-menu-body"></div>`;
          const otherBody = otherPanel.querySelector('.compact-menu-body');
          otherCropItems.forEach((item) => {
            const row = document.createElement('div');
            row.style.marginBottom = '.45rem';
            row.textContent = item.cropName;
            otherBody.appendChild(row);
          });
          details.appendChild(otherPanel);
        }
        if (pfumvudzaModule && !details.querySelector('[data-pfumvudza-panel]')) {
          const pfumvudzaPanel = document.createElement('details');
          pfumvudzaPanel.className = 'compact-menu';
          pfumvudzaPanel.setAttribute('data-pfumvudza-panel', 'true');
          pfumvudzaPanel.style.marginTop = '.65rem';
          pfumvudzaPanel.innerHTML = `<summary><span>Pfumvudza / CA</span><i data-feather="chevron-down"></i></summary><div class="compact-menu-body"></div>`;
          const pfumvudzaBody = pfumvudzaPanel.querySelector('.compact-menu-body');
          const summary = document.createElement('div');
          summary.style.marginBottom = '.55rem';
          summary.innerHTML = `<strong>Summary:</strong> ${escapeHtml(
            [
              pfumvudzaModule.practicedPfumvudza,
              pfumvudzaModule.croppedAreaUnderCa !== '' && pfumvudzaModule.croppedAreaUnderCa != null
                ? `${pfumvudzaModule.croppedAreaUnderCa} ha under CA`
                : '',
              pfumvudzaModule.orangeMaizePlanted ? `Orange maize: ${pfumvudzaModule.orangeMaizePlanted}` : '',
              pfumvudzaModule.biofortifiedPlanted ? `Biofortified: ${pfumvudzaModule.biofortifiedPlanted}` : ''
            ]
              .filter(Boolean)
              .join(' | ') || 'No summary'
          )}`;
          pfumvudzaBody.appendChild(summary);
          if (pfumvudzaModule.cropsGrown.length) {
            const cropsRow = document.createElement('div');
            cropsRow.style.marginBottom = '.45rem';
            cropsRow.innerHTML = `<strong>Crops:</strong> ${escapeHtml(pfumvudzaModule.cropsGrown.join(', '))}`;
            pfumvudzaBody.appendChild(cropsRow);
          }
          if (pfumvudzaModule.caPrinciples.length) {
            const principleRow = document.createElement('div');
            principleRow.style.marginBottom = '.45rem';
            principleRow.innerHTML = `<strong>CA Principles:</strong> ${escapeHtml(pfumvudzaModule.caPrinciples.join(', '))}`;
            pfumvudzaBody.appendChild(principleRow);
          }
          if (pfumvudzaModule.biofortifiedEntries.length) {
            pfumvudzaModule.biofortifiedEntries.forEach((item) => {
              const row = document.createElement('div');
              row.style.marginBottom = '.45rem';
              row.innerHTML = `<strong>Biofortified:</strong> ${escapeHtml(
                [item.name, item.areaHa !== '' && item.areaHa != null ? `${item.areaHa} ha` : '', item.cropCondition]
                  .filter(Boolean)
                  .join(' | ')
              )}`;
              pfumvudzaBody.appendChild(row);
            });
          }
          details.appendChild(pfumvudzaPanel);
        }
        if (livestockModules.length && !details.querySelector('[data-livestock-panel]')) {
          const livestockPanel = document.createElement('details');
          livestockPanel.className = 'compact-menu';
          livestockPanel.setAttribute('data-livestock-panel', 'true');
          livestockPanel.style.marginTop = '.65rem';
          livestockPanel.innerHTML = `<summary><span>Livestock Modules (${livestockModules.length})</span><i data-feather="chevron-down"></i></summary><div class="compact-menu-body"></div>`;
          const livestockBody = livestockPanel.querySelector('.compact-menu-body');
          livestockModules.forEach((module) => {
            const row = document.createElement('div');
            row.style.marginBottom = '.6rem';
            const preview = module.answers
              .slice(0, 3)
              .map((answer) => `${answer.label}: ${answer.value}`)
              .join(' | ');
            row.innerHTML = `<strong>${escapeHtml(module.moduleLabel)}:</strong> ${escapeHtml(
              `${module.answers.length} answered field${module.answers.length === 1 ? '' : 's'}${preview ? ` | ${preview}` : ''}`
            )}`;
            livestockBody.appendChild(row);
          });
          details.appendChild(livestockPanel);
        }
        if (filledItems.length) {
          const extraPanel = document.createElement('details');
          extraPanel.className = 'compact-menu';
          extraPanel.setAttribute('data-ministry-extra-panel', 'true');
          extraPanel.style.marginTop = '.65rem';
          extraPanel.innerHTML = `<summary><span>Extended Ministry Fields (${filledItems.length})</span><i data-feather="chevron-down"></i></summary><div class="compact-menu-body"></div>`;
          const body = extraPanel.querySelector('.compact-menu-body');
          filledItems.forEach((item) => {
            const row = document.createElement('div');
            row.style.marginBottom = '.5rem';
            row.innerHTML = `<strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}`;
            body.appendChild(row);
          });
          details.appendChild(extraPanel);
        }
        feather.replace();
        return node;
      };
    }

    if (typeof originalCollectionGeoJSON === 'function') {
      window.collectionGeoJSON = function () {
        const geojson = originalCollectionGeoJSON();
        const entryList = typeof fieldEntries !== 'undefined' ? fieldEntries : [];
        geojson.features.forEach((feature, index) => {
          const entry = entryList[index];
          const extraData = normalizeExtraData(entry?.ministryRemainingExtraData || entry?.ministryExtraData);
          const cropModules = normalizeCropModules(entry?.cropModules || entry?.crop_modules || []);
          const otherCropItems = normalizeOtherCropItems(entry?.otherCropItems || entry?.other_crop_items || []);
          const pfumvudzaModule = normalizePfumvudzaModule(entry?.pfumvudzaModule || entry?.pfumvudza_module);
          const livestockModules = normalizeLivestockModules(entry?.livestockModules || entry?.livestock_modules || []);
          feature.properties.ministry_extra_count = Object.keys(extraData).length;
          feature.properties.ministry_extra_json = Object.keys(extraData).length ? JSON.stringify(extraData) : null;
          feature.properties.crop_modules_json = cropModules.length ? JSON.stringify(cropModules) : null;
          feature.properties.other_crops_json = otherCropItems.length ? JSON.stringify(otherCropItems) : null;
          feature.properties.pfumvudza_module_json = pfumvudzaModule ? JSON.stringify(pfumvudzaModule) : null;
          feature.properties.livestock_modules_json = livestockModules.length ? JSON.stringify(livestockModules) : null;
        });
        return geojson;
      };
    }
  }

  function init() {
    injectExtendedQuestionnaire();
    patchGlobalFunctions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
