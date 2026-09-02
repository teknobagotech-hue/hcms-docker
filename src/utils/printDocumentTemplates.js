/**
 * Utility functions for rendering and printing Medical Certificates and Referral Letters
 * matching the exact clinic header & document layout.
 */

export function getAge(dob) {
  if (!dob) return '';
  const diff_ms = Date.now() - new Date(dob).getTime();
  const age_dt = new Date(diff_ms);
  return Math.abs(age_dt.getUTCFullYear() - 1970);
}

export function executePrint(htmlContent) {
  let iframe = document.getElementById('meddesk-print-frame');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'meddesk-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = '0px';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);
  }

  const currentPath = window.location.pathname + window.location.search + window.location.hash;

  try {
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    try { doc.title = '.'; } catch (e) {}
    try { iframe.contentWindow.history.replaceState(null, '', '.'); } catch (e) {}

    setTimeout(() => {
      try {
        if (iframe.contentWindow) {
          try { iframe.contentWindow.document.title = '.'; } catch (e) {}
          try { iframe.contentWindow.history.replaceState(null, '', '.'); } catch (e) {}
          try { window.history.replaceState(null, '', '.'); } catch (e) {}

          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setTimeout(() => {
          try { window.history.replaceState(null, '', currentPath); } catch (e) {}
        }, 500);
      }
    }, 400);
  } catch (err) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('Please allow popups to print documents.');
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    try { printWindow.history.replaceState(null, '', '.'); } catch (e) {}
    try { window.history.replaceState(null, '', '.'); } catch (e) {}
    printWindow.focus();
    setTimeout(() => {
      try { printWindow.document.title = '.'; } catch (e) {}
      printWindow.print();
      setTimeout(() => {
        try { window.history.replaceState(null, '', currentPath); } catch (e) {}
      }, 500);
    }, 600);
  }
}

