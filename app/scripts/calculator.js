(function() {
    const calculator = document.getElementById('calculation')
    const filePath = '/files/SPB_price_Beta_2021.json'
    
    let citiesFrom = [''] // Пока не используется
    let cityFrom = ''
    const datalistFromInput = document.getElementById('address_from_input')
    const datalistFrom = document.getElementById('address_from')
    let citiesTo = [''] // Пока не используется
    let cityTo = ''
    const selectTo = document.getElementById('address_to')
    const pickDateInput = document.getElementById('pick_date')

    const shipmentTerminalInput = document.getElementById('shipment_terminal') // readonly
    let shipmentTerminal ='' // Название терминала (from или to?)

    const expeditionFromRadio = document.getElementById('expedition_from')
    const expeditionToRadio = document.getElementById('expedition_from')
    
    const weightInput = document.getElementById('weight')
    
    const volumeInput = document.getElementById('volume')

    const totalPriceOutput = document.getElementById('total_price')

    // Параметры для рассчета
    let weight = 1
    let volume = 1
    let expedition = false
    let totalPrice = 0

    // Параметры для вывода
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
    
        datalistFromInput.addEventListener('change', (event) => {
            cityFrom = event.target.value.trim()
            
            populateSelect(selectTo, getCitiesTo(dataObj, cityFrom))

            cityTo = selectTo.options[selectTo.selectedIndex].value
    
            if (shipmentTerminalInput) shipmentTerminalInput.value = getShipmentTerminal(dataObj, cityTo)
        })
    
        selectTo.addEventListener('change', (event) => {
            cityTo = event.target.value.trim()
            // console.log(cityTo)
    
            if (shipmentTerminalInput) shipmentTerminalInput.value = getShipmentTerminal(dataObj, cityTo)
            
            totalPrice = calculateTotalPrice(dataObj, 'Санкт-Петербург', cityTo, weight, volume, false) // Заменить на cityFrom!!!!!!!!!!!
            totalPriceOutput.innerText = `${totalPrice} ₽`
        })

        weightInput.addEventListener('change', (event) => {
            weight = event.target.value
            totalPrice = calculateTotalPrice(dataObj, 'Санкт-Петербург', cityTo, weight, volume, false) // Заменить на cityFrom!!!!!!!!!!!
            totalPriceOutput.innerText = `${totalPrice} ₽`
        })

        volumeInput.addEventListener('change', (event) => {
            volume = event.target.value
            totalPrice = calculateTotalPrice(dataObj, 'Санкт-Петербург', cityTo, weight, volume, false) // Заменить на cityFrom!!!!!!!!!!!
            totalPriceOutput.innerText = `${totalPrice} ₽`
        })
    
        
    }

    
})()

// Готови список городов From
function getCitiesFrom(dataObj){
    let citiesFromFiltered = []

    dataObj['направления перевозки'].forEach(element => {
        citiesFromFiltered.push(element['город отправления по горизонтали&#10;Город назначения по вертикали'])
    });
    return citiesFromFiltered
}

// Готови список городов To
function getCitiesTo(dataObj, cityFrom) {
    let citiesToFiltered = []

    dataObj['направления перевозки'].forEach(obj => {

        if (obj['город отправления по горизонтали&#10;Город назначения по вертикали'].trim() == cityFrom) { // trim() нужен на случай ошибки в Excel
            let objectFiltered = Object.assign({}, obj) // не забываем про клонирование объекта!
            delete objectFiltered['город отправления по горизонтали&#10;Город назначения по вертикали']
            // console.log(objectFiltered)
            citiesToFiltered = Object.keys(objectFiltered)
        }
    })

    return citiesToFiltered
}

