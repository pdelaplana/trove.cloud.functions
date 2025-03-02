import { Request } from 'firebase-functions/v2/https';

export interface ValidationResult<T = Record<string, any>> {
  isValid: boolean;
  missingFields: string[];
  source: 'body' | 'query' | null;
  values: T | null;
}

export const validateParams = <T = Record<string, any>>(
  request: Request,
  requiredFields: string[]
): ValidationResult<T> => {
  // Check body first
  if (request.method === 'POST' && request.body) {
    const missingFields = requiredFields.filter(
      (field) => !request.body[field]
    );
    if (missingFields.length === 0) {
      const values = requiredFields.reduce(
        (acc, field) => ({
          ...acc,
          [field]: request.body[field],
        }),
        {}
      ) as T;

      return {
        isValid: true,
        missingFields: [],
        source: 'body',
        values,
      };
    }
  }

  // Then check query parameters
  const missingFields = requiredFields.filter((field) => !request.query[field]);
  if (missingFields.length === 0) {
    const values = requiredFields.reduce(
      (acc, field) => ({
        ...acc,
        [field]: request.query[field],
      }),
      {}
    ) as T;

    return {
      isValid: true,
      missingFields: [],
      source: 'query',
      values,
    };
  }

  return {
    isValid: false,
    missingFields,
    source: null,
    values: null,
  };
};
