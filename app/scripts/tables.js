const tables = document.querySelectorAll('table.overflow-x:not(.table--inline)')

// style="overflow-x:auto;"
const wrapperTemplate = document.createElement('div')
wrapperTemplate.style.overflowX = 'auto'

tables.forEach(table => {
    const parent = table.parentNode
    console.log(parent)
    const wrapper = parent.appendChild(wrapperTemplate)
    wrapper.appendChild(table)
})

