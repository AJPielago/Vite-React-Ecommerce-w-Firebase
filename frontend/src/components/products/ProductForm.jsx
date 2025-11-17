import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { productValidationSchema } from '../../utils/validations';
import { checkProfanity } from '../../services/profanityService';
import FormInput from '../forms/FormInput';
import Button from '../ui/Button';

const ProductForm = ({ initialValues, onSubmit, loading, submitText = 'Save Product' }) => {
  const [error, setError] = useState('');

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      setError('');
      
      // Check for profanity in text fields
      const textFields = ['name', 'description', 'brand'];
      for (const field of textFields) {
        if (values[field]) {
          const hasProfanity = await checkProfanity(values[field]);
          if (hasProfanity) {
            setFieldError(field, `The ${field} contains inappropriate language.`);
            return;
          }
        }
      }

      await onSubmit(values);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while saving the product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={productValidationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, errors, touched }) => (
          <Form className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <FormInput
                  name="name"
                  label="Product Name"
                  type="text"
                  required
                  placeholder="Enter product name"
                  error={errors.name && touched.name ? errors.name : null}
                />
              </div>

              <div className="sm:col-span-6">
                <FormInput
                  name="description"
                  label="Description"
                  as="textarea"
                  rows={4}
                  required
                  placeholder="Enter product description"
                  error={errors.description && touched.description ? errors.description : null}
                />
              </div>

              <div className="sm:col-span-3">
                <FormInput
                  name="price"
                  label="Price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  error={errors.price && touched.price ? errors.price : null}
                />
              </div>

              <div className="sm:col-span-3">
                <FormInput
                  name="countInStock"
                  label="Stock Quantity"
                  type="number"
                  min="0"
                  required
                  placeholder="0"
                  error={errors.countInStock && touched.countInStock ? errors.countInStock : null}
                />
              </div>

              <div className="sm:col-span-3">
                <FormInput
                  name="brand"
                  label="Brand"
                  type="text"
                  required
                  placeholder="Enter brand name"
                  error={errors.brand && touched.brand ? errors.brand : null}
                />
              </div>

              <div className="sm:col-span-3">
                <FormInput
                  name="category"
                  label="Category"
                  as="select"
                  required
                  error={errors.category && touched.category ? errors.category : null}
                >
                  <option value="">Select a category</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Books">Books</option>
                  <option value="Home">Home</option>
                  <option value="Sports">Sports</option>
                  <option value="Other">Other</option>
                </FormInput>
              </div>

              <div className="sm:col-span-6">
                <FormInput
                  name="image"
                  label="Image URL"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  error={errors.image && touched.image ? errors.image : null}
                />
              </div>
            </div>

            <div className="pt-5">
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isSubmitting || loading}
                  disabled={isSubmitting || loading}
                >
                  {submitText}
                </Button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ProductForm;
