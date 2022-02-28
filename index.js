// Crear una fila de la tabla de eventos en el DOM y retornarla
const createEventsRow = (number, events, squirrel) => {
    const newrow = document.createElement("tr")
    const idCol = document.createElement("td")
    idCol.innerText = `${number}`
    const eventsCol = document.createElement("td")
    eventsCol.innerText = events
    const squirrelCol = document.createElement("td")
    squirrelCol.innerText = squirrel.toString()
    if (squirrel) {
        newrow.classList.add("trueRow")
    }
    newrow.append(idCol, eventsCol, squirrelCol)
    return newrow
}

// Crear una lista para la tabla de correlaciones y añadirla al DOM
const createCorrelationsTable = (correlations, tbody) => {
    for (let i = 0; i < correlations.length; i++) {
        const correlation = correlations[i]

        const newrow = document.createElement("tr")
        const idCol = document.createElement("td")
        idCol.innerText = `${i + 1}`
        const eventCol = document.createElement("td")
        eventCol.innerText = correlation.event
        const mccCol = document.createElement("td")
        mccCol.innerText = correlation.mcc.toString()
        newrow.append(idCol, eventCol, mccCol)
        tbody.append(newrow)
    }
}

const tracker = {}

//Registrar cuando se encuentra un evento en un log y sumar
const registerNewEvent = (newEvent, positive) => {
    if (positive) {
        tracker[newEvent].tp = tracker[newEvent].tp + 1
    } else {
        tracker[newEvent].fp = tracker[newEvent].fp + 1
    }
}

// Registrar cuando en un log no se encontro un event y sumar
const logMissingEvents = (missingEvent, positive) => {
    if (positive) {
        tracker[missingEvent].fn = tracker[missingEvent].fn + 1
    } else {
        tracker[missingEvent].tn = tracker[missingEvent].tn + 1
    }
}

//Calcular el MCC
const calcMCC = ({tn, fn, tp, fp}) => {
    return (tp * tn - fp * fn) / Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn))
}

//Descargar el JSON usando Fetch API
fetch("https://gist.githubusercontent.com/josejbocanegra/b1873c6b7e732144355bb1627b6895ed/raw/d91df4c8093c23c41dce6292d5c1ffce0f01a68b/newDatalog.json")
    .then(response => response.json())
    .then(data => {
        console.log(data)
        const tbody1 = document.getElementById("eventstbody")
        const tbody2 = document.getElementById("correlationtbody")

        // Popular el tracker con todos los eventos encontrados
        for (const log of data) {
            for (const event of log.events) {
                if (!tracker[event]) {
                    tracker[event] = {
                        tn: 0,
                        fn: 0,
                        tp: 0,
                        fp: 0
                    }
                }
            }
        }
        // Ir por cada entrada de los datos y crear la tabla de eventos, registrar eventos en el tracker
        for (let i = 0; i < data.length; i++) {
            const log = data[i]
            // Create events table and populate it
            tbody1.append(createEventsRow(i + 1, log.events.toString(), log.squirrel))

            //Logging true and false positives
            for (const event of log.events) {
                registerNewEvent(event, log.squirrel)
            }
            //Logging true and false negatives
            for (const event in tracker) {
                if (!log.events.includes(event)) {
                    logMissingEvents(event, log.squirrel)
                }
            }
        }

        // Calcular las correlaciones de cada evento y guardarlo en la lista de correlations
        const correlations = []
        for (const event in tracker) {
            const counts = tracker[event]
            correlations.push({
                event: event,
                mcc: calcMCC(counts)
            })

        }
        // Ordenar la lista de correlaciones en orden descendiente
        correlations.sort((a, b) => b.mcc - a.mcc)
        //Crear la tabla de correlaciones
        createCorrelationsTable(correlations, tbody2)
    })

