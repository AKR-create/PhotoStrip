/* ================= STATE ================= */
const state = {
  source: 'webcam',      // 'webcam' | 'upload'
  stream: null,
  filter: 'f-normal',
  slots: [null, null, null], // dataURLs
  emojis: [],            // {id, char, x, y, scale, rotation}
  selectedEmoji: null,
};

/* ================= ELEMENTS ================= */
const video = document.getElementById('video');
const previewImg = document.getElementById('previewImg');
const placeholder = document.getElementById('placeholder');
const cameraFrame = document.getElementById('cameraFrame');
const photostrip = document.getElementById('photostrip');
const countdownEl = document.getElementById('countdown');
const flashEl = document.getElementById('flash');
const toast = document.getElementById('toast');
const contactForm = document.getElementById('contactForm');

/* ================= TOAST ================= */
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

/* ================= EMOJI PALETTE ================= */
const EMOJI_LIST = ['😀','😍','😎','🥳','🤩','😜','🥰','😇','🦄','🌈','⭐','💖','🌸','🍕','🍩','🎀','🐻','🐱','🦋','✨','🔥','💫','🎉','👑'];
const emojiGrid = document.getElementById('emojiGrid');
EMOJI_LIST.forEach(e => {
  const b = document.createElement('button');
  b.className = 'emoji-btn';
  b.textContent = e;
  b.title = 'Tambah ' + e;
  b.onclick = () => addEmoji(e);
  emojiGrid.appendChild(b);
});

/* ================= SOURCE: WEBCAM ================= */
document.getElementById('btnWebcam').onclick = async () => {
  if (state.source === 'webcam' && state.stream) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 640, height: 480 },
      audio: false
    });
    state.stream = stream;
    video.srcObject = stream;
    video.style.display = 'block';
    previewImg.style.display = 'none';
    placeholder.style.display = 'none';
    state.source = 'webcam';
    setActiveSource('btnWebcam');
    showToast('Kamera aktif! Siap foto 📸');
  } catch (err) {
    showToast('Tidak bisa akses kamera: ' + err.message);
  }
};

/* ================= SOURCE: UPLOAD ================= */
document.getElementById('btnUpload').onclick = () => {
  document.getElementById('fileInput').click();
};

document.getElementById('fileInput').onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    previewImg.src = ev.target.result;
    previewImg.style.display = 'block';
    video.style.display = 'none';
    placeholder.style.display = 'none';
    state.source = 'upload';
    setActiveSource('btnUpload');
    showToast('Foto berhasil di-upload ✅');
  };
  reader.readAsDataURL(file);
  e.target.value = '';
};

function setActiveSource(id) {
  document.querySelectorAll('.src-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ================= FILTERS ================= */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.filter = btn.dataset.filter;
    applyFilterToPreview();
    applyFilterToSlots();
  };
});

function applyFilterToPreview() {
  const el = state.source === 'webcam' ? video : previewImg;
  el.className = state.filter;
}

function applyFilterToSlots() {
  document.querySelectorAll('.strip-slot img').forEach(img => {
    img.className = state.filter;
  });
}

/* ================= CAPTURE ================= */
document.getElementById('btnShoot').onclick = async () => {
  if (state.source === 'webcam') {
    if (!state.stream) { showToast('Aktifkan webcam dulu ya!'); return; }
    await runCountdown();
    const dataUrl = captureFromVideo();
    fillNextSlot(dataUrl);
  } else if (state.source === 'upload') {
    if (!previewImg.src || previewImg.style.display === 'none') {
      showToast('Upload foto dulu ya!');
      return;
    }
    await runCountdown();
    const dataUrl = await captureFromImage(previewImg);
    fillNextSlot(dataUrl);
  }
};

function runCountdown() {
  return new Promise(resolve => {
    let n = 3;
    countdownEl.textContent = n;
    countdownEl.classList.add('active');
    const iv = setInterval(() => {
      n--;
      if (n > 0) {
        countdownEl.textContent = n;
      } else {
        clearInterval(iv);
        countdownEl.classList.remove('active');
        flashEl.classList.remove('active');
        void flashEl.offsetWidth;
        flashEl.classList.add('active');
        setTimeout(resolve, 300);
      }
    }, 800);
  });
}

function captureFromVideo() {
  const w = 640, h = 480;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, w, h);
  return c.toDataURL('image/png');
}

function captureFromImage(imgEl) {
  return new Promise(resolve => {
    const w = 640, h = 480;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const ir = imgEl.naturalWidth / imgEl.naturalHeight;
    const tr = w / h;
    let sx, sy, sw, sh;
    if (ir > tr) {
      sh = imgEl.naturalHeight;
      sw = sh * tr;
      sx = (imgEl.naturalWidth - sw) / 2;
      sy = 0;
    } else {
      sw = imgEl.naturalWidth;
      sh = sw / tr;
      sx = 0;
      sy = (imgEl.naturalHeight - sh) / 2;
    }
    ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, w, h);
    resolve(c.toDataURL('image/png'));
  });
}

