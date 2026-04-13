// ============================================================
// ADTEC LI System — Google Apps Script Backend
// Paste kod ini di: script.google.com → New Project
// Deploy sebagai: Web App → Execute as: Me → Access: Anyone
// ============================================================

const SHEET_ID = "1JYsN2Ozl4LQqIYMsq9FO_QETgspB5qSrTqD1oq4u2iI";
const SHEET_NAME = "Worksheet"; // Nama tab sheet

// Kolum dalam spreadsheet (1-indexed)
const COL = {
  BIL:              1,
  NAMA:             2,
  NDP:              3,
  IC:               4,
  KURSUS:           5,
  SESI:             6,
  ALAMAT:           7,
  TELEFON:          8,
  ALAMAT_SYARIKAT:  9,
  PENYELIA:         10,
  TEL_SYARIKAT:     11,
  MULA_LI:          12,
  TAMAT_LI:         13,
  LAPOR_DIRI:       14,
  ELAUN:            15
};

// ─── Main Handler ──────────────────────────────────────────
function doGet(e) {
  const params = e.parameter;
  const action = params.action;
  let result;

  try {
    switch (action) {
      case 'login':
        result = handleLogin(params);
        break;
      case 'getAllPelajar':
        result = handleGetAll();
        break;
      case 'updatePelajar':
        result = handleUpdate(params);
        break;
      default:
        result = { status: 'error', message: 'Action tidak dikenali: ' + action };
    }
  } catch (err) {
    result = { status: 'error', message: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Handle Login ──────────────────────────────────────────
function handleLogin(params) {
  const ic  = (params.ic  || '').trim();
  const ndp = (params.ndp || '').trim();

  if (!ic || !ndp) {
    return { status: 'error', message: 'No. IC dan NDP diperlukan' };
  }

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();

  // Skip header row (row 1)
  for (let r = 2; r <= lastRow; r++) {
    const rowIc  = sheet.getRange(r, COL.IC).getValue().toString().trim();
    const rowNdp = sheet.getRange(r, COL.NDP).getValue().toString().trim();

    if (rowIc === ic && rowNdp === ndp) {
      const row = sheet.getRange(r, 1, 1, COL.ELAUN).getValues()[0];
      return {
        status: 'ok',
        pelajar: buildPelajarObj(row)
      };
    }
  }

  return { status: 'error', message: 'No. Kad Pengenalan atau NDP tidak sah' };
}

// ─── Handle Get All ────────────────────────────────────────
function handleGetAll() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return { status: 'ok', data: [] };

  const data = sheet.getRange(2, 1, lastRow - 1, COL.ELAUN).getValues();
  const pelajarList = data
    .filter(row => row[COL.NDP - 1]) // skip empty rows
    .map(row => buildPelajarObj(row));

  return { status: 'ok', data: pelajarList };
}

// ─── Handle Update ─────────────────────────────────────────
function handleUpdate(params) {
  const ndp   = (params.ndp   || '').trim();
  const field = (params.field || '').trim();

  if (!ndp || !field) {
    return { status: 'error', message: 'NDP dan field diperlukan' };
  }

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  let targetRow = -1;

  for (let r = 2; r <= lastRow; r++) {
    const rowNdp = sheet.getRange(r, COL.NDP).getValue().toString().trim();
    if (rowNdp === ndp) { targetRow = r; break; }
  }

  if (targetRow === -1) {
    return { status: 'error', message: 'Pelajar tidak ditemui: ' + ndp };
  }

  if (field === 'maklumat') {
    sheet.getRange(targetRow, COL.ALAMAT).setValue(params.alamat || '');
    sheet.getRange(targetRow, COL.TELEFON).setValue(params.telefon || '');

  } else if (field === 'syarikat') {
    sheet.getRange(targetRow, COL.ALAMAT_SYARIKAT).setValue(params.alamatSyarikat || '');
    sheet.getRange(targetRow, COL.PENYELIA).setValue(params.penyelia || '');
    sheet.getRange(targetRow, COL.TEL_SYARIKAT).setValue(params.telefonSyarikat || '');
    sheet.getRange(targetRow, COL.MULA_LI).setValue(params.mulaLI || '');
    sheet.getRange(targetRow, COL.TAMAT_LI).setValue(params.tamatLI || '');
    sheet.getRange(targetRow, COL.LAPOR_DIRI).setValue(params.laporDiri || '');
    sheet.getRange(targetRow, COL.ELAUN).setValue(params.elaun || '');

  } else {
    return { status: 'error', message: 'Field tidak dikenali: ' + field };
  }

  // Log update time in column 16 (optional)
  try {
    sheet.getRange(targetRow, 16).setValue(new Date().toLocaleString('ms-MY'));
  } catch(e) {}

  return { status: 'ok', message: 'Data berjaya dikemaskini' };
}

// ─── Helper: Build Pelajar Object ─────────────────────────
function buildPelajarObj(row) {
  return {
    bil:             row[COL.BIL - 1]             || '',
    nama:            row[COL.NAMA - 1]            || '',
    ndp:             row[COL.NDP - 1].toString()  || '',
    ic:              row[COL.IC - 1].toString()   || '',
    kursus:          row[COL.KURSUS - 1]          || '',
    sesi:            row[COL.SESI - 1]            || '',
    alamat:          row[COL.ALAMAT - 1]          || '',
    telefon:         row[COL.TELEFON - 1]         || '',
    alamatSyarikat:  row[COL.ALAMAT_SYARIKAT - 1] || '',
    penyelia:        row[COL.PENYELIA - 1]        || '',
    telefonSyarikat: row[COL.TEL_SYARIKAT - 1]   || '',
    mulaLI:          formatDate(row[COL.MULA_LI - 1]),
    tamatLI:         formatDate(row[COL.TAMAT_LI - 1]),
    laporDiri:       formatDate(row[COL.LAPOR_DIRI - 1]),
    elaun:           row[COL.ELAUN - 1]           || ''
  };
}

// ─── Helper: Format Date ───────────────────────────────────
function formatDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return val.toString().trim();
}

// ─── Test Function (untuk debug) ──────────────────────────
function testLogin() {
  const result = handleLogin({ ic: '060519060347', ndp: '07224008' });
  Logger.log(JSON.stringify(result));
}
