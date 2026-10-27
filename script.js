document.addEventListener('DOMContentLoaded', () => {
    // State Aplikasi
    let capturedPhotos = [];
    let currentFilter = 'none';

    // Element Selector
    const videoElem = document.getElementById('webcamVideo');
    const countdownOverlay = document.getElementById('countdownOverlay');
    const flashEffect = document.getElementById('flashEffect');
    const tabWebcam = document.getElementById('tabWebcam');
    const tabUpload = document.getElementById('tabUpload');
    const webcamControls = document.getElementById('webcamControls');
    const uploadControls = document.getElementById('uploadControls');
    const imageUploader = document.getElementById('imageUploader');
    const btnSnap = document.getElementById('btnSnap');
    const btnRetake = document.getElementById('btnRetake');
    const filterSelect = document.getElementById('filterSelect');
    const fontSelect = document.getElementById('fontSelect');
    const stripTextInput = document.getElementById('stripText');
    const stripDateInput = document.getElementById('stripDate');
    const previewText = document.getElementById('previewText');
    const previewDate = document.getElementById('previewDate');
    const photostrip = document.getElementById('photostrip');
    const btnDownload = document.getElementById('btnDownload');

    // 1. Inisialisasi Kamera Webcam
    async function initWebcam() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
            videoElem.srcObject = stream;
        } catch (err) {
            console.warn("Kamera tidak dapat diakses atau diizinkan:", err);
        }
    }
    initWebcam();

    // Tab Switcher (Kamera vs Upload File)
    tabWebcam.addEventListener('click', () => {
        tabWebcam.classList.add('active');
        tabUpload.classList.remove('active');
        webcamControls.style.display = 'block';
        uploadControls.style.display = 'none';
    });

    tabUpload.addEventListener('click', () => {
        tabUpload.classList.add('active');
        tabWebcam.classList.remove('active');
        uploadControls.style.display = 'block';
        webcamControls.style.display = 'none';
    });

    // 2. Ambil Foto Beruntun (4x Capture Sequence)
    btnSnap.addEventListener('click', async () => {
        btnSnap.disabled = true;
        capturedPhotos = [];
        
        for (let i = 0; i < 4; i++) {
            await runCountdown(3);
            triggerFlash();
            takePhoto();
            await new Promise(res => setTimeout(res, 600));
        }
        btnSnap.disabled = false;
    });

    function runCountdown(seconds) {
        return new Promise(resolve => {
            let count = seconds;
            countdownOverlay.textContent = count;
            countdownOverlay.classList.add('show');
            
            const timer = setInterval(() => {
                count--;
                if (count > 0) {
                    countdownOverlay.textContent = count;
                } else {
                    clearInterval(timer);
                    countdownOverlay.classList.remove('show');
                    resolve();
                }
            }, 1000);
        });
    }

    function triggerFlash() {
        flashEffect.classList.add('flash');
        setTimeout(() => flashEffect.classList.remove('flash'), 150);
    }

    function takePhoto() {
        const canvas = document.createElement('canvas');
        canvas.width = videoElem.videoWidth || 640;
        canvas.height = videoElem.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElem, 0, 0, canvas.width, canvas.height);
        
        capturedPhotos.push(canvas.toDataURL('image/png'));
        updatePhotostrip();
    }

    btnRetake.addEventListener('click', () => {
        capturedPhotos = [];
        updatePhotostrip();
    });

    // 3. Upload Multi-File Manual
    imageUploader.addEventListener('change', (e) => {
        const files = Array.from(e.target.files).slice(0, 4);
        capturedPhotos = [];
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                capturedPhotos.push(event.target.result);
                updatePhotostrip();
            };
            reader.readAsDataURL(file);
        });
    });

    // 4. Update Preview Photostrip
    function updatePhotostrip() {
        for (let i = 0; i < 4; i++) {
            const slot = document.getElementById(`slot${i}`);
            slot.innerHTML = '';
            
            if (capturedPhotos[i]) {
                const img = document.createElement('img');
                img.src = capturedPhotos[i];
                img.style.filter = currentFilter;
                slot.appendChild(img);
            } else {
                slot.innerHTML = '<i class="ph-bold ph-image-square"></i>';
            }
        }
    }

    // 5. Ubah Warna Frame
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
            const target = e.target;
            target.classList.add('active');
            
            const color = target.getAttribute('data-color');
            photostrip.style.backgroundColor = color;
            
            // Penyesuaian kontras warna teks footer
            if(color === '#1B2D44' || color === '#253D5B') {
                previewText.style.color = '#FDF7C3';
                previewDate.style.color = '#EBE5DA';
            } else {
                previewText.style.color = '#253D5B';
                previewDate.style.color = '#64748B';
            }
        });
    });

    // 6. Filter, Font, & Input Teks Real-Time
    filterSelect.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        updatePhotostrip();
    });

    fontSelect.addEventListener('change', (e) => {
        previewText.style.fontFamily = e.target.value;
    });

    stripTextInput.addEventListener('input', (e) => {
        previewText.textContent = e.target.value || 'PHOTOSTRIP MEMORIES';
    });

    stripDateInput.addEventListener('input', (e) => {
        previewDate.textContent = e.target.value || '2026 • BEST FRIENDS';
    });

    // 7. Render & Unduh PNG Photostrip
    btnDownload.addEventListener('click', () => {
        html2canvas(photostrip, { scale: 3 }).then(canvas => {
            const link = document.createElement('a');
            link.download = `photostrip-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    });

    // 8. ANIMASI BRUSH WIGGLE (Kiri Atas ke Kanan secara Periodik)
    const canvas = document.getElementById('brushCanvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
});