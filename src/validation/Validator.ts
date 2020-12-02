import {
  validate as validateP,
  validateSync as validateS,
} from 'class-validator';
import { ValidationErrorCollection } from './ValidationErrors';

export interface CanValidate {
  validate(): Promise<ValidationErrorCollection>;
  validateSync(): ValidationErrorCollection;
}

export function validate(obj): Promise<ValidationErrorCollection> {
  return validateP(obj).then((errors) => {
    return new ValidationErrorCollection(errors);
  });
}
export function validateSync(obj): ValidationErrorCollection {
  const errors = validateS(obj);
  return new ValidationErrorCollection(errors);
}
