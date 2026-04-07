/**
 * Pix Payload Generator (EMV QRCPS)
 * Following BACEN (Banco Central do Brasil) standards strictly.
 */

/**
 * Calculates the CRC16 CCITT-FALSE as required by BACEN.
 * Polynomial: 0x1021
 * Initial Value: 0xFFFF
 */
const generateCRC16 = (payload: string): string => {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= (payload.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
};

/**
 * Formats a field in the [ID][Length][Value] format.
 */
const formatField = (id: string, value: string): string => {
  const length = value.length.toString().padStart(2, '0');
  return id + length + value;
};

/**
 * Sanitizes text for EMV compliance (ASCII only, no special chars, max length).
 */
const sanitizeText = (text: string, maxLen: number): string => {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-zA-Z0-9 ]/g, "")   // Remove special chars
    .toUpperCase()
    .trim()
    .replace(/\s+/g, " ")           // Remove double spaces
    .substring(0, maxLen);
};

/**
 * Validates the generated Pix payload structure.
 */
export const validatePixPayload = (payload: string): boolean => {
  if (!payload || payload.length < 50) return false;
  
  // Basic structure checks
  const hasFormatIndicator = payload.startsWith("000201");
  const hasMerchantAccount = payload.includes("26");
  const hasCurrency = payload.includes("5303986");
  const hasCountry = payload.includes("5802BR");
  const hasCRC = payload.includes("6304");
  
  return hasFormatIndicator && hasMerchantAccount && hasCurrency && hasCountry && hasCRC;
};

export const generatePixPayload = (
  key: string,
  name: string,
  city: string,
  amount: number,
  keyType?: string
) => {
  // 1. Clean and validate key
  let cleanKey = key.trim();
  
  if (keyType === 'email' || cleanKey.includes('@')) {
    cleanKey = cleanKey.toLowerCase().replace(/\s/g, '');
  } else if (keyType === 'random' || (cleanKey.length >= 32 && !cleanKey.includes(' '))) {
    cleanKey = cleanKey.replace(/\s/g, '');
  } else if (keyType === 'phone') {
    const digitsOnly = cleanKey.replace(/\D/g, '');
    // Ensure +55 prefix for phone numbers
    if (digitsOnly.length === 10 || digitsOnly.length === 11) {
      cleanKey = '+55' + digitsOnly;
    } else if (digitsOnly.startsWith('55') && (digitsOnly.length === 12 || digitsOnly.length === 13)) {
      cleanKey = '+' + digitsOnly;
    } else {
      cleanKey = digitsOnly.startsWith('+') ? digitsOnly : '+' + digitsOnly;
    }
  } else if (keyType === 'cpf_cnpj') {
    cleanKey = cleanKey.replace(/\D/g, '');
  } else {
    // Fallback detection
    const digitsOnly = cleanKey.replace(/\D/g, '');
    if (cleanKey.includes('@')) {
      cleanKey = cleanKey.toLowerCase().replace(/\s/g, '');
    } else if (digitsOnly.length === 11) {
      cleanKey = digitsOnly;
    } else if (digitsOnly.length === 14) {
      cleanKey = digitsOnly;
    } else if (digitsOnly.length >= 10 && digitsOnly.length <= 11) {
      cleanKey = '+55' + digitsOnly;
    } else {
      cleanKey = cleanKey.replace(/\s/g, '');
    }
  }

  if (!cleanKey) {
    throw new Error('Chave Pix inválida.');
  }

  // 2. Sanitize Name and City
  const cleanName = sanitizeText(name, 25) || 'NEXORA';
  const cleanCity = sanitizeText(city, 15) || 'SAO PAULO';
  
  // 3. Merchant Account Information (ID 26)
  // Using uppercase for GUI as per user example for better compatibility
  const gui = formatField('00', 'BR.GOV.BCB.PIX');
  const keyField = formatField('01', cleanKey);
  const merchantAccount = formatField('26', gui + keyField);
  
  // 4. Build Payload Parts
  const payloadParts = [
    formatField('00', '01'), // Payload Format Indicator
    merchantAccount,         // Merchant Account Information
    formatField('52', '0000'), // Merchant Category Code (ID 52, Val 0000)
    formatField('53', '986'), // Transaction Currency (ID 53, Val 986)
  ];

  // Amount (ID 54) - Strict format: 2 decimal places with dot
  if (amount > 0) {
    payloadParts.push(formatField('54', amount.toFixed(2)));
  }

  payloadParts.push(formatField('58', 'BR')); // Country Code
  payloadParts.push(formatField('59', cleanName)); // Merchant Name
  payloadParts.push(formatField('60', cleanCity)); // Merchant City
  
  // Additional Data Field Template (ID 62) - TXID '***' for static Pix
  const txid = formatField('05', '***');
  payloadParts.push(formatField('62', txid));

  // 5. Add CRC16 (ID 63)
  const payloadBeforeCRC = payloadParts.join('') + '6304';
  const crc = generateCRC16(payloadBeforeCRC);
  const finalPayload = payloadBeforeCRC + crc;
  
  return finalPayload;
};
