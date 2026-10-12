
export type PassportOcrResult = {
  name: string;
  passportNo: string;
  nationality: string;
  dateOfBirth: string;
  sex: string;
  expiryDate: string;
  confidence: number;
  rawText: string;
};
