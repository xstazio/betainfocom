const header = document.querySelector('header')
const navToggle = document.getElementById('nav-toggle')

document.addEventListener('click', e => {
    let targetElement = e.target // clicked element

    do {
        if (targetElement == header) {
            return
        }
        targetElement = targetElement.parentNode;
    } while (targetElement)

    if (navToggle) navToggle.checked = false
})