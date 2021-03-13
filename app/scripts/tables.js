const tables = document.querySelectorAll('table:not(.table--inline)')

// style="overflow-x:auto;"
const wrapperTemplate = document.createElement('div')
wrapperTemplate.style.overflowX = 'auto'

tables.forEach(table => {
    const parent = table.parentNode
    const wrapper = parent.appendChild(wrapperTemplate)
    wrapper.appendChild(table)
})

