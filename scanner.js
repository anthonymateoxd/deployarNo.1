// Configuración de Google API
const CLIENT_ID =
  '124776303655-ciftdp9sqlkm5ir5hargvk1cf9hcte88.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDz4X52nWMUsWbjO-eyTFx6rNAg82pTb_A';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';

// Variables para el escáner QR
let scannerActive = false;
let videoStream = null;
let tokenClient;
let gapiInited = false;
let gisInited = false;

document.addEventListener('DOMContentLoaded', function () {
  // Configurar listeners para el escáner QR
  document
    .getElementById('start-scanner')
    .addEventListener('click', startScanner);
  document
    .getElementById('stop-scanner')
    .addEventListener('click', stopScanner);
  document
    .getElementById('authorize_button')
    .addEventListener('click', handleAuthClick);
  document
    .getElementById('signout_button')
    .addEventListener('click', handleSignoutClick);

  // Cargar Google API
  loadGoogleAPI();
});

// Función para cargar Google API
function loadGoogleAPI() {
  const script = document.createElement('script');
  script.src = 'https://apis.google.com/js/api.js';
  script.onload = () => {
    gapi.load('client', () => {
      gapi.client
        .init({
          apiKey: API_KEY,
          discoveryDocs: [
            'https://sheets.googleapis.com/$discovery/rest?version=v4',
          ],
        })
        .then(() => {
          gapiInited = true;
          maybeEnableAuth();
        });
    });
  };
  document.body.appendChild(script);

  // GIS (Google Identity Services) ya está cargado con el script externo
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // Definido en handleAuthClick
  });
  gisInited = true;
  maybeEnableAuth();
}

function maybeEnableAuth() {
  if (gapiInited && gisInited) {
    document.getElementById('authorize_button').style.visibility = 'visible';
  }
}

function handleAuthClick() {
  tokenClient.callback = async resp => {
    if (resp.error !== undefined) {
      throw resp;
    }
    document.getElementById('signout_button').style.display = 'inline-block';
    document.getElementById('authorize_button').style.display = 'none';
    document.getElementById('auth-status').textContent =
      'Autenticado correctamente';
    document.getElementById('auth-status').className = 'authenticated';

    // Habilitar el escáner QR
    document.getElementById('start-scanner').disabled = false;
    document.getElementById('start-scanner').classList.remove('disabled');
  };

  if (gapi.client.getToken() === null) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    tokenClient.requestAccessToken({ prompt: '' });
  }
}

function handleSignoutClick() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken(null);

    document.getElementById('signout_button').style.display = 'none';
    document.getElementById('authorize_button').style.display = 'inline-block';
    document.getElementById('auth-status').textContent = 'No autenticado';
    document.getElementById('auth-status').className = 'not-authenticated';

    // Deshabilitar el escáner QR
    document.getElementById('start-scanner').disabled = true;
    document.getElementById('start-scanner').classList.add('disabled');
    stopScanner();
  }
}

// Funciones del escáner QR
async function startScanner() {
  if (!gapi.client.getToken()) {
    alert('Por favor, autentícate primero antes de escanear.');
    return;
  }

  const scannerContainer = document.getElementById('qr-scanner-container');
  const startScannerBtn = document.getElementById('start-scanner');
  const qrResult = document.getElementById('qr-result');

  scannerContainer.style.display = 'block';
  startScannerBtn.style.display = 'none';
  qrResult.innerHTML = '';

  const video = document.getElementById('qr-video');

  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });
    video.srcObject = videoStream;
    video.play();

    scannerActive = true;
    scanQRCode(video);
  } catch (err) {
    console.error('Error al acceder a la cámara:', err);
    qrResult.innerHTML = 'Error al acceder a la cámara: ' + err.message;
  }
}

function stopScanner() {
  scannerActive = false;
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  document.getElementById('qr-scanner-container').style.display = 'none';
  document.getElementById('start-scanner').style.display = 'block';
}

function scanQRCode(video) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const qrResult = document.getElementById('qr-result');

  function tick() {
    if (!scannerActive) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code) {
        qrResult.innerHTML = `Código QR escaneado: <strong>${code.data}</strong>`;

        // Verificar si es una URL de YouTube y redirigir
        if (isYouTubeUrl(code.data)) {
          window.location.href = code.data;
        } else {
          qrResult.innerHTML +=
            '<br><span style="color:red">No es una URL de YouTube válida</span>';
        }

        stopScanner();
      }
    }

    requestAnimationFrame(tick);
  }

  tick();
}

function isYouTubeUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.hostname.includes('youtube.com') ||
      parsedUrl.hostname.includes('youtu.be')
    );
  } catch {
    return false;
  }
}
