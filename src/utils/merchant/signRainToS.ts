export async function signRainTermsOfService(link: string) {
  const urlObj = new URL(link);
  const queryParams = new URLSearchParams(urlObj.search);
  const customer_id = queryParams.get("customer_id");
}
