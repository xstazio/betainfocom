(function() {
    const calculator = document.getElementById('calculation')
    const filePath = '/files/SPB_price_Beta_2021.json'
    
    const datalistFromInput = document.getElementById('address_from_input')
    const datalistFrom = document.getElementById('address_from')
    const selectTo = document.getElementById('address_to')
    const pickDateInput = document.getElementById('pick_date')

    const shipmentTerminalInput = document.getElementById('shipment_terminal') // readonly
    let shipmentTerminal ='' // Название терминала (from или to?)

    const expeditionFromRadio = document.getElementsByName('expedition_from')
    const expeditionToRadio = document.getElementsByName('expedition_to')
    
    const weightInput = document.getElementById('weight')
    
    const volumeInput = document.getElementById('volume')

    const totalPriceOutput = document.getElementById('total_price')
    

    // Параметры для рассчета
    let calcParams = {
        cityFrom: '',
        cityTo: '',
        weight: 1,
        volume: .1, 
        expeditionFrom: false,
        expeditionTo: false
    }

    let totalPrice = 0

    // Параметры для вывода на странице полного калькулятора
    const volumeFinal = document.getElementById('volume_final')
    const weightFinal = document.getElementById('weight_final')
    
    if (!calculator) return // Если калькулятора нет на странице

    fetch(filePath)
        .then(response => {
            if (response.ok) {
                // console.log('SUCCESS')
            }
            return response.json()
        })
        .then(data => initCalculator(data))
        .catch(error => console.log(error))
    
    // Запускаем калькулятор
    function initCalculator(dataObj) {
        
        // Заполняем селект citiesFrom
        populateDatalist(datalistFrom, getCitiesFrom(dataObj))

        calculator.addEventListener('change', event => {
            calcParams.expeditionFrom = expeditionFromRadio[1].checked // Переписать с учетом возможности смены места
            calcParams.expeditionTo = expeditionToRadio[1].checked // Переписать с учетом возможности смены места
            calcParams.weight = weightInput.value || 1
            calcParams.volume = volumeInput.value || 0.1

            totalPrice = calculateTotalPrice(dataObj, calcParams)
            totalPriceOutput.innerText = `${totalPrice} ₽`
        })
    
        datalistFromInput.addEventListener('change', (event) => {
            calcParams.cityFrom = event.target.value.trim()
            // console.log('datalistFromInput', datalistFromInput.value)
            
            populateSelect(selectTo, getCitiesTo(dataObj, calcParams))

            calcParams.cityTo = selectTo.options[selectTo.selectedIndex].value
            
            // Разблокируем selectTo
            selectTo.disabled = calcParams.cityFrom ? false : true
            
            // Если это большой калькулятор (TBD)
            // if (shipmentTerminalInput) shipmentTerminalInput.value = getShipmentTerminal(dataObj, calcParams)
        })
    
        selectTo.addEventListener('change', event => {
            calcParams.cityTo = event.target.value.trim()

            if (!getShipmentTerminal(dataObj, calcParams)) expeditionToRadio[1].checked = true
            
            // Если это большой калькулятор (TBD)
            // if (shipmentTerminalInput) shipmentTerminalInput.value = getShipmentTerminal(dataObj, calcParams)
        })

    }
})()

// Готовим список городов From
function getCitiesFrom(dataObj){
    let citiesFromFiltered = []

    dataObj['направления перевозки'].forEach(element => {
        citiesFromFiltered.push(element['город отправления по вертикали&#10;Город назначения по горизонтали'])
    });
    return citiesFromFiltered
}

// Готовим список городов To
function getCitiesTo(dataObj, calcParams) {
    let citiesToFiltered = []

    dataObj['направления перевозки'].forEach(obj => {

        if (obj['город отправления по вертикали&#10;Город назначения по горизонтали'].trim() == calcParams.cityFrom) { // trim() нужен на случай ошибки в Excel
            let objectFiltered = Object.assign({}, obj) // не забываем про клонирование объекта!
            delete objectFiltered['город отправления по вертикали&#10;Город назначения по горизонтали']
            // console.log(objectFiltered)
            citiesToFiltered = Object.keys(objectFiltered)
            citiesToFiltered.push('')
        }
    })

    return citiesToFiltered
}

function populateDatalist(datalist, array) {
    // return
    array.sort()
    let options = ''

    array.forEach(element => {
        let option = document.createElement('option')
        option.value = element
        datalist.appendChild(option);
    })
}

function populateSelect(select, array) {
    array.sort()
    select.length = 0

    array.forEach(element => {
        let option = document.createElement('option')
        let optionText = element
        
        option.text = optionText
        option.value = optionText
        select.add(option)
    })
}

function getShipmentTerminal(dataObj, calcParams) {
    let shipmentTerminal = ''

    dataObj['адреса региональных складов'].forEach(city => {
        if (city['Город'].trim() == calcParams.cityTo) { // trim() нужен на случай ошибки в Excel
            shipmentTerminal = city['Адрес склада']
        } else {
            // shipmentTerminal = '' // если в таблице его не было. такого не должно случаться
            // console.warn('Адрес терминала не найден!')
        }
    })
    console.log('shipmentTerminal', shipmentTerminal)
    return shipmentTerminal
}

function calculateShipmentTime(dataObj, cityFrom, cityTo) {
    // TBD
}

