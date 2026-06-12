export interface CountryCode {
  code: string
  label: string
  phone: string
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: 'MX', label: 'México', phone: '+52' },
  { code: 'US', label: 'Estados Unidos', phone: '+1' },
  { code: 'ES', label: 'España', phone: '+34' },
  { code: 'AR', label: 'Argentina', phone: '+54' },
  { code: 'CO', label: 'Colombia', phone: '+57' },
  { code: 'CL', label: 'Chile', phone: '+56' },
  { code: 'PE', label: 'Perú', phone: '+51' },
  { code: 'EC', label: 'Ecuador', phone: '+593' },
  { code: 'VE', label: 'Venezuela', phone: '+58' },
  { code: 'GT', label: 'Guatemala', phone: '+502' },
  { code: 'CU', label: 'Cuba', phone: '+53' },
  { code: 'DO', label: 'República Dominicana', phone: '+1' },
  { code: 'BO', label: 'Bolivia', phone: '+591' },
  { code: 'UY', label: 'Uruguay', phone: '+598' },
  { code: 'PY', label: 'Paraguay', phone: '+595' },
  { code: 'CR', label: 'Costa Rica', phone: '+506' },
  { code: 'PA', label: 'Panamá', phone: '+507' },
  { code: 'PR', label: 'Puerto Rico', phone: '+1' },
  { code: 'BR', label: 'Brasil', phone: '+55' },
  { code: 'GB', label: 'Reino Unido', phone: '+44' },
  { code: 'FR', label: 'Francia', phone: '+33' },
  { code: 'DE', label: 'Alemania', phone: '+49' },
  { code: 'IT', label: 'Italia', phone: '+39' },
  { code: 'PT', label: 'Portugal', phone: '+351' },
]
