import './styles.css';
import { renderPreview } from './preview';
import { parseCSV, parseJSON } from './import';

const form = document.getElementById('dataForm') as HTMLFormElement;
const addMoreBtn = document.getElementById('addMore') as HTMLButtonElement;
const submitBtn = document.getElementById('submit') as HTMLButtonElement;
const showDataValueToggle = document.getElementById('showDataValue') as HTMLButtonElement;
const showDataPointsToggle = document.getElementById('showDataPoints') as HTMLButtonElement;
const previewCanvas = document.getElementById('previewCanvas') as HTMLCanvasElement;

// ── Toggle pill helpers ───────────────────────────────────────────────────────

function isToggleOn(btn: HTMLButtonElement): boolean {
  return btn.getAttribute('aria-checked') === 'true';
}

function setToggle(btn: HTMLButtonElement, on: boolean) {
  btn.setAttribute('aria-checked', String(on));
}

function wireToggle(btn: HTMLButtonElement, onKey: string) {
  btn.addEventListener('click', () => {
    const next = !isToggleOn(btn);
    setToggle(btn, next);
    savePrefs();
    triggerPreview();
  });
}

// ── Preference persistence (figma.clientStorage via postMessage) ──────────────

function savePrefs() {
  parent.postMessage({ pluginMessage: {
    type: 'setPrefs',
    prefs: {
      showDataValue: isToggleOn(showDataValueToggle),
      showDataPoints: isToggleOn(showDataPointsToggle),
      gridColor: gridColorHex.value,
    }
  }}, '*');
}

// Listen for prefs loaded from backend
window.addEventListener('message', (event) => {
  const msg = event.data?.pluginMessage;
  if (!msg) return;
  if (msg.type === 'prefsLoaded') {
    if (typeof msg.prefs.showDataValue === 'boolean') setToggle(showDataValueToggle, msg.prefs.showDataValue);
    if (typeof msg.prefs.showDataPoints === 'boolean') setToggle(showDataPointsToggle, msg.prefs.showDataPoints);
    if (typeof msg.prefs.gridColor === 'string' && isValidHex(msg.prefs.gridColor)) {
      applyGridColor(msg.prefs.gridColor);
    }
    triggerPreview();
  }
});

wireToggle(showDataValueToggle, 'showDataValue');
wireToggle(showDataPointsToggle, 'showDataPoints');

// ── HiDPI canvas setup ────────────────────────────────────────────────────────

function setupCanvas() {
  const wrap = previewCanvas.parentElement!;
  const dpr = window.devicePixelRatio || 1;
  const cssSize = wrap.clientWidth - 24; // subtract padding (12px each side)
  previewCanvas.style.width = cssSize + 'px';
  previewCanvas.style.height = cssSize + 'px';
  previewCanvas.width = Math.round(cssSize * dpr);
  previewCanvas.height = Math.round(cssSize * dpr);
  const ctx = previewCanvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
}

// ── Form data helper ──────────────────────────────────────────────────────────

function getFormData() {
  const minValue = parseFloat((document.getElementById('minValue') as HTMLInputElement).value) || 0;
  const maxValue = parseFloat((document.getElementById('maxValue') as HTMLInputElement).value) || 100;
  const color = (document.getElementById('colorHex') as HTMLInputElement).value || '#6366f1';
  const dataSets: { name: string; value: number }[] = [];
  const names = document.querySelectorAll<HTMLInputElement>('.name');
  const values = document.querySelectorAll<HTMLInputElement>('.value');
  for (let i = 0; i < names.length; i++) {
    dataSets.push({ name: names[i].value, value: Number(values[i].value) });
  }
  const gridColor = (document.getElementById('gridColorHex') as HTMLInputElement).value || '#E5E7EB';
  return {
    color,
    gridColor,
    minValue,
    maxValue,
    dataSets,
    showDataValue: isToggleOn(showDataValueToggle),
    showDataPoints: isToggleOn(showDataPointsToggle),
  };
}

