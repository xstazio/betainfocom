const modalOpenButton = document.querySelector('[data-modal="open"')
const modalCloseButton = document.querySelectorAll('[data-modal="close"')
const modal = document.querySelector('.modal')
const modalBody = document.querySelector('.modal__body')

if (modalOpenButton) {
    modalOpenButton.addEventListener('click', e => {
        openModal(modal)
    })
}

// Закрыть модальное окно по клику на кнопку
if (modalCloseButton && modalCloseButton.length) {
    modalCloseButton.forEach(button => {
        button.addEventListener('click', e => {
            closeModal(modal)
        })
    })
}

// Закрыть модальное окно по клику снаружи
document.addEventListener('click', e => {
    let targetElement = e.target // clicked element

    do {
        if (targetElement == modalBody || targetElement == modalOpenButton) {
            return
        }
        targetElement = targetElement.parentNode;
    } while (targetElement)

    closeModal(modal)
})

document.addEventListener('submit', (e) => {
    e.preventDefault()
    // if (modal) modal.classList.remove('modal--open')
})

function openModal(modal) {
    if (modal) {
        modal.classList.remove('modal--close')
        modal.classList.add('modal--open')
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove('modal--open')
        modal.classList.add('modal--close')
    }
}