import * as yup from 'yup';

// Common validation messages
const requiredField = 'This field is required';
const emailInvalid = 'Please enter a valid email';
const minLength = (length) => `Must be at least ${length} characters`;
const maxLength = (length) => `Must be at most ${length} characters`;

// User validations
export const loginValidationSchema = yup.object().shape({
  email: yup.string().transform(val => (val ? val.replace(/,/g, '.') : val)).email(emailInvalid).required(requiredField),
  password: yup.string().required(requiredField).min(6, minLength(6)),
});

export const registerValidationSchema = yup.object().shape({
  name: yup.string().required(requiredField).min(2, minLength(2)).max(50, maxLength(50)),
  email: yup.string().transform(val => (val ? val.replace(/,/g, '.') : val)).email(emailInvalid).required(requiredField),
  password: yup.string().required(requiredField).min(6, minLength(6)),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required(requiredField),
});

export const profileValidationSchema = yup.object().shape({
  name: yup.string().required(requiredField).min(2, minLength(2)).max(50, maxLength(50)),
  email: yup.string().transform(val => (val ? val.replace(/,/g, '.') : val)).email(emailInvalid).required(requiredField),
  currentPassword: yup.string().notRequired(),
  newPassword: yup.string()
    .when('currentPassword', {
      is: (val) => val && val.length > 0,
      then: (schema) => schema.required(requiredField).min(6, minLength(6)),
      otherwise: (schema) => schema.notRequired()
    }),
  confirmNewPassword: yup.string()
    .when('newPassword', {
      is: (val) => val && val.length > 0,
      then: (schema) => schema
        .oneOf([yup.ref('newPassword'), null], 'Passwords must match')
        .required(requiredField),
      otherwise: (schema) => schema.notRequired()
    }),
  shippingAddress: yup.object().shape({
    address: yup.string().max(100, maxLength(100)),
    city: yup.string().max(50, maxLength(50)),
    postalCode: yup.string().max(20, maxLength(20)),
    country: yup.string()
  })
});

// Product validations
export const productValidationSchema = yup.object().shape({
  name: yup.string().required(requiredField).min(3, minLength(3)).max(100, maxLength(100)),
  description: yup.string().required(requiredField).min(10, minLength(10)).max(2000, maxLength(2000)),
  price: yup
    .number()
    .typeError('Price must be a number')
    .required(requiredField)
    .positive('Price must be greater than 0')
    .max(1000000, 'Price must be less than $1,000,000'),
  countInStock: yup
    .number()
    .typeError('Stock must be a number')
    .required(requiredField)
    .integer('Stock must be a whole number')
    .min(0, 'Stock cannot be negative'),
  category: yup.string().required(requiredField),
  brand: yup.string().required(requiredField),
});

// Review validations
export const reviewValidationSchema = yup.object().shape({
  rating: yup
    .number()
    .required(requiredField)
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot be more than 5'),
  comment: yup
    .string()
    .required(requiredField)
    .min(10, 'Review must be at least 10 characters')
    .max(1000, 'Review cannot be longer than 1000 characters'),
});

// Address validations
export const addressValidationSchema = yup.object().shape({
  address: yup.string().required(requiredField).max(100, maxLength(100)),
  city: yup.string().required(requiredField).max(50, maxLength(50)),
  postalCode: yup.string().required(requiredField).max(20, maxLength(20)),
  country: yup.string().required(requiredField),
});

export const checkoutValidationSchema = yup.object().shape({
  shippingAddress: yup.object().shape({
    address: yup.string().required(requiredField),
    city: yup.string().required(requiredField),
    postalCode: yup.string().required(requiredField),
    country: yup.string().required(requiredField),
  }),
  paymentMethod: yup.string().required(requiredField),
});

// Custom validation functions
export const validateEmail = (email) => {
  return yup.string().email().isValidSync(email);
};

export const validatePassword = (password) => {
  return yup.string().min(6).isValidSync(password);
};

// Function to get error message from Yup error
export const getValidationError = (error) => {
  if (error instanceof yup.ValidationError) {
    return error.errors[0];
  }
  return error.message || 'Validation error';
};