// ── Live preview ──────────────────────────────────────────────────────────────

let canvasReady = false;

function triggerPreview() {
  if (!canvasReady) {
    setupCanvas();
    canvasReady = true;
  }
  renderPreview(previewCanvas, getFormData());
}

// ── Color pickers ─────────────────────────────────────────────────────────────
// Initialised here (before first triggerPreview) so colors are applied

const colorSquare = document.getElementById('colorSquare') as HTMLElement;
const colorInput = document.getElementById('color') as HTMLInputElement;
const colorHex = document.getElementById('colorHex') as HTMLInputElement;

colorHex.value = getRandomHexColor();
colorInput.value = colorHex.value;
colorSquare.style.backgroundColor = colorHex.value;

colorHex.addEventListener('input', () => {
  if (isValidHex(colorHex.value)) {
    colorSquare.style.backgroundColor = colorHex.value;
    colorInput.value = colorHex.value;
    triggerPreview();
  }
});

colorSquare.onclick = () => colorInput.click();

colorInput.addEventListener('change', () => {
  colorSquare.style.backgroundColor = colorInput.value;
  colorHex.value = colorInput.value;
  triggerPreview();
});

const gridColorSquare = document.getElementById('gridColorSquare') as HTMLElement;
const gridColorInput = document.getElementById('gridColor') as HTMLInputElement;
const gridColorHex = document.getElementById('gridColorHex') as HTMLInputElement;

const DEFAULT_GRID_COLOR = '#E5E7EB';
const resetGridColorBtn = document.getElementById('resetGridColor') as HTMLButtonElement;

function applyGridColor(hex: string) {
  gridColorSquare.style.backgroundColor = hex;
  gridColorInput.value = hex;
  gridColorHex.value = hex;
  resetGridColorBtn.style.visibility = hex.toUpperCase() === DEFAULT_GRID_COLOR.toUpperCase() ? 'hidden' : 'visible';
}

applyGridColor(DEFAULT_GRID_COLOR);

gridColorHex.addEventListener('input', () => {
  if (isValidHex(gridColorHex.value)) {
    applyGridColor(gridColorHex.value);
    savePrefs();
    triggerPreview();
  }
});

gridColorSquare.onclick = () => gridColorInput.click();

resetGridColorBtn.addEventListener('click', () => {
  applyGridColor(DEFAULT_GRID_COLOR);
  savePrefs();
  triggerPreview();
});

gridColorInput.addEventListener('change', () => {
  applyGridColor(gridColorInput.value);
  savePrefs();
  triggerPreview();
});

// Listen on the whole document for input changes inside the form area
document.addEventListener('input', triggerPreview);

// Initial render — prefs will arrive via prefsLoaded message and re-render;
// render once now so canvas isn't blank on load
triggerPreview();

// ── Add row ───────────────────────────────────────────────────────────────────

function createRemoveIcon() {
  const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgElement.setAttribute('viewBox', '0 0 14 14');
  svgElement.setAttribute('fill', 'none');
  svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  svgPath.setAttribute('d', 'M1 1l12 12M13 1L1 13');
  svgPath.setAttribute('stroke', 'currentColor');
  svgPath.setAttribute('stroke-width', '1.75');
  svgPath.setAttribute('stroke-linecap', 'round');
  svgElement.appendChild(svgPath);
  return svgElement;
}

function randomRowDefaults(): { name: string; value: string } {
  const n = document.querySelectorAll('.field').length + 1;
  const min = parseFloat(minValueInput.value) || 0;
  const max = parseFloat(maxValueInput.value) || 100;
  const value = String(Math.round(min + Math.random() * (max - min)));
  return { name: `Data ${n}`, value };
}

