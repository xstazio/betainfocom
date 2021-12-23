// const modalOpenButton = document.querySelector('[data-modal-action="open"')
const modalOpenButtons = document.querySelectorAll('.modal_open_button')
const modalCloseButtons = document.querySelectorAll('.modal_close_button')
const modalBody = document.querySelector('.modal__body')

if (modalOpenButtons && modalOpenButtons.length) {
    modalOpenButtons.forEach(button => {
        const modal = document.getElementById(button.dataset.modalId)
        
        button.addEventListener('click', e => {
            e.preventDefault()
            openModal(modal)
        })
    })
}

// Закрыть модальное окно по клику на кнопку
if (modalCloseButtons && modalCloseButtons.length) {
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', e => {
            e.preventDefault()
            closeModal(document.querySelector('.modal--open'))
        })
    })
}

// Закрыть модальное окно по клику снаружи
document.addEventListener('click', e => {
    let targetElement = e.target // clicked element
    const modalOpened = document.querySelector('.modal--open')
    const modalOpenedBody = modalOpened ? modalOpened.querySelector('.modal__body') : undefined
    const modalOpenButtonsArray = Array.from(modalOpenButtons)

    do {
        if (targetElement == modalOpenedBody || modalOpenButtonsArray.includes(targetElement)) {
            return
        }
        targetElement = targetElement.parentNode;
    } while (targetElement)

    closeModal(modalOpened)
})

// document.addEventListener('submit', (e) => {
//     e.preventDefault()
//     // if (modal) modal.classList.remove('modal--open')
// })

function openModal(modal) {
    if (modal) {
        modal.classList.remove('hidden')
        modal.classList.remove('modal--close')
        modal.classList.add('modal--open')
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove('modal--open')
        modal.classList.add('modal--close')
        modal.classList.add('hidden')
    }
}