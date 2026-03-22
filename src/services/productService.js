const mockProducts = {
  "macbook-pro-14": {
    id: "macbook-pro-14",
    name: "MacBook Pro 14",
    price: 1999,
    stock: 20,
  },
  "airpods-max": {
    id: "airpods-max",
    name: "AirPods Max",
    price: 549,
    stock: 35,
  },
};

const shouldUseMockProductService = () =>
  process.env.MOCK_EXTERNAL_SERVICES === "true" || !process.env.PRODUCT_SERVICE_URL;

exports.getProduct = async (productId) => {
  if (shouldUseMockProductService()) {
    return mockProducts[productId] || null;
  }

  try {
    const response = await fetch(`${process.env.PRODUCT_SERVICE_URL}/api/products/${productId}`);

    if (!response.ok) {
      throw new Error(`Product Service Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get product failed:", error.message);
    throw error;
  }
};

exports.reduceStock = async (productId, quantity) => {
  if (shouldUseMockProductService()) {
    const product = mockProducts[productId];

    if (!product) {
      throw new Error("Product not found");
    }

    if (product.stock < quantity) {
      throw new Error("Insufficient stock");
    }

    product.stock -= quantity;
    return { success: true, productId, remainingStock: product.stock, mocked: true };
  }

  try {
    const response = await fetch(
      `${process.env.PRODUCT_SERVICE_URL}/api/products/${productId}/reduce-stock`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      }
    );

    if (!response.ok) {
      throw new Error(`Reduce stock failed: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error("Reduce stock error:", err.message);
    throw err;
  }
};