function addRow(name?: string, value?: string) {
  const defaults = randomRowDefaults();
  const resolvedName = name !== undefined && name !== '' ? name : defaults.name;
  const resolvedValue = value !== undefined && value !== '' ? value : defaults.value;

  const fieldDiv = document.createElement('div');
  fieldDiv.classList.add('field', 'removable');

  const nameInput = document.createElement('input');
  nameInput.setAttribute('type', 'text');
  nameInput.setAttribute('placeholder', 'Name');
  nameInput.classList.add('name');
  nameInput.value = resolvedName;

  const valueInput = document.createElement('input');
  valueInput.setAttribute('type', 'number');
  valueInput.setAttribute('placeholder', '0');
  valueInput.classList.add('value');
  valueInput.value = resolvedValue;
  valueInput.addEventListener('input', () => checkDataInputValue(valueInput));

  const removeBtn = document.createElement('button');
  removeBtn.classList.add('remove-btn');
  removeBtn.setAttribute('type', 'button');
  removeBtn.appendChild(createRemoveIcon());
  removeBtn.onclick = () => { fieldDiv.remove(); triggerPreview(); };

  fieldDiv.appendChild(nameInput);
  fieldDiv.appendChild(valueInput);
  fieldDiv.appendChild(removeBtn);
  form.appendChild(fieldDiv);
}

addMoreBtn.addEventListener('click', () => {
  addRow();
  triggerPreview();
});

// ── Submit ────────────────────────────────────────────────────────────────────

submitBtn.addEventListener('click', () => {
  const fd = getFormData();
  parent.postMessage({
    pluginMessage: {
      type: 'submitData',
      data: { ...fd, rounding: 0 },
    },
  }, '*');
});

// ── Remove field (inline onclick handler in HTML) ─────────────────────────────

function removeField(btn: HTMLElement) {
  const field = btn.closest('.field') as HTMLElement;
  field.remove();
  triggerPreview();
}

(window as unknown as Record<string, unknown>)['removeField'] = removeField;

// ── Min/max constraints ───────────────────────────────────────────────────────

const minValueInput = document.getElementById('minValue') as HTMLInputElement;
const maxValueInput = document.getElementById('maxValue') as HTMLInputElement;

function updateDataInputConstraints() {
  const minValue = parseFloat(minValueInput.value);
  const maxValue = parseFloat(maxValueInput.value);
  document.querySelectorAll<HTMLInputElement>('.value').forEach(input => {
    input.setAttribute('min', String(minValue));
    input.setAttribute('max', String(maxValue));
  });
}

minValueInput.addEventListener('input', () => {
  const v = parseFloat(minValueInput.value);
  if (!isNaN(v) && v < 0) minValueInput.value = '0';
  updateDataInputConstraints();
});
maxValueInput.addEventListener('input', updateDataInputConstraints);

function checkDataInputValue(input: HTMLInputElement) {
  let value = parseFloat(input.value);
  if (isNaN(value)) return;

  // Clamp below zero
  if (value < 0) {
    value = 0;
    input.value = '0';
  }

  const maxValue = parseFloat(maxValueInput.value);

  // Auto-extend max if value exceeds it
  if (value > maxValue) {
    const newMax = Math.ceil(value / 10) * 10;
    maxValueInput.value = String(newMax);
    updateDataInputConstraints();
  }
}

document.querySelectorAll<HTMLInputElement>('.value').forEach(input => {
  input.addEventListener('input', () => checkDataInputValue(input));
});

function isValidHex(hex: string): boolean {
  return /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.test(hex);
}

function getRandomHexColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
  return color;
}

// ── Import modal ──────────────────────────────────────────────────────────────

const importModal = document.getElementById('importModal') as HTMLDivElement;
const openImportBtn = document.getElementById('openImport') as HTMLButtonElement;
const closeImportBtn = document.getElementById('closeImport') as HTMLButtonElement;
const importInput = document.getElementById('importInput') as HTMLTextAreaElement;
const importError = document.getElementById('importError') as HTMLParagraphElement;
const importApplyBtn = document.getElementById('importApply') as HTMLButtonElement;
const csvHint = document.getElementById('csvHint') as HTMLDivElement;
const jsonHint = document.getElementById('jsonHint') as HTMLDivElement;
const tabs = document.querySelectorAll<HTMLButtonElement>('.tab');

