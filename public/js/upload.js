const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const filePreview = document.getElementById('filePreview');
const previewPlayer = document.getElementById('previewPlayer');
const previewFileName = document.getElementById('previewFileName');
const previewFileSize = document.getElementById('previewFileSize');
const uploadForm = document.getElementById('uploadForm');
const uploadBtn = document.getElementById('uploadBtn');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const errorMsg = document.getElementById('errorMsg');
const successMsg = document.getElementById('successMsg');

const ACCEPTED_TYPES = ['video/mp4','video/webm','video/ogg','video/quicktime',
  'video/x-msvideo','video/x-matroska','video/mpeg'];

let selectedFile = null;

function formatBytes(bytes) {
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(2) + ' GB';
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
  return (bytes / 1e3).toFixed(0) + ' KB';
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = 'block';
  successMsg.style.display = 'none';
}

function clearMessages() {
  errorMsg.style.display = 'none';
  successMsg.style.display = 'none';
}

function setFile(file) {
  if (!file) return;

  const isVideo = ACCEPTED_TYPES.includes(file.type) || file.name.match(/\.(mp4|webm|ogg|mov|avi|mkv|mpeg|mpg)$/i);
  if (!isVideo) {
    showError('Please select a valid video file (MP4, WebM, OGG, MOV, etc.)');
    fileInput.value = '';
    return;
  }

  clearMessages();
  selectedFile = file;

  previewFileName.textContent = file.name;
  previewFileSize.textContent = formatBytes(file.size);
  const objUrl = URL.createObjectURL(file);
  previewPlayer.src = objUrl;
  filePreview.style.display = 'block';
  dropZone.style.display = 'none';

  uploadBtn.disabled = false;
  uploadBtn.textContent = 'Upload Video';
}

// Drop zone click → file input
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') fileInput.click();
});

// Drag & drop
dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) setFile(file);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) setFile(fileInput.files[0]);
});

// Restore channel name from localStorage
const storedUsername = localStorage.getItem('vidlocal_username');
if (storedUsername) {
  const uploaderInput = document.getElementById('uploaderName');
  if (uploaderInput) uploaderInput.value = storedUsername;
}

// Form submit via XHR for progress tracking
uploadForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearMessages();

  if (!selectedFile) {
    showError('Please select a video file first.');
    return;
  }

  const title = document.getElementById('uploadTitle').value.trim();
  const uploaderName = document.getElementById('uploaderName').value.trim();
  if (!title) { showError('Title is required.'); return; }
  if (!uploaderName) { showError('Channel name is required.'); return; }

  const formData = new FormData();
  formData.append('file', selectedFile, selectedFile.name);
  formData.append('title', title);
  formData.append('description', document.getElementById('uploadDescription').value.trim());
  formData.append('tags', document.getElementById('uploadTags').value.trim());
  formData.append('uploaderName', uploaderName);

  // Save username
  localStorage.setItem('vidlocal_username', uploaderName);

  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Uploading…';
  progressWrap.style.display = 'block';
  progressText.style.display = 'block';
  progressFill.style.width = '0%';
  progressText.textContent = '0%';

  const xhr = new XMLHttpRequest();

  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const pct = Math.round((e.loaded / e.total) * 100);
      progressFill.style.width = pct + '%';
      progressText.textContent = `${pct}% (${formatBytes(e.loaded)} / ${formatBytes(e.total)})`;
    }
  });

  xhr.addEventListener('load', () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const data = JSON.parse(xhr.responseText);
        successMsg.textContent = 'Upload successful! Redirecting…';
        successMsg.style.display = 'block';
        progressFill.style.width = '100%';
        progressText.textContent = '100%';
        setTimeout(() => {
          window.location.href = data.watchUrl || `/watch?v=${data.videoId}`;
        }, 800);
      } catch {
        showError('Upload succeeded but response was malformed.');
      }
    } else {
      let errMsg = `Upload failed (${xhr.status})`;
      try { errMsg = JSON.parse(xhr.responseText).error || errMsg; } catch {}
      showError(errMsg);
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Upload Video';
      progressWrap.style.display = 'none';
      progressText.style.display = 'none';
    }
  });

  xhr.addEventListener('error', () => {
    showError('Network error during upload. Please try again.');
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Upload Video';
    progressWrap.style.display = 'none';
    progressText.style.display = 'none';
  });

  xhr.open('POST', '/api/upload');
  xhr.send(formData);
});
