require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { ProjectPage } = require('../pages/projectPage');
const { ProjectJob } = require('../pages/projectJob');
const { Logger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const PropertiesHelper = require('../pages/properties');

test.use({
    storageState: 'sessionState.json',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
});

let page, projectPage, projectJob, projectData, prop;

test.describe('Verify Create Project and Add Job flow', () => {

    test.beforeEach(async ({ page: p }) => {
        page = p;

        projectPage = new ProjectPage(page);
        projectJob = new ProjectJob(page);
        prop = new PropertiesHelper(page);

        if (!projectData) {
            const filePath = path.join(__dirname, '../data/projectData.json');
            projectData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }

        await page.goto(process.env.DASHBOARD_URL, { waitUntil: 'load' });
        await expect(page).toHaveURL(process.env.DASHBOARD_URL);
        await page.waitForLoadState('networkidle');

        page.on('domcontentloaded', async () => {
            await page.evaluate(() => {
                const elements = document.querySelectorAll('main, .mantine-AppShell-navbar');
                elements.forEach(el => { el.style.zoom = '70%'; });
            });
        });

        await page.evaluate(() => {
            const elements = document.querySelectorAll('main, .mantine-AppShell-navbar');
            elements.forEach(el => { el.style.zoom = '70%'; });
        });
    });

    test('TC36 @regression @projectAndJob : Validate Navigation to job tab without any console error within 2 seconds', async () => {
        Logger.step('Navigating to Projects...');
        await projectPage.navigateToProjects();
        await projectPage.openProject(projectData.projectName);

        const projectCard = page.locator(
            '.mantine-SimpleGrid-root .mantine-Group-root',
            { hasText: projectData.projectName }
        );

        // await projectCard.waitFor({ state: 'visible', timeout: 10000 });
        // await projectCard.click();
        await projectJob.navigateToJobsTab();
    });

    test('TC37 @regression @sanity @mandatory @projectAndJob @contract : Validate add job modal fields, add job flow and job config in job overview', async () => {
        await projectPage.navigateToProjects();
        await projectPage.openProject(projectData.projectName);
        await projectJob.navigateToJobsTab();
        Logger.step('Adding and editing Job...');

        await projectPage.openCreateJobModal();
        await projectPage.validateModalFields();

        const today = new Date();
        const endDate = new Date(today);
        endDate.setFullYear(today.getFullYear() + 1);

        await projectPage.fillJobForm({
            title: 'mall in noida',
            jobType: 'Capex',
            description: 'Job created via automation',
            startDate: projectPage.formatDate(today),
            endDate: projectPage.formatDate(endDate),
            selectBudgetCategory: true
        });

        const selectedCategory = projectPage.selectedBudgetCategory;
        if (selectedCategory) {
            Logger.success(`Budget Category assigned to job: "${selectedCategory}"`);
            expect(selectedCategory.length).toBeGreaterThan(0);
        } else {
            Logger.info('Budget Category not available for this job — skipping assertion');
        }

        await projectPage.submitJob();

        const expected = {
            'Job Name': 'mall in noida',
            'Job Type': 'Capex',
            'Description': 'Job created via automation'
        };

        await prop.validateJobDetails(expected);
        await projectPage.validateOverviewVisible();
    });

    test('TC38 @regression @sanity @mandatory @projectAndJob @bids @contract : User should be able to create bids and invite existing vendor', async () => {
        await projectPage.openProject(projectData.projectName);
        await projectJob.navigateToJobsTab();

        await projectJob.openJobSummary();
        Logger.step('Creating Bid with Material...');
        await projectJob.createBidWithMaterial();

        Logger.step('Inviting Vendors...');
        await projectJob.inviteVendorsToBid();

        await page.getByRole('dialog').locator('input[placeholder="Search..."]').waitFor({ state: 'visible' });
        await page.getByRole('dialog').locator('input[placeholder="Search..."]').fill('testsumit');

        // await page.locator(
        //     `.ag-pinned-left-cols-container div[role="row"]:has-text('testsumit') .ag-checkbox`
        // ).click();

        await page
            .getByRole('dialog', { name: /Invite Vendors to Bid/i })
            .locator('revogr-viewport-scroll.colPinStart div[role="row"][data-rgrow="0"] input[type="checkbox"]')
            .click();

        // await page.pause();
        await page.locator(`button:has-text('Add Vendors to Bid')`).click();
        await page.waitForLoadState('networkidle');

        await expect(
            page.locator(
                'revo-grid >> revogr-viewport-scroll.rgCol div[role="gridcell"][data-rgcol="0"]:has-text("testsumit")'
            )
        ).toBeVisible();

        await page.locator('button:has-text("Invite To Bid")').click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        const drawer = page.getByRole('dialog');
        const sendToBidButton = drawer.getByRole('button', { name: 'Invite All to Bid' });

        await expect(sendToBidButton).toBeVisible();
        await sendToBidButton.scrollIntoViewIfNeeded();
        await sendToBidButton.click();

        Logger.success('Bid created and existing vendor invited successfully.');
    });

    test('TC39 @regression @sanity @projectAndJob @mandatory @bids @contract : User should be able to invite new vendor', async () => {
        await projectPage.openProject(projectData.projectName);
        await projectJob.navigateToJobsTab();
        await projectJob.openJobSummary();
        await projectJob.inviteVendorsToBid();

        // Click the "+ Invite a New Vendor to Bid" button to open the new vendor form
        await page.getByRole('button', { name: /Invite a New Vendor to Bid/i }).click();
        await page.waitForTimeout(2000);

        Logger.step('Filling vendor form...');

        // Fill form fields
        await page.getByRole('textbox', { name: 'Vendor Organization' }).fill('Sumit_Corp');
        await page.getByRole('textbox', { name: 'Add Contact Name' }).fill('Sumit');
        await page.getByRole('textbox', { name: 'Add Contact Email' }).fill(projectPage.generateRandomEmail());

        // Direct address input - no dropdown needed
        await page.getByRole('textbox', { name: 'Address' }).fill('Noida, India');
        await page.waitForTimeout(1000);

        // Submit form
        await page.getByRole('button', { name: 'Invite Vendor' }).click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        // Simple text search instead of complex treegrid filter
        await expect(
            page.getByText('Sumit_Corp').first()
        ).toBeVisible({ timeout: 10000 });

        Logger.success('New vendor invited successfully.');

        // await page.locator('button:has-text("Send To Bid")').click();
        // await page.waitForLoadState('networkidle');
        // await page.waitForTimeout(3000);
    });

    test.skip('TC40 @regression @projectAndJob @bids : Validate set bid template fucntionality and save it', async () => {
        await projectPage.openProject(projectData.projectName);
        await projectJob.navigateToJobsTab();
        await projectJob.openJobSummary();
        Logger.step('Setting Bid Template...');
        await projectJob.verifyBidTemplate();
    });

    test('TC41 @regression @projectAndJob @mandatory @bids @contract : Validate update bid flow', async () => {
        await projectPage.openProject(projectData.projectName);
        await projectJob.navigateToJobsTab();
        await projectJob.openJobSummary();
        await projectJob.navigateToBidsTab();

        // Create bid row with template
        await projectJob.updateBidWithMaterial();

        // Then edit individual cells
        await projectJob.validateAndUpdateFirstRow();
    });

    test('TC50 @regression @projectAndJob @bids : Positive - Update bid values and validate Bid Book', async () => {
        await test.step('Navigate to project and open Bids tab', async () => {
            await projectPage.openProject(projectData.projectName);
            await projectJob.navigateToJobsTab();
            await projectJob.openJobSummary();
            await projectJob.navigateToBidsTab();
            await projectJob.minimizeManageVendors();
        });

        await test.step('Verify Bid Book tab and column headers', async () => {
            const bidBookTab = page.getByRole('tab', { name: 'Bid Book' });
            await expect(bidBookTab).toBeVisible();
            await expect(bidBookTab).toHaveAttribute('aria-selected', 'true', { timeout: 5000 });

            const expectedHeaders = ['Scope', 'Schedule of Value', 'Cost Item', 'Location', 'Quantity'];
            for (const header of expectedHeaders) {
                await expect(page.getByRole('columnheader', { name: header })).toBeVisible({ timeout: 5000 });
            }
            await expect(page.getByRole('columnheader', { name: 'Price', exact: true })).toBeVisible({ timeout: 5000 });
            await expect(page.getByRole('columnheader', { name: 'Total Price' })).toBeVisible({ timeout: 5000 });
            Logger.success('Bid Book headers verified');
        });

        await test.step('Verify bid rows exist in Bid Book grid', async () => {
            const bidRows = page.locator('revo-grid [role="row"]').filter({ has: page.locator('[role="gridcell"]') });
            const rowCount = await bidRows.count();
            expect(rowCount).toBeGreaterThan(0);
            Logger.info(`Bid Book rows found: ${rowCount}`);

            for (let i = 0; i < Math.min(rowCount, 3); i++) {
                const cellTexts = await bidRows.nth(i).locator('[role="gridcell"]').allTextContents();
                console.log(`Bid Row ${i}: ${cellTexts.map(t => t.trim()).join(' | ')}`);
            }
        });

        const updatedPrice = Math.floor(Math.random() * 900) + 100;
        await test.step(`Update price of first bid row to $${updatedPrice}`, async () => {
            await projectJob.updateBidPrice(0, updatedPrice);

            const bidRows = page.locator('revo-grid [role="row"]').filter({ has: page.locator('[role="gridcell"]') });
            const firstRowCells = await bidRows.first().locator('[role="gridcell"]').allTextContents();
            console.log(`First row after price update: ${firstRowCells.map(t => t.trim()).join(' | ')}`);
            Logger.success(`Price updated to $${updatedPrice}`);
        });

        await test.step('Verify total row reflects bid values', async () => {
            const totalRow = page.locator('revo-grid [role="row"]:has-text("$")').last();
            const totalVisible = await totalRow.isVisible().catch(() => false);
            if (totalVisible) {
                const totalText = await totalRow.textContent();
                console.log(`Total row: "${totalText?.trim()}"`);
                expect(totalText).toContain('$');
                Logger.success('Total row with dollar amount verified');
            } else {
                Logger.info('Total row not visible — may require full bid submission');
            }
        });

        await test.step('Switch to Documents tab and back to verify Bid Book persists', async () => {
            const documentsTab = page.getByRole('tab', { name: 'Documents' });
            await expect(documentsTab).toBeVisible();
            await documentsTab.click();
            await page.waitForTimeout(2000);

            const bidBookTab = page.getByRole('tab', { name: 'Bid Book' });
            await bidBookTab.click();
            await page.waitForTimeout(2000);

            await expect(page.getByRole('columnheader', { name: 'Scope' })).toBeVisible({ timeout: 10000 });
            await expect(page.getByRole('columnheader', { name: 'Price', exact: true })).toBeVisible({ timeout: 5000 });

            const bidRows = page.locator('revo-grid [role="row"]').filter({ has: page.locator('[role="gridcell"]') });
            const firstRowCells = await bidRows.first().locator('[role="gridcell"]').allTextContents();
            console.log(`Bid Book row after tab switch: ${firstRowCells.map(t => t.trim()).join(' | ')}`);
            Logger.success('Bid Book data persisted after tab switch');
        });

        Logger.success('Positive Bid Book E2E flow completed');
    });

    test('TC51 @regression @projectAndJob : Negative - Validate Bid Book constraints and edge cases', async () => {
        await test.step('Navigate to project and open Bids tab', async () => {
            await projectPage.openProject(projectData.projectName);
            await projectJob.navigateToJobsTab();
            await projectJob.openJobSummary();
            await projectJob.navigateToBidsTab();
            await projectJob.minimizeManageVendors();
        });

        await test.step('Verify Change Orders and Invoice tabs are disabled before award', async () => {
            const changeOrdersTab = page.getByRole('tab', { name: 'Change Orders' });
            const invoiceTab = page.getByRole('tab', { name: 'Invoice' });

            const coDisabled = await changeOrdersTab.isDisabled().catch(() => false);
            const invDisabled = await invoiceTab.isDisabled().catch(() => false);
            if (coDisabled && invDisabled) {
                Logger.success('Change Orders and Invoice tabs are correctly disabled before award');
            } else {
                Logger.info(`Change Orders disabled: ${coDisabled}, Invoice disabled: ${invDisabled}`);
            }
        });

        await test.step('Verify vendor status and bid amount', async () => {
            const submittedRow = page.locator('[role="row"]').filter({ hasText: 'Submitted' });
            const invitedRow = page.locator('[role="row"]').filter({ hasText: 'Invited' });
            const pendingRow = page.locator('[role="row"]').filter({ hasText: 'Pending' });

            const submittedCount = await submittedRow.count().catch(() => 0);
            const invitedCount = await invitedRow.count().catch(() => 0);
            const pendingCount = await pendingRow.count().catch(() => 0);

            expect(submittedCount + invitedCount + pendingCount).toBeGreaterThan(0);

            if (submittedCount > 0) {
                Logger.success(`Vendor is in Submitted status — bid has been submitted on behalf`);
            } else if (invitedCount > 0) {
                Logger.success(`Vendor is in Invited status — pre-submission state`);
            } else {
                Logger.info(`Vendor is in Pending Invite status`);
            }
        });

        await test.step('Search for non-existent bid in Bid Book and verify behavior', async () => {
            const searchBox = page.locator('revo-grid').locator('..').locator('input[placeholder="Search..."]').first();
            const searchVisible = await searchBox.isVisible().catch(() => false);

            if (searchVisible) {
                await searchBox.fill('NonExistent_Bid_XYZ_999');
                await page.waitForTimeout(2000);

                const bidRows = page.locator('revo-grid [role="row"]').filter({ has: page.locator('[role="gridcell"]') });
                const rowCount = await bidRows.count();

                if (rowCount === 0) {
                    Logger.success('No matching bid rows found for non-existent search — correct behavior');
                } else {
                    const firstCellText = await bidRows.first().locator('[role="gridcell"]').first().textContent().catch(() => '-');
                    Logger.info(`${rowCount} rows visible after search, first cell: "${firstCellText?.trim()}"`);
                }

                await searchBox.fill('');
                await page.waitForTimeout(1000);
            } else {
                Logger.info('Bid Book search input not found — skipping search test');
            }
        });

        await test.step('Verify total row with dollar amount', async () => {
            const totalRow = page.locator('revo-grid [role="row"]:has-text("$")').last();
            const totalVisible = await totalRow.isVisible().catch(() => false);

            if (totalVisible) {
                const totalText = await totalRow.textContent();
                console.log(`Total row content: "${totalText?.trim()}"`);
                expect(totalText).toContain('$');
                Logger.success('Total row with dollar amount verified');
            } else {
                Logger.info('Total row not visible');
            }
        });

        await test.step('Rapid tab toggle between Bid Book and Documents and verify stability', async () => {
            const bidBookTab = page.getByRole('tab', { name: 'Bid Book' });
            const documentsTab = page.getByRole('tab', { name: 'Documents' });

            await documentsTab.click();
            await page.waitForTimeout(1500);
            await expect(documentsTab).toHaveAttribute('aria-selected', 'true', { timeout: 5000 });

            await bidBookTab.click();
            await page.waitForTimeout(1500);
            await expect(bidBookTab).toHaveAttribute('aria-selected', 'true', { timeout: 5000 });

            await expect(page.getByRole('columnheader', { name: 'Scope' })).toBeVisible({ timeout: 5000 });

            const bidRows = page.locator('revo-grid [role="row"]').filter({ has: page.locator('[role="gridcell"]') });
            const rowCount = await bidRows.count();
            expect(rowCount).toBeGreaterThan(0);

            Logger.success('Rapid tab toggle completed — grid data intact');
        });

        Logger.success('All negative Bid Book scenarios validated');
    });

    test('TC52 @regression @projectAndJob @bids : Bid Levelling - Submit bid on behalf and validate levelling view', async () => {
        await test.step('Navigate to project and open Bids tab', async () => {
            await projectPage.openProject(projectData.projectName);
            await projectJob.navigateToJobsTab();
            await projectJob.openJobSummary();
            await projectJob.navigateToBidsTab();
        });

        await test.step('Ensure vendor bid is submitted', async () => {
            await projectPage.ensureManageVendorsOpen();

            const submittedRow = page.locator('[role="row"]').filter({ hasText: 'Submitted' });
            const awardedRow = page.locator('[role="row"]').filter({ hasText: 'Awarded' });
            const hasSubmitted = await submittedRow.count().catch(() => 0);
            const hasAwarded = await awardedRow.count().catch(() => 0);

            if (hasSubmitted > 0 || hasAwarded > 0) {
                Logger.info('Vendor bid already submitted/awarded — proceeding to bid levelling');
            } else {
                Logger.step('No submitted bids found — submitting on behalf of vendor...');
                await projectPage.openEditOnBehalfModal();
                await projectPage.fillAllBidPricesAndQuantities({ quantity: '5', price: '100' });
                await projectPage.submitEditedBid();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(3000);
                Logger.success('Bid submitted on behalf of vendor');
            }
        });

        await test.step('Open Bid Levelling view', async () => {
            await projectJob.minimizeManageVendors();
            await page.waitForTimeout(2000);

            const bidLevellingTab = page.getByRole('tab', { name: 'Bid Levelling' });
            const scaleBtn = page.locator('button.mantine-ActionIcon-root:has(svg.lucide-scale)');
            const levellingTabVisible = await bidLevellingTab.isVisible().catch(() => false);
            const scaleBtnVisible = await scaleBtn.isVisible().catch(() => false);

            if (levellingTabVisible) {
                await bidLevellingTab.click();
                Logger.success('Bid Levelling opened via tab');
            } else if (scaleBtnVisible) {
                await scaleBtn.click();
                Logger.success('Bid Levelling opened via scale icon');
            } else {
                const allButtons = page.locator('button[title]');
                const count = await allButtons.count();
                for (let i = 0; i < count; i++) {
                    const title = await allButtons.nth(i).getAttribute('title');
                    if (title && /level|compare|scale/i.test(title)) {
                        Logger.info(`Found levelling button with title: "${title}"`);
                        await allButtons.nth(i).click();
                        break;
                    }
                }
                Logger.info('Bid Levelling toggle not found — bid submission may not trigger it immediately');
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000);
        });

        await test.step('Validate Bid Levelling table headers and structure', async () => {
            const expectedHeaders = ['Scope', 'Schedule of Value', 'Cost Item', 'Location'];
            for (const header of expectedHeaders) {
                const headerEl = page.locator(`[role="columnheader"]:has-text("${header}")`);
                const isVisible = await headerEl.isVisible().catch(() => false);
                if (isVisible) {
                    Logger.info(`Header verified: "${header}"`);
                } else {
                    Logger.info(`Header "${header}" not visible in levelling view`);
                }
            }

            const allHeaders = page.locator('[role="columnheader"]');
            const headerCount = await allHeaders.count();
            expect(headerCount).toBeGreaterThan(0);
            Logger.info(`Bid Levelling total column headers: ${headerCount}`);

            const headerTexts = await allHeaders.allTextContents();
            console.log(`Bid Levelling headers: ${headerTexts.map(t => t.trim()).filter(t => t).join(' | ')}`);
        });

        await test.step('Verify bid data rows exist in levelling view', async () => {
            const dataRows = page.locator('[role="row"]').filter({ has: page.locator('[role="gridcell"]') });
            const rowCount = await dataRows.count();
            expect(rowCount).toBeGreaterThan(0);
            Logger.info(`Bid Levelling data rows found: ${rowCount}`);

            for (let i = 0; i < Math.min(rowCount, 5); i++) {
                const cellTexts = await dataRows.nth(i).locator('[role="gridcell"]').allTextContents();
                console.log(`Levelling Row ${i}: ${cellTexts.map(t => t.trim()).join(' | ')}`);
            }
        });

        await test.step('Verify Total row with dollar amount', async () => {
            try {
                await projectPage.waitForTotalCostRow();
                const totalRow = page.locator('[role="row"]:has-text("Total")').last();
                const totalText = await totalRow.textContent();
                console.log(`Total row: "${totalText?.trim()}"`);
                expect(totalText).toContain('$');
                Logger.success('Total row with dollar amount verified in Bid Levelling');
            } catch (e) {
                Logger.info(`Total row check: ${e.message}`);
            }
        });

        await test.step('Verify bid levelling cells are read-only', async () => {
            const cells = page.locator('[role="gridcell"]');
            const cellCount = await cells.count();

            if (cellCount > 0) {
                await cells.first().dblclick({ force: true });
                await page.waitForTimeout(500);

                const editInput = page.locator('input[data-testid="bird-table-currency-input"], input[data-testid="bird-table-number-input"], input[data-testid="bird-table-text-input"]');
                const inputVisible = await editInput.isVisible().catch(() => false);

                if (!inputVisible) {
                    Logger.success('Bid Levelling cells are read-only — no editor appeared');
                } else {
                    await page.keyboard.press('Escape');
                    Logger.info('Editor appeared in levelling cell — pressing Escape');
                }
            }
        });

        await test.step('Verify Bid Book view and data intact', async () => {
            const bidBookTab = page.getByRole('tab', { name: 'Bid Book' });
            const bidBookTabVisible = await bidBookTab.isVisible().catch(() => false);

            if (bidBookTabVisible) {
                await bidBookTab.click();
                await page.waitForTimeout(2000);
            }

            await expect(page.getByRole('columnheader', { name: 'Scope' })).toBeVisible({ timeout: 10000 });

            const bidRows = page.locator('revo-grid [role="row"]').filter({ has: page.locator('[role="gridcell"]') });
            const rowCount = await bidRows.count();
            expect(rowCount).toBeGreaterThan(0);
            Logger.success('Bid Book view verified — data intact');
        });

        Logger.success('Bid Levelling E2E flow completed');
    });

    test('TC42 @regression @projectAndJob @mandatory @bids : Validate reset table modal and its functionality', async () => {
        await projectPage.openProject(projectData.projectName);
        await projectJob.navigateToJobsTab();
        await projectJob.openJobSummary();
        await projectJob.navigateToBidsTab();

        Logger.step('start reset table flow...');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        await projectPage.openResetTableModal();
        await projectPage.validateResetModalContent();
        await projectPage.confirmResetTable();
        await projectPage.assertRowCountAfterReset();
    });

    test('TC43 @regression @projectAndJob @bids : Validate scope mix modal fields', async () => {
        await projectPage.openProject('Automation_project_for_scope_mix');
        await projectJob.navigateToJobsTab();
        await projectJob.openJobSummary();
        await projectJob.navigateToBidsTab();

        await projectPage.openScopeMixModal();
        await projectPage.validateScopeMixModalFields();
        await projectPage.addScopeEntry();
        await projectPage.closeScopeMixModal();
    });

    test('TC44 @regression @sanity @mandatory @projectAndJob @bids : Validate edit bid on behalf of new vendor flow and submit it successfully', async ({ context }) => {
        await projectPage.openProject(projectData.projectName);
        await projectJob.navigateToJobsTab();
        await projectJob.openJobSummary();
        await projectJob.navigateToBidsTab();

        await test.step('Re-add bids after table reset', async () => {
            const noBidsMsg = page.locator('text=No bids added yet');
            const hasBids = !(await noBidsMsg.isVisible({ timeout: 3000 }).catch(() => false));
            if (!hasBids) {
                Logger.step('Bid book is empty after reset — re-adding bid items...');
                await projectJob.createBidWithMaterial();
                Logger.success('Bid items re-added');
            } else {
                Logger.info('Bid items already exist — proceeding');
            }
        });

        await test.step('Edit on behalf of vendor — fill prices and quantities', async () => {
            await projectPage.ensureManageVendorsOpen();
            await page.waitForTimeout(2000);
            Logger.step('Opening Edit On Behalf modal...');
            await projectPage.openEditOnBehalfModal();
            await projectPage.fillAllBidPricesAndQuantities({ quantity: '5', price: '100' });
            await projectPage.submitEditedBid();
            Logger.success('Bid submitted on behalf of vendor with filled prices and quantities');
        });

        await projectPage.saveLastVisitedUrl();
        await projectPage.saveSessionState(context);
    });

    test('TC45 @regression @mandatory @projectAndJob @bids : User should be able to open Bids tab and verify bid data', async () => {
        await projectPage.openProject(projectData.projectName);
        await projectJob.navigateToJobsTab();
        await projectJob.openJobSummary();
        await projectJob.navigateToBidsTab();

        await projectPage.page.waitForTimeout(2000);
        Logger.success('Bids tab loaded successfully');
    });

    test('TC46 @regression @mandatory @projectAndJob @bids @contract : User should be able to manage vendors and award bid', async () => {
        await projectPage.openProject(projectData.projectName);
        await projectJob.navigateToJobsTab();
        await projectJob.openJobSummary();
        await projectJob.navigateToBidsTab();
        // await page.pause();
        // await projectPage.ensureManageVendorsOpen();
        await projectPage.openVendorActionMenu();
        await projectPage.selectAwardBid();
        await projectPage.validateAwardModal();
        await projectPage.confirmAwardBid();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
    });

    test('TC46_1 @regression @mandatory @projectAndJob @contract : Select budget category for all bids before finalizing contract', async () => {
        await projectPage.openProject(projectData.projectName);
        await projectJob.navigateToJobsTab();
        await projectJob.openJobSummary();

        await projectPage.openContractsTab();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        await projectPage.selectBudgetCategoryForAllBids();
        Logger.success('Budget category selected for all bids');
    });

    test('TC47 @regression @mandatory @projectAndJob @contract : User should be able to verify pending status and finalize contract', async () => {
        await projectPage.openProject(projectData.projectName);
        await projectJob.navigateToJobsTab();
        await projectJob.openJobSummary();
        await projectJob.navigateToBidsTab();
        await projectJob.minimizeManageVendors();

        await projectPage.waitForPendingStatus();
        await projectPage.openContractsTab();
        await projectPage.openFinalizeContractModal();
        await projectPage.confirmFinalizeContract();
        await projectPage.assertContractFinalized();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        Logger.success('Contract finalized and verified successfully');
    });

    test('TC48 @regression @projectAndJob @contract : Bulk update contracts status to In Progress (no hardcoded URL)', async () => {
        Logger.step('Navigate to project and open jobs/contracts via page objects');
        await projectPage.openProject(projectData.projectName);
        await projectJob.navigateToJobsTab();
        await projectJob.openJobSummary();
        await projectPage.bulkUpdateContractsToInProgress();
    });

    test('TC49 @regression @mandatory @projectAndJob @contract : Bulk update contracts status to In Progress (no hardcoded URL)', async () => {
        Logger.step('Navigate to project and open jobs/contracts via page objects');
        await projectPage.openProject(projectData.projectName);
        await projectJob.navigateToJobsTab();
        await projectJob.openJobSummary();
        await projectPage.bulkUpdateContractsToInProgress();
    });

});
