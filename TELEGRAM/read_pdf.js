const fs = require('fs');
const PDFParse = require('pdf-parse').PDFParse;

const dataBuffer = fs.readFileSync('JORANA IA — Sistema de Revisión Inteligente de Tesis.pdf');

PDFParse(dataBuffer).then(function(data) {
    console.log(data.text);
}).catch(function(error){
    console.error(error);
});
