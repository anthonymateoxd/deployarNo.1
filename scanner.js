// Configuración de Google API
const CLIENT_ID =
  '124776303655-ciftdp9sqlkm5ir5hargvk1cf9hcte88.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDz4X52nWMUsWbjO-eyTFx6rNAg82pTb_A';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const SPREADSHEET_ID = '1a2cs6PGHtxlYL9c6DZJ5v0D5JPAMAONw9RbwmVCHOk0';
const RANGE = 'Datos1!A2:G100';

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

// function handleAuthClick() {
//   tokenClient.callback = async resp => {
//     if (resp.error !== undefined) {
//       throw resp;
//     }
//     document.getElementById('signout_button').style.display = 'inline-block';
//     document.getElementById('authorize_button').style.display = 'none';
//     document.getElementById('auth-status').textContent =
//       'Autenticado correctamente';
//     document.getElementById('auth-status').className = 'authenticated';

//     document.getElementById('start-scanner').disabled = false;
//     document.getElementById('start-scanner').classList.remove('disabled');
//   };

//   if (gapi.client.getToken() === null) {
//     tokenClient.requestAccessToken({ prompt: 'consent' });
//   } else {
//     tokenClient.requestAccessToken({ prompt: '' });
//   }
// }

// function handleSignoutClick() {
//   const token = gapi.client.getToken();
//   if (token !== null) {
//     google.accounts.oauth2.revoke(token.access_token);
//     gapi.client.setToken(null);

//     document.getElementById('signout_button').style.display = 'none';
//     document.getElementById('authorize_button').style.display = 'inline-block';
//     document.getElementById('auth-status').textContent = 'No autenticado';
//     document.getElementById('auth-status').className = 'not-authenticated';

//     document.getElementById('start-scanner').disabled = true;
//     document.getElementById('start-scanner').classList.add('disabled');
//     stopScanner();
//   }
// }

// Función para mostrar los datos de la hoja de cálculo
async function displaySheetData() {
  try {
    // Crear o seleccionar el contenedor
    let dataContainer = document.getElementById('sheet-data-container');
    if (!dataContainer) {
      dataContainer = document.createElement('div');
      dataContainer.id = 'sheet-data-container';
      dataContainer.style.margin = '20px 0';
      dataContainer.style.padding = '15px';
      dataContainer.style.backgroundColor = '#f8f9fa';
      dataContainer.style.borderRadius = '8px';
      dataContainer.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';

      const title = document.createElement('h2');
      title.textContent = 'Datos de la Hoja de Cálculo';
      title.style.color = '#2c3e50';
      title.style.marginBottom = '15px';
      dataContainer.appendChild(title);

      const loading = document.createElement('div');
      loading.id = 'sheet-data-loading';
      loading.textContent = 'Cargando datos...';
      loading.style.color = '#7f8c8d';
      dataContainer.appendChild(loading);

      const table = document.createElement('table');
      table.id = 'sheet-data-table';
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.marginTop = '10px';
      table.style.display = 'none';
      table.style.fontFamily = 'Arial, sans-serif';
      dataContainer.appendChild(table);

      document.body.insertBefore(
        dataContainer,
        document.querySelector('script')
      );
    }

    const loadingElement = document.getElementById('sheet-data-loading');
    const tableElement = document.getElementById('sheet-data-table');

    loadingElement.textContent = 'Cargando datos...';
    tableElement.style.display = 'none';

    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    const values = response.result.values;

    if (!values || values.length === 0) {
      loadingElement.textContent = 'No se encontraron datos en la hoja.';
      loadingElement.style.color = '#e74c3c';
      return;
    }

    // Construir la tabla con nuevos estilos
    let tableHTML = '';
    const headers = values[0];

    // Encabezados
    tableHTML += '<tr>';
    headers.forEach(header => {
      tableHTML += `
        <th style="
          background-color: #3498db;
          color: white;
          padding: 12px 8px;
          text-align: left;
          border: 1px solid #2980b9;
          font-weight: bold;
        ">${header}</th>
      `;
    });
    tableHTML += '</tr>';

    // Filas de datos
    for (let i = 1; i < values.length; i++) {
      const rowColor = i % 2 === 0 ? '#f2f2f2' : '#ffffff';
      tableHTML += `
        <tr style="background-color: ${rowColor};">
      `;

      values[i].forEach(cell => {
        tableHTML += `
          <td style="
            padding: 10px 8px;
            border: 1px solid #ddd;
            color: #34495e;
          ">${cell}</td>
        `;
      });

      tableHTML += '</tr>';
    }

    tableElement.innerHTML = tableHTML;
    loadingElement.style.display = 'none';
    tableElement.style.display = 'table';

    // Añadir hover effect
    tableElement.querySelectorAll('tr:not(:first-child)').forEach(row => {
      row.style.transition = 'background-color 0.2s ease';
      row.addEventListener('mouseenter', () => {
        row.style.backgroundColor = '#e3f2fd';
      });
      row.addEventListener('mouseleave', () => {
        row.style.backgroundColor =
          row.rowIndex % 2 === 0 ? '#f2f2f2' : '#ffffff';
      });
    });
  } catch (err) {
    console.error('Error al mostrar datos:', err);
    const loadingElement = document.getElementById('sheet-data-loading');
    if (loadingElement) {
      loadingElement.textContent = 'Error al cargar los datos: ' + err.message;
      loadingElement.style.color = '#e74c3c';
    }
  }
}