function populateDatalist(myDatalist, array) {
    // return
    array.sort()
    let options = ''

    array.forEach(element => {
        let option = document.createElement('option')
        option.value = element
        myDatalist.appendChild(option);
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

function getShipmentTerminal(dataObj, cityTo) {
    let shipmentTerminal = ''

    dataObj['адреса региональных складов'].forEach(city => {
        if (city['Город'].trim() == cityTo) { // trim() нужен на случай ошибки в Excel
            shipmentTerminal = city['Адрес склада']
        } else {
            // shipmentTerminal = '' // если в таблице его не было. такого не должно случаться
            // console.warn('Адрес терминала не найден!')
        }
    })
    return shipmentTerminal
}

function calculateShipmentTime(dataObj, cityFrom, cityTo) {

}

function calculateTotalPrice(dataObj, cityFrom, cityTo, weight = 0, volume = 0, expeditionFrom = false, expeditionTo = false) {
    let cityFromObj = dataObj[cityFrom]
    let cityToObj
    
    for (let i = 0, len = cityFromObj.length; i < len; i++) {
        if (cityFromObj[i]['undefined'] == cityTo) {
            cityToObj = cityFromObj[i]
            break
        }
    }

    if (!cityToObj) {
        console.warn('Город доставки не найден!')
        return 0
    }

    // totalPrice = cityToObj['Мин стоимость']
    console.log(
        `Мин. стоимость: ${parseInt(cityToObj['Мин стоимость'])}`,
        `По весу: ${parseFloat(weight) * getWeightPrice(cityToObj, weight)}`,
        `По объему: ${parseFloat(volume) * getVolumePrice(cityToObj, volume)}` 
    )
    
    return Math.max(
        parseInt(cityToObj['Мин стоимость']),
        parseFloat(weight) * getWeightPrice(cityToObj, weight),
        parseFloat(volume) * getVolumePrice(cityToObj, volume)
        )
        + calculateExpedition(dataObj['экспедирование'], cityTo, weight, volume)
}

function calculateExpedition(expeditionObj, city, weight = 1, volume = 1) {
    let cityObj, expeditionWeight, expeditionVolume

    for (let i = 0, len = expeditionObj.length; i < len; i++) { // Возможно, сделать такой поиск функцией
        if (expeditionObj[i]['undefined'] == city) {
            cityObj = expeditionObj[i]
            break
        }
    }

    if (!cityObj) {
        console.warn('Город экспедирования не найден!')
        return
    }

    if (weight <= 200) {
        expeditionWeight = parseFloat(cityObj['До 200 кг'])
    } else if (weight <= 500) {
        expeditionWeight = parseFloat(cityObj['До 500 кг'])
    } else if (weight <= 1000) {
        expeditionWeight = parseFloat(cityObj['До 1000 кг'])
    } else if (weight <= 3000) {
        expeditionWeight = parseFloat(cityObj['До 3000 кг'])
    } else if (weight <= 4000) {
        expeditionWeight = parseFloat(cityObj['До 4000 кг'])
    } else if (weight <= 5000) {
        expeditionWeight = parseFloat(cityObj['До 5000 кг'])
    } else if (weight <= 20000) {
        expeditionWeight = parseFloat(cityObj['До 20000 кг'])
    }

    if (volume <= 1) {
        expeditionVolume = parseFloat(cityObj['До 1 м3'])
    } else if (volume <= 2) {
        expeditionVolume = parseFloat(cityObj['До 500 кг'])
    } else if (volume <= 4) {
        expeditionVolume = parseFloat(cityObj['До 1000 кг'])
    } else if (volume <= 10) {
        expeditionVolume = parseFloat(cityObj['До 3000 кг'])
    } else if (volume <= 15) {
        expeditionVolume = parseFloat(cityObj['До 4000 кг'])
    } else if (volume <= 20) {
        expeditionVolume = parseFloat(cityObj['До 5000 кг'])
    } else if (volume <= 25) {
        expeditionVolume = parseFloat(cityObj['До 5000 кг'])
    } else if (volume <= 90) {
        expeditionVolume = parseFloat(cityObj['До 20000 кг'])
    }


    console.log('Экспедирование: ', weight, volume, expeditionWeight, expeditionVolume)
    return Math.max(expeditionWeight, expeditionVolume)

    // console.log(weight, volume, expeditionWeight, expeditionVolume)
}

function getWeightPrice(cityToObj, weight = 0) { // Какой минимальный вес
    if (weight <= 500) {
        return parseFloat(cityToObj['До 500 кг'])
    } else if (weight <= 1000) {
        return parseFloat(cityToObj['До 1000 кг'])
    } else if (weight <= 3000) {
        return parseFloat(cityToObj['До 3000 кг'])
    } else {
        return parseFloat(cityToObj['До 5000 кг'])
    }
}

function getVolumePrice(cityToObj, volume = 0) { // Какой минимальный объем?
    if (volume <= 2) {
        return parseFloat(parseFloat(cityToObj['До 2 м3'].replace(/,/g, '')))
    } else if (volume <= 4) {
        return parseFloat(parseFloat(cityToObj['До 4 м3'].replace(/,/g, '')))
    } else if (volume <= 12) {
        return parseFloat(parseFloat(cityToObj['До 12 м3'].replace(/,/g, '')))
    } else {
        return parseFloat(parseFloat(cityToObj['До 20 м3'].replace(/,/g, '')))
    }
}