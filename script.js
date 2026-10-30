document.addEventListener('DOMContentLoaded', () => {

  // Global State Management
  const state = {
    selectedFrame: { slots: 4, theme: 'classic' },
    timerEnabled: false,
    photos: [], // Array of dataURLs
    bgColor: '#FFFFFF',
    footerInscription: 'Best Memory',
    showDate: true,
    stickers: []
  };

  // Frames Master Data
  const framesData = [
    { id: '3-classic', slots: 3, theme: 'classic', title: '3 photos classic' },
    { id: '3-dark', slots: 3, theme: 'dark', title: '3 photos dark fantasy' },
    { id: '3-cute', slots: 3, theme: 'cute', title: '3 photos cute' },
    { id: '4-classic', slots: 4, theme: 'classic', title: '4 photos classic' },
    { id: '4-dark', slots: 4, theme: 'dark', title: '4 photos dark fantasy' }
  ];

  // Router / Navigation helper
  function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (target) {
      target.classList.add('active');
      window.scrollTo(0, 0);
    }
  }

  // --- PAGE 1: HOME & RIPPLE ANIMATION (Req #1, #2) ---
  const btnBegin = document.getElementById('btn-begin');
  if (btnBegin) {
    btnBegin.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('span');
      ripple.classList.add('ripple-effect');
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      this.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
        navigateTo('page-2');
      }, 500);
    });
  }

  // Smooth Navigation for About Us and Services
  document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId.startsWith('#')) {
        e.preventDefault();
        navigateTo('page-1');
        const element = document.querySelector(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });


  // --- PAGE 2: CHOOSE FRAME (Req #7, #8, #9, #10) ---
  const carousel = document.getElementById('frame-carousel');
  const btnAll = document.getElementById('btn-all');
  const btnFilter = document.getElementById('btn-filter');
  const filterSubPanel = document.getElementById('filter-sub-panel');

  function renderFrames(slotsFilter = 'all', themeFilter = 'all') {
    carousel.innerHTML = '';
    const filtered = framesData.filter(item => {
      const matchSlots = (slotsFilter === 'all') || (item.slots.toString() === slotsFilter);
      const matchTheme = (themeFilter === 'all') || (item.theme === themeFilter);
      return matchSlots && matchTheme;
    });

    filtered.forEach(frame => {
      const card = document.createElement('div');
      card.className = `frame-card ${state.selectedFrame.slots === frame.slots && state.selectedFrame.theme === frame.theme ? 'selected' : ''}`;
      
      let placeholders = '';
      for (let i = 0; i < frame.slots; i++) {
        placeholders += `<div class="slot-placeholder"></div>`;
      }

      card.innerHTML = `
        <div class="frame-preview-box theme-${frame.theme}">
          ${placeholders}
        </div>
        <p style="font-size:0.8rem; font-weight:bold;">${frame.title}</p>
      `;

      card.addEventListener('click', () => {
        document.querySelectorAll('.frame-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        state.selectedFrame = { slots: frame.slots, theme: frame.theme };
      });

      carousel.appendChild(card);
    });
  }

  renderFrames();

  // Scroll buttons (Req #7)
  document.getElementById('btn-scroll-up').addEventListener('click', () => {
    carousel.scrollBy({ left: -160, behavior: 'smooth' });
  });
  document.getElementById('btn-scroll-down').addEventListener('click', () => {
    carousel.scrollBy({ left: 160, behavior: 'smooth' });
  });

  // Filter Pink Transitions (Req #8, #9)
  btnAll.addEventListener('click', () => {
    btnAll.classList.add('pink-active');
    btnFilter.classList.remove('pink-active');
    filterSubPanel.classList.add('hidden');
    renderFrames('all', 'all');
    setTimeout(() => btnAll.classList.remove('pink-active'), 400);
  });

  btnFilter.addEventListener('click', () => {
    btnFilter.classList.add('pink-active');
    btnAll.classList.remove('pink-active');
    filterSubPanel.classList.toggle('hidden');
  });

  // Sub filter button actions
  document.querySelectorAll('.sub-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const parent = e.target.closest('.filter-group');
      parent.querySelectorAll('.sub-filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');

      const activeSlots = document.querySelector('.sub-filter-btn[data-slots].active')?.dataset.slots || 'all';
      const activeTheme = document.querySelector('.sub-filter-btn[data-theme].active')?.dataset.theme || 'all';
      renderFrames(activeSlots, activeTheme);
    });
  });

  // Continue Buttons logic
  document.getElementById('btn-p2-continue').addEventListener('click', () => {
    setupPage3Slots();
    startWebcam();
    navigateTo('page-3');
  });


  // --- PAGE 3: CAMERA & SLOTS (Req #3, #4, #5, #6, #11) ---
  const webcamVideo = document.getElementById('webcam-preview');
  const timerBtn = document.getElementById('btn-timer-toggle');
  const countdownOverlay = document.getElementById('countdown-overlay');

  async function startWebcam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      webcamVideo.srcObject = stream;
    } catch (err) {
      console.warn("Webcam tidak dapat diakses, menggunakan placeholder visual.");
    }
  }

  // Timer button pink transition (Req #3)
  timerBtn.addEventListener('click', () => {
    state.timerEnabled = !state.timerEnabled;
    timerBtn.classList.toggle('active', state.timerEnabled);
    timerBtn.textContent = `Timer (3s): ${state.timerEnabled ? 'ON' : 'OFF'}`;
  });

  function renderSlotsList() {
    const listContainer = document.getElementById('photo-slots-list');
    listContainer.innerHTML = '';
    const totalSlots = state.selectedFrame.slots;

    document.getElementById('slot-counter').textContent = `${state.photos.length}/${totalSlots} Terisi`;

    for (let i = 0; i < totalSlots; i++) {
      const photoSrc = state.photos[i] || '';
      const slotItem = document.createElement('div');
      slotItem.className = 'slot-item';
      slotItem.draggable = true;
      slotItem.dataset.index = i;

      slotItem.innerHTML = `
        <img src="${photoSrc || 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'50\' height=\'40\'><rect width=\'50\' height=\'40\' fill=\'%23DDD\'/></svg>'}" class="slot-thumb">
        <span class="slot-name">${photoSrc ? `photo_${i+1}.png` : '(Slot Kosong)'}</span>
        <div class="slot-actions">
          <label for="file-input-${i}" style="cursor:pointer;"><i class="fa-solid fa-upload"></i></label>
          <input type="file" id="file-input-${i}" accept="image/*" class="hidden" data-index="${i}">
          <i class="fa-solid fa-trash btn-delete-slot" data-index="${i}" style="cursor:pointer; color:#FF6B6B;"></i>
          <i class="fa-solid fa-ellipsis-vertical drag-handle"></i>
        </div>
      `;

      listContainer.appendChild(slotItem);
    }

    attachSlotEvents();
  }

  function setupPage3Slots() {
    state.photos = [];
    renderSlotsList();
  }

  // Capture Single Photo
  async function capturePhoto() {
    if (state.photos.length >= state.selectedFrame.slots) {
      alert("Semua slot foto sudah terisi!");
      return;
    }

    if (state.timerEnabled) {
      countdownOverlay.classList.remove('hidden');
      for (let c = 3; c > 0; c--) {
        countdownOverlay.textContent = c;
        await new Promise(r => setTimeout(r, 1000));
      }
      countdownOverlay.classList.add('hidden');
    }

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    if (webcamVideo.srcObject) {
      ctx.drawImage(webcamVideo, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#" + Math.floor(Math.random()*16777215).toString(16);
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#FFF";
      ctx.font = "20px sans-serif";
      ctx.fillText(`Sample Photo ${state.photos.length + 1}`, 100, 150);
    }

    state.photos.push(canvas.toDataURL('image/png'));
    renderSlotsList();
  }

  document.getElementById('btn-shutter').addEventListener('click', capturePhoto);

  // Photo Burst (Req #4)
  document.getElementById('btn-photo-burst').addEventListener('click', async () => {
    state.photos = [];
    for (let i = 0; i < state.selectedFrame.slots; i++) {
      await capturePhoto();
      await new Promise(r => setTimeout(r, 400));
    }
  });

  // Drag and drop sorting inside slots list (Req #11)
  function attachSlotEvents() {
    // Single Upload
    document.querySelectorAll('.slots-list input[type="file"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.index);
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            state.photos[idx] = evt.target.result;
            renderSlotsList();
          };
          reader.readAsDataURL(file);
        }
      });
    });

    // Delete single photo
    document.querySelectorAll('.btn-delete-slot').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        state.photos.splice(idx, 1);
        renderSlotsList();
      });
    });

    // Reorder Drag & Drop Vertical
    const slotItems = document.querySelectorAll('.slot-item');
    let draggedIdx = null;

    slotItems.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedIdx = parseInt(item.dataset.index);
        item.classList.add('dragging');
      });

      item.addEventListener('dragover', (e) => e.preventDefault());

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetIdx = parseInt(item.dataset.index);
        if (draggedIdx !== null && draggedIdx !== targetIdx) {
          const temp = state.photos[draggedIdx];
          state.photos[draggedIdx] = state.photos[targetIdx];
          state.photos[targetIdx] = temp;
          renderSlotsList();
        }
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
      });
    });
  }

  document.getElementById('btn-reset-all').addEventListener('click', () => {
    state.photos = [];
    renderSlotsList();
  });

  // Upload All Photos
  document.getElementById('upload-all-input').addEventListener('change', (e) => {
    const files = Array.from(e.target.files).slice(0, state.selectedFrame.slots);
    state.photos = [];
    let loaded = 0;
    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        state.photos[index] = evt.target.result;
        loaded++;
        if (loaded === files.length) renderSlotsList();
      };
      reader.readAsDataURL(file);
    });
  });

  document.getElementById('btn-p3-continue').addEventListener('click', () => {
    renderPhotostripDecoration();
    navigateTo('page-4');
  });


  // --- PAGE 4: DECORATE & STICKERS (Req #12, #13, #14, #15) ---
  const frameEl = document.getElementById('photostrip-frame');
  const brushOverlay = document.getElementById('brush-overlay');

  function renderPhotostripDecoration() {
    const container = document.getElementById('strip-photos-container');
    container.innerHTML = '';

    for (let i = 0; i < state.selectedFrame.slots; i++) {
      const img = document.createElement('img');
      img.className = 'strip-photo-item';
      img.src = state.photos[i] || 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'180\' height=\'110\'><rect width=\'180\' height=\'110\' fill=\'%23EEEEEE\'/></svg>';
      container.appendChild(img);
    }

    updateInscriptionAndDate();
  }

  // Color selection & Brush animation (Req #12)
  document.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
      document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
      e.target.classList.add('active');

      const color = e.target.dataset.color;
      state.bgColor = color;
      frameEl.style.backgroundColor = color;

      // Add lapis border & trigger brush down animation
      frameEl.classList.add('border-lapis');
      brushOverlay.classList.remove('animate-brush');
      void brushOverlay.offsetWidth; // Trigger reflow
      brushOverlay.classList.add('animate-brush');
    });
  });

  // Footer Inscription (Req #14)
  const inputInscription = document.getElementById('footer-text-input');
  inputInscription.addEventListener('input', (e) => {
    state.footerInscription = e.target.value.substring(0, 15);
    updateInscriptionAndDate();
  });

  // Show Today Date Checkbox (Req #15)
  const chkDate = document.getElementById('chk-show-date');
  chkDate.addEventListener('change', (e) => {
    state.showDate = e.target.checked;
    updateInscriptionAndDate();
  });

  function updateInscriptionAndDate() {
    document.getElementById('strip-inscription').textContent = state.footerInscription;
    const dateEl = document.getElementById('strip-date');
    if (state.showDate) {
      const today = new Date();
      const formatted = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      dateEl.textContent = formatted;
      dateEl.style.display = 'block';
    } else {
      dateEl.style.display = 'none';
    }
  }

  // Drag & Drop, Scale, and Rotate Stickers (Req #13)
  const stickerPicker = document.getElementById('sticker-picker');
  stickerPicker.addEventListener('click', (e) => {
    if (e.target.tagName === 'SPAN') {
      createInteractiveSticker(e.target.textContent);
    }
  });

  function createInteractiveSticker(char) {
    const sticker = document.createElement('div');
    sticker.className = 'placed-sticker';
    sticker.textContent = char;

    // Initial position inside frame bounds
    let posX = 50, posY = 50, scale = 1, rotation = 0;
    sticker.style.left = `${posX}px`;
    sticker.style.top = `${posY}px`;

    frameEl.appendChild(sticker);

    // Drag, Pinch Scale & Rotate handlers within photostrip bounds
    let isDragging = false;
    let startX, startY;

    sticker.addEventListener('pointerdown', (e) => {
      isDragging = true;
      startX = e.clientX - posX;
      startY = e.clientY - posY;
      sticker.setPointerCapture(e.pointerId);
      document.querySelectorAll('.placed-sticker').forEach(s => s.classList.remove('selected'));
      sticker.classList.add('selected');
    });

    sticker.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      let newX = e.clientX - startX;
      let newY = e.clientY - startY;

      // Keep inside frame container
      const maxW = frameEl.clientWidth - 30;
      const maxH = frameEl.clientHeight - 30;
      posX = Math.max(0, Math.min(newX, maxW));
      posY = Math.max(0, Math.min(newY, maxH));

      sticker.style.left = `${posX}px`;
      sticker.style.top = `${posY}px`;
    });

    sticker.addEventListener('pointerup', (e) => {
      isDragging = false;
    });

    // Scroll wheel for rotation and scale
    sticker.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.shiftKey) {
        // Rotate up to 360 degrees
        rotation = (rotation + (e.deltaY > 0 ? 15 : -15)) % 360;
      } else {
        // Scale
        scale += e.deltaY > 0 ? -0.1 : 0.1;
        scale = Math.max(0.5, Math.min(scale, 2.5));
      }
      sticker.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
    });

    // Double click to remove sticker
    sticker.addEventListener('dblclick', () => sticker.remove());
  }

  document.getElementById('btn-p4-complete').addEventListener('click', () => {
    generateFinalExportPreview();
    navigateTo('page-5');
  });


  // --- PAGE 5: COMPLETE & DOWNLOAD (Req #16) ---
  function generateFinalExportPreview() {
    const stage = document.getElementById('final-preview-stage');
    stage.innerHTML = '';
    const clone = frameEl.cloneNode(true);
    clone.style.transform = 'scale(1)';
    stage.appendChild(clone);
  }

  // Download .PNG using HTML5 Canvas rendering
  document.getElementById('btn-download-png').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'everstrip-photostrip.png';

    // Simple canvas drawing simulation of photostrip export
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = state.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#333";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(state.footerInscription, canvas.width / 2, canvas.height - 40);

    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  // Share Copy Link .png (Req #16)
  document.getElementById('btn-share-link').addEventListener('click', () => {
    const dummyLink = window.location.origin + '/share/everstrip-' + Date.now() + '.png';
    navigator.clipboard.writeText(dummyLink).then(() => {
      alert(`Link gambar berhasil disalin ke clipboard!\n${dummyLink}`);
    });
  });

  // Begin Anew: Restart from Page 2 (Req #16)
  document.getElementById('btn-begin-anew').addEventListener('click', () => {
    state.photos = [];
    state.stickers = [];
    renderSlotsList();
    navigateTo('page-2');
  });

});