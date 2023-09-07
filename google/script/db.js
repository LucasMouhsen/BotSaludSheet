// db.js
const sql = require('mssql');

const sqlConfig = {
    user: process.env.user,
    password: process.env.password,
    server: process.env.server,
    database: process.env.database,
    port: process.env.port,
    options: {
        trustServerCertificate: true
    }
};
// Función para ejecutar una consulta SQL
async function executeQuerydb(turn_Fecha, pers_NumeroDocumento, nome_Descripcion) {
    try {
      await sql.connect(sqlConfig);
      const request = new sql.Request();
      
      // Define tu consulta SQL aquí
      const queryString = `SELECT * FROM salud_atencion_pacientes_turnos sapt
      WHERE turn_Fecha = '${turn_Fecha}'
      AND pers_NumeroDocumento = '${pers_NumeroDocumento}'
      and nome_Descripcion = '${nome_Descripcion}'`;
      // Ejecuta la consulta con parámetros
      const result = await request
        .input("turn_Fecha", sql.VarChar, turn_Fecha)
        .input("pers_NumeroDocumento", sql.VarChar, pers_NumeroDocumento)
        .input("nome_Descripcion", sql.VarChar, nome_Descripcion)
        .query(queryString);
  
      return result.recordset; // Devuelve los resultados
    } catch (error) {
      console.error("Error al ejecutar la consulta:", error);
      throw new Error("An error occurred while executing the query.");
    } finally {
      sql.close(); // Cierra la conexión después de la consulta
    }
  }
  
  module.exports = {
    executeQuerydb,
  };