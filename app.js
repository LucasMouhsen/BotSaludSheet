const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const JsonFileAdapter = require('@bot-whatsapp/database/json')
const { parseDocument } = require('./utils/parceDocument')
const { executeQuery } = require('./middleware/db')
const { updateCancelValueForCode } = require('./google/sheets')


const inputFlow1 = ['1', 'uno', 'confirmo','confirmar', 'si']
const inputFlow2 = ['2', 'dos', 'cancelo','cancelar', 'no']
const inputFlow3 = ['info', 'informacion', 'imfo', 'imformacion']
const combinedArray = inputFlow1.concat(inputFlow2);

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
        async(ctx, { fallBack, flowDynamic }) => {
            if (inputFlow1.some(item => ctx.body.includes(item))) {
                /* aplica en google Sheets */
                await updateCancelValueForCode('123456','1')
                return flowDynamic(['Gracias por confirmar su turno'])
                /* return flowDynamic([
                    '👋 Hola Vecino de San Miguel!\n\n📞 *Seleccione una opción:* 📞\n\n*1* Confirmar turno 📅\n*2* Cancelar turno ❌\n*3* Informacion sobre un turno ℹ️',
                ]); */
            } else if (inputFlow2.some(item => ctx.body.includes(item))){
                await updateCancelValueForCode('123456','2')
                return flowDynamic(['Turno cancelado'])

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
