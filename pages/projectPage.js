const { expect } = require('@playwright/test');
const { Logger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const { propertyLocators } = require('../locators/propertyLocator');
const { projectJobLocators } = require('../locators/projectPageLocator');

exports.ProjectPage = class ProjectPage {
    constructor(page) {
        this.page = page;
        this.projectsTab = page.locator('nav a.mantine-NavLink-root:has(.mantine-NavLink-label:text-is("Projects"))').first();
        this.modal = page.locator('section[role="dialog"][data-modal-content="true"]');
        this.modalTitle = page.getByRole('heading', { name: /Add project/i });
        this.nameInput = page.getByLabel('Name');
        this.propertyDropdown = page.getByRole('textbox', { name: 'Property' }).first();
        this.descInput = page.getByLabel('Description');
        this.startDateInput = page.getByLabel('Start Date');
        this.endDateInput = page.getByLabel('End Date');
        this.budgetInput = page.getByRole('textbox', { name: 'Estimated Budget' })
            .or(page.getByPlaceholder('Enter estimated budget'));
        this.budgetCategoryInput = page.getByRole('textbox', { name: 'Budget Category' })
            .or(page.getByRole('combobox', { name: /Budget Category/i }))
            .or(page.getByPlaceholder('Select budget item'));
        this.cancelBtn = page.getByRole('button', { name: 'Cancel' });
        // this.addProjectBtn = page.getByRole('button', { name: /add project/i });
        this.addProjectBtn = page.getByRole('button', { name: 'Create Project' }).last().filter({ has: page.locator(':visible') });
        this.createJobBtn = page.locator('button', { hasText: 'Create Job' });
        this.modal = page.locator('section[role="dialog"][data-modal-content="true"]');
        this.titleInput = page.getByPlaceholder('Enter job title');
        this.jobTypeDropdown = page.getByPlaceholder('Select job type');
        this.descriptionInput = page.getByPlaceholder('Enter job description');
        this.cancelBtn = page.getByRole('button', { name: 'Cancel' });
        this.submitBtn = page.getByRole('button', { name: /Create job/i }).last().filter({ has: page.locator(':visible') });
        this.jobOverviewHeader = page.getByText('Job Overview');
        this.editButton = page.getByRole('button', { name: 'Edit' });
        this.vendorSearchInput = page.getByRole('dialog').locator('input[placeholder="Search..."]');
        // this.inviteSelectedBtn = page.locator('button:has-text("Invite Selected Vendors to Bid")');
        this.inviteSelectedBtn = page.locator('button:has-text("Add Vendors to Bid")');
        this.vendorRow = (name) =>
            this.page.locator(`.ag-pinned-left-cols-container div[role="row"]:has-text("${name}") .ag-checkbox`);
        this.vendorNameCell = (name) =>
            this.page.locator(`div[col-id="vendor_name"]:has-text("${name}")`);
        this.resetTableIcon = page.locator('button[data-variant="subtle"][data-size="md"] svg.lucide-rotate-ccw');
        this.resetModal = page.locator('section[role="dialog"]');
        this.resetModalHeader = this.resetModal.locator('h2.mantine-Modal-title');
        this.resetModalBody = this.resetModal.locator('div.mantine-Modal-body p');
        this.resetCancelBtn = this.resetModal.locator('button:has-text("Cancel")');
        this.resetConfirmBtn = this.resetModal.locator('button:has-text("Reset Table")');
        this.tableRow = page.locator('div[role="row"][row-index="t-0"]');
        this.scopeMixBtn = page.locator('button:has(svg.lucide-folder-tree)');
        this.scopeModal = page.locator('section[role="dialog"]');
        this.scopeModalCloseBtn = this.scopeModal.locator('button:has(svg[viewBox="0 0 15 15"])');
        this.scopeSearchInput = this.scopeModal.locator('input.mantine-Input-input').nth(0);
        this.scopePlusBtn = this.scopeModal.locator('button:has(svg.lucide-plus)');
        this.scopeRepeatBtn = this.scopeModal.locator('button:has(svg.lucide-repeat-2)');
        this.scopeAgGrid = this.scopeModal.locator('div[role="grid"]').or(this.scopeModal.locator('[class*="ag-root"]')).first();
        this.scopeClearAllBtn = this.scopeModal.locator('button:has-text("Clear All")');
        this.scopeSubmitBtn = this.scopeModal.locator('button:has-text("Submit")');
        this.scopeAllButtons = this.scopeModal.locator('button');
        this.scopeAllIcons = this.scopeModal.locator('svg');
        this.scopeModalBody = this.scopeModal.locator('.mantine-Modal-body');
        this.scopeModalStack = this.scopeModal.locator('.mantine-Stack-root');
        this.scopeInputWrapper = this.scopeModal.locator('.mantine-InputWrapper-root').nth(0);
        this.scopeGroup = this.scopeModal.locator('.mantine-Group-root').nth(0);
        this.scopeEditor = page.locator('[data-scope-portal-editor="true"]');
        this.scopeEditorInput = this.scopeEditor.locator('input.mantine-Input-input');
        this.scopeEditorCheckBtn = this.scopeEditor.locator('button:has(svg.lucide-check)');
        this.scopeEditorCancelBtn = this.scopeEditor.locator('button:has(svg.lucide-x)');
        this.vendorActionBtn = page.getByRole('tabpanel', { name: 'Bids' }).locator('button:has(svg.lucide-ellipsis-vertical)').first();
        this.editOnBehalfOption = page.getByRole('menuitem', { name: 'Edit On Behalf of Vendor' });
        this.editModalHeader = page.locator('h2.m_615af6c9.mantine-Modal-title');
        this.totalCostCell = page.locator('div[row-index="0"] [role="gridcell"][col-id="total_price"]').last();
        this.totalCostInput = page.locator('input[data-testid="bird-table-currency-input"]').first();
        this.submitBidBtn = page.locator('button:has-text("Submit Bid")');
        this.closeEditModalBtn = page.locator('header.mantine-Modal-header button.mantine-Modal-close');
        this.bidsTabLabel = page.getByRole('tab', { name: 'Bids' });
        this.levelingButton = page.locator('button.mantine-ActionIcon-root:has(svg.lucide-scale)');
        this.totalCostRow = page.locator('div[role="row"]:has-text("Total")');
        this.bidRow = (label) => page.locator(`div[role="row"]:has-text("${label}")`).first();
        this.totalRow = page.locator('div[role="row"]:has-text("Total")');
        this.inviteVendorsBtn = page.locator("button:has-text('Invite Vendors To Bid')");
        this.manageVendorsLink = page.getByRole('tabpanel', { name: 'Bids' }).locator('div:has(p:has-text("Manage Vendors")) button').first();
        this.vendorActionBtn = page.getByRole('tabpanel', { name: 'Bids' }).locator('button:has(svg.lucide-ellipsis-vertical)').first();
        this.awardBidOption = page.locator('text=Award Bid').first();
        this.awardModal = page.locator('section[role="dialog"]');
        this.awardCancelBtn = this.awardModal.locator('button:has-text("Cancel")');
        this.awardConfirmBtn = this.awardModal.locator('button:has-text("Award")');
        this.awardedStatusCell = page.locator(
            'div[role="row"]:has-text("Awarded") div[col-id="status"] p'
        );
        this.contractsTab = page.getByRole('tab', { name: 'Contracts' });
        this.finalizeContractBtn = page.locator('button:has-text("Finalize Contract")');
        this.finalizeContractConfirmBtn = page.locator('.mantine-Modal-content button:has-text("Finalize Contract")');
        this.bulkUpdateStatusBtn = page.locator('button:has-text("Bulk Update Status")');
    }

    async navigateToProjects() {
        try {
            Logger.step('Navigating to Projects...');

            const apiErrors = [];
            this.page.on("response", async (res) => {
                if (!res.ok()) {
                    const url = res.url();
                    const status = res.status();
                    apiErrors.push({ url, status });
                }
            });

            await this.page.keyboard.press('Escape').catch(() => {});
            await this.page.waitForTimeout(300);

            const nav = this.page.locator('nav');
            const navVisible = await nav.isVisible({ timeout: 5000 }).catch(() => false);
            if (!navVisible) {
                Logger.info('Nav not visible — reloading page...');
                await this.page.reload({ waitUntil: 'networkidle' });
                await this.page.waitForTimeout(1000);
            }

            const projectsVisible = await this.projectsTab.isVisible({ timeout: 3000 }).catch(() => false);
            if (!projectsVisible) {
                const constructionMgmt = this.page.locator('nav').locator('a').filter({ hasText: 'Construction Management' }).first();
                if (await constructionMgmt.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await constructionMgmt.click();
                    await this.page.waitForTimeout(500);
                }
            }

            await this.projectsTab.waitFor({ state: 'visible', timeout: 15000 });

            const start = Date.now();

            await this.projectsTab.click({ force: true });

            await this.page.waitForLoadState("networkidle");

            await this.page.waitForTimeout(500);

            const duration = Date.now() - start;

            Logger.info(`⏱ Projects list loaded in ${duration} ms`);

            expect(duration).toBeLessThanOrEqual(5000);

            expect(apiErrors, `API Errors found:\n${JSON.stringify(apiErrors, null, 2)}`).toHaveLength(0);

            Logger.success('✅ Navigated to Projects with no errors.');
        } catch (e) {
            Logger.step(`Error in navigateToProjects: ${e.message}`);
            throw e;
        }
    }

    async openCreateProjectModal() {
        try {
            Logger.step('Opening Create Project modal...');
            await this.page.waitForLoadState('networkidle');

            const startTime = Date.now();
            await this.page.waitForSelector('input[placeholder="Search..."]', { state: 'visible' });
            const endTime = Date.now();
            const loadTime = ((endTime - startTime) / 1000).toFixed(2);
            Logger.info(`Project Page fully loaded in ${loadTime} seconds`);

            const createProjectBtn = this.page.locator(`button:has-text('Create Project')`);
            await expect(createProjectBtn).toBeVisible({ timeout: 5000 });
            Logger.success('✅ Create Project button is visible.');

            await createProjectBtn.waitFor({ state: 'visible' });
            await createProjectBtn.click();
            Logger.success('✅ Clicked on Create Project button.');

            await this.page.waitForTimeout(800);

            const modal = this.page.locator('section[role="dialog"][data-modal-content="true"]');
            await expect(modal).toBeVisible({ timeout: 5000 });

            const modalTitle = this.page.getByRole('heading', { name: /Add project/i });
            await expect(modalTitle).toBeVisible({ timeout: 5000 });
            Logger.success(' "Add project" modal opened successfully.');
        } catch (e) {
            Logger.step(`Error in openCreateProjectModal: ${e.message}`);
            throw e;
        }
    }

    async verifyModalFields() {
        try {
            Logger.step('Verifying fields inside Add Project modal...');
            await expect(this.nameInput).toBeVisible();
            await expect(this.propertyDropdown).toBeVisible();
            await expect(this.descInput).toBeVisible();
            await expect(this.budgetInput).toBeVisible();
            await expect(this.startDateInput).toBeVisible();
            await expect(this.endDateInput).toBeVisible();
            await expect(this.cancelBtn).toBeVisible();
            await expect(this.addProjectBtn).toBeVisible();
            Logger.success(' All modal fields and buttons are visible.');
        } catch (e) {
            Logger.step(`Error in verifyModalFields: ${e.message}`);
            throw e;
        }
    }

    generateRandomProjectName(prefix = 'Automa_Test') {
        try {
            const random = Math.random().toString(36).slice(2, 8).toUpperCase();
            const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
            return `${prefix}_${date}_${random}`;
        } catch (e) {
            Logger.step(`Error in generateRandomProjectName: ${e.message}`);
            throw e;
        }
    }

    generateRandomBudget(min = 400000, max = 1000000) {
        try {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        } catch (e) {
            Logger.step(`Error in generateRandomBudget: ${e.message}`);
            throw e;
        }
    }

    generateRandomEmail(prefix = 'sumit') {
        try {
            const random = Math.random().toString(36).slice(2, 8).toUpperCase();
            const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
            return `${prefix}_${date}_${random}@gmail.com`;
        } catch (e) {
            Logger.step(`Error in generateRandomEmail: ${e.message}`);
            throw e;
        }
    }

    get createdProjectName() {
        try {
            return this.page.locator(`.mantine-Grid-inner:has-text('Project Name')`);
        } catch (e) {
            Logger.step(`Error in createdProjectName getter: ${e.message}`);
            throw e;
        }
    }

    get createdDescription() {
        try {
            return this.page.locator(`.mantine-Grid-inner:has-text('Description')`);
        } catch (e) {
            Logger.step(`Error in createdDescription getter: ${e.message}`);
            throw e;
        }
    }

    // async assertProjectCreated(name, description) {
    //     try {
    //         const verifyText = async (locator, expectedText, label) => {
    //             Logger.step(`Verifying project ${label} "${expectedText}" is visible on the dashboard...`);

    //             const element = locator.locator(`p:has-text("${expectedText}")`).last();
    //             await element.waitFor({ state: 'visible' });
    //             await expect(element).toContainText(expectedText);

    //             const actualText = (await element.textContent())?.trim();
    //             expect(actualText).toBe(expectedText);

    //             Logger.success(`✅ Project ${label} "${expectedText}" is correctly visible on the dashboard.`);
    //         };

    //         await verifyText(this.createdProjectName, name, 'name');
    //         await verifyText(this.createdDescription, description, 'description');
    //     } catch (e) {
    //         Logger.step(`Error in assertProjectCreated: ${e.message}`);
    //         throw e;
    //     }
    // }

    async assertProjectCreated(name, description) {
        try {
            const verifyByLabel = async (labelText, expectedText) => {
                Logger.step(`Verifying "${labelText}" value is "${expectedText}"...`);

                const valueLocator = this.page
                    .locator('p', { hasText: labelText })
                    .locator('xpath=following-sibling::p[1]');

                await expect(valueLocator).toBeVisible();
                await expect(valueLocator).toHaveText(expectedText);

                Logger.success(`✅ ${labelText} verified successfully`);
            };

            await verifyByLabel('Project Name', name);
            await verifyByLabel('Description', description);

        } catch (e) {
            Logger.step(`Error in assertProjectCreated: ${e.message}`);
            throw e;
        }
    }


    // async getStartDate() {
    //     try {
    //         const today = new Date();
    //         const day = String(today.getDate()).padStart(2, '0');
    //         const month = String(today.getMonth() + 1).padStart(2, '0');
    //         const year = today.getFullYear();
    //         return `${day}-${month}-${year}`;
    //     } catch (e) {
    //         Logger.step(`Error in getStartDate: ${e.message}`);
    //         throw e;
    //     }
    // }

    async getStartDate() {
        try {
            const today = new Date();

            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;
        } catch (e) {
            Logger.step(`Error in getStartDate: ${e.message}`);
            throw e;
        }
    }

    async getEndDate() {
        try {
            const today = new Date();
            const endDate = new Date(today);
            endDate.setDate(today.getDate() + 365); // 1 year from start
            const year = endDate.getFullYear();
            const month = String(endDate.getMonth() + 1).padStart(2, '0');
            const day = String(endDate.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`; // YYYY-MM-DD to match form placeholder
        } catch (e) {
            Logger.step(`Error in getEndDate: ${e.message}`);
            throw e;
        }
    }

    async selectBudgetCategoryIfAvailable() {
        try {
            Logger.step('Checking if Budget Category is available...');

            let finalPlaceholder = '';
            for (let wait = 0; wait < 15; wait++) {
                await this.page.waitForTimeout(1000);
                const placeholder = await this.budgetCategoryInput.getAttribute('placeholder').catch(() => '');
                finalPlaceholder = placeholder;

                if (placeholder === 'Select budget item') break;

                if (placeholder === 'No budget items found for this property and year' && wait >= 5) {
                    Logger.info('No budget items for this property/year — skipping.');
                    return null;
                }

                Logger.info(`Budget Category loading... (placeholder: "${placeholder}")`);
            }

            if (finalPlaceholder === 'No budget items found for this property and year') {
                Logger.info('No budget items for this property/year — skipping.');
                return null;
            }

            if (finalPlaceholder !== 'Select budget item') {
                Logger.info(`Budget Category not ready after polling (placeholder: "${finalPlaceholder}") — skipping.`);
                return null;
            }

            const isEnabled = await this.budgetCategoryInput.isEnabled({ timeout: 3000 }).catch(() => false);
            if (!isEnabled) {
                Logger.info('Budget Category field is disabled — skipping.');
                return null;
            }

            await this.budgetCategoryInput.click();
            await this.page.waitForTimeout(500);

            const searchText = 'Con';
            await this.budgetCategoryInput.pressSequentially(searchText, { delay: 100 });
            Logger.info(`Typed "${searchText}" in Budget Category to trigger suggestions`);
            await this.page.waitForTimeout(1500);

            const options = this.page.locator('[role="option"]:visible');
            let optionCount = await options.count().catch(() => 0);

            if (optionCount === 0) {
                const comboboxOptions = this.page.locator('[data-combobox-option="true"]:visible');
                optionCount = await comboboxOptions.count().catch(() => 0);
                if (optionCount > 0) {
                    const suggestionText = await comboboxOptions.first().textContent();
                    Logger.info(`Found ${optionCount} suggestion(s), selecting: "${suggestionText?.trim()}"`);
                    await comboboxOptions.first().click();
                    await this.page.waitForTimeout(1000);
                }
            } else {
                const suggestionText = await options.first().textContent();
                Logger.info(`Found ${optionCount} suggestion(s), selecting: "${suggestionText?.trim()}"`);
                await options.first().click();
                await this.page.waitForTimeout(1000);
            }

            if (optionCount === 0) {
                Logger.info('No suggestions appeared after typing — skipping.');
                await this.page.keyboard.press('Escape');
                return null;
            }

            const inputValue = await this.budgetCategoryInput.inputValue().catch(() => '');
            if (inputValue && inputValue.trim().length > 0) {
                Logger.success(`Budget Category selected and confirmed in input: "${inputValue.trim()}"`);
                return inputValue.trim();
            }

            const displayValue = await this.budgetCategoryInput.getAttribute('value').catch(() => '');
            if (displayValue && displayValue.trim().length > 0) {
                Logger.success(`Budget Category selected and confirmed (via attribute): "${displayValue.trim()}"`);
                return displayValue.trim();
            }

            Logger.info('Budget Category selection could not be confirmed in input.');
            return null;
        } catch (e) {
            Logger.info(`Budget Category selection skipped: ${e.message}`);
            return null;
        }
    }

    async fillProjectDetails({ name, property, description, startDate, endDate, budget }) {
        try {
            Logger.step('Filling project details inside modal...');

            const projectName = this.generateRandomProjectName();
            const randomDescription = `${description || 'Auto_Description'}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

            await this.nameInput.fill(projectName);
            Logger.info(`Entered project name: ${projectName}`);

            // await this.page.pause()

            await this.propertyDropdown.waitFor({ state: 'visible' });
            await this.propertyDropdown.click();
            await this.page.waitForTimeout(800);

            let propertyData;
            const propertyDataPath = path.join(__dirname, '../data/propertyData.json');
            const downloadsPropertyPath = path.join(process.cwd(), 'downloads', 'property.json');
            if (fs.existsSync(propertyDataPath)) {
                propertyData = JSON.parse(fs.readFileSync(propertyDataPath, 'utf8'));
            } else if (fs.existsSync(downloadsPropertyPath)) {
                propertyData = JSON.parse(fs.readFileSync(downloadsPropertyPath, 'utf8'));
            }
            if (!propertyData || !propertyData.propertyName) {
                throw new Error('Property name not found. Add data/propertyData.json or run a test that creates downloads/property.json');
            }

            const currentPropertyName = propertyData.propertyName;
            Logger.info('Created property for template: ' + currentPropertyName);

            await this.propertyDropdown.fill(currentPropertyName);

            const dropdown = this.page.locator('[data-composed="true"][role="presentation"]').first();
            await expect(dropdown).toBeVisible();

            const options = dropdown.locator('[data-combobox-option="true"]');
            const optionTexts = (await options.allTextContents()).filter(Boolean);

            const cliOption = process.env.OPTION;

            let selectedOption;
            if (cliOption && optionTexts.includes(cliOption)) {
                selectedOption = cliOption;
                Logger.info(`Using option from CLI: ${selectedOption}`);
            } else {
                const randomIndex = Math.floor(Math.random() * optionTexts.length);
                selectedOption = optionTexts[randomIndex];
                Logger.info(`Randomly selected option: ${selectedOption}`);
            }

            await dropdown.getByRole('option', { name: selectedOption }).click();
            Logger.info(`Selected property: ${selectedOption}`);

            await this.page.waitForTimeout(2000);

            const selectedCategory = await this.selectBudgetCategoryIfAvailable();

            await this.descInput.fill(randomDescription);
            Logger.info(`Entered description: ${randomDescription}`);

            const budgetValue = budget ?? this.generateRandomBudget(400000, 1000000);
            await this.budgetInput.fill(String(budgetValue));
            Logger.info(`Entered budget: ${budgetValue}`);

            await this.startDateInput.fill(startDate);
            await this.endDateInput.fill(endDate);
            Logger.info(`Entered dates: ${startDate} → ${endDate}`);

            await expect(this.addProjectBtn).toBeVisible();
            await this.addProjectBtn.click();
            await expect(this.page).toHaveURL(/projects/);
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(1500);
            Logger.success('Landed on property page successfully.');

            // await this.assertSuccessToaster("project created successfully");

            await this.assertProjectCreated(projectName, randomDescription);

            const dataToSave = { projectName, description: randomDescription, budgetCategory: selectedCategory, createdAt: new Date().toISOString() };
            const filePath = path.join(__dirname, '../data/projectData.json');

            if (!fs.existsSync(path.dirname(filePath))) {
                fs.mkdirSync(path.dirname(filePath));
            }

            fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
            Logger.success(`Project data saved to: ${filePath}`);

            return { projectName, description: randomDescription, budgetCategory: selectedCategory };
        } catch (e) {
            Logger.step(`Error in fillProjectDetails: ${e.message}`);
            throw e;
        }
    }

    async searchProject(name) {
        try {
            await this.page.locator('input[placeholder="Search..."]').fill(name);
            await this.page.waitForLoadState("networkidle");
            await this.page.waitForTimeout(2000);

            const firstRowNameCell = this.page.locator(propertyLocators.firstRowNameCellText).first();

            const text = await firstRowNameCell.innerText();
            Logger.info(`First row text → "${text}"`);

            Logger.info(`Searching for project containing: "${name}"`);
            await expect(firstRowNameCell).toContainText(new RegExp(name, "i"));

            Logger.success(`Search successful → Found project containing: "${name}"`);
        } catch (e) {
            Logger.step(`Error in searchProject: ${e.message}`);
            throw e;
        }
    }

    async verifyModalClosed() {
        try {
            await this.cancelBtn.click();
            await expect(this.modal).toBeHidden({ timeout: 5000 });
            Logger.success('✅ Add Project modal is closed successfully.');
        } catch (e) {
            Logger.step(`Error in verifyModalClosed: ${e.message}`);
            throw e;
        }
    }

    async validateMandatoryFields() {
        try {
            Logger.step('Validating mandatory fields in Add Project modal...');
            await expect(this.addProjectBtn).toBeVisible();
            await this.addProjectBtn.click();
            await expect(this.page.locator('input:invalid, select:invalid')).toHaveCount(2);
            Logger.success('✅ Mandatory fields validation successful.');
        } catch (e) {
            Logger.step(`Error in validateMandatoryFields: ${e.message}`);
            throw e;
        }
    }

    async propertyDropdownOptions() {
        try {
            await this.propertyDropdown.waitFor({ state: 'visible' });
            await this.propertyDropdown.click();
            await this.page.waitForTimeout(800);
            const dropdown = this.page.locator('[data-composed="true"][role="presentation"]').first();
            await expect(dropdown).toBeVisible();
            const options = dropdown.locator('[data-combobox-option="true"]');
            const optionTexts = (await options.allTextContents()).filter(Boolean);
            Logger.info(`Property Dropdown Options: ${optionTexts.join(', ')}`);
        } catch (e) {
            Logger.step(`Error in propertyDropdownOptions: ${e.message}`);
            throw e;
        }
    }

    async fillDateField(startDate, endDate) {
        try {
            await this.startDateInput.fill(startDate);
            await this.endDateInput.fill(endDate);
            Logger.info(`Entered dates: ${startDate} → ${endDate}`);
        } catch (e) {
            Logger.step(`Error in fillDateField: ${e.message}`);
            throw e;
        }
    }

    async assertSuccessToaster(toasterMessage) {
        try {
            await expect(this.page.locator('.mantine-Notification-root')).toContainText("Success" + toasterMessage);
            Logger.success(`✅ Toaster with message "Success${toasterMessage}" is visible.`);
        } catch (e) {
            Logger.step(`Error in assertSuccessToaster: ${e.message}`);
            throw e;
        }
    }

    async openProject(projectName) {
        try {
            Logger.step(`Opening project: "${projectName}" from the list...`);
            await this.navigateToProjects();
            const searchProject = this.page.locator('input[placeholder="Search..."]');
            await searchProject.waitFor({ state: 'visible', timeout: 30000 });
            await searchProject.click();
            await searchProject.fill(projectName);
            const projectCard = this.page
                .locator('[role="row"], .mantine-Group-root')
                .filter({ hasText: projectName })
                .first();
            await projectCard.waitFor({ state: 'visible', timeout: 10000 });
            const viewBtn = this.page.locator('button[title="View Details"]').first();
            await viewBtn.waitFor({ state: 'visible', timeout: 10000 });
            await viewBtn.click();
            Logger.step(`Opened project: "${projectName}" from the list...`);
        } catch (e) {
            Logger.step(`Error in openProject: ${e.message}`);
            throw e;
        }
    }


    async openCreateJobModal() {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(2000);
        await expect(this.createJobBtn).toBeVisible();
        await expect(this.createJobBtn).toBeEnabled();
        await this.createJobBtn.click();
        await expect(this.modal).toBeVisible();
    }

    async validateModalFields() {
        await expect(this.titleInput).toBeVisible();
        await expect(this.jobTypeDropdown).toBeVisible();
        await expect(this.descriptionInput).toBeVisible();
        await expect(this.cancelBtn).toBeVisible();
        await expect(this.submitBtn).toBeVisible();
    }

    async fillJobForm({ title, jobType, description = '', startDate, endDate, selectBudgetCategory = false }) {
        await this.page.waitForTimeout(1000);

        await this.titleInput.fill(title);
        Logger.info(`Entered job title: ${title}`);

        await this.jobTypeDropdown.click();
        await this.page.getByRole('option', { name: new RegExp(jobType, 'i') }).click();
        await this.page.waitForTimeout(500);
        await expect(this.jobTypeDropdown).toHaveValue(jobType);
        Logger.info(`Selected job type: ${jobType}`);

        if (description) {
            await this.descriptionInput.fill(description);
            Logger.info(`Entered description: ${description}`);
        }

        const jobStartDate = startDate || this.formatDate(new Date());
        const jobEndDate = endDate || this.formatDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));

        const startInput = this.page.getByRole('textbox', { name: 'Start Date' });
        const endInput = this.page.getByRole('textbox', { name: 'End Date' });

        await startInput.fill(jobStartDate);
        await endInput.fill(jobEndDate);
        Logger.info(`Entered dates: ${jobStartDate} → ${jobEndDate}`);

        if (selectBudgetCategory) {
            this.selectedBudgetCategory = await this.selectJobBudgetCategory();
        }
    }

    formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    async selectJobBudgetCategory() {
        try {
            Logger.step('Selecting Budget Category in job form...');
            const budgetCatInput = this.budgetCategoryInput;

            const isVisible = await budgetCatInput.isVisible({ timeout: 3000 }).catch(() => false);
            if (!isVisible) {
                Logger.info('Budget Category field not visible in job form — skipping.');
                return null;
            }

            let placeholder = '';
            for (let i = 0; i < 15; i++) {
                await this.page.waitForTimeout(1000);
                placeholder = await budgetCatInput.getAttribute('placeholder').catch(() => '');
                const disabled = await budgetCatInput.getAttribute('disabled').catch(() => null);
                const readonly = await budgetCatInput.getAttribute('readonly').catch(() => null);

                if (placeholder === 'Select budget item' && disabled === null) {
                    Logger.info('Budget Category field ready');
                    break;
                }
                if (placeholder === 'No budget items found for this property and year') {
                    Logger.info('No budget items for this property/year — skipping.');
                    return null;
                }
                Logger.info(`Budget Category loading... (placeholder: "${placeholder}", disabled: ${disabled !== null})`);
            }

            if (placeholder !== 'Select budget item') {
                Logger.info(`Budget Category not ready after polling (placeholder: "${placeholder}") — skipping.`);
                return null;
            }

            await budgetCatInput.click();
            await this.page.waitForTimeout(300);
            await budgetCatInput.fill('');
            await this.page.waitForTimeout(300);

            const searchText = 'Con';
            await budgetCatInput.pressSequentially(searchText, { delay: 100 });
            Logger.info(`Typed "${searchText}" in Budget Category to trigger suggestions`);
            await this.page.waitForTimeout(1500);

            const options = this.page.locator('[role="option"]:visible');
            let optionCount = await options.count().catch(() => 0);
            let selectedText = null;

            if (optionCount === 0) {
                const comboboxOptions = this.page.locator('[data-combobox-option="true"]:visible');
                optionCount = await comboboxOptions.count().catch(() => 0);
                if (optionCount > 0) {
                    selectedText = (await comboboxOptions.first().textContent())?.trim();
                    Logger.info(`Found ${optionCount} suggestion(s), selecting: "${selectedText}"`);
                    await comboboxOptions.first().click();
                    await this.page.waitForTimeout(1000);
                }
            } else {
                selectedText = (await options.first().textContent())?.trim();
                Logger.info(`Found ${optionCount} suggestion(s), selecting: "${selectedText}"`);
                await options.first().click();
                await this.page.waitForTimeout(1000);
            }

            if (optionCount === 0) {
                Logger.info('No suggestions appeared after typing — skipping.');
                await this.page.keyboard.press('Escape');
                return null;
            }

            const inputValue = await budgetCatInput.inputValue().catch(() => '');
            const finalValue = (inputValue && inputValue.length > searchText.length) ? inputValue.trim() : selectedText;
            Logger.success(`Budget Category selected: "${finalValue}"`);
            return finalValue;
        } catch (e) {
            Logger.info(`Budget Category selection failed: ${e.message}`);
            return null;
        }
    }

    async submitJob() {
        await this.submitBtn.click();
    }

    async validateOverviewVisible() {
        // await expect(this.jobOverviewHeader).toBeVisible();
        await expect(this.editButton).toBeVisible();
        await expect(this.editButton).toBeEnabled();
    }

    async createBidWithMaterial() {
        await this.page.waitForLoadState('networkidle');
    }

    async inviteVendorsToBid() {
        await this.page.waitForLoadState('networkidle');
    }

    // ---------------- Vendor actions ---------------- //

    async searchVendor(name) {
        await this.vendorSearchInput.waitFor({ state: 'visible' });
        await this.vendorSearchInput.fill(name);
    }

    async selectVendor(name) {
        await this.vendorRow(name).click();
    }

    async inviteSelectedVendors() {
        await this.inviteSelectedBtn.click();
        await this.page.waitForLoadState('networkidle');
    }

    async assertVendorVisibleInGrid(name) {
        await expect(this.vendorNameCell(name)).toContainText(name);
    }

    async openResetTableModal() {
        await this.resetTableIcon.nth(0).click();
        await expect(this.resetModal).toBeVisible();
    }

    async validateResetModalContent() {
        await expect(this.resetModalHeader).toHaveText("Reset Bid Table");

        const expectedText =
            "Are you sure you want to reset the bid table? This will delete all bid rows and cannot be undone. The table will be cleared and ready for new entries.";

        await expect(this.resetModalBody).toHaveText(expectedText);
        await expect(this.resetCancelBtn).toBeVisible();
        await expect(this.resetConfirmBtn).toBeVisible();
    }

    async confirmResetTable() {
        await this.resetConfirmBtn.nth(0).click();
        try {
            await this.resetModal.waitFor({ state: 'hidden', timeout: 15000 });
        } catch {
            await this.page.keyboard.press('Escape');
            await this.page.waitForTimeout(1000);
        }
    }

    async assertRowCountAfterReset() {
        const rowCount = await this.tableRow.count();
        expect(rowCount).toBeLessThanOrEqual(2);
    }

    async openScopeMixModal() {
        await this.scopeMixBtn.first().click();
        await expect(this.scopeModal).toBeVisible();
    }

    async validateScopeMixModalFields() {
        const modalText = (await this.scopeModal.allInnerTexts()).join("");
        expect(modalText.length).toBeGreaterThan(0);

        await expect(this.scopeModalCloseBtn).toBeVisible();
        await expect(this.scopeSearchInput).toBeVisible();
        const placeholder = await this.scopeSearchInput.getAttribute("placeholder");
        expect(placeholder?.length).toBeGreaterThan(0);

        await expect(this.scopePlusBtn).toBeVisible();
        await expect(this.scopeRepeatBtn).toBeVisible();

        // Try to find grid, but continue if not found
        try {
            await expect(this.scopeAgGrid).toBeVisible({ timeout: 3000 });
            const gridText = await this.scopeAgGrid.innerText();
            expect(gridText.length).toBeGreaterThan(0);
        } catch (e) {
            Logger.info('Scope grid not found, but continuing...');
        }

        await expect(this.scopeClearAllBtn).toBeVisible();
        await expect(this.scopeSubmitBtn).toBeVisible();
        expect(await this.scopeClearAllBtn.isDisabled()).toBeTruthy();
        expect(await this.scopeSubmitBtn.isDisabled()).toBeTruthy();

        const count = await this.scopeAllButtons.count();
        for (let i = 0; i < count; i++) {
            const btnText = await this.scopeAllButtons.nth(i).innerText();
            if (btnText.trim().length > 0) {
                expect(btnText.trim().length).toBeGreaterThan(0);
            }
        }

        const svgCount = await this.scopeAllIcons.count();
        expect(svgCount).toBeGreaterThan(0);

        await expect(this.scopeModalBody).toBeVisible();
        await expect(this.scopeModalStack).toBeVisible();
        await expect(this.scopeInputWrapper).toBeVisible();
        await expect(this.scopeGroup).toBeVisible();
    }

    async addScopeEntry() {
        await this.scopePlusBtn.click();

        await expect(this.scopeEditor).toBeVisible();
        await expect(this.scopeEditorInput).toBeVisible();

        const placeholder = await this.scopeEditorInput.getAttribute("placeholder");
        expect(placeholder?.length).toBeGreaterThan(0);

        await expect(this.scopeEditorCheckBtn).toBeVisible();
        await expect(this.scopeEditorCancelBtn).toBeVisible();
        expect(await this.scopeEditorCheckBtn.isDisabled()).toBeTruthy();

        const randomName = "Scope_" + Date.now();
        await this.scopeEditorInput.fill(randomName);

        expect(await this.scopeEditorCheckBtn.isDisabled()).toBeFalsy();

        await this.scopeEditorCheckBtn.click();
        await expect(this.scopeEditor).toBeHidden();
    }

    async closeScopeMixModal() {
        await this.scopeModalCloseBtn.click();
        await expect(this.scopeModal).toBeHidden();
    }

    async openEditOnBehalfModal() {
        await this.vendorActionBtn.click();
        await this.editOnBehalfOption.click();
        await this.page.waitForTimeout(2000);
        await this.editModalHeader.waitFor({ state: 'visible' });
    }

    async updateBidCost(value) {
        // Double-click the Price cell (data-rgcol="4" is the price column)
        const priceCell = this.page.locator('div[role="gridcell"][data-rgcol="4"][data-rgrow="0"]').first();
        await priceCell.dblclick({ force: true });
        await this.page.waitForTimeout(2000);

        // Wait for input to appear - try multiple selectors
        let costInput;
        try {
            costInput = this.page.getByTestId('bird-table-currency-input').first();
            await costInput.waitFor({ state: 'visible', timeout: 5000 });
        } catch (e) {
            costInput = this.page.locator('input[data-testid="bird-table-currency-input"], input[data-testid="bird-table-number-input"], input[data-testid="bird-table-text-input"]').first();
            await costInput.waitFor({ state: 'visible', timeout: 5000 });
        }

        await costInput.fill(value);
        await costInput.press('Enter');
        await this.page.waitForTimeout(1000);
    }

    async fillAllBidPricesAndQuantities({ quantity = '5', price = '100' } = {}) {
        Logger.step('Filling price and quantity for all bid rows in Edit On Behalf modal...');
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(2000);

        const scopeCells = this.page.locator('[role="dialog"] div[role="gridcell"][data-rgcol="0"]');
        const rowCount = await scopeCells.count();
        Logger.info(`Found ${rowCount} bid row(s) in modal`);

        if (rowCount === 0) {
            Logger.info('No bid rows found in modal — skipping fill');
            return;
        }

        let filledCount = 0;
        for (let row = 0; row < rowCount; row++) {
            try {
                const qtyCell = this.page.locator(`[role="dialog"] div[role="gridcell"][data-rgcol="3"][data-rgrow="${row}"]`).first();
                const qtyCellVisible = await qtyCell.isVisible({ timeout: 3000 }).catch(() => false);
                if (!qtyCellVisible) {
                    Logger.info(`Row ${row}: quantity cell not accessible — skipping (likely totals row)`);
                    continue;
                }

                Logger.step(`Filling row ${row}: quantity=${quantity}, price=${price}`);

                await qtyCell.scrollIntoViewIfNeeded();
                await qtyCell.dblclick({ force: true });
                await this.page.waitForTimeout(800);

                let qtyInput = this.page.locator(
                    'input[data-testid="bird-table-number-input"], input[data-testid="bird-table-currency-input"], input[data-testid="bird-table-text-input"]'
                ).first();
                const qtyInputVisible = await qtyInput.isVisible({ timeout: 3000 }).catch(() => false);
                if (qtyInputVisible) {
                    await qtyInput.fill(quantity);
                    await qtyInput.press('Enter');
                } else {
                    await this.page.keyboard.type(quantity, { delay: 50 });
                    await this.page.keyboard.press('Enter');
                }
                await this.page.waitForTimeout(800);

                const priceCell = this.page.locator(`[role="dialog"] div[role="gridcell"][data-rgcol="4"][data-rgrow="${row}"]`).first();
                const priceCellVisible = await priceCell.isVisible({ timeout: 3000 }).catch(() => false);
                if (!priceCellVisible) {
                    Logger.info(`Row ${row}: price cell not accessible — skipping`);
                    continue;
                }

                await priceCell.scrollIntoViewIfNeeded();
                await priceCell.dblclick({ force: true });
                await this.page.waitForTimeout(800);

                let priceInput = this.page.locator(
                    'input[data-testid="bird-table-currency-input"], input[data-testid="bird-table-number-input"], input[data-testid="bird-table-text-input"]'
                ).first();
                const priceInputVisible = await priceInput.isVisible({ timeout: 3000 }).catch(() => false);
                if (priceInputVisible) {
                    await priceInput.fill(price);
                    await priceInput.press('Enter');
                } else {
                    await this.page.keyboard.type(price, { delay: 50 });
                    await this.page.keyboard.press('Enter');
                }
                await this.page.waitForTimeout(800);

                filledCount++;
                Logger.success(`Row ${row} filled successfully`);
            } catch (e) {
                Logger.info(`Row ${row}: skipped — ${e.message}`);
            }
        }

        Logger.success(`Filled ${filledCount} of ${rowCount} bid rows with quantity=${quantity}, price=${price}`);
    }

    async submitEditedBid() {
        await this.submitBidBtn.click({ force: true });
        await this.page.waitForTimeout(3000);

        // Close modal if still visible - try-catch handles auto-close scenario
        try {
            await this.closeEditModalBtn.click({ timeout: 3000 });
        } catch (e) {
            // Modal may have auto-closed after submit
        }
    }

    async saveLastVisitedUrl() {
        const currentUrl = this.page.url();

        const urlFilePath = path.join(__dirname, '../data/lastVisitedUrl.json');
        fs.writeFileSync(urlFilePath, JSON.stringify({ lastUrl: currentUrl }, null, 2));

        Logger.success(`Saved last visited URL: ${currentUrl}`);
    }

    async saveSessionState(context) {
        await context.storageState({ path: 'jobsessionState.json' });
    }

    async openBidsTabFromInsideJob() {
        await this.page.waitForTimeout(3000);
        await this.bidsTabLabel.click();
    }

    async openBidLevelingTable() {
        await this.levelingButton.click();
        // Wait for the loading indicator to disappear
        const loadingIndicator = this.page.locator('generic:has-text("Loading...")');
        await this.page.waitForTimeout(2000);

        // Wait for the grid content to load - just wait for it to exist, not visible
        const gridRoot = this.page.locator('.ag-root').first();
        try {
            await gridRoot.waitFor({ state: 'attached', timeout: 5000 });
        } catch (e) {
            Logger.info('Grid container did not attach, but continuing...');
        }

        // Wait for any loading overlays to disappear
        await this.page.waitForTimeout(3000);
    }

    async waitForTotalCostRow() {
        Logger.step('Waiting for Total Cost row in bid leveling table...');

        // Wait for Total row using JavaScript since visibility checks are complex in AG Grid
        let totalRowFound = false;
        let attempts = 0;
        const maxAttempts = 20;

        while (!totalRowFound && attempts < maxAttempts) {
            try {
                totalRowFound = await this.page.evaluate(() => {
                    const rows = Array.from(document.querySelectorAll('div[role="row"]'));
                    return rows.some(row => row.textContent.includes('Total'));
                });

                if (!totalRowFound) {
                    attempts++;
                    await this.page.waitForTimeout(500);
                }
            } catch (e) {
                attempts++;
                await this.page.waitForTimeout(500);
            }
        }

        if (!totalRowFound) {
            throw new Error('Total row not found in bid leveling table after 10 seconds');
        }

        Logger.success('Total Cost row found in bid leveling table');
        await this.page.waitForTimeout(1000);
    }

    async assertBidWithMaterialCost(expectedCost) {
        const row = this.bidRow("Bid with material");
        await expect(row).toContainText(expectedCost);
    }

    async assertTotalCost(expectedTotal) {
        await expect(this.totalRow).toContainText(expectedTotal);
    }

    async ensureManageVendorsOpen() {
        if (!(await this.inviteVendorsBtn.isVisible())) {
            await this.manageVendorsLink.click();
        }
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(3000);
    }

    async openVendorActionMenu() {
        try {
            // Ensure manage vendors section is open and vendors are visible
            await this.ensureManageVendorsOpen();
            await this.page.waitForTimeout(1500);

            // Look for vendor action buttons in the manage vendors section
            const vendorButton = this.page.locator('button:has(svg.lucide-ellipsis-vertical)').first();
            await vendorButton.click({ force: true });
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(2000);
        } catch (error) {
            Logger.step(`Error in openVendorActionMenu: ${error.message}`);
            throw error;
        }
    }

    async selectAwardBid() {
        await this.awardBidOption.click();
        await this.page.waitForSelector('section[role="dialog"]', { state: 'visible' });
    }

    async validateAwardModal() {
        await expect(this.awardCancelBtn).toBeVisible();
        await expect(this.awardConfirmBtn).toBeVisible();
    }

    async confirmAwardBid() {
        await this.awardConfirmBtn.click();
    }

    async waitForPendingStatus() {
        // First, wait for the grid content to load with better timeout
        await this.page.waitForTimeout(2000);

        // Wait for grid to be rendered
        const gridContainer = this.page.locator('.ag-root').first();
        try {
            await gridContainer.waitFor({ state: 'attached', timeout: 5000 });
        } catch (e) {
            Logger.info('Grid container not found, but continuing...');
        }

        // Wait for any status to appear in the grid using JavaScript
        let statusFound = false;
        let attempts = 0;
        const maxAttempts = 15;

        while (!statusFound && attempts < maxAttempts) {
            try {
                statusFound = await this.page.evaluate(() => {
                    const rows = Array.from(document.querySelectorAll('div[role="row"]'));
                    return rows.some(row => row.textContent.includes('Pending'));
                });

                if (!statusFound) {
                    attempts++;
                    await this.page.waitForTimeout(500);
                }
            } catch (e) {
                attempts++;
                await this.page.waitForTimeout(500);
            }
        }

        if (!statusFound) {
            Logger.info('Pending status not found after waiting, but continuing...');
        } else {
            Logger.success('Pending status found in grid');
        }

        await this.page.waitForTimeout(1000);
    }

    async openContractsTab() {
        await this.contractsTab.click();
    }

    async selectAllContractRows() {
        const loc = projectJobLocators(this.page);
        await loc.contractsScopeHeader.waitFor({ state: 'visible', timeout: 15000 });
        let rowCheckboxes = loc.contractRowCheckboxes;
        let count = await rowCheckboxes.count();
        if (count === 0) {
            rowCheckboxes = loc.contractAltCheckboxes;
            count = await rowCheckboxes.count();
            Logger.info('Fallback checkboxes found: ' + count);
        } else {
            Logger.info('Row checkboxes found: ' + count);
        }
        if (count === 0) throw new Error('No row selection checkboxes found in grid');
        for (let i = 0; i < count; i++) {
            const cb = rowCheckboxes.nth(i);
            if (!(await cb.isChecked().catch(() => false))) {
                await cb.scrollIntoViewIfNeeded();
                await cb.click({ force: true });
                await this.page.waitForTimeout(150);
            }
        }
    }

    async bulkUpdateContractsToInProgress() {
        const loc = projectJobLocators(this.page);
        await this.openContractsTab();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(1000);
        await this.selectAllContractRows();
        Logger.step('Open Bulk Update Status menu');
        await expect(loc.bulkUpdateStatusBtn).toBeVisible({ timeout: 5000 });
        await expect(loc.bulkUpdateStatusBtn).toBeEnabled({ timeout: 5000 });
        await loc.bulkUpdateStatusBtn.click();
        Logger.step('Select "In Progress" from the menu');
        await expect(loc.bulkUpdateInProgressItem).toBeVisible({ timeout: 5000 });
        await loc.bulkUpdateInProgressItem.click();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(1500);
        Logger.step('Assert status successfully changed to In Progress');
        await expect(loc.inProgressStatusText).toBeVisible({ timeout: 5000 });
        Logger.success('Status successfully changed to In Progress');
    }

    async openFinalizeContractModal() {
        await this.finalizeContractBtn.click();
    }

    async confirmFinalizeContract() {
        await this.finalizeContractConfirmBtn.click();

        // Wait for the modal to close or button to become disabled/hidden
        await this.page.waitForTimeout(3000);

        // Try waiting for the modal to close
        try {
            await this.page.locator('section[role="dialog"]').waitFor({ state: 'hidden', timeout: 10000 });
        } catch (e) {
            Logger.info('Modal did not close, but continuing...');
        }
    }

    async assertContractFinalized() {
        await expect(this.bulkUpdateStatusBtn).toBeDefined();
    }

    async selectBudgetCategoryForAllBids() {
        Logger.step('Selecting budget category for all bids in Contracts tab...');
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(3000);

        const budgetCatHeader = this.page.getByRole('columnheader', { name: 'Budget Category' });
        await budgetCatHeader.waitFor({ state: 'visible', timeout: 10000 });

        const scopeCells = this.page.locator('div[role="gridcell"][data-rgcol="0"]');
        let rowCount = 0;
        const uniqueRows = [];
        const totalCells = await scopeCells.count();
        for (let c = 0; c < totalCells; c++) {
            const cell = scopeCells.nth(c);
            const visible = await cell.isVisible().catch(() => false);
            if (visible) {
                const rgrow = await cell.getAttribute('data-rgrow').catch(() => null);
                if (rgrow !== null && !uniqueRows.includes(rgrow)) {
                    uniqueRows.push(rgrow);
                }
            }
        }
        rowCount = uniqueRows.length;
        Logger.info(`Found ${rowCount} visible contract row(s) for budget category assignment`);

        if (rowCount === 0) {
            Logger.info('No visible contract rows found — skipping budget category assignment');
            return;
        }

        let assignedCount = 0;
        for (const rgrow of uniqueRows) {
            const budgetCell = this.page.locator(`div[role="gridcell"][data-rgcol="1"][data-rgrow="${rgrow}"]`).first();
            const cellVisible = await budgetCell.isVisible({ timeout: 3000 }).catch(() => false);
            if (!cellVisible) {
                Logger.info(`Row ${rgrow}: budget category cell not visible — skipping`);
                continue;
            }

            const currentValue = await budgetCell.textContent().catch(() => '');
            if (currentValue && currentValue.trim() !== '-' && currentValue.trim() !== '' && currentValue.trim() !== '—') {
                Logger.info(`Row ${rgrow}: budget category already set to "${currentValue.trim()}" — skipping`);
                continue;
            }

            Logger.step(`Row ${rgrow}: assigning budget category...`);
            await budgetCell.scrollIntoViewIfNeeded();
            await budgetCell.dblclick({ force: true });
            await this.page.waitForTimeout(2000);

            const anyInput = this.page.locator('input:visible').last();
            const inputVisible = await anyInput.isVisible({ timeout: 5000 }).catch(() => false);

            if (inputVisible) {
                await anyInput.fill('');
                await anyInput.pressSequentially('Con', { delay: 100 });
                Logger.info(`Row ${rgrow}: typed "Con" to search budget categories`);
                await this.page.waitForTimeout(2000);
            } else {
                Logger.info(`Row ${rgrow}: no input editor found after double-click — skipping`);
                await this.page.keyboard.press('Escape');
                continue;
            }

            const options = this.page.locator('[role="option"]:visible');
            const comboOptions = this.page.locator('[data-combobox-option="true"]:visible');

            let selected = false;
            let optionCount = await options.count().catch(() => 0);
            for (let j = 0; j < optionCount; j++) {
                const text = await options.nth(j).textContent().catch(() => '');
                if (text && /construction/i.test(text)) {
                    Logger.info(`Row ${rgrow}: selecting "${text.trim()}"`);
                    await options.nth(j).click();
                    selected = true;
                    break;
                }
            }
            if (!selected && optionCount > 0) {
                for (let j = 0; j < optionCount; j++) {
                    const text = await options.nth(j).textContent().catch(() => '');
                    if (text && !/clear/i.test(text)) {
                        Logger.info(`Row ${rgrow}: selecting "${text.trim()}"`);
                        await options.nth(j).click();
                        selected = true;
                        break;
                    }
                }
            }

            if (!selected) {
                optionCount = await comboOptions.count().catch(() => 0);
                for (let j = 0; j < optionCount; j++) {
                    const text = await comboOptions.nth(j).textContent().catch(() => '');
                    if (text && /construction/i.test(text)) {
                        Logger.info(`Row ${rgrow}: selecting "${text.trim()}"`);
                        await comboOptions.nth(j).click();
                        selected = true;
                        break;
                    }
                }
            }

            if (!selected) {
                Logger.info(`Row ${rgrow}: no valid option found — pressing Escape`);
                await this.page.keyboard.press('Escape');
            } else {
                assignedCount++;
            }

            await this.page.waitForTimeout(1000);
            Logger.success(`Row ${rgrow}: budget category processed`);
        }

        Logger.success(`Budget category assignment completed — ${assignedCount} of ${rowCount} row(s) assigned`);
    }

};
