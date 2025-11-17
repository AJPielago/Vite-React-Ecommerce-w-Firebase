import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { StarIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import { addReview as createReview, updateReview } from '../../services/reviewApi';
import { reviewValidationSchema } from '../../utils/validations';
import { checkProfanity } from '../../services/profanityService';

const ReviewForm = ({ productId, review, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(review?.rating || 0);
  const [hover, setHover] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const initialValues = {
    comment: review?.comment || '',
    rating: review?.rating || 0,
  };

  const handleSubmit = async (values, { setSubmitting, setFieldError, resetForm }) => {
    try {
      setIsSubmitting(true);
      setError('');

      // Check for profanity
      const hasProfanity = await checkProfanity(values.comment);
      if (hasProfanity) {
        setFieldError('comment', 'Your review contains inappropriate language. Please remove any offensive content.');
        return;
      }

      const reviewData = {
        comment: values.comment,
        rating: rating || values.rating,
        product: productId,
        user: user._id,
      };

      if (review) {
        await updateReview(review._id, reviewData);
      } else {
        await createReview(productId, reviewData);
      }

      resetForm();
      setRating(0);
      onSuccess && onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while submitting your review');
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {review ? 'Edit Review' : 'Write a Review'}
      </h3>
      
      {error && !isSubmitting && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={reviewValidationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ errors, touched, isSubmitting: formikSubmitting, setFieldValue }) => (
          <Form>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`h-8 w-8 ${
                      (hover || rating) >= star ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    onClick={() => {
                      setRating(star);
                      setFieldValue('rating', star);
                    }}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                  >
                    <StarIcon className="h-6 w-6" />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-500">
                  {rating ? `${rating} star${rating > 1 ? 's' : ''}` : 'Select a rating'}
                </span>
              </div>
              <ErrorMessage name="rating">
                {(msg) => <p className="mt-1 text-sm text-red-600">{msg}</p>}
              </ErrorMessage>
            </div>

            <div className="mb-4">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                Review <span className="text-red-500">*</span>
              </label>
              <Field
                as="textarea"
                id="comment"
                name="comment"
                rows={4}
                className={`block w-full rounded-md shadow-sm ${
                  errors.comment && touched.comment ? 'border-red-300' : 'border-gray-300'
                } focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Share your experience with this product..."
              />
              <ErrorMessage name="comment">
                {(msg) => <p className="mt-1 text-sm text-red-600">{msg}</p>}
              </ErrorMessage>
            </div>

            <div className="flex justify-end space-x-3">
              {onCancel && (
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  isSubmitting || !rating ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                disabled={isSubmitting || !rating}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : review ? (
                  'Update Review'
                ) : (
                  'Submit Review'
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ReviewForm;
