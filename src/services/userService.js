const shouldUseMockUserService = () =>
  process.env.MOCK_EXTERNAL_SERVICES === "true" || !process.env.USER_SERVICE_URL;

exports.validateUser = async (userId) => {
  if (shouldUseMockUserService()) {
    return {
      id: userId,
      name: "Test User",
      email: "test@inova.local",
      mocked: true,
    };
  }

  try {
    const response = await fetch(`${process.env.USER_SERVICE_URL}/api/users/${userId}`);

    if (!response.ok) {
      throw new Error(`User Service Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    throw new Error("User validation failed: " + err.message);
  }
};

// Pass JWT Token
// exports.validateUser = async (userId, token) => {
//   const response = await fetch(
//     `${process.env.USER_SERVICE_URL}/api/users/${userId}`,
//     {
//       headers: {
//         Authorization: `Bearer ${token}`
//       }
//     }
//   );

//   if (!response.ok) {
//     throw new Error("User not found");
//   }

//   return await response.json();
// };