function fillNextSlot(dataUrl) {
  const emptyIdx = state.slots.findIndex(s => s === null);
  if (emptyIdx === -1) {
    state.slots.shift();
    state.slots.push(dataUrl);
    showToast('Strip penuh — foto lama digeser 📸');
  } else {
    state.slots[emptyIdx] = dataUrl;
  }
  renderStrip();
}

/* ================= STRIP RENDER ================= */
function renderStrip() {
  document.querySelectorAll('.strip-slot').forEach((slotEl, i) => {
    const old = slotEl.querySelector('img');
    if (old) old.remove();
    if (state.slots[i]) {
      const img = document.createElement('img');
      img.src = state.slots[i];
      img.className = state.filter;
      slotEl.appendChild(img);
    }
  });
  renderEmojis();
}

/* ================= EMOJI DRAG/DROP ================= */
function addEmoji(char) {
  const id = 'e' + Date.now() + Math.random().toString(36).slice(2, 6);
  const stripRect = photostrip.getBoundingClientRect();
  const emoji = {
    id, char,
    x: stripRect.width / 2 - 20,
    y: stripRect.height / 2 - 20,
    scale: 1.6,
    rotation: 0,
  };
  state.emojis.push(emoji);
  renderEmojis();
  showToast('Emoji ditambahkan — drag untuk geser ✨');
}

function renderEmojis() {
  photostrip.querySelectorAll('.emoji-overlay').forEach(el => el.remove());

  state.emojis.forEach(em => {
    const el = document.createElement('div');
    el.className = 'emoji-overlay';
    el.dataset.id = em.id;
    if (state.selectedEmoji === em.id) el.classList.add('selected');
    el.textContent = em.char;
    el.style.left = em.x + 'px';
    el.style.top = em.y + 'px';
    el.style.fontSize = (24 * em.scale) + 'px';
    el.style.transform = `rotate(${em.rotation}deg)`;
    el.style.lineHeight = '1';

    const ctrl = document.createElement('div');
    ctrl.className = 'emoji-controls';
    const btnPlus = document.createElement('button'); btnPlus.textContent = '➕'; btnPlus.title = 'Perbesar';
    const btnMinus = document.createElement('button'); btnMinus.textContent = '➖'; btnMinus.title = 'Perkecil';
    const btnRot = document.createElement('button'); btnRot.textContent = '🔄'; btnRot.title = 'Rotate 45°';
    const btnDel = document.createElement('button'); btnDel.textContent = '✕'; btnDel.title = 'Hapus';
    [btnPlus, btnMinus, btnRot, btnDel].forEach(b => ctrl.appendChild(b));
    el.appendChild(ctrl);

    btnPlus.onclick = (e) => { e.stopPropagation(); em.scale = Math.min(em.scale + 0.3, 6); renderEmojis(); selectEmoji(em.id); };
    btnMinus.onclick = (e) => { e.stopPropagation(); em.scale = Math.max(em.scale - 0.3, 0.4); renderEmojis(); selectEmoji(em.id); };
    btnRot.onclick = (e) => { e.stopPropagation(); em.rotation = (em.rotation + 45) % 360; renderEmojis(); selectEmoji(em.id); };
    btnDel.onclick = (e) => { e.stopPropagation(); state.emojis = state.emojis.filter(x => x.id !== em.id); state.selectedEmoji = null; renderEmojis(); };

    el.addEventListener('mousedown', (e) => {
      if (e.target.closest('.emoji-controls')) return;
      selectEmoji(em.id);
    });
    el.addEventListener('touchstart', (e) => {
      if (e.target.closest('.emoji-controls')) return;
      selectEmoji(em.id);
    }, { passive: true });

    makeDraggable(el, em);
    photostrip.appendChild(el);
  });
}

function selectEmoji(id) {
  state.selectedEmoji = id;
  document.querySelectorAll('.emoji-overlay').forEach(el => {
    el.classList.toggle('selected', el.dataset.id === id);
  });
}