// function calculateTotalPrice(dataObj, cityFrom, cityTo, weight = 0, volume = 0, expeditionFrom = false, expeditionTo = false) {
function calculateTotalPrice(dataObj, calcParams) {
    let cityFromObj = dataObj[calcParams.cityFrom]
    let cityToObj
    
    for (let i = 0, len = cityFromObj.length; i < len; i++) {
        if (cityFromObj[i]['undefined'] == calcParams.cityTo) {
            cityToObj = cityFromObj[i]
            break
        }
    }

    if (!cityToObj) {
        console.warn('Город доставки не найден!')
        return 0
    }

    console.log(
        `Мин. стоимость: ${parseInt(cityToObj['Мин стоимость'])}`,
        `По весу: ${parseFloat(calcParams.weight) * getWeightPrice(cityToObj, calcParams)}`,
        `По объему: ${parseFloat(calcParams.volume) * getVolumePrice(cityToObj, calcParams)}`,
        calculateExpedition(dataObj['экспедирование'], calcParams) 
    )
    
    return Math.max(
            parseInt(cityToObj['Мин стоимость']),
            (parseFloat(calcParams.weight) * getWeightPrice(cityToObj, calcParams) || 0),
            (parseFloat(calcParams.volume) * getVolumePrice(cityToObj, calcParams) || 0)
        )
        + calculateExpedition(dataObj['экспедирование'], calcParams)
}

// function calculateExpedition(expeditionObj, city, weight = 1, volume = 1) {
function calculateExpedition(expeditionObj, calcParams) {
    let cityFromObj, cityToObj

    for (let i = 0, len = expeditionObj.length; i < len; i++) { // Возможно, сделать такой поиск функцией
        if (expeditionObj[i]['undefined'] == calcParams.cityFrom) {
            cityFromObj = expeditionObj[i]
            break
        }
    }

    for (let i = 0, len = expeditionObj.length; i < len; i++) { // Возможно, сделать такой поиск функцией
        if (expeditionObj[i]['undefined'] == calcParams.cityTo) {
            cityToObj = expeditionObj[i]
            break
        }
    }

    // if (!cityFromObj || !cityToObj) {
    //     console.warn('Город экспедирования не найден!')
    //     return
    // }

    return (calcParams.expeditionFrom ? getExpeditionData(cityFromObj, calcParams) : 0)
        + (calcParams.expeditionTo ? getExpeditionData(cityToObj, calcParams) : 0)
}

function getExpeditionData(cityObj, calcParams) {
    let expeditionWeight, expeditionVolume

    if (calcParams.weight <= 200) {
        expeditionWeight = parseFloat(cityObj['До 200 кг'])
    } else if (calcParams.weight <= 500) {
        expeditionWeight = parseFloat(cityObj['До 500 кг'])
    } else if (calcParams.weight <= 1000) {
        expeditionWeight = parseFloat(cityObj['До 1000 кг'])
    } else if (calcParams.weight <= 2000) {
        expeditionWeight = parseFloat(cityObj['До 2000 кг'])
    } else if (calcParams.weight <= 3000) {
        expeditionWeight = parseFloat(cityObj['До 3000 кг'])
    }  else if (calcParams.weight <= 4000) {
        expeditionWeight = parseFloat(cityObj['До 4000 кг'])
    } else if (calcParams.weight <= 5000) {
        expeditionWeight = parseFloat(cityObj['До 5000 кг'])
    } else {
        expeditionWeight = parseFloat(cityObj['До 20000 кг'])
    }

    if (calcParams.volume <= 1) {
        expeditionVolume = parseFloat(cityObj['До 1 м3'])
    } else if (calcParams.volume <= 2) {
        expeditionVolume = parseFloat(cityObj['До 2 м3'])
    } else if (calcParams.volume <= 4) {
        expeditionVolume = parseFloat(cityObj['До 4 м3'])
    } else if (calcParams.volume <= 10) {
        expeditionVolume = parseFloat(cityObj['До 10 м3'])
    } else if (calcParams.volume <= 15) {
        expeditionVolume = parseFloat(cityObj['До 15 м3'])
    } else if (calcParams.volume <= 20) {
        expeditionVolume = parseFloat(cityObj['До 20 м3'])
    } else if (calcParams.volume <= 25) {
        expeditionVolume = parseFloat(cityObj['До 25 м3'])
    } else {
        expeditionVolume = parseFloat(cityObj['До 90 м3'])
    }

    return Math.max(expeditionWeight, expeditionVolume)
}

function getWeightPrice(cityToObj, calcParams) { // Какой минимальный вес
    if (calcParams.weight <= 500) {
        return parseFloat(cityToObj['До 500 кг'])
    } else if (calcParams.weight <= 1000) {
        return parseFloat(cityToObj['До 1000 кг'])
    } else if (calcParams.weight <= 3000) {
        return parseFloat(cityToObj['До 3000 кг'])
    } else {
        return parseFloat(cityToObj['До 5000 кг'])
    }
}

function getVolumePrice(cityToObj, calcParams) { // Какой минимальный объем?
    if (calcParams.volume <= 2) {
        return parseFloat(parseFloat(cityToObj['До 2 м3'].replace(/,/g, '')))
    } else if (calcParams.volume <= 4) {
        return parseFloat(parseFloat(cityToObj['До 4 м3'].replace(/,/g, '')))
    } else if (calcParams.volume <= 12) {
        return parseFloat(parseFloat(cityToObj['До 12 м3'].replace(/,/g, '')))
    } else {
        return parseFloat(parseFloat(cityToObj['До 20 м3'].replace(/,/g, '')))
    }
}