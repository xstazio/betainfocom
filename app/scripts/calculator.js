(function() {
    const calculator = document.getElementById('calculation')
    const filePath = '/files/SPB_price_Beta_2021.json'
    let jsonData
    
    const datalistFromInput = document.getElementById('address_from_input')
    const datalistFrom = document.getElementById('address_from')
    const selectTo = document.getElementById('address_to')

    const expeditionFromRadio = document.getElementsByName('expedition_from')
    const expeditionToRadio = document.getElementsByName('expedition_to')

    const shipmentTerminalFromInput = document.getElementById('shipment_terminal_from') // readonly
    const shipmentTerminalToInput = document.getElementById('shipment_terminal_to') // readonly

    // Сроки и дни отправки
    const pickupDays = document.getElementById('pickup_days')
    const deliveryTime = document.getElementById('delivery_time')
    
    // Выбор между рассчетом за объем (вес) и габариты
    const shipmentOptionsRadio = document.getElementsByName('shipment_options')
    const volumeWeightParametersBlock = document.getElementById('volume_weight_parameters')
    const dimensionsParametersBlock = document.getElementById('dimensions_parameters')

    // Параметры груза
    const weightInput = document.getElementById('weight')
    const volumeInput = document.getElementById('volume')
    const lengthInput = document.getElementById('length')
    const widthInput = document.getElementById('width')
    const heightInput = document.getElementById('height')
    const itemsCountVolumeWeightInput = document.getElementById('items_count_volume_weight')
    const itemsCountDimensionsInput = document.getElementById('items_count_dimensions')

    // Дополнительные услуги
    const palettingInput = document.getElementById('paletting')
    const palettsCountInput = document.getElementById('pallets_count')
    const softPackingInput = document.getElementById('soft_packing')
    const woodenLathInput = document.getElementById('wooden_lath')
    const insuranceInput = document.getElementById('insurance')
    const insuranceCostInput = document.getElementById('insurance_cost')
    const returnDocumentsInput = document.getElementById('return_documents')

    // Вывод итоговых данных
    const volumeOutput = document.getElementById('volume_output')
    const weightOutput = document.getElementById('weight_output')
    const interterminalShipmentOutput = document.getElementById('interterminal_shipment_output')
    const addressFromOutput = document.getElementById('address_from_output')
    const addressFromExpeditionOutput = document.getElementById('address_from_expedition_output')
    const addressToOutput = document.getElementById('address_to_output')
    const addressToExpeditionOutput = document.getElementById('address_to_expedition_output')
    const addressFromPrice = document.getElementById('address_from_price')
    const addressToPrice = document.getElementById('address_to_price')
    const shipmentCostOutput = document.getElementById('shipment_cost_output')
    const palettingOutput = document.getElementById('paletting_output')
    const packingOutput = document.getElementById('packing_output')
    const lathOutput = document.getElementById('lath_output')
    const insuranceOutput = document.getElementById('insurance_output')
    const returnDocumentsOutput = document.getElementById('return_documents_output')

    const resetFormLink = document.getElementById('reset_form')
    const totalPriceOutput = document.getElementById('total_price')
    
    // Параметры для рассчета
    let calcParams
    const calcParamsInitial = {
        cityFrom: '',
        cityTo: '',
        weight: 1,
        volume: .1, 
        length: .1,
        width: .1,
        height: .1,
        expeditionFrom: false,
        expeditionTo: false,
        calculateBy: 'volumeWeight',
        itemsCountVolumeWeight: 1, // Пока нигде не учитывается
        itemsCountDimensions: 1,
        paletting: false,
        palletsCount: 1,
        softPacking: false,
        woodenLath: false,
        insurance: false,
        insuranceCost: 1,
        returnDocuments: false
    }

    let totalPrice = 0 // Возможно, нужно сделать скрытое поле, чтобы отправлять с формой финальную сумму

    // Параметры для вывода на странице полного калькулятора
    const volumeFinal = document.getElementById('volume_final')
    const weightFinal = document.getElementById('weight_final')
    
    if (!calculator) return // Если калькулятора нет на странице

    // Получаем данные
    (function() {
        fetch(filePath)
        .then(response => {
            if (response.ok) {
                // console.log('SUCCESS')
            }
            return response.json()
        })
        .then(data => {
            jsonData = data
            initCalculator(jsonData)
        })
        .catch(error => console.log(error))
    })()
    
    // Запускаем калькулятор
    function initCalculator(dataObj) {
        calcParams = Object.assign({}, calcParamsInitial)

        // Заполняем селект citiesFrom
        populateDatalist(datalistFrom, getCitiesFrom(dataObj))

        // Получаем дополнительные параметры, потому что они не будут меняться
        calcParams.palettingPrice = parseFloat(dataObj['фиксированные'][0]['Паллетирование, за паллет'])
        calcParams.softPackingPrice = parseFloat(dataObj['фиксированные'][0]['Мягкая упаковка, за м3'])
        calcParams.woodenLathPrice = parseFloat(dataObj['фиксированные'][0]['Деревянная обрешетка, за м3'])
        calcParams.insuranceRate = parseFloat(dataObj['фиксированные'][0]['Страховой тариф, %'])
        calcParams.returnDocumentsPrice = parseFloat(dataObj['фиксированные'][0]['Вернуть документы'])

        calculator.addEventListener('change', event => {
            calcParams.expeditionFrom = expeditionFromRadio[1].checked
            calcParams.expeditionTo = expeditionToRadio[1].checked
            calcParams.weight = parseFloat(weightInput.value) || 1
            calcParams.volume = parseFloat(volumeInput.value) || 0.1
            if (lengthInput) calcParams.length = parseFloat(lengthInput.value) || .1
            if (widthInput) calcParams.width = parseFloat(widthInput.value) || .1
            if (heightInput) calcParams.height = parseFloat(heightInput.value) || .1

            if (shipmentTerminalFromInput && expeditionFromRadio[3].checked) {
                shipmentTerminalFromInput.value = getShipmentTerminal(dataObj, calcParams.cityFrom)
            } else {
                if (shipmentTerminalFromInput) shipmentTerminalFromInput.value = ''
            }

            if (shipmentTerminalToInput && expeditionToRadio[3].checked && calcParams.cityFrom) {
                if (!getShipmentTerminal(dataObj, calcParams.cityTo)) {
                    // expeditionToRadio[1].checked = true
                }
                shipmentTerminalToInput.value = getShipmentTerminal(dataObj, calcParams.cityTo)
            } else {
                if (shipmentTerminalToInput) shipmentTerminalToInput.value = ''
            }

            // Дни забора и срок доставки
            if (pickupDays && deliveryTime) {
                if (calcParams.cityFrom && calcParams.cityTo) {
                    pickupDays.innerText = getPicupDaysAndDeliveryTime(dataObj, calcParams).pickupDays
                    deliveryTime.innerText = getPicupDaysAndDeliveryTime(dataObj, calcParams).deliveryTime
                } else {
                    pickupDays.innerText = 'Неизв.'
                    deliveryTime.innerText = 'Неизв.'
                }
            }

            // Выбор рассчета по весу/объему или по габаритам
            if (shipmentOptionsRadio.length) {
                if (shipmentOptionsRadio[1].checked) {
                    volumeWeightParametersBlock.classList.remove('hidden')
                    dimensionsParametersBlock.classList.add('hidden')
                    calcParams.calculateBy = 'volumeWeight'
                } else if (shipmentOptionsRadio[3].checked) {
                    volumeWeightParametersBlock.classList.add('hidden')
                    dimensionsParametersBlock.classList.remove('hidden')
                    calcParams.calculateBy = 'dimensions'
                }
            }

            // Указание кол-ва мест
            if (itemsCountVolumeWeightInput) calcParams.itemsCountVolumeWeight = parseInt(itemsCountVolumeWeightInput.value, 10)
            if (itemsCountDimensionsInput) calcParams.itemsCountDimensions = parseInt(itemsCountDimensionsInput.value, 10)

            // Параметры упаковки
            if (palettingInput) {
                calcParams.paletting = palettingInput.checked
                palettsCountInput.disabled = !palettingInput.checked
                if (!palettsCountInput.disabled && !palettsCountInput.value) palettsCountInput.value = calcParams.palletsCount
            }
            if (palettsCountInput && !palettsCountInput.disabled) calcParams.palletsCount = palettsCountInput.value || 1

            if (softPackingInput) calcParams.softPacking = softPackingInput.checked
            if (woodenLathInput) calcParams.woodenLath = woodenLathInput.checked

            // Страховка
            if (insuranceInput) {
                calcParams.insurance = insuranceInput.checked
                insuranceCostInput.disabled = !insuranceInput.checked
                if (!insuranceCostInput.disabled && !insuranceCostInput.value) insuranceCostInput.value = calcParams.insuranceCost
            }
            if (insuranceCostInput && !insuranceCostInput.disabled) calcParams.insuranceCost = insuranceCostInput.value || 1

            // Возврат документов
            if (returnDocumentsInput) calcParams.returnDocuments = returnDocumentsInput.checked

            // Подсчет подитога
            if (calcParams.cityFrom && calcParams.cityTo) {
                if (volumeOutput) volumeOutput.innerText = (calcParams.calculateBy === 'volumeWeight') ?calcParams.volume : (calcParams.length * calcParams.width * calcParams.height).toFixed(4)
                if (weightOutput) weightOutput.innerText = (calcParams.calculateBy === 'volumeWeight') ? calcParams.weight : '—'
                if (addressFromOutput) addressFromOutput.innerText = calcParams.cityFrom
                if (addressToOutput) addressToOutput.innerText = calcParams.cityTo
                if (addressFromExpeditionOutput) {
                    addressFromExpeditionOutput.innerText = calcParams.expeditionFrom ? 'забор от адреса' : 'забор из терминала'
                }
                if (addressToExpeditionOutput) {
                    addressToExpeditionOutput.innerText = calcParams.expeditionTo ? 'доставка до адреса' : 'доставка до терминала'
                }

                if (addressFromPrice && addressToPrice) {
                    addressFromPrice.innerText = calculateExpeditionCost(dataObj['экспедирование'], calcParams).from + ' ₽'
                    addressToPrice.innerText = calculateExpeditionCost(dataObj['экспедирование'], calcParams).to + ' ₽'
                }

                // Расчет стоимости доставки без доп услуг
                if (interterminalShipmentOutput && shipmentCostOutput) {
                    let cityFromObj = dataObj[calcParams.cityFrom]
                    let cityToObj = getCityObj(cityFromObj, calcParams.cityTo)
                    let cost

                    if (calcParams.calculateBy === 'dimensions') {
                        calcParams.weight = 0
                        calcParams.volume = calcParams.length * calcParams.width * calcParams.height
                    }
                    cost = calculateShipmentCost(cityToObj, calcParams)
                    interterminalShipmentOutput.innerText = cost.toFixed(2) + ' ₽'
                    shipmentCostOutput.innerText = (cost + calculateExpeditionCost(dataObj['экспедирование'], calcParams).from + calculateExpeditionCost(dataObj['экспедирование'], calcParams).to).toFixed(2) + ' ₽'
                }

                if (palettingOutput) palettingOutput.innerText = ((calcParams.paletting ? (calcParams.palettingPrice * calcParams.palletsCount).toFixed(2) : 0) || '—') + ' ₽'
                if (packingOutput) {
                    packingOutput.innerText = (calcParams.softPacking ? (calcParams.softPackingPrice * calcParams.volume).toFixed(2) : '—') + ' ₽'
                } 
                if (lathOutput) {
                    lathOutput.innerText = (calcParams.woodenLath ? (calcParams.woodenLathPrice * calcParams.volume).toFixed(2) : '—') + ' ₽'
                }
                if (insuranceOutput) insuranceOutput.innerText = (calcParams.insurance ? (calcParams.insuranceCost * calcParams.insuranceRate).toFixed(2) : '—') + ' ₽'
                if (returnDocumentsOutput) returnDocumentsOutput.innerText = (calcParams.returnDocuments ? calcParams.returnDocumentsPrice.toFixed(2) : '—') + ' ₽'
            }

            // ФИНАЛЬНЫЙ РАССЧЕТ
            if (calcParams.cityFrom && calcParams.cityTo) {
                totalPrice = calculateTotalPrice(dataObj, calcParams)
                totalPriceOutput.innerText = `${totalPrice.toFixed(2)} ₽` 
            }
        })
    
        // Отправка
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
        
        // Получение
        selectTo.addEventListener('change', event => {
            calcParams.cityTo = event.target.value.trim()

            if (!getShipmentTerminal(dataObj, calcParams.cityTo)) { // Не найден терминал для этого города
                expeditionToRadio[3].parentNode.classList.add('hidden')
                if (shipmentTerminalToInput) shipmentTerminalToInput.parentNode.classList.add('hidden')
                expeditionToRadio[1].checked = true
                calcParams.expeditionTo = true
            } else {
                expeditionToRadio[3].parentNode.classList.remove('hidden')
                if (shipmentTerminalToInput) shipmentTerminalToInput.parentNode.classList.remove('hidden')
                calcParams.expeditionTo = (expeditionToRadio[1].checked === true)
            }
        })
        
        // Сброс данных формы
        if (resetFormLink) {
            resetFormLink.addEventListener('click', e => {
                e.preventDefault()
                calculator.reset()
                volumeOutput.innerText = 1
                weightOutput.innerText = 1
                interterminalShipmentOutput.innerText = '— ₽'
                addressFromOutput.innerText = '—'
                addressFromExpeditionOutput.innerText = ''
                addressToOutput.innerText = '—'
                addressToExpeditionOutput.innerText = ''
                addressFromPrice.innerText = '— ₽'
                addressToPrice.innerText = '— ₽'
                palettingOutput.innerText = '— ₽'
                packingOutput.innerText = '— ₽'
                lathOutput.innerText = '— ₽'
                insuranceOutput.innerText = '— ₽'
                returnDocumentsOutput.innerText = '— ₽'
                totalPriceOutput.innerText = '— ₽'
                shipmentCostOutput.innerText = '— ₽'
                initCalculator(jsonData)
            })
        }
    }
})()

