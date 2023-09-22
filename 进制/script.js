function convertDecimalToBase(decimalPart, base, precision = 5) {
    let result = ".";
    for (let i = 0; i < precision; i++) {
        decimalPart *= base;
        let integerPart = Math.floor(decimalPart);
        result += integerPart.toString(base);
        decimalPart -= integerPart;

        if (decimalPart === 0) break;
    }
    return result;
}

function convertValue() {
    const inputValue = document.getElementById("inputValue").value;
    const inputBase = parseInt(document.getElementById("inputBase").value);

    const parts = inputValue.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? `0.${parts[1]}` : 0;

    let decimalValueInt = parseInt(integerPart, inputBase);
    let decimalValueDec = parseFloat(decimalPart);

    document.getElementById("outputBinary").textContent = decimalValueInt.toString(2) + convertDecimalToBase(decimalValueDec, 2);
    document.getElementById("outputOctal").textContent = decimalValueInt.toString(8) + convertDecimalToBase(decimalValueDec, 8);
    document.getElementById("outputDecimal").textContent = decimalValueInt.toString(10) + (decimalPart === 0 ? "" : ".");
    document.getElementById("outputHex").textContent = decimalValueInt.toString(16).toUpperCase() + convertDecimalToBase(decimalValueDec, 16);
}

// 初始转换
convertValue();
