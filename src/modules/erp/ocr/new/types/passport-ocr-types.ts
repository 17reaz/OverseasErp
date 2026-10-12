export type PassportOcrResult = {
  name: string;
  passportNo: string;
  nationality: string;
  dateOfBirth: string;
  sex: string;
  expiryDate: string;
  confidence: number;
  rawText: string;

  // new
  verified?: boolean; // passport no + DOB + expiry check digits all valid
  checks?: {
    passportNo: boolean;
    dateOfBirth: boolean;
    expiryDate: boolean;
    composite: boolean;
  };
  reviewFields?: Array<"name" | "passportNo" | "dateOfBirth" | "expiryDate">;
};