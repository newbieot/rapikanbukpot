(() => {
  'use strict';

  const MODES = {
    bukpot: {
      label: 'Bukti Potong',
      outputSheet: 'Bukti_Potong',
      outputFile: 'Rekap_Bukti_Potong_PosIND.xlsx',
      accept: '.csv',
      extensions: ['csv'],
      note: 'CSV hasil ekspor Bukti Potong (BPU/BPUP).',
      emptyHint: 'Pastikan file memiliki kolom id dan nomor_bupot.'
    },
    mileapp: {
      label: 'Resi Mile App',
      outputSheet: 'Resi_MileApp',
      outputFile: 'Rekap_MileApp_PosIND.xlsx',
      accept: '.csv',
      extensions: ['csv'],
      note: 'CSV Mile App dengan pemisah titik koma (;).',
      emptyHint: 'Pastikan file memiliki kolom No Resi.'
    },
    pranpp: {
      label: 'Web PRANPP',
      outputSheet: 'Data_PRANPP',
      outputFile: 'Rekap_Dokumen_PRANPP_PosIND.xlsx',
      accept: '.csv,.xlsx,.xls,.html,.htm',
      extensions: ['csv', 'xlsx', 'xls', 'html', 'htm'],
      note: 'CSV, Excel, atau HTML hasil ekspor Web PRANPP.',
      emptyHint: 'Pastikan file memiliki kolom Nomor Dokumen.'
    },
    pid: {
      label: 'Web PID',
      outputSheet: 'Data_PID',
      outputFile: 'Rekap_Lacak_Kiriman_PID.xlsx',
      accept: '.xlsx,.xls,.html,.htm',
      extensions: ['xlsx', 'xls', 'html', 'htm'],
      note: 'Excel atau HTML hasil ekspor Web PID / Lacak Kiriman.',
      emptyHint: 'Pastikan file memiliki kolom Nomor Resi atau Kantor Asal.'
    }
  };

  const STATUS_LABELS = {
    ready: 'Siap',
    processing: 'Diproses',
    completed: 'Selesai',
    review: 'Perlu diperiksa',
    failed: 'Gagal'
  };

  const MAX_PREVIEW_ROWS = 200;
  const MAX_PREVIEW_COLUMNS = 16;

  const state = {
    mode: 'bukpot',
    files: [],
    finalData: [],
    processing: false,
    cancelRequested: false,
    search: '',
    hasProcessed: false
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const els = {
    fileInput: $('#fileInput'),
    dropZone: $('#dropZone'),
    chooseBtn: $('#chooseBtn'),
    addMoreBtn: $('#addMoreBtn'),
    clearBtn: $('#clearBtn'),
    fileList: $('#fileList'),
    emptyList: $('#emptyList'),
    fileCount: $('#fileCount'),
    fileSizeTotal: $('#fileSizeTotal'),
    processBtn: $('#processBtn'),
    cancelBtn: $('#cancelBtn'),
    retryBtn: $('#retryBtn'),
    downloadBtn: $('#downloadBtn'),
    resultsPanel: $('#resultsPanel'),
    resultSearch: $('#resultSearch'),
    resultTable: $('#resultTable'),
    tableCount: $('#tableCount'),
    tableNote: $('#tableNote'),
    progressCard: $('#progressCard'),
    progressTitle: $('#progressTitle'),
    progressPercent: $('#progressPercent'),
    progressBar: $('#progressBar'),
    progressDetail: $('#progressDetail'),
    statusMessage: $('#statusMessage'),
    modeNote: $('#modeNote'),
    summaryMode: $('#summaryMode'),
    summaryFiles: $('#summaryFiles'),
    helpDialog: $('#helpDialog'),
    helpBtn: $('#helpBtn'),
    closeHelpBtn: $('#closeHelpBtn'),
    understoodBtn: $('#understoodBtn'),
    toastRegion: $('#toastRegion')
  };

  function initialize() {
    bindEvents();
    updateModeUI();
    renderAll();
    window.cleanPosNew = {
      processBukpot,
      processMileApp,
      processPidArray,
      processPranppArray,
      processPranppCsv,
      cleanRupiah,
      parseDmyDate
    };

    window.addEventListener('load', () => {
      if (typeof window.Papa === 'undefined' || typeof window.XLSX === 'undefined') {
        setStatus('error', 'Komponen aplikasi gagal dimuat', 'Periksa koneksi internet lalu muat ulang halaman.');
        showToast('error', 'Komponen belum tersedia', 'Library pembaca dokumen tidak berhasil dimuat.');
      }
    });
  }

  function bindEvents() {
    $$('.mode-tab').forEach((button) => {
      button.addEventListener('click', () => switchMode(button.dataset.mode));
      button.addEventListener('keydown', handleTabKeydown);
    });

    els.chooseBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      els.fileInput.click();
    });
    els.addMoreBtn.addEventListener('click', () => els.fileInput.click());
    els.dropZone.addEventListener('click', (event) => {
      if (event.target.closest('button')) return;
      els.fileInput.click();
    });
    els.dropZone.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        els.fileInput.click();
      }
    });
    els.fileInput.addEventListener('change', (event) => {
      addFiles(event.target.files);
      event.target.value = '';
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
      document.addEventListener(eventName, preventDefaults, false);
    });
    ['dragenter', 'dragover'].forEach((eventName) => {
      els.dropZone.addEventListener(eventName, () => els.dropZone.classList.add('is-dragover'));
    });
    ['dragleave', 'drop'].forEach((eventName) => {
      els.dropZone.addEventListener(eventName, () => els.dropZone.classList.remove('is-dragover'));
    });
    els.dropZone.addEventListener('drop', (event) => addFiles(event.dataTransfer.files));

    els.clearBtn.addEventListener('click', clearWorkspace);
    els.processBtn.addEventListener('click', () => processFiles(false));
    els.cancelBtn.addEventListener('click', requestCancel);
    els.retryBtn.addEventListener('click', () => processFiles(true));
    els.downloadBtn.addEventListener('click', downloadExcel);
    els.resultSearch.addEventListener('input', (event) => {
      state.search = event.target.value.trim().toLocaleLowerCase('id-ID');
      renderResultTable();
    });

    els.helpBtn.addEventListener('click', () => openHelp());
    els.closeHelpBtn.addEventListener('click', () => els.helpDialog.close());
    els.understoodBtn.addEventListener('click', () => els.helpDialog.close());
    els.helpDialog.addEventListener('click', (event) => {
      const rect = els.helpDialog.getBoundingClientRect();
      const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside) els.helpDialog.close();
    });
  }

  function preventDefaults(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleTabKeydown(event) {
    const tabs = $$('.mode-tab');
    const currentIndex = tabs.indexOf(event.currentTarget);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (nextIndex !== currentIndex) {
      event.preventDefault();
      tabs[nextIndex].focus();
      switchMode(tabs[nextIndex].dataset.mode);
    }
  }

  function switchMode(mode) {
    if (!MODES[mode] || state.processing || mode === state.mode) return;
    const hadFiles = state.files.length > 0;
    state.mode = mode;
    if (hadFiles) {
      state.files = [];
      state.finalData = [];
      state.search = '';
      state.hasProcessed = false;
      els.resultSearch.value = '';
      showToast('warning', 'Workspace dikosongkan', 'File lama dihapus karena jenis data berubah.');
    }
    updateModeUI();
    renderAll();
  }

  function updateModeUI() {
    const config = MODES[state.mode];
    $$('.mode-tab').forEach((button) => {
      const active = button.dataset.mode === state.mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    els.fileInput.accept = config.accept;
    els.summaryMode.textContent = config.label;
    els.modeNote.replaceChildren(createSvgInfo(), createModeNoteText(config.note));
  }

  function createSvgInfo() {
    const wrap = document.createElement('span');
    wrap.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 11v5M12 8h.01"></path></svg>';
    return wrap.firstElementChild;
  }

  function createModeNoteText(note) {
    const span = document.createElement('span');
    const strong = document.createElement('b');
    strong.textContent = 'Format yang diterima: ';
    span.append(strong, document.createTextNode(note));
    return span;
  }

  function addFiles(fileList) {
    if (state.processing || !fileList || fileList.length === 0) return;
    let added = 0;
    let duplicates = 0;
    let unsupported = 0;
    let empty = 0;
    const config = MODES[state.mode];

    [...fileList].forEach((file) => {
      const duplicate = state.files.some((item) => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified);
      if (duplicate) {
        duplicates += 1;
        return;
      }

      const extension = getExtension(file.name);
      let status = 'ready';
      let message = 'Siap diproses';
      if (file.size === 0) {
        status = 'failed';
        message = 'File kosong';
        empty += 1;
      } else if (!config.extensions.includes(extension)) {
        status = 'failed';
        message = `Format .${extension || '?'} tidak didukung pada mode ini`;
        unsupported += 1;
      }

      state.files.push({
        id: createId(),
        file,
        extension,
        status,
        message,
        rows: 0,
        result: []
      });
      added += 1;
    });

    if (added > 0) {
      state.files.forEach((item) => {
        if (item.status === 'completed' || item.status === 'review') {
          item.status = 'ready';
          item.message = 'Siap diproses';
          item.rows = 0;
          item.result = [];
        }
      });
      state.hasProcessed = false;
    }
    state.finalData = [];
    state.search = '';
    els.resultSearch.value = '';
    renderAll();

    if (added > 0) {
      showToast('success', `${added} file ditambahkan`, 'Periksa status file sebelum memproses.');
    }
    if (duplicates > 0) showToast('warning', 'File duplikat dilewati', `${duplicates} file dengan nama dan ukuran yang sama tidak ditambahkan.`);
    if (unsupported > 0) showToast('error', 'Format tidak sesuai', `${unsupported} file ditandai gagal karena tidak cocok dengan mode ${config.label}.`);
    if (empty > 0) showToast('error', 'File kosong ditemukan', `${empty} file tidak memiliki isi dan tidak dapat diproses.`);
  }

  function removeFile(id) {
    if (state.processing) return;
    state.files = state.files.filter((item) => item.id !== id);
    rebuildFinalData();
    renderAll();
  }

  function clearWorkspace() {
    if (state.processing) return;
    state.files = [];
    state.finalData = [];
    state.search = '';
    state.hasProcessed = false;
    els.resultSearch.value = '';
    renderAll();
    showToast('success', 'Workspace dibersihkan', 'Semua data sementara telah dihapus dari halaman ini.');
  }

  function requestCancel() {
    state.cancelRequested = true;
    els.cancelBtn.disabled = true;
    els.cancelBtn.textContent = 'Pembatalan diminta...';
    setStatus('warning', 'Menunggu proses file saat ini selesai', 'Pemrosesan akan dihentikan sebelum file berikutnya.');
  }

  async function processFiles(retryOnly) {
    if (state.processing) return;
    if (typeof window.Papa === 'undefined' || typeof window.XLSX === 'undefined') {
      showToast('error', 'Komponen aplikasi belum tersedia', 'Muat ulang halaman saat koneksi internet tersedia.');
      return;
    }

    const candidates = state.files.filter((item) => retryOnly ? item.status === 'failed' && MODES[state.mode].extensions.includes(item.extension) && item.file.size > 0 : item.status !== 'failed');
    if (candidates.length === 0) {
      showToast('warning', 'Tidak ada file yang dapat diproses', 'Tambahkan file valid atau periksa mode yang dipilih.');
      return;
    }

    state.processing = true;
    state.cancelRequested = false;
    state.finalData = [];
    els.cancelBtn.disabled = false;
    els.cancelBtn.textContent = 'Batalkan setelah file ini';
    updateProcessingUI(true);

    if (!retryOnly) {
      state.files.forEach((item) => {
        if (item.status !== 'failed') {
          item.status = 'ready';
          item.message = 'Menunggu diproses';
          item.rows = 0;
          item.result = [];
        }
      });
    }

    let processedCount = 0;
    for (const item of candidates) {
      if (state.cancelRequested) break;
      item.status = 'processing';
      item.message = 'Membaca file...';
      updateProgress(processedCount, candidates.length, item.file.name);
      renderFiles();
      updateStats();
      await yieldToBrowser();

      try {
        const result = await processOneFile(item);
        item.result = result;
        item.rows = result.length;
        if (result.length > 0) {
          item.status = 'completed';
          item.message = `${formatNumber(result.length)} baris berhasil dibaca`;
        } else {
          item.status = 'review';
          item.message = MODES[state.mode].emptyHint;
        }
      } catch (error) {
        item.status = 'failed';
        item.rows = 0;
        item.result = [];
        item.message = friendlyError(error);
      }

      processedCount += 1;
      updateProgress(processedCount, candidates.length, item.file.name);
      rebuildFinalData();
      renderFiles();
      updateStats();
      await yieldToBrowser();
    }

    sortFinalData();
    state.hasProcessed = true;
    state.processing = false;
    updateProcessingUI(false);
    renderAll();

    const completed = countStatus('completed');
    const review = countStatus('review');
    const failed = countStatus('failed');
    if (state.cancelRequested) {
      setStatus('warning', 'Pemrosesan dibatalkan', `${processedCount} dari ${candidates.length} file telah diproses.`);
      showToast('warning', 'Pemrosesan dihentikan', 'File yang sudah selesai tetap tersedia pada hasil.');
    } else if (completed > 0 && review === 0 && failed === 0) {
      setStatus('success', 'Semua file berhasil diproses', `${formatNumber(state.finalData.length)} baris siap diunduh.`);
      showToast('success', 'Pemrosesan selesai', `${completed} file berhasil dirapikan.`);
    } else if (completed > 0) {
      setStatus('warning', 'Sebagian file perlu perhatian', `${completed} selesai, ${review} perlu diperiksa, dan ${failed} gagal.`);
      showToast('warning', 'Periksa status file', 'Hasil yang berhasil tetap dapat ditinjau dan diunduh.');
    } else {
      setStatus('error', 'Belum ada data yang berhasil dibaca', 'Periksa format, isi file, dan jenis data yang dipilih.');
      showToast('error', 'Pemrosesan tidak menghasilkan data', 'Lihat pesan pada setiap file untuk tindakan berikutnya.');
    }
  }

  async function processOneFile(item) {
    const file = item.file;
    const extension = item.extension;
    const headText = await readFileAsText(file.slice(0, Math.min(file.size, 1024)));
    const isHtmlDisguised = /^\s*</.test(headText);

    if (isHtmlDisguised || extension === 'html' || extension === 'htm') {
      if (!['pranpp', 'pid'].includes(state.mode)) throw new Error('MODE_MISMATCH_HTML');
      const text = isHtmlDisguised && file.size <= 1024 ? headText : await readFileAsText(file);
      const dataArray = parseHtmlTable(text);
      if (state.mode === 'pranpp') return processPranppArray(dataArray);
      return processPidArray(dataArray);
    }

    if (extension === 'xlsx' || extension === 'xls') {
      if (!['pranpp', 'pid'].includes(state.mode)) throw new Error('MODE_MISMATCH_EXCEL');
      const buffer = await readFileAsArrayBuffer(file);
      let workbook;
      try {
        workbook = window.XLSX.read(buffer, { type: 'array', cellDates: false });
      } catch (error) {
        if (/password|encrypted/i.test(String(error && error.message))) throw new Error('PASSWORD_PROTECTED');
        throw new Error('CORRUPT_EXCEL');
      }
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) throw new Error('EMPTY_WORKBOOK');
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const dataArray = window.XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '', raw: true });
      if (state.mode === 'pranpp') return processPranppArray(dataArray);
      return processPidArray(dataArray);
    }

    const text = await readFileAsText(file);
    if (!text.trim()) throw new Error('EMPTY_FILE');
    if (state.mode === 'bukpot') return processBukpot(text);
    if (state.mode === 'mileapp') return processMileApp(text);
    if (state.mode === 'pranpp') return processPranppCsv(text);
    throw new Error('MODE_MISMATCH_PID');
  }

  function parseHtmlTable(rawText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawText, 'text/html');
    const tables = [...doc.querySelectorAll('table')];
    if (tables.length === 0) throw new Error('NO_TABLE');
    const table = tables.reduce((largest, current) => current.rows.length > largest.rows.length ? current : largest, tables[0]);
    return [...table.querySelectorAll('tr')].map((row) => [...row.querySelectorAll('th,td')].map((cell) => cell.textContent.trim()));
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('READ_FAILED'));
      reader.onabort = () => reject(new Error('READ_ABORTED'));
      reader.readAsText(file);
    });
  }

  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('READ_FAILED'));
      reader.onabort = () => reject(new Error('READ_ABORTED'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Logika lama dipertahankan dan diperkuat pada validasi/orchestrator.
  function formatTeksRapi(text) {
    if (!text) return '';
    const upperText = String(text).toUpperCase().trim();
    if (upperText.includes('BANK INDONESIA') || upperText.includes('KPW BI KEPRI') || upperText === 'KPW BI KEPRI (GABUNGAN)') {
      return 'KANTOR PERWAKILAN BANK INDONESIA KEPULAUAN RIAU';
    }
    return upperText;
  }

  function parseDmyDate(dateValue) {
    if (dateValue === undefined || dateValue === null || dateValue === '') return 0;
    if (dateValue instanceof Date) return dateValue.getTime();
    if (typeof dateValue === 'number' && Number.isFinite(dateValue)) return (dateValue - 25569) * 86400 * 1000;

    const value = String(dateValue).trim();
    const parts = value.split(/\s+/);
    const dateParts = parts[0].split(/[-/]/);
    if (dateParts.length !== 3) return 0;

    let year;
    let month;
    let day;
    if (dateParts[0].length === 4) {
      [year, month, day] = dateParts;
    } else {
      [day, month, year] = dateParts;
      if (year.length === 2) year = `20${year}`;
    }
    const timestamp = new Date(`${year}-${month}-${day}T${parts[1] || '00:00:00'}`).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function processBukpot(rawText) {
    const lines = rawText.split(/\r?\n/);
    let cleanedCsvText = '';
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      if (line.includes(';;')) line = line.split(';;')[0];
      line = line.replace(/;+$/, '');
      cleanedCsvText += `${line}\n`;
    }
    const parsed = window.Papa.parse(cleanedCsvText, { header: true, skipEmptyLines: true, quoteChar: '"' });
    if (parsed.errors && parsed.errors.some((error) => error.type === 'Quotes')) throw new Error('MALFORMED_CSV');
    const formatted = [];
    parsed.data.forEach((row) => {
      const npwp = row.npwp_pemotong || row.lawan_transaksi || '';
      let nama = row.nama_penerima_ph || row.nama_lt || '';
      if (nama === '' && npwp !== '') nama = `PEMOTONG PAJAK (NPWP: ${npwp})`;
      const cleanRow = {
        'ID': String(row.id || ''),
        'Nomor Bukti Potong': String(row.nomor_bupot || ''),
        'Tanggal Bukti Potong': row.tgl_bupot || '',
        'Masa Pajak': String(row.masa_pajak || '').replace(/\.0$/, ''),
        'Status': row.status_bupot || '',
        'NPWP/TIN Lawan Transaksi': String(npwp).replace(/\.0$/, ''),
        'Nama Lawan Transaksi': formatTeksRapi(nama),
        'Kode Objek Pajak': row.kop || '',
        'DPP Bruto': parseFloat(row.dpp_bruto) || 0,
        'PPh Dipotong': parseFloat(row.pph) || 0,
        'Dokumen Dasar': formatTeksRapi(row.doc_dp),
        'Nomor Dokumen': String(row.no_doc_dp || '')
      };
      if (row.nitku_pemotong) cleanRow['Keterangan Tambahan'] = `NITKU: ${row.nitku_pemotong}`;
      else if (row.dilaporkan_di_spt) cleanRow['Keterangan Tambahan'] = `Dilaporkan di SPT: ${row.dilaporkan_di_spt}`;
      if (cleanRow.ID && cleanRow['Nomor Bukti Potong'] !== 'nomor_bupot') formatted.push(cleanRow);
    });
    return formatted;
  }

  function processMileApp(rawText) {
    const parsed = window.Papa.parse(rawText, { header: true, skipEmptyLines: true, delimiter: ';' });
    if (parsed.errors && parsed.errors.some((error) => error.type === 'Quotes')) throw new Error('MALFORMED_CSV');
    const formatted = [];
    const numCols = ['Berat', 'Ongkir', 'PPN', 'HTNB', 'Total Bea'];
    const textCols = ['Nama Pengirim', 'Penerima', 'Alamat', 'Kota', 'Status', 'Kiriman Diterima Oleh', 'Petugas  Eintri', 'Instruksi Pengriman', 'Deskripsi', 'Jenis', 'Layanan'];
    const stringCleanCols = ['No Resi', 'No HP', 'Kode pos Penerima', 'Nip/NIK', 'No VA', 'Norek', 'Norek ', 'ID Pelanggan'];

    parsed.data.forEach((row) => {
      if (!row['No Resi'] || row['No Resi'] === 'No Resi') return;
      const cleanRow = {};
      for (const key in row) {
        const value = row[key] !== undefined ? String(row[key]) : '';
        if (numCols.includes(key)) cleanRow[key] = parseFloat(value.replace(/,/g, '')) || 0;
        else if (textCols.includes(key)) cleanRow[key] = formatTeksRapi(value);
        else if (stringCleanCols.includes(key) || key.includes('Norek')) cleanRow[key] = value.replace(/\.0$/, '');
        else cleanRow[key] = value;
      }
      formatted.push(cleanRow);
    });
    return formatted;
  }

  function processPidArray(dataArray) {
    if (dataArray.length < 2) return [];
    let headerIdx = -1;
    for (let i = 0; i < Math.min(10, dataArray.length); i += 1) {
      const row = Array.isArray(dataArray[i]) ? dataArray[i].map((value) => String(value).trim()) : [];
      if (row.includes('Nomor Resi') || row.includes('Kantor Asal')) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx === -1) return [];

    const headers = dataArray[headerIdx].map((header, index) => String(header || `Column_${index}`).trim());
    const formatted = [];
    for (let i = headerIdx + 1; i < dataArray.length; i += 1) {
      const row = dataArray[i];
      if (!row || row.length < 3 || !row[1]) continue;
      const cleanRow = {};
      for (let c = 0; c < headers.length; c += 1) {
        cleanRow[headers[c]] = row[c] !== undefined ? row[c] : '';
      }

      if (cleanRow['Bea Dasar'] !== undefined) cleanRow['Bea Dasar'] = cleanRupiah(cleanRow['Bea Dasar']);
      if (cleanRow.Htnb !== undefined) cleanRow.Htnb = cleanRupiah(cleanRow.Htnb);
      if (cleanRow.Total !== undefined) cleanRow.Total = cleanRupiah(cleanRow.Total);
      if (cleanRow['Harga Barang'] !== undefined) cleanRow['Harga Barang'] = cleanRupiah(cleanRow['Harga Barang']);
      if (cleanRow['Berat Kiriman'] !== undefined) cleanRow['Berat Kiriman'] = parseFloat(String(cleanRow['Berat Kiriman']).replace(/,/g, '.')) || 0;

      const textCols = ['Nomor Resi', 'Tlp Pengirim', 'Tlp Penerima', 'Kodepos Tujuan', 'Virtual Account', 'Nopend Asal', 'Nopend Tujuan'];
      textCols.forEach((column) => {
        if (cleanRow[column] !== undefined) cleanRow[column] = String(cleanRow[column]).replace(/\.0$/, '');
      });
      ['Nama Pengirim', 'Nama Penerima', 'Kota Penerima', 'Alamat Pengirim', 'Alamat Penerima'].forEach((column) => {
        if (cleanRow[column] !== undefined) cleanRow[column] = formatTeksRapi(cleanRow[column]);
      });
      formatted.push(cleanRow);
    }
    return formatted;
  }

  function findKey(object, searchKey) {
    const target = searchKey.toUpperCase().replace(/[\s+]/g, '').replace('DAN', '');
    for (const key in object) {
      const cleaned = String(key).toUpperCase().replace(/[\s+]/g, '').replace('DAN', '');
      if (cleaned === target) return object[key];
    }
    return undefined;
  }

  function cleanRupiah(value) {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return value;
    let stringValue = String(value).trim();
    if (stringValue === '-' || stringValue === '0') return 0;
    stringValue = stringValue.replace(/Rp/gi, '').replace(/\s/g, '');

    if (stringValue.includes('.') && stringValue.includes(',')) {
      const dotIndex = stringValue.lastIndexOf('.');
      const commaIndex = stringValue.lastIndexOf(',');
      stringValue = dotIndex < commaIndex ? stringValue.replace(/\./g, '').replace(',', '.') : stringValue.replace(/,/g, '');
      return parseFloat(stringValue) || 0;
    }
    if (stringValue.includes('.')) {
      const parts = stringValue.split('.');
      if (parts.length > 2) return parseFloat(stringValue.replace(/\./g, '')) || 0;
      const right = parts[1];
      if (right.length === 3) return parseFloat(stringValue.replace(/\./g, '')) || 0;
      if (right.length === 1) return parseFloat(parts[0] + right + '00') || 0;
      if (right.length === 2) return parseFloat(parts[0] + right + '0') || 0;
    }
    if (stringValue.includes(',')) {
      const parts = stringValue.split(',');
      if (parts.length > 2) return parseFloat(stringValue.replace(/,/g, '')) || 0;
      const right = parts[1];
      if (right.length === 3) return parseFloat(stringValue.replace(/,/g, '')) || 0;
      return parseFloat(stringValue.replace(',', '.')) || 0;
    }
    const number = parseFloat(stringValue);
    if (number > 0 && number < 1000 && !stringValue.includes('.') && !stringValue.includes(',')) return number * 1000;
    return number || 0;
  }

  function processPranppArray(dataArray) {
    if (dataArray.length < 2) return [];
    let headerIdx = -1;
    for (let i = 0; i < Math.min(15, dataArray.length); i += 1) {
      const rowString = (dataArray[i] || []).join('').toUpperCase().replace(/\s/g, '');
      if (rowString.includes('NOMORDOKUMEN')) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx === -1) return [];

    const headers = dataArray[headerIdx];
    const formatted = [];
    for (let i = headerIdx + 1; i < dataArray.length; i += 1) {
      const row = dataArray[i];
      if (!row || row.length < 2) continue;
      const tempRow = {};
      for (let c = 0; c < headers.length; c += 1) {
        if (headers[c]) tempRow[String(headers[c]).trim()] = row[c] !== undefined ? row[c] : '';
      }
      const noDok = findKey(tempRow, 'Nomor Dokumen');
      if (!noDok) continue;
      formatted.push(buildPranppRow(tempRow, noDok));
    }
    return formatted;
  }

  function processPranppCsv(rawText) {
    const lines = rawText.split(/\r?\n/);
    while (lines.length > 0 && !lines[0].toUpperCase().replace(/\s/g, '').includes('NOMORDOKUMEN')) lines.shift();
    if (lines.length === 0) return [];
    const parsed = window.Papa.parse(lines.join('\n'), { header: true, skipEmptyLines: true });
    if (parsed.errors && parsed.errors.some((error) => error.type === 'Quotes')) throw new Error('MALFORMED_CSV');
    const formatted = [];
    parsed.data.forEach((row) => {
      const noDok = findKey(row, 'Nomor Dokumen');
      if (noDok) formatted.push(buildPranppRow(row, noDok));
    });
    return formatted;
  }

  function buildPranppRow(row, noDok) {
    return {
      'No': parseInt(findKey(row, 'No'), 10) || 0,
      'Nomor Dokumen': String(noDok).trim(),
      'Masa Laku': findKey(row, 'Masa Laku') || '',
      'Dokumen': findKey(row, 'Dokumen') || '',
      'Tanggal Transaksi': findKey(row, 'Tanggal Transaksi') || '',
      'Jenis Biaya': findKey(row, 'Jenis Biaya') || '',
      'Status Dokumen': findKey(row, 'Status Dokumen') || '',
      'Pemilik Anggaran': findKey(row, 'Pemilik Anggaran') || '',
      'BSU': cleanRupiah(findKey(row, 'BSU')),
      'Keterangan': findKey(row, 'Keterangan') || '',
      'BSU Pajak': cleanRupiah(findKey(row, 'BSU Pajak')),
      'Total': cleanRupiah(findKey(row, 'Total')),
      'Pajak': cleanRupiah(findKey(row, 'Pajak')),
      'Total BSU': cleanRupiah(findKey(row, 'Total BSU')),
      'Total Pajak': cleanRupiah(findKey(row, 'Total Pajak')),
      'Total BSU+Pajak': cleanRupiah(findKey(row, 'Total BSU+Pajak')),
      'Nomor Internal Order': String(findKey(row, 'Nomor Internal Order') || '').trim()
    };
  }

  function fitToColumn(data) {
    if (!data || data.length === 0) return [];
    const headers = Object.keys(data[0]);
    const widths = headers.map((header) => header.length);
    data.slice(0, 5000).forEach((row) => {
      headers.forEach((header, index) => {
        const value = row[header];
        let length = 0;
        if (value !== undefined && value !== null) {
          if (typeof value === 'number') {
            const valueString = value.toFixed(value % 1 !== 0 ? 2 : 0);
            length = valueString.length + Math.floor((valueString.split('.')[0].length - 1) / 3);
          } else {
            length = String(value).length;
          }
        }
        if (length > widths[index]) widths[index] = length;
      });
    });
    return widths.map((width) => ({ wch: Math.min(Math.max(width + 3, 12), 60) }));
  }

  function downloadExcel() {
    if (state.finalData.length === 0 || typeof window.XLSX === 'undefined') {
      showToast('warning', 'Belum ada data untuk diunduh', 'Proses file valid terlebih dahulu.');
      return;
    }

    try {
      const worksheet = window.XLSX.utils.json_to_sheet(state.finalData);
      worksheet['!cols'] = fitToColumn(state.finalData);
      worksheet['!autofilter'] = { ref: worksheet['!ref'] };
      const range = window.XLSX.utils.decode_range(worksheet['!ref']);
      const headers = Object.keys(state.finalData[0]);

      for (let row = range.s.r; row <= range.e.r; row += 1) {
        for (let column = range.s.c; column <= range.e.c; column += 1) {
          const cellRef = window.XLSX.utils.encode_cell({ r: row, c: column });
          const cell = worksheet[cellRef];
          if (!cell) continue;
          const headerName = headers[column] || '';
          if (row === 0) {
            cell.s = {
              fill: { patternType: 'solid', fgColor: { rgb: '17264D' } },
              font: { bold: true, color: { rgb: 'FFFFFF' }, name: 'Arial', sz: 11 },
              alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
              border: borderStyle('D8DEE8', '17264D')
            };
          } else {
            cell.s = {
              font: { name: 'Arial', sz: 10 },
              alignment: { vertical: 'center', horizontal: 'left' },
              border: borderStyle('E5E8EE', 'E5E8EE')
            };
            const textColumns = [
              'Nomor Internal Order', 'Nomor Dokumen', 'No Resi', 'Nomor Resi', 'No HP', 'Tlp Pengirim', 'Tlp Penerima',
              'Kodepos Tujuan', 'Virtual Account', 'NPWP/TIN Lawan Transaksi', 'Masa Pajak', 'ID', 'Nopend Asal',
              'Nopend Tujuan', 'Kode pos Penerima', 'Nip/NIK', 'No VA', 'Norek ', 'Norek', 'ID Pelanggan'
            ];
            if (textColumns.includes(headerName)) {
              cell.t = 's';
              cell.v = String(cell.v);
            } else if (cell.t === 'n') {
              if (headerName === 'No' || headerName === 'Berat') {
                cell.s.alignment.horizontal = 'center';
              } else if (/tanggal|tgl|masa/i.test(headerName)) {
                cell.s.alignment.horizontal = 'center';
                cell.z = 'dd-mm-yyyy';
                cell.s.numFmt = 'dd-mm-yyyy';
              } else {
                const pattern = cell.v % 1 !== 0 ? '#,##0.00' : '#,##0';
                cell.z = pattern;
                cell.s.numFmt = pattern;
                cell.s.alignment.horizontal = 'right';
              }
            }
          }
        }
      }

      worksheet['!rows'] = [{ hpt: 30 }];
      const workbook = window.XLSX.utils.book_new();
      const config = MODES[state.mode];
      window.XLSX.utils.book_append_sheet(workbook, worksheet, config.outputSheet);
      window.XLSX.writeFile(workbook, config.outputFile, { compression: true });
      markDownloadStep();
      showToast('success', 'Unduhan dimulai', `${config.outputFile} sedang disimpan.`);
    } catch (error) {
      setStatus('error', 'Gagal membuat file Excel', 'Coba tutup aplikasi lain atau kurangi jumlah file lalu proses ulang.');
      showToast('error', 'Ekspor gagal', friendlyError(error));
    }
  }

  function borderStyle(light, bottom) {
    return {
      top: { style: 'thin', color: { rgb: light } },
      bottom: { style: 'thin', color: { rgb: bottom } },
      left: { style: 'thin', color: { rgb: light } },
      right: { style: 'thin', color: { rgb: light } }
    };
  }

  function rebuildFinalData() {
    state.finalData = state.files.filter((item) => item.status === 'completed').flatMap((item) => item.result);
    sortFinalData();
  }

  function sortFinalData() {
    const dateKey = state.mode === 'bukpot' ? 'Tanggal Bukti Potong' : state.mode === 'mileapp' ? 'Tgl Kirim' : state.mode === 'pranpp' ? 'Tanggal Transaksi' : null;
    state.finalData.sort((a, b) => {
      const first = dateKey ? a[dateKey] : (a['Tanggal Kirim'] || a['Tgl Kirim']);
      const second = dateKey ? b[dateKey] : (b['Tanggal Kirim'] || b['Tgl Kirim']);
      return parseDmyDate(first) - parseDmyDate(second);
    });
  }

  function renderAll() {
    renderFiles();
    updateStats();
    updateControls();
    renderResults();
    updateSteps();
  }

  function renderFiles() {
    els.fileList.replaceChildren();
    els.emptyList.classList.toggle('is-hidden', state.files.length > 0);
    state.files.forEach((item) => els.fileList.append(createFileItem(item)));
    const totalSize = state.files.reduce((sum, item) => sum + item.file.size, 0);
    els.fileCount.textContent = state.files.length === 0 ? 'Belum ada file' : `${state.files.length} file di workspace`;
    els.fileSizeTotal.textContent = `Total ukuran ${formatBytes(totalSize)}`;
  }

  function createFileItem(item) {
    const article = document.createElement('article');
    article.className = 'file-item';
    article.dataset.fileId = item.id;

    const typeIcon = document.createElement('span');
    typeIcon.className = 'file-type-icon';
    typeIcon.textContent = (item.extension || 'FILE').slice(0, 4).toUpperCase();

    const info = document.createElement('div');
    info.className = 'file-info';
    const name = document.createElement('strong');
    name.textContent = item.file.name;
    name.title = item.file.name;
    const meta = document.createElement('div');
    meta.className = 'file-meta';
    const size = document.createElement('span');
    size.textContent = formatBytes(item.file.size);
    const status = document.createElement('span');
    status.className = `file-status ${item.status}`;
    status.textContent = STATUS_LABELS[item.status];
    const message = document.createElement('span');
    message.textContent = item.message;
    message.title = item.message;
    meta.append(size, status, message);
    info.append(name, meta);

    const remove = document.createElement('button');
    remove.className = 'file-remove';
    remove.type = 'button';
    remove.disabled = state.processing;
    remove.setAttribute('aria-label', `Hapus ${item.file.name}`);
    remove.title = 'Hapus file';
    remove.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"></path></svg>';
    remove.addEventListener('click', () => removeFile(item.id));

    article.append(typeIcon, info, remove);
    return article;
  }

  function updateStats() {
    setText('#statTotal', state.files.length);
    setText('#statReady', countStatus('ready') + countStatus('processing'));
    setText('#statReview', countStatus('review'));
    setText('#statDone', countStatus('completed'));
    setText('#statFailed', countStatus('failed'));
    setText('#resultRows', formatNumber(state.finalData.length));
    setText('#resultFiles', countStatus('completed'));
    setText('#resultReview', countStatus('review'));
    setText('#resultFailed', countStatus('failed'));
    els.summaryFiles.textContent = `${countProcessable()} file`;
  }

  function updateControls() {
    const processable = countProcessable();
    els.processBtn.disabled = state.processing || processable === 0;
    if (!state.processing) $('.button-label', els.processBtn).textContent = state.finalData.length > 0 ? 'Proses ulang semua data' : 'Proses semua data';
    els.downloadBtn.disabled = state.finalData.length === 0 || state.processing;
    els.clearBtn.disabled = state.processing || state.files.length === 0;
    els.addMoreBtn.disabled = state.processing;
    els.retryBtn.classList.toggle('is-hidden', state.processing || state.files.every((item) => item.status !== 'failed' || !MODES[state.mode].extensions.includes(item.extension) || item.file.size === 0));

    if (state.files.length === 0) {
      setStatus('neutral', 'Menunggu file', 'Tambahkan file untuk mulai memproses.');
    } else if (!state.processing && state.finalData.length === 0 && processable > 0) {
      setStatus('ready', 'File siap diproses', `${processable} file valid menunggu pemrosesan.`);
    }
  }

  function updateProcessingUI(processing) {
    els.processBtn.classList.toggle('is-loading', processing);
    $('.button-label', els.processBtn).textContent = processing ? 'Sedang memproses...' : 'Proses semua data';
    els.cancelBtn.classList.toggle('is-hidden', !processing);
    els.progressCard.classList.toggle('is-hidden', !processing);
    updateControls();
    $$('.mode-tab').forEach((button) => { button.disabled = processing; });
  }

  function updateProgress(done, total, fileName) {
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    els.progressPercent.textContent = `${percent}%`;
    els.progressBar.style.width = `${percent}%`;
    els.progressTitle.textContent = done === total ? 'Menyelesaikan hasil' : `Memproses file ${Math.min(done + 1, total)} dari ${total}`;
    els.progressDetail.textContent = fileName || 'Menyiapkan file...';
    setStatus('processing', 'Pemrosesan sedang berjalan', `${done} dari ${total} file selesai.`);
  }

  function renderResults() {
    els.resultsPanel.classList.toggle('is-hidden', !state.hasProcessed);
    $('#resultsDescription').textContent = state.finalData.length > 0
      ? `${formatNumber(state.finalData.length)} baris telah digabungkan dari file yang berhasil.`
      : 'Belum ada baris data yang dapat ditampilkan.';
    renderResultTable();
  }

  function renderResultTable() {
    const thead = $('thead', els.resultTable);
    const tbody = $('tbody', els.resultTable);
    thead.replaceChildren();
    tbody.replaceChildren();

    if (state.finalData.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.className = 'empty-table';
      cell.colSpan = 1;
      cell.textContent = 'Belum ada hasil yang dapat ditampilkan.';
      row.append(cell);
      tbody.append(row);
      els.tableCount.textContent = 'Menampilkan 0 baris';
      return;
    }

    const allColumns = [...new Set(state.finalData.flatMap((row) => Object.keys(row)))];
    const columns = allColumns.slice(0, MAX_PREVIEW_COLUMNS);
    const filtered = state.search
      ? state.finalData.filter((row) => Object.values(row).some((value) => String(value ?? '').toLocaleLowerCase('id-ID').includes(state.search)))
      : state.finalData;
    const previewRows = filtered.slice(0, MAX_PREVIEW_ROWS);

    const headRow = document.createElement('tr');
    columns.forEach((column) => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = column;
      th.title = column;
      headRow.append(th);
    });
    thead.append(headRow);

    previewRows.forEach((rowData) => {
      const row = document.createElement('tr');
      columns.forEach((column) => {
        const cell = document.createElement('td');
        const value = rowData[column];
        cell.textContent = formatCell(value);
        cell.title = String(value ?? '');
        row.append(cell);
      });
      tbody.append(row);
    });

    if (previewRows.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.className = 'empty-table';
      cell.colSpan = Math.max(columns.length, 1);
      cell.textContent = 'Tidak ada hasil yang cocok dengan pencarian.';
      row.append(cell);
      tbody.append(row);
    }

    els.tableCount.textContent = `Menampilkan ${formatNumber(previewRows.length)} dari ${formatNumber(filtered.length)} baris`;
    const notes = [];
    if (allColumns.length > columns.length) notes.push(`${allColumns.length - columns.length} kolom tambahan tetap disertakan di Excel`);
    if (filtered.length > previewRows.length) notes.push(`pratinjau dibatasi ${MAX_PREVIEW_ROWS} baris`);
    els.tableNote.textContent = notes.length ? `${notes.join(' dan ')}. Seluruh data tetap disertakan di file Excel.` : 'Seluruh data pada tabel ini akan disertakan di file Excel.';
  }

  function updateSteps() {
    const total = state.files.length;
    const processing = state.processing;
    const hasResults = state.hasProcessed;
    const steps = $$('.steps li');
    steps.forEach((step) => step.classList.remove('is-active', 'is-complete'));

    if (total === 0) {
      steps[0].classList.add('is-active');
    } else if (processing) {
      steps[0].classList.add('is-complete');
      steps[1].classList.add('is-active');
    } else if (hasResults) {
      steps[0].classList.add('is-complete');
      steps[1].classList.add('is-complete');
      steps[2].classList.add('is-active');
    } else {
      steps[0].classList.add('is-complete');
      steps[1].classList.add('is-active');
    }
  }

  function markDownloadStep() {
    const steps = $$('.steps li');
    steps.forEach((step) => step.classList.remove('is-active'));
    steps.forEach((step) => step.classList.add('is-complete'));
    steps[3].classList.add('is-active');
  }

  function setStatus(type, title, detail) {
    els.statusMessage.className = `status-message ${type === 'neutral' ? '' : type}`.trim();
    const strong = $('strong', els.statusMessage);
    const paragraph = $('p', els.statusMessage);
    strong.textContent = title;
    paragraph.textContent = detail;
  }

  function showToast(type, title, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.innerHTML = `${toastIcon(type)}<div><strong></strong><p></p></div><button type="button" aria-label="Tutup notifikasi"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"></path></svg></button>`;
    $('strong', toast).textContent = title;
    $('p', toast).textContent = message;
    $('button', toast).addEventListener('click', () => toast.remove());
    els.toastRegion.append(toast);
    window.setTimeout(() => toast.remove(), type === 'error' ? 8000 : 5000);
  }

  function toastIcon(type) {
    if (type === 'success') return '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="m8 12 2.6 2.6L16.5 9"></path></svg>';
    if (type === 'warning') return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 4 3.5 19h17z"></path><path d="M12 9v4M12 16h.01"></path></svg>';
    if (type === 'error') return '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="m9 9 6 6m0-6-6 6"></path></svg>';
    return '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 11v5M12 8h.01"></path></svg>';
  }

  function openHelp() {
    if (typeof els.helpDialog.showModal === 'function') els.helpDialog.showModal();
    else showToast('info', 'Cara menggunakan', 'Pilih mode, tambahkan file, proses data, periksa hasil, lalu unduh Excel.');
  }

  function friendlyError(error) {
    const code = String(error && error.message ? error.message : error);
    const messages = {
      MODE_MISMATCH_HTML: 'File HTML/XLS Web hanya dapat diproses pada mode PRANPP atau PID.',
      MODE_MISMATCH_EXCEL: 'File Excel asli hanya dapat diproses pada mode PRANPP atau PID.',
      MODE_MISMATCH_PID: 'Mode PID memerlukan file Excel atau HTML hasil ekspor web.',
      PASSWORD_PROTECTED: 'File Excel dilindungi kata sandi dan tidak dapat dibaca.',
      CORRUPT_EXCEL: 'File Excel rusak atau formatnya tidak dikenali.',
      EMPTY_WORKBOOK: 'Workbook tidak memiliki lembar data.',
      EMPTY_FILE: 'File kosong dan tidak dapat diproses.',
      NO_TABLE: 'Tidak ditemukan tabel data pada file HTML.',
      MALFORMED_CSV: 'Struktur CSV tidak valid atau memiliki tanda kutip yang tidak berpasangan.',
      READ_FAILED: 'Browser gagal membaca file. Coba tambahkan ulang file.',
      READ_ABORTED: 'Pembacaan file dibatalkan.'
    };
    return messages[code] || 'File tidak dapat diproses. Periksa format dan isi dokumen.';
  }

  function countStatus(status) {
    return state.files.filter((item) => item.status === status).length;
  }

  function countProcessable() {
    return state.files.filter((item) => item.status !== 'failed' && item.file.size > 0 && MODES[state.mode].extensions.includes(item.extension)).length;
  }

  function getExtension(name) {
    const lastDot = name.lastIndexOf('.');
    return lastDot === -1 ? '' : name.slice(lastDot + 1).toLowerCase();
  }

  function createId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / (1024 ** index);
    return `${value.toLocaleString('id-ID', { maximumFractionDigits: index === 0 ? 0 : 1 })} ${units[index]}`;
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString('id-ID');
  }

  function formatCell(value) {
    if (value === undefined || value === null || value === '') return '—';
    if (typeof value === 'number') return value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
    return String(value);
  }

  function setText(selector, value) {
    const element = $(selector);
    if (element) element.textContent = String(value);
  }

  function yieldToBrowser() {
    return new Promise((resolve) => window.setTimeout(resolve, 0));
  }

  initialize();
})();
