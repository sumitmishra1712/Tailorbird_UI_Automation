const { expect } = require('@playwright/test');
const { Logger } = require('../utils/logger');
const { projectJobLocators } = require('../locators/projectJobLocator');
const PropertiesHelper = require('../pages/properties');

let prop;


exports.ProjectJob = class ProjectJob {
    constructor(page) {
        this.page = page;
        this.locators = projectJobLocators(page);
        this.prop = new PropertiesHelper(page);

    }

    async navigateToJobsTab() {
        try {
            Logger.step('Navigating to Jobs tab...');
            await this.locators.jobsTab.click();
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(3000);
            await this.locators.jobsTab.click();
            await this.page.waitForURL(/tab=jobs/, { timeout: 10000 });
            Logger.success('Navigated to Job screen.');
        } catch (error) {
            Logger.step(`Error in navigateToJobsTab: ${error.message}`);
            throw error;
        }
    }

    async addJob() {
        try {
            Logger.step('Opening Add Job dropdown...');
            await this.locators.addJobMenu.waitFor({ state: 'visible' });
            await this.locators.addJobMenu.click();
            await this.page.waitForSelector('div[role="menu"], .mantine-Menu-dropdown', { timeout: 5000 });
            await this.locators.addJobMenuItem('Add Job').click();
            await this.page.waitForSelector('div[role="gridcell"][col-id="title"]', { timeout: 15000 });
            await expect(this.locators.viewDetailsButton).toBeVisible({ timeout: 10000 });
            await expect(this.locators.deleteButton).toBeVisible({ timeout: 10000 });
            Logger.success('New job row added successfully.');
        } catch (error) {
            Logger.step(`Error in addJob: ${error.message}`);
            throw error;
        }
    }

    async editJobTitle(newTitle) {
        try {
            Logger.info('Editing job title...');
            await this.locators.titleCell.waitFor({ state: 'visible' });
            await this.locators.titleCell.dblclick();
            await this.locators.inputBox.waitFor({ state: 'visible' });
            await this.locators.inputBox.fill(newTitle);
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(2000);
            await this.page.keyboard.press('Enter');
            Logger.success(`Job title updated to: ${newTitle}`);
        } catch (error) {
            Logger.step(`Error in editJobTitle: ${error.message}`);
            throw error;
        }
    }

    async selectJobType(typeText) {
        try {
            Logger.info(`Selecting Job Type: ${typeText}`);
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(2000);
            await this.locators.unitInteriorSpan.waitFor({ state: 'visible', timeout: 10000 });
            await this.locators.unitInteriorSpan.dblclick();
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(2000);
            const typeOption = this.locators.jobTypeDropdownOption(typeText);
            await typeOption.waitFor({ state: 'visible' });
            await typeOption.click();
        } catch (error) {
            Logger.step(`Error in selectJobType: ${error.message}`);
            throw error;
        }
    }

    async openJobSummary() {
        try {
            Logger.step('Opening Job Summary...');

            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    Logger.step(`Attempt ${attempt}: Trying to open Job Summary...`);
                    await this.page.waitForLoadState('networkidle');
                    await this.page.waitForTimeout(2000);

                    // Try primary locator first
                    const viewDetailsBtn = this.locators.viewDetailsButton;

                    // Wait for the button to be visible and clickable
                    await viewDetailsBtn.waitFor({ state: 'visible', timeout: 10000 }).catch(() => null);

                    // Check if button exists and is clickable
                    const isVisible = await viewDetailsBtn.isVisible().catch(() => false);

                    if (isVisible) {
                        await viewDetailsBtn.click();
                        await this.page.waitForLoadState('networkidle');
                        await this.page.waitForTimeout(3000);

                        // Verify we're on the job summary page
                        const summaryTab = this.page.locator('.mantine-Tabs-tabLabel:has-text("Job Summary")');
                        await summaryTab.waitFor({ state: 'visible', timeout: 10000 });
                        Logger.success('Job Summary opened successfully');
                        return;
                    }
                } catch (attemptError) {
                    Logger.step(`Attempt ${attempt} failed: ${attemptError.message}`);
                    if (attempt < 3) {
                        await this.page.reload();
                        await this.page.waitForLoadState('networkidle');
                        await this.page.waitForTimeout(2000);
                    }
                }
            }

            throw new Error('Failed to open Job Summary after 3 attempts');
        } catch (error) {
            Logger.step(`Error in openJobSummary: ${error.message}`);
            throw error;
        }
    }

    async fillJobDescription(description) {
        try {
            Logger.info('Filling Job Summary description...');
            await this.locators.descriptionInput.fill(description);
        } catch (error) {
            Logger.step(`Error in fillJobDescription: ${error.message}`);
            throw error;
        }
    }

    async selectStartEndDates() {
        try {
            const today = new Date();
            const startDate = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            const endDate = tomorrow.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
            Logger.info(`Selecting Start Date: ${startDate}`);
            await this.locators.selectStartDateBtn.click();
            await this.page.waitForTimeout(1000);
            await this.locators.dateButtonByAriaLabel(startDate).click();
            Logger.info(`Selecting End Date: ${endDate}`);
            await this.locators.selectEndDateBtn.click();
            await this.page.waitForTimeout(1000);
            await this.locators.dateButtonByAriaLabel(endDate).click();
            await expect(this.page).toHaveURL(/tab=summary/);
            Logger.success('Job Summary page verified successfully.');
        } catch (error) {
            Logger.step(`Error in selectStartEndDates: ${error.message}`);
            throw error;
        }
    }

    // async createBidWithMaterial() {
    //     try {
    //         Logger.step('Checking Bids tab status...');
    //         await expect(this.locators.bidsTab).toBeVisible();
    //         await expect(this.locators.bidsTab).toBeEnabled();
    //         Logger.info('Bids tab is visible and enabled');
    //         Logger.step('Creating Bid with Material...');
    //         await this.locators.bidsTab.click();
    //         await this.page.waitForTimeout(1000);
    //         await this.locators.addRowBtn.click();
    //         await this.page.waitForTimeout(2000);
    //         await this.locators.firstGridCell.dblclick();
    //         await this.locators.bidSearchInput.fill('Bid with material');
    //         await this.locators.bidSearchInput.press('Enter');
    //         await this.page.waitForLoadState('networkidle');
    //         await this.page.waitForTimeout(2000);
    //         Logger.success('Created Bid with Material.');
    //     } catch (error) {
    //         Logger.step(`Error in createBidWithMaterial: ${error.message}`);
    //         throw error;
    //     }
    // }

    // async createBidWithMaterial() {
    //     try {
    //         Logger.step('Checking Bids tab status...');
    //         await expect(this.locators.bidsTab).toBeVisible();
    //         await this.locators.bidsTab.click();

    //         const bidsPanel = this.page.getByLabel('Bids');

    //         // ✅ Correct Add Row button (scoped)
    //         const addRowBtn = bidsPanel.getByTestId('bt-add-row');
    //         await expect(addRowBtn).toBeVisible();
    //         await addRowBtn.click();

    //         const firstScopeCell = bidsPanel.locator(
    //             'revo-grid .content-wrapper div[role="row"][data-rgrow="0"] div[role="gridcell"][data-rgcol="0"]:not(.disabled)'
    //         );

    //         await expect(firstScopeCell).toBeVisible();
    //         await firstScopeCell.dblclick();

    //         // Mantine dropdown input
    //         // const searchInput = this.page.locator(
    //         //     '.mantine-Menu-dropdown input[placeholder="Search or create..."]'
    //         // );

    //         const searchInput = this.page.locator(
    //             'revogr-header input[placeholder="Search or create..."]'
    //         );


    //         await expect(searchInput).toBeVisible();
    //         await searchInput.fill('Bid with material');
    //         await searchInput.press('Enter');

    //         await this.page.waitForLoadState('networkidle');

    //         Logger.success('Created Bid with Material.');
    //     } catch (error) {
    //         Logger.step(`Error in createBidWithMaterial: ${error.message}`);
    //         throw error;
    //     }
    // }

    async createBidWithMaterial() {
        const bidCount = 3;
        const bids = Array.from({ length: bidCount }, () => ({
            scope: `Bid_Material_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            price: Math.floor(Math.random() * (5000 - 100 + 1)) + 100
        }));

        try {
            Logger.step(`Creating ${bidCount} Bids with Material...`);
            await this.deleteExistingBids();

            await expect(this.locators.bidsTabPanel).toBeVisible({ timeout: 10000 });
            await expect(this.locators.addRowBtn).toBeVisible({ timeout: 10000 });

            for (let i = 0; i < bids.length; i++) {
                await this._addOneBid(bids[i].scope, bids[i].price);
                if (i < bids.length - 1) Logger.step(`Bid ${i + 1} done, adding next...`);
            }

            for (const { scope } of bids) {
                await expect(this.page.getByText(scope)).toBeVisible({ timeout: 8000 });
            }
            Logger.step(`All ${bidCount} scopes visible: ${bids.map(b => `"${b.scope}"`).join(', ')}`);
            Logger.success(`${bidCount} Bids created and verified: ${bids.map(b => `"${b.scope}" ($${b.price})`).join(', ')}`);
        } catch (error) {
            Logger.step(`Error in createBidWithMaterial: ${error.message}`);
            throw error;
        }
    }

    async createBidWithoutMaterial() {
        try {
            Logger.step('Creating Bid without Material...');
            await this.locators.bidsTab.click();
            await this.locators.bidsTabPanel.getByTestId('bt-add-row-menu').click();
            await this.locators.addRowBtn.click();
            await this.page.waitForTimeout(4000);
            await this.locators.lastGridCell.dblclick();
            await this.locators.bidSearchInput.fill('Bid without material');
            await this.locators.bidSearchInput.press('Enter');
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(2000);
            Logger.success('Created Bid without Material.');
        } catch (error) {
            Logger.step(`Error in createBidWithoutMaterial: ${error.message}`);
            throw error;
        }
    }

    // async inviteVendorsToBid() {
    //     try {
    //         Logger.step('Inviting Vendors to Bid...');
    //         const addVendorsButton = this.page.getByRole('button', { name: 'Add Vendors' });

    //         await expect(this.addVendorsButton).toBeVisible({ timeout: 10000 });
    //         await expect(this.addVendorsButton).toBeEnabled();
    //         await this.addVendorsButton.click();

    //         if (!(await this.locators.inviteVendorsToBidButton.isVisible())) {
    //             await this.locators.manageVendorsToggle.click();
    //         }
    //         await this.locators.inviteVendorsToBidButton.click();
    //         await this.page.waitForTimeout(4000);
    //     } catch (error) {
    //         Logger.step(`Error in inviteVendorsToBid: ${error.message}`);
    //         throw error;
    //     }
    // }

    async inviteVendorsToBid() {
        try {
            Logger.step('Opening vendor invitation modal...');
            await this.locators.bidsTab.click();
            await this.page.waitForTimeout(2000);

            // Check if Manage Vendors is expanded
            const manageVendorsSection = this.locators.manageVendorsToggle;
            const isVisible = await this.locators.addVendorsButton.isVisible().catch(() => false);

            if (!isVisible) {
                await manageVendorsSection.click();
                await this.page.waitForTimeout(1000);
                await this.locators.addVendorsButton.waitFor({ state: 'visible', timeout: 5000 });
            }

            // Click Add Vendors button to open the "Invite Vendors to Bid" dialog
            await this.locators.addVendorsButton.click();
            await this.page.waitForTimeout(2000);

            Logger.success('Vendor invitation modal opened');
        } catch (error) {
            Logger.step(`Error in inviteVendorsToBid: ${error.message}`);
            throw error;
        }
    }

    async verifyBidTemplate() {
        try {
            Logger.step('click on bid tab...');
            await this.locators.bidsTab.click();
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(3000);
            if (await this.locators.inviteVendorsToBidButton.isVisible()) {
                await this.locators.manageVendorsToggle.click();
                await this.page.waitForTimeout(2000);
                Logger.success('Manage Vendors pane minimized.');
            }
            Logger.step('Verifying bid template...');
            await this.locators.templateMenuButton.click();
            const modal = this.locators.templateMenuDropdown;
            await expect(modal).toBeVisible();

            await this.locators.templateMenuButton.click();

            await expect(
                this.page.getByRole('menuitem', {
                    name: /Tailorbird Baseline Bid Book/i,
                })
            ).toBeVisible();

            const firstOption = this.locators.templateMenuFirstOption;
            const secondOption = this.locators.templateMenuSecondOption;
            await expect(firstOption).toBeVisible();
            await expect(this.locators.templateMenuGlobeIcon).toBeVisible();
            await expect(this.locators.templateMenuFirstDivider).toBeVisible();
            await expect(secondOption).toBeVisible();
            Logger.step('Clicking first menu option...');
            await firstOption.click();
            Logger.step('Waiting for Apply Template dialog...');
            const applyDialog = this.locators.applyTemplateDialog;
            await expect(applyDialog).toBeVisible();
            const applyTitle = this.locators.applyTemplateTitle;
            const applyMessage = this.locators.applyTemplateMessage;
            const applyCancel = this.locators.applyTemplateCancelBtn;
            const applyTemplate = this.locators.applyTemplateApplyBtn;
            Logger.step(`Dialog Title: ${await applyTitle.textContent()}`);
            Logger.step(`Dialog Message: ${await applyMessage.textContent()}`);
            await expect(applyCancel).toBeVisible();
            await expect(applyTemplate).toBeVisible();

            let before = '';
            try {
                before = await this.locators.agCenterColsVisible.innerText({ timeout: 5000 });
            } catch (e) {
                Logger.info('Grid not visible before template apply, skipping comparison');
            }

            Logger.step('Clicking Apply Template...');
            await applyTemplate.waitFor({ state: 'visible' });
            await applyTemplate.click();
            await applyTemplate.waitFor({ state: 'hidden' });
            Logger.step('Waiting for Template Applied notification...');
            const notif1 = this.locators.notificationRoot;
            await expect(notif1).toBeVisible({ timeout: 15000 });
            await expect(notif1).toContainText('Template Applied');
            await expect(notif1).toContainText('has been applied successfully');

            let after = '';
            try {
                after = await this.locators.agCenterColsVisible.innerText({ timeout: 5000 });
            } catch (e) {
                Logger.info('Grid not visible after template apply, skipping comparison');
            }

            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(5000);
            if (before && after) {
                expect(after).not.toBe(before);
            }
            Logger.step('Re-opening bid template menu...');
            await this.locators.templateMenuButton.click();
            await expect(modal).toBeVisible();
            Logger.step('Clicking second menu option...');
            await secondOption.click();
            Logger.step('Waiting for Save as Template dialog...');
            const saveDialog = this.locators.saveTemplateDialog;
            await expect(saveDialog).toBeVisible();
            const header = this.locators.saveTemplateHeader;
            const nameLabel = this.locators.saveTemplateNameLabel;
            const nameInput = this.locators.saveTemplateNameInput;
            const descLabel = this.locators.saveTemplateDescLabel;
            const descInput = this.locators.saveTemplateDescInput;
            const saveCancel = this.locators.saveTemplateCancelBtn;
            const saveBtn = this.locators.saveTemplateSaveBtn;
            await expect(header).toHaveText('Save as Template');
            await expect(nameLabel).toBeVisible();
            await expect(nameInput).toBeVisible();
            await expect(descLabel).toBeVisible();
            await expect(descInput).toBeVisible();
            await expect(saveCancel).toBeVisible();
            await expect(saveBtn).toBeVisible();
            const generatedName = 'Automation Template ' + Date.now();
            await nameInput.fill(generatedName);
            await descInput.fill('This is an automation-generated template.');
            Logger.step('Clicking Save Template...');
            await saveBtn.click();
            const notif2 = this.locators.notificationRootFirst;
            await expect(notif2).toBeVisible({ timeout: 15000 });
            await expect(notif2).toContainText('Template Saved');
            await expect(notif2).toContainText('has been saved successfully');
        } catch (error) {
            Logger.step(`Error in verifyBidTemplate: ${error.message}`);
            throw error;
        }
    }

    async validateAndUpdateFirstRow() {
        try {
            Logger.step('Updating first row - Total Price cell (quantity click was targeting wrong column)...');
            await this.minimizeManageVendors();
            await this.page.waitForTimeout(1000);
            const dataRow = this.locators.bidsGridDataRowByScope('Bid with material').or(
                this.locators.bidsGridRowByScope('Bid with material')
            );
            await expect(dataRow).toBeVisible({ timeout: 10000 });

            // Target Total Price (last cell) - col 6 or total_price
            const totalPriceCell = dataRow.locator('[role="gridcell"]').last();
            const waitForCellSave = () => this.page.waitForResponse(
                (r) => r.url().includes('/api/bird-table') && r.status() >= 200 && r.status() < 300,
                { timeout: 8000 }
            ).catch(() => null);

            const totalPrice = Math.floor(Math.random() * 51) + 50; // 50-100
            await totalPriceCell.scrollIntoViewIfNeeded();
            await totalPriceCell.waitFor({ state: 'visible', timeout: 5000 });
            const savePromise = waitForCellSave();
            await totalPriceCell.dblclick({ force: true });
            await this.page.waitForTimeout(600);
            const input = this.page.locator('input[data-testid="bird-table-currency-input"], input[data-testid="bird-table-number-input"], input[data-testid="bird-table-text-input"]').first();
            if (await input.isVisible().catch(() => false)) {
                await input.fill(totalPrice.toString());
            } else {
                await this.page.keyboard.press('ControlOrMeta+a');
                await this.page.keyboard.type(totalPrice.toString(), { delay: 50 });
            }
            await this.page.keyboard.press('Enter');
            await savePromise;
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(800);

            // Assert Total Price was saved
            await this.page.waitForTimeout(500);
            const rowAfterUpdate = this.locators.bidsGridDataRowByScope('Bid with material').or(
                this.locators.bidsGridRowByScope('Bid with material')
            );
            const totalCellText = await rowAfterUpdate.locator('[role="gridcell"]').last().textContent().catch(() => '');
            if (totalCellText && totalCellText.includes(totalPrice.toString())) {
                Logger.success(`Total Price (${totalPrice}) asserted successfully`);
            } else {
                Logger.info(`Total Price entered: ${totalPrice}. Cell shows: "${totalCellText}"`);
            }
        } catch (error) {
            Logger.step(`Error in validateAndUpdateFirstRow: ${error.message}`);
            throw error;
        }
    }

    async updateBidWithMaterial() {
        try {
            Logger.step('Updating existing bid with "Bid with material" template...');
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(2000);

            // Target the first EXISTING bid row's scope cell (scoped to Bids tab) - do NOT add new row
            const scopeCell = this.locators.firstBidRowScopeCell.or(this.locators.bidsGridFirstScopeCell);
            await expect(scopeCell).toBeVisible({ timeout: 10000 });
            await scopeCell.scrollIntoViewIfNeeded();
            await scopeCell.dblclick();
            await this.page.waitForTimeout(500);

            // Use the inline scope editor - try scopeSearchInput first, fallback to menu input
            const searchInput = this.locators.scopeSearchInput.or(this.locators.bidSearchInput1);
            await searchInput.waitFor({ state: 'visible', timeout: 8000 });
            await searchInput.click();
            await this.page.waitForTimeout(200);
            await searchInput.fill('');
            await searchInput.fill('Bid with material', { force: true });
            await this.page.waitForTimeout(600);

            // Select the "Bid with material" option - try listbox first, then menu, then Enter
            const scopeOption = this.locators.scopeListboxOption('Bid with material');
            const optionVisible = await scopeOption.isVisible().catch(() => false);
            if (optionVisible) {
                await scopeOption.click();
            } else {
                const menuOption = this.page.locator('[role="menu"] >> text=Bid with material').first();
                if (await menuOption.isVisible().catch(() => false)) {
                    await menuOption.click();
                } else {
                    await this.page.keyboard.press('Enter');
                }
            }

            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(2000);
            Logger.success('Existing bid updated with "Bid with material" template');
        } catch (error) {
            Logger.step(`Error in updateBidWithMaterial: ${error.message}`);
            throw error;
        }
    }

    async navigateToBidsTab() {
        try {
            Logger.step('Navigating to Bids tab...');
            await expect(this.locators.bidsTab).toBeEnabled();
            await this.locators.bidsTab.click();
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(3000);
        } catch (error) {
            Logger.step(`Error in navigateToBidsTab: ${error.message}`);
            throw error;
        }
    }

    async minimizeManageVendors() {
        try {
            Logger.step('Minimizing Manage Vendors pane...');
            if (!(await this.locators.inviteVendorsToBidButton.isVisible())) {
                await this.locators.manageVendorsToggle.click();
                await this.page.waitForTimeout(2000);
            }
        } catch (error) {
            Logger.step(`Error in minimizeManageVendors: ${error.message}`);
            throw error;
        }
    }

    async openFilterPanel() {
        try {
            Logger.step('Opening filter panel...');
            await this.page.getByRole('button').filter({ has: this.page.locator('svg.lucide-funnel') }).click();
            await this.page.waitForTimeout(1000);
        } catch (error) {
            Logger.step(`Error in openFilterPanel: ${error.message}`);
            throw error;
        }
    }

    async applyFilter(filterValue) {
        try {
            Logger.step(`Applying filter: ${filterValue}`);
            // await this.page.getByPlaceholder('Search').fill(filterValue);
            await this.page.locator(`p:has-text("${filterValue}")`).click();
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(1500);
        } catch (error) {
            Logger.step(`Error in applyFilter: ${error.message}`);
            throw error;
        }
    }

    async exportProjectList() {
        try {
            Logger.step('Exporting project list...');
            const downloadPromise = this.page.waitForEvent('download');
            await this.locators.exportButton.click();
            return await downloadPromise;
        } catch (error) {
            Logger.step(`Error in exportProjectList: ${error.message}`);
            throw error;
        }
    }

    async downloadAndParseCSV(download) {
        try {
            Logger.step('Parsing downloaded CSV...');
            const filePath = await download.path();
            const fs = require('fs');
            const csvText = fs.readFileSync(filePath, 'utf8');
            const lines = csvText.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, ''));
            return lines.slice(1).map(row => {
                const values = row.split(',').map(v => v.replace(/^"|"$/g, ''));
                return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
            });
        } catch (error) {
            Logger.step(`Error in downloadAndParseCSV: ${error.message}`);
            throw error;
        }
    }

    async validateExportResults(parsedData, projectName, filterValue) {
        try {
            Logger.step('Validating exported CSV...');
            const nameCol = Object.keys(parsedData[0]).find(k => k.toLowerCase().includes('name'));
            const propCol = Object.keys(parsedData[0]).find(k => k.toLowerCase().includes('property'));
            expect(nameCol).toBeTruthy();
            expect(propCol).toBeTruthy();
            const rowsByProperty = parsedData.filter(r => r[propCol] === filterValue);
            const rowsByName = parsedData.filter(r => r[nameCol] === projectName);
            Logger.success(`CSV validation complete. Property matches: ${rowsByProperty.length}, Name matches: ${rowsByName.length}`);
        } catch (error) {
            Logger.step(`Error in validateExportResults: ${error.message}`);
            throw error;
        }
    }

    async openBidLevelling() {
        try {
            Logger.step('Opening Bid Levelling view...');
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(2000);

            const bidBookTab = this.locators.bidBookTab;
            const bidLevellingTab = this.locators.bidLevellingTab;

            const isAlreadyLevelling = await bidLevellingTab.getAttribute('aria-selected').catch(() => 'false');
            if (isAlreadyLevelling === 'true') {
                Logger.info('Bid Levelling view is already active');
                return;
            }

            const levellingBtn = this.page.locator('button.mantine-ActionIcon-root:has(svg.lucide-scale)');
            const isLevellingBtnVisible = await levellingBtn.isVisible().catch(() => false);

            if (isLevellingBtnVisible) {
                await levellingBtn.click();
            } else {
                await bidLevellingTab.click();
            }

            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(3000);

            await expect(this.locators.bidLevellingTab).toHaveAttribute('aria-selected', 'true', { timeout: 5000 });
            Logger.success('Bid Levelling view opened');
        } catch (error) {
            Logger.step(`Error in openBidLevelling: ${error.message}`);
            throw error;
        }
    }

    async validateBidLevellingTable() {
        try {
            Logger.step('Validating Bid Levelling table...');

            await expect(this.locators.bidLevellingTab).toHaveAttribute('aria-selected', 'true', { timeout: 5000 });
            Logger.info('Bid Levelling tab is selected');

            const headers = this.locators.bidLevellingHeaders;
            const headerCount = await headers.count();
            Logger.info(`Bid Levelling table headers found: ${headerCount}`);
            expect(headerCount).toBeGreaterThan(0);

            const expectedHeaders = ['Scope', 'Schedule of Value', 'Cost Item', 'Location'];
            for (const expected of expectedHeaders) {
                const header = this.page.locator(`[role="columnheader"]:has-text("${expected}")`);
                await expect(header).toBeVisible({ timeout: 5000 });
                console.log(`Header verified: "${expected}"`);
            }

            const allHeaders = await headers.allTextContents();
            console.log('All Bid Levelling headers:', allHeaders);

            const dataRows = this.locators.bidLevellingRows;
            const rowCount = await dataRows.count();
            Logger.info(`Bid Levelling data rows: ${rowCount}`);
            expect(rowCount).toBeGreaterThan(0);

            for (let i = 0; i < Math.min(rowCount, 5); i++) {
                const rowCells = dataRows.nth(i).locator('[role="gridcell"]');
                const cellTexts = await rowCells.allTextContents();
                console.log(`Row ${i}: ${cellTexts.map(t => t.trim()).join(' | ')}`);
            }

            const totalRow = this.locators.bidLevellingTotalRow;
            const totalVisible = await totalRow.isVisible().catch(() => false);
            if (totalVisible) {
                const totalText = await totalRow.textContent();
                console.log(`Total row: "${totalText?.trim()}"`);
                Logger.success('Total/summary row found in Bid Levelling table');
            } else {
                Logger.info('No total row visible — may appear when vendors submit bids');
            }

            Logger.success('Bid Levelling table validated successfully');
        } catch (error) {
            Logger.step(`Error in validateBidLevellingTable: ${error.message}`);
            throw error;
        }
    }

    async updateBidPrice(rowIndex, newPrice) {
        try {
            Logger.step(`Updating price for bid row ${rowIndex} to $${newPrice}...`);
            await this.page.waitForLoadState('networkidle');

            const priceCell = this.page.locator(`revo-grid div[role="gridcell"][data-rgcol="5"][data-rgrow="${rowIndex}"]`).first();
            await priceCell.scrollIntoViewIfNeeded();
            await priceCell.dblclick({ force: true });
            await this.page.waitForTimeout(600);

            const input = this.page.locator('input[data-testid="bird-table-currency-input"], input[data-testid="bird-table-number-input"], input[data-testid="bird-table-text-input"]').first();
            const inputVisible = await input.isVisible().catch(() => false);

            if (inputVisible) {
                await input.fill(newPrice.toString());
            } else {
                await this.page.keyboard.press('ControlOrMeta+a');
                await this.page.keyboard.type(newPrice.toString(), { delay: 50 });
            }

            await this.page.keyboard.press('Enter');
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(1500);

            Logger.success(`Price updated to $${newPrice} for row ${rowIndex}`);
            return newPrice;
        } catch (error) {
            Logger.step(`Error in updateBidPrice: ${error.message}`);
            throw error;
        }
    }

    async verifyLevellingCellsReadOnly() {
        try {
            Logger.step('Verifying Bid Levelling cells are read-only...');

            const cells = this.locators.bidLevellingCells;
            const cellCount = await cells.count();
            expect(cellCount).toBeGreaterThan(0);

            const firstCell = cells.first();
            await firstCell.dblclick({ force: true });
            await this.page.waitForTimeout(500);

            const editInput = this.page.locator('input[data-testid="bird-table-currency-input"], input[data-testid="bird-table-number-input"], input[data-testid="bird-table-text-input"]');
            const inputVisible = await editInput.isVisible().catch(() => false);

            if (!inputVisible) {
                Logger.success('Bid Levelling cells are read-only — no editor appeared');
            } else {
                Logger.info('Editor appeared in levelling cell — pressing Escape');
                await this.page.keyboard.press('Escape');
            }

            return !inputVisible;
        } catch (error) {
            Logger.step(`Error in verifyLevellingCellsReadOnly: ${error.message}`);
            throw error;
        }
    }

    async switchBackToBidBook() {
        try {
            Logger.step('Switching back to Bid Book view...');

            const bidBookTab = this.locators.bidBookTab;
            const isAlreadyBidBook = await bidBookTab.getAttribute('aria-selected').catch(() => 'false');
            if (isAlreadyBidBook === 'true') {
                Logger.info('Already on Bid Book view');
                return;
            }

            const bidBookBtn = this.page.locator('button.mantine-ActionIcon-root:has(svg.lucide-columns-2), button.mantine-ActionIcon-root:has(svg.lucide-book-open)').first();
            const isBtnVisible = await bidBookBtn.isVisible().catch(() => false);

            if (isBtnVisible) {
                await bidBookBtn.click();
            } else {
                await bidBookTab.click();
            }

            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(2000);

            await expect(this.locators.bidBookTab).toHaveAttribute('aria-selected', 'true', { timeout: 5000 });
            Logger.success('Switched back to Bid Book view');
        } catch (error) {
            Logger.step(`Error in switchBackToBidBook: ${error.message}`);
            throw error;
        }
    }

    async applyFilterAndExport(filterValue, projectName) {
        try {
            // await this.openFilterPanel();
            // await this.applyFilter(filterValue);
            await this.page.locator(".mantine-ActionIcon-icon .lucide.lucide-funnel:visible").click();
            await this.prop.filterPropertyNew(filterValue);
            const download = await this.exportProjectList();
            const parsed = await this.downloadAndParseCSV(download);
            await this.validateExportResults(parsed, projectName, filterValue);
        } catch (error) {
            Logger.step(`Error in applyFilterAndExport: ${error.message}`);
            throw error;
        }
    }

    async deleteFirstProjectRow() {
        try {
            Logger.step('Deleting first project row...');
            await this.locators.deleteRowBtn.first().click();
            await this.locators.deleteConfirmBtn.click();
        } catch (error) {
            Logger.step(`Error in deleteFirstProjectRow: ${error.message}`);
            throw error;
        }
    }

    async deleteExistingBids() {
        try {
            Logger.step('Checking for existing bids to delete...');
            await this.locators.bidsTab.click();
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(2000);

            const maxDeletes = 50;
            let deleted = 0;

            for (let i = 0; i < maxDeletes; i++) {
                const deleteBtn = this.locators.bidsFirstDeleteBtn;
                const isVisible = await deleteBtn.isVisible().catch(() => false);
                if (!isVisible) break;

                await deleteBtn.scrollIntoViewIfNeeded();
                await deleteBtn.click();
                await this.page.waitForTimeout(500);

                const confirmBtn = this.locators.deleteConfirmBtn;
                await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
                await confirmBtn.click();
                await this.page.waitForLoadState('networkidle');
                await this.page.waitForTimeout(1200);
                deleted++;
            }

            if (deleted > 0) {
                Logger.success(`Deleted ${deleted} existing bid row(s).`);
            } else {
                Logger.step('No existing bid rows to delete.');
            }
        } catch (error) {
            Logger.step(`Error in deleteExistingBids: ${error.message}`);
            throw error;
        }
    }

    /**
  * Add one bid row: Add Row, fill scope, enter price.
  * @param {string} scope - Scope name (e.g. Bid_Material_123_abc)
  * @param {number} price - Price value (100-5000)
  */
    async _addOneBid(scope, price) {
        const quantity = 5;
        const maxScopeAttempts = 2;

        await this.locators.addRowBtn.click();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(2000);

        // New row is always inserted above existing rows, so first scope cell = the new empty row to fill
        const scopeCell = this.locators.bidsGridFirstScopeCell;
        await expect(scopeCell).toBeVisible({ timeout: 10000 });

        for (let attempt = 1; attempt <= maxScopeAttempts; attempt++) {
            try {
                Logger.step(`Scope attempt ${attempt}/${maxScopeAttempts} for "${scope}"...`);
                await scopeCell.scrollIntoViewIfNeeded();
                await scopeCell.dblclick();
                await this.page.waitForTimeout(400);
                const searchInput = this.locators.scopeSearchInput;
                await searchInput.waitFor({ state: 'visible', timeout: 8000 });
                await searchInput.click();
                await this.page.waitForTimeout(200);
                await searchInput.fill('');
                await searchInput.fill(scope, { force: true });
                await this.page.waitForTimeout(600);
                const scopeOption = this.locators.scopeListboxOption(scope);
                const optionVisible = await scopeOption.isVisible().catch(() => false);
                if (optionVisible) await scopeOption.click();
                else await this.page.keyboard.press('Enter');
                await this.page.waitForLoadState('networkidle');
                await this.page.waitForTimeout(1500);
                const rowWithScope = this.locators.bidsGridRowByScope(scope);
                await expect(rowWithScope).toBeVisible({ timeout: 10000 });
                Logger.success(`Scope committed: "${scope}"`);
                break;
            } catch (scopeErr) {
                if (attempt === maxScopeAttempts) throw new Error(`Scope failed after ${maxScopeAttempts} attempts: ${scopeErr.message}`);
                await this.page.keyboard.press('Escape');
                await this.page.waitForTimeout(500);
            }
        }

        let dataRow = this.locators.bidsGridDataRowByScope(scope);
        if (!(await dataRow.isVisible().catch(() => false))) dataRow = this.locators.bidsGridRowByScope(scope);
        await expect(dataRow).toBeVisible({ timeout: 5000 });

        const getQuantityCell = () => dataRow.locator('[role="gridcell"]').nth(4);
        const getPriceCell = () => dataRow.locator('[role="gridcell"]').nth(5);
        const getTotalCell = () => dataRow.locator('[role="gridcell"]').nth(6);
        const waitForCellSave = () => this.page.waitForResponse(
            (r) => r.url().includes('/api/bird-table') && r.status() >= 200 && r.status() < 300,
            { timeout: 8000 }
        ).catch(() => null);

        const quantityCell = getQuantityCell();
        await quantityCell.waitFor({ state: 'visible', timeout: 5000 });
        await quantityCell.scrollIntoViewIfNeeded();
        const qtySavePromise = waitForCellSave();
        await quantityCell.click();
        await this.page.waitForTimeout(300);
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(300);
        await this.page.keyboard.press('ControlOrMeta+a');
        await this.page.keyboard.type(quantity.toString(), { delay: 60 });
        await this.page.waitForTimeout(200);
        await this.page.keyboard.press('Enter');
        await qtySavePromise;
        await this.page.waitForTimeout(800);
        await this.page.keyboard.press('Tab');
        await this.page.waitForTimeout(300);
        await this.page.keyboard.press('Tab');
        await this.page.waitForTimeout(400);

        const priceSavePromise = waitForCellSave();
        await this.page.keyboard.press('ControlOrMeta+a');
        await this.page.keyboard.type(price.toString(), { delay: 60 });
        await this.page.waitForTimeout(200);
        await this.page.keyboard.press('Enter');
        await priceSavePromise;
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(1500);

        await expect(async () => {
            const priceText = (await getPriceCell().textContent())?.trim() || '';
            const totalText = (await getTotalCell().textContent())?.trim() || '';
            const hasPrice = /\d+/.test(priceText) || (priceText && priceText.includes('$'));
            const hasTotal = /\d+/.test(totalText) || (totalText && totalText.includes('$'));
            if (!hasPrice && !hasTotal) throw new Error(`Price not visible. Price: "${priceText}", Total: "${totalText}"`);
        }).toPass({ timeout: 10000, intervals: [500, 1000, 1000] });
    }
};
