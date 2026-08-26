const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'utils', 'printDocumentTemplates.js');
let content = fs.readFileSync(filePath, 'utf8');

// The CSS to inject
const replacementCSS = `
        body { font-family: 'Times New Roman', Times, serif; color: black; background: #f0f0f0; margin: 0; padding: 20px 0; }
        .print-container {
          width: 8.5in;
          min-height: 11in;
          box-sizing: border-box;
          margin: 0 auto;
          padding: 0.8in 0.6in;
          position: relative;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
`;

const mediaPrintCSS = `
        @media print {
          @page { margin: 0; size: letter landscape; }
          html, body { width: 11in; height: 8.5in; margin: 0; padding: 0; overflow: hidden; background: white; }
          body { display: flex; justify-content: flex-end; align-items: center; }
          .print-container { 
            width: 8.5in;
            height: 11in;
            min-height: auto;
            margin: 0;
            padding: 0.8in 0.6in; 
            border: none;
            box-shadow: none;
            transform-origin: right center;
            transform: scale(0.647);
            flex-shrink: 0;
          }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="print-container">
`;

// Replace in Medical Certificate
content = content.replace(
  /body { font-family: 'Times New Roman', Times, serif; color: black; padding: 30px; background: white; margin: 0; }/,
  replacementCSS.trim()
);

// Replace in Referral Letter
content = content.replace(
  /body { font-family: 'Times New Roman', Times, serif; color: black; padding: 30px; background: white; margin: 0; }/,
  replacementCSS.trim()
);

// Replace in Prescription
content = content.replace(
  /body { font-family: 'Times New Roman', Times, serif; color: black; padding: 30px; background: white; margin: 0; }/,
  replacementCSS.trim()
);

// Replace media print blocks and wrapper div
const oldMediaPrint = /@media print \{\s*@page \{ margin: 0; size: A4 portrait; \}\s*body \{ padding: 1\.2cm; margin: 0; \}\s*\.no-print \{ display: none !important; \}\s*\}\s*<\/style>\s*<\/head>\s*<body>\s*<div style="max-width: 750px; margin: 0 auto;">/g;

content = content.replace(oldMediaPrint, mediaPrintCSS.trim());

fs.writeFileSync(filePath, content, 'utf8');
console.log('Replacements done!');
