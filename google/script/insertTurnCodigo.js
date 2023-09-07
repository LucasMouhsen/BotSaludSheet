const { google } = require("googleapis");
const { executeQuerydb } = require("./db");

async function getAuthSheets() {
    const auth = new google.auth.GoogleAuth({
        keyFilename: "credentials.json",
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const client = await auth.getClient();

    const googleSheets = google.sheets({
        version: "v4",
        auth: client,
    });

    const spreadsheetId = "1hT0QL3EIrXnnLDj2YZ82JbyAm_8UteVW8sjrXetRNSA";

    return {
        auth,
        client,
        googleSheets,
        spreadsheetId,
    };
}

async function updateTurnCodigo() {
    const { googleSheets, auth, spreadsheetId } = await getAuthSheets();
    const response = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: "Hoja 1",
    });
    const values = response.data.values;
    // Recorrer todos los registros y actualizar celda "CANCELAR" si el código coincide
    for (let i = 1; i < values.length; i++) { // Comenzar en 1 para omitir la fila de encabezados
        let turn_Fecha = values[i][4]
        let pers_NumeroDocumento = values[i][1]
        let nome_Descripcion = values[i][3]
        let result
        if (!values[i][6]) {
            if (turn_Fecha || pers_NumeroDocumento || nome_Descripcion) {
                result = await executeQuerydb(turn_Fecha, pers_NumeroDocumento, nome_Descripcion);

                if (result.length > 0) {
                    // Verifica si hay resultados antes de asignar turn_Codigo
                    values[i][6] = result[0].turn_Codigo;
                } else {
                    console.log(`No se encontró turn_Codigo válido para la fila ${i}`);
                }
            }
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
updateTurnCodigo()

/* module.exports = {getAuthSheets} */