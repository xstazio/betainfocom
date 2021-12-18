const calculator = document.getElementById('calculation')
const filePath = '/files/SPB_price_Beta_2021.json'
let jsonData

const changeEvent = new Event('change')

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
const dimensionsParametersBlock = document.getElementById('dimensions_parameters_block')
const dimensionsItems = document.getElementById('dimensions_items')
const dimensionsItemTemplate = document.getElementById('dimensions_item_template')
const addItemButton = document.getElementById('add_item')

// Параметры груза
const weightInput = document.getElementById('weight')
const volumeInput = document.getElementById('volume')
const lengthInput = document.getElementById('length')
const widthInput = document.getElementById('width')
const heightInput = document.getElementById('height')
const itemsCountVolumeWeightInput = document.getElementById('items_count_volume_weight')
// const dimensionsParameters = document.getElementById('dimensions_parameters')

const dimenstionParametersHiddenInput = document.createElement('input')
dimenstionParametersHiddenInput.type = 'hidden'
dimenstionParametersHiddenInput.name = 'dimension_parameters_hidden'

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

// Параметры для вывода на странице полного калькулятора
const volumeFinal = document.getElementById('volume_final')
const weightFinal = document.getElementById('weight_final')

const nameInput = document.getElementById('name')
const phoneInput = document.getElementById('phone')
const emailInput = document.getElementById('email')

// Параметры для рассчета
let calcParams
const calcParamsInitial = {
    cityFrom: undefined,
    cityTo: undefined,
    weight: 1,
    volume: .1, 
    length: .1,
    width: .1,
    height: .1,
    expeditionFrom: false,
    expeditionTo: false,
    calculateBy: 'volumeWeight',
    itemsCountVolumeWeight: 1,
    itemsDimensions: [
        {length: 1, width: 1, height: 1, weight: 1, count: 1}
    ],
    paletting: false,
    palletsCount: 1,
    softPacking: false,
    woodenLath: false,
    insurance: false,
    insuranceCost: 1,
    returnDocuments: false
}

const resetFormLink = document.getElementById('reset_form')
const totalPriceOutput = document.getElementById('total_price')
const totalPriceHiddenInput = document.getElementById('total_price_hidden_input')

let totalPrice = 0

getDataAndStartCalculation() //ВХОД

// Сброс данных формы
if (resetFormLink) {
    resetFormLink.addEventListener('click', e => {
        e.preventDefault()
        
        resetForm()
        calcParams.cityFrom = undefined
        calcParams.cityTo = undefined
    })
}

$(document).on('af_complete', (event, response) => {
    if (response.success) {
        if (modal) modal.classList.remove('modal--open')
        resetForm()
        calcParams = JSON.parse(JSON.stringify(calcParamsInitial))
    }
})

function getDataAndStartCalculation() {    
    if (!calculator) return // Если калькулятора нет на странице

    resetForm()

    // Получаем данные
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
}

