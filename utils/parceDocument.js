function parseDocument(input) {
    // Verificar si la cadena contiene al menos un dígito
    if (/\d/.test(input)) {
        // Quitar todas las letras de la cadena y dejar solo los números
        const numeros = input.replace(/\D/g, '');

        // Verificar si hay un número de 7 u 8 dígitos en la cadena
        return /^\d{7,8}$/.test(numeros);
    }

    return false;
}

module.exports = {parseDocument}