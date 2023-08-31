const wa = require('@open-wa/wa-automate');
const https = require('https').globalAgent.options.ca = require('ssl-root-cas').create();
const mysql = require('mysql');
const mysql_credentials = { host: 'asdasd', user: 'asdasd', password: 'asdasd', database: 'asdasd' };
const axios = require('axios').default;
const delay = require('delay').default; 
const { default: PQueue } = require('p-queue');
const queue = new PQueue({ concurrency: 1 });
const moment = require('moment');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

wa.create({
  headless: true,
  autoRefresh: false,
  blockCrashLogs: true,
  cacheEnabled: false,
  throwErrorOnTosBlock: true,
  logConsole: false,
  logConsoleErrors: false,
  useChrome: true,
  qrLogSkip: false,
  disableSpins: true,
  bypassCSP: true,
  executablePath: '/usr/bin/google-chrome',
  licenseKey: '0E6081BE-7A0644BA-BBB80A3B-A9D9F39C'
}).then(client => app.init(client));

let app = {
  client: null,
  isSending: false,
  parsePhone: message => {
    return message.from.match(/549\d{2}(\d{8})/i) ? message.from.match(/549\d{2}(\d{8})/i)[0] : false;
  },
  parseDocument: message => {
    return message.body.match(/((\d\d)|(\d))(\.|\,)?\d\d\d(\.|\,)?\d\d\d/) ? message.body.match(/((\d\d)|(\d))(\.|\,)?\d\d\d(\.|\,)?\d\d\d/)[0].replace(/[^0-9]/g, '') : false;
  },
  getRandomNumber: (min, max) => {
    return Math.floor(Math.random() * (max - min)) + min;
  },
  init: client => {
    app.client = client;
    client.onMessage(app.onMessage);
    setInterval(app.getReadyLaboratory, 1000 * 60);
  },
  onMessage: async message => {
    if (app.parseDocument(message)) {
      queue.add(() => delay(app.getRandomNumber(3000, 10000)));
      app.validateLaboratory(message);
    } else {
      queue.add(() => delay(app.getRandomNumber(3000, 10000)));
      app.sendDataNeeded(message);
    }
  },
  validateLaboratory: message => {
    let connection = mysql.createConnection(mysql_credentials);
    connection.query('SELECT * FROM laboratories l WHERE l.document = ' + app.parseDocument(message) + ' and l.date > DATE_SUB(now(), INTERVAL 20 DAY) ORDER BY l.date DESC', (err, res, f) => {
      if (err || res.length === 0) {
        return app.sendFailure(message);
      }
      return app.sendLaboratory(res[0], message);
    });
    connection.end();
  },
  sendMessage: (message, body) => {
    let msg = '';
    let spacers = [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '  ', '  ', '  ', '   ', '   '];
    body.split(' ').forEach(word => {
      msg = msg + spacers[Math.floor(Math.random() * spacers.length)] + word;
    });
    queue.add(() => delay(app.getRandomNumber(2000, 3000)));
    queue.add(() => app.client.simulateTyping(message.from, true));
    queue.add(() => delay(app.getRandomNumber(3000, 6000)));
    queue.add(() => app.client.simulateTyping(message.from, false));
    queue.add(() => app.client.sendText(message.from, msg.trim()));
  },
  sendDocument: (message, url, name) => {
    queue.add(() => delay(app.getRandomNumber(2000, 5000)));
    queue.add(() => app.client.sendFile(message.from, url, name + '.pdf', name));
  },
  sendLaboratory: (data, message) => {
    app.sendMessage(message, 'Gracias ' + data.firstname + ', el resultado del hisopado que te realizaste en *_' + data.place + '_* el _' + moment(data.date).format('DD-MM-YYYY') + '_ es *' + (data.result == 'NEGATIVO' || data.result == 'NO DETECTABLE' ? 'NEGATIVO' : 'POSITIVO') + '*.');
    if (data.result == 'POSITIVO' || data.result == 'DETECTABLE') {
      app.sendMessage(message, data.firstname + ", recordá que como persona con COVID POSITIVO *no puede salir de su casa ni puede recibir visitas*. _Los días de aislamiento preventivo son necesarios hasta que lo llamen para darle el alta_.\n\n " +
        "Además, es fundamental cumplir con las siguientes medidas 📝: \n\n " +
        "☑️ Evitar el contacto con personas, especialmente personas de edad avanzada, con enfermedades crónicas o embarazadas. \n " +
        "☑️ Utilizar barbijo en todo momento. \n " +
        "☑️ Limpiar y desinfectar con frecuencia. \n\n\n " +
        "Por consultas relacionadas al seguimiento de casos positivos o altas puede comunicarse al *0800-362-6843* 🤳🏼 👉🏻 de lunes a viernes de 09.00 a 16.00 horas \n " +
        "Tenga presente, frente a un agravamiento de síntomas, comunicarse al 107 SAME 🚑.");
    }
    app.sendMessage(message, "A continuación, te enviamos tu correspondiente certificado.");
    app.sendDocument(message, "https://covid19.msm.gov.ar/api/laboratory/" + data.hash, 'Laboratorio');
    app.sendMessage(message, "*Para frenar el contagio necesitamos de tu compromiso. Muchas gracias!*'");
    if (data.result == 'POSITIVO' || data.result == 'DETECTABLE') {
      app.sendDocument(message, "https://covid19.msm.gov.ar/normativas_casa.pdf", 'Normativas');
    }
    app.setSended(data.hash);
  },
  setSended: hash => {
    let connection = mysql.createConnection(mysql_credentials);
    let timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    connection.query('UPDATE laboratories l SET l.sended = 1, l.wa_sended = \'' + timestamp + '\' WHERE l.hash = \'' + hash + '\'', (err, res, f) => {
    });
    connection.end();
  },
  setContacted: hash => {
    let connection = mysql.createConnection(mysql_credentials);
    let timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    connection.query('UPDATE laboratories l SET l.wa_contacted = \'' + timestamp + '\' WHERE l.hash = \'' + hash + '\'', (err, res, f) => {
    });
    connection.end();
  },
  sendFailure: (message) => {
    app.sendMessage(message, 'Tu resultado aún no figura procesado. Si pasaron 48hs desde su hisopado, por favor póngase en contacto llamando al 0800-222-8324 de Lun a Vier. 08 a 16hs.');
  },
  sendDataNeeded: (message) => {
    let connection = mysql.createConnection(mysql_credentials);
    connection.query("SELECT COUNT(*) as count FROM laboratories l WHERE l.phones LIKE '%" + app.parsePhone(message) + "%' AND l.wa_sended IS NULL", (err, res, f) => {
      if (!err && res.length >= 1 && res[0].count != '0') {
        app.sendMessage(message, 'Hola! Por favor, necesitamos que nos ingreses tu *documento*, para poder buscar el resultado de tu hisopado. Ejemplo: ' + app.getRandomNumber(30000000, 60000000) + '. Por cualquier otra consulta en relación a covid, por favor, comunicate al 6091-7160 interno 6611 de Lun a Vier. 09hs a 16hs.');
      }
    });
    connection.end();
  },
  getReadyLaboratory: () => {
    let curHour = new Date().getHours();
    if (curHour >= 7 && curHour <= 23) {
      let connection = mysql.createConnection(mysql_credentials);
      connection.query('SELECT * FROM laboratories l WHERE l.wa_contacted IS NULL AND l.wa_sended IS NULL AND l.sended IS FALSE AND l.phones REGEXP \'(54911)\' ORDER BY l.`date` ASC LIMIT 1', (err, res, f) => {
        if (res && res.length === 1) {
          return app.sendFirstMessage(res[0]);
        }
      });
      connection.end();
    }
  },
  sendFirstMessage: (data) => {
    data.phones.split('|').forEach(phone => {
      if (phone.substring(0, 3) == '549') {
        phone = phone + '@c.us';
        app.sendMessage({ from: phone }, 'Hola ' + data.firstname + ', nos comunicamos de la Municipalidad de San Miguel para comunicarte que ya tenemos el resultado de tu hisopado. Por favor, necesitamos que nos ingreses tu *documento*, sin puntos ni comas, para poder buscar tu analisis. Ejemplo: ' + app.getRandomNumber(30000000, 60000000) + '. Si creés que es un error, por favor ignorá este mensaje.');
        app.setContacted(data.hash);
      }
    })
  },
};
