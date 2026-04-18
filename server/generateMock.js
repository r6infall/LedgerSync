const fs = require('fs');

const suppliers = [
  "29AABCT3518Q1ZV",
  "27AAPFU0939F1ZV",
  "07BBNPP1234K2Z1",
  "33CDDSF5678L1Z9",
  "09EEWWD9012M1Z8"
];

const b2b = [];

let invCounter = 1000;
suppliers.forEach(ctin => {
  const invs = [];
  for (let i = 0; i < 4; i++) {
    const txval = Math.floor(Math.random() * 50000) + 1000; // 1000 to 51000
    const rt = 18;
    const cgst = (txval * 0.09);
    const sgst = (txval * 0.09);
    const val = txval + cgst + sgst;
    
    // Format date as dd-mm-yyyy
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const idt = `${day}-10-2024`;

    invs.push({
      "inum": `INV-2024-${invCounter++}`,
      "idt": idt,
      "val": val,
      "pos": "27",
      "rchrg": "N",
      "itms": [
        {
          "num": 1,
          "itm_det": {
            "txval": txval,
            "rt": rt,
            "igst": 0,
            "cgst": cgst,
            "sgst": sgst
          }
        }
      ]
    });
  }
  b2b.push({
    "ctin": ctin,
    "inv": invs
  });
});

const data = {
  "gstin": "27BBBBBBBBBBBBZ",
  "fp": "102024",
  "b2b": b2b
};

fs.writeFileSync('data/mock-gstr2a.json', JSON.stringify(data, null, 2));
console.log("Created mock-gstr2a.json");
