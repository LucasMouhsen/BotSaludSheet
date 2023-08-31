module.exports = capitalizarPrimeraLetraPalabras = (str) => {
    const palabras = str.split(' ');
    const palabrasCapitalizadas = palabras.map(palabra => {
        const strLower = palabra.toLowerCase();
        return strLower.charAt(0).toUpperCase() + strLower.slice(1);
    });
    return palabrasCapitalizadas.join(' ');
};
