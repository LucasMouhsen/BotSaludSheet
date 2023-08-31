const { getAuthSheets } = require("./oAuth");

async function updateCancelValueForCode(codeToSearch, newCancelValue) {
  const { googleSheets, auth, spreadsheetId } = await getAuthSheets();

  // Obtener los valores actuales en la hoja
  const response = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: "Hoja 1",
  });
  const values = response.data.values;

  // Recorrer todos los registros y actualizar celda "CANCELAR" si el código coincide
  for (let i = 1; i < values.length; i++) { // Comenzar en 1 para omitir la fila de encabezados
    if (values[i][6] === codeToSearch) { // Comprobar el código en la columna "NÚMERO DE CONTACTO"
      values[i][9] = newCancelValue; // Actualizar celda "CANCELAR" (índice 9)
    }
  }

  // Actualizar todos los registros modificados en la hoja
  await googleSheets.spreadsheets.values.update({
    auth,
    spreadsheetId,
    range: "Hoja 1",
    valueInputOption: "RAW", // O el modo de entrada que prefieras
    resource: {
      values: values,
    },
  });
}


module.exports = { updateCancelValueForCode}


