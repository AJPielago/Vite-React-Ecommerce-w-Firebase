import React from 'react';

const Privacy = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-4">Privacy & Data Deletion</h1>

      <p className="mb-4">
        We collect basic account information (name, email, profile picture) for account
        creation and order management. We may collect order history and shipping addresses
        so we can fulfill purchases.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Data Deletion</h2>
      <p className="mb-4">
        You can request deletion of your account and data by contacting support at
        <a className="text-blue-600 ml-1" href="mailto:support@example.com">support@example.com</a>.
        When a deletion request is received we will remove personal data from our
        databases and cancel any active subscriptions.
      </p>

      <h3 className="text-xl font-medium mt-4">Facebook Data Deletion</h3>
      <p className="mb-4">
        If you revoke access via Facebook, Facebook will call our data deletion callback
        to start the deletion process. This page confirms that your request will be
        handled within 7 days.
      </p>

      <p className="mt-8 text-gray-600">
        For specific requests: Email us at
        <a className="text-blue-600 ml-1" href="mailto:support@example.com">support@example.com</a>
      </p>
    </div>
  );
};

export default Privacy;
