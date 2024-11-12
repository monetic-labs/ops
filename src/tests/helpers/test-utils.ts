import { Page } from "@playwright/test";

export async function sendMessage(page: Page, message: string) {
  await page.getByTestId('chat-input').fill(message);
  await page.getByTestId('send-button').click();
}

export async function switchMode(page: Page, mode: 'agent' | 'support') {
  await page.getByRole('tab', { name: mode === 'agent' ? 'PACKS' : 'Support' }).click();
}

export async function waitForResponse(page: Page) {
  return await page.waitForResponse(response => 
    response.url().includes('/api/messaging') && 
    response.status() === 200
  );
}