export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  errorMessage: string;
}

export interface FieldValidation {
  [key: string]: ValidationRule;
}

// Валидация для кейсов
export const caseValidationRules: FieldValidation = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 100,
    errorMessage: 'Название должно быть от 3 до 100 символов'
  },
  description: {
    required: true,
    minLength: 10,
    maxLength: 2000,
    errorMessage: 'Описание должно быть от 10 до 2000 символов'
  },
  customerOrg: {
    required: true,
    minLength: 2,
    maxLength: 200,
    errorMessage: 'Название организации должно быть от 2 до 200 символов'
  },
  customerName: {
    required: true,
    minLength: 5,
    maxLength: 100,
    errorMessage: 'ФИО должно быть от 5 до 100 символов'
  },
  expectedResult: {
    required: true,
    minLength: 10,
    maxLength: 1000,
    errorMessage: 'Результат должен быть от 10 до 1000 символов'
  },
  criteria: {
    required: true,
    minLength: 20,
    maxLength: 2000,
    errorMessage: 'Критерии должны быть от 20 до 2000 символов'
  },
  programHead: {
    required: true,
    minLength: 5,
    maxLength: 100,
    errorMessage: 'ФИО руководителя должно быть от 5 до 100 символов'
  },
  educationProgram: {
    required: true,
    minLength: 5,
    maxLength: 150,
    errorMessage: 'Название программы должно быть от 5 до 150 символов'
  },
  semester: {
    required: true,
    errorMessage: 'Выберите семестр'
  }
};

// Валидация для логина
export const loginValidationRules: FieldValidation = {
  login: {
    required: true,
    minLength: 3,
    maxLength: 50,
    errorMessage: 'Логин должен быть от 3 до 50 символов'
  },
  password: {
    required: true,
    minLength: 4,
    maxLength: 50,
    errorMessage: 'Пароль должен быть от 4 до 50 символов'
  }
};

export const validateField = (value: string, rules: ValidationRule): string | null => {
  if (rules.required && !value.trim()) {
    return 'Поле обязательно для заполнения';
  }
  if (rules.minLength && value.trim().length < rules.minLength) {
    return rules.errorMessage;
  }
  if (rules.maxLength && value.trim().length > rules.maxLength) {
    return rules.errorMessage;
  }
  if (rules.pattern && !rules.pattern.test(value)) {
    return rules.errorMessage;
  }
  return null;
};

export const validateForm = (formData: Record<string, string>): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [field, value] of Object.entries(formData)) {
    const rules = caseValidationRules[field];
    if (rules) {
      const error = validateField(value, rules);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    }
  }

  return { isValid, errors };
};

export const validateFormWithRules = (
  formData: Record<string, string>, 
  validationRules: FieldValidation
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [field, value] of Object.entries(formData)) {
    const rules = validationRules[field];
    if (rules) {
      const error = validateField(value, rules);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    }
  }

  return { isValid, errors };
};