// function calculateTotalPrice(dataObj, cityFrom, cityTo, weight = 0, volume = 0, expeditionFrom = false, expeditionTo = false) {
function calculateTotalPrice(dataObj, calcParams) {
    let cityFromObj = dataObj[calcParams.cityFrom]
    let cityToObj
    let extras = 
        (calcParams.paletting ? calcParams.palettingPrice : 0) * calcParams.palletsCount
        + (calcParams.insurance ? calcParams.insuranceCost * calcParams.insuranceRate : 0)
        + (calcParams.returnDocuments ? calcParams.returnDocumentsPrice : 0)
        + calculateExpeditionCost(dataObj['экспедирование'], calcParams).from
        + calculateExpeditionCost(dataObj['экспедирование'], calcParams).to
        
    cityToObj = getCityObj(cityFromObj, calcParams.cityTo)
    if (!cityToObj) return console.warn('Город доставки не найден!')
    
    if (calcParams.calculateBy === 'volumeWeight') { // Считаем по весу или объему
        if (calcParams.softPacking) extras += calcParams.softPackingPrice * calcParams.volume
        if (calcParams.woodenLath) extras += calcParams.woodenLathPrice * calcParams.volume
        
        return calculateShipmentCost(cityToObj, calcParams) + extras

    } else { // Считаем по габаритам
        calcParams.weight = 0
        calcParams.volume = calcParams.length * calcParams.width * calcParams.height

        if (calcParams.softPacking) extras += calcParams.softPackingPrice * calcParams.volume
        if (calcParams.woodenLath) extras += calcParams.woodenLathPrice * calcParams.volume

        return calculateShipmentCost(cityToObj, calcParams) + extras
    }
}

