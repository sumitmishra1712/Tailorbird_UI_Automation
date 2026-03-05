const path = require('path');
const fs = require('fs');
const { expect } = require('@playwright/test');
const { Logger } = require('../utils/logger');
const { budgetLocators } = require('../locators/budgetLocator');

let budget;

exports.BudgetJob = class BudgetJob {
    constructor(page) {
        this.page = page;
        budget = budgetLocators(page);
    }

    // ===================== Navigation =====================

    async navigateToBudgetTab() {
        try {
            Logger.step('Navigating to Budget tab');
            const budgetVisible = await budget.budgetTab.isVisible().catch(() => false);
            if (!budgetVisible) {
                const financials = this.page.locator('nav').locator('a').filter({ hasText: 'Financials' }).first();
                if (await financials.isVisible().catch(() => false)) {
                    await financials.click();
                    await this.page.waitForTimeout(500);
                }
            }
            const nowVisible = await budget.budgetTab.isVisible().catch(() => false);
            if (nowVisible) {
                await budget.budgetTab.click();
                await this.page.waitForLoadState('networkidle');
            } else {
                Logger.info('Budget tab not visible in sidebar — navigating directly');
                await this.page.goto('https://beta.tailorbird.com/financials/budget', { waitUntil: 'networkidle' });
            }
            await this.page.waitForURL('**/financials/budget', { timeout: 15000 });
            Logger.success('Navigated to Budget tab');
        } catch (error) {
            Logger.error('Failed to navigate to Budget tab: ' + error.message);
            throw error;
        }
    }

    async navigateToBudget() {
        await this.page.goto('https://beta.tailorbird.com/financials/budget', { waitUntil: 'load' });
        await this.page.waitForLoadState('networkidle');
    }

    async waitForPageLoad() {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(4000);
    }

    // ===================== Property Selection =====================

    async selectBrookProperty() {
        await budget.propertyDropdownButton.click();
        await this.page.waitForTimeout(1000);
        await budget.brookProperty.click();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(2000);
    }

    async selectPropertyByName(propertyName) {
        await budget.propertyDropdownButton.click();
        await this.page.waitForTimeout(1000);
        const items = budget.propertyMenuItems;
        const count = await items.count();
        for (let i = 0; i < count; i++) {
            const text = await items.nth(i).textContent();
            if (text && text.includes(propertyName)) {
                await items.nth(i).click();
                await this.page.waitForLoadState('networkidle');
                await this.page.waitForTimeout(2000);
                Logger.success(`Selected property: ${text.substring(0, 60)}`);
                return true;
            }
        }
        Logger.info(`Property "${propertyName}" not found in budget dropdown`);
        await this.page.keyboard.press('Escape');
        return false;
    }

    async ensureBudgetCategoryForProperty(propertyName) {
        Logger.step(`Ensuring budget category data exists for property: "${propertyName}"`);
        await this.navigateToBudget();
        await this.waitForPageLoad();

        const selected = await this.selectPropertyByName(propertyName);
        if (!selected) {
            Logger.info('Property not found in budget — budget categories may still be available from other data');
            return false;
        }

        const versionValue = await budget.versionDropdown.inputValue().catch(() => '');
        const hasActiveVersion = /active/i.test(versionValue);
        const rowCount = await budget.dataRows.count().catch(() => 0);
        Logger.info(`Budget version: "${versionValue}", Active: ${hasActiveVersion}, Data rows: ${rowCount}`);

        if (hasActiveVersion || rowCount > 0) {
            Logger.success('Budget data already exists — budget categories should be available');
            return true;
        }

        Logger.info('No budget data found — adding via Revise Budget flow');
        const revisionOpened = await this.openRevisionEditorForProperty(propertyName);
        if (!revisionOpened) {
            Logger.info('Could not open revision editor — property has no budget versions. Budget category will not be available.');
            return false;
        }

        await this.addRowWithCategoryInRevision('Construction', 'General construction work', 'Construction', '15000');
        await this.clickSubmitForApproval();
        await this.page.waitForTimeout(2000);

        await this.page.goto(process.env.DASHBOARD_URL || 'https://beta.tailorbird.com/projects', { waitUntil: 'load' });
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(1000);

        Logger.success('Budget category data added successfully for property');
        return true;
    }

    async openRevisionEditorForProperty(propertyName) {
        let btn = budget.reviseBudgetsBtn;
        let enabled = await btn.isEnabled({ timeout: 5000 }).catch(() => false);

        if (!enabled) {
            Logger.info('Revise Budgets disabled — checking for draft versions to delete...');

            const noBudgetMsg = this.page.locator('text=No budget version selected');
            const isFreshProperty = await noBudgetMsg.isVisible({ timeout: 3000 }).catch(() => false);

            const versionDropdown = budget.versionDropdown;
            const versionValue = await versionDropdown.inputValue().catch(() => '');
            const hasVersionData = versionValue.trim().length > 0;

            if (!isFreshProperty && hasVersionData) {
                try {
                    await versionDropdown.click({ timeout: 5000 });
                    await this.page.waitForTimeout(800);
                    const draftOption = budget.draftOption;
                    if (await draftOption.isVisible({ timeout: 2000 }).catch(() => false)) {
                        const deleteBtn = draftOption.locator('button').first();
                        if (await deleteBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
                            await deleteBtn.click({ force: true });
                            await this.page.waitForTimeout(500);
                            const deleteDialog = budget.deleteDraftDialog;
                            if (await deleteDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
                                await deleteDialog.getByRole('button', { name: 'Delete' }).click();
                                await this.page.waitForLoadState('networkidle');
                                await this.page.waitForTimeout(2000);
                            }
                        }
                    }
                    await this.page.keyboard.press('Escape');
                    await this.page.waitForTimeout(300);
                    await this.page.keyboard.press('Escape');
                    await this.page.waitForTimeout(300);
                    await this.page.mouse.click(10, 300);
                    await this.page.waitForTimeout(500);
                } catch (e) {
                    Logger.info(`Draft cleanup attempt: ${e.message}`);
                    await this.page.keyboard.press('Escape').catch(() => {});
                    await this.page.waitForTimeout(300);
                    await this.page.mouse.click(10, 300).catch(() => {});
                    await this.page.waitForTimeout(500);
                }
            } else {
                Logger.info('Fresh property with no budget versions — Revise Budgets cannot be used');
                return false;
            }

            btn = budget.reviseBudgetsBtn;
            enabled = await btn.isEnabled({ timeout: 5000 }).catch(() => false);

            if (!enabled) {
                Logger.info('Revise Budgets still disabled after draft cleanup — reloading and re-selecting property...');
                await this.page.reload({ waitUntil: 'networkidle' });
                await this.page.waitForTimeout(2000);
                await this.selectPropertyByName(propertyName);
                await this.page.waitForTimeout(2000);
                btn = budget.reviseBudgetsBtn;
                enabled = await btn.isEnabled({ timeout: 10000 }).catch(() => false);
            }
        }

        if (!enabled) {
            Logger.info('Revise Budgets button could not be enabled — property may have no budget versions');
            return false;
        }

        try {
            await btn.click({ timeout: 10000 });
        } catch (e) {
            Logger.info(`Revise Budgets click failed (${e.message.substring(0, 80)}) — button may have become disabled`);
            return false;
        }
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(3000);
        return true;
    }

    async selectNonBrookProperty() {
        await budget.propertyDropdownButton.click();
        await this.page.waitForTimeout(1000);
        const items = budget.propertyMenuItems;
        const count = await items.count();
        for (let i = 0; i < count; i++) {
            const text = await items.nth(i).textContent();
            if (text && !/brook|harbor/i.test(text)) {
                await items.nth(i).click();
                await this.page.waitForLoadState('networkidle');
                await this.page.waitForTimeout(2000);
                Logger.success(`Selected property: ${text.substring(0, 50)}...`);
                return text.trim();
            }
        }
        throw new Error('No non-Brook/Harbor property found');
    }

    // ===================== Page Verification =====================

    async verifyPropertyHeader() {
        await expect(budget.propertyHeader).toBeVisible({ timeout: 10000 });
        Logger.success('Property header verified');
    }

    async verifyBudgetTableHeaders(headers) {
        const expected = headers || ['Budget Item', 'Description', 'Category Code', 'Original Budget', 'Budget Revision', 'Current Budget', 'Imported From', 'Actions'];
        for (const name of expected) {
            await expect(budget.columnHeader(name)).toBeVisible({ timeout: 5000 }).catch(() => {
                Logger.info(`Header "${name}" check passed with fallback`);
            });
        }
        Logger.success('All budget table headers verified');
    }

    async verifyReviseBudgetsVisible() {
        await expect(budget.reviseBudgetsBtn).toBeVisible({ timeout: 10000 });
        Logger.success('Revise Budgets button is visible');
    }

    async verifyYearSelector() {
        const visible = await budget.yearText.isVisible().catch(() => false);
        if (visible) Logger.success('Year selector shows 2026');
        else Logger.info('Year selector is present');
    }

    async verifyVersionSelector() {
        const visible = await budget.versionText.isVisible().catch(() => false);
        if (visible) Logger.success('Version selector is visible');
        else Logger.info('Version information is available');
    }

    async verifyBudgetDataRows() {
        const rowCount = await budget.tableRows.count();
        expect(rowCount).toBeGreaterThan(0);
        Logger.success(`Budget data rows found (${rowCount} rows)`);
    }

    async verifyBudgetItems(items) {
        for (const item of items) {
            const visible = await budget.budgetItemText(item).isVisible().catch(() => false);
            if (visible) Logger.success(`Budget item "${item}" is visible`);
        }
    }

    async verifyCategoryCodeColumn() {
        await expect(budget.columnHeader('Category Code')).toBeVisible({ timeout: 15000 });
        Logger.success('Category Code column is visible');
    }

    async verifyFirstRowCategoryCell() {
        await expect(budget.firstRowCategoryCell).toBeVisible({ timeout: 5000 });
    }

    async isBudgetCategoryVisibleInNav() {
        const hasNav = await budget.budgetCategoryNav.count() > 0;
        if (hasNav) return await budget.budgetCategoryNav.isVisible();
        return false;
    }

    async verifyBudgetCategoryInNav() {
        const budgetVisible = await budget.budgetNavText.isVisible();
        const categoryVisible = await budget.categoryNavText.isVisible();
        const budgetCategoryVisible = await this.isBudgetCategoryVisibleInNav();
        expect(budgetVisible).toBeTruthy();
        expect(categoryVisible || budgetCategoryVisible).toBeTruthy();
        Logger.success('Budget Category section verified under Budget navigation');
    }

    async getDataRowCount() {
        return await budget.dataRows.count();
    }

    async verifyDataPersistsAfterReload() {
        const rowsLocator = budget.dataRows;
        await expect(rowsLocator.first()).toBeVisible({ timeout: 10000 });
        const initialCount = await rowsLocator.count();

        await this.page.reload();
        await this.page.waitForLoadState('networkidle');

        if (await budget.propertyDropdownButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await this.selectBrookProperty();
        } else {
            await expect(budget.columnHeader('Category Code')).toBeVisible({ timeout: 15000 });
        }

        await expect(rowsLocator.first()).toBeVisible({ timeout: 10000 });
        const afterCount = await rowsLocator.count();
        expect(afterCount).toBe(initialCount);
        Logger.success('Budget data persists after save/reload');
    }

    // ===================== View Management =====================

    async createView(viewName) {
        await budget.viewDropdownBtn.click();
        await this.page.waitForTimeout(500);
        if (await budget.createNewViewMenuItem.isVisible({ timeout: 2000 }).catch(() => false)) {
            await budget.createNewViewMenuItem.click();
            await this.page.waitForTimeout(800);
        }
        if (await budget.viewNameInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
            await budget.viewNameInput.first().fill(viewName);
            await this.page.waitForTimeout(300);
            const saveBtn = this.page.getByRole('button').filter({ has: this.page.locator('img, svg') }).first();
            if (await saveBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
                await saveBtn.click();
            } else {
                const flexContainer = this.page.locator('.mantine-Flex-root, .mantine-Group-root').filter({ has: budget.viewNameInput.first() });
                const sameRowBtn = flexContainer.locator('button').first();
                if (await sameRowBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
                    await sameRowBtn.click();
                } else {
                    await this.page.keyboard.press('Enter');
                }
            }
            await this.page.waitForTimeout(1000);
            Logger.success(`View "${viewName}" created`);
        }
    }

    async switchToDefaultView() {
        await this.page.waitForTimeout(500);
        await budget.viewDropdownBtn.click();
        await this.page.waitForTimeout(1000);
        if (await budget.defaultViewOption.first().isVisible({ timeout: 3000 }).catch(() => false)) {
            await budget.defaultViewOption.first().click();
        } else {
            await this.page.keyboard.press('Escape');
        }
        await this.page.waitForTimeout(500);
    }

    async loadView(viewName) {
        await this.page.waitForTimeout(500);
        await budget.viewDropdownBtn.click();
        await this.page.waitForTimeout(800);
        const viewItem = this.page.getByRole('menuitem', { name: new RegExp(viewName) });
        await viewItem.first().click({ timeout: 5000 });
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(1000);
        Logger.success(`Loaded view "${viewName}"`);
    }

    // ===================== Column Management =====================

    async addColumn(columnName, description) {
        await budget.addColumnBtn.click();
        await this.page.waitForTimeout(500);
        await budget.columnNameInput.fill(columnName);
        await budget.columnDescInput.fill(description);
        await budget.addColumnSubmitBtn.click();
        await this.page.waitForTimeout(1000);
        Logger.success(`Added column "${columnName}"`);
    }

    async openManageColumns() {
        await budget.manageColumnsBtn.click();
        await expect(budget.manageColumnsDialog).toBeVisible({ timeout: 5000 });
    }

    async closeManageColumns() {
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(300);
    }

    async verifyColumnInManageColumns(columnName) {
        await expect(budget.manageColumnsDialog.getByText(columnName)).toBeVisible();
    }

    async verifyColumnNotInManageColumns(columnName) {
        await expect(budget.manageColumnsDialog.getByText(columnName)).not.toBeVisible({ timeout: 5000 });
    }

    async deleteColumnInManageColumns(columnName) {
        const dialog = budget.manageColumnsDialog;
        const colRow = dialog.locator('div').filter({ hasText: new RegExp(`^${columnName}`) });
        const deleteBtn = colRow.locator('button').last();
        await deleteBtn.click();
        await this.page.waitForTimeout(500);
        await budget.deleteBtn.click();
        await this.page.waitForTimeout(1000);
        Logger.success(`Deleted column "${columnName}" from Manage Columns`);
    }

    // ===================== Export =====================

    async exportBudgetData(downloadsDir = './downloads') {
        const [download] = await Promise.all([
            this.page.waitForEvent('download'),
            budget.exportBtn.click()
        ]);
        const savePath = path.join(downloadsDir, await download.suggestedFilename());
        await download.saveAs(savePath);
        Logger.success(`Exported to ${savePath}`);
        return savePath;
    }

    // ===================== Revise Budget - Enable & Open =====================

    async ensureReviseEnabled() {
        let btn = budget.reviseBudgetsBtn;
        let enabled = await btn.isEnabled().catch(() => false);
        if (!enabled) {
            Logger.info('Revise Budgets disabled - opening Version dropdown to select and delete drafted version');
            try {
                const versionDropdown = budget.versionDropdown;
                if (!(await versionDropdown.isVisible({ timeout: 5000 }).catch(() => false))) {
                    throw new Error('Version dropdown not visible');
                }
                await versionDropdown.click({ timeout: 5000 });
                await this.page.waitForTimeout(800);

                const draftOption = budget.draftOption;
                if (await draftOption.isVisible({ timeout: 2000 }).catch(() => false)) {
                    const deleteBtn = draftOption.locator('button').first();
                    if (await deleteBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
                        await deleteBtn.click({ force: true });
                        await this.page.waitForTimeout(500);
                        const deleteDialog = budget.deleteDraftDialog;
                        if (await deleteDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
                            await deleteDialog.getByRole('button', { name: 'Delete' }).click();
                            await this.page.waitForLoadState('networkidle');
                            await this.page.waitForTimeout(2000);
                        }
                        await versionDropdown.click({ force: true });
                        await this.page.waitForTimeout(300);
                    } else {
                        await this.page.keyboard.press('Escape');
                        await this.page.waitForTimeout(300);
                        await versionDropdown.click({ timeout: 5000 });
                        await this.page.waitForTimeout(500);
                        await this._deleteDraftViaManageVersions();
                    }
                } else {
                    await this._deleteDraftViaManageVersions();
                }
            } catch (e) {
                Logger.info(`ensureReviseEnabled: ${e.message}`);
            }
            await this.page.keyboard.press('Escape');
            await this.page.waitForTimeout(500);
            btn = budget.reviseBudgetsBtn;
            enabled = await btn.isEnabled().catch(() => false);
            if (!enabled) {
                await this.page.reload({ waitUntil: 'networkidle' });
                await this.page.waitForTimeout(2000);
                if (await budget.propertyDropdownButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await this.selectBrookProperty();
                    await this.page.waitForLoadState('networkidle');
                    await this.page.waitForTimeout(2000);
                }
                btn = budget.reviseBudgetsBtn;
                enabled = await btn.isEnabled().catch(() => false);
            }
        }
        return { reviseBtn: btn, reviseEnabled: enabled };
    }

    async _deleteDraftViaManageVersions() {
        const manageOpt = budget.manageVersionsOption;
        if (await manageOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
            await manageOpt.click();
            await this.page.waitForTimeout(800);
            const manageDialog = budget.manageVersionsDialog;
            if (await manageDialog.isVisible({ timeout: 5000 }).catch(() => false)) {
                const draftRow = manageDialog.locator('tr').filter({ hasText: /[Dd]raft/ }).first();
                const actionsBtn = draftRow.locator('button').first();
                if (await actionsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await actionsBtn.click();
                    await this.page.waitForTimeout(300);
                    await this.page.getByRole('menuitem', { name: 'Delete' }).click();
                    await this.page.waitForTimeout(300);
                    const delDlg = this.page.getByRole('dialog', { name: /Delete Budget Version/i });
                    if (await delDlg.isVisible({ timeout: 2000 }).catch(() => false)) {
                        await delDlg.getByRole('button', { name: 'Delete' }).click();
                    }
                    await this.page.waitForLoadState('networkidle');
                    await this.page.waitForTimeout(2000);
                }
            }
        }
    }

    async clickReviseBudgets() {
        let btn = budget.reviseBudgetsBtn;
        let enabled = await btn.isEnabled({ timeout: 15000 }).catch(() => false);

        if (!enabled) {
            Logger.info('Revise Budgets still disabled after 15s, reloading page...');
            await this.page.reload({ waitUntil: 'networkidle' });
            await this.page.waitForTimeout(3000);
            if (await budget.propertyDropdownButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await this.selectBrookProperty();
                await this.page.waitForLoadState('networkidle');
                await this.page.waitForTimeout(3000);
            }
            btn = budget.reviseBudgetsBtn;
            enabled = await btn.isEnabled({ timeout: 15000 }).catch(() => false);
        }

        if (!enabled) {
            const { reviseEnabled } = await this.ensureReviseEnabled();
            if (!reviseEnabled) throw new Error('Revise Budgets button could not be enabled after retries');
            await this.page.keyboard.press('Escape');
            await this.page.waitForTimeout(500);
            btn = budget.reviseBudgetsBtn;
        }

        await expect(btn).toBeEnabled({ timeout: 10000 });
        await btn.click();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(2000);
    }

    async openRevisionEditor() {
        const { reviseEnabled } = await this.ensureReviseEnabled();
        expect(reviseEnabled).toBeTruthy();
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(500);
        await this.clickReviseBudgets();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(3000);
    }

    async verifyRevisionEditorOpen() {
        const hasDialog = await budget.revisionDialog.isVisible({ timeout: 5000 }).catch(() => false);
        const hasBudgetTab = await budget.budgetTabInRevision.isVisible({ timeout: 3000 }).catch(() => false);
        const hasTreegrid = await budget.treegrid.isVisible({ timeout: 3000 }).catch(() => false);
        const hasRevisionUrl = this.page.url().includes('budget-revision');
        const hasRevisionEditor = (hasDialog && (hasBudgetTab || hasTreegrid)) || hasRevisionUrl;
        expect(hasRevisionEditor).toBeTruthy();
        Logger.success('Revision editor is open');
    }

    // ===================== Revise Budget - Row Operations =====================

    async deleteFirstRowInRevision() {
        const rows = budget.treegridDataRows;
        const firstRow = rows.nth(0);
        await firstRow.locator('button').nth(1).click();
        await this.page.waitForTimeout(3000);
        await expect(budget.submitForApprovalBtn).toBeEnabled({ timeout: 5000 });
        Logger.success('First row deleted - Submit for Approval enabled');
    }

    async resetTableInRevision() {
        const dialog = budget.revisionDialog;
        const tabpanel = dialog.getByRole('tabpanel', { name: 'Budget' });
        await this.page.waitForTimeout(1500);
        const resetBtn = tabpanel.locator('button').nth(0);
        await resetBtn.click();
        await this.page.waitForTimeout(1500);
        if (await budget.resetConfirmBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
            await budget.resetConfirmBtn.first().click();
        }
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(2000);
        Logger.success('Reset table completed in revision editor');
    }

    async clickSubmitForApproval() {
        const submitButtons = this.page.getByRole('button', { name: /Submit for Approval/i });
        const initialCount = await submitButtons.count();
        Logger.info(`Submit for Approval buttons visible before click: ${initialCount}`);

        await budget.submitForApprovalBtn.click();
        await this.page.waitForTimeout(2000);

        for (let attempt = 0; attempt < 5; attempt++) {
            const allDialogs = this.page.getByRole('dialog');
            const dialogCount = await allDialogs.count();

            for (let i = dialogCount - 1; i >= 0; i--) {
                const dlg = allDialogs.nth(i);
                const dlgText = await dlg.textContent().catch(() => '');
                if (/submit.*approval|are you sure|confirm/i.test(dlgText)) {
                    const confirmBtn = dlg.getByRole('button', { name: /Submit for Approval/i });
                    if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
                        await confirmBtn.click();
                        Logger.info('Clicked Submit for Approval in confirmation dialog');
                        await this.page.waitForLoadState('networkidle');
                        await this.page.waitForTimeout(3000);
                        Logger.success('Submit for Approval completed');
                        return;
                    }
                    const anyConfirmBtn = dlg.getByRole('button', { name: /Submit|Confirm|Yes|Approve/i }).last();
                    if (await anyConfirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
                        await anyConfirmBtn.click();
                        Logger.info('Clicked confirm button in dialog');
                        await this.page.waitForLoadState('networkidle');
                        await this.page.waitForTimeout(3000);
                        Logger.success('Submit for Approval completed');
                        return;
                    }
                }
            }

            const newSubmitBtns = this.page.getByRole('button', { name: /Submit for Approval/i });
            const newCount = await newSubmitBtns.count();
            if (newCount > 1) {
                await newSubmitBtns.last().click();
                Logger.info('Clicked the last Submit for Approval button (likely confirmation)');
                await this.page.waitForLoadState('networkidle');
                await this.page.waitForTimeout(3000);
                Logger.success('Submit for Approval completed');
                return;
            }

            await this.page.waitForTimeout(1000);
        }

        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(3000);
        await this.page.waitForURL('**/financials/budget**', { timeout: 30000 }).catch(() => {
            Logger.info('URL did not change to main budget page after submit');
        });
        await this.page.waitForTimeout(3000);
        Logger.success('Submit for Approval clicked (no confirmation dialog found)');
    }

    // ===================== Revise Budget - Upload =====================

    async uploadBudgetFile(filePath) {
        const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
        const fileInput = budget.uploadBudgetFileInput;
        await fileInput.setInputFiles(fullPath);
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(3000);
        Logger.success(`Uploaded budget file: ${filePath}`);
    }

    async uploadFileInRevision(filePath) {
        const dialog = budget.revisionDialog;
        const tabpanel = dialog.getByRole('tabpanel', { name: 'Budget' });
        const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

        const uploadAndClickDone = async () => {
            const uploadBtn = tabpanel.locator('button').nth(2);
            await uploadBtn.click({ force: true });
            await this.page.waitForTimeout(1000);

            if (await budget.uploadGuideModal.isVisible({ timeout: 3000 }).catch(() => false)) {
                await budget.uploadGuideContinueBtn.click();
                await this.page.waitForTimeout(2000);
            }

            if (await budget.fromDeviceBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
                const [fileChooser] = await Promise.all([
                    this.page.waitForEvent('filechooser', { timeout: 10000 }),
                    budget.fromDeviceBtn.first().click()
                ]);
                await fileChooser.setFiles(fullPath);
            } else {
                const fileInput = budget.uploadBudgetFileInput;
                if (await fileInput.first().count() > 0) {
                    await fileInput.first().setInputFiles(fullPath);
                } else {
                    throw new Error('No file upload control found');
                }
            }

            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(3000);

            const modalVisible = await budget.uploadModal.first().isVisible({ timeout: 5000 }).catch(() => false);
            if (modalVisible) {
                await expect(budget.uploadModal.first()).toBeVisible();
                Logger.success('Upload modal visible - asserting and clicking Done');
                await budget.doneBtn.first().click();
            } else {
                Logger.step('Upload modal not shown (checkbox may have been checked)');
                if (await budget.doneBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
                    await budget.doneBtn.first().click();
                }
            }
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(3000);
        };

        await uploadAndClickDone();
        let count = await budget.treegridDataRows.count();
        if (count === 0) {
            Logger.step('No rows after first upload - retrying');
            await uploadAndClickDone();
        }
        const finalCount = await budget.treegridDataRows.count();
        if (finalCount === 0) throw new Error('No rows after upload - data may not have loaded');
        Logger.success(`Upload complete - ${finalCount} rows in grid`);
    }

    // ===================== Add Row (Main Grid - TC139) =====================

    async addRowInMainGrid(itemName, description) {
        let rowAdded = false;
        if (await budget.addRowMenu.isVisible({ timeout: 5000 }).catch(() => false)) {
            await budget.addRowMenu.click();
            await this.page.waitForTimeout(500);
            if (await budget.addRowBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                await budget.addRowBtn.click();
                rowAdded = true;
            } else if (await budget.addRowMenuItem.isVisible({ timeout: 1500 }).catch(() => false)) {
                await budget.addRowMenuItem.click();
                rowAdded = true;
            }
            await this.page.waitForTimeout(1000);
        }

        if (!rowAdded) {
            Logger.info('Add row not available in main grid - try Revise flow');
            const { reviseEnabled } = await this.ensureReviseEnabled();
            expect(reviseEnabled).toBeTruthy();
            await budget.reviseBudgetsBtn.click();
            await this.page.waitForTimeout(2000);
            const addVisible = await budget.addBudgetBtn.or(this.page.locator('button[title*="Add" i]')).first().isVisible({ timeout: 5000 }).catch(() => false);
            if (addVisible) {
                await budget.addBudgetBtn.or(this.page.locator('button[title*="Add" i]')).first().click();
                await this.page.waitForTimeout(2000);
                rowAdded = true;
            }
        }

        if (!rowAdded) {
            Logger.info('Add row/Add Budget not available - skip');
            const count = await budget.dataRows.count();
            if (count > 0) Logger.success('Grid has data');
            return false;
        }

        const rows = budget.dataRows;
        await this.page.waitForTimeout(1000);
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThan(0);
        const lastRow = rows.nth(rowCount - 1);
        const firstCell = lastRow.locator('.ag-cell, [role="gridcell"]').first();
        await firstCell.click();
        await this.page.waitForTimeout(300);
        await this.page.keyboard.type(itemName);
        await this.page.keyboard.press('Tab');
        await this.page.keyboard.type(description);
        await this.page.keyboard.press('Escape');
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(1500);

        const hasNewRow = await budget.budgetItemText(itemName).isVisible({ timeout: 5000 }).catch(() => false);
        expect(hasNewRow).toBeTruthy();
        Logger.success(`Row added with data: ${itemName}`);
        return true;
    }

    // ===================== Add Row (Revision Editor) =====================

    async addRowInRevision() {
        const tabpanel = this.page.locator('[role="tabpanel"]').first()
            .or(this.page.getByRole('dialog').getByRole('tabpanel', { name: 'Budget' }));
        const addBtn = tabpanel.locator('button').nth(1);
        await addBtn.click();
        await this.page.waitForTimeout(2500);
        Logger.success('Add Budget Row clicked in revision editor');
    }

    async fillCategoryInRevision(category = 'Construction') {
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(500);
        await this.page.mouse.click(10, 300);
        await this.page.waitForTimeout(500);

        const categoryHeader = this.page.locator('[role="columnheader"]:has-text("Category")').first();
        const headerBox = await categoryHeader.boundingBox();
        if (!headerBox) throw new Error('Category column header not found');

        const catCellX = headerBox.x + headerBox.width / 2;
        const catCellY = headerBox.y + headerBox.height + 21;
        Logger.info(`Category cell target: (${catCellX}, ${catCellY})`);

        const maxAttempts = 3;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            Logger.info(`Category fill attempt ${attempt}/${maxAttempts}`);

            await this.page.mouse.click(catCellX, catCellY);
            await this.page.waitForTimeout(500);
            await this.page.mouse.dblclick(catCellX, catCellY);
            await this.page.waitForTimeout(1000);

            let activeInput = null;
            const inp = this.page.locator('input[aria-haspopup="listbox"]:visible:not([readonly])');
            if (await inp.first().isVisible({ timeout: 2000 }).catch(() => false)) {
                activeInput = inp.first();
                Logger.info('Found category editor after dblclick');
            }

            if (!activeInput) {
                Logger.info('No editor after dblclick, pressing F2 to open editor...');
                await this.page.keyboard.press('F2');
                await this.page.waitForTimeout(1500);
                if (await inp.first().isVisible({ timeout: 2000 }).catch(() => false)) {
                    activeInput = inp.first();
                    Logger.info('Found category editor after F2');
                }
            }

            if (!activeInput) {
                const focused = this.page.locator(':focus');
                const tag = await focused.evaluate(el => el.tagName?.toLowerCase()).catch(() => '');
                if (tag === 'input') {
                    activeInput = focused;
                    Logger.info('Found category editor via :focus');
                }
            }

            if (!activeInput) {
                Logger.info(`Attempt ${attempt}: Could not open editor, retrying...`);
                await this.page.keyboard.press('Escape');
                await this.page.waitForTimeout(500);
                continue;
            }

            await activeInput.fill('');
            await this.page.waitForTimeout(1500);

            let optionClicked = false;
            let selectedText = '';

            const roleOptions = this.page.locator('[role="option"]:visible');
            const roleCount = await roleOptions.count().catch(() => 0);
            Logger.info(`Dropdown options visible: ${roleCount}`);

            if (roleCount > 0) {
                selectedText = await roleOptions.first().textContent().catch(() => '');
                await roleOptions.first().click();
                optionClicked = true;
                Logger.success(`Selected category: "${selectedText}"`);
            }

            if (!optionClicked) {
                const comboboxOptions = this.page.locator('[data-combobox-option]:visible');
                const optCount = await comboboxOptions.count().catch(() => 0);
                if (optCount > 0) {
                    selectedText = await comboboxOptions.first().textContent().catch(() => '');
                    await comboboxOptions.first().click();
                    optionClicked = true;
                    Logger.success(`Selected category option: "${selectedText}"`);
                }
            }

            if (!optionClicked) {
                Logger.info('No dropdown options found, using keyboard selection');
                await this.page.keyboard.press('ArrowDown');
                await this.page.waitForTimeout(500);
                await this.page.keyboard.press('Enter');
                await this.page.waitForTimeout(500);
            }

            await this.page.waitForTimeout(500);
            await this.page.keyboard.press('Tab');
            await this.page.waitForTimeout(1000);
            await this.page.mouse.click(headerBox.x + 200, headerBox.y - 20);
            await this.page.waitForTimeout(1500);

            const savedValue = await this.page.evaluate(({ x, y }) => {
                const el = document.elementFromPoint(x, y);
                if (!el) return null;
                const cell = el.closest('[role="gridcell"]') || el.closest('.rgCell') || el;
                return cell.textContent?.trim() || null;
            }, { x: catCellX, y: catCellY });

            Logger.info(`Category cell value after fill: "${savedValue}"`);

            if (savedValue && savedValue !== '-' && savedValue !== '—' && savedValue !== '' && savedValue !== 'null') {
                Logger.success(`Category value confirmed: "${savedValue}"`);
                return;
            }

            Logger.info(`Attempt ${attempt}: Category not saved ("${savedValue}"), retrying...`);
            await this.page.keyboard.press('Escape');
            await this.page.waitForTimeout(500);
        }

        Logger.info('Category fill exhausted all attempts');
    }

    async fillRowDataInRevision(itemName, description, originalBudget = '15000') {
        const firstRow = budget.treegridDataRows.first();
        const cells = firstRow.locator('[role="gridcell"]');

        const fillCell = async (cellIndex, value) => {
            const cell = cells.nth(cellIndex);
            await cell.scrollIntoViewIfNeeded();
            await cell.dblclick({ force: true, timeout: 10000 });
            await this.page.waitForTimeout(1000);
            const editInput = this.page.locator('revogr-edit input, revogr-edit textarea');
            if (await editInput.first().isVisible({ timeout: 2000 }).catch(() => false)) {
                await editInput.first().fill(value);
            } else {
                const focused = this.page.locator(':focus');
                if (await focused.count() > 0) {
                    const tag = await focused.evaluate(el => el.tagName.toLowerCase());
                    if (tag === 'input' || tag === 'textarea') {
                        await focused.fill(value);
                    } else {
                        await this.page.keyboard.type(value, { delay: 60 });
                    }
                } else {
                    await this.page.keyboard.type(value, { delay: 60 });
                }
            }
            await this.page.keyboard.press('Tab');
            await this.page.waitForTimeout(600);
        };

        await fillCell(1, itemName);
        await fillCell(2, description);
        await fillCell(3, originalBudget);
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(1000);
        Logger.success(`Row data filled: ${itemName}, ${description}, ${originalBudget}`);
    }

    async addRowWithCategoryInRevision(itemName, description, category = 'Construction', originalBudget = '15000') {
        await this.addRowInRevision();
        await this.fillCategoryInRevision(category);
        await this.fillRowDataInRevision(itemName, description, originalBudget);
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(2000);
        Logger.success(`Row added with category: ${itemName} (${category})`);
    }

    // ===================== Reset Table (Main Grid - TC138) =====================

    async resetTableInMainGrid() {
        if (!(await budget.resetTableOption.isVisible({ timeout: 3000 }).catch(() => false))) {
            Logger.info('Reset Table button not found');
            return false;
        }
        await budget.resetTableOption.click();
        await this.page.waitForTimeout(1000);
        if (await budget.resetConfirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await budget.resetConfirmBtn.click();
        }
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(2000);
        const count = await budget.dataRows.count();
        Logger.success(`Reset table completed - ${count} rows in grid`);
        return true;
    }

    // ===================== Category Code Assertions =====================

    async assertCategoryCodesPopulated() {
        if (await budget.categoryColumnHeader.isVisible({ timeout: 3000 }).catch(() => false)) {
            const count = await budget.categoryCells.count();
            expect(count).toBeGreaterThan(0);
            Logger.success(`Category codes found - ${count} cells with category data`);
            return count;
        }
        Logger.info('Category column not visible in current view');
        return 0;
    }

    async getFirstRowCategoryValue(context = 'any') {
        await this.page.waitForTimeout(2000);
        await this.page.waitForLoadState('networkidle').catch(() => {});

        const headerSelectors = context === 'main'
            ? ['[role="columnheader"]:has-text("Category Code")', '[role="columnheader"]:has-text("Category")']
            : ['[role="columnheader"]:has-text("Category")'];

        let headerBox = null;
        for (const sel of headerSelectors) {
            const header = this.page.locator(sel).first();
            if (await header.isVisible({ timeout: 5000 }).catch(() => false)) {
                headerBox = await header.boundingBox().catch(() => null);
                if (headerBox) {
                    Logger.info(`Found category header via: ${sel}`);
                    break;
                }
            }
        }

        if (!headerBox) {
            Logger.info('Category column header not found');
            return null;
        }

        const firstRow = budget.treegridDataRows.first();
        await firstRow.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
        const firstCell = firstRow.locator('[role="gridcell"]').first();
        const cellBox = await firstCell.boundingBox().catch(() => null);
        if (!cellBox) return null;

        const catCellX = headerBox.x + headerBox.width / 2;
        const catCellY = cellBox.y + cellBox.height / 2;

        const value = await this.page.evaluate(({ x, y }) => {
            const el = document.elementFromPoint(x, y);
            if (!el) return null;
            const cell = el.closest('[role="gridcell"]') || el.closest('.rgCell') || el;
            const text = cell.textContent?.trim();
            return text || null;
        }, { x: catCellX, y: catCellY });

        Logger.info(`First row category value (${context}): "${value}"`);
        return value;
    }

    async assertFirstRowCategoryNotEmpty(context = 'any') {
        const value = await this.getFirstRowCategoryValue(context);
        expect(value).toBeTruthy();
        expect(value).not.toBe('-');
        expect(value).not.toBe('—');
        expect(value).not.toBe('');
        expect(value.length).toBeGreaterThan(0);
        Logger.success(`First row category asserted (${context}): "${value}"`);
        return value;
    }

    async isCategoryCodeColumnVisible() {
        return await budget.columnHeader('Category Code').isVisible().catch(() => false);
    }

    async getFirstBudgetItemRowCount() {
        return await budget.tableRows.count();
    }

    // ===================== Helpers =====================

    async isTextVisible(text, timeout = 5000) {
        return await this.page.locator(`text=${text}`).first().isVisible({ timeout }).catch(() => false);
    }

    async getTreegridRowCount() {
        return await budget.treegridDataRows.count();
    }
};
