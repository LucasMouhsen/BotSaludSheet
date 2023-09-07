const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const JsonFileAdapter = require('@bot-whatsapp/database/json')
const { parseDocument } = require('./utils/parceDocument')
const { executeQuery } = require('./middleware/db')
const { updateCancelValueForCode } = require('./google/sheets')


const inputFlow1 = ['1', 'uno', 'confirmo', 'confirmar']
const inputFlow2 = ['2', 'dos', 'cancelo', 'cancelar']
const inputFlow3 = ['info', 'informacion', 'imfo', 'imformacion']
const combinedArray = inputFlow1.concat(inputFlow2);

const fs = require('fs');
/* const flowInfo3 = addKeyword(inputFlow3)
    .addAnswer(
        [
            'Ingresa su *dni* para verificar su turno mas cercano'
        ],
        { capture: true },
        async (ctx, { fallBack, flowDynamic }) => {

            if (!parseDocument(ctx.body)) {
                return fallBack()
            }
            const studies = await executeQuery(ctx);
            return flowDynamic(studies)
        }
    )
 */
const flowInfo1 = addKeyword(combinedArray)
    .addAnswer(
        [
            'Muchas gracias por responder',
        ],
        null,
        async (ctx, { fallBack, flowDynamic }) => {
            if (inputFlow1.some(item => ctx.body.includes(item))) {
                /* aplica en google Sheets */
                fs.readFile('dbPy.json', 'utf8', async (err, data) => {
                    if (err) {
                        console.error('Error al leer el archivo:', err);
                        return;
                    }
                    const registros = JSON.parse(data)
                    
                    for (let i = registros.length - 1; i >= 0; i--) {
                        console.log(registros[i].from === ctx.from);
                        if (registros[i].from == ctx.from) {
                            await updateCancelValueForCode(registros[i].turnCodigo, '1')
                            return flowDynamic(['Gracias por confirmar su turno'])
                        }
                      }
                })
                
            } else if (inputFlow2.some(item => ctx.body.includes(item))) {
                fs.readFile('dbPy.json', 'utf8', async (err, data) => {
                    if (err) {
                        console.error('Error al leer el archivo:', err);
                        return;
                    }
                    const registros = JSON.parse(data)
                    
                    for (let i = registros.length - 1; i >= 0; i--) {
                        console.log(registros[i].from === ctx.from);
                        if (registros[i].from == ctx.from) {
                            await updateCancelValueForCode(registros[i].turnCodigo, '2')
                            return flowDynamic(['Turno cancelado'])
                        }
                      }
                })
            } else {
                var inputFlowC1 = inputFlow1.join(', ');
                var inputFlowC2 = inputFlow2.join(', ');
                return flowDynamic(['Debes responder con:\n\n('+inputFlowC1+ ') Para confirmar\n('+ inputFlowC2+ ') Para cancelar'])
            }
        }
    )
const main = async () => {
    const adapterDB = new JsonFileAdapter()
    const adapterFlow = createFlow([flowInfo1])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
