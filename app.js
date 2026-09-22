/* ==========================================================================
   GridSnap - Auto-Fit Photo Collage Maker (JavaScript Engine)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // App State Configuration (A4 Print Focused Defaults with Hairline Spacing)
  const state = {
    currentGrid: '2x4', // Default to 2x4 Passport Photo Sheet
    gap: 1,       // 1px hairline crisp spacing
    radius: 2,    // 2px minimal radius
    padding: 2,   // 2px minimal padding
    frameScale: 1.0, // Workspace preview zoom scale (1.0 = 100%)
    bgColor: '#ffffff',
    aspectRatio: '210/297', // Standard A4 Paper Aspect Ratio
    selectedSlotIndex: null,
    slots: [], // Array of slot data objects
    exportFormat: 'png',
    exportScale: 'a4' // Default to A4 300 DPI Print
  };

  // Layout Configurations (Ordered in ASCENDING Series by Photo Count)
  const GRID_CONFIGS = {
    '1x4': { cols: 4, rows: 1, count: 4, name: '1. 📸 1 × 4 Photo Strip (4 Photos)', aspect: '210/297' },
    '2x2': { cols: 2, rows: 2, count: 4, name: '2. 🖼️ 2 × 2 Quad (4 Photos)', aspect: '210/297' },
    '2x3': { cols: 2, rows: 3, count: 6, name: '3. 📄 2 × 3 Photo Sheet (6 Photos)', aspect: '210/297' },
    '2x4': { cols: 4, rows: 2, count: 8, name: '4. 📸 2 × 4 Passport Sheet (8 Photos)', aspect: '210/297' },
    '3x3': { cols: 3, rows: 3, count: 9, name: '5. ⏹️ 3 × 3 Square Grid (9 Photos)', aspect: '210/297' },
    '2x5': { cols: 5, rows: 2, count: 10, name: '6. 📸 2 × 5 Photo Sheet (10 Photos)', aspect: '210/297' },
    '3x4': { cols: 3, rows: 4, count: 12, name: '7. 📖 3 × 4 Mini Album (12 Photos)', aspect: '210/297' },
    '5x5': { cols: 5, rows: 5, count: 25, name: '8. 🧩 5 × 5 Mosaic Sheet (25 Photos)', aspect: '210/297' }
  };

  // DOM Elements
  const collageFrame = document.getElementById('collage-frame');
  const activeLayoutName = document.getElementById('active-layout-name');
  const batchUploadInput = document.getElementById('batch-upload-input');
  const slotReplaceInput = document.getElementById('slot-replace-input');
  const btnSamplePhotos = document.getElementById('btn-sample-photos');
  const btnClearAll = document.getElementById('btn-clear-all');
  const btnDuplicateHeader = document.getElementById('btn-duplicate-all-header');
  const btnQuickDownload = document.getElementById('btn-quick-download');
  
  // Sidebar Controls
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const presetCards = document.querySelectorAll('.preset-card');
  const pillAspectBtns = document.querySelectorAll('#aspect-ratio-group .pill-btn');
  
  const inputGap = document.getElementById('input-gap');
  const gapVal = document.getElementById('gap-val');
  const inputRadius = document.getElementById('input-radius');
  const radiusVal = document.getElementById('radius-val');
  const inputPadding = document.getElementById('input-padding');
  const paddingVal = document.getElementById('padding-val');

  const btnGapZero = document.getElementById('btn-gap-zero');
  const btnGapCompact = document.getElementById('btn-gap-compact');
  const btnGapStandard = document.getElementById('btn-gap-standard');
  
  const colorSwatches = document.querySelectorAll('#color-swatches .swatch');
  const gradientSwatches = document.querySelectorAll('#gradient-swatches .gradient-swatch');
  const inputBgColor = document.getElementById('input-bg-color');
  const hexColorText = document.getElementById('hex-color-text');

  // Slot Controls
  const noSlotSelected = document.getElementById('no-slot-selected');
  const slotControlsActive = document.getElementById('slot-controls-active');
  const slotNumberBadge = document.getElementById('slot-number-badge');
  const btnClearCurrentSlot = document.getElementById('btn-clear-current-slot');
  const inputSlotZoom = document.getElementById('input-slot-zoom');
  const slotZoomVal = document.getElementById('slot-zoom-val');
  const btnRotateSlot = document.getElementById('btn-rotate-slot');
  const btnFlipHSlot = document.getElementById('btn-flip-h-slot');
  const btnResetSlotTransform = document.getElementById('btn-reset-slot-transform');
  const fitModeBtns = document.querySelectorAll('#slot-fit-mode-group .pill-btn');
  const btnDuplicateToAll = document.getElementById('btn-duplicate-to-all');

  // Export Modal Elements
  const btnOpenExport = document.getElementById('btn-open-export');
  const exportModal = document.getElementById('export-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCancelExport = document.getElementById('btn-cancel-export');
  const btnDownloadNow = document.getElementById('btn-download-now');
  const exportFormatBtns = document.querySelectorAll('#export-format-group .pill-btn');
  const exportScaleBtns = document.querySelectorAll('#export-scale-group .pill-btn');
  const offscreenCanvas = document.getElementById('offscreen-canvas');

  // Initialize App
  function init() {
    setupEventListeners();
    setGridFormat(state.currentGrid);
    updateFrameStyles();
  }

  // Set active grid layout
  function setGridFormat(gridKey) {
    const config = GRID_CONFIGS[gridKey];
    if (!config) return;

    state.currentGrid = gridKey;
    state.aspectRatio = config.aspect;
    activeLayoutName.textContent = config.name;

    // Preserve existing images if switching layouts
    const oldSlots = [...state.slots];
    state.slots = [];

    for (let i = 0; i < config.count; i++) {
      if (oldSlots[i] && oldSlots[i].url) {
        state.slots.push({ ...oldSlots[i] });
      } else {
        state.slots.push(createEmptySlotData());
      }
    }

    // Cleanup extra old Object URLs
    for (let i = config.count; i < oldSlots.length; i++) {
      if (oldSlots[i] && oldSlots[i].isUserBlob && oldSlots[i].url) {
        URL.revokeObjectURL(oldSlots[i].url);
      }
    }

    // Update CSS Grid Class
    collageFrame.className = `collage-frame grid-${gridKey}`;
    
    // Update Preset Card selection UI
    presetCards.forEach(card => {
      card.classList.toggle('active', card.dataset.grid === gridKey);
    });

    // Update Aspect Ratio buttons UI
    pillAspectBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.aspect === config.aspect);
    });

    renderGridSlots();
    deselectSlot();
  }

  function createEmptySlotData() {
    return {
      img: null,
      url: null,
      isUserBlob: false,
      zoom: 1.0,
      panX: 0,
      panY: 0,
      rotation: 0,
      flipH: false,
      fitMode: 'fill' // Default to Exact Cell Fit
    };
  }

  // Render Grid Slots HTML
  function renderGridSlots() {
    collageFrame.innerHTML = '';

    state.slots.forEach((slotData, index) => {
      const slotEl = document.createElement('div');
      slotEl.className = 'slot';
      slotEl.dataset.index = index;

      if (state.selectedSlotIndex === index) {
        slotEl.classList.add('selected');
      }

      if (slotData.url) {
        // Render Loaded Image Slot
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'slot-image-wrapper';

        const imgEl = document.createElement('img');
        imgEl.src = slotData.url;
        imgEl.alt = `Slot ${index + 1}`;
        
        const mode = slotData.fitMode || 'fill';
        imgEl.className = mode === 'contain' ? 'fit-contain' : (mode === 'cover' ? 'fit-cover' : 'fit-fill');
        imgEl.style.transform = getTransformCSS(slotData);

        // Pan drag interaction on image
        setupImagePanEvents(imgEl, index);

        imgWrapper.appendChild(imgEl);
        slotEl.appendChild(imgWrapper);

        // Slot action overlay buttons
        const actionsOverlay = document.createElement('div');
        actionsOverlay.className = 'slot-actions-overlay';
        actionsOverlay.innerHTML = `
          <button class="slot-action-btn edit" title="Fine-Tune Image">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="slot-action-btn delete" title="Remove Photo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        `;

        actionsOverlay.querySelector('.edit').addEventListener('click', (e) => {
          e.stopPropagation();
          selectSlot(index);
          switchTab('tab-slot');
        });

        actionsOverlay.querySelector('.delete').addEventListener('click', (e) => {
          e.stopPropagation();
          clearSlot(index);
        });

        slotEl.appendChild(actionsOverlay);

        slotEl.draggable = true;
      } else {
        // Render Empty Slot Placeholder
        slotEl.innerHTML = `
          <div class="slot-empty-placeholder">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>+ Add Photo</span>
          </div>
        `;
      }

      // Slot Click Handler
      slotEl.addEventListener('click', () => {
        if (!slotData.url) {
          selectSlot(index);
          slotReplaceInput.click();
        } else {
          selectSlot(index);
        }
      });

      setupSlotDragAndDrop(slotEl, index);
      collageFrame.appendChild(slotEl);
    });
  }

  function getTransformCSS(slotData) {
    return `translate(${slotData.panX}px, ${slotData.panY}px) scale(${slotData.zoom}) rotate(${slotData.rotation}deg) scaleX(${slotData.flipH ? -1 : 1})`;
  }

  // Setup Image Pan Dragging inside slot
  function setupImagePanEvents(imgEl, index) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialPanX = 0;
    let initialPanY = 0;

    const onMouseDown = (e) => {
      e.stopPropagation();
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialPanX = state.slots[index].panX;
      initialPanY = state.slots[index].panY;
      selectSlot(index);

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      state.slots[index].panX = initialPanX + dx;
      state.slots[index].panY = initialPanY + dy;

      imgEl.style.transform = getTransformCSS(state.slots[index]);
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    imgEl.addEventListener('mousedown', onMouseDown);

    imgEl.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        onMouseDown({ clientX: touch.clientX, clientY: touch.clientY, stopPropagation: () => {} });
      }
    });

    imgEl.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length === 1) {
        const touch = e.touches[0];
        onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
      }
    });

    imgEl.addEventListener('touchend', onMouseUp);
  }

  // Setup Slot Drag & Drop
  function setupSlotDragAndDrop(slotEl, index) {
    slotEl.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', index.toString());
      e.dataTransfer.effectAllowed = 'move';
    });

    slotEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      slotEl.classList.add('drag-over');
    });

    slotEl.addEventListener('dragleave', () => {
      slotEl.classList.remove('drag-over');
    });

    slotEl.addEventListener('drop', (e) => {
      e.preventDefault();
      slotEl.classList.remove('drag-over');

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleBatchFiles(Array.from(e.dataTransfer.files), index, false);
        return;
      }

      const sourceIndexStr = e.dataTransfer.getData('text/plain');
      if (sourceIndexStr !== '') {
        const sourceIndex = parseInt(sourceIndexStr, 10);
        if (sourceIndex !== index && !isNaN(sourceIndex)) {
          swapSlots(sourceIndex, index);
        }
      }
    });
  }

  function swapSlots(idxA, idxB) {
    const temp = state.slots[idxA];
    state.slots[idxA] = state.slots[idxB];
    state.slots[idxB] = temp;
    renderGridSlots();
    if (state.selectedSlotIndex === idxA) selectSlot(idxB);
    else if (state.selectedSlotIndex === idxB) selectSlot(idxA);
  }

  function selectSlot(index) {
    state.selectedSlotIndex = index;
    const slotData = state.slots[index];

    const allSlots = collageFrame.querySelectorAll('.slot');
    allSlots.forEach((s, idx) => {
      s.classList.toggle('selected', idx === index);
    });

    if (slotData && slotData.url) {
      noSlotSelected.classList.add('hidden');
      slotControlsActive.classList.remove('hidden');

      slotNumberBadge.textContent = `Slot ${index + 1}`;
      inputSlotZoom.value = slotData.zoom;
      slotZoomVal.textContent = `${slotData.zoom.toFixed(2)}x`;

      fitModeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.fit === (slotData.fitMode || 'fill'));
      });
    } else {
      noSlotSelected.classList.remove('hidden');
      slotControlsActive.classList.add('hidden');
    }
  }

  function deselectSlot() {
    state.selectedSlotIndex = null;
    noSlotSelected.classList.remove('hidden');
    slotControlsActive.classList.add('hidden');

    const allSlots = collageFrame.querySelectorAll('.slot');
    allSlots.forEach(s => s.classList.remove('selected'));
  }

  function clearSlot(index) {
    if (state.slots[index]) {
      if (state.slots[index].isUserBlob && state.slots[index].url) {
        URL.revokeObjectURL(state.slots[index].url);
      }
      state.slots[index] = createEmptySlotData();
      renderGridSlots();
      deselectSlot();
    }
  }

  // Duplicate single slot photo across ALL slots (Passport Photo Mode)
  function duplicateToAllSlots(sourceIndex) {
    let sourceSlot = state.slots[sourceIndex];
    
    // If target slot is empty, find first slot with photo
    if (!sourceSlot || !sourceSlot.url) {
      const filledIdx = state.slots.findIndex(s => s.url !== null);
      if (filledIdx !== -1) {
        sourceSlot = state.slots[filledIdx];
      }
    }

    if (!sourceSlot || !sourceSlot.url) {
      // Trigger file upload if no photo exists
      state.selectedSlotIndex = 0;
      slotReplaceInput.setAttribute('data-duplicate-all', 'true');
      slotReplaceInput.click();
      return;
    }

    // Apply photo to all slots
    for (let i = 0; i < state.slots.length; i++) {
      state.slots[i] = {
        img: sourceSlot.img,
        url: sourceSlot.url,
        isUserBlob: sourceSlot.isUserBlob,
        zoom: sourceSlot.zoom,
        panX: sourceSlot.panX,
        panY: sourceSlot.panY,
        rotation: sourceSlot.rotation,
        flipH: sourceSlot.flipH,
        fitMode: sourceSlot.fitMode
      };
    }

    renderGridSlots();
  }

  // Passport Photo Mode Trigger
  function triggerPassportMode() {
    setGridFormat('2x4'); // Switch to 2x4 Passport layout
    const sourceIdx = state.selectedSlotIndex !== null ? state.selectedSlotIndex : 0;
    duplicateToAllSlots(sourceIdx);
  }

  // Batch & Single Image Upload Handler
  function handleBatchFiles(files, startSlotIdx = 0, replaceSingleSlot = false) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const isDuplicateAll = slotReplaceInput.getAttribute('data-duplicate-all') === 'true';
    slotReplaceInput.removeAttribute('data-duplicate-all');

    if (replaceSingleSlot) {
      const targetIdx = startSlotIdx;
      if (targetIdx < 0 || targetIdx >= state.slots.length) return;

      const file = imageFiles[0];
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        if (state.slots[targetIdx] && state.slots[targetIdx].isUserBlob && state.slots[targetIdx].url) {
          URL.revokeObjectURL(state.slots[targetIdx].url);
        }
        state.slots[targetIdx] = {
          img: img,
          url: url,
          isUserBlob: true,
          zoom: 1.0,
          panX: 0,
          panY: 0,
          rotation: 0,
          flipH: false,
          fitMode: 'fill'
        };

        if (isDuplicateAll) {
          duplicateToAllSlots(targetIdx);
        } else {
          renderGridSlots();
          selectSlot(targetIdx);
        }
      };
      img.src = url;
    } else {
      let targetIdx = startSlotIdx;

      imageFiles.forEach((file) => {
        while (targetIdx < state.slots.length && state.slots[targetIdx].url !== null) {
          targetIdx++;
        }
        if (targetIdx >= state.slots.length) return;

        const currentSlotIdx = targetIdx;
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          state.slots[currentSlotIdx] = {
            img: img,
            url: url,
            isUserBlob: true,
            zoom: 1.0,
            panX: 0,
            panY: 0,
            rotation: 0,
            flipH: false,
            fitMode: 'fill'
          };
          renderGridSlots();
        };
        img.src = url;

        targetIdx++;
      });
    }
  }

  // Load High-Quality Sample Images
  function loadSamplePhotos() {
    const sampleGradients = [
      { bg: 'linear-gradient(135deg, #6366f1, #a855f7)', title: 'ID Photo', emoji: '👤' },
      { bg: 'linear-gradient(135deg, #ff7e5f, #feb47b)', title: 'Golden Hour', emoji: '🌅' },
      { bg: 'linear-gradient(135deg, #00c6ff, #0072ff)', title: 'Ocean Breeze', emoji: '🌊' },
      { bg: 'linear-gradient(135deg, #11998e, #38ef7d)', title: 'Forest Trail', emoji: '🌲' },
      { bg: 'linear-gradient(135deg, #f857a6, #ff5858)', title: 'Neon Lights', emoji: '✨' },
      { bg: 'linear-gradient(135deg, #43e97b, #38f9d7)', title: 'Summer Vibe', emoji: '🌴' },
      { bg: 'linear-gradient(135deg, #fa709a, #fee140)', title: 'Peach Blossom', emoji: '🌸' },
      { bg: 'linear-gradient(135deg, #30cfd0, #330867)', title: 'Cosmic Sky', emoji: '🌌' }
    ];

    state.slots.forEach((_, idx) => {
      const sample = sampleGradients[idx % sampleGradients.length];
      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
          <defs>
            <linearGradient id="g${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${sample.bg.match(/#[a-fA-F0-9]{6}/g)[0]}"/>
              <stop offset="100%" stop-color="${sample.bg.match(/#[a-fA-F0-9]{6}/g)[1]}"/>
            </linearGradient>
          </defs>
          <rect width="600" height="600" fill="url(#g${idx})"/>
          <circle cx="300" cy="260" r="90" fill="rgba(255,255,255,0.2)"/>
          <text x="300" y="280" font-size="72" text-anchor="middle" dominant-baseline="middle">${sample.emoji}</text>
          <text x="300" y="420" font-family="sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">${sample.title}</text>
        </svg>
      `;
      const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
      const img = new Image();
      img.onload = () => {
        state.slots[idx] = {
          img: img,
          url: url,
          isUserBlob: false,
          zoom: 1.0,
          panX: 0,
          panY: 0,
          rotation: 0,
          flipH: false,
          fitMode: 'fill'
        };
        renderGridSlots();
      };
      img.src = url;
    });
  }

  // Update Frame Dynamic CSS variables
  function updateFrameStyles() {
    // Calculate dynamic frame width in pixels (380px to 1100px)
    const frameWidthPx = Math.round(380 + ((state.frameScale - 0.5) / 1.3) * (1100 - 380));
    
    collageFrame.style.setProperty('--frame-width', `${frameWidthPx}px`);
    collageFrame.style.setProperty('--grid-gap', `${state.gap}px`);
    collageFrame.style.setProperty('--border-radius', `${state.radius}px`);
    collageFrame.style.setProperty('--outer-padding', `${state.padding}px`);
    collageFrame.style.setProperty('--bg-color', state.bgColor);
    collageFrame.style.setProperty('--aspect-ratio', state.aspectRatio);

    gapVal.textContent = `${state.gap}px`;
    radiusVal.textContent = `${state.radius}px`;
    paddingVal.textContent = `${state.padding}px`;
    
    const frameScaleVal = document.getElementById('frame-scale-val');
    if (frameScaleVal) {
      frameScaleVal.textContent = `${frameWidthPx}px`;
    }

    inputGap.value = state.gap;
    inputRadius.value = state.radius;
    inputPadding.value = state.padding;
  }

  // Switch Sidebar Tabs
  function switchTab(tabId) {
    tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
    tabPanels.forEach(panel => panel.classList.toggle('active', panel.id === tabId));
  }

  // Event Listeners Setup
  function setupEventListeners() {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    presetCards.forEach(card => {
      card.addEventListener('click', () => setGridFormat(card.dataset.grid));
    });

    pillAspectBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        pillAspectBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.aspectRatio = btn.dataset.aspect;
        updateFrameStyles();
      });
    });

    // Passport Mode Buttons
    btnDuplicateHeader.addEventListener('click', triggerPassportMode);
    if (btnQuickDownload) {
      btnQuickDownload.addEventListener('click', downloadCollageImage);
    }
    
    btnDuplicateToAll.addEventListener('click', () => {
      const idx = state.selectedSlotIndex !== null ? state.selectedSlotIndex : 0;
      duplicateToAllSlots(idx);
    });

    // Quick Gap Presets
    btnGapZero.addEventListener('click', () => {
      state.gap = 0;
      state.padding = 0;
      state.radius = 0;
      updateFrameStyles();
    });

    const btnGap1px = document.getElementById('btn-gap-1px');
    if (btnGap1px) {
      btnGap1px.addEventListener('click', () => {
        state.gap = 1;
        state.padding = 2;
        state.radius = 2;
        updateFrameStyles();
      });
    }

    btnGapCompact.addEventListener('click', () => {
      state.gap = 5;
      state.padding = 8;
      state.radius = 4;
      updateFrameStyles();
    });

    btnGapStandard.addEventListener('click', () => {
      state.gap = 12;
      state.padding = 16;
      state.radius = 6;
      updateFrameStyles();
    });

    // Quick Page Outer Margin Presets
    const btnPaddingZero = document.getElementById('btn-padding-zero');
    const btnPaddingCompact = document.getElementById('btn-padding-compact');
    const btnPaddingStandard = document.getElementById('btn-padding-standard');
    const btnPaddingWide = document.getElementById('btn-padding-wide');

    if (btnPaddingZero) {
      btnPaddingZero.addEventListener('click', () => {
        state.padding = 0;
        updateFrameStyles();
      });
    }
    if (btnPaddingCompact) {
      btnPaddingCompact.addEventListener('click', () => {
        state.padding = 12;
        updateFrameStyles();
      });
    }
    if (btnPaddingStandard) {
      btnPaddingStandard.addEventListener('click', () => {
        state.padding = 24;
        updateFrameStyles();
      });
    }
    if (btnPaddingWide) {
      btnPaddingWide.addEventListener('click', () => {
        state.padding = 40;
        updateFrameStyles();
      });
    }

    // Sliders
    const inputFrameScale = document.getElementById('input-frame-scale');
    if (inputFrameScale) {
      inputFrameScale.addEventListener('input', (e) => {
        state.frameScale = parseInt(e.target.value, 10) / 100;
        updateFrameStyles();
      });
    }

    inputGap.addEventListener('input', (e) => {
      state.gap = parseInt(e.target.value, 10);
      updateFrameStyles();
    });

    inputRadius.addEventListener('input', (e) => {
      state.radius = parseInt(e.target.value, 10);
      updateFrameStyles();
    });

    inputPadding.addEventListener('input', (e) => {
      state.padding = parseInt(e.target.value, 10);
      updateFrameStyles();
    });

    colorSwatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        colorSwatches.forEach(s => s.classList.remove('active'));
        gradientSwatches.forEach(g => g.classList.remove('active'));
        swatch.classList.add('active');

        state.bgColor = swatch.dataset.color;
        inputBgColor.value = swatch.dataset.color === 'transparent' ? '#ffffff' : swatch.dataset.color;
        hexColorText.textContent = swatch.dataset.color;
        updateFrameStyles();
      });
    });

    gradientSwatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        colorSwatches.forEach(s => s.classList.remove('active'));
        gradientSwatches.forEach(g => g.classList.remove('active'));
        swatch.classList.add('active');

        state.bgColor = swatch.dataset.gradient;
        updateFrameStyles();
      });
    });

    inputBgColor.addEventListener('input', (e) => {
      state.bgColor = e.target.value;
      hexColorText.textContent = e.target.value;
      colorSwatches.forEach(s => s.classList.remove('active'));
      gradientSwatches.forEach(g => g.classList.remove('active'));
      updateFrameStyles();
    });

    batchUploadInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleBatchFiles(Array.from(e.target.files), 0, false);
        e.target.value = '';
      }
    });

    slotReplaceInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0 && state.selectedSlotIndex !== null) {
        handleBatchFiles(Array.from(e.target.files), state.selectedSlotIndex, true);
        e.target.value = '';
      }
    });

    fitModeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.selectedSlotIndex !== null && state.slots[state.selectedSlotIndex]) {
          fitModeBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.slots[state.selectedSlotIndex].fitMode = btn.dataset.fit;
          renderGridSlots();
        }
      });
    });

    btnSamplePhotos.addEventListener('click', loadSamplePhotos);

    btnClearAll.addEventListener('click', () => {
      if (confirm('Clear all images from the collage frame?')) {
        state.slots.forEach((_, idx) => clearSlot(idx));
      }
    });

    inputSlotZoom.addEventListener('input', (e) => {
      if (state.selectedSlotIndex !== null && state.slots[state.selectedSlotIndex]) {
        const z = parseFloat(e.target.value);
        state.slots[state.selectedSlotIndex].zoom = z;
        slotZoomVal.textContent = `${z.toFixed(2)}x`;
        renderGridSlots();
      }
    });

    btnRotateSlot.addEventListener('click', () => {
      if (state.selectedSlotIndex !== null && state.slots[state.selectedSlotIndex]) {
        state.slots[state.selectedSlotIndex].rotation = (state.slots[state.selectedSlotIndex].rotation + 90) % 360;
        renderGridSlots();
      }
    });

    btnFlipHSlot.addEventListener('click', () => {
      if (state.selectedSlotIndex !== null && state.slots[state.selectedSlotIndex]) {
        state.slots[state.selectedSlotIndex].flipH = !state.slots[state.selectedSlotIndex].flipH;
        renderGridSlots();
      }
    });

    btnResetSlotTransform.addEventListener('click', () => {
      if (state.selectedSlotIndex !== null && state.slots[state.selectedSlotIndex]) {
        state.slots[state.selectedSlotIndex].zoom = 1.0;
        state.slots[state.selectedSlotIndex].panX = 0;
        state.slots[state.selectedSlotIndex].panY = 0;
        state.slots[state.selectedSlotIndex].rotation = 0;
        state.slots[state.selectedSlotIndex].flipH = false;
        state.slots[state.selectedSlotIndex].fitMode = 'fill';
        selectSlot(state.selectedSlotIndex);
        renderGridSlots();
      }
    });

    btnClearCurrentSlot.addEventListener('click', () => {
      if (state.selectedSlotIndex !== null) {
        clearSlot(state.selectedSlotIndex);
      }
    });

    btnOpenExport.addEventListener('click', () => {
      exportModal.classList.remove('hidden');
      renderExportCanvasPreview();
    });

    btnCloseModal.addEventListener('click', () => exportModal.classList.add('hidden'));
    btnCancelExport.addEventListener('click', () => exportModal.classList.add('hidden'));

    exportFormatBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        exportFormatBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.exportFormat = btn.dataset.format;
      });
    });

    exportScaleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        exportScaleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.exportScale = btn.dataset.scale;
        renderExportCanvasPreview();
      });
    });

    btnDownloadNow.addEventListener('click', downloadCollageImage);
  }

  // HTML5 Canvas Export Engine (with A4 300 DPI support)
  function renderExportCanvasPreview(callback) {
    const config = GRID_CONFIGS[state.currentGrid];
    
    let canvasWidth, canvasHeight;
    const [aspectW, aspectH] = state.aspectRatio.split('/').map(Number);

    if (state.exportScale === 'a4') {
      if (aspectW < aspectH) {
        canvasWidth = 2480;
        canvasHeight = 3508;
      } else {
        canvasWidth = 3508;
        canvasHeight = 2480;
      }
    } else {
      const scaleMultiplier = parseInt(state.exportScale, 10) || 2;
      const baseResolution = 1080;
      canvasWidth = baseResolution * scaleMultiplier;
      canvasHeight = (baseResolution * (aspectH / aspectW)) * scaleMultiplier;
    }

    offscreenCanvas.width = canvasWidth;
    offscreenCanvas.height = canvasHeight;

    const ctx = offscreenCanvas.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (state.bgColor === 'transparent') {
      // Clear canvas
    } else if (state.bgColor.startsWith('linear-gradient')) {
      const grad = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
      grad.addColorStop(0, '#6366f1');
      grad.addColorStop(1, '#a855f7');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else {
      ctx.fillStyle = state.bgColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    const frameRect = collageFrame.getBoundingClientRect();
    const scaleFactor = canvasWidth / frameRect.width;

    const gap = state.gap * scaleFactor;
    const padding = state.padding * scaleFactor;
    const radius = state.radius * scaleFactor;

    const availableW = canvasWidth - (padding * 2) - (gap * (config.cols - 1));
    const availableH = canvasHeight - (padding * 2) - (gap * (config.rows - 1));

    const cellW = availableW / config.cols;
    const cellH = availableH / config.rows;

    let loadedCount = 0;
    const totalSlots = state.slots.length;

    state.slots.forEach((slotData, idx) => {
      const col = idx % config.cols;
      const row = Math.floor(idx / config.cols);

      const cellX = padding + col * (cellW + gap);
      const cellY = padding + row * (cellH + gap);

      ctx.save();
      drawRoundedRect(ctx, cellX, cellY, cellW, cellH, radius);
      ctx.clip();

      if (slotData.url) {
        const drawImageOnCanvas = (imageObj) => {
          ctx.save();
          ctx.translate(cellX + cellW / 2, cellY + cellH / 2);

          const panX = slotData.panX * scaleFactor;
          const panY = slotData.panY * scaleFactor;
          ctx.translate(panX, panY);

          ctx.rotate((slotData.rotation * Math.PI) / 180);
          ctx.scale(slotData.flipH ? -1 : 1, 1);
          ctx.scale(slotData.zoom, slotData.zoom);

          const imgAspect = imageObj.naturalWidth / imageObj.naturalHeight;
          const cellAspect = cellW / cellH;

          let renderW, renderH;
          const fitMode = slotData.fitMode || 'fill';

          if (fitMode === 'contain') {
            if (imgAspect > cellAspect) {
              renderW = cellW;
              renderH = cellW / imgAspect;
            } else {
              renderH = cellH;
              renderW = cellH * imgAspect;
            }
          } else if (fitMode === 'cover') {
            if (imgAspect > cellAspect) {
              renderH = cellH;
              renderW = cellH * imgAspect;
            } else {
              renderW = cellW;
              renderH = cellW / imgAspect;
            }
          } else { // 'fill' (Exact Cell Fit)
            renderW = cellW;
            renderH = cellH;
          }

          ctx.drawImage(imageObj, -renderW / 2, -renderH / 2, renderW, renderH);
          ctx.restore();

          loadedCount++;
          if (loadedCount === totalSlots && callback) callback();
        };

        if (slotData.img && slotData.img.complete) {
          drawImageOnCanvas(slotData.img);
        } else {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => drawImageOnCanvas(img);
          img.src = slotData.url;
        }
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cellX, cellY, cellW, cellH);
        loadedCount++;
        if (loadedCount === totalSlots && callback) callback();
      }

      ctx.restore();
    });
  }

  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function downloadCollageImage() {
    renderExportCanvasPreview(() => {
      const mimeType = state.exportFormat === 'jpeg' ? 'image/jpeg' : (state.exportFormat === 'webp' ? 'image/webp' : 'image/png');
      const filename = `gridsnap-print-${state.currentGrid}-${Date.now()}.${state.exportFormat}`;

      offscreenCanvas.toBlob((blob) => {
        const link = document.createElement('a');
        link.download = filename;
        link.href = URL.createObjectURL(blob);
        link.click();

        setTimeout(() => URL.revokeObjectURL(link.href), 2000);
        exportModal.classList.add('hidden');
      }, mimeType, 0.98);
    });
  }

  init();
});