function makeDraggable(el, em) {
  let dragging = false;
  let startX, startY, origX, origY;

  const onDown = (e) => {
    if (e.target.closest('.emoji-controls')) return;
    const pt = e.touches ? e.touches[0] : e;
    dragging = true;
    el.classList.add('dragging');
    selectEmoji(em.id);
    startX = pt.clientX;
    startY = pt.clientY;
    origX = em.x;
    origY = em.y;
    e.preventDefault();
  };
  const onMove = (e) => {
    if (!dragging) return;
    const pt = e.touches ? e.touches[0] : e;
    let nx = origX + (pt.clientX - startX);
    let ny = origY + (pt.clientY - startY);
    const maxX = photostrip.clientWidth - el.offsetWidth;
    const maxY = photostrip.clientHeight - el.offsetHeight;
    nx = Math.max(0, Math.min(nx, maxX));
    ny = Math.max(0, Math.min(ny, maxY));
    em.x = nx; em.y = ny;
    el.style.left = nx + 'px';
    el.style.top = ny + 'px';
  };
  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove('dragging');
  };

  el.addEventListener('mousedown', onDown);
  el.addEventListener('touchstart', onDown, { passive: false });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);
}

/* ================= DOWNLOAD ================= */
document.getElementById('btnDownload').onclick = async () => {
  const hasPhoto = state.slots.some(s => s !== null);
  if (!hasPhoto) { showToast('Belum ada foto di strip. Ambil foto dulu ya!'); return; }

  const scale = 2;
  const stripW = 260 * scale;
  const padding = 18 * scale;
  const gap = 12 * scale;
  const slotW = (260 - 36) * scale;
  const slotH = slotW * 3 / 4;
  const footerH = 60 * scale;
  const stripH = padding + 3 * slotH + 2 * gap + padding + footerH;

  const canvas = document.createElement('canvas');
  canvas.width = stripW;
  canvas.height = stripH;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, stripW, stripH);

  for (let i = 0; i < 3; i++) {
    const x = padding;
    const y = padding + i * (slotH + gap);
    ctx.fillStyle = '#EAE0D5';
    ctx.fillRect(x, y, slotW, slotH);
    if (state.slots[i]) {
      const img = await loadImage(state.slots[i]);
      ctx.save();
      const filterCSS = getFilterCSS(state.filter);
      if (filterCSS) ctx.filter = filterCSS;
      drawCover(ctx, img, x, y, slotW, slotH);
      ctx.restore();
    }
  }

  const labelX = stripW / 2;
  const labelY = stripH - 30 * scale;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${18 * scale}px 'Segoe UI', Arial, sans-serif`;
  ctx.fillStyle = '#2F4A6D';
  ctx.fillText('EVER', labelX - 38 * scale, labelY);
  ctx.fillStyle = '#F5D67B';
  ctx.strokeStyle = '#2F4A6D';
  ctx.lineWidth = 1 * scale;
  ctx.fillText('STRIP', labelX + 38 * scale, labelY);
  ctx.strokeText('STRIP', labelX + 38 * scale, labelY);

  for (const em of state.emojis) {
    const fontSize = 24 * em.scale * scale;
    ctx.save();
    ctx.translate((em.x + 12 * em.scale) * scale, (em.y + 12 * em.scale) * scale);
    ctx.rotate(em.rotation * Math.PI / 180);
    ctx.font = `${fontSize}px 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(em.char, 0, 0);
    ctx.restore();
  }

  const link = document.createElement('a');
  link.download = 'everstrip-' + Date.now() + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('Photostrip berhasil di-download! 🎉');
};

function getFilterCSS(f) {
  const map = {
    'f-normal': 'none',
    'f-vivid': 'saturate(1.6) contrast(1.1) brightness(1.05)',
    'f-mono': 'grayscale(1) contrast(1.1)',
    'f-sepia': 'sepia(0.8) contrast(1.05)',
    'f-cool': 'hue-rotate(180deg) saturate(1.3) brightness(1.05)',
    'f-warm': 'sepia(0.35) saturate(1.4) brightness(1.05)',
    'f-fade': 'contrast(0.85) brightness(1.1) saturate(0.7)',
    'f-dreamy': 'blur(0.6px) brightness(1.1) saturate(1.2) contrast(0.95)',
  };
  return map[f] || 'none';
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

function drawCover(ctx, img, x, y, w, h) {
  const ir = img.width / img.height;
  const tr = w / h;
  let sx, sy, sw, sh;
  if (ir > tr) {
    sh = img.height;
    sw = sh * tr;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / tr;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/* ================= RESET ================= */
document.getElementById('btnReset').onclick = () => {
  state.slots = [null, null, null];
  state.emojis = [];
  state.selectedEmoji = null;
  renderStrip();
  showToast('Semua direset. Siap foto lagi! 🔄');
};

/* ================= CONTACT FORM ================= */
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Pesan terkirim! Terima kasih 💌');
    contactForm.reset();
  });
}

/* ================= CLICK-OUTSIDE DESELECT ================= */
document.addEventListener('click', (e) => {
  if (!e.target.closest('.emoji-overlay')) {
    state.selectedEmoji = null;
    document.querySelectorAll('.emoji-overlay').forEach(el => el.classList.remove('selected'));
  }
});

/* ================= INIT ================= */
renderStrip();