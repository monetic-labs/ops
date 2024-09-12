export async function signBridgeTermsOfService(link: string) {
  const urlObj = new URL(link);
  const queryParams = new URLSearchParams(urlObj.search);
  const customer_id = queryParams.get("customer_id");

  try {
    const response = await fetch("/api/sign-tos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ customer_id }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error signing terms of service:", error);
    throw error;
  }
}
