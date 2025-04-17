// // Configuración de Google API
// const CLIENT_ID =
//   '124776303655-ciftdp9sqlkm5ir5hargvk1cf9hcte88.apps.googleusercontent.com';
// const API_KEY = 'AIzaSyDz4X52nWMUsWbjO-eyTFx6rNAg82pTb_A';
// const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';
// const SPREADSHEET_ID = '1a2cs6PGHtxlYL9c6DZJ5v0D5JPAMAONw9RbwmVCHOk0';
// const RANGE = 'Datos1!A2:G100';

// // Variables para el escáner QR
// let scannerActive = false;
// let videoStream = null;
// let tokenClient;
// let gapiInited = false;
// let gisInited = false;

// document.addEventListener('DOMContentLoaded', function () {
//   // Configurar listeners
//   document
//     .getElementById('start-scanner')
//     .addEventListener('click', startScanner);
//   document
//     .getElementById('stop-scanner')
//     .addEventListener('click', stopScanner);
//   document
//     .getElementById('authorize_button')
//     .addEventListener('click', handleAuthClick);
//   document
//     .getElementById('signout_button')
//     .addEventListener('click', handleSignoutClick);

//   // Cargar Google API
//   loadGoogleAPI();
// });

// // Función para cargar Google API
// function loadGoogleAPI() {
//   const script = document.createElement('script');
//   script.src = 'https://apis.google.com/js/api.js';
//   script.onload = () => {
//     gapi.load('client', () => {
//       gapi.client
//         .init({
//           apiKey: API_KEY,
//           discoveryDocs: [
//             'https://sheets.googleapis.com/$discovery/rest?version=v4',
//           ],
//         })
//         .then(() => {
//           gapiInited = true;
//           maybeEnableAuth();
//         });
//     });
//   };
//   document.body.appendChild(script);
//   //
//   tokenClient = google.accounts.oauth2.initTokenClient({
//     client_id: CLIENT_ID,
//     scope: SCOPES,
//     callback: '', // Definido en handleAuthClick
//   });
//   gisInited = true;
//   maybeEnableAuth();
// }

// function maybeEnableAuth() {
//   if (gapiInited && gisInited) {
//     document.getElementById('authorize_button').style.visibility = 'visible';
//   }
// }

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

// async function startScanner() {
//   if (!gapi.client.getToken()) {
//     alert('Por favor, autentícate primero antes de escanear.');
//     return;
//   }

//   const scannerContainer = document.getElementById('qr-scanner-container');
//   const startScannerBtn = document.getElementById('start-scanner');
//   const qrResult = document.getElementById('qr-result');

//   scannerContainer.style.display = 'block';
//   startScannerBtn.style.display = 'none';
//   qrResult.innerHTML = '';

//   const video = document.getElementById('qr-video');

//   try {
//     videoStream = await navigator.mediaDevices.getUserMedia({
//       video: { facingMode: 'environment' },
//     });
//     video.srcObject = videoStream;
//     video.play();

//     scannerActive = true;
//     scanQRCode(video);
//   } catch (err) {
//     console.error('Error al acceder a la cámara:', err);
//     qrResult.innerHTML = 'Error al acceder a la cámara: ' + err.message;
//   }
// }

// function stopScanner() {
//   scannerActive = false;
//   if (videoStream) {
//     videoStream.getTracks().forEach(track => track.stop());
//     videoStream = null;
//   }
//   document.getElementById('qr-scanner-container').style.display = 'none';
//   document.getElementById('start-scanner').style.display = 'block';
// }

// function scanQRCode(video) {
//   const canvas = document.createElement('canvas');
//   const context = canvas.getContext('2d');
//   const qrResult = document.getElementById('qr-result');

//   async function tick() {
//     if (!scannerActive) return;

//     if (video.readyState === video.HAVE_ENOUGH_DATA) {
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;
//       context.drawImage(video, 0, 0, canvas.width, canvas.height);

//       const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
//       const code = jsQR(imageData.data, imageData.width, imageData.height, {
//         inversionAttempts: 'dontInvert',
//       });

//       if (code) {
//         // Extraer el código del QR (última parte de la URL)
//         const qrData = code.data;
//         let youtubeUrl = qrData;
//         let extractedCode = '';

//         // Verificar si es un QR generado con tu formato
//         if (qrData.includes('youtube.com/?data=')) {
//           const urlParts = qrData.split('data=');
//           youtubeUrl = urlParts[0].replace('?data=', ''); // URL base de YouTube
//           extractedCode = urlParts[1]; // Código después de data=
//         }

//         // Verificar en Google Sheets
//         const sheetValue = await checkSpreadsheet(extractedCode || qrData);

//         qrResult.innerHTML = `Código QR escaneado: <strong>${
//           extractedCode || qrData
//         }</strong>`;

//         if (
//           sheetValue &&
//           (extractedCode === sheetValue || qrData === sheetValue)
//         ) {
//           qrResult.innerHTML +=
//             '<br><span style="color:green; font-weight:bold;">✔ Código EXISTE en el sistema</span>';

