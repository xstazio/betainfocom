const accordeonHeaders = document.querySelectorAll('.accordeon__header')

accordeonHeaders.forEach(header => {
    header.addEventListener('click', event => {
        console.log(header.parentElement)
        header.parentElement.classList.toggle('accordeon--open')
    })
})