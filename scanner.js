// Configuración de Google API
const CLIENT_ID =
  '124776303655-ciftdp9sqlkm5ir5hargvk1cf9hcte88.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDz4X52nWMUsWbjO-eyTFx6rNAg82pTb_A';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const SPREADSHEET_ID = '1a2cs6PGHtxlYL9c6DZJ5v0D5JPAMAONw9RbwmVCHOk0';
const RANGE = 'Validacion!A2:G1000';

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

async function deleteValidatedRow(rowNumber) {
  try {
    // Primero obtener el sheetId correcto
    const spreadsheet = await gapi.client.sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheet = spreadsheet.result.sheets.find(
      s => s.properties.title === 'Validacion'
    );

    if (!sheet) {
      console.error('No se encontró la hoja "Validacion"');
      return false;
    }

    const sheetId = sheet.properties.sheetId;

    await gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId, // Usar el ID correcto
                dimension: 'ROWS',
                startIndex: rowNumber - 1, // Ajustar índice base 0
                endIndex: rowNumber,
              },
            },
          },
        ],
      },
    });
    return true;
  } catch (err) {
    console.error('Error al borrar fila:', err);
    return false;
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

function scanQRCode(video) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const qrResult = document.getElementById('qr-result');

  // Función para mostrar notificación
  function showNotification(message, isSuccess) {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.padding = '15px 30px';
    notification.style.borderRadius = '5px';
    notification.style.backgroundColor = isSuccess ? '#4CAF50' : '#f44336';
    notification.style.color = 'white';
    notification.style.fontWeight = 'bold';
    notification.style.zIndex = '1000';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notification.style.animation = 'fadeIn 0.3s';
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

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

        // Extraer solo los números del código QR
        const numbersInQR = qrData.match(/\d+/g);
        if (numbersInQR && numbersInQR.length > 0) {
          extractedCode = numbersInQR[0];
        } else {
          extractedCode = qrData;
        }

        console.log('Código extraído:', extractedCode);
        qrResult.innerHTML = `Código escaneado: <strong>${extractedCode}</strong>`;

        // Verificar en Google Sheets
        const { exists, row } = await checkInSpreadsheet(extractedCode);

        if (exists) {
          showNotification('✔ EL CÓDIGO EXISTE', true);
          qrResult.innerHTML += `
            <div class="result-box success">
              Código válido - Registrado en el sistema
            </div>
          `;

          // 1. Asegurar que existe la hoja Diploma con estructura correcta
          await ensureDiplomaSheet();
          await verifyDiplomaSheetStructure();

          // 2. Procesar el código validado (esto incluye escribir en Diploma y luego eliminar)
          const processSuccess = await processValidatedCode(row);

          if (processSuccess) {
            showNotification('✔ Proceso completado correctamente', true);
            qrResult.innerHTML += `
              <div class="result-box success">
                Datos registrados en Diploma y eliminados de Validación
              </div>
            `;
          } else {
            showNotification('✖ Error en el proceso', false);
            qrResult.innerHTML += `
              <div class="result-box error">
                Error en el proceso de validación
              </div>
            `;
          }
        } else {
          showNotification('✖ CÓDIGO NO ENCONTRADO', false);
          qrResult.innerHTML += `
            <div class="result-box error">
              Código no registrado - Acceso no autorizado
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

async function checkInSpreadsheet(code) {
  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Validacion!C2:C', // Asumiendo que los códigos están en la columna C
      majorDimension: 'COLUMNS',
    });

    const values = response.result.values;
    if (!values || values.length === 0) return { exists: false, row: -1 };

    // Buscar el código en la columna y devolver el número de fila (base 1)
    for (let i = 0; i < values[0].length; i++) {
      if (values[0][i].toString().trim() === code.toString().trim()) {
        return { exists: true, row: i + 2 }; // +2 porque empieza en C2 (fila 2)
      }
    }

    return { exists: false, row: -1 };
  } catch (error) {
    console.error('Error al verificar:', error);
    return { exists: false, row: -1 };
  }
}

// Función mejorada para escribir en Diploma
async function writeToDiplomaSheet(nombre, correo, codigo, fecha) {
  try {
    // Verificar/crear hoja Diploma si no existe
    await ensureDiplomaSheet();

    const result = await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Diploma!A:D',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[nombre, correo, codigo, fecha]],
      },
    });

    console.log('Escritura exitosa en Diploma:', result);
    return true;
  } catch (err) {
    console.error('Error al escribir en Diploma:', err);
    throw err; // Relanzamos el error para manejarlo arriba
  }
}

// Función auxiliar para obtener el código de la fila
async function getCodeFromRow(rowNumber) {
  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Validacion!C${rowNumber}:C${rowNumber}`, // Columna C (Código)
    });

    if (response.result.values && response.result.values.length > 0) {
      return response.result.values[0][0] || '';
    }
    return '';
  } catch (err) {
    console.error('Error al obtener código:', err);
    return '';
  }
}

// Función para asegurar que existe la hoja Diploma
async function ensureDiplomaSheet() {
  try {
    const spreadsheet = await gapi.client.sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const hasDiplomaSheet = spreadsheet.result.sheets.some(
      sheet => sheet.properties.title === 'Diploma'
    );

    if (!hasDiplomaSheet) {
      await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'Diploma',
                  gridProperties: { rowCount: 1, columnCount: 4 },
                },
              },
            },
          ],
        },
      });

      // Escribir encabezados
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Diploma!A1:D1',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [['Nombre', 'Correo', 'Código', 'Fecha de Registro']],
        },
      });
    }
    return true;
  } catch (err) {
    console.error('Error al verificar hoja Diploma:', err);
    return false;
  }
}

async function verifyDiplomaSheetStructure() {
  try {
    // Verificar si la hoja existe
    await ensureDiplomaSheet();

    // Verificar encabezados
    const headersResponse = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Diploma!A1:C1',
    });

    if (!headersResponse.result.values) {
      // Si no hay encabezados, crearlos
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Diploma!A1:C1',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [['Nombre', 'Correo', 'Fecha de Registro']],
        },
      });
      console.log('Encabezados creados exitosamente');
    }
    return true;
  } catch (err) {
    console.error('Error al verificar estructura:', err);
    return false;
  }
}

async function processValidatedCode(rowNumber) {
  try {
    // 1. PRIMERO: Obtener los datos necesarios
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Validacion!A${rowNumber}:C${rowNumber}`, // A: Nombre, B: Correo, C: Código
    });

    if (!response.result.values || response.result.values.length === 0) {
      throw new Error('No se encontraron datos en la fila');
    }

    const [nombre, correo, codigo] = response.result.values[0];
    const fecha = new Date().toLocaleString();

    // 2. SEGUNDO: Escribir en Diploma (antes de eliminar)
    const writeSuccess = await writeToDiplomaSheet(
      nombre,
      correo,
      codigo,
      fecha
    );

    if (!writeSuccess) {
      throw new Error('Falló la escritura en Diploma');
    }

    // 3. TERCERO: Solo si se escribió correctamente, eliminar de Validacion
    const deleteSuccess = await deleteValidatedRow(rowNumber);

    if (!deleteSuccess) {
      throw new Error('Falló la eliminación en Validacion');
    }

    return true;
  } catch (err) {
    console.error('Error en el proceso completo:', err);
    alert(`Error: ${err.message}`);
    return false;
  }
}