let activeTab: 'csv' | 'json' = 'csv';

openImportBtn.addEventListener('click', () => {
  importModal.removeAttribute('hidden');
  importInput.value = '';
  importError.hidden = true;
  importInput.focus();
});

closeImportBtn.addEventListener('click', () => {
  importModal.setAttribute('hidden', '');
});

importModal.addEventListener('click', (e) => {
  if (e.target === importModal) importModal.setAttribute('hidden', '');
});

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeTab = tab.dataset['tab'] as 'csv' | 'json';
    csvHint.hidden = activeTab !== 'csv';
    jsonHint.hidden = activeTab !== 'json';
    importInput.placeholder = activeTab === 'csv'
      ? 'Name,Value\nSpeed,80\nStrength,60'
      : '[{"name":"Speed","value":80}]';
    importError.hidden = true;
  });
});

// ── File upload + drag-and-drop ───────────────────────────────────────────────

const importFileInput = document.getElementById('importFile') as HTMLInputElement;
const importFileName = document.getElementById('importFileName') as HTMLSpanElement;

function loadFileText(file: File) {
  const reader = new FileReader();
  reader.onload = () => {
    const text = (reader.result as string).trim();
    importInput.value = text;
    importFileName.textContent = file.name;
    importError.hidden = true;
    // Auto-switch tab based on extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'json' || ext === 'csv') {
      const target = ext as 'csv' | 'json';
      tabs.forEach(t => t.classList.toggle('active', t.dataset['tab'] === target));
      activeTab = target;
      csvHint.hidden = target !== 'csv';
      jsonHint.hidden = target !== 'json';
    }
  };
  reader.readAsText(file);
}

importFileInput.addEventListener('change', () => {
  const file = importFileInput.files?.[0];
  if (file) loadFileText(file);
  importFileInput.value = ''; // reset so same file can be re-selected
});

importInput.addEventListener('dragover', (e) => {
  e.preventDefault();
  importInput.classList.add('drag-over');
});

importInput.addEventListener('dragleave', () => {
  importInput.classList.remove('drag-over');
});

importInput.addEventListener('drop', (e) => {
  e.preventDefault();
  importInput.classList.remove('drag-over');
  const file = e.dataTransfer?.files[0];
  if (file) loadFileText(file);
});

importApplyBtn.addEventListener('click', () => {
  const text = importInput.value.trim();
  if (!text) {
    showImportError('Please paste some data first.');
    return;
  }

  let rows: { name: string; value: number }[];
  try {
    rows = activeTab === 'csv' ? parseCSV(text) : parseJSON(text);
  } catch (err) {
    showImportError((err as Error).message);
    return;
  }

  if (rows.length < 3) {
    showImportError('Need at least 3 data points for a radar chart.');
    return;
  }

  // Clear existing rows
  form.innerHTML = '';

  // Populate with imported rows — first 3 are non-removable
  rows.forEach((row, i) => {
    if (i < 3) {
      const fieldDiv = document.createElement('div');
      fieldDiv.classList.add('field');
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.placeholder = 'Name';
      nameInput.classList.add('name');
      nameInput.value = row.name;
      const valueInput = document.createElement('input');
      valueInput.type = 'number';
      valueInput.placeholder = '0';
      valueInput.classList.add('value');
      valueInput.value = String(row.value);
      valueInput.addEventListener('input', () => checkDataInputValue(valueInput));
      fieldDiv.appendChild(nameInput);
      fieldDiv.appendChild(valueInput);
      form.appendChild(fieldDiv);
    } else {
      addRow(row.name, String(row.value));
    }
  });

  importModal.setAttribute('hidden', '');
  triggerPreview();
});

function showImportError(msg: string) {
  importError.textContent = msg;
  importError.hidden = false;
}
