const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'utils', 'printDocumentTemplates.js');
let content = fs.readFileSync(filePath, 'utf8');

const mediaPrintCSSOld = `
        @media print {
          @page { margin: 0; size: letter landscape; }
          html, body { width: 11in; height: 8.5in; margin: 0; padding: 0; overflow: hidden; background: white; display: block; position: relative; }
          .print-container { 
            position: absolute;
            right: 0;
            top: -1.25in;
            width: 8.5in;
            height: 11in;
            min-height: auto;
            margin: 0;
            padding: 0.8in 0.6in; 
            border: none;
            box-shadow: none;
            transform-origin: right center;
            transform: scale(0.647);
          }
          .no-print { display: none !important; }
        }
`;

const mediaPrintCSSNew = `
        @media print {
          @page { margin: 0; size: letter landscape; }
          html, body { width: 11in; height: 8.5in; margin: 0; padding: 0; overflow: hidden; background: white; display: block; position: relative; }
          .print-container { 
            position: absolute;
            left: 0;
            top: -1.25in;
            width: 8.5in;
            height: 11in;
            min-height: auto;
            margin: 0;
            padding: 0.8in 0.6in; 
            border: none;
            box-shadow: none;
            transform-origin: left center;
            transform: scale(0.647);
          }
          .no-print { display: none !important; }
        }
`;

// Replace all occurrences
content = content.split(mediaPrintCSSOld.trim()).join(mediaPrintCSSNew.trim());

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed CSS positioning to LEFT!');
