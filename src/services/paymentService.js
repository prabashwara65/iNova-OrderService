const shouldUseMockPaymentService = () =>
  process.env.MOCK_EXTERNAL_SERVICES === "true" || !process.env.PAYMENT_SERVICE_URL;

exports.processPayment = async (orderId, userId, amount) => {
  if (shouldUseMockPaymentService()) {
    return {
      id: `PAY-${Date.now()}`,
      orderId,
      userId,
      amount,
      status: "COMPLETE",
      mocked: true,
    };
  }

  try {
    const response = await fetch(`${process.env.PAYMENT_SERVICE_URL}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
        userId,
        amount,
      }),
    });

    if (!response.ok) {
      throw new Error(`Payment Service Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Payment processing failed:", err.message);
    throw err;
  }
};
