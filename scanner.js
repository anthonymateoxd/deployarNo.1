// Configuración de Google API
const CLIENT_ID =
  '124776303655-ciftdp9sqlkm5ir5hargvk1cf9hcte88.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDz4X52nWMUsWbjO-eyTFx6rNAg82pTb_A';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const SPREADSHEET_ID = '1a2cs6PGHtxlYL9c6DZJ5v0D5JPAMAONw9RbwmVCHOk0';
const RANGE = 'Datos1!G2';

// Variables para el escáner QR
let scannerActive = false;
let videoStream = null;
let tokenClient;
let gapiInited = false;
let gisInited = false;

document.addEventListener('DOMContentLoaded', function () {
  // Configurar listeners
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
  //
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

    document.getElementById('start-scanner').disabled = true;
    document.getElementById('start-scanner').classList.add('disabled');
    stopScanner();
  }
}

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

  async function tick() {
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
        // Extraer el código del QR (última parte de la URL)
        const qrData = code.data;
        let youtubeUrl = qrData;
        let extractedCode = '';

        // Verificar si es un QR generado con tu formato
        if (qrData.includes('youtube.com/?data=')) {
          const urlParts = qrData.split('data=');
          youtubeUrl = urlParts[0].replace('?data=', ''); // URL base de YouTube
          extractedCode = urlParts[1]; // Código después de data=
        }

        // Verificar en Google Sheets
        const sheetValue = await checkSpreadsheet();
        qrResult.innerHTML = `Código QR escaneado: <strong>${
          extractedCode || qrData
        }</strong>`;

        if (
          sheetValue &&
          (extractedCode === sheetValue || qrData === sheetValue)
        ) {
          qrResult.innerHTML +=
            '<br><span style="color:green; font-weight:bold;">✔ Código EXISTE en el sistema</span>';

          // Redirigir después de 2 segundos (opcional)
          setTimeout(() => {
            window.location.href = youtubeUrl;
          }, 2000);
        } else {
          qrResult.innerHTML +=
            '<br><span style="color:red; font-weight:bold;">✖ Código NO existe en el sistema</span>';

          // Redirigir solo si es URL de YouTube (opcional)
          if (isYouTubeUrl(youtubeUrl)) {
            qrResult.innerHTML += `<br><small>Redirigiendo a YouTube en 3 segundos...</small>`;
            setTimeout(() => {
              window.location.href = youtubeUrl;
            }, 3000);
          }
        }

        stopScanner();
      }
    }

    requestAnimationFrame(tick);
  }

  tick();
}

// Función para verificar en Google Sheets (sin cambios)
async function checkSpreadsheet() {
  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    return response.result.values ? response.result.values[0][0] : null;
  } catch (err) {
    console.error('Error al leer la hoja de cálculo:', err);
    return null;
  }
}

// Función para verificar URL de YouTube (sin cambios)
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
