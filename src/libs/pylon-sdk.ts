import { Pylon } from "@backpack-fux/pylon-sdk";

const baseUrl = process.env.NEXT_PUBLIC_PYLON_BASE_URL;
if (!baseUrl) {
  throw new Error("NEXT_PUBLIC_PYLON_BASE_URL is not set");
}

const pylon = new Pylon({
  baseUrl,
});

export default pylon;
