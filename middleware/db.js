// db.js
const sql = require('mssql');
const capitalizeOneLetter = require('../utils/capitalizeOneLetter');

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

async function executeQuery(message) {
    const pool = await sql.connect(sqlConfig);
   
    try {
        const query = `SELECT sapt.turn_FechaTurno, paci_Paciente, medi_Medico, sapt.ubic_Descripcion, nome_Descripcion from salud_atencion_pacientes_turnos sapt WHERE sapt.pers_NumeroDocumento = '${message.body}' AND sapt.turn_FechaTurno BETWEEN GETDATE() AND DATEADD(DAY, 20, GETDATE()) ORDER BY sapt.turn_FechaTurno`
        const result = await sql.query(query);
        console.log(query);
        const studies = result ? result.recordset[0]: null;
        if (studies) {
            // Fecha
            const fechaTurnoInicio = new Date(studies.turn_FechaTurno);
            const fechaTurno = new Date(fechaTurnoInicio.getTime());
            fechaTurno.setUTCHours(fechaTurnoInicio.getUTCHours());
            fechaTurno.setUTCMinutes(fechaTurnoInicio.getUTCMinutes());
            const horaTurno = fechaTurno.toLocaleTimeString('es-ES', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' });
            // Nombre
            const nombreCompleto = studies.paci_Paciente
            // Mensaje
            const response = `${capitalizeOneLetter(nombreCompleto)}, usted tiene turno de ${capitalizeOneLetter(studies.nome_Descripcion)}, el día ${fechaTurno.toLocaleDateString()} a las ${horaTurno}hs, con el profesional ${capitalizeOneLetter(studies.medi_Medico)}.\n🔔 *IMPORTANTE:* 🔔\nEn caso de no poder asistir al turno asignado, recordá cancelarlo llamando al ☎️ 0800-222-8324 para que quede disponible a otro paciente que lo necesite.`;
            console.log(response);
            return response
        } else if (!studies) {
            const response = 'Usted no tiene turnos en los siguientes 20 dias.\nSaludos!'
            return response
        }
        
    } catch (error) {
        console.error('Error al ejecutar consulta:', error);
        throw new Error('An error occurred while executing the query.');
    } finally {
        pool.close();
    }
}



module.exports = { executeQuery };

