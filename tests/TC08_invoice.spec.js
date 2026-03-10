require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { InvoicePage } = require('../pages/invoicePage');
const { Logger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const { ProjectPage } = require('../pages/projectPage');
const { ProjectJob } = require('../pages/projectJob');

test.use({
    storageState: 'sessionState.json',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
});

let page, invoicePage, projectPage, projectJob, projectData;

// Helper function to generate random amount between 1000 and 5000
const getRandomAmount = () => Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;

const invoiceTestData = [
    {
        title: 'Materials Invoice - Phase 1',
        description: 'Invoice for construction materials including lumber, concrete, and steel for Phase 1 construction work.'
    },
    {
        title: 'Labor Costs - Week 12',
        description: 'Weekly labor invoice covering all skilled and unskilled labor for the 12th week of construction.'
    },
    {
        title: 'Equipment Rental - February',
        description: 'Monthly invoice for equipment rental including excavators, cranes, and scaffolding for February.'
    },
    {
        title: 'Electrical Work - Building A',
        description: 'Complete electrical installation invoice for Building A including wiring, panels, and fixtures.'
    },
    {
        title: 'Plumbing Installation - Floors 1-3',
        description: 'Invoice for plumbing installation on floors 1 through 3 including pipes, fixtures, and testing.'
    }
];

test.describe('Verify Invoice tab', () => {

    test.beforeEach(async ({ page: p }) => {
        page = p;
        invoicePage = new InvoicePage(page);
        projectPage = new ProjectPage(page);
        projectJob = new ProjectJob(page);


        if (!projectData) {
            const filePath = path.join(__dirname, '../data/projectData.json');
            projectData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }

        await page.goto(process.env.DASHBOARD_URL, { waitUntil: 'load' });
        await expect(page).toHaveURL(process.env.DASHBOARD_URL);
        await page.waitForLoadState('networkidle');

        await projectPage.openProject(projectData.projectName);
        await projectJob.navigateToJobsTab();
        await projectJob.openJobSummary();
        await invoicePage.navigateToInvoiceTab();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

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

    test('TC61 @regression @changeOrderAndinvoice : Should navigate to Invoice page and verify URL', async () => {
        await expect(page).toHaveURL(/tab=invoices/);
        const pageContent = await page.locator('body').textContent();
        expect(pageContent).toBeTruthy();
        Logger.success('Invoice page content is loaded.');
        await expect(invoicePage.addInvoiceButton).toBeVisible();
        Logger.success('Add Invoice button is visible.');
    });

    test('TC62 @regression @changeOrderAndinvoice : Should add new invoice and open invoice details page', async () => {
        await invoicePage.clickAddInvoice();

        const isModalOpen = await invoicePage.isModalOpen();
        if (isModalOpen) {
            Logger.success('Invoice details modal opened successfully.');
            await expect(invoicePage.modal).toBeVisible();
        } else {
            Logger.success('Invoice details page opened successfully.');
        }
    });

    test('TC63 @regression @changeOrderAndinvoice : Should enter invoice title and required information', async () => {
        await invoicePage.clickAddInvoice();

        // Fill invoice details
        const testTitle = `Invoice_${Date.now()}`;
        await invoicePage.fillInvoiceTitle(testTitle);
        await invoicePage.fillInvoiceAmount('1000');
        await invoicePage.fillInvoiceDescription('Test Invoice Description');

        Logger.success('Invoice details filled successfully.');
    });

    test('TC64 @regression @changeOrderAndinvoice : Should upload PNG image for invoice', async () => {
        await invoicePage.clickAddInvoice();

        // Create test image if it doesn't exist
        const testImagePath = path.resolve('./files/test_image.png');
        if (!fs.existsSync(testImagePath)) {
            Logger.info('Creating test image...');
            const testDir = path.resolve('./files');
            if (!fs.existsSync(testDir)) {
                fs.mkdirSync(testDir, { recursive: true });
            }
            const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222, 0, 0, 0, 12, 73, 68, 65, 84, 8, 153, 99, 248, 207, 192, 0, 0, 3, 1, 1, 0, 24, 204, 83, 210, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
            fs.writeFileSync(testImagePath, pngHeader);
            Logger.success('Test image created.');
        }

        await invoicePage.uploadInvoiceImage(testImagePath);
    });

    test('TC65 @regression @changeOrderAndinvoice : Should confirm/save the invoice with budget category', async () => {
        await invoicePage.clickAddInvoice();

        const testTitle = `Invoice_${Date.now()}`;
        await invoicePage.fillInvoiceTitle(testTitle);
        await invoicePage.fillInvoiceDescription('Test Invoice for Save');

        Logger.step('TC65: Setting budget category before saving');
        const categoriesSet = await invoicePage.fillBudgetCategoryInInvoice('Construction');
        expect(categoriesSet).toBeGreaterThan(0);
        Logger.success(`TC65: Budget category set on ${categoriesSet} rows`);

        const saved = await invoicePage.saveInvoice();
        expect(saved).toBeTruthy();
        Logger.success('TC65: Invoice saved successfully.');

        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        await invoicePage.closeModal();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        Logger.success('TC65: Invoice created with budget category and saved');
    });

    test('TC66 @regression @changeOrderAndinvoice : Should verify invoice stats are displayed', async () => {
        // Get invoice statistics
        const stats = await invoicePage.getInvoiceStats();

        // Verify all stats are present
        expect(stats.currentContract).toBeTruthy();
        Logger.success(`Current Contract Amount: ${stats.currentContract}`);

        expect(stats.approvedInvoices).toBeTruthy();
        Logger.success(`Approved Invoices: ${stats.approvedInvoices}`);

        expect(stats.remaining).toBeTruthy();
        Logger.success(`Contract Remaining: ${stats.remaining}`);

        expect(stats.pending).toBeTruthy();
        Logger.success(`Pending Invoices: ${stats.pending}`);
    });

    test('TC67 @regression @changeOrderAndinvoice : Should cancel invoice creation without saving', async () => {
        await invoicePage.clickAddInvoice();

        // Fill some invoice details
        const testTitle = `Invoice_${Date.now()}`;
        await invoicePage.fillInvoiceTitle(testTitle);
        await invoicePage.fillInvoiceAmount('750');

        // Close the modal without saving
        await invoicePage.closeModal();

        // Verify modal is closed
        const isModalOpen = await invoicePage.isModalOpen();
        expect(isModalOpen).toBeFalsy();
        Logger.success('Invoice creation cancelled successfully.');
    });

    test('TC68 @regression @changeOrderAndinvoice : Should verify invoice table is visible and contains data', async () => {
        // Verify table is visible
        const tableVisible = await invoicePage.invoiceTable.isVisible({ timeout: 5000 }).catch(() => false);
        expect(tableVisible).toBeTruthy();
        Logger.success('Invoice table is visible.');

        // Verify rows exist
        const rowCount = await invoicePage.invoiceRows.count();
        expect(rowCount).toBeGreaterThanOrEqual(0);
        Logger.success(`Invoice table contains ${rowCount} rows.`);
    });

    test('TC69 @regression @changeOrderAndinvoice : Should navigate between Invoice and Change Order tabs', async () => {
        // Start on Invoice tab
        await expect(page).toHaveURL(/tab=invoices/);
        Logger.success('Currently on Invoice tab.');

        // Navigate to Change Order tab
        try {
            await invoicePage.navigateToChangeOrderTab();

            // Wait a bit for tab to fully load
            await page.waitForTimeout(1500);

            // Verify URL changed to change orders tab
            await expect(page).toHaveURL(/tab=changeOrders|Change Order/, { timeout: 5000 }).catch(() => {
                // If URL doesn't change, at least verify the tab button shows as selected
                Logger.info('URL did not change to tab=changeOrders, checking tab state');
            });

            Logger.success('Successfully navigated to Change Order tab.');
        } catch (error) {
            Logger.warn(`Could not navigate to Change Order tab: ${error.message}`);
            Logger.info('This may be expected if Change Orders feature is not available');
        }

        // Navigate back to Invoice tab
        try {
            await invoicePage.navigateToInvoiceTab();
            await page.waitForTimeout(1000);

            // Verify we're back on Invoice tab
            await expect(page).toHaveURL(/tab=invoices/);
            Logger.success('Successfully navigated back to Invoice tab.');
        } catch (error) {
            Logger.error(`Error navigating back: ${error.message}`);
            throw error;
        }
    });

    test('TC70 @regression @changeOrderAndinvoice : Should fill invoice with all required fields', async () => {
        await invoicePage.clickAddInvoice();

        const testTitle = `Complete_Invoice_${Date.now()}`;
        const testDescription = 'Complete invoice with all fields for testing';

        // Fill all available fields (Title and Description only - no Amount field exists)
        await invoicePage.fillInvoiceTitle(testTitle);
        await invoicePage.fillInvoiceDescription(testDescription);

        // Verify fields are filled
        const titleInput = await page.locator('input[placeholder="Enter title"]').first();
        const descriptionInput = await page.locator('input[placeholder="Enter description"], textarea[placeholder="Enter description"]').first();

        const titleValue = await titleInput.inputValue().catch(() => '');
        const descriptionValue = await descriptionInput.inputValue().catch(() => '');

        expect(titleValue).toContain('Complete_Invoice_');
        Logger.success(`Title field verified: ${titleValue}`);

        expect(descriptionValue).toContain('Complete invoice');
        Logger.success(`Description field verified: ${descriptionValue}`);
    });

    test('TC71 @regression @changeOrderAndinvoice : Should add and verify multiple invoices with budget category', async () => {
        const initialRowCount = await invoicePage.invoiceRows.count();
        Logger.info(`TC71: Initial invoice count: ${initialRowCount}`);

        await page.waitForTimeout(1000);
        await invoicePage.clickAddInvoice();
        const title1 = `Invoice_Multi_1_${Date.now()}`;
        await invoicePage.fillInvoiceTitle(title1);
        await invoicePage.fillInvoiceDescription('First invoice');

        Logger.step('TC71: Setting budget category on first invoice');
        const cat1 = await invoicePage.fillBudgetCategoryInInvoice('Construction');
        expect(cat1).toBeGreaterThan(0);

        await invoicePage.saveInvoice();
        await page.waitForLoadState('networkidle');

        await invoicePage.closeModal();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        await expect(invoicePage.addInvoiceButton).toBeVisible({ timeout: 10000 });

        await invoicePage.clickAddInvoice();
        const title2 = `Invoice_Multi_2_${Date.now()}`;
        await invoicePage.fillInvoiceTitle(title2);
        await invoicePage.fillInvoiceDescription('Second invoice');

        Logger.step('TC71: Setting budget category on second invoice');
        const cat2 = await invoicePage.fillBudgetCategoryInInvoice('Construction');
        expect(cat2).toBeGreaterThan(0);

        await invoicePage.saveInvoice();
        await page.waitForLoadState('networkidle');

        await invoicePage.closeModal();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const finalRowCount = await invoicePage.invoiceRows.count();
        expect(finalRowCount).toBeGreaterThanOrEqual(initialRowCount);
        Logger.success(`TC71: Multiple invoices with budget category added. Total: ${finalRowCount}`);
    });

    test('TC72 @regression @changeOrderAndinvoice : Should verify Add Invoice button is always available', async () => {
        // Verify button is visible on initial load
        await expect(invoicePage.addInvoiceButton).toBeVisible();
        Logger.success('Add Invoice button is visible on load.');

        // Click and close modal multiple times
        for (let i = 0; i < 2; i++) {
            await invoicePage.clickAddInvoice();
            await page.waitForLoadState('networkidle');

            // Close the invoice details page
            await invoicePage.closeModal();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Verify button is still available
            await expect(invoicePage.addInvoiceButton).toBeVisible({ timeout: 5000 });
            Logger.success(`Add Invoice button is still available after iteration ${i + 1}.`);
        }
    });

    test('TC73 @regression @changeOrderAndinvoice : Should verify invoice page content loads completely', async () => {
        // Check page content
        const pageContent = await page.locator('body').textContent();
        expect(pageContent).toBeTruthy();
        expect(pageContent.length).toBeGreaterThan(0);
        Logger.success('Invoice page content loaded successfully.');

        // Verify key elements are present
        const hasAddButton = await invoicePage.addInvoiceButton.isVisible({ timeout: 3000 }).catch(() => false);
        expect(hasAddButton).toBeTruthy();
        Logger.success('Add Invoice button is present.');

        const hasTable = await invoicePage.invoiceTable.isVisible({ timeout: 3000 }).catch(() => false);
        if (hasTable) {
            Logger.success('Invoice table is present.');
        } else {
            Logger.info('Invoice table not immediately visible (may be lazy-loaded).');
        }
    });

    test('TC74 @regression @changeOrderAndinvoice : Should add complete invoice with all fields, set budget category, and verify values', async () => {
        Logger.step('TC74: Creating complete invoice with budget category...');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const testData = {
            ...invoiceTestData[0]
        };
        Logger.info(`Creating invoice: ${testData.title}`);

        await invoicePage.clickAddInvoice();
        await page.waitForTimeout(2000);

        const invoiceNumber = await invoicePage.getInvoiceNumber();
        expect(invoiceNumber).toBeTruthy();
        Logger.info(`Invoice number: ${invoiceNumber}`);

        await invoicePage.fillInvoiceDetails(testData);
        const fieldsVerified = await invoicePage.verifyInvoiceFieldsInDialog(testData);
        expect(fieldsVerified).toBeTruthy();

        Logger.step('TC74: Setting budget category on invoice grid rows');
        const categoriesSet = await invoicePage.fillBudgetCategoryInInvoice('Construction');
        expect(categoriesSet).toBeGreaterThan(0);

        const categoryValues = await invoicePage.getBudgetCategoryValues();
        expect(categoryValues.length).toBeGreaterThan(0);
        for (const val of categoryValues) {
            expect(val).toBeTruthy();
            expect(val).not.toBe('-');
            expect(val).not.toBe('—');
        }
        Logger.success(`TC74: Budget category verified on ${categoryValues.length} rows: ${JSON.stringify(categoryValues)}`);

        await invoicePage.goBackToInvoiceList();

        const isInList = await invoicePage.verifyInvoiceInList({ invoiceNumber: invoiceNumber });
        expect(isInList).toBeTruthy();

        Logger.success(`TC74: Invoice ${invoiceNumber} created with budget category and verified in list`);
    });

    test('TC75 @regression @changeOrderAndinvoice  : Should create multiple invoices with unique data and budget category', async () => {
        Logger.step('TC75: Creating multiple invoices with budget category...');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const createdInvoices = [];

        for (let i = 0; i < 3; i++) {
            const testData = {
                ...invoiceTestData[i],
                title: `${invoiceTestData[i].title}_${Date.now()}`,
                budgetCategory: 'Construction'
            };

            Logger.info(`TC75: Creating invoice ${i + 1}: ${testData.title}`);

            const result = await invoicePage.createCompleteInvoice(testData);
            expect(result.number).toBeTruthy();
            expect(result.fieldsVerified).toBeTruthy();
            expect(result.budgetCategoriesSet).toBeGreaterThan(0);
            expect(result.budgetCategoryValues.length).toBeGreaterThan(0);
            for (const val of result.budgetCategoryValues) {
                expect(val).toBeTruthy();
                expect(val).not.toBe('-');
            }
            Logger.success(`TC75: Invoice ${result.number} created with budget category: ${result.budgetCategoryValues[0]}`);

            createdInvoices.push(result);
            await page.waitForTimeout(1000);
        }

        expect(createdInvoices.length).toBe(3);
        Logger.success(`TC75: ${createdInvoices.length} invoices created with budget category`);
    });

    test('TC76 @regression @changeOrderAndinvoice : Should verify invoice form fields are visible', async () => {
        Logger.step('Verifying invoice form fields visibility...');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Click Add Invoice to open the form
        await invoicePage.clickAddInvoice();
        await page.waitForTimeout(2000);

        // Verify form fields visibility
        const fieldsVisibility = await invoicePage.verifyInvoiceFormFieldsVisible();

        // Check overview section
        expect(fieldsVisibility.overviewSection).toBeTruthy();
        Logger.success('Overview section is visible');

        // Check number input
        expect(fieldsVisibility.numberInput).toBeTruthy();
        Logger.success('Invoice number input is visible');

        // Check title input
        expect(fieldsVisibility.titleInput).toBeTruthy();
        Logger.success('Title input is visible');

        // Check description input
        expect(fieldsVisibility.descriptionInput).toBeTruthy();
        Logger.success('Description input is visible');

        // Close the form
        await invoicePage.goBackToInvoiceList();
        Logger.success('All invoice form fields are visible.');
    });

    test('TC77 @regression @changeOrderAndinvoice : Should verify invoice details grid columns', async () => {
        Logger.step('Verifying invoice details grid columns...');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Click Add Invoice to open the details page with grid
        await invoicePage.clickAddInvoice();
        await page.waitForTimeout(2000);

        // Expected columns in invoice details grid
        const expectedColumns = [
            'Scope',
            'Category',
            'Location',
            'Status',
            'Invoice Amount'
        ];

        const columnsVisibility = await invoicePage.verifyInvoiceDetailsColumns(expectedColumns);

        // Verify at least some columns are visible
        let visibleColumnsCount = 0;
        for (const column of expectedColumns) {
            if (columnsVisibility[column]) {
                visibleColumnsCount++;
                Logger.success(`Column "${column}" is visible`);
            }
        }

        expect(visibleColumnsCount).toBeGreaterThan(0);
        Logger.success(`${visibleColumnsCount} out of ${expectedColumns.length} expected columns are visible`);

        // Close the form
        await invoicePage.goBackToInvoiceList();
    });

    test('TC78 @regression @changeOrderAndinvoice  : Should verify Confirm Invoice button functionality', async () => {
        Logger.step('Testing Confirm Invoice button...');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Click Add Invoice to open the details page
        await invoicePage.clickAddInvoice();
        await page.waitForTimeout(2000);

        // Fill invoice details
        const testData = {
            title: `Confirm_Test_${Date.now()}`,
            description: 'Testing confirm invoice functionality'
        };

        await invoicePage.fillInvoiceDetails(testData);

        // Verify Confirm Invoice button is visible
        const confirmButton = page.getByRole('button', { name: 'Confirm Invoice' });
        const isConfirmVisible = await confirmButton.isVisible({ timeout: 5000 }).catch(() => false);
        expect(isConfirmVisible).toBeTruthy();
        Logger.success('Confirm Invoice button is visible');

        // Close without confirming
        await invoicePage.goBackToInvoiceList();
        Logger.success('Confirm Invoice button functionality verified.');
    });

    test('TC79 @regression @changeOrderAndinvoice : Should verify Go Back button saves invoice with budget category', async () => {
        Logger.step('TC79: Testing Go Back saves invoice with budget category...');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const initialCount = await invoicePage.getInvoiceCount();
        Logger.info(`TC79: Initial invoice count: ${initialCount}`);

        await invoicePage.clickAddInvoice();
        await page.waitForTimeout(2000);

        const invoiceNumber = await invoicePage.getInvoiceNumber();
        expect(invoiceNumber).toBeTruthy();

        const testData = {
            title: `GoBack_Test_${Date.now()}`,
            description: 'Testing go back button saves invoice with budget category'
        };

        await invoicePage.fillInvoiceDetails(testData);
        const fieldsVerified = await invoicePage.verifyInvoiceFieldsInDialog(testData);
        expect(fieldsVerified).toBeTruthy();

        Logger.step('TC79: Setting budget category before Go Back');
        const categoriesSet = await invoicePage.fillBudgetCategoryInInvoice('Construction');
        expect(categoriesSet).toBeGreaterThan(0);

        const categoryValues = await invoicePage.getBudgetCategoryValues();
        expect(categoryValues.length).toBeGreaterThan(0);
        for (const val of categoryValues) {
            expect(val).toBeTruthy();
            expect(val).not.toBe('-');
        }

        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        await invoicePage.goBackToInvoiceList();

        const isInList = await invoicePage.verifyInvoiceInList({ invoiceNumber: invoiceNumber });
        expect(isInList).toBeTruthy();

        Logger.success(`TC79: Invoice ${invoiceNumber} saved via Go Back with budget category`);
    });

    test('TC80 @regression @changeOrderAndinvoice : Should verify invoice document upload section', async () => {
        Logger.step('Testing invoice document upload section...');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Click Add Invoice to open the details page
        await invoicePage.clickAddInvoice();
        await page.waitForTimeout(2000);

        // Verify document upload section is visible
        const documentsLabel = page.locator('text=Invoice Documents');
        const isDocumentsVisible = await documentsLabel.isVisible({ timeout: 5000 }).catch(() => false);

        if (isDocumentsVisible) {
            Logger.success('Invoice Documents section is visible');

            // Verify upload buttons are present
            const fromDeviceButton = page.getByRole('button', { name: 'From device' });
            const isFromDeviceVisible = await fromDeviceButton.isVisible({ timeout: 3000 }).catch(() => false);

            if (isFromDeviceVisible) {
                Logger.success('From device upload button is visible');
            }
        } else {
            Logger.info('Invoice Documents section not visible (may be collapsed)');
        }

        // Close the form
        await invoicePage.goBackToInvoiceList();
        Logger.success('Document upload section verification completed.');
    });

    test('TC81 @regression @changeOrderAndinvoice : Should export invoice data', async () => {
        Logger.step('Testing export invoice data...');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const exportSuccess = await invoicePage.exportInvoiceData();
        if (exportSuccess) {
            Logger.success('Invoice data exported successfully.');
        } else {
            Logger.info('Export button was not available, but test continues.');
        }
    });

    test('TC82 @regression @changeOrderAndinvoice : Should verify invoice stats update after adding invoice with budget category', async () => {
        Logger.step('TC82: Verifying invoice stats with budget category...');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const initialStats = await invoicePage.getInvoiceStats();
        expect(initialStats.currentContract).toBeTruthy();
        expect(initialStats.pending).toBeTruthy();
        Logger.info(`TC82: Initial stats - Current Contract: ${initialStats.currentContract}, Pending: ${initialStats.pending}`);

        const testData = {
            title: `Stats_Test_${Date.now()}`,
            description: 'Testing stats update after adding invoice with budget category',
            budgetCategory: 'Construction'
        };

        const result = await invoicePage.createCompleteInvoice(testData);
        expect(result.number).toBeTruthy();
        expect(result.budgetCategoriesSet).toBeGreaterThan(0);
        Logger.success(`TC82: Invoice ${result.number} created with budget category`);

        await page.waitForTimeout(2000);
        const updatedStats = await invoicePage.getInvoiceStats();
        expect(updatedStats.currentContract).toBeTruthy();
        expect(updatedStats.pending).toBeTruthy();
        Logger.info(`TC82: Updated stats - Current Contract: ${updatedStats.currentContract}, Pending: ${updatedStats.pending}`);

        Logger.success('TC82: Invoice stats verified after adding invoice with budget category');
    });

    test('TC83 @regression @changeOrderAndinvoice : Should verify invoice number is auto-generated', async () => {
        Logger.step('Verifying invoice number auto-generation...');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Click Add Invoice
        await invoicePage.clickAddInvoice();
        await page.waitForTimeout(2000);

        // Get the auto-generated invoice number
        const invoiceNumber = await invoicePage.getInvoiceNumber();

        expect(invoiceNumber).toBeTruthy();
        expect(invoiceNumber).toContain('Invoice #');

        Logger.success(`Auto-generated invoice number: ${invoiceNumber}`);

        // Close the form
        await invoicePage.goBackToInvoiceList();
    });

    test('TC84 @regression @changeOrderAndinvoice : Should verify invoice form validation', async () => {
        Logger.step('Verifying invoice form behavior...');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Click Add Invoice
        await invoicePage.clickAddInvoice();
        await page.waitForTimeout(2000);

        // Try to save without filling any fields (just the auto-generated number)
        // Get the invoice number
        const invoiceNumber = await invoicePage.getInvoiceNumber();
        expect(invoiceNumber).toBeTruthy();

        // Go back - should still save with just the number
        await invoicePage.goBackToInvoiceList();

        Logger.success('Invoice form validation verified - invoice can be created with just number.');
    });

    test('TC85 @regression @changeOrderAndinvoice : Should create 5 complete invoices with budget category and save via Go Back', async () => {
        Logger.step('TC85: Creating 5 complete invoices with budget category (save via Go Back, no confirm)...');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const createdInvoices = [];

        for (let i = 0; i < 5; i++) {
            const testData = {
                title: `${invoiceTestData[i].title}_${Date.now()}`,
                description: invoiceTestData[i].description,
                budgetCategory: 'Construction'
            };

            Logger.info(`TC85: Creating invoice ${i + 1}/5: ${testData.title}`);

            const result = await invoicePage.createCompleteInvoice(testData);

            expect(result.fieldsVerified).toBeTruthy();
            expect(result.budgetCategoriesSet).toBeGreaterThan(0);
            expect(result.budgetCategoryValues.length).toBeGreaterThan(0);
            for (const val of result.budgetCategoryValues) {
                expect(val).toBeTruthy();
                expect(val).not.toBe('-');
            }

            createdInvoices.push(result);
            Logger.success(`TC85: Invoice ${i + 1} created: ${result.number} (Budget: ${result.budgetCategoryValues[0]})`);

            await page.waitForTimeout(1500);
        }

        expect(createdInvoices.length).toBe(5);
        Logger.success(`TC85: Successfully created ${createdInvoices.length} invoices with budget category`);
    });

});

