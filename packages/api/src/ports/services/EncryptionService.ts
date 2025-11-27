// Port: Encryption Service Interface
// Definiert die Schnittstelle für Verschlüsselungs-Operationen
// Kann später durch verschiedene Implementierungen ersetzt werden

export interface EncryptionService {
  /**
   * Verschlüsselt einen Text-String
   * @param plaintext Der zu verschlüsselnde Text
   * @returns Verschlüsselter Text (Base64-kodiert)
   */
  encrypt(plaintext: string): string;

  /**
   * Entschlüsselt einen verschlüsselten Text
   * @param ciphertext Der verschlüsselte Text (Base64-kodiert)
   * @returns Entschlüsselter Text
   * @throws Error wenn Entschlüsselung fehlschlägt
   */
  decrypt(ciphertext: string): string;
}

