/**
 * ==========================================================================
 * SISTEMA DE PLANILLAS Y TRANSPARENCIA - LÓGICA DE APLICACIÓN (VANILLA JS)
 * SPA con búsqueda en tiempo real, filtros, paginación de 50, panel admin,
 * generación de reportes y exportación en múltiples formatos.
 * ==========================================================================
 */

(function () {
  'use strict';

  // --- ESTADO GLOBAL DE LA APLICACIÓN ---
  const state = {
    records: [],          // Datos completos de personal
    filteredRecords: [],  // Datos luego de aplicar filtros y búsqueda
    currentPage: 1,
    pageSize: 50,         // Paginado de 50 registros por defecto
    sortColumn: 'id',
    sortDirection: 'asc',
    filters: {
      search: '',
      regimen: '',        // '' para todos, o '8', '2', '1', '3'
      dependencia: '',
      rangoSalarial: '',  // '' o '0-2000', '2000-5000', '5000-8000', '8000+'
    },
    isAdminLoggedIn: false,
    activeAdminTab: 'reporte',
    theme: 'dark'
  };

  // --- ELEMENTOS DEL DOM ---
  const elements = {};

  // --- FORMATTERS Y HELPERS ---
  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return 'S/. ' + num.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getInitials = (paterno, materno, nombres) => {
    const p = (paterno || '').trim().charAt(0);
    const m = (materno || '').trim().charAt(0);
    const n = (nombres || '').trim().charAt(0);
    return (p + (n || m)).toUpperCase() || 'PE';
  };

  const getRegimeColorClass = (code) => {
    switch (String(code)) {
      case '8': return 'badge-regime-8';
      case '2': return 'badge-regime-2';
      case '1': return 'badge-regime-1';
      case '3': return 'badge-regime-3';
      default: return 'badge-regime-2';
    }
  };

  const getRegimeShortTitle = (code) => {
    switch (String(code)) {
      case '8': return 'La Molina';
      case '2': return 'D.L. 276';
      case '1': return 'CAS';
      case '3': return 'Docente';
      default: return `Régimen ${code}`;
    }
  };

  // --- INICIALIZACIÓN ---
  function init() {
    cacheDomElements();
    initTheme();
    checkAuthSession();
    loadDataset();
    populateDependenciasFilter();
    attachEventListeners();
    applyFiltersAndRender();
  }

  function cacheDomElements() {
    elements.themeToggleBtn = document.getElementById('themeToggleBtn');
    elements.adminAccessBtn = document.getElementById('adminAccessBtn');
    
    // KPI elements
    elements.kpiTotalPersonal = document.getElementById('kpiTotalPersonal');
    elements.kpiTotalPlanilla = document.getElementById('kpiTotalPlanilla');
    elements.kpiPromedioSalarial = document.getElementById('kpiPromedioSalarial');
    elements.kpiOtrosBeneficios = document.getElementById('kpiOtrosBeneficios');
    
    // Regime quick filter buttons
    elements.rfBtns = document.querySelectorAll('.regime-filter-btn');
    elements.rfCount8 = document.getElementById('rfCount8');
    elements.rfCount2 = document.getElementById('rfCount2');
    elements.rfCount1 = document.getElementById('rfCount1');
    elements.rfCount3 = document.getElementById('rfCount3');

    // Controls
    elements.searchInput = document.getElementById('searchInput');
    elements.btnClearSearch = document.getElementById('btnClearSearch');
    elements.regimenFilter = document.getElementById('regimenFilter');
    elements.dependenciaFilter = document.getElementById('dependenciaFilter');
    elements.rangoFilter = document.getElementById('rangoFilter');
    elements.btnResetFilters = document.getElementById('btnResetFilters');
    elements.activeFiltersBar = document.getElementById('activeFiltersBar');
    elements.activeFilterTags = document.getElementById('activeFilterTags');

    // Table & Pagination
    elements.tableBody = document.getElementById('tableBody');
    elements.tableCountInfo = document.getElementById('tableCountInfo');
    elements.tableHeaders = document.querySelectorAll('.data-table th[data-sort]');
    elements.paginationInfo = document.getElementById('paginationInfo');
    elements.paginationButtons = document.getElementById('paginationButtons');
    elements.pageSizeSelect = document.getElementById('pageSizeSelect');

    // Modals
    elements.loginModal = document.getElementById('loginModal');
    elements.loginForm = document.getElementById('loginForm');
    elements.loginUsername = document.getElementById('loginUsername');
    elements.loginPassword = document.getElementById('loginPassword');
    elements.loginErrorMsg = document.getElementById('loginErrorMsg');
    elements.btnQuickFill = document.getElementById('btnQuickFill');
    elements.btnCloseLoginModal = document.getElementById('btnCloseLoginModal');

    elements.adminModal = document.getElementById('adminModal');
    elements.btnCloseAdminModal = document.getElementById('btnCloseAdminModal');
    elements.adminTabsNav = document.getElementById('adminTabsNav');
    elements.btnAdminLogout = document.getElementById('btnAdminLogout');

    elements.detailModal = document.getElementById('detailModal');
    elements.btnCloseDetailModal = document.getElementById('btnCloseDetailModal');
    elements.detailContent = document.getElementById('detailContent');

    // Admin Tools
    elements.btnExportCsvFull = document.getElementById('btnExportCsvFull');
    elements.btnExportCsvFiltered = document.getElementById('btnExportCsvFiltered');
    elements.btnExportExcel = document.getElementById('btnExportExcel');
    elements.btnExportJson = document.getElementById('btnExportJson');
    elements.btnCopyClipboard = document.getElementById('btnCopyClipboard');
    elements.btnPrintReport = document.getElementById('btnPrintReport');
    elements.newRecordForm = document.getElementById('newRecordForm');
  }

  function initTheme() {
    const savedTheme = localStorage.getItem('unalm_theme') || 'dark';
    state.theme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('unalm_theme', state.theme);
    updateThemeIcon();
  }

  function updateThemeIcon() {
    if (elements.themeToggleBtn) {
      elements.themeToggleBtn.innerHTML = state.theme === 'dark' ? '☀️' : '🌙';
      elements.themeToggleBtn.setAttribute('title', state.theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    }
  }

  function checkAuthSession() {
    const auth = sessionStorage.getItem('unalm_admin_session');
    state.isAdminLoggedIn = auth === 'true';
    updateAdminButtonState();
  }

  function updateAdminButtonState() {
    if (!elements.adminAccessBtn) return;
    if (state.isAdminLoggedIn) {
      elements.adminAccessBtn.classList.add('logged-in');
      elements.adminAccessBtn.innerHTML = '⚙️ Panel Administrador';
    } else {
      elements.adminAccessBtn.classList.remove('logged-in');
      elements.adminAccessBtn.innerHTML = '🔒 Acceso Administrador';
    }
  }

  // --- CARGA DE DATOS ---
  function loadDataset() {
    if (window.PERSONAL_DATA && Array.isArray(window.PERSONAL_DATA)) {
      state.records = [...window.PERSONAL_DATA];
    } else {
      console.warn('window.PERSONAL_DATA no encontrado. Inicializando vacío.');
      state.records = [];
    }
    updateKpiCards(state.records);
  }

  function updateKpiCards(records) {
    let totalPersonal = records.length;
    let totalPlanilla = 0;
    let totalRemun = 0;
    let totalOtros = 0;
    let count8 = 0, count2 = 0, count1 = 0, count3 = 0;

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      totalPlanilla += r.total || 0;
      totalRemun += r.remuneraciones || 0;
      totalOtros += r.otrosBeneficios || 0;

      switch (String(r.regimenCodigo)) {
        case '8': count8++; break;
        case '2': count2++; break;
        case '1': count1++; break;
        case '3': count3++; break;
      }
    }

    const promedio = totalPersonal > 0 ? totalPlanilla / totalPersonal : 0;

    if (elements.kpiTotalPersonal) elements.kpiTotalPersonal.textContent = totalPersonal.toLocaleString('es-PE');
    if (elements.kpiTotalPlanilla) elements.kpiTotalPlanilla.textContent = formatCurrency(totalPlanilla);
    if (elements.kpiPromedioSalarial) elements.kpiPromedioSalarial.textContent = formatCurrency(promedio);
    if (elements.kpiOtrosBeneficios) elements.kpiOtrosBeneficios.textContent = formatCurrency(totalOtros);

    if (elements.rfCount8) elements.rfCount8.textContent = count8.toLocaleString('es-PE');
    if (elements.rfCount2) elements.rfCount2.textContent = count2.toLocaleString('es-PE');
    if (elements.rfCount1) elements.rfCount1.textContent = count1.toLocaleString('es-PE');
    if (elements.rfCount3) elements.rfCount3.textContent = count3.toLocaleString('es-PE');
  }

  function populateDependenciasFilter() {
    if (!elements.dependenciaFilter) return;
    const depsSet = new Set();
    state.records.forEach(r => {
      if (r.dependencia && r.dependencia.trim()) {
        depsSet.add(r.dependencia.trim());
      }
    });

    const depsSorted = Array.from(depsSet).sort((a, b) => a.localeCompare(b, 'es'));
    
    // Clear and build options
    elements.dependenciaFilter.innerHTML = '<option value="">Todas las Dependencias (' + depsSorted.length + ')</option>';
    depsSorted.forEach(dep => {
      const opt = document.createElement('option');
      opt.value = dep;
      opt.textContent = dep;
      elements.dependenciaFilter.appendChild(opt);
    });
  }

  // --- FILTRADO Y ORDENAMIENTO ---
  function applyFiltersAndRender() {
    const q = (state.filters.search || '').trim().toLowerCase();
    const reg = state.filters.regimen;
    const dep = state.filters.dependencia;
    const salRange = state.filters.rangoSalarial;

    let res = state.records.filter(item => {
      // Búsqueda en tiempo real (nombre, apellidos, cargo, dependencia)
      if (q) {
        const matchName = (item.nombreCompleto || '').toLowerCase().includes(q);
        const matchCargo = (item.cargo || '').toLowerCase().includes(q);
        const matchDep = (item.dependencia || '').toLowerCase().includes(q);
        if (!matchName && !matchCargo && !matchDep) return false;
      }

      // Filtro Régimen
      if (reg && String(item.regimenCodigo) !== String(reg)) {
        return false;
      }

      // Filtro Dependencia
      if (dep && (item.dependencia || '').trim() !== dep) {
        return false;
      }

      // Filtro Rango Salarial
      if (salRange) {
        const tot = item.total || 0;
        if (salRange === '0-2000' && (tot < 0 || tot > 2000)) return false;
        if (salRange === '2000-5000' && (tot <= 2000 || tot > 5000)) return false;
        if (salRange === '5000-8000' && (tot <= 5000 || tot > 8000)) return false;
        if (salRange === '8000+' && tot <= 8000) return false;
      }

      return true;
    });

    // Ordenamiento
    sortRecords(res, state.sortColumn, state.sortDirection);

    state.filteredRecords = res;

    // Asegurar que la página no exceda el máximo
    const totalPages = Math.max(1, Math.ceil(state.filteredRecords.length / state.pageSize));
    if (state.currentPage > totalPages) {
      state.currentPage = totalPages;
    }

    renderTable();
    renderPagination();
    renderActiveFilterTags();
    updateRegimeQuickButtons();
  }

  function sortRecords(arr, col, dir) {
    const factor = dir === 'desc' ? -1 : 1;
    arr.sort((a, b) => {
      let valA = a[col];
      let valB = b[col];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return -1 * factor;
      if (valA > valB) return 1 * factor;
      return 0;
    });
  }

  // --- RENDERIZADO DE TABLA ---
  function renderTable() {
    if (!elements.tableBody) return;

    const total = state.filteredRecords.length;
    const startIndex = (state.currentPage - 1) * state.pageSize;
    const endIndex = Math.min(startIndex + state.pageSize, total);
    const pageRecords = state.filteredRecords.slice(startIndex, endIndex);

    // Actualizar conteo en barra
    if (elements.tableCountInfo) {
      if (total === 0) {
        elements.tableCountInfo.innerHTML = 'Mostrando <strong>0</strong> resultados';
      } else {
        elements.tableCountInfo.innerHTML = `Mostrando <strong>${startIndex + 1} - ${endIndex}</strong> de <strong>${total.toLocaleString('es-PE')}</strong> colaboradores`;
      }
    }

    if (pageRecords.length === 0) {
      elements.tableBody.innerHTML = `
        <tr>
          <td colspan="9">
            <div class="empty-state">
              <div class="empty-state-icon">🔍</div>
              <h3>No se encontraron colaboradores</h3>
              <p>Intenta ajustar los términos de búsqueda o restablecer los filtros aplicados.</p>
              <button class="btn-secondary" style="margin-top: 14px;" onclick="window.resetAllFilters()">Restablecer Filtros</button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const q = (state.filters.search || '').trim();

    const rowsHtml = pageRecords.map((item, idx) => {
      const rowNum = startIndex + idx + 1;
      const initials = getInitials(item.paterno, item.materno, item.nombres);
      const regClass = getRegimeColorClass(item.regimenCodigo);
      const regShort = getRegimeShortTitle(item.regimenCodigo);

      let nameDisplay = item.nombreCompleto;
      let cargoDisplay = item.cargo;
      let depDisplay = item.dependencia;

      // Resaltado de texto de búsqueda si coincide
      if (q && q.length > 1) {
        nameDisplay = highlightMatch(nameDisplay, q);
        cargoDisplay = highlightMatch(cargoDisplay, q);
        depDisplay = highlightMatch(depDisplay, q);
      }

      return `
        <tr data-id="${item.id}">
          <td class="col-num">${rowNum}</td>
          <td>
            <div class="col-person">
              <div class="person-avatar">${initials}</div>
              <div class="person-info">
                <span class="person-name">${nameDisplay}</span>
                <span class="person-sub">${item.paterno || ''} ${item.materno || ''}</span>
              </div>
            </div>
          </td>
          <td>
            <span class="badge-regime ${regClass}" title="${escapeHtml(item.regimenNombre)}">
              <span class="rf-code">${item.regimenCodigo}</span> ${regShort}
            </span>
          </td>
          <td class="col-cargo" title="${escapeHtml(item.cargo)}">${cargoDisplay}</td>
          <td class="col-dep" title="${escapeHtml(item.dependencia)}">${depDisplay}</td>
          <td class="col-currency">${formatCurrency(item.remuneraciones)}</td>
          <td class="col-currency">${formatCurrency(item.otrosBeneficios)}</td>
          <td class="col-currency col-total">${formatCurrency(item.total)}</td>
          <td style="text-align: center;">
            <button class="btn-action-view" onclick="window.viewEmployeeDetail(${item.id})" title="Ver ficha completa">
              👁️ Ficha
            </button>
          </td>
        </tr>
      `;
    }).join('');

    elements.tableBody.innerHTML = rowsHtml;
  }

  function highlightMatch(text, query) {
    if (!text || !query) return text;
    const escapedQ = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQ})`, 'gi');
    return text.replace(regex, '<mark style="background: rgba(56,189,248,0.3); color: #fff; padding: 1px 3px; border-radius: 3px;">$1</mark>');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // --- RENDERIZADO DE PAGINACIÓN ---
  function renderPagination() {
    if (!elements.paginationButtons || !elements.paginationInfo) return;

    const total = state.filteredRecords.length;
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    const curr = state.currentPage;

    elements.paginationInfo.textContent = `Página ${curr} de ${totalPages} (${total.toLocaleString('es-PE')} registros en total)`;

    let html = '';

    // Botón Primero y Anterior
    html += `<button class="page-btn" ${curr === 1 ? 'disabled' : ''} onclick="window.goToPage(1)" title="Primera página">«</button>`;
    html += `<button class="page-btn" ${curr === 1 ? 'disabled' : ''} onclick="window.goToPage(${curr - 1})" title="Página anterior">‹</button>`;

    // Generar números de página con elipsis inteligente
    const pageWindow = 2; // páginas a la izquierda y derecha
    let startPage = Math.max(1, curr - pageWindow);
    let endPage = Math.min(totalPages, curr + pageWindow);

    if (startPage > 1) {
      html += `<button class="page-btn" onclick="window.goToPage(1)">1</button>`;
      if (startPage > 2) {
        html += `<span class="page-ellipsis">...</span>`;
      }
    }

    for (let p = startPage; p <= endPage; p++) {
      html += `<button class="page-btn ${p === curr ? 'active' : ''}" onclick="window.goToPage(${p})">${p}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        html += `<span class="page-ellipsis">...</span>`;
      }
      html += `<button class="page-btn" onclick="window.goToPage(${totalPages})">${totalPages}</button>`;
    }

    // Botón Siguiente y Último
    html += `<button class="page-btn" ${curr === totalPages ? 'disabled' : ''} onclick="window.goToPage(${curr + 1})" title="Página siguiente">›</button>`;
    html += `<button class="page-btn" ${curr === totalPages ? 'disabled' : ''} onclick="window.goToPage(${totalPages})" title="Última página">»</button>`;

    elements.paginationButtons.innerHTML = html;
  }

  function goToPage(page) {
    const totalPages = Math.max(1, Math.ceil(state.filteredRecords.length / state.pageSize));
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    state.currentPage = page;
    renderTable();
    renderPagination();

    // Scroll suave a la tabla
    const tableEl = document.querySelector('.table-card');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // --- ETIQUETAS DE FILTROS ACTIVOS ---
  function renderActiveFilterTags() {
    if (!elements.activeFiltersBar || !elements.activeFilterTags) return;

    const tags = [];
    if (state.filters.search) {
      tags.push({ key: 'search', label: `Búsqueda: "${state.filters.search}"` });
    }
    if (state.filters.regimen) {
      const regName = window.REGIME_MAP ? window.REGIME_MAP[state.filters.regimen] : `Régimen ${state.filters.regimen}`;
      tags.push({ key: 'regimen', label: `Régimen: ${regName}` });
    }
    if (state.filters.dependencia) {
      tags.push({ key: 'dependencia', label: `Dependencia: ${state.filters.dependencia}` });
    }
    if (state.filters.rangoSalarial) {
      let salLabel = state.filters.rangoSalarial;
      if (salLabel === '0-2000') salLabel = 'Hasta S/. 2,000';
      else if (salLabel === '2000-5000') salLabel = 'S/. 2,000 a S/. 5,000';
      else if (salLabel === '5000-8000') salLabel = 'S/. 5,000 a S/. 8,000';
      else if (salLabel === '8000+') salLabel = 'Más de S/. 8,000';
      tags.push({ key: 'rangoSalarial', label: `Sueldo: ${salLabel}` });
    }

    if (tags.length === 0) {
      elements.activeFiltersBar.style.display = 'none';
      elements.activeFilterTags.innerHTML = '';
      return;
    }

    elements.activeFiltersBar.style.display = 'flex';
    elements.activeFilterTags.innerHTML = tags.map(t => `
      <span class="filter-tag">
        ${escapeHtml(t.label)}
        <span class="filter-tag-remove" onclick="window.removeFilter('${t.key}')" title="Quitar este filtro">×</span>
      </span>
    `).join('');
  }

  function updateRegimeQuickButtons() {
    if (!elements.rfBtns) return;
    elements.rfBtns.forEach(btn => {
      const code = btn.getAttribute('data-regime');
      if (state.filters.regimen === code) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function removeFilter(key) {
    if (key === 'search') {
      state.filters.search = '';
      if (elements.searchInput) elements.searchInput.value = '';
      if (elements.btnClearSearch) elements.btnClearSearch.style.display = 'none';
    } else if (key === 'regimen') {
      state.filters.regimen = '';
      if (elements.regimenFilter) elements.regimenFilter.value = '';
    } else if (key === 'dependencia') {
      state.filters.dependencia = '';
      if (elements.dependenciaFilter) elements.dependenciaFilter.value = '';
    } else if (key === 'rangoSalarial') {
      state.filters.rangoSalarial = '';
      if (elements.rangoFilter) elements.rangoFilter.value = '';
    }
    state.currentPage = 1;
    applyFiltersAndRender();
  }

  function resetAllFilters() {
    state.filters.search = '';
    state.filters.regimen = '';
    state.filters.dependencia = '';
    state.filters.rangoSalarial = '';

    if (elements.searchInput) elements.searchInput.value = '';
    if (elements.btnClearSearch) elements.btnClearSearch.style.display = 'none';
    if (elements.regimenFilter) elements.regimenFilter.value = '';
    if (elements.dependenciaFilter) elements.dependenciaFilter.value = '';
    if (elements.rangoFilter) elements.rangoFilter.value = '';

    state.currentPage = 1;
    applyFiltersAndRender();
  }

  // --- EVENT LISTENERS ---
  function attachEventListeners() {
    // Theme toggle
    if (elements.themeToggleBtn) {
      elements.themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Búsqueda en tiempo real (debounced)
    let debounceTimer;
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (elements.btnClearSearch) {
          elements.btnClearSearch.style.display = val.length > 0 ? 'block' : 'none';
        }
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          state.filters.search = val;
          state.currentPage = 1;
          applyFiltersAndRender();
        }, 180);
      });
    }

    if (elements.btnClearSearch) {
      elements.btnClearSearch.addEventListener('click', () => {
        elements.searchInput.value = '';
        elements.btnClearSearch.style.display = 'none';
        state.filters.search = '';
        state.currentPage = 1;
        applyFiltersAndRender();
        elements.searchInput.focus();
      });
    }

    // Filtro Régimen
    if (elements.regimenFilter) {
      elements.regimenFilter.addEventListener('change', (e) => {
        state.filters.regimen = e.target.value;
        state.currentPage = 1;
        applyFiltersAndRender();
      });
    }

    // Filtro Dependencia
    if (elements.dependenciaFilter) {
      elements.dependenciaFilter.addEventListener('change', (e) => {
        state.filters.dependencia = e.target.value;
        state.currentPage = 1;
        applyFiltersAndRender();
      });
    }

    // Filtro Rango Salarial
    if (elements.rangoFilter) {
      elements.rangoFilter.addEventListener('change', (e) => {
        state.filters.rangoSalarial = e.target.value;
        state.currentPage = 1;
        applyFiltersAndRender();
      });
    }

    // Botón Reset Filtros
    if (elements.btnResetFilters) {
      elements.btnResetFilters.addEventListener('click', resetAllFilters);
    }

    // Regime Quick Buttons
    if (elements.rfBtns) {
      elements.rfBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const code = btn.getAttribute('data-regime');
          if (state.filters.regimen === code) {
            state.filters.regimen = ''; // Deseleccionar
          } else {
            state.filters.regimen = code;
          }
          if (elements.regimenFilter) elements.regimenFilter.value = state.filters.regimen;
          state.currentPage = 1;
          applyFiltersAndRender();
        });
      });
    }

    // Page Size Selector
    if (elements.pageSizeSelect) {
      elements.pageSizeSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        state.pageSize = val === 'all' ? 999999 : parseInt(val, 10);
        state.currentPage = 1;
        renderTable();
        renderPagination();
      });
    }

    // Table Header Sort Clicks
    if (elements.tableHeaders) {
      elements.tableHeaders.forEach(th => {
        th.addEventListener('click', () => {
          const col = th.getAttribute('data-sort');
          if (state.sortColumn === col) {
            state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
          } else {
            state.sortColumn = col;
            state.sortDirection = 'asc';
          }
          updateSortHeaderIcons();
          applyFiltersAndRender();
        });
      });
    }

    // Admin Access Button
    if (elements.adminAccessBtn) {
      elements.adminAccessBtn.addEventListener('click', handleAdminButtonClick);
    }

    // Login Form Submit
    if (elements.loginForm) {
      elements.loginForm.addEventListener('submit', handleLoginSubmit);
    }

    // Quick Fill Button
    if (elements.btnQuickFill) {
      elements.btnQuickFill.addEventListener('click', () => {
        if (elements.loginUsername) elements.loginUsername.value = 'admin';
        if (elements.loginPassword) elements.loginPassword.value = '123';
      });
    }

    // Modals close buttons
    if (elements.btnCloseLoginModal) {
      elements.btnCloseLoginModal.addEventListener('click', closeLoginModal);
    }
    if (elements.btnCloseAdminModal) {
      elements.btnCloseAdminModal.addEventListener('click', closeAdminModal);
    }
    if (elements.btnCloseDetailModal) {
      elements.btnCloseDetailModal.addEventListener('click', closeDetailModal);
    }

    // Close on overlay click
    [elements.loginModal, elements.adminModal, elements.detailModal].forEach(modal => {
      if (!modal) return;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });

    // Admin Tabs Nav
    if (elements.adminTabsNav) {
      elements.adminTabsNav.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;
        const targetTab = btn.getAttribute('data-tab');
        switchAdminTab(targetTab);
      });
    }

    // Admin Logout
    if (elements.btnAdminLogout) {
      elements.btnAdminLogout.addEventListener('click', handleAdminLogout);
    }

    // Export Buttons
    if (elements.btnExportCsvFull) {
      elements.btnExportCsvFull.addEventListener('click', () => exportDataToCsv(state.records, 'planilla_completa_unalm.csv'));
    }
    if (elements.btnExportCsvFiltered) {
      elements.btnExportCsvFiltered.addEventListener('click', () => exportDataToCsv(state.filteredRecords, 'planilla_filtrada_unalm.csv'));
    }
    if (elements.btnExportExcel) {
      elements.btnExportExcel.addEventListener('click', () => exportDataToCsv(state.filteredRecords, 'reporte_personal_excel.csv'));
    }
    if (elements.btnExportJson) {
      elements.btnExportJson.addEventListener('click', exportDataToJson);
    }
    if (elements.btnCopyClipboard) {
      elements.btnCopyClipboard.addEventListener('click', copyDataToClipboard);
    }
    if (elements.btnPrintReport) {
      elements.btnPrintReport.addEventListener('click', () => window.print());
    }

    // New Record Form
    if (elements.newRecordForm) {
      elements.newRecordForm.addEventListener('submit', handleNewRecordSubmit);
    }
  }

  function updateSortHeaderIcons() {
    if (!elements.tableHeaders) return;
    elements.tableHeaders.forEach(th => {
      const col = th.getAttribute('data-sort');
      const icon = th.querySelector('.sort-icon');
      th.classList.remove('sorted-asc', 'sorted-desc');
      if (col === state.sortColumn) {
        th.classList.add(state.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
        if (icon) icon.textContent = state.sortDirection === 'asc' ? '▲' : '▼';
      } else {
        if (icon) icon.textContent = '⇅';
      }
    });
  }

  // --- MODALES Y AUTENTICACIÓN ---
  function handleAdminButtonClick() {
    if (state.isAdminLoggedIn) {
      openAdminModal();
    } else {
      openLoginModal();
    }
  }

  function openLoginModal() {
    if (!elements.loginModal) return;
    if (elements.loginErrorMsg) elements.loginErrorMsg.style.display = 'none';
    if (elements.loginForm) elements.loginForm.reset();
    elements.loginModal.classList.add('active');
    setTimeout(() => {
      if (elements.loginUsername) elements.loginUsername.focus();
    }, 100);
  }

  function closeLoginModal() {
    if (elements.loginModal) elements.loginModal.classList.remove('active');
  }

  function handleLoginSubmit(e) {
    e.preventDefault();
    const user = (elements.loginUsername ? elements.loginUsername.value : '').trim();
    const pass = (elements.loginPassword ? elements.loginPassword.value : '').trim();

    // Verificación solicitada: usuario 'admin' y contraseña '123'
    if (user === 'admin' && pass === '123') {
      state.isAdminLoggedIn = true;
      sessionStorage.setItem('unalm_admin_session', 'true');
      updateAdminButtonState();
      closeLoginModal();
      openAdminModal();
    } else {
      // Error feedback
      if (elements.loginErrorMsg) {
        elements.loginErrorMsg.style.display = 'flex';
      }
      const box = elements.loginModal.querySelector('.modal-box');
      if (box) {
        box.classList.remove('shake');
        void box.offsetWidth; // trigger reflow
        box.classList.add('shake');
      }
    }
  }

  function handleAdminLogout() {
    state.isAdminLoggedIn = false;
    sessionStorage.removeItem('unalm_admin_session');
    updateAdminButtonState();
    closeAdminModal();
    alert('Has cerrado la sesión de Administrador correctamente.');
  }

  function openAdminModal() {
    if (!elements.adminModal) return;
    generateAdminReport();
    switchAdminTab('reporte');
    elements.adminModal.classList.add('active');
  }

  function closeAdminModal() {
    if (elements.adminModal) elements.adminModal.classList.remove('active');
  }

  function switchAdminTab(tabName) {
    state.activeAdminTab = tabName;
    const tabBtns = elements.adminTabsNav ? elements.adminTabsNav.querySelectorAll('.tab-btn') : [];
    tabBtns.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const tabContents = elements.adminModal ? elements.adminModal.querySelectorAll('.tab-content') : [];
    tabContents.forEach(content => {
      if (content.id === `tabContent-${tabName}`) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  }

  // --- REPORTE EJECUTIVO Y ESTADÍSTICAS ---
  function generateAdminReport() {
    const records = state.records;
    const totalPersonal = records.length;
    let totalPlanilla = 0;
    let totalRemun = 0;
    let totalOtros = 0;

    // Métricas por régimen
    const regStats = {
      '8': { count: 0, total: 0, remun: 0, otros: 0, name: 'Procedencia La Molina (Docente / Administrativo)' },
      '2': { count: 0, total: 0, remun: 0, otros: 0, name: 'D.L. 276 o Nombrado' },
      '1': { count: 0, total: 0, remun: 0, otros: 0, name: 'CAS (Contrato Administrativo)' },
      '3': { count: 0, total: 0, remun: 0, otros: 0, name: 'Docente Universitario' }
    };

    // Agrupación por dependencias y cargos
    const depMap = {};
    const cargoMap = {};

    records.forEach(r => {
      const tot = r.total || 0;
      totalPlanilla += tot;
      totalRemun += r.remuneraciones || 0;
      totalOtros += r.otrosBeneficios || 0;

      const code = String(r.regimenCodigo);
      if (regStats[code]) {
        regStats[code].count++;
        regStats[code].total += tot;
        regStats[code].remun += r.remuneraciones || 0;
        regStats[code].otros += r.otrosBeneficios || 0;
      }

      const dep = (r.dependencia || 'Sin Dependencia').trim();
      depMap[dep] = (depMap[dep] || 0) + tot;

      const cargo = (r.cargo || 'Sin Cargo').trim();
      if (!cargoMap[cargo]) cargoMap[cargo] = { count: 0, sum: 0 };
      cargoMap[cargo].count++;
      cargoMap[cargo].sum += tot;
    });

    // Llenar tabla resumen en admin panel
    const regTableBody = document.getElementById('reportRegimeTableBody');
    if (regTableBody) {
      let regHtml = '';
      ['8', '2', '1', '3'].forEach(code => {
        const item = regStats[code];
        const pctPersonal = totalPersonal > 0 ? ((item.count / totalPersonal) * 100).toFixed(1) : 0;
        const pctPlanilla = totalPlanilla > 0 ? ((item.total / totalPlanilla) * 100).toFixed(1) : 0;
        const avg = item.count > 0 ? item.total / item.count : 0;
        const regClass = getRegimeColorClass(code);

        regHtml += `
          <tr>
            <td>
              <span class="badge-regime ${regClass}">
                <span class="rf-code">${code}</span> ${getRegimeShortTitle(code)}
              </span>
            </td>
            <td><strong>${escapeHtml(item.name)}</strong></td>
            <td style="text-align: right;">${item.count.toLocaleString('es-PE')} (${pctPersonal}%)</td>
            <td style="text-align: right;" class="col-currency">${formatCurrency(item.remun)}</td>
            <td style="text-align: right;" class="col-currency">${formatCurrency(item.otros)}</td>
            <td style="text-align: right;" class="col-currency col-total">${formatCurrency(item.total)}</td>
            <td style="text-align: right;" class="col-currency">${formatCurrency(avg)}</td>
            <td style="text-align: right;"><strong>${pctPlanilla}%</strong></td>
          </tr>
        `;
      });

      // Fila Consolidada Total
      regHtml += `
        <tr style="background: rgba(255,255,255,0.06); font-weight: 800;">
          <td colspan="2">TOTAL CONSOLIDADO GENERAL</td>
          <td style="text-align: right;">${totalPersonal.toLocaleString('es-PE')} (100%)</td>
          <td style="text-align: right;" class="col-currency">${formatCurrency(totalRemun)}</td>
          <td style="text-align: right;" class="col-currency">${formatCurrency(totalOtros)}</td>
          <td style="text-align: right;" class="col-currency col-total" style="font-size: 1rem; color: #38bdf8;">${formatCurrency(totalPlanilla)}</td>
          <td style="text-align: right;" class="col-currency">${formatCurrency(totalPlanilla / totalPersonal)}</td>
          <td style="text-align: right;">100%</td>
        </tr>
      `;

      regTableBody.innerHTML = regHtml;
    }

    // Top 8 Dependencias por Presupuesto
    const topDeps = Object.entries(depMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const depListEl = document.getElementById('reportTopDepsList');
    if (depListEl) {
      const maxDep = topDeps.length > 0 ? topDeps[0][1] : 1;
      depListEl.innerHTML = topDeps.map(([name, sum]) => {
        const pct = ((sum / maxDep) * 100).toFixed(0);
        return `
          <div class="bar-stat-row">
            <div class="bar-stat-info">
              <span class="bar-stat-name" title="${escapeHtml(name)}">${escapeHtml(name.length > 40 ? name.substring(0, 38) + '...' : name)}</span>
              <span class="bar-stat-val">${formatCurrency(sum)}</span>
            </div>
            <div class="bar-stat-track">
              <div class="bar-stat-fill" style="width: ${pct}%; background: linear-gradient(90deg, #38bdf8, #818cf8);"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Top 8 Cargos por Ingreso Promedio
    const topCargos = Object.entries(cargoMap)
      .map(([cargo, data]) => ({ cargo, count: data.count, avg: data.sum / data.count }))
      .filter(item => item.cargo !== 'SIN ESPECIFICAR')
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 8);

    const cargoListEl = document.getElementById('reportTopCargosList');
    if (cargoListEl) {
      const maxCargo = topCargos.length > 0 ? topCargos[0].avg : 1;
      cargoListEl.innerHTML = topCargos.map(item => {
        const pct = ((item.avg / maxCargo) * 100).toFixed(0);
        return `
          <div class="bar-stat-row">
            <div class="bar-stat-info">
              <span class="bar-stat-name" title="${escapeHtml(item.cargo)}">${escapeHtml(item.cargo.length > 40 ? item.cargo.substring(0, 38) + '...' : item.cargo)} (${item.count} pers.)</span>
              <span class="bar-stat-val">${formatCurrency(item.avg)}</span>
            </div>
            <div class="bar-stat-track">
              <div class="bar-stat-fill" style="width: ${pct}%; background: linear-gradient(90deg, #f59e0b, #ec4899);"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Actualizar fecha del reporte
    const reportDateEl = document.getElementById('reportTimestamp');
    if (reportDateEl) {
      const now = new Date();
      reportDateEl.textContent = now.toLocaleDateString('es-PE', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    }
  }

  // --- EXPORTACIONES Y DESCARGAS ---
  function exportDataToCsv(records, filename) {
    if (!records || records.length === 0) {
      alert('No hay registros para exportar.');
      return;
    }

    const headers = [
      'REGIMEN_CODIGO',
      'REGIMEN_NOMBRE',
      'APELLIDO_PATERNO',
      'APELLIDO_MATERNO',
      'NOMBRES',
      'CARGO',
      'DEPENDENCIA',
      'REMUNERACIONES',
      'OTROS_BENEFICIOS',
      'TOTAL'
    ];

    const rows = records.map(r => [
      `"${r.regimenCodigo}"`,
      `"${(r.regimenNombre || '').replace(/"/g, '""')}"`,
      `"${(r.paterno || '').replace(/"/g, '""')}"`,
      `"${(r.materno || '').replace(/"/g, '""')}"`,
      `"${(r.nombres || '').replace(/"/g, '""')}"`,
      `"${(r.cargo || '').replace(/"/g, '""')}"`,
      `"${(r.dependencia || '').replace(/"/g, '""')}"`,
      (r.remuneraciones || 0).toFixed(2),
      (r.otrosBeneficios || 0).toFixed(2),
      (r.total || 0).toFixed(2)
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\r\n');
    downloadBlob(csvContent, 'text/csv;charset=utf-8;', filename);
  }

  function exportDataToJson() {
    const dataStr = JSON.stringify(state.filteredRecords, null, 2);
    downloadBlob(dataStr, 'application/json;charset=utf-8;', 'planilla_unalm.json');
  }

  function copyDataToClipboard() {
    const records = state.filteredRecords;
    if (!records || records.length === 0) {
      alert('No hay registros seleccionados.');
      return;
    }

    const headers = ['ID', 'Regimen', 'Apellidos y Nombres', 'Cargo', 'Dependencia', 'Remuneracion', 'Otros', 'Total'];
    const rows = records.map(r => [
      r.id,
      r.regimenCodigo,
      r.nombreCompleto,
      r.cargo,
      r.dependencia,
      r.remuneraciones,
      r.otrosBeneficios,
      r.total
    ].join('\t'));

    const tsv = [headers.join('\t'), ...rows].join('\n');
    navigator.clipboard.writeText(tsv).then(() => {
      alert(`¡Copiado con éxito! Se copiaron ${records.length.toLocaleString('es-PE')} registros al portapapeles en formato tabular.`);
    }).catch(err => {
      console.error(err);
      alert('No se pudo copiar automáticamente. Por favor permite los permisos del portapapeles.');
    });
  }

  function downloadBlob(content, mimeType, filename) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // --- FICHA DETALLADA DEL COLABORADOR ---
  function viewEmployeeDetail(id) {
    const item = state.records.find(r => r.id === id);
    if (!item) return;

    const initials = getInitials(item.paterno, item.materno, item.nombres);
    const regClass = getRegimeColorClass(item.regimenCodigo);
    const regShort = getRegimeShortTitle(item.regimenCodigo);
    const anualEstimado = (item.total || 0) * 12;

    const html = `
      <div class="detail-header-card">
        <div class="detail-avatar">${initials}</div>
        <div style="flex: 1;">
          <h3 class="detail-name-title">${escapeHtml(item.nombreCompleto)}</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 6px;">
            ${escapeHtml(item.cargo)}
          </p>
          <span class="badge-regime ${regClass}">
            <span class="rf-code">${item.regimenCodigo}</span> ${escapeHtml(item.regimenNombre)}
          </span>
        </div>
      </div>

      <div class="detail-salary-grid">
        <div class="detail-salary-box">
          <div class="detail-salary-label">Remuneración Básica</div>
          <div class="detail-salary-val">${formatCurrency(item.remuneraciones)}</div>
        </div>
        <div class="detail-salary-box">
          <div class="detail-salary-label">Otros Beneficios</div>
          <div class="detail-salary-val">${formatCurrency(item.otrosBeneficios)}</div>
        </div>
        <div class="detail-salary-box" style="border-color: rgba(56,189,248,0.4); background: rgba(56,189,248,0.06);">
          <div class="detail-salary-label" style="color: #7dd3fc;">Total Mensual</div>
          <div class="detail-salary-val highlight">${formatCurrency(item.total)}</div>
        </div>
      </div>

      <div class="detail-info-list">
        <div class="detail-info-row">
          <span class="detail-info-label">ID Registro:</span>
          <span class="detail-info-val">#${item.id}</span>
        </div>
        <div class="detail-info-row">
          <span class="detail-info-label">Régimen Laboral:</span>
          <span class="detail-info-val">Código ${item.regimenCodigo} (${regShort})</span>
        </div>
        <div class="detail-info-row">
          <span class="detail-info-label">Dependencia / Unidad:</span>
          <span class="detail-info-val">${escapeHtml(item.dependencia)}</span>
        </div>
        <div class="detail-info-row">
          <span class="detail-info-label">Cargo / Función:</span>
          <span class="detail-info-val">${escapeHtml(item.cargo)}</span>
        </div>
        <div class="detail-info-row">
          <span class="detail-info-label">Proyección Anual (12 m):</span>
          <span class="detail-info-val" style="color: #34d399;">${formatCurrency(anualEstimado)}</span>
        </div>
      </div>
    `;

    if (elements.detailContent) elements.detailContent.innerHTML = html;
    if (elements.detailModal) elements.detailModal.classList.add('active');
  }

  function closeDetailModal() {
    if (elements.detailModal) elements.detailModal.classList.remove('active');
  }

  // --- REGISTRAR NUEVO COLABORADOR (CRUD SIMULADO) ---
  function handleNewRecordSubmit(e) {
    e.preventDefault();
    const regCode = document.getElementById('newRegimen').value;
    const pat = document.getElementById('newPaterno').value.trim().toUpperCase();
    const mat = document.getElementById('newMaterno').value.trim().toUpperCase();
    const nom = document.getElementById('newNombres').value.trim().toUpperCase();
    const cargo = document.getElementById('newCargo').value.trim().toUpperCase() || 'SIN CARGO';
    const dep = document.getElementById('newDependencia').value.trim().toUpperCase() || 'SIN DEPENDENCIA';
    const rem = parseFloat(document.getElementById('newRemun').value) || 0;
    const otr = parseFloat(document.getElementById('newOtros').value) || 0;
    const tot = rem + otr;

    const newRec = {
      id: state.records.length + 1,
      regimenCodigo: regCode,
      regimenNombre: window.REGIME_MAP ? window.REGIME_MAP[regCode] : `Régimen ${regCode}`,
      paterno: pat,
      materno: mat,
      nombres: nom,
      nombreCompleto: `${pat} ${mat}, ${nom}`.trim(),
      cargo: cargo,
      dependencia: dep,
      remuneraciones: rem,
      otrosBeneficios: otr,
      total: tot
    };

    state.records.unshift(newRec); // agregar al inicio
    updateKpiCards(state.records);
    populateDependenciasFilter();
    applyFiltersAndRender();
    generateAdminReport();

    elements.newRecordForm.reset();
    alert(`¡Colaborador ${newRec.nombreCompleto} registrado exitosamente! La información ya se encuentra disponible en la tabla y reportes.`);
    switchAdminTab('reporte');
  }

  // --- EXPOSICIÓN GLOBAL DE FUNCIONES ---
  window.goToPage = goToPage;
  window.removeFilter = removeFilter;
  window.resetAllFilters = resetAllFilters;
  window.viewEmployeeDetail = viewEmployeeDetail;
  window.closeDetailModal = closeDetailModal;

  // Ejecutar al cargar el DOM
  document.addEventListener('DOMContentLoaded', init);
})();
