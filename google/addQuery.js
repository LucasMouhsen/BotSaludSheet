const { getAuthSheets } = require("./oAuth");

async function appendToGoogleSheets(data) {
  try {
    const { googleSheets, auth, spreadsheetId } = await getAuthSheets();

    // Obtén la última fila no vacía en la hoja
    const response = await googleSheets.spreadsheets.values.get({
      spreadsheetId,
      range: "A:A", // Asegúrate de especificar la columna que contiene datos
      valueRenderOption: "UNFORMATTED_VALUE",
    });

    const lastRowIndex = response.data.values ? response.data.values.length : 0;

    // Convierte los datos en el formato que deseas agregar a la hoja
    const rows = data.map((fila) => [
      fila.nombre,
      fila.fechaTurno,
      fila.ubicación,
      fila.calle,
      fila.altura,
      fila.especialidad,
      fila.numero,
      fila.mediMedico,
      fila.turnCodigo,
      fila.envio,
    ]);

    // Inserta los datos debajo de la última fila
    await googleSheets.spreadsheets.values.append({
      spreadsheetId,
      range: `A${lastRowIndex + 2}`, // Asegúrate de especificar el rango correcto
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: {
        values: rows,
      },
    });

    console.log("Datos agregados a Google Sheets con éxito.");

    // Cierra la conexión
    auth.close();
  } catch (error) {
    console.error("Error al agregar datos a Google Sheets:", error);
  }
}

module.exports = {appendToGoogleSheets}