import { validate as validateP, validateSync as validateS } from 'class-validator';
import { ValidationErrorCollection } from './ValidationErrors';

export interface CanValidate {
  validate(): Promise<ValidationErrorCollection | true>
  validateSync(): ValidationErrorCollection | true
}

export function validate(obj): Promise<ValidationErrorCollection | true> {
  return validateP(obj).then(errors => {
    return !errors.length || new ValidationErrorCollection(errors);
  });
}
export function validateSync(obj): ValidationErrorCollection | true {
  const errors = validateS(obj)
  return !errors.length || new ValidationErrorCollection(errors);
}