import { ValidationError } from 'class-validator';

export class ValidationErrorCollection {
  private readonly errorMap: Map<string, ValidationError>;
  constructor(private readonly errors: ValidationError[]) {
    this.errorMap = new Map(
      errors.map((error) => {
        return [error.property, error];
      }),
    );
  }

  public get isValid() {
    return !this.errors.length;
  }

  public hasError(property: string): boolean {
    return this.errorMap.has(property);
  }

  public getError(property: string): ValidationError | undefined {
    return this.errorMap.get(property);
  }

  public errorMessages(property: string): string[] {
    const error = this.getError(property);
    if (!error) {
      return [];
    }
    return Object.values(error.constraints);
  }
}