// Modificar handleAuthClick para mostrar los datos después de autenticar
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

    // Mostrar los datos después de autenticar
    await displaySheetData();
  };

  if (gapi.client.getToken() === null) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    tokenClient.requestAccessToken({ prompt: '' });
  }
}

// Modificar handleSignoutClick para ocultar los datos al cerrar sesión
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

    // Ocultar los datos al cerrar sesión
    const dataContainer = document.getElementById('sheet-data-container');
    if (dataContainer) {
      dataContainer.style.display = 'none';
    }
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
        const qrData = code.data;
        let extractedCode = '';
        let isYoutubeUrl = false;

        // Extraer código si es QR de YouTube
        if (qrData.includes('youtube.com/?data=')) {
          const urlParts = qrData.split('data=');
          extractedCode = urlParts[1];
          isYoutubeUrl = true;
        } else {
          extractedCode = qrData; // Si es un código directo
        }

        qrResult.innerHTML = `Código escaneado: <strong>${extractedCode}</strong>`;

        // Buscar en Google Sheets
        const searchResult = await checkSpreadsheet(extractedCode);

        // Mostrar resultado con estilos mejorados
        if (searchResult && searchResult.found) {
          qrResult.innerHTML += `
            <div style="
              background: #4CAF50;
              color: white;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              font-weight: bold;
              font-size: 1.1em;
              text-align: center;
            ">
              ✔ El código existe en el sistema
            </div>
          `;

          // Redirigir solo si es URL de YouTube y el código existe
          if (isYoutubeUrl) {
            qrResult.innerHTML += `
              <div style="
                background: #2196F3;
                color: white;
                padding: 10px;
                border-radius: 5px;
                margin: 10px 0;
                text-align: center;
              ">
                Redirigiendo en 3 segundos...
              </div>
            `;
            setTimeout(() => {
              window.location.href = qrData; // Usar la URL original del QR
            }, 3000);
          }
        } else {
          qrResult.innerHTML += `
            <div style="
              background: #f44336;
              color: white;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              font-weight: bold;
              font-size: 1.1em;
              text-align: center;
            ">
              ✖ El código NO existe en el sistema
            </div>
            <div style="
              background: #ffeb3b;
              color: #000;
              padding: 10px;
              border-radius: 5px;
              margin: 10px 0;
              text-align: center;
            ">
              No se realizará ninguna redirección
            </div>
          `;
        }

        stopScanner();
      }
    }
    requestAnimationFrame(tick);
  }
  tick();
}

// Función optimizada de búsqueda
async function checkSpreadsheet(qrCode) {
  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Datos1!G2:G', // Solo columna G desde fila 2
    });

    const values = response.result.values;
    if (!values) return { found: false };

    // Buscar el código exacto en la columna G
    for (const [cellValue] of values) {
      if (cellValue && cellValue.trim() === qrCode.trim()) {
        return { found: true };
      }
    }
    return { found: false };
  } catch (err) {
    console.error('Error al buscar:', err);
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