// Без дополнительных услуг и экспедирования
function calculateShipmentCost(cityToObj, calcParams) {
    return Math.max(
        parseFloat(cityToObj['Мин стоимость']),
        (parseFloat(calcParams.weight) * getWeightPrice(cityToObj, calcParams) * (calcParams.calculateBy === 'volumeWeight' ? 1 : calcParams.itemsCountDimensions)), // В случае расчета по габаритам calcParams.weight = 0
        (parseFloat(calcParams.volume) * getVolumePrice(cityToObj, calcParams) * (calcParams.calculateBy === 'volumeWeight' ? 1 : calcParams.itemsCountDimensions))
    )
}

// Готовим список городов From
function getCitiesFrom(dataObj){
    let citiesFromFiltered = []

    dataObj['направления перевозки'].forEach(element => {
        citiesFromFiltered.push(element['город отправления по вертикали&#10;Город назначения по горизонтали'])
    });
    return citiesFromFiltered
}

function populateDatalist(datalist, array) {
    array.sort()
    let options = ''

    array.forEach(element => {
        let option = document.createElement('option')
        option.value = element
        datalist.appendChild(option);
    })
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

function getShipmentTerminal(dataObj, city) {
    let shipmentTerminal = ''

    dataObj['адреса региональных складов'].forEach(item => {
        if (item['Город'].trim() == city) { // trim() нужен на случай ошибки в Excel
            shipmentTerminal = item['Адрес склада']
        } else {
            // shipmentTerminal = '' // если в таблице его не было. такого не должно случаться
            // console.warn('Адрес терминала не найден!')
        }
    })
    return shipmentTerminal
}

function getPicupDaysAndDeliveryTime(dataObj, calcParams) {
    let cityFromObj = dataObj[calcParams.cityFrom]
    let cityToObj
    
    cityToObj = getCityObj(cityFromObj, calcParams.cityTo)
    if (!cityToObj) return console.warn('Город доставки не найден!')

    return {pickupDays: cityToObj['Дни недели'], deliveryTime: cityToObj['Время в пути']}
}

function calculateExpeditionCost(expeditionObj, calcParams) {
    let cityFromObj, cityToObj

    cityFromObj = getCityObj(expeditionObj, calcParams.cityFrom)
    cityToObj = getCityObj(expeditionObj, calcParams.cityTo)
    if (!cityFromObj || !cityToObj) return console.warn('Город экспедирования не найден!')
    
    return {
            from: (calcParams.expeditionFrom ? (getExpeditionData(cityFromObj, calcParams) * (calcParams.calculateBy === 'volumeWeight' ? 1 : calcParams.itemsCountDimensions)) : 0),
            to: (calcParams.expeditionTo ? (getExpeditionData(cityToObj, calcParams) * (calcParams.calculateBy === 'volumeWeight' ? 1 : calcParams.itemsCountDimensions)) : 0)
         }
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

    return Math.max(
        expeditionWeight, 
        expeditionVolume
    )
}

function getWeightPrice(cityToObj, calcParams) {
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

function getVolumePrice(cityToObj, calcParams) {
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

function getCityObj(dataObj, city) {
    for (let i = 0, len = dataObj.length; i < len; i++) {
        if (dataObj[i]['undefined'] == city) {
            return dataObj[i]
        }
    }
}