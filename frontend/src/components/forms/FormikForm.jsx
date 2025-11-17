import React from 'react';
import { Formik, Form as FormikForm } from 'formik';
import { Button } from '../ui';

const Form = ({
  initialValues,
  validationSchema,
  onSubmit,
  children,
  submitText = 'Submit',
  cancelText,
  onCancel,
  loading = false,
  className = '',
  ...props
}) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ handleSubmit, isSubmitting, isValid, dirty }) => (
        <FormikForm className={`space-y-6 ${className}`} {...props}>
          {children}
          
          <div className="flex justify-end space-x-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={loading || isSubmitting}
              >
                {cancelText || 'Cancel'}
              </Button>
            )}
            <Button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              disabled={!isValid || !dirty || loading || isSubmitting}
              loading={loading || isSubmitting}
            >
              {submitText}
            </Button>
          </div>
        </FormikForm>
      )}
    </Formik>
  );
};

export default Form;