//           // Redirigir después de 2 segundos (opcional)
//           setTimeout(() => {
//             window.location.href = youtubeUrl;
//           }, 2000);
//         } else {
//           qrResult.innerHTML +=
//             '<br><span style="color:red; font-weight:bold;">✖ Código NO existe en el sistema</span>';

//           // Redirigir solo si es URL de YouTube (opcional)
//           if (isYouTubeUrl(youtubeUrl)) {
//             qrResult.innerHTML += `<br><small>Redirigiendo a YouTube en 3 segundos...</small>`;
//             setTimeout(() => {
//               window.location.href = youtubeUrl;
//             }, 3000);
//           }
//         }

//         stopScanner();
//       }
//     }

//     requestAnimationFrame(tick);
//   }

//   tick();
// }

// // Función para verificar y mostrar datos de Google Sheets
// async function checkSpreadsheet(qrCode) {
//   try {
//     const response = await gapi.client.sheets.spreadsheets.values.get({
//       spreadsheetId: SPREADSHEET_ID,
//       range: RANGE,
//     });

//     const values = response.result.values;
//     const qrResult = document.getElementById('qr-result');

//     if (!values || values.length === 0) {
//       console.log('No se encontraron datos en la hoja.');
//       qrResult.innerHTML += '<br>No hay datos en la hoja de cálculo';
//       return null;
//     }

//     // Mostrar todos los datos primero (para propósitos de visualización)
//     qrResult.innerHTML += '<br><br><strong>Datos en la hoja:</strong><br>';
//     qrResult.innerHTML += '<table border="1"><tr>';

//     // Encabezados (asumiendo que la primera fila tiene los títulos)
//     const headers = values[0];
//     headers.forEach(header => {
//       qrResult.innerHTML += `<th>${header}</th>`;
//     });
//     qrResult.innerHTML += '</tr>';

//     // Filas de datos
//     for (let i = 1; i < values.length; i++) {
//       qrResult.innerHTML += '<tr>';
//       values[i].forEach(cell => {
//         qrResult.innerHTML += `<td>${cell}</td>`;
//       });
//       qrResult.innerHTML += '</tr>';
//     }
//     qrResult.innerHTML += '</table>';

//     // Buscar el código QR específico (si se proporciona)
//     if (qrCode) {
//       for (const row of values) {
//         if (row[6] === qrCode) {
//           // Asumiendo columna G (índice 6)
//           return {
//             found: true,
//             data: row,
//           };
//         }
//       }
//       return { found: false };
//     }

//     return values; // Devuelve todos los datos si no se busca un código específico
//   } catch (err) {
//     console.error('Error al leer la hoja de cálculo:', err);
//     document.getElementById('qr-result').innerHTML +=
//       '<br>Error al acceder a los datos: ' + err.message;
//     return null;
//   }
// }

// // Función para verificar URL de YouTube (sin cambios)
// function isYouTubeUrl(url) {
//   try {
//     const parsedUrl = new URL(url);
//     return (
//       parsedUrl.hostname.includes('youtube.com') ||
//       parsedUrl.hostname.includes('youtu.be')
//     );
//   } catch {
//     return false;
//   }
// }

// Función para mostrar los datos de la hoja de cálculo
async function displaySheetData() {
  try {
    // Crear contenedor si no existe
    let dataContainer = document.getElementById('sheet-data-container');
    if (!dataContainer) {
      dataContainer = document.createElement('div');
      dataContainer.id = 'sheet-data-container';
      dataContainer.style.margin = '20px 0';
      dataContainer.style.padding = '15px';
      dataContainer.style.backgroundColor = '#f9f9f9';
      dataContainer.style.borderRadius = '5px';
      dataContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

      const title = document.createElement('h2');
      title.textContent = 'Datos de la Hoja de Cálculo';
      dataContainer.appendChild(title);

      const loading = document.createElement('div');
      loading.id = 'sheet-data-loading';
      loading.textContent = 'Cargando datos...';
      dataContainer.appendChild(loading);

      const table = document.createElement('table');
      table.id = 'sheet-data-table';
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.marginTop = '10px';
      table.style.display = 'none';
      dataContainer.appendChild(table);

      // Insertar después del contenedor de autenticación
      const authContainer = document.querySelector('div');
      authContainer.insertAdjacentElement('afterend', dataContainer);
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
      return;
    }

    // Construir la tabla
    let tableHTML = '';
    const headers = values[0];

    // Encabezados
    tableHTML += '<tr>';
    headers.forEach(header => {
      tableHTML += `<th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">${header}</th>`;
    });
    tableHTML += '</tr>';

    // Filas de datos
    for (let i = 1; i < values.length; i++) {
      tableHTML +=
        '<tr style="background-color: ' +
        (i % 2 === 0 ? '#f9f9f9' : 'white') +
        '">';
      values[i].forEach(cell => {
        tableHTML += `<td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${cell}</td>`;
      });
      tableHTML += '</tr>';
    }

    tableElement.innerHTML = tableHTML;
    loadingElement.style.display = 'none';
    tableElement.style.display = 'table';
  } catch (err) {
    console.error('Error al mostrar datos:', err);
    const loadingElement = document.getElementById('sheet-data-loading');
    if (loadingElement) {
      loadingElement.textContent = 'Error al cargar los datos: ' + err.message;
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