export function printMedicalCertificate({ patient, document, customFields = {} }) {
  const patientName = customFields.patientName || (patient ? `${patient.first_name} ${patient.middle_name || ''} ${patient.last_name}`.replace(/\s+/g, ' ').trim() : '____________________');
  const patientAge = customFields.patientAge || (patient?.date_of_birth ? getAge(patient.date_of_birth) : '_____');
  const patientAddress = customFields.patientAddress || patient?.address || '__________________________________________________';
  
  const issueDate = customFields.issueDate || (document?.issue_date ? new Date(document.issue_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }));
  const consultDate = customFields.consultDate || (document?.issue_date ? new Date(document.issue_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));

  const diagnosis = customFields.diagnosis !== undefined ? customFields.diagnosis : (document?.diagnosis_impression || '');
  const remarks = customFields.remarks !== undefined ? customFields.remarks : (document?.remarks_recommendations || '');

  const advisedRest = customFields.advisedRest !== undefined ? customFields.advisedRest : false;
  const restDays = customFields.restDays || '';
  const fitEmployment = customFields.fitEmployment !== undefined ? customFields.fitEmployment : false;
  const avoidStrenuous = customFields.avoidStrenuous !== undefined ? customFields.avoidStrenuous : false;
  const strenuousText = customFields.strenuousText || '';
  const financialAssistance = customFields.financialAssistance !== undefined ? customFields.financialAssistance : false;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>.</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,600;1,700&display=swap');
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
        .doc-header-name { text-align: center; font-family: 'Playfair Display', 'Times New Roman', serif; font-style: italic; font-size: 21px; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 4px; text-transform: uppercase; }
        .doc-specialty { text-align: center; font-size: 11px; margin-bottom: 12px; line-height: 1.3; }
        .affiliations { display: flex; justify-content: space-between; font-size: 11px; border-bottom: 3px double black; padding-bottom: 8px; margin-bottom: 25px; line-height: 1.35; }
        .doc-title { text-align: center; font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 36px; margin: 25px 0 15px 0; font-weight: 600; }
        .date-row { text-align: right; font-size: 15px; font-style: italic; margin-bottom: 20px; font-family: 'Playfair Display', serif; }
        .salutation { font-size: 16px; font-style: italic; margin-bottom: 20px; font-family: 'Playfair Display', serif; }
        .cert-body { font-size: 16px; font-style: italic; line-height: 2.2; margin-bottom: 20px; font-family: 'Playfair Display', serif; }
        .underline-text { font-style: italic; font-weight: bold; border-bottom: 1px solid black; padding: 0 4px; display: inline-block; text-align: center; }
        .section-label { font-size: 16px; font-style: italic; font-weight: bold; margin-top: 15px; margin-bottom: 6px; font-family: 'Playfair Display', serif; }
        .content-box { font-size: 15px; min-height: 45px; line-height: 1.5; white-space: pre-wrap; margin-bottom: 15px; font-family: 'Times New Roman', serif; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        .checklist { margin: 20px 0 25px 0; font-size: 15px; font-style: italic; line-height: 2.0; font-family: 'Playfair Display', serif; }
        .chk-box { display: inline-block; width: 35px; text-align: left; font-weight: bold; font-style: normal; }
        .disclaimer { font-size: 10px; font-style: italic; margin-top: 25px; margin-bottom: 30px; line-height: 1.3; font-family: 'Times New Roman', serif; }
        .signature-block { text-align: right; float: right; margin-top: 20px; font-size: 11px; line-height: 1.3; font-family: Arial, sans-serif; width: 320px; }
        .clear { clear: both; }

        @media print {
          @page { 
            margin: 0; 
            size: letter landscape; 
          }
          html, body { width: 11in; margin: 0; padding: 0; background: white; display: block; }
          .print-container { 
            position: relative;
            left: 0;
            top: 0;
            width: 5.5in !important;
            max-width: 5.5in !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0.65in 0.35in 0.4in 0.35in !important; 
            border: none !important;
            box-shadow: none !important;
            transform: none !important;
            box-sizing: border-box !important;
            float: left;
          }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        <div class="doc-header-name">
          GLADDAYS CASUGA-NAPIGKIT, MD, FPCP, FPCC, FPSVM
        </div>
        <div class="doc-specialty">
          Internal Medicine, Adult Cardiology, Vascular Medicine<br/>
          Fellow, Philippine College of Physician<br/>
          Fellow, Philippine College of Cardiology<br/>
          Fellow, Philippine Society of Vascular Medicine
        </div>
        
        <div class="affiliations">
          <div>
            <strong>Hospital Affiliations:</strong><br/>
            Adventist Medical Center-Valencia<br/>
            Abella Midway Hospital<br/>
            Lavina General Hospital<br/>
            Valencia Polymedic General Hospital<br/>
            Medidas Medical Center<br/>
            Esther Hospital
          </div>
          <div>
            <strong>Clinic Address & Clinic Hours:</strong><br/>
            Adventist Medical Center: M-T-Th-F (1:00 pm to 4:00 pm)<br/>
            Abella Midway Hospital: Wed (1:00 pm to 4:00 pm)
          </div>
        </div>

        <div class="doc-title" style="font-family: 'Monotype Corsiva', 'Apple Chancery', cursive; font-size: 32px; font-style: italic; font-weight: normal;">Medical Certificate</div>

        <div class="date-row" style="font-family: 'Monotype Corsiva', 'Apple Chancery', cursive;">
          Date: <span class="underline-text" style="min-width: 140px; font-weight: normal;">${issueDate}</span>
        </div>

        <div class="salutation" style="font-family: 'Monotype Corsiva', 'Apple Chancery', cursive;">To whom it may concern,</div>

        <div class="cert-body" style="font-family: 'Monotype Corsiva', 'Apple Chancery', cursive;">
          This is to certify that <span class="underline-text" style="min-width: 250px; font-weight: normal;">${patientName}</span>, <span class="underline-text" style="min-width: 50px; font-weight: normal;">${patientAge}</span> years old,<br/>
          residing at <span class="underline-text" style="min-width: 420px; font-weight: normal;">${patientAddress}</span><br/>
          had consulted with the undersigned on <span class="underline-text" style="min-width: 220px; font-weight: normal;">${consultDate}</span>.
        </div>

        <div class="section-label" style="font-family: 'Monotype Corsiva', 'Apple Chancery', cursive; font-weight: normal;">Impression/Diagnosis:</div>
        <div class="content-box" style="font-family: 'Monotype Corsiva', 'Apple Chancery', cursive; border-bottom: none;">${diagnosis || '&nbsp;'}</div>

        <div class="section-label" style="font-family: 'Monotype Corsiva', 'Apple Chancery', cursive; font-weight: normal;">Remarks/ Recommendations:</div>
        <div class="content-box" style="font-family: 'Monotype Corsiva', 'Apple Chancery', cursive; border-bottom: none;">${remarks || '&nbsp;'}</div>

        <div class="checklist" style="font-family: 'Monotype Corsiva', 'Apple Chancery', cursive;">
          <div><span class="chk-box">${advisedRest ? '✓' : '___'}</span> Advised rest for <span class="underline-text" style="min-width: 80px; font-weight: normal;">${restDays || '________'}</span> days.</div>
          <div><span class="chk-box">${fitEmployment ? '✓' : '___'}</span> Fit for employment.</div>
          <div><span class="chk-box">${avoidStrenuous ? '✓' : '___'}</span> Avoid strenuous activities such as <span class="underline-text" style="min-width: 260px; font-weight: normal;">${strenuousText || '____________________'}</span>.</div>
          <div><span class="chk-box">${financialAssistance ? '✓' : '___'}</span> For Financial/ Medical assistance.</div>
        </div>

        <div class="disclaimer" style="font-size: 9px; color: #333;">
          The certificate is being issued upon the request of the above-mentioned name for whatever purpose may serve best (excluding legal matters).
        </div>

        <div class="signature-block" style="float: right; width: 320px; margin-top: 40px; font-family: Arial, sans-serif; font-size: 11px; text-align: center;">
          <div>DR. GLADDAYS CASUGA-NAPIGKIT</div>
          <div>Internist-Cardiologist-Vascular</div>
          <div style="text-align: left; padding-left: 20px;">Specialist</div>
          <div style="padding-left: 40px;">
            Lic #: 0110138<br/>
            PTR #: 6226871
          </div>
        </div>
        <div class="clear"></div>

        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 24px; background-color: #0d9488; color: white; border: none; border-radius: 6px; font-size: 15px; cursor: pointer;">
            Print Medical Certificate
          </button>
        </div>
      </div>
    </body>
    </html>
  `;

  executePrint(htmlContent);
}

export function printReferralLetter({ patient, document, customFields = {} }) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return alert('Please allow popups to print documents.');

  const patientName = customFields.patientName || (patient ? `${patient.first_name} ${patient.middle_name || ''} ${patient.last_name}`.replace(/\s+/g, ' ').trim() : '_________________________________________');
  const issueDate = customFields.issueDate || (document?.issue_date ? new Date(document.issue_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }));
  const referredToDoctor = customFields.referredToDoctor || document?.referred_to_doctor || '_______________________';
  const purpose = customFields.purpose || document?.purpose || '________________________________________________________';
  const clinicOrDate = customFields.clinicOrDate || 'my clinic';
  const complaints = customFields.complaints || '_________________________________________________';
  const diagnosis = customFields.diagnosis !== undefined ? customFields.diagnosis : (document?.diagnosis_impression || '_________________________________________________');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>.</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,600;1,700&display=swap');
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
        .doc-header-name { text-align: center; font-family: 'Playfair Display', 'Times New Roman', serif; font-style: italic; font-size: 21px; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 4px; text-transform: uppercase; }
        .doc-specialty { text-align: center; font-size: 11px; margin-bottom: 12px; line-height: 1.3; }
        .affiliations { display: flex; justify-content: space-between; font-size: 11px; border-bottom: 3px double black; padding-bottom: 8px; margin-bottom: 25px; line-height: 1.35; }
        .doc-title { text-align: center; font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 36px; margin: 25px 0 20px 0; font-weight: 600; }
        .date-row { text-align: right; font-size: 15px; font-style: italic; margin-bottom: 20px; font-family: 'Playfair Display', serif; }
        .to-dr { font-size: 16px; font-style: italic; margin-bottom: 20px; font-family: 'Playfair Display', serif; }
        .ref-body { font-size: 16px; font-style: italic; line-height: 2.2; margin-bottom: 30px; font-family: 'Playfair Display', serif; }
        .underline-text { font-style: italic; font-weight: bold; border-bottom: 1px solid black; padding: 0 4px; display: inline-block; text-align: center; }
        .closing { font-size: 16px; font-style: italic; margin-top: 25px; font-family: 'Playfair Display', serif; }
        .signature-block { text-align: right; float: right; margin-top: 20px; font-size: 11px; line-height: 1.3; font-family: Arial, sans-serif; width: 320px; }
        .quote-footer { text-align: center; margin-top: 80px; font-size: 14px; font-style: italic; font-family: 'Playfair Display', serif; }
        .clear { clear: both; }

        @media print {
          @page { 
            margin: 0; 
            size: letter landscape; 
          }
          html, body { 
            width: 11in; 
            margin: 0; 
            padding: 0; 
            background: white; 
            color: white !important; 
            display: block; 
          }
          .print-container { 
            position: relative;
            left: 0;
            top: 0;
            width: 5.5in !important;
            max-width: 5.5in !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0.65in 0.35in 0.4in 0.35in !important; 
            border: none !important;
            box-shadow: none !important;
            transform: none !important;
            box-sizing: border-box !important;
            float: left;
            color: black !important;
          }
          .print-container * {
            color: black !important;
          }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        <div class="doc-header-name">
          GLADDAYS CASUGA-NAPIGKIT, MD, FPCP, FPCC, FPSVM
        </div>
        <div class="doc-specialty">
          Internal Medicine, Adult Cardiology, Vascular Medicine<br/>
          Fellow, Philippine College of Physician<br/>
          Fellow, Philippine College of Cardiology<br/>
          Fellow, Philippine Society of Vascular Medicine
        </div>
        
        <div class="affiliations">
          <div>
            <strong>Hospital Affiliations:</strong><br/>
            Adventist Medical Center-Valencia<br/>
            Abella Midway Hospital<br/>
            Lavina General Hospital<br/>
            Valencia Polymedic General Hospital<br/>
            Medidas Medical Center<br/>
            Esther Hospital
          </div>
          <div>
            <strong>Clinic Address & Clinic Hours:</strong><br/>
            Adventist Medical Center: M-T-Th-F (1:00 pm to 4:00 pm)<br/>
            Abella Midway Hospital: Wed (1:00 pm to 4:00 pm)
          </div>
        </div>

        <div class="doc-title" style="font-family: 'Monotype Corsiva', 'Apple Chancery', cursive; font-size: 32px; font-style: italic; font-weight: normal;">Referral Letter</div>

        <div class="date-row" style="font-family: 'Monotype Corsiva', 'Apple Chancery', cursive;">
          Date: <span class="underline-text" style="min-width: 140px; font-weight: normal;">${issueDate}</span>
        </div>

        <div class="to-dr" style="font-family: 'Monotype Corsiva', 'Apple Chancery', cursive;">
          To Dr. <span class="underline-text" style="min-width: 300px; font-weight: normal;">${referredToDoctor}</span>,
        </div>

        <div class="ref-body" style="font-family: 'Monotype Corsiva', 'Apple Chancery', cursive;">
          Respectfully referring <span class="underline-text" style="min-width: 400px; font-weight: normal;">${patientName}</span><br/>
          For <span class="underline-text" style="min-width: 520px; font-weight: normal;">${purpose}</span>.<br/><br/>

          Patient came in at my clinic <span class="underline-text" style="min-width: 200px; font-weight: normal;">${clinicOrDate}</span> due to <span class="underline-text" style="min-width: 300px; font-weight: normal;">${complaints}</span> and is<br/>
          found to have <span class="underline-text" style="min-width: 480px; font-weight: normal;">${diagnosis}</span>.<br/><br/>

          hence this referral.
        </div>

        <div class="closing" style="font-family: 'Monotype Corsiva', 'Apple Chancery', cursive;">
          Thank you very much.
        </div>

        <div class="signature-block" style="float: right; width: 320px; margin-top: 40px; font-family: Arial, sans-serif; font-size: 11px; text-align: center;">
          <div>DR. GLADDAYS CASUGA-NAPIGKIT</div>
          <div>Internist-Cardiologist-Vascular</div>
          <div style="text-align: left; padding-left: 20px;">Specialist</div>
          <div style="padding-left: 40px;">
            Lic #: 0110138<br/>
            PTR #: 6226871
          </div>
        </div>
        <div class="clear"></div>

        <div class="quote-footer" style="font-family: 'Monotype Corsiva', 'Apple Chancery', cursive; font-size: 14px;">
          “A merry heart doeth good like a medicine.” <span style="border-bottom: 1px solid red; padding-bottom: 1px;">Proverbs</span> 17:22
        </div>

        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 24px; background-color: #0d9488; color: white; border: none; border-radius: 6px; font-size: 15px; cursor: pointer;">
            Print Referral Letter
          </button>
        </div>
      </div>
    </body>
    </html>
  `;

  executePrint(htmlContent);
}

export function printPharmacyReceipt({ sale, items = [] }) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return alert('Please allow popups to print receipt.');

  const customerName = sale.customer_id && sale.patients 
    ? `${sale.patients.first_name || ''} ${sale.patients.last_name || ''}`.trim()
    : sale.customer_name || 'Walk-in Customer';

  const dateStr = sale.withdrawal_date 
    ? new Date(sale.withdrawal_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const receiptNo = `REC-${String(sale.withdrawal_id).padStart(5, '0')}`;
  
  let subtotal = 0;
  const itemRowsHtml = items.map((item, index) => {
    const itemName = item.inventory_items?.item_name || `Item #${item.item_id}`;
    const price = Number(item.inventory_items?.price || 0);
    const qty = Number(item.quantity || 1);
    const itemTotal = price * qty;
    subtotal += itemTotal;

    return `
      <tr>
        <td style="padding: 8px 4px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${index + 1}</td>
        <td style="padding: 8px 4px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${itemName}</td>
        <td style="padding: 8px 4px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center;">${qty}</td>
        <td style="padding: 8px 4px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right;">₱${price.toFixed(2)}</td>
        <td style="padding: 8px 4px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-weight: 500;">₱${itemTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const discVal = Number(sale.discount_value || 0);
  let discountAmount = 0;
  if (discVal > 0) {
    if (sale.discount_type === 'percentage') {
      discountAmount = subtotal * (discVal / 100);
    } else {
      discountAmount = discVal;
    }
  }

  const amountDue = Number(sale.amount_due !== undefined && sale.amount_due !== null ? sale.amount_due : Math.max(0, subtotal - discountAmount));
  const amountPaid = Number(sale.amount_paid || 0);
  const balance = amountDue - amountPaid;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Pharmacy Sales Receipt - ${receiptNo}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1e293b; background: white; margin: 0; padding: 24px; }
        .receipt-card { max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 20px; }
        .header h1 { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .header p { font-size: 12px; color: #64748b; margin: 2px 0; }
        .receipt-title { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; font-size: 13px; }
        .info-item span { display: block; font-size: 11px; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-item strong { color: #0f172a; font-weight: 600; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th { text-align: left; padding: 8px 4px; font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
        .summary-section { border-top: 2px dashed #cbd5e1; padding-top: 14px; margin-bottom: 20px; }
        .summary-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #475569; }
        .summary-row.total { font-size: 16px; font-weight: 700; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
        .badge-paid { background: #dcfce7; color: #166534; }
        .badge-unpaid { background: #fef3c7; color: #92400e; }
        .badge-partial { background: #e0f2fe; color: #075985; }
        .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 16px; }
        
        @media print {
          @page { margin: 0; }
          body { padding: 15mm; }
          .receipt-card { border: none; box-shadow: none; max-width: 100%; padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <h1>MedDesk Pharmacy</h1>
          <p><strong>Dr. Gladdays Casuga-Napigkit, MD, MBAHHCM</strong></p>
          <p>Internal Medicine • Adult Cardiology • Vascular Medicine</p>
          <p>Valencia City, Bukidnon</p>
        </div>

        <div class="receipt-title">
          <div><strong>PHARMACY SALES RECEIPT</strong></div>
          <div style="font-weight: 600; color: #0d9488;">${receiptNo}</div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span>Customer Name</span>
            <strong>${customerName}</strong>
          </div>
          <div class="info-item" style="text-align: right;">
            <span>Date</span>
            <strong>${dateStr}</strong>
          </div>
          <div class="info-item">
            <span>Sale Type</span>
            <strong style="text-transform: capitalize;">${sale.sale_type || 'Retail'}</strong>
          </div>
          <div class="info-item" style="text-align: right;">
            <span>Payment Status</span>
            <span class="badge badge-${sale.payment_status === 'paid' ? 'paid' : sale.payment_status === 'partial' ? 'partial' : 'unpaid'}">
              ${sale.payment_status || 'unpaid'}
            </span>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 8%;">#</th>
              <th>Item / Description</th>
              <th style="text-align: center; width: 12%;">Qty</th>
              <th style="text-align: right; width: 22%;">Price</th>
              <th style="text-align: right; width: 22%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRowsHtml || '<tr><td colSpan="5" style="text-align:center; padding:12px; color:#64748b;">No items listed</td></tr>'}
          </tbody>
        </table>

        <div class="summary-section">
          <div class="summary-row">
            <span>Subtotal</span>
            <span>₱${subtotal.toFixed(2)}</span>
          </div>
          ${discountAmount > 0 ? `
            <div class="summary-row" style="color: #059669;">
              <span>Discount ${sale.discount_type === 'percentage' ? `(${sale.discount_value}%)` : ''}</span>
              <span>-₱${discountAmount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="summary-row total">
            <span>Amount Due</span>
            <span>₱${amountDue.toFixed(2)}</span>
          </div>
          <div class="summary-row" style="margin-top: 8px;">
            <span>Amount Paid</span>
            <span>₱${amountPaid.toFixed(2)}</span>
          </div>
          ${balance > 0 ? `
            <div class="summary-row" style="color: #dc2626; font-weight: 600;">
              <span>Balance Due</span>
              <span>₱${balance.toFixed(2)}</span>
            </div>
          ` : balance < 0 ? `
            <div class="summary-row" style="color: #059669; font-weight: 600;">
              <span>Change</span>
              <span>₱${Math.abs(balance).toFixed(2)}</span>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <p style="margin: 0 0 4px 0; font-weight: 500;">Thank you for your purchase!</p>
          <p style="margin: 0; font-size: 11px;">"A merry heart doeth good like a medicine." Proverbs 17:22</p>
        </div>

        <div class="no-print" style="margin-top: 24px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 24px; background-color: #0d9488; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
            Print Receipt
          </button>
        </div>
      </div>
    </body>
    </html>
  `;

  executePrint(htmlContent);
}

export function printBillingReceipt({ bill }) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return alert('Please allow popups to print receipt.');

  const patientName = bill.patients 
    ? `${bill.patients.first_name || ''} ${bill.patients.last_name || ''}`.trim() 
    : 'Patient';

  const dateStr = bill.billing_date 
    ? new Date(bill.billing_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const billNo = `INV-${String(bill.billing_id).padStart(5, '0')}`;
  const amount = Number(bill.amount || 0);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Billing Statement - ${billNo}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1e293b; background: white; margin: 0; padding: 24px; }
        .receipt-card { max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 20px; }
        .header h1 { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .header p { font-size: 12px; color: #64748b; margin: 2px 0; }
        .receipt-title { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; font-size: 13px; }
        .info-item span { display: block; font-size: 11px; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-item strong { color: #0f172a; font-weight: 600; }
        .summary-section { border-top: 2px dashed #cbd5e1; padding-top: 14px; margin-bottom: 20px; }
        .summary-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #475569; }
        .summary-row.total { font-size: 16px; font-weight: 700; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
        .badge-paid { background: #dcfce7; color: #166534; }
        .badge-unpaid { background: #fef3c7; color: #92400e; }
        .badge-partial { background: #e0f2fe; color: #075985; }
        .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 16px; }
        
        @media print {
          @page { margin: 0; }
          body { padding: 15mm; }
          .receipt-card { border: none; box-shadow: none; max-width: 100%; padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <h1>MedDesk Billing</h1>
          <p><strong>Dr. Gladdays Casuga-Napigkit, MD, MBAHHCM</strong></p>
          <p>Internal Medicine • Adult Cardiology • Vascular Medicine</p>
          <p>Valencia City, Bukidnon</p>
        </div>

        <div class="receipt-title">
          <div><strong>BILLING RECEIPT</strong></div>
          <div style="font-weight: 600; color: #0d9488;">${billNo}</div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span>Patient Name</span>
            <strong>${patientName}</strong>
          </div>
          <div class="info-item" style="text-align: right;">
            <span>Date</span>
            <strong>${dateStr}</strong>
          </div>
          <div class="info-item">
            <span>Insurance Claim</span>
            <strong style="text-transform: capitalize;">${bill.insurance_claim_status || 'N/A'}</strong>
          </div>
          <div class="info-item" style="text-align: right;">
            <span>Payment Status</span>
            <span class="badge badge-${bill.payment_status === 'paid' ? 'paid' : bill.payment_status === 'partial' ? 'partial' : 'unpaid'}">
              ${bill.payment_status || 'unpaid'}
            </span>
          </div>
        </div>

        <div class="summary-section">
          <div class="summary-row total">
            <span>Total Amount</span>
            <span>₱${amount.toFixed(2)}</span>
          </div>
          ${bill.notes ? `
            <div style="margin-top: 12px; font-size: 12px; color: #64748b; background: #f8fafc; padding: 8px 12px; border-radius: 6px;">
              <strong>Notes:</strong> ${bill.notes}
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <p style="margin: 0 0 4px 0; font-weight: 500;">Thank you!</p>
          <p style="margin: 0; font-size: 11px;">"A merry heart doeth good like a medicine." Proverbs 17:22</p>
        </div>

        <div class="no-print" style="margin-top: 24px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 24px; background-color: #0d9488; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
            Print Receipt
          </button>
        </div>
      </div>
    </body>
    </html>
  `;

  executePrint(htmlContent);
}

export function printStockReceipt({ receipt, items = [] }) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return alert('Please allow popups to print receipt.');

  const supplierName = receipt.suppliers?.supplier_name || 'N/A';
  const refNo = receipt.reference_number || `SR-${String(receipt.receipt_id).padStart(5, '0')}`;
  const dateStr = receipt.receipt_date 
    ? new Date(receipt.receipt_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  let totalCost = 0;
  const itemRowsHtml = items.map((item, index) => {
    const itemName = item.inventory_items?.item_name || `Item #${item.item_id}`;
    const qty = Number(item.quantity_received || 0);
    const unitCost = Number(item.unit_cost || 0);
    const lineTotal = qty * unitCost;
    totalCost += lineTotal;

    const batch = item.batch_number || '-';
    const expiry = item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-';

    return `
      <tr>
        <td style="padding: 8px 4px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${index + 1}</td>
        <td style="padding: 8px 4px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 500;">${itemName}</td>
        <td style="padding: 8px 4px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center;">${qty}</td>
        <td style="padding: 8px 4px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right;">₱${unitCost.toFixed(2)}</td>
        <td style="padding: 8px 4px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-weight: 500;">₱${lineTotal.toFixed(2)}</td>
        <td style="padding: 8px 4px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: center;">${batch}</td>
        <td style="padding: 8px 4px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: center;">${expiry}</td>
      </tr>
    `;
  }).join('');

  const displayTotal = Number(receipt.total_cost || totalCost);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Stock Receipt - ${refNo}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1e293b; background: white; margin: 0; padding: 24px; }
        .receipt-card { max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 20px; }
        .header h1 { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .header p { font-size: 12px; color: #64748b; margin: 2px 0; }
        .receipt-title { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; font-size: 13px; }
        .info-item span { display: block; font-size: 11px; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-item strong { color: #0f172a; font-weight: 600; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th { text-align: left; padding: 8px 4px; font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
        .summary-section { border-top: 2px dashed #cbd5e1; padding-top: 14px; margin-bottom: 20px; }
        .summary-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #475569; }
        .summary-row.total { font-size: 16px; font-weight: 700; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px; }
        .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 16px; }
        
        @media print {
          @page { margin: 0; }
          body { padding: 15mm; }
          .receipt-card { border: none; box-shadow: none; max-width: 100%; padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <h1>MedDesk Pharmacy & Inventory</h1>
          <p><strong>INVENTORY STOCK RECEIPT</strong></p>
          <p>Valencia City, Bukidnon</p>
        </div>

        <div class="receipt-title">
          <div><strong>STOCK RECEIPT</strong></div>
          <div style="font-weight: 600; color: #0d9488;">${refNo}</div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span>Supplier</span>
            <strong>${supplierName}</strong>
          </div>
          <div class="info-item" style="text-align: right;">
            <span>Receipt Date</span>
            <strong>${dateStr}</strong>
          </div>
          <div class="info-item">
            <span>Reference No.</span>
            <strong>${receipt.reference_number || '-'}</strong>
          </div>
          <div class="info-item" style="text-align: right;">
            <span>Status</span>
            <strong style="text-transform: uppercase; color: #0d9488;">${receipt.status || 'Completed'}</strong>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th>Received Item</th>
              <th style="text-align: center; width: 10%;">Qty</th>
              <th style="text-align: right; width: 18%;">Unit Cost</th>
              <th style="text-align: right; width: 18%;">Total</th>
              <th style="text-align: center; width: 15%;">Batch</th>
              <th style="text-align: center; width: 15%;">Expiry</th>
            </tr>
          </thead>
          <tbody>
            ${itemRowsHtml || '<tr><td colSpan="7" style="text-align:center; padding:12px; color:#64748b;">No items listed</td></tr>'}
          </tbody>
        </table>

        <div class="summary-section">
          <div class="summary-row total">
            <span>Total Stock Value Received</span>
            <span>₱${displayTotal.toFixed(2)}</span>
          </div>
          ${receipt.notes ? `
            <div style="margin-top: 12px; font-size: 12px; color: #64748b; background: #f8fafc; padding: 8px 12px; border-radius: 6px;">
              <strong>Notes:</strong> ${receipt.notes}
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <p style="margin: 0 0 4px 0; font-weight: 500;">MedDesk Inventory Management System</p>
        </div>

        </div>
      </div>
    </body>
    </html>
  `;

  executePrint(htmlContent);
}

export function printPrescription({ patient, prescription, items = [], doctor = null }) {
  const patientName = patient 
    ? `${patient.last_name || ''}, ${patient.first_name || ''} ${patient.middle_name || ''}`.replace(/\s+/g, ' ').trim() 
    : '____________________';
  const patientAge = patient?.date_of_birth ? getAge(patient.date_of_birth) : '-';
  const patientGender = patient?.gender === 'Male' ? 'M' : patient?.gender === 'Female' ? 'F' : (patient?.gender || '-');
  const ageSex = `${patientAge}/${patientGender}`;
  const patientAddress = patient?.address || '__________________________________________________';

  const dateStr = prescription?.prescription_date 
    ? new Date(prescription.prescription_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Doctor Details (Fallback to default clinic doctor if specific fields missing)
  const doctorHeaderName = doctor?.first_name 
    ? `${doctor.first_name || ''} ${doctor.last_name || ''}${doctor.specialty ? ', MD' : ', MD'}`.trim().toUpperCase() 
    : 'GLADDAYS CASUGA-NAPIGKIT, MD, MBAHHCM, FPCP, FPCC, FPSVM';
  const doctorSigName = doctor?.first_name 
    ? `DR. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim().toUpperCase() 
    : 'DR. GLADDAYS CASUGA-NAPIGKIT';
  const doctorSpecialty = doctor?.specialty || 'Internist-Cardiologist-Vascular Specialist';
  const licNo = doctor?.license_number || doctor?.lic_no || '0110138';
  const ptrNo = doctor?.ptr_number || doctor?.ptr_no || '6226871';
  const s2LicNo = doctor?.s2_license || doctor?.s2_lic || doctor?.s2_license_number || 'S2015621FNP071328-K';

  const itemCount = (items && items.length) || 0;

  // Dynamic font sizes and margins based on item count for cut Rx paper fit
  let medNameFontSize = '15px';
  let qtyFontSize = '13px';
  let sigFontSize = '13px';
  let itemMarginBottom = '10px';
  let headerFontSize = '17px';
  let specialtyFontSize = '10.5px';
  let patientFontSize = '13px';
  let rxSymbolFontSize = '38px';
  let rxSymbolMargin = '8px 0 10px 0';
  let sigBlockMarginTop = '20px';
  let sigBlockFontSize = '10.5px';
  let quoteMarginTop = '25px';

  if (itemCount > 10) {
    medNameFontSize = '11.5px';
    qtyFontSize = '10.5px';
    sigFontSize = '10.5px';
    itemMarginBottom = '3px';
    headerFontSize = '14.5px';
    specialtyFontSize = '9px';
    patientFontSize = '11px';
    rxSymbolFontSize = '26px';
    rxSymbolMargin = '2px 0 4px 0';
    sigBlockMarginTop = '6px';
    sigBlockFontSize = '9px';
    quoteMarginTop = '8px';
  } else if (itemCount > 6) {
    medNameFontSize = '13px';
    qtyFontSize = '11.5px';
    sigFontSize = '11.5px';
    itemMarginBottom = '5px';
    headerFontSize = '15.5px';
    specialtyFontSize = '9.5px';
    patientFontSize = '12px';
    rxSymbolFontSize = '32px';
    rxSymbolMargin = '4px 0 6px 0';
    sigBlockMarginTop = '12px';
    sigBlockFontSize = '9.5px';
    quoteMarginTop = '14px';
  }

  let rxBodyContent = '';

  if (items && items.length > 0) {
    rxBodyContent += items.map((item) => {
      const medName = item.medicines?.medicine_name || item.medicine_name || '';
      const qty = item.quantity ? `#${item.quantity}` : '';
      const sigParts = [item.dosage, item.frequency, item.instructions].filter(Boolean).join(' ');
      const sig = sigParts ? `Sig: ${sigParts}` : '';

      return `
        <div style="margin-bottom: ${itemMarginBottom}; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; font-weight: bold; font-size: ${medNameFontSize}; color: #000;">
            <span style="word-break: break-word;">${medName}</span>
            <span style="font-size: ${qtyFontSize}; font-weight: 600; margin-left: 8px; white-space: nowrap;">${qty}</span>
          </div>
          ${sig ? `<div style="margin-left: 12px; font-size: ${sigFontSize}; font-style: italic; margin-top: 1px; color: #111; line-height: 1.25; word-break: break-word;">${sig}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  // Additional notes/instructions if present
  if (prescription?.notes && !prescription.notes.includes('Extracted from document')) {
    rxBodyContent += `<div style="margin-top: 8px; font-size: ${sigFontSize}; line-height: 1.3; white-space: pre-wrap; font-style: italic;"><strong>Special Instructions:</strong><br/>${prescription.notes}</div>`;
  } else if (prescription?.prescription_text) {
    rxBodyContent += `<div style="margin-top: 8px; font-size: ${sigFontSize}; line-height: 1.3; white-space: pre-wrap; font-style: italic;">${prescription.prescription_text}</div>`;
  }

  if (!rxBodyContent.trim()) {
    rxBodyContent = `<div style="color: #666; font-style: italic; font-size: ${sigFontSize};">No medications listed.</div>`;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>.</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&display=swap');
        body { font-family: 'Times New Roman', Times, serif; color: black; background: #f0f0f0; margin: 0; padding: 15px 0; }
        .print-container {
          width: 5.5in;
          max-width: 100%;
          min-height: 8.5in;
          box-sizing: border-box;
          margin: 0 auto;
          padding: 0.4in 0.35in;
          position: relative;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .doc-header-name { 
          text-align: center; 
          font-family: 'Playfair Display', 'Times New Roman', serif; 
          font-style: italic; 
          font-weight: bold; 
          font-size: ${headerFontSize}; 
          letter-spacing: 0.3px; 
          margin-bottom: 3px; 
          text-transform: uppercase; 
          color: #000;
          line-height: 1.25;
        }
        
        .doc-specialty { 
          text-align: center; 
          font-family: 'Times New Roman', Times, serif;
          font-size: ${specialtyFontSize}; 
          line-height: 1.25; 
          margin-bottom: 8px; 
          color: #000;
        }

        .affiliations { 
          display: flex; 
          justify-content: space-between; 
          font-family: 'Times New Roman', Times, serif;
          font-size: ${specialtyFontSize}; 
          line-height: 1.3; 
          padding-bottom: 6px; 
          margin-bottom: 12px; 
          border-bottom: 3px double black;
          color: #000;
          width: 100%;
          box-sizing: border-box;
        }

        .patient-block {
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 1.5px solid #000;
        }

        .patient-table {
          width: 100%;
          border-collapse: collapse;
          font-family: 'Times New Roman', Times, serif;
          font-size: ${patientFontSize};
          line-height: 1.4;
          color: #000;
        }

        .patient-table td {
          padding: 2px 0;
        }

        .underline-text {
          font-style: italic;
          font-weight: bold;
          border-bottom: 1px solid black;
          padding: 0 4px;
          display: inline-block;
        }

        .rx-symbol {
          font-family: 'Playfair Display', Georgia, serif;
          font-style: italic;
          font-weight: bold;
          font-size: ${rxSymbolFontSize};
          color: #000;
          margin: ${rxSymbolMargin};
          line-height: 1;
        }

        .rx-body {
          flex-grow: 1;
          font-family: 'Lucida Calligraphy', 'Dancing Script', 'Apple Chancery', cursive, serif;
          color: #000;
          width: 100%;
          box-sizing: border-box;
        }

        .signature-block {
          float: right;
          text-align: left;
          margin-top: ${sigBlockMarginTop};
          margin-bottom: 4px;
          font-family: Arial, Helvetica, sans-serif;
          font-size: ${sigBlockFontSize};
          line-height: 1.3;
          width: auto;
          max-width: 240px;
          color: #000;
        }

        .sig-line {
          border-bottom: 1px solid #000;
          margin-bottom: 6px;
          width: 100%;
          height: 24px;
        }

        .doc-sig-name {
          font-weight: bold;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.2px;
          white-space: nowrap;
        }

        .doc-sig-sub {
          font-size: 10px;
          font-weight: 500;
          margin-bottom: 3px;
          white-space: nowrap;
        }

        .footer-quote {
          clear: both;
          text-align: center;
          margin-top: ${quoteMarginTop};
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 11.5px;
          color: #000;
        }

        .quote-ref {
          text-decoration: underline;
        }

        .clear {
          clear: both;
        }

        @media print {
          @page { 
            margin: 0; 
            size: letter landscape; 
          }
          html, body { 
            width: 11in; 
            margin: 0; 
            padding: 0; 
            background: white; 
            color: white !important; 
            display: block; 
          }
          .print-container { 
            position: relative;
            left: 0;
            top: 0;
            width: 5.5in !important;
            max-width: 5.5in !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0.65in 0.35in 0.4in 0.35in !important; 
            border: none !important;
            box-shadow: none !important;
            transform: none !important;
            box-sizing: border-box !important;
            float: left;
            color: black !important;
          }
          .print-container * {
            color: black !important;
          }
          .rx-body > div {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        
        <div class="doc-header-name">
          ${doctorHeaderName}
        </div>
        
        <div class="doc-specialty">
          <strong>Internal Medicine, Adult Cardiology, Vascular Medicine</strong><br/>
          Fellow, Philippine College of Physician<br/>
          Fellow, Philippine College of Cardiology<br/>
          Fellow, Philippine Society of Vascular Medicine
        </div>

        <div class="affiliations">
          <div>
            <strong>Hospital Affiliations:</strong><br/>
            Adventist Medical Center-Valencia<br/>
            Abella Midway Hospital<br/>
            Lavina General Hospital<br/>
            Valencia Polymedic General Hospital<br/>
            Medidas Medical Center<br/>
            Esther Hospital
          </div>
          <div style="text-align: right;">
            <strong>Clinic Address & Hours:</strong><br/>
            Adventist Medical Center: M-T-Th-F (1:00-4:00 pm)<br/>
            Abella Midway Hospital: Wed (1:00-4:00 pm)
          </div>
        </div>

        <div class="patient-block">
          <table class="patient-table">
            <tr>
              <td style="width: 58%;">Name: &nbsp;<span class="underline-text" style="min-width: 140px;">${patientName}</span></td>
              <td style="width: 42%;">Date: &nbsp;<span class="underline-text" style="min-width: 90px;">${dateStr}</span></td>
            </tr>
            <tr>
              <td>Address: &nbsp;<span class="underline-text" style="min-width: 130px;">${patientAddress}</span></td>
              <td>Age/Sex: &nbsp;<span class="underline-text" style="min-width: 60px;">${ageSex}</span></td>
            </tr>
          </table>
        </div>

        <div class="rx-symbol">Rx</div>

        <div class="rx-body">
          ${rxBodyContent}
        </div>

        <div style="clear: both; width: 100%;">
          <div class="signature-block">
            <div class="sig-line"></div>
            <div class="doc-sig-name">${doctorSigName}</div>
            <div class="doc-sig-sub">${doctorSpecialty}</div>
            <div>Lic #: ${licNo}</div>
            <div>PTR #: ${ptrNo}</div>
            <div>S2 Lic #: ${s2LicNo}</div>
          </div>
          <div class="clear"></div>
        </div>

        <div class="footer-quote">
          "A merry heart doeth good like a medicine." <span class="quote-ref">Proverbs</span> 17:22
        </div>

        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 24px; background-color: #0d9488; color: white; border: none; border-radius: 6px; font-size: 15px; cursor: pointer;">
            Print Prescription
          </button>
        </div>
      </div>
    </body>
    </html>
  `;

  executePrint(htmlContent);
}

export function printAppointmentSlip({ appointment, patient }) {
  const patientName = patient ? `${patient.first_name || ''} ${patient.middle_name || ''} ${patient.last_name || ''}`.replace(/\s+/g, ' ').trim() : 'Patient';
  const doctorName = appointment?.doctors ? `Dr. ${appointment.doctors.first_name} ${appointment.doctors.last_name}` : 'Unassigned Doctor';
  const specialty = appointment?.doctors?.specialty || '';
  const apptDate = appointment?.appointment_date ? new Date(appointment.appointment_date).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) : '-';
  const purpose = appointment?.purpose || 'General Consultation';
  const status = (appointment?.status || 'Scheduled').toUpperCase();
  const notes = appointment?.notes || '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Appointment Slip - ${patientName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; color: #0f172a; background: #f8fafc; margin: 0; padding: 20px; }
        .slip-card {
          max-width: 550px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 28px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 20px; }
        .clinic-name { font-size: 18px; font-weight: 700; color: #0d9488; text-transform: uppercase; letter-spacing: 0.5px; }
        .doc-name { font-size: 14px; font-weight: 600; color: #334155; margin-top: 4px; }
        .slip-title { text-align: center; font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
        .info-grid { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
        .row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; padding-bottom: 8px; border-bottom: 1px dashed #e2e8f0; }
        .label { font-weight: 600; color: #64748b; }
        .value { font-weight: 600; color: #0f172a; text-align: right; }
        .box { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #0f172a; line-height: 1.5; }
        .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #64748b; text-align: center; }
        @media print {
          body { background: white; padding: 0; }
          .slip-card { box-shadow: none; border: 1px solid #ccc; max-width: 100%; margin: 0; border-radius: 0; }
        }
      </style>
    </head>
    <body>
      <div class="slip-card">
        <div class="header">
          <div class="clinic-name">HEART & VASCULAR CLINICAL SERVICES</div>
          <div class="doc-name">Dr. Gladdays Casuga-Napigkit, MD, FPCP, FPCC, FPSVM</div>
        </div>
        <div class="slip-title">APPOINTMENT CONFIRMATION SLIP</div>
        
        <div class="info-grid">
          <div class="row">
            <span class="label">Patient Name:</span>
            <span class="value">${patientName}</span>
          </div>
          <div class="row">
            <span class="label">Date & Time:</span>
            <span class="value" style="color: #0d9488; font-size: 15px;">${apptDate}</span>
          </div>
          <div class="row">
            <span class="label">Attending Doctor:</span>
            <span class="value">${doctorName} ${specialty ? `(${specialty})` : ''}</span>
          </div>
          <div class="row">
            <span class="label">Purpose / Reason:</span>
            <span class="value">${purpose}</span>
          </div>
          <div class="row" style="border-bottom: none;">
            <span class="label">Status:</span>
            <span class="value" style="color: #0284c7;">${status}</span>
          </div>
        </div>

        ${notes ? `
          <div class="box">
            <strong>Notes:</strong> ${notes}
          </div>
        ` : ''}

        <div class="box" style="background: #fffbeb; border-color: #fde68a;">
          <strong>Reminder:</strong> Please arrive 15 minutes before your scheduled appointment time. Kindly bring any recent lab results or previous medical records.
        </div>

        <div class="footer">
          Printed on ${new Date().toLocaleString()} • MedDesk Clinic Management System
        </div>
      </div>
    </body>
    </html>
  `;

  executePrint(htmlContent);
}