// Запускаем калькулятор
function initCalculator(dataObj) {
    calcParams = JSON.parse(JSON.stringify(calcParamsInitial))

    // Заполняем селект citiesFrom
    populateDatalist(datalistFrom, getCitiesFrom(dataObj))

    // Получаем дополнительные параметры, потому что они не будут меняться
    calcParams.palettingPrice = parseFloat(dataObj['фиксированные'][0]['Паллетирование, за паллет'])
    calcParams.softPackingPrice = parseFloat(dataObj['фиксированные'][0]['Мягкая упаковка, за м3'])
    calcParams.woodenLathPrice = parseFloat(dataObj['фиксированные'][0]['Деревянная обрешетка, за м3'])
    calcParams.insuranceRate = parseFloat(dataObj['фиксированные'][0]['Страховой тариф, %'])
    calcParams.returnDocumentsPrice = parseFloat(dataObj['фиксированные'][0]['Вернуть документы'])

    calculator.addEventListener('change', event => {
        calcParams.expeditionFrom = expeditionFromRadio[0].checked
        calcParams.expeditionTo = expeditionToRadio[0].checked
        calcParams.weight = parseFloat(weightInput.value) || 1
        calcParams.volume = parseFloat(volumeInput.value) || 0.1
        if (lengthInput) calcParams.length = parseFloat(lengthInput.value) || .1
        if (widthInput) calcParams.width = parseFloat(widthInput.value) || .1
        if (heightInput) calcParams.height = parseFloat(heightInput.value) || .1

        if (shipmentTerminalFromInput && expeditionFromRadio[1]?.checked) {
            shipmentTerminalFromInput.value = getShipmentTerminal(dataObj, calcParams.cityFrom)
        } else {
            if (shipmentTerminalFromInput) shipmentTerminalFromInput.value = ''
        }

        if (shipmentTerminalToInput && expeditionToRadio[1]?.checked && calcParams.cityFrom) {
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
        if (shipmentOptionsRadio.length) { // вес/объем
            if (shipmentOptionsRadio[0].checked) {
                volumeWeightParametersBlock.classList.remove('hidden')
                dimensionsParametersBlock.classList.add('hidden')
                calcParams.calculateBy = 'volumeWeight'
            } else if (shipmentOptionsRadio[1]?.checked) { // габариты
                volumeWeightParametersBlock.classList.add('hidden')
                dimensionsParametersBlock.classList.remove('hidden')
                calcParams.calculateBy = 'dimensions';
                populateDimensionsItems()
            }
        }

        // Указание кол-ва мест
        if (itemsCountVolumeWeightInput) calcParams.itemsCountVolumeWeight = parseInt(itemsCountVolumeWeightInput.value, 10)

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
        if (returnDocumentsInput) calcParams.returnDocuments = returnDocumentsInput.checked;

        // Подсчет подитога
        if (calcParams.cityFrom && calcParams.cityTo) {
            if (volumeOutput) {
                if ((calcParams.calculateBy === 'volumeWeight')) { // Вес/объем
                    volumeOutput.innerText = (calcParams.volume * calcParams.itemsCountVolumeWeight).toFixed(4)
                } else { // Габариты
                    volumeOutput.innerText = calcVolumeAndWeightForMultiple(calcParams).volume.toFixed(4)
                }
            }
            if (weightOutput) {
                if (calcParams.calculateBy === 'volumeWeight') { // Вес/объем
                    weightOutput.innerText = calcParams.weight * calcParams.itemsCountVolumeWeight
                } else { // Габариты
                    let totalWeight = 0
                    calcParams.itemsDimensions.forEach(item => {
                        totalWeight += item.weight * item.count
                    })
                    weightOutput.innerText = totalWeight.toFixed(4)
                }
            }
            if (addressFromOutput) addressFromOutput.innerText = calcParams.cityFrom
            if (addressToOutput) addressToOutput.innerText = calcParams.cityTo
            if (addressFromExpeditionOutput) {
                addressFromExpeditionOutput.innerText = calcParams.expeditionFrom ? 'забор от адреса' : 'забор из терминала'
            }
            if (addressToExpeditionOutput) {
                addressToExpeditionOutput.innerText = calcParams.expeditionTo ? 'доставка до адреса' : 'доставка до терминала'
            }

            if (addressFromPrice && addressToPrice) {
                addressFromPrice.innerText = calculateExpeditionCost(dataObj['экспедирование'], calcParams).from.toFixed(2)
                addressToPrice.innerText = calculateExpeditionCost(dataObj['экспедирование'], calcParams).to.toFixed(2)
            }

            // Расчет стоимости доставки без доп услуг
            if (interterminalShipmentOutput && shipmentCostOutput) {
                let cityFromObj = dataObj[calcParams.cityFrom]
                let cityToObj = getCityObj(cityFromObj, calcParams.cityTo)
                let cost

                if (calcParams.calculateBy === 'dimensions') {
                    // calcParams.weight = 0
                    // calcParams.volume = calcParams.length * calcParams.width * calcParams.height
                }
                cost = calculateShipmentCost(cityToObj, calcParams)
                interterminalShipmentOutput.innerText = cost.toFixed(2)
                shipmentCostOutput.innerText = (cost + calculateExpeditionCost(dataObj['экспедирование'], calcParams).from + calculateExpeditionCost(dataObj['экспедирование'], calcParams).to).toFixed(2) + ' ₽'
            }

            if (palettingOutput) palettingOutput.innerText = calcPaletting(calcParams).toFixed(2)
            if (packingOutput) packingOutput.innerText = calcPacking(calcParams).toFixed(2)
            if (lathOutput) lathOutput.innerText = calcLath(calcParams).toFixed(2)
            if (insuranceOutput) insuranceOutput.innerText = calcInsurance(calcParams).toFixed(2)
            if (returnDocumentsOutput) returnDocumentsOutput.innerText = calcDocuments(calcParams).toFixed(2)
        }

        // ФИНАЛЬНЫЙ РАССЧЕТ
        if (calcParams.cityFrom && calcParams.cityTo) {
            totalPrice = calculateTotalPrice(dataObj, calcParams)
            totalPriceOutput.innerText = `${totalPrice.toFixed(2)} ₽` 
            if (totalPriceHiddenInput) totalPriceHiddenInput.value = totalPrice.toFixed(2)
        }
    })

    document.addEventListener('change', e => { // ВЫНЕСТИ!!!
        if (e.target.getAttribute('data-parameter')) {
            calcParams.itemsDimensions[e.target.parentNode.parentNode.getAttribute('data-id')][e.target.getAttribute('data-parameter')] = parseFloat(e.target.value)
            calculator.dispatchEvent(changeEvent)
        }
    })

    if (addItemButton) {
        addItemButton.addEventListener('click', (e) => {
            e.preventDefault()
            calcParams.itemsDimensions.push(JSON.parse(JSON.stringify(calcParamsInitial.itemsDimensions[0])))
            console.log('calcParams.itemsDimensions', calcParams.itemsDimensions)
            calculator.dispatchEvent(changeEvent)
        })
    }

    document.addEventListener('click', e => { // remove_item
        if (e.target.classList.contains('remove_item')) {
            e.preventDefault()
            calcParams.itemsDimensions.splice(e.target.getAttribute('data-remove-id'), 1)
            calculator.dispatchEvent(changeEvent)
        }
    })

    // Выбор города отправки
    datalistFromInput.addEventListener('change', (event) => {
        calcParams.cityFrom = event.target.value.trim()
        // console.log('datalistFromInput', datalistFromInput.value)
        
        populateSelect(selectTo, getCitiesTo(dataObj, calcParams))

        calcParams.cityTo = selectTo.options[selectTo.selectedIndex].value
        
        // Разблокируем selectTo
        selectTo.disabled = calcParams.cityFrom ? false : true
    })
    
    // Выбор города получения
    selectTo.addEventListener('change', event => {
        calcParams.cityTo = event.target.value.trim()

        if (!getShipmentTerminal(dataObj, calcParams.cityTo)) { // Не найден терминал для этого города
            expeditionToRadio[1].disabled = true
            if (shipmentTerminalToInput) shipmentTerminalToInput.disabled = true
            expeditionToRadio[0].checked = true
            calcParams.expeditionTo = true
        } else {
            expeditionToRadio[1].disabled = false
            if (shipmentTerminalToInput) shipmentTerminalToInput.disabled = false
            calcParams.expeditionTo = (expeditionToRadio[0].checked === true)
        }
    })
}

// Финальная сумма
function calculateTotalPrice(dataObj, calcParams) {
    let cityFromObj = dataObj[calcParams.cityFrom]
    let cityToObj
    let extras = 
        calcPaletting(calcParams)
        + calcInsurance(calcParams)
        + calcDocuments(calcParams)
        + calcPacking(calcParams)
        + calcLath(calcParams)
        + calculateExpeditionCost(dataObj['экспедирование'], calcParams).from
        + calculateExpeditionCost(dataObj['экспедирование'], calcParams).to
        
    cityToObj = getCityObj(cityFromObj, calcParams.cityTo)

    // console.log('calculateShipmentCost(cityToObj, calcParams) + extras', calculateShipmentCost(cityToObj, calcParams) + extras)
    return calculateShipmentCost(cityToObj, calcParams) + extras
    
}

// Стоимость доставки без дополнительных услуг и экспедирования
function calculateShipmentCost(cityToObj, calcParams) {
    let weightPrice = 0
    let volumePrice = 0

    if (calcParams.calculateBy === 'volumeWeight') {
        weightPrice = parseFloat(calcParams.weight) * getWeightPrice(cityToObj, calcParams) * calcParams.itemsCountVolumeWeight
        volumePrice = parseFloat(calcParams.volume) * getVolumePrice(cityToObj, calcParams) * calcParams.itemsCountVolumeWeight
    } else {
        let weight = 0
        let volume = 0
        calcParams.itemsDimensions.forEach(item => {
            weight += item.weight * item.count
            volume += item.length * item.width * item.height * item.count
        })
        weightPrice = weight * getWeightPrice(cityToObj, calcParams)
        volumePrice = volume * getVolumePrice(cityToObj, calcParams)
    }

    return Math.max(
        parseFloat(cityToObj['Мин стоимость']),
        weightPrice,
        volumePrice
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

// Datalist для городов From
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

// Select для городов To
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
            console.log(shipmentTerminal)
        } else {
            // shipmentTerminal = '' // если в таблице его не было. такого не должно случаться
            console.warn('Адрес терминала не найден!')
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
            from: (calcParams.expeditionFrom ? getExpeditionData(cityFromObj, calcParams) : 0),
            to: (calcParams.expeditionTo ? getExpeditionData(cityToObj, calcParams) : 0)
         }
}

function getExpeditionData(cityObj, calcParams) {
    let expeditionWeight = 0
    let expeditionVolume = 0
    let expeditionWeightPrice = 0
    let expeditionVolumePrice = 0

    if (calcParams.calculateBy === 'volumeWeight') {
        expeditionWeight = parseFloat(calcParams.weight) * calcParams.itemsCountVolumeWeight
        expeditionVolume = parseFloat(calcParams.volume) * calcParams.itemsCountVolumeWeight
    } else {
        calcParams.itemsDimensions.forEach(item => {
            expeditionWeight += item.weight * item.count
            expeditionVolume += item.length * item.width * item.height * item.count
        })
    }

    if (expeditionWeight <= 200) {
        expeditionWeightPrice = parseFloat(cityObj['До 200 кг'])
    } else if (expeditionWeight <= 500) {
        expeditionWeightPrice = parseFloat(cityObj['До 500 кг'])
    } else if (expeditionWeight <= 1000) {
        expeditionWeightPrice = parseFloat(cityObj['До 1000 кг'])
    } else if (expeditionWeight <= 2000) {
        expeditionWeightPrice = parseFloat(cityObj['До 2000 кг'])
    } else if (expeditionWeight <= 3000) {
        expeditionWeightPrice = parseFloat(cityObj['До 3000 кг'])
    }  else if (expeditionWeight <= 4000) {
        expeditionWeightPrice = parseFloat(cityObj['До 4000 кг'])
    } else if (expeditionWeight <= 5000) {
        expeditionWeightPrice = parseFloat(cityObj['До 5000 кг'])
    } else {
        expeditionWeightPrice = parseFloat(cityObj['До 20000 кг'])
    }

    if (expeditionVolume <= 1) {
        expeditionVolumePrice = parseFloat(cityObj['До 1 м3'])
    } else if (expeditionVolume <= 2) {
        expeditionVolumePrice = parseFloat(cityObj['До 2 м3'])
    } else if (expeditionVolume <= 4) {
        expeditionVolumePrice = parseFloat(cityObj['До 4 м3'])
    } else if (expeditionVolume <= 10) {
        expeditionVolumePrice = parseFloat(cityObj['До 10 м3'])
    } else if (expeditionVolume <= 15) {
        expeditionVolumePrice = parseFloat(cityObj['До 15 м3'])
    } else if (expeditionVolume <= 20) {
        expeditionVolumePrice = parseFloat(cityObj['До 20 м3'])
    } else if (expeditionVolume <= 25) {
        expeditionVolumePrice = parseFloat(cityObj['До 25 м3'])
    } else {
        expeditionVolumePrice = parseFloat(cityObj['До 90 м3'])
    }

    return Math.max(
        expeditionWeightPrice, 
        expeditionVolumePrice
    )
}

function getWeightPrice(cityToObj, calcParams) {
    let weight = 0

    if (calcParams.calculateBy === 'volumeWeight') {
        weight = calcParams.weight * calcParams.itemsCountVolumeWeight
    } else {
        calcParams.itemsDimensions.forEach(item => {
            weight += item.weight * item.count
        })
    }

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

function getVolumePrice(cityToObj, calcParams) {
    let volume = 0

    if (calcParams.calculateBy === 'volumeWeight') {
        volume = calcParams.volume * calcParams.itemsCountVolumeWeight
    } else {
        calcParams.itemsDimensions.forEach(item => {
            volume += item.length * item.width * item.height * item.count
        })
    }

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

function populateDimensionsItems() {
    dimensionsItems.innerHTML = ''
    calcParams.itemsDimensions.forEach((item, index) => {
        let clone = dimensionsItemTemplate.content.cloneNode(true)
        let clonedItem = clone.querySelector('.dimensions-item')
        let volumeCalculated = item.length * item.width * item.height
        clonedItem.setAttribute('data-id', index)
        clonedItem.querySelectorAll('[data-parameter]').forEach(parameter => {
            parameter.value = item[parameter.getAttribute('data-parameter')]
            parameter.name += index
        })
        item.volume = volumeCalculated
        clonedItem.querySelector('[data-parameter="volume"]').value = volumeCalculated
        clonedItem.querySelector('.remove_item').setAttribute('data-remove-id', index)

        dimensionsItems.appendChild(clonedItem)
        dimenstionParametersHiddenInput.value = JSON.stringify(calcParams.itemsDimensions)
        dimensionsItems.appendChild(dimenstionParametersHiddenInput)
    })
}

function getCityObj(dataObj, city) {
    for (let i = 0, len = dataObj.length; i < len; i++) {
        if (dataObj[i]['undefined'] == city) {
            return dataObj[i]
        }
    }
}

function calcPaletting(calcParams) {
    if (calcParams.paletting) {
        return (calcParams.palettingPrice * calcParams.palletsCount)
    } else {
        return 0
    }
}

function calcPacking(calcParams) {
    if (!calcParams.softPacking) return 0

    if (calcParams.calculateBy === 'volumeWeight') {
        return (calcParams.softPackingPrice * calcParams.volume)
    } else {
        return (calcParams.softPackingPrice * calcVolumeAndWeightForMultiple(calcParams).volume)
    }
}

function calcLath(calcParams) {
    if (!calcParams.woodenLath) return 0

    if (calcParams.calculateBy === 'volumeWeight') {
        return (calcParams.woodenLathPrice * calcParams.volume)
    } else {
        return (calcParams.woodenLathPrice * calcVolumeAndWeightForMultiple(calcParams).volume)
    }
}

function calcInsurance(calcParams) {
    if (calcParams.insurance) {
        return (calcParams.insuranceCost * calcParams.insuranceRate)
    } else {
        return 0
    }
}

function calcDocuments(calcParams) {
    if (calcParams.returnDocuments) {
        return calcParams.returnDocumentsPrice
    } else {
        return 0
    }
}

function calcVolumeAndWeightForMultiple(calcParams) {
    let weight = 0
    let volume = 0

    calcParams.itemsDimensions.forEach(item => {
        weight += item.weight * item.count
        volume += item.length * item.width * item.height * item.count
    })
    return {volume, weight}
}

function resetForm() {
    calculator.reset()
    if (volumeOutput) volumeOutput.innerText = 1
    if (weightOutput) weightOutput.innerText = 1
    if (pickupDays) pickupDays.innerText = '—'
    if (deliveryTime) deliveryTime.innerText = '—'
    if (interterminalShipmentOutput) interterminalShipmentOutput.innerText = '—'
    if (addressFromOutput) addressFromOutput.innerText = '—'
    if (addressFromExpeditionOutput) addressFromExpeditionOutput.innerText = ''
    if (addressToOutput) addressToOutput.innerText = '—'
    if (addressToExpeditionOutput) addressToExpeditionOutput.innerText = ''
    if (addressFromPrice) addressFromPrice.innerText = '—'
    if (addressToPrice) addressToPrice.innerText = '—'
    if (palettingOutput) palettingOutput.innerText = '—'
    if (packingOutput) packingOutput.innerText = '—'
    if (lathOutput) lathOutput.innerText = '—'
    if (insuranceOutput) insuranceOutput.innerText = '—'
    if (returnDocumentsOutput) returnDocumentsOutput.innerText = '—'
    if (totalPriceOutput) totalPriceOutput.innerText = '— ₽'
    if (totalPriceHiddenInput) totalPriceHiddenInput.value = ''
    if (shipmentCostOutput) shipmentCostOutput.innerText = '— ₽'
    if (volumeWeightParametersBlock) volumeWeightParametersBlock.classList.remove('hidden')
    if (dimensionsParametersBlock) dimensionsParametersBlock.classList.add('hidden')
    if (shipmentTerminalToInput) shipmentTerminalToInput.disabled = false
    
    expeditionFromRadio[1].checked = true
    expeditionToRadio[1].checked = true
    
    if (nameInput) nameInput.value = ''
    if (phoneInput) phoneInput.value = ''
    if (emailInput) emailInput.value = ''
}