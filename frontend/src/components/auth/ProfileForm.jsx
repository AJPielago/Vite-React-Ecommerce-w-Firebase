import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { profileValidationSchema } from '../../utils/validations';
import { checkProfanity } from '../../services/profanityService';
import FormInput from '../forms/FormInput';
import Button from '../ui/Button';

const ProfileForm = ({ user, onSubmit, loading }) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const initialValues = {
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
    shippingAddress: {
      address: user?.shippingAddress?.address || '',
      city: user?.shippingAddress?.city || '',
      postalCode: user?.shippingAddress?.postalCode || '',
      country: user?.shippingAddress?.country || ''
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setError('');
      setSuccess('');

      // Check for profanity in name
      if (values.name) {
        const hasProfanity = await checkProfanity(values.name);
        if (hasProfanity) {
          setError('Your name contains inappropriate language.');
          return;
        }
      }

      // Prepare the data to submit
      const formData = {
        name: values.name,
        email: values.email?.replace(/,/g, '.') || values.email,
      };

      // Include shipping address if any field is filled
      if (values.shippingAddress && 
          (values.shippingAddress.address || 
           values.shippingAddress.city || 
           values.shippingAddress.postalCode || 
           values.shippingAddress.country)) {
        formData.shippingAddress = {
          ...values.shippingAddress,
          // Ensure we don't send empty strings
          address: values.shippingAddress.address || undefined,
          city: values.shippingAddress.city || undefined,
          postalCode: values.shippingAddress.postalCode || undefined,
          country: values.shippingAddress.country || undefined,
        };
      }

      // Only include password fields if current password is provided
      if (values.currentPassword) {
        formData.currentPassword = values.currentPassword;
        formData.newPassword = values.newPassword;
      }

      await onSubmit(formData);
      
      // Show success message
      setSuccess('Profile updated successfully!');
      
      // Reset password fields if password was changed
      if (values.currentPassword) {
        resetForm({
          values: {
            ...values,
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: '',
          },
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while updating your profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Profile Information</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
          {success}
        </div>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={profileValidationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, values }) => (
          <Form className="space-y-6">
            <div className="space-y-4">
              <FormInput
                name="name"
                label="Full Name"
                type="text"
                required
                placeholder="Enter your full name"
              />

              <FormInput
                name="email"
                label="Email Address"
                type="email"
                required
                placeholder="Enter your email address"
              />

              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Change Password</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Leave these fields blank if you don't want to change your password.
                </p>

                <div className="space-y-4">
                  <FormInput
                    name="currentPassword"
                    label="Current Password"
                    type="password"
                    placeholder="Enter your current password"
                  />

                  <FormInput
                    name="newPassword"
                    label="New Password"
                    type="password"
                    placeholder="Enter new password"
                    disabled={!values.currentPassword}
                  />

                  <FormInput
                    name="confirmNewPassword"
                    label="Confirm New Password"
                    type="password"
                    placeholder="Confirm new password"
                    disabled={!values.currentPassword}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Shipping Address</h3>
              <div className="space-y-4">
                <FormInput
                  name="shippingAddress.address"
                  label="Address"
                  type="text"
                  placeholder="1234 Market St"
                />

                <FormInput
                  name="shippingAddress.city"
                  label="City"
                  type="text"
                />

                <FormInput
                  name="shippingAddress.postalCode"
                  label="Postal Code"
                  type="text"
                />

                <FormInput
                  name="shippingAddress.country"
                  label="Country"
                  type="text"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isSubmitting || loading}
                disabled={isSubmitting || loading}
                className="w-full sm:w-auto"
              >
                Update Profile
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ProfileForm;
