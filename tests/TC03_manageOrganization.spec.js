require('dotenv').config();
const { test, expect } = require('@playwright/test');
const OrganizationHelper = require('../pages/organizationHelper');
const data = require('../fixture/organization.json');

let context, page, org;

// Helper function to apply zoom
async function applyZoom(page) {
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const elements = document.querySelectorAll('main, .mantine-AppShell-navbar, body, .mantine-Modal-root');
    elements.forEach(el => {
      el.style.zoom = '70%';
    });
  });
}

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext({
    storageState: 'sessionState.json',
    recordVideo: { dir: 'videos/' }
  });

  page = await context.newPage();
  org = new OrganizationHelper(page);

  await org.goto(data.dashboardUrl);
  await applyZoom(page);
  
  await org.goToOrganization();
  await applyZoom(page);

  // Re-apply zoom on every navigation
  page.on('domcontentloaded', async () => {
    await applyZoom(page);
  });
});

test.afterAll(async () => {
  await context.close();
});

test.describe('Manage Organization Flow ', () => {

  test.beforeEach(async () => {
    await applyZoom(page);
  });

  test('@sanity @organization TC09 - Invite new user to organization with Member role', async () => {
    const email = `member_${Date.now()}@yopmail.com`;
    await org.inviteUser(email, 'Member');
    await applyZoom(page);
    await org.search(email);
    const row = await org.getRow(email);
    await org.validateInvitedBadge(row, email);
    expect(await org.visibleRowCount()).toBeGreaterThan(0);
  });

  test('@sanity @organization TC10 - Invite new user to organization with Admin role', async () => {
    const email = `admin_${Date.now()}@yopmail.com`;
    await org.inviteUser(email, 'Admin');
    await applyZoom(page);
    await org.search(email);
    const row = await org.getRow(email);
    await org.validateInvitedBadge(row, email);
    expect(await org.visibleRowCount()).toBeGreaterThan(0);
  });

  test('@sanity @organization TC11 - Revoke user invitation to organization', async () => {
    const email = `revoke_${Date.now()}@yopmail.com`;
    await org.inviteUser(email, 'Admin');
    await applyZoom(page);
    await org.search(email);
    const row = await org.getRow(email);
    await org.revoke(row, email);
    await applyZoom(page);
    await org.search(email);
    await org.verifyNoResults();
  });

  test('@sanity @organization TC12 - Resend user invitation to organization', async () => {
    await org.goto(data.organizationUrl);
    await applyZoom(page);
    const email = `revoke_${Date.now()}@yopmail.com`;
    await org.inviteUser(email, 'Admin');
    await applyZoom(page);
    await org.search(email);
    const row = await org.getRow(email);
    await org.openFirstMenu();
    await applyZoom(page);
    await org.resendInvite(email);
    await org.verifyResendSuccess(email);
  });

  test('@sanity @organization TC13 - Edit user role to organization', async () => {
    const email = 'tailorbird-admin@tailorbird.us';
    await org.search(email);
    await applyZoom(page);
    const row = await org.getRow(email);
    const newRole = await org.toggleRole(row);
    await applyZoom(page);
    await org.search(email);
    await org.verifyUpdatedRole(email, newRole);
  });

});
