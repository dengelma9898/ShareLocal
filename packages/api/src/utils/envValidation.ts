// Environment Variables Validation
// Prüft beim Start, ob alle erforderlichen Environment Variables gesetzt sind

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

const requiredEnvVars: EnvVar[] = [
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL Database Connection String',
    validator: (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
    errorMessage: 'DATABASE_URL must be a valid PostgreSQL connection string',
  },
  {
    name: 'JWT_SECRET',
    required: true,
    description: 'Secret key for JWT token signing',
    validator: (value) => value.length >= 32,
    errorMessage: 'JWT_SECRET must be at least 32 characters long',
  },
  {
    name: 'ENCRYPTION_KEY',
    required: true,
    description: 'Secret key for message encryption',
    validator: (value) => value.length >= 32,
    errorMessage: 'ENCRYPTION_KEY must be at least 32 characters long',
  },
];

const optionalEnvVars: EnvVar[] = [
  {
    name: 'PORT',
    required: false,
    description: 'Port number for the API server (default: 3001)',
    validator: (value) => {
      const port = parseInt(value, 10);
      return !isNaN(port) && port > 0 && port <= 65535;
    },
    errorMessage: 'PORT must be a valid port number (1-65535)',
  },
  {
    name: 'NODE_ENV',
    required: false,
    description: 'Node environment (development, production, test)',
    validator: (value) => ['development', 'production', 'test'].includes(value),
    errorMessage: 'NODE_ENV must be one of: development, production, test',
  },
  {
    name: 'LOG_LEVEL',
    required: false,
    description: 'Logging level (error, warn, info, debug)',
    validator: (value) => ['error', 'warn', 'info', 'debug'].includes(value),
    errorMessage: 'LOG_LEVEL must be one of: error, warn, info, debug',
  },
  // IONOS Object Storage Environment Variables (für später, wenn Cloud-Storage benötigt wird)
  // Aktuell nicht verwendet - MVP verwendet Server-basierte Speicherung
  // {
  //   name: 'IONOS_ENDPOINT',
  //   required: false,
  //   description: 'IONOS Object Storage endpoint URL (S3-kompatibel)',
  // },
  // {
  //   name: 'IONOS_ACCESS_KEY_ID',
  //   required: false,
  //   description: 'IONOS access key ID for Object Storage',
  // },
  // {
  //   name: 'IONOS_SECRET_ACCESS_KEY',
  //   required: false,
  //   description: 'IONOS secret access key for Object Storage',
  // },
  // {
  //   name: 'IONOS_BUCKET_NAME',
  //   required: false,
  //   description: 'IONOS bucket name for images',
  // },
];

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validiert alle Environment Variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Prüfe erforderliche Environment Variables
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar.name];

    if (!value) {
      errors.push(`❌ ${envVar.name} is required but not set. ${envVar.description}`);
      continue;
    }

    // Prüfe Validator, falls vorhanden
    if (envVar.validator && !envVar.validator(value)) {
      errors.push(`❌ ${envVar.name}: ${envVar.errorMessage || 'Invalid value'}`);
    }

    // Production-Sicherheits-Checks
    if (process.env.NODE_ENV === 'production') {
      if (envVar.name === 'JWT_SECRET' && value === 'change-me-in-production') {
        errors.push(`❌ ${envVar.name} must be changed in production environment`);
      }
      if (envVar.name === 'ENCRYPTION_KEY' && value === 'change-me-in-production') {
        errors.push(`❌ ${envVar.name} must be changed in production environment`);
      }
    }
  }

  // Prüfe optionale Environment Variables (nur Warnungen)
  for (const envVar of optionalEnvVars) {
    const value = process.env[envVar.name];

    if (value && envVar.validator && !envVar.validator(value)) {
      warnings.push(`⚠️  ${envVar.name}: ${envVar.errorMessage || 'Invalid value'}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validiert Environment Variables und wirft Fehler bei Problemen
 * Sollte beim App-Start aufgerufen werden
 */
export function validateEnvironmentOrThrow(): void {
  const result = validateEnvironment();

  // Verwende console für Validierung (wird vor Logger geladen)
  // Logger wird später in index.ts verwendet

  // Zeige Warnungen
  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment Variable Warnings:');
    result.warnings.forEach((warning) => console.warn(`  ${warning}`));
    console.warn('');
  }

  // Zeige Fehler und beende bei kritischen Problemen
  if (!result.isValid) {
    console.error('\n❌ Environment Variable Validation Failed:\n');
    result.errors.forEach((error) => console.error(`  ${error}`));
    console.error('\n💡 Please check your .env file and ensure all required variables are set correctly.\n');
    process.exit(1);
  }

  // Erfolgsmeldung (nur in Development)
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    console.log('✅ Environment variables validated successfully\n');
  }
}

/**
 * Gibt eine Liste aller erforderlichen Environment Variables zurück
 * (für Dokumentation)
 */
export function getRequiredEnvVars(): EnvVar[] {
  return [...requiredEnvVars];
}

/**
 * Gibt eine Liste aller optionalen Environment Variables zurück
 * (für Dokumentation)
 */
export function getOptionalEnvVars(): EnvVar[] {
  return [...optionalEnvVars];
}